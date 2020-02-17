const UserProvider = require('../user-provider'),
    uuidv4 = require('uuid/v4')

function ensureId(model) {
    if (!model || model.id) return model
    //generate random 20-bytes identifier
    model.id = uuidv4()
}


class MemoryUserProvider extends UserProvider {

    constructor(storageProvider, repository) {
        super()
        this.repository = repository
    }

    _addUser(user) {
        const _user = {
            pubkey: user.pubkey,
            roles: user.roles || [],
            nonce: user.nonce || 0
        }
        ensureId(_user)
        this.repository.users.push(_user)
        return Promise.resolve()
    }

    getUserByPublicKey(pubkey) {
        const user = this.repository.users.find(x => x.pubkey === pubkey)
        return Promise.resolve(user)
    }

    getAllUsers() {
        return Promise.resolve(this.repository.users.slice(0))
    }

    getUserById(id) {
        const user = this.repository.users.find(x => x.id === id)
        return Promise.resolve(user)
    }

    updateNonce(id, nonce) {
        const user = this.getUserById(id)
        if (!user) return Promise.resolve(false)
        user.nonce = nonce
        return Promise.resolve(true)
    }

    deleteAllUsers() {
        this.repository.users = []
        return Promise.resolve()
    }

    _deleteUserById(id) {
        const pos = this.repository.users.indexOf(id)
        if (pos >= 0) {
            this.repository.users.splice(pos, 1)
        }
        return Promise.resolve()
    }
}

module.exports = MemoryUserProvider