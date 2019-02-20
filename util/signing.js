const {Keypair} = require('stellar-base'),
    config = require('../models/config')

const signingKeypair = Keypair.fromSecret(config.signatureSecret)

function processSigningData(dataToSign) {
    if (!dataToSign) throw new TypeError('Invalid data')
    if (typeof dataToSign === 'object') dataToSign = JSON.stringify(dataToSign)
    if (typeof dataToSign !== 'string') throw new TypeError('Invalid data. Expected string or plain object.')
    return dataToSign
}

module.exports = {
    /**
     * Get signing public key.
     * @returns {string}
     */
    getPublicKey: function () {
        return signingKeypair.publicKey()
    },
    /**
     * Sign the data with a secret key.
     * @param {String|Object} data - data to sign
     * @returns {String}
     */
    sign: function (data) {
        return signingKeypair.sign(Buffer.from(processSigningData(data), 'utf8')).toString('base64')
    },
    /**
     * Verify the signature.
     * @param {String|Object} data - message data
     * @param {String} signature - message signature in HEX format
     * @returns {boolean}
     */
    verify: function (data, signature) {
        if (typeof signature !== 'string' || signature.length !== 88) throw new TypeError('Invalid signature.')

        return signingKeypair.verify(Buffer.from(processSigningData(data), 'utf8'), Buffer.from(signature, 'base64'))
    }
}