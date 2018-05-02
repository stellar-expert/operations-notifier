function notImplementedError(req, res) {
    res.status(501).json({error: 'Endpoint not implemented'})
}

module.exports = function (app) {
    //register new user
    app.post('/api/user', notImplementedError)

    //list all registered users (admin action)
    app.get('/api/user', notImplementedError)

    //get user by id (admin action)
    app.get('/api/user/:id', notImplementedError)

    //update user settings
    app.put('/api/user/:id', notImplementedError)

    //generate new user access token
    app.post('/api/user/:id/generate-access-token', notImplementedError)

    //delete user
    app.delete('/api/user/:id', notImplementedError)
}