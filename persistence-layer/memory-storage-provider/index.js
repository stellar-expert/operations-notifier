const StorageProvider = require('../storage-provider'),
    MemoryUserProvider = require('./user-memory-provider'),
    uuidv4 = require('uuid/v4')

function ensureId(model) {
    if (!model || model.id) return model
    //generate random 20-bytes identifier
    model.id = uuidv4()
}

//memory storage
const repository = {
    subscriptions: [],
    notifications: [],
    users: [],
    lastIngestedTx: null
}

class MemoryStorageProvider extends StorageProvider {
    constructor() {
        super()
    }

    init(config) {
        return Promise.resolve()
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
        ensureId(notification)
        const index = repository.notifications.indexOf(notification)
        if (index >= 0) {
            repository.notifications.splice(index, 1)
        }
        return Promise.resolve(notification)
    }

    markAsProcessed(notification, subscription) {
        const pos = notification.subscriptions.indexOf(subscription.id)
        if (pos >= 0) {
            notification.subscriptions.splice(pos, 1)
        }
        return Promise.resolve(notification)
    }

    saveSubscription(subscription) {
        if (!repository.subscriptions.includes(subscription)) {
            ensureId(subscription)
            repository.subscriptions.push(subscription)
        }
        return Promise.resolve(subscription)
    }

    removeAllSubscriptions() {
        repository.subscriptions = []
        repository.notifications = []
        return Promise.resolve()
    }

    updateLastIngestedTx(ingestedTxSequence) {
        repository.lastIngestedTx = ingestedTxSequence
        return Promise.resolve({lastIngestedTx: ingestedTxSequence})
    }

    getLastIngestedTx() {
        return Promise.resolve(repository.lastIngestedTx)
    }

    get userProvider() {
        return new MemoryUserProvider(this, repository)
    }

    finalize(){
        return Promise.resolve()
    }
}

module.exports = MemoryStorageProvider