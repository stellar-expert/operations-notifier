const mongoose = require('mongoose'),
    User = mongoose.model('User'),
    config = require('../server.config')

const scheme = 'Token '

function checkAuth(req, res, next) {
    if (!config.authorization || config.authorization === 'disabled') {
        //assign fake user stub to request
        req.user = {
            _id: null,
            id: {
                _id: null,
                toString() {
                    return null
                }
            },
            email: 'anonymous',
            admin: true
        }
        return next()
    }

    if (config.authorization !== 'token') {
        console.error(`Unknown authorization type: ${config.authorization}. `)
        return res.status(401).json()
    }

    let auth = req.headers.authorization
    if (!auth || auth.indexOf(scheme) !== 0) {
        auth = req.body.access_token || req.query.access_token
    } else {
        auth = auth.substr(scheme.length)
    }
    if (!auth) return res.status(401).json({error: 'Access token is required.'})
    if (auth.length !== 64) return res.status(401).json({error: 'Invalid access token format.'})

    //TODO: cache user models for a short period of time to prevent flooding
    User.findOne({authToken: auth})
        .then(user => {
            if (!user) return res.status(401).json({error: 'Access token is invalid.'})
            req.user = user
            next()
        })
}

module.exports = checkAuth