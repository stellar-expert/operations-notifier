const {StrKey} = require('stellar-sdk')

/**
 * Parse asset from an arbitrary object.
 * @param {Object} src - object to parse asset from
 * @param {string} prefix - key prefix
 * @returns {Object}
 */
function parseAsset(src, prefix = '') {
    if (!src) return null
    const res = {};

    ['asset_type', 'asset_code', 'asset_issuer'].forEach(key => {
        res[key] = src[prefix + key]
    })

    res.asset_type = normalizeAssetType(res.asset_code)

    if (res.asset_code === 'XLM' && !res.asset_issuer) {
        res.asset_type = 0
        res.asset_code = undefined
    }

    if (typeof res.asset_type !== 'number') {
        res.asset_type = 0
        res.asset_code = undefined
        res.asset_issuer = undefined
    }

    //strip undefined props
    Object.keys(res).forEach(key => res[key] === undefined && delete res[key])

    if (!isValidAsset(res)) return null

    return res
}

/**
 * Check the asset validity
 * @param {Object} asset - an asset to validate
 * @returns {boolean}
 */
function isValidAsset(asset) {
    if (asset.asset_type === 0 && !asset.asset_code && !asset.asset_issuer) return true
    if (!StrKey.isValidEd25519PublicKey(asset.asset_issuer)) return false
    if (!asset.asset_code) return false
    if (!/^[a-zA-Z0-9]{1,12}$/.test(asset.asset_code)) return false
    if (normalizeAssetType(asset.asset_code) !== asset.asset_type) return false
    return true
}

/**
 * Check if two assets are same
 * @param {Object} asset1
 * @param {Object} asset2
 * @returns {boolean}
 */
function assetsEqual(asset1, asset2) {
    if (!asset1 || !asset2 || !isValidAsset(asset1) || !isValidAsset(asset2)) return false
    if (asset1.type !== asset2.type) return false
    return asset1.code === asset2.code && asset1.issuer === asset2.issuer
}

/**
 * Unifies asset type
 * @param code
 * @returns {number}
 */
function normalizeAssetType(code) {
    if (!code) return 0 //native asset
    return code.length > 4 ? 2 : 1
}

/**
 * Native asset descriptor
 * @returns {Object}
 */
function nativeAsset() {
    return {asset_type: 0}
}

module.exports = {
    parseAsset,
    isValidAsset,
    normalizeAssetType,
    nativeAsset,
    assetsEqual
}