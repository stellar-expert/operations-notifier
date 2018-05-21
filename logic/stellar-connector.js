const {Server: HorizonServer} = require('stellar-sdk'),
    config = require('../app.config')

console.log(`Using Horizon server ${config.horizon}`)

module.exports = {
    /**
     * Horizon wrapper instance
     */
    horizon: new HorizonServer(config.horizon)//a Horizon wrapper instance
}