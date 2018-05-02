const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    BigNumber = require('bignumber.js')

let lastIngested

const txIngestionCursorSchema = new Schema({
    _id: {type: Number},
    lastIngestedTx: {type: String},
    updated: {type: Date, default: Date.now}
})

/**
 * Persists last processed tx sequence to DB.
 * @param {string} ingestedTxSequence - last processed tx sequence
 * @returns {Promise<string>}
 */
txIngestionCursorSchema.statics.updateLastIngestedTx = function (ingestedTxSequence) {
    if (new BigNumber(ingestedTxSequence || '0').comparedTo(new BigNumber(lastIngested || '0')) === -1) return Promise.resolve(lastIngested)

    return TxIngestionCursor.update(
        {
            _id: 0
        },
        {
            lastIngestedTx: ingestedTxSequence,
            updated: new Date()
        },
        {
            upsert: true
        })
        .then(() => {
            lastIngested = ingestedTxSequence
            return lastIngested
        })
}

/**
 * Retrieve last ingested tx sequence.
 * @returns {Promise<string>}
 */
txIngestionCursorSchema.statics.getLastIngestedTx = function () {
    if (lastIngested === undefined) return Promise.resolve(lastIngested)
    return TxIngestionCursor.findOne()
        .then(pointer => {
            if (pointer) {
                lastIngested = pointer.lastIngestedTx
            } else { //first run - pointer not found
                lastIngested = null
            }
            return lastIngested
        })
}

const TxIngestionCursor = mongoose.model('TxIngestionCursor', txIngestionCursorSchema)

module.exports = TxIngestionCursor
