const auth = require('../api/authorization-handler'),
    roles = require('../models/user/roles'),
    storage = require('../logic/storage'),
    errors = require('../util/errors')

function notImplementedError(req, res) {
    res.status(501).json({
        error: 'Endpoint not implemented'
    })
}

module.exports = function (app) {

    //register new user (admin action)
    app.post('/api/user', [auth.userRequiredMiddleware, auth.isInRoleMiddleware(roles.ADMIN)], (req, res, next) => {
        let user = req.body
        storage.provider.userProvider.addUser(user)
            .catch(e => next(e))
            .then(() => res.end())
    })

    //list all registered users (admin action)
    app.get('/api/user', [auth.userRequiredMiddleware, auth.isInRoleMiddleware(roles.ADMIN)], (req, res, next) => {
        storage.provider.userProvider.getAllUsers()
            .catch(e => next(e))
            .then(users => res.json(users))
    })

    //get user by pubkey (admin action)
    app.get('/api/user/:pubkey', auth.userRequiredMiddleware, (req, res, next) => {
        if (!auth.canEdit(req, req.params.pubkey))
            return next(errors.forbidden())
        storage.provider.userProvider.getUserByPublicKey(req.params.pubkey)
            .catch(e => next(e))
            .then(user => res.json(user))
    })

    //update user settings
    app.put('/api/user/:pubkey', auth.userRequiredMiddleware, notImplementedError)

    //delete user
    app.delete('/api/user/:pubkey', auth.userRequiredMiddleware, (req, res, next) => {
        if (!auth.canEdit(req, req.params.pubkey))
            return next(errors.forbidden())
        storage.provider.userProvider.deleteUserByPubkey(req.params.pubkey)
            .catch(e => next(e))
            .then(() => res.end())
    })
}