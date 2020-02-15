const mongoose = require('mongoose'),
    Schema = mongoose.Schema

const notificationSchema = new Schema({
    payload: {type: Schema.Types.Mixed},
    subscriptions: {type: [Schema.Types.ObjectId]} //corresponding subscriptions
},
{
    timestamps: {createdAt: 'created', updatedAt: 'updated'}
})

notificationSchema.set('toJSON', { getters: true })

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification