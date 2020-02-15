process.env.NODE_ENV = process.env.NODE_ENV || 'production'

function init() {
    const config = require('./models/config')
    //init storage and persistence layer
    const storage = require('./logic/storage')
    return storage.init(config)
        .then(() => {
            //init and start observer
            const observer = require('./logic/observer')
            observer.start()

            //setup moment formatting extension
            require('moment-duration-format')(require('moment-timezone'))

            //init HTTP server and map all API routes
            const server = require('./api/server-initialization')(config)
            //TODO: implement graceful observer finalization on OS kill signal

            function shutdown() {
                console.log('Received kill signal');
                server.close(() => {
                    console.log('Closed out remaining connections');
                    process.exit(0);
                });

                setTimeout(() => {
                    console.error('Could not close connections in time, forcefully shutting down');
                    process.exit(1);
                }, 10000);
            }

            server.shutdown = shutdown

            return Promise.resolve(server)
        })
}
module.exports = init()