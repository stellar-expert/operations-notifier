process.env.NODE_ENV = process.env.NODE_ENV || 'production'

function init() {
    const config = require('./models/config')
    //init storage and persistence layer
    const storage = require('./logic/storage')

    
    return storage.init(config)
        .then(() => {
           
            process.on('SIGINT', () => {
                shutdown()
            })
        
            process.on('SIGTERM', () => {
                shutdown()
            })

            //init and start observer
            const observer = require('./logic/observer')
            observer.start()
            
            //init HTTP server and map all API routes
            const server = require('./api/server-initialization')(config)

            function shutdown() {
                
                console.log('Received kill signal')
                console.log('Closing http server.')
                
                server.close(() => {
                    observer.stop()
                    console.log('transaction observer stopped')
                    storage.finalize()
                    .then(()=>{
                        console.log('Storage provider connection closed.')
                        console.log('Closed out remaining connections')
                        process.exit(0)
                    })
                    .catch((err)=>{
                        console.error('Error closing connection '+ err)
                        console.error('Forcelly shutting down')
                        process.exit(1) 
                    })  
                })
                setTimeout(() => {
                    console.error('Could not close connections in time, forcefully shutting down')
                    process.exit(1)
                }, 10000)
            }
        })
}

module.exports = init()