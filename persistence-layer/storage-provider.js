function notImplemented() {
    throw new TypeError('Method not implemented.')
}

class StorageProvider {
    constructor() {
        if (this.constructor === StorageProvider) throw new TypeError('Cannot create an instance of abstract StorageProvider class.')
    }

    init(config) {
        notImplemented()
    }

    fetchSubscriptions() {
        notImplemented()
    }

    fetchSubscription(id) {
        notImplemented()
    }

    fetchNextNotification(subscriptionId) {
        notImplemented()
    }

    createNotifications(notifications) {
        notImplemented()
    }

    removeNotification(notification) {
        notImplemented()
    }

    removeAllSubscriptions() {
        notImplemented()
    }

    markAsProcessed(notification, subscription) {
        notImplemented()
    }

    /**
     * Retrieve last ingested tx sequence.
     * @returns {Promise<string>}
     */
    getLastIngestedTx() {
        notImplemented()
    }

    /**
     * Persists last processed tx sequence to DB.
     * @param {string} ingestedTxSequence - last processed tx sequence
     * @returns {Promise<string>}
     */
    updateLastIngestedTx(ingestedTxSequence) {
        notImplemented()
    }

    /**
     * Persist subscription to the database
     * @param subscription
     */
    saveSubscription(subscription) {
        notImplemented()
    }

    /**
     * @returns {UserProvider}
     */
    get userProvider() {
        notImplemented()
    }

    /**
     * Method to stop the storage provider
     */

    finalize() {
        notImplemented()
    }
}

module.exports = StorageProvider