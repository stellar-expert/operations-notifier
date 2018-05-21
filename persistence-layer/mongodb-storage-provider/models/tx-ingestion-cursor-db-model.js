const mongoose = require('mongoose'),
    Schema = mongoose.Schema


const txIngestionCursorSchema = new Schema({
    _id: {type: Number},
    lastIngestedTx: {type: String},
    updated: {type: Date, default: Date.now}
})

const TxIngestionCursor = mongoose.model('TxIngestionCursor', txIngestionCursorSchema)

module.exports = TxIngestionCursor
