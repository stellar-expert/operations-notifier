const crypto = require('crypto')

const tokenLength = 64

module.exports = function generateAuthToken() {
    return crypto.randomBytes(Math.ceil(tokenLength / 2)).toString('hex')
}