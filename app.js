process.env.NODE_ENV = process.env.NODE_ENV || 'production'

const config = require('./models/config')
//init storage and persistence layer
const storage = require('./logic/storage')
storage.init(config)
    .then(() => {
        //init and start observer
        const observer = require('./logic/observer')
        observer.start()

        //setup moment formatting extension
        require('moment-duration-format')(require('moment-timezone'))

        //init HTTP server and map all API routes
        require('./api/server-initialization')(config)
    })
//TODO: implement graceful observer finalization on OS kill signal