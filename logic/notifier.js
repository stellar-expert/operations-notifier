const axios = require('axios'),
    config = require('../models/config'),
    serverSigner = require('../util/server-signer'),
    pkgInfo = require('../package'),
    storage = require('./storage')

/**
 * Remove item from cache
 * @param cache - array with items
 * @param item - item to evict
 * @returns {object} cache instance
 */
function evict(cache, item) {
    if (cache instanceof Array) {
        let pos = cache.indexOf(item)
        if (pos >= 0) {
            cache.splice(pos, 1)
        }
    }
    if (cache instanceof Set) {
        cache.delete(item)
    }
    return item
}

class Notifier {
    constructor(observer) {
        this.observer = observer
        this.inProgress = new Set()
    }

    startNewNotifierThread() {
        if (!this.observer.observing) return
        let subscriptionToProcess = this.getSubscriptionToProcess()
        if (!subscriptionToProcess) return
        setImmediate(() => {
            this.runSubscriptionNotifierThread(subscriptionToProcess)
            this.startNewNotifierThread()
        })
    }

    getSubscriptionToProcess() {
        if (Math.min(this.observer.subscriptions.length, config.notificationConcurrency) <= this.inProgress.size) return null
        const now = new Date(),
            subscriptionsToProcess = this.observer.subscriptions.filter(s =>
                !s.processed && //ignore processed subscriptions
                !this.inProgress.has(s.id) && //ignore subscriptions being processed right now
                (!s.ignoreUntil || s.ignoreUntil < now)) //ignore subscriptions with failures (paused)
        if (!subscriptionsToProcess.length) return null
        //choose one randomly
        let index = Math.floor(Math.random() * subscriptionsToProcess.length)
        return subscriptionsToProcess[index]
    }

    runSubscriptionNotifierThread(subscription) {
        if (this.inProgress.has(subscription.id)) return //the subscription is being processed right now
        //each subscription can be processed by a single notification thread at a time
        this.inProgress.add(subscription.id)

        return this.getNextNotification(subscription)
            .then(notification => {
                if (!notification) {
                    subscription.processed = true //no more notifications available, set "processed" flag
                    this.inProgress.delete(subscription.id)
                    return Promise.resolve()
                }
                return this.sendNotification(notification, subscription)
                    .then(() => {
                        this.inProgress.delete(subscription.id)
                        setImmediate(() => this.startNewNotifierThread())
                    })
            })
    }

    getNextNotification(subscription) {
        //try to get a notification from cache
        if (subscription.notifications && subscription.notifications.size) {
            return Promise.resolve(subscription.notifications.values().next().value)
        }
        //cache miss - load next notification from db
        return storage.fetchNextNotification(subscription.id)
    }

    createNotifications(notifications) {
        //TODO: check method performance under maximum load
        //notificationsCache.add(notification)
        if (!notifications.length) return Promise.resolve()

        return storage.createNotifications(notifications)
    }

    markAsProcessed(notification, subscription) {
        evict(notification.subscriptions, subscription.id)
        return storage.markAsProcessed(notification, subscription)
            .then(() => {
                //evict notification from local cache
                evict(subscription.notifications, notification)

                subscription.delivery_failures = 0
                subscription.sent++
                subscription.ignoreUntil = undefined
                console.log(`POST to ${subscription.reaction_url}. Notification: ${notification.id}.`)
            })
    }

    handleProcessingError(err, notification, subscription) {
        let retries = ++subscription.delivery_failures,
            pause = retries * retries * retries

        subscription.ignoreUntil = new Date(new Date().getTime() + pause * 1000 + Math.floor(Math.random() * 100))
        if (err.config) { //error handled by axios
            if (err.response) {
                console.error(`POST to ${err.config.url} failed with status ${err.response.status}. Retry in ${pause} seconds. Notification ${notification.id}.`)
            } else if (err.code === 'ECONNABORTED') {
                console.error(`POST to ${err.config.url} failed. Timeout exceeded. Retry in ${pause} seconds. Notification ${notification.id}.`)
            } else if (err.code === 'ECONNREFUSED') {
                console.error(`POST to ${err.config.url} failed. Host refused to connect. Retry in ${pause} seconds. Notification ${notification.id}.`)
            } else {
                console.error(`POST to ${err.config.url} failed. Host is unreachable. Retry in ${pause} seconds. Notification ${notification.id}.`)
            }
        }
        else {
            console.error(err)
        }
        setTimeout(() => this.startNewNotifierThread(), pause * 1000 + 10) //schedule a retry
    }

    sendNotification(notification, subscription) {
        //unwrap transaction details
        const payload = {...notification.payload},
            transaction = payload.transaction_details
        delete payload.transaction_details

        //prepare data
        const data = {
            id: notification.id,
            subscription: notification.subscription,
            type: 'operation',
            created: notification.created,
            sent: new Date(),
            operation: payload,
            transaction
        }

        return axios({
            url: subscription.reaction_url,
            method: 'POST',
            data,
            timeout: config.reactionResponseTimeout * 1000,
            headers: {
                'User-Agent': 'StellarNotifier/' + pkgInfo.version,
                'Content-Type': 'application/json',
                'X-Requested-With': `StellarNotifier/${pkgInfo.version} (+${pkgInfo.homepage})`,
                'X-Request-ED25519-Signature': serverSigner.sign(data, 'utf8', 'base64'),
                'X-Subscription': subscription.id
            }
        })
        //TODO: verify the response to prevent third-party resources spoofing
            .then(() => this.markAsProcessed(notification, subscription))
            .catch(err => this.handleProcessingError(err, notification, subscription))
            .then(() => {
                subscription.updated = new Date()
                return storage.saveSubscription(subscription)
            })
            .catch(err => {
                console.error(`Failed to update subscription ${subscription.id}`)
                console.error(err)
            })
    }
}

module.exports = Notifier