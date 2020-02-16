const express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    http = require('http'),
    auth = require('./authorization-handler')

module.exports = function (config) {
    //create Express server instance
    const app = express()

    //set basic Express settings
    app.disable('x-powered-by')

    if (process.env.NODE_ENV === 'development') {
        const logger = require('morgan')
        app.use(logger('dev'))
    }
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: false}))
    //allow CORS requests
    app.use(cors())

    app.all('*', auth.userMiddleware)

    //register routes
    require('./observer-routes')(app)
    require('./user-routes')(app)

    // error handler
    app.use((err, req, res, next) => {
        if (err) console.error(err)
        if (res.headersSent) return next(err)
        res.status((err && err.code) || 500).end()
    })

    function normalizePort(val) {
        let port = parseInt(val)
        if (isNaN(port)) return val
        if (port >= 0) return port
        throw new Error('Invalid port')
    }

    //set API port
    const port = normalizePort(process.env.PORT || config.apiPort || 3000)
    app.set('port', port)

    //instantiate server
    const server = http.createServer(app)

    server.listen(port)
    //server.on('error', onError)
    server.on('listening', () => {
        let addr = server.address(),
            bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
        console.log('Listening on ' + bind)
    })
    server.app = app
    return server
}