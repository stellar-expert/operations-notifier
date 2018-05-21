const mongoose = require('mongoose'),
    Schema = mongoose.Schema

const userSchema = new Schema({
    email: {type: String, index: true},
    admin: {type: Boolean, index: true},
    authToken: {type: String, index: true},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now}
})

const User = mongoose.model('User', userSchema)

module.exports = User