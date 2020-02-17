const initServerPromise = require('../app')

after((done) => {
    initServerPromise
        .then(server => {
            server.shutdown()
            done()
        })
})