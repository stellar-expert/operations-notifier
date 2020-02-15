const mongoose = require('mongoose'),
    Schema = mongoose.Schema

const subscriptionSchema = new Schema({
    pubkey: {type: String, indexed: true},
    status: {type: Number, indexed: true, default: 0},
    account: {type: String},
    asset_type: {type: Number},
    asset_code: {type: String},
    asset_issuer: {type: String},
    memo: {type: String, index: true},
    operation_types: {type: [Number], index: true},
    reaction_url: {type: String},
    delivery_failures: {type: Number, default: 0},
    sent: {type: Number, default: 0},
    expires: {type: Date}
},
{
    timestamps: {createdAt: 'created', updatedAt: 'updated'}
})

subscriptionSchema.index({ //compound asset index
    asset_type: 1,
    asset_code: 1,
    asset_issuer: 1
})

subscriptionSchema.set('toJSON', { getters: true })

const Subscription = mongoose.model('Subscription', subscriptionSchema)

module.exports = Subscription