const Model = require('./base-model')

class User extends Model {
    pubkey
    roles
    created
    updated

    toJSON() {
        return {pubkey: this.pubkey}
    }
}

module.exports = User