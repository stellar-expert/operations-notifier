const axios = require('axios'),
    mongoose = require('mongoose'),
    Notification = mongoose.model('Notification'),
    config = require('../server.config'),
    {networkName, networkPassphrase} = require('../logic/stellar-connector'),
    {sign} = require('../util/signing'),
    pkgInfo = require('../package')

//TODO: finish recent notifications cache implementation
/*class NotificationsGroup {
    constructor(subscription){
        this.subscription = subscription.id.toString()
        this.notifications = new Map()
    }

    add(notification){
        notifications
    }
}

const notificationsCache = {
    allNotificationsMap: new Map(),
    subscriptionsMap: new Map(),
    maxSize: config.maxNotificationsCacheSize || 1000,
    get(key) {
        //try to get the notification from cache
        let notification = this.allNotificationsMap.get(key)
        if (notification) return Promise.resolve(notification)
        //cache miss - load from DB
        return Notification.findById(key)
    },
    getSubscriptionsGroup(){

    },
    add(notification) {
        if (!notification) return
        if (this.allNotificationsMap.size >= this.maxSize) {
            this.evict()
        }
        this.allNotificationsMap.set(notification.id, notification)
    },
    remove(notification) {
        if (!notification) return
        this.allNotificationsMap.delete(typeof notification === 'string' ? notification : notification.id)
    },
    evict() {
        //evict the oldest cache entry
        const record = this.allNotificationsMap.entries().next().value
        if (record) {
            this.allNotificationsMap.delete(record[0])
        }
    }
}*/
class Notifier {
    constructor(observer) {
        this.observer = observer
        this.inProgress = new Map()
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
        if (this.inProgress.has(subscription.id)) return
        this.inProgress.set(subscription.id, subscription)
        //load notifications for subscription
        return Notification.findOne({subscription: subscription.id})
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

    createNotifications(notifications) {
        //TODO: check method performance under maximum load
//notificationsCache.add(notification)
        if (!notifications.length) return Promise.resolve()

        return Notification.insertMany(notifications, {ordered: false})
            .then(() => {
                this.startNewNotifierThread()
                return notifications.length //return inserted notifications count
            })
            .catch(err => {
                //TODO: test duplicate primary key handling
                //if the error thrown is a BulkWriteError with error codes 11000, than it's ok
                //https://docs.mongodb.com/manual/reference/method/db.collection.insertMany/#unordered-inserts
                console.error(err)
                this.startNewNotifierThread()
                if (err.code === 11000) {
                    return err.result.nInserted //return inserted notifications count
                }
                return 0
            })

    }

    sendNotification(notification, subscription) {
        const data = {
            id: notification.id,
            subscription: notification.subscription.toString(),
            network: {
                name: networkName,
                networkPassphrase
            },
            type: 'operation',
            created: notification.created,
            sent: new Date(),
            operation: notification.payload
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
                'X-Request-ED25519-Signature': sign(data),
                'X-Subscription': subscription.id.toString()
            }
        })
            .then((response) => {
                return notification.remove()
                    .then(() => {
                        subscription.delivery_failures = 0
                        subscription.sent++
                        subscription.ignoreUntil = undefined
                        console.log(`POST to ${subscription.reaction_url}. Notification: ${notification.id}.`)
                    })
            })
            .catch((err) => {
                let retries = ++subscription.delivery_failures,
                    pause = retries * retries * retries

                subscription.ignoreUntil = new Date(new Date().getTime() + pause * 1000)
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
            })
            .then(() => {
                subscription.updated = new Date()
                subscription.save()
            })
    }
}

module.exports = Notifier