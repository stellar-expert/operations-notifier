const config = require('../app.config'),
    storage = require('../logic/storage')

const scheme = 'Token '

function authError(res, details) {
    console.warn('[Auth] ' + details)
    return res.status(401).json({error: details})
}

function checkAuth(req, res, next) {
    if (!config.authorization || config.authorization === 'disabled') {
        //anonymous user
        req.user = {
            id: null,
            email: 'anonymous',
            admin: true
        }
        return next()
    }

    //invalid authorization type
    if (config.authorization !== 'token') return authError(res, `Unknown authorization type: ${config.authorization}.`)

    //retrieve authorization from headers, body or query string
    let auth = req.headers.authorization
    if (!auth || auth.indexOf(scheme) !== 0) {
        auth = req.body.access_token || req.query.access_token
    } else {
        auth = auth.substr(scheme.length)
    }

    if (!auth) return authError(res, 'Access token is required.')

    if (auth.length !== 64) return authError('Invalid access token format.')

    //get user from db
    storage.provider.getUserByAuthToken(auth)
        .then(user => {
            if (!user) return authError('Access token is invalid.')
            //assign to request
            req.user = user
            next()
        })
}

module.exports = checkAuth