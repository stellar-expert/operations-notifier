const Model = require('./base-model')

class User extends Model {
    email
    admin
    authToken
    created
    updated

    toJSON() {
        return {email: this.email}
    }
}

module.exports = User