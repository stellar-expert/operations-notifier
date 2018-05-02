const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    {parseAsset, assetsEqual} = require('../util/asset-helper'),
    errors = require('../util/errors'),
    {StrKey} = require('stellar-base')

const subscriptionSchema = new Schema({
    user: {type: Schema.Types.ObjectId, indexed: true}, //who created the subscription
    status: {type: Number, indexed: true, default: 0}, //0 - active, 1- deleted, 2-expired
    account: {type: String}, //account to track
    asset_type: {type: Number}, //asset type to track (0-native, 1-alphanum4, 2-alphanum12)
    asset_code: {type: String}, //asset code to track
    asset_issuer: {type: String}, //asset issuer to track
    memo: {type: String, index: true}, //tx memo to track
    operation_types: {type: [Number], index: true}, //operation types to track
    reaction_url: {type: String},
    delivery_failures: {type: Number, default: 0},
    sent: {type: Number, default: 0},
    created: {type: Date, default: Date.now}, //notification created timestamp
    updated: {type: Date, default: Date.now}, //last updated timestamp
    expires: {type: Date} //subscriptions should be inactive after the expiration date
})

subscriptionSchema.index({ //compound asset index
    asset_type: 1,
    asset_code: 1,
    asset_issuer: 1
})

/**
 * Check if an operation matches the subscription filtering conditions.
 * @param {Object} operation - operation to test
 * @returns {Boolean}
 */
subscriptionSchema.methods.matches = function (operation) {
    if (this.memo && operation.memo != this.memo) return false //intended type casting
    if (this.operation_types && this.operation_types.length && this.operation_types.indexOf(operation.type_i) < 0) return false
    if (this.account && operation.account !== this.account && operation.destination !== this.account) return false
    if (this.asset_type) {
        const assetToFilter = parseAsset(this)
        return assetsEqual(assetToFilter, parseAsset(operation)) || assetsEqual(assetToFilter, parseAsset(operation, 'counter_'))
    }
    return true
}

/**
 * Create a subscription from request.
 * @param {Object} subscriptionParams - subscriptions params
 * @param {User} user - subscription owner
 * @returns {Promise<Subscription>}
 */
subscriptionSchema.statics.create = function (subscriptionParams, user) {
    if (!subscriptionParams)
        return Promise.reject(errors.badRequest('Subscription params were not provided.'))

    let subscription = new Subscription({user: user.id}),
        isValid = false

    if (!subscriptionParams.reaction_url) {
        return Promise.reject(errors.validationError('reaction_url', 'Reaction URL is required.'))
    }
    if (!/^(?:http(s)?:\/\/)[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(subscriptionParams.reaction_url)){
        return Promise.reject(errors.validationError('reaction_url', 'Reaction URL is required.'))
    }

    subscription.reaction_url = subscriptionParams.reaction_url

    if (subscriptionParams.account) {
        if (!StrKey.isValidEd25519PublicKey(subscriptionParams.account))
            return Promise.reject(errors.validationError('account', 'Invalid Stellar account address.'))

        subscription.account = subscriptionParams.account
        isValid = true
    }

    if (subscriptionParams.memo) {
        if (typeof subscriptionParams.memo === 'string' && subscriptionParams.memo.length > 64)
            return Promise.reject(errors.validationError('memo', 'Invalid memo format. String is too long.'))

        subscription.memo = '' + subscriptionParams.memo
        isValid = true
    }

    if (subscriptionParams.operation_types) {
        let optypes = subscriptionParams.operation_types
        if (!(optypes instanceof Array)) {
            optypes = ('' + optypes).split(',')
        }
        if (optypes.length > 0) {
            optypes = optypes.map(v => parseInt(v))
            if (optypes.some(v => isNaN(v) || v < 0 || v > 10))
                return Promise.reject(errors.validationError('operation_types', 'Invalid operation type specified. Parameter operation_types should be an array of integers matching existing operation types (value between 0 and 10).'))

            subscription.operation_types = optypes
            isValid = true
        }
    }

    if (subscriptionParams.asset_code) {
        let assetProps = parseAsset(subscriptionParams)
        if (!assetProps)
            return Promise.reject(errors.validationError('asset', 'Invalid asset format. Check https://www.stellar.org/developers/guides/concepts/assets.html#anchors-issuing-assets.'))

        Object.assign(subscription, assetProps)
        isValid = true
    }

    if (!isValid) return Promise.reject(errors.badRequest('No operation filter params were provided.'))

    if (subscriptionParams.expires) {
        let rawDate = subscriptionParams.expires
        if (typeof rawDate === 'number' || typeof rawDate === 'string' && /^\d{1,13}$/.test(rawDate)) {
            rawDate = parseInt(rawDate)
        }
        let expirationDate = new Date(rawDate)
        if (isNaN(expirationDate.getTime()))
            return Promise.reject(errors.validationError('expires', 'Invalid expiration date format.'))
        if (expirationDate < new Date())
            return Promise.reject(errors.validationError('expires', 'Expiration date cannot be less than current date.'))

        subscription.expires = expirationDate
    }

    return subscription.save()
}

const Subscription = mongoose.model('Subscription', subscriptionSchema)

module.exports = Subscription