const mongoose = require('mongoose'),
    Schema = mongoose.Schema

const notificationSchema = new Schema({
    payload: {type: Schema.Types.Mixed},
    subscriptions: {type: [Schema.Types.ObjectId]}, //corresponding subscriptions
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now}
})

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification