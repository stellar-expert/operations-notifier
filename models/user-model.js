const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    errors = require('../util/errors'),
    generateToken = require('../util/auth-token-generator'),
    config = require('../server.config')

const userSchema = new Schema({
    email: {type: String, index: true},
    admin: {type: Boolean, index: true},
    authToken: {type: String, default: generateToken, index: true},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now}
})

userSchema.statics.serializationFilter = {
    'default': ['email']
}

const User = mongoose.model('User', userSchema)

//create a default admin user if it doesn't exists
User.findOne({admin: true})
    .then(admin => {
        if (admin) {
            if (config.adminAuthenticationToken && admin.authToken !== config.adminAuthenticationToken) {
                admin.authToken = config.adminAuthenticationToken
                return admin.save()
            }
            return admin
        }
        return new User({admin: true, authToken: config.adminAuthenticationToken || generateToken()}).save()
    })
    .then(admin => console.log('Administrator authentication token: ' + admin.authToken))
    .catch(e => errors.handleSystemError(e))

module.exports = User