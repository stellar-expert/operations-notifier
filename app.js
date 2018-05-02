//set NODE_ENV
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

//setup mongoose
require('./setup/setup-mongoose')()

const config = require('./server.config.json'),
    express = require('express'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    http = require('http')

//init Express
const app = express()
//set basic Express settings
app.disable('x-powered-by')

if (process.env.NODE_ENV === 'development') {
    app.use(logger('dev'))
}
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
//allow CORS requests
app.use(cors())

// error handler
app.use((err, req, res, next) => {
    if (err) console.error(err)
    if (res.headersSent) {
        return next(err)
    }
    res.status(500).end()
})

//register routes
require('./api/observer-routes')(app)
require('./api/user-routes')(app)

function normalizePort(val) {
    let port = parseInt(val)
    if (isNaN(port)) return val
    if (port >= 0) return port
    throw new Error('Invalid port')
}

//set API port
const port = normalizePort(process.env.PORT || config.apiPort || '3000')
app.set('port', port)

//instantiate server
const server = http.createServer(app)

server.listen(port)
//server.on('error', onError)
server.on('listening', ()=> {
    let addr = server.address(),
        bind = typeof addr === 'string' ? 'pipe ' + addr: 'port ' + addr.port
    console.log('Listening on ' + bind)
})

//setup moment formatting extension
require('moment-duration-format')(require('moment-timezone'))

//init and start observer
const observer = require('./logic/observer')
observer.start()

//TODO: implement graceful observer finalization on OS kill signal
