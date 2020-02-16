const {parseAsset, assetsEqual} = require('./asset-helper')

/**
 * Check if an operation matches the subscription filtering conditions.
 * @param {Object} subscription - subscription
 * @param {Object} operation - operation to test
 * @returns {Boolean}
 */
function matches(subscription, operation) {
    if (subscription.memo && operation.memo != subscription.memo) return false //intended type casting
    if (subscription.operation_types && subscription.operation_types.length && !subscription.operation_types.includes(operation.type_i)) return false
    if (subscription.account && operation.account !== subscription.account && operation.destination !== subscription.account) return false
    if (subscription.asset_type) {
        const assetToFilter = parseAsset(this)
        return assetsEqual(assetToFilter, parseAsset(operation)) || assetsEqual(assetToFilter, parseAsset(operation, 'counter_'))
    }
    return true
}

module.exports = {matches}