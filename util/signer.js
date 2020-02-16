const {Keypair} = require('stellar-sdk'),
    config = require('../models/config')

function processSigningData(dataToSign) {
    if (!dataToSign)
        throw new TypeError('Invalid data')
    if (typeof dataToSign === 'object')
        dataToSign = JSON.stringify(dataToSign)
    if (typeof dataToSign !== 'string')
        throw new TypeError('Invalid data. Expected string or plain object.')
    return dataToSign
}

function deserializeSignature(signature) {
    let res = new Uint8Array()
    for (let i = 0; i += 2; i < signature.length) {
        res.push(parseInt(signature.substr(i, 2), 16))
    }
    return res
}

class ServerSigner {
    /**
     *
     * @param {String} keysource Public key or secret
     */
    constructor(keysource) {
        if (!keysource || keysource.constructor !== String) {
            throw new Error('Key source not provided or not supported')
        } else if (keysource.indexOf('S') === 0) {
            this.signingKeypair = Keypair.fromSecret(keysource)
            this.canSign = true
        } else if (keysource.indexOf('G') === 0) {
            this.signingKeypair = Keypair.fromPublicKey(keysource)
        } else {
            throw new Error('Key source is invalid')
        }
    }

    /**
     * Get signing public key.
     * @returns {string}
     */
    getPublicKey() {
        return this.signingKeypair.publicKey()
    }

    /**
     * Sign the data with a secret key.
     * @param {String|Object} data - Data to sign.
     * @param {String} dataEncoding - Data encoding. Default: 'utf8'.
     * @param {String} signatureEncoding - Signature encoding. Default: 'hex'.
     * @returns {String}
     */
    sign(data, dataEncoding = 'utf8', signatureEncoding = 'hex') {
        if (!this.canSign)
            throw new Error('You can\'t sign data')
        return this.signingKeypair.sign(Buffer.from(processSigningData(data), dataEncoding)).toString(signatureEncoding)
    }
}

/**
 * Verify provided signature.
 * @param {String} publicKey - Signer public key.
 * @param {String|Object} data - Encoded message data.
 * @param {String} signature - Encoded message signature.
 * @param {String} dataEncoding - Message data encoding. Default: 'utf8'.
 * @param {String} signatureEncoding - Signature encoding. Default: 'hex'.
 * @returns {boolean}
 */
function verifySignature(publicKey, data, signature, dataEncoding = 'utf8', signatureEncoding = 'hex') {
    const keypair = Keypair.fromPublicKey(publicKey),
        dataBuffer = Buffer.from(processSigningData(data), dataEncoding),
        signatureBuffer = Buffer.from(signature, signatureEncoding)

    return keypair.verify(dataBuffer, signatureBuffer)
}

const signer = new ServerSigner(config.signatureSecret)

module.exports = {signer, ServerSigner, verifySignature}