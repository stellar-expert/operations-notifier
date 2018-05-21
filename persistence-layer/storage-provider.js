function notImplemented() {
    throw new TypeError('Method not implemented.')
}

class StorageProvider {
    constructor() {
        if (this.constructor === StorageProvider) throw new TypeError('Cannot create an instance of abstract StorageProvider class.')
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

    markAsProcessed(notification, subscription) {
        notImplemented()
    }

    /**
     * Create a default admin user if it doesn't exist
     * @param {string} adminAuthenticationToken - last processed tx sequence
     * @returns {Promise<User>}
     */
    createDefaultAdminUser(adminAuthenticationToken) {
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

    getUserByAuthToken(authToken) {
        notImplemented()
    }
}

module.exports = StorageProvider