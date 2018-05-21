const StorageProvider = require('../storage-provider'),
    crypto = require('crypto')

function ensureId(model) {
    if (!model || model.id) return model
    //generate random 20-bytes identifier
    model.id = crypto.randomBytes(20).toString('hex')
}

//memory storage
const repository = {
    users: [],
    subscriptions: [],
    notifications: [],
    lastIngestedTx: null
}

class MongoDBStorageProvider extends StorageProvider {
    constructor() {
        super()
    }

    fetchSubscriptions() {
        return Promise.resolve(repository.subscriptions.filter(s => s.status === 0))
    }

    fetchSubscription(id) {
        return Promise.resolve(repository.subscriptions.find(s => s.id === id))
    }

    fetchNextNotification(subscriptionId) {
        return Promise.resolve(repository.notifications.find(n => n.subscriptions.includes(subscriptionId)))
    }

    createNotifications(notifications) {
        let inserted = 0
        notifications.forEach(notification => {
            ensureId(notification)
            if (repository.notifications.some(exisiting => exisiting.id === notification.id)) return
            repository.notifications.push(notification)
            inserted++
        })
        return Promise.resolve(notifications)
    }

    removeNotification(notification) {
        let index = repository.notifications.indexOf(ensureId(notification))
        if (index >= 0) {
            repository.notifications.splice(index, 1)
        }
        return Promise.resolve(notification)
    }

    markAsProcessed(notification, subscription) {
        let pos = notification.subscriptions.indexOf(subscription.id)
        if (pos >= 0) {
            notification.subscriptions.splice(pos, 1)
        }
        return Promise.resolve(notification)
    }

    saveSubscription(subscription) {
        if (!repository.subscriptions.includes(subscription)) {
            repository.subscriptions.push(ensureId(subscription))
        }
        return Promise.resolve(subscription)
    }

    createDefaultAdminUser(adminAuthenticationToken) {
        let admin = repository.users.find(u => u.admin)
        if (!admin) {
            admin = {admin: true}
        }
        admin.authToken = adminAuthenticationToken

        return Promise.resolve(admin)
    }

    getUserByAuthToken(authToken) {
        let user = repository.users.find(u => u.authToken === authToken)
        return Promise.resolve(user)
    }

    updateLastIngestedTx(ingestedTxSequence) {
        repository.lastIngestedTx = ingestedTxSequence
        return Promise.resolve({lastIngestedTx: ingestedTxSequence})
    }

    getLastIngestedTx() {
        return Promise.resolve(repository.lastIngestedTx)
    }
}

module.exports = MongoDBStorageProvider