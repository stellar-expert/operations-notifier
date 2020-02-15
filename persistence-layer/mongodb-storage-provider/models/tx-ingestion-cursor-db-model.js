const mongoose = require('mongoose'),
    Schema = mongoose.Schema


const txIngestionCursorSchema = new Schema({
    _id: {type: Number},
    lastIngestedTx: {type: String},
    updated: {type: Date, default: Date.now}
})

txIngestionCursorSchema.set('toJSON', { getters: true })

const TxIngestionCursor = mongoose.model('TxIngestionCursor', txIngestionCursorSchema)

module.exports = TxIngestionCursor
