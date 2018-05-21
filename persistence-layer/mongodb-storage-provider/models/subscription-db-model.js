const mongoose = require('mongoose'),
    Schema = mongoose.Schema

const subscriptionSchema = new Schema({
    user: {type: Schema.Types.ObjectId, indexed: true},
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
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
    expires: {type: Date}
})

subscriptionSchema.index({ //compound asset index
    asset_type: 1,
    asset_code: 1,
    asset_issuer: 1
})

const Subscription = mongoose.model('Subscription', subscriptionSchema)

module.exports = Subscription