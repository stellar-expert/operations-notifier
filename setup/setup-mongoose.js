const fs = require('fs'),
    config = require('../server.config'),
    path = require('path'),
    mongoose = require('mongoose'),
    enumerateFiles = require('./enumerate-files')

// Connect to mongodb
function connect() {
    mongoose.connection.on('error', console.error)
    mongoose.connection.on('disconnected', connect)
    const options = {
        keepAlive: 1
    }

    mongoose.connect(config.db, options)
}

module.exports = function () {
    connect()

    const queue = [],
        analysed = [],
        modelsDir = 'models',
        modelSuffix = '-model'

    //queue.push(path.join('../', modelsDir, 'user' + modelSuffix + '.js'))

    /**
     * Analyse source file for dependencies and adds it to the bootstrapping queue
     * @param {string} file Model source file
     */
    function analyseFile(file) {
        if (analysed.indexOf(file) >= 0) return
        let moduleFileContent = fs.readFileSync(file, {encoding: 'utf8'})
        analysed.push(file)
        //get all model dependencies
        let res
        while ((res = /mongoose\.model\(["'](\w*?)["']\)/g.exec(moduleFileContent)) !== null) {
            let dependecy = path.join(__dirname, '../', modelsDir, res[1].toLowerCase() + modelSuffix + '.js')
            analyseFile(dependecy)
        }
        if (queue.indexOf(file) < 0) {
            queue.push(file)
        }
    }

    enumerateFiles(modelsDir, 'model.js', analyseFile)
    queue.forEach(file => require(file))

    return mongoose.connection
}
