const mongoose = require('mongoose'),
    Schema = mongoose.Schema

const notificationSchema = new Schema({
    _id: {type: String},
    subscription: {type: Schema.Types.ObjectId, indexed: true}, //corresponding subscription
    payload: {type: Schema.Types.Mixed},

    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now}
})

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification