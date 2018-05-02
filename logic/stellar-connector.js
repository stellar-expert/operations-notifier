const {Server: HorizonServer} = require('stellar-sdk'),
    {Network, Networks: PredefinedStellarNetworks} = require('stellar-base'),
    config = require('../server.config')

const network = new Network(config.stellarNetworkPassphrase ?
    config.stellarNetworkPassphrase :   //create network descriptor from passphrase
    PredefinedStellarNetworks[config.stellarNetwork]) //choose predefined network

//set up the default horizon network
Network.use(network)

module.exports = {
    /**
     * Horizon wrapper instance
     */
    horizon: new HorizonServer(config.horizon), //create a horizon wrapper instance
    /**
     * Stellar network friendly name
     */
    networkName: config.stellarNetwork || 'PRIVATE',
    /**
     * Network passphrase
     */
    networkPassphrase: network.networkPassphrase(),
    /**
     * True for Stellar public network and testnet
     */
    isPredefinedNetwork: !config.stellarNetworkPassphrase
}