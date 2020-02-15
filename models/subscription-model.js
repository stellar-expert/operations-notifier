const Model = require('./base-model')

const SUBSCRIPTION_STATUS = {
    ACTIVE: 1,
    DELETED: 2,
    EXPIRED: 3
}

class SubscriptionModel extends Model {
    /**
     * Who created the subscription
     */
    pubkey
    /**
     * Subscription status (0 - active, 1- deleted, 2-expired)
     */
    status = 0
    /**
     * Account to track
     */
    account
    /**
     * Asset type to track (0-native, 1-alphanum4, 2-alphanum12)
     */
    asset_type
    /**
     * Asset code to track
     */
    asset_code
    /**
     * Asset issuer to track
     */
    asset_issuer
    /**
     * Tx memo to track
     */
    memo
    /**
     * Operation types to track
     */
    operation_types
    /**
     * Reaction URL
     */
    reaction_url
    /**
     * Delivery failures counter. Set to 0 on successful delivery
     */
    delivery_failures = 0
    /**
     * Notifications sent
     */
    sent = 0
    /**
     * Subscription become inactive after the expiration date (not implemented)
     */
    expires
    /**
     * Created date
     */
    created
    /**
     * Last updated date
     */
    updated
    /**
     * Cached notifications, associated with the subscription
     */
    notifications
}

module.exports = SubscriptionModel