const signer = require('./signer'),
    config = require('../models/config')

module.exports = new signer(config.signatureSecret)