const UserProvider = require('../user-provider')
    User = require('./models/user-db-model')


class MongoUserProvider extends UserProvider {

    constructor() {
        super()
    }

    _addUser(user) {
        return User.create({
            pubkey: user.pubkey, 
            roles: user.roles || [], 
            nonce: 0
        })
    }

    getUserByPublicKey(pubkey) {
        return User.findOne({pubkey: pubkey})
            .then(user => {
                return user
            })
    }

    getAllUsers() {
        return User.find()
            .then(users => {
                return users.map(x => {
                    return x
                })
            })
    }

    getUserById(id) {
        return User.findOne({_id: id})
            .then(user => {
                return user
            })
    }

    updateNonce(id, nonce) {
        return User.updateOne({_id: id}, {$set: {nonce: nonce}})
            .then(res => res.ok === 1 && res.nModified === 1)
    }

    deleteAllUsers() {
        return User.deleteMany({})
    }

    _deleteUserById(id) {
        return User.deleteOne({_id: id})
    }
}

module.exports = MongoUserProvider