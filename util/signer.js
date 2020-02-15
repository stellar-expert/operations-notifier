const {Keypair} = require('stellar-base')

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

class Signer {
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
     * @param {String|Object} data - data to sign
     * @param {String} dataEncoding - data encoding. Default: utf8
     * @param {String} signatureEncoding - signature encoding. Default: hex
     * @returns {String}
     */
    sign(data, dataEncoding = 'utf8', signatureEncoding = 'hex') {
        if (!this.canSign)
            throw new Error('You can\'t sign data')
        return this.signingKeypair.sign(Buffer.from(processSigningData(data), dataEncoding)).toString(signatureEncoding)
    }

    /**
     * Verify the signature.
     * @param {String|Object} data - encoded message data
     * @param {String} signature - encoded message signature
     * @param {String} dataEncoding - message data encoding. Default: utf8
     * @param {String} signatureEncoding - signature encoding. Default: hex
     * @returns {boolean}
     */
    verify(data, signature, dataEncoding = 'utf8', signatureEncoding = 'hex') {
        const dataBuffer = Buffer.from(processSigningData(data), dataEncoding)
        const signatureBuffer = Buffer.from(signature, signatureEncoding)

        return this.signingKeypair.verify(dataBuffer, signatureBuffer)
    }
}

module.exports = Signer