const checkAuth = require('./authorization-handler'),
    pkgInfo = require('../package'),
    {getPublicKey} = require('../util/signing'),
    observer = require('../logic/observer'),
    moment = require('moment-timezone')

function processResponse(promiseOrData, res) {
    if (!(promiseOrData instanceof Promise)) promiseOrData = Promise.resolve(promiseOrData)
    promiseOrData
        .then(data => {
            if (!data) return res.status(200).end()
            res.json(data)
        })
        .catch(e => {
            if (typeof e === 'object' || (e instanceof Error && e.status)) {
                return res.status(e.status || 400)
                    .json({
                        error: e.error || e.message,
                        details: e.details
                    })
            }
            console.error(e)
            res.status(500).end()
        })
}

const started = new Date()

module.exports = function (app) {
    //get application status
    app.get('/api/status', (req, res) => res.json({
        version: pkgInfo.version,
        uptime: moment.duration(new Date() - started, 'milliseconds').format(),
        publicKey: getPublicKey()
    }))

    //get all subscriptions for current user
    app.get('/api/subscription', checkAuth, (req, res) => {
        observer.getActiveSubscriptions()
            .then(all => all.filter(s => s.user == req.user.id))
            .then(subscriptions => processResponse(subscriptions, res))
    })

    //get subscription by id
    app.get('/api/subscription/:id', checkAuth, (req, res) => {
        observer.getSubscription(req.params.id)
            .then(subscription => {
                if (subscription.user == req.user.id) return processResponse(subscription, res)
                res.status(404).json({error: `Subscription ${req.params.id} not found.`})
            })
    })

    //create new subscription
    app.post('/api/subscription', checkAuth, (req, res) => {
        processResponse(observer.subscribe(req.body, req.user), res)
    })

    //unsubscribe
    app.delete('/api/subscription/:id', checkAuth, (req, res) => {
        observer.unsubscribe(req.params.id)
            .then(() => res.status(200).end())
    })

    //block modifications
    app.put('/api/subscription', (req, res) => res.status(405).json({error: 'Subscription cannot be modified'}))
    app.put('/api/subscription/:id', (req, res) => res.status(405).json({error: 'Subscription cannot be modified'}))
}