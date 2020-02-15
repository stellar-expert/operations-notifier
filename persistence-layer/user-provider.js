function notImplemented() {
    throw new TypeError('Method not implemented.')
}

class UserProvider {

    constructor() {
        if (this.constructor === UserProvider) throw new TypeError('Cannot create an instance of abstract UserProvider class.')
    }

    /**
     * @param {Object} user User object
     * @param {String} user.pubkey User public key
     * @param {[String]} user.roles User roles
     */
    addUser(user) {
        try {
            if (!user.pubkey || user.pubkey.constructor !== String) {
                throw new Error('User public key is invalid')
            }
            return this.getUserByPublicKey(user.pubkey)
                .then(u => {
                    if (u)
                        return Promise.reject('User with specified public key already exists')
                    return this._addUser(user)
                })
        } catch (e) {
            return Promise.reject(e)
        }
    }

    /**
     * 
     * @param {String} pubkey User public key 
     * @returns {Object} User or null if not found
     */
    getUserByPublicKey(pubkey) { //TODO: make user cache
        notImplemented()
    }

    /**
     * @returns {[Object]} Array of users
     */
    getAllUsers() { //TODO: add filtering and pagination
        notImplemented()
    }

    /**
     * 
     * @param {String} id User id 
     * @returns {Object} User or null if not found
     */
    getUserById(id) {
        notImplemented()
    }

    /**
     * 
     * @param {String} id User id
     */
    deleteUserById(id) {
        return this.getUserById(id)
            .then(u => {
                if (!u)
                    return Promise.reject('User with specified id doesn\'t exist')
                return this._deleteUserById(id)
            })
    }

    /**
     * 
     * @param {String} id User public key 
     */
    deleteUserByPubkey(pubkey) {
        return this.getUserByPublicKey(pubkey)
            .then(u => {
                if (!u)
                    return Promise.reject('User with specified id doesn\'t exist')
                return this._deleteUserById(u.id)
            })
    }

    updateNonce(id, nonce) {
        notImplemented()
    }

    deleteAllUsers() {
        notImplemented()
    }

    _addUser(user) {
        notImplemented()
    }

    _deleteUserById(id) {
        notImplemented()
    }
}

module.exports = UserProvider