const mongoose = require('mongoose'),
    Schema = mongoose.Schema

const userSchema = new Schema({
    pubkey: {type: String, index: true, unique: true},
    roles: {type: [String]},
    nonce: {type: Number}
},
{
    timestamps: {createdAt: 'created', updatedAt: 'updated'}
})

userSchema.set('toJSON', { getters: true })

const User = mongoose.model('User', userSchema)

module.exports = User