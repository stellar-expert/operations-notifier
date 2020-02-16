const config = process.env['NODE_ENV'] == 'test' ?  require('../test/app.config-test.json') :  require('../app.config.json')

function camelCase(value) {
    return value.toLowerCase().replace(/_([a-z])/g, (x, up) => up.toUpperCase())
}

function parseEnv(key) {
    let value = process.env[key]
    if (value) {
        const path = camelCase(key),
            defaultValue = config[path]
        if (typeof defaultValue === 'number') {
            value = parseInt(value)
        }
        config[path] = value
    }
}

parseEnv('AUTHORIZATION')
parseEnv('STORAGE_PROVIDER')
parseEnv('STORAGE_CONNECTION_STRING')
parseEnv('API_PORT')
parseEnv('HORIZON')
parseEnv('SIGNATURE_SECRET')
parseEnv('MAX_ACTIVE_SUBSCRIPTIONS')
parseEnv('MAX_ACTIVE_SUBSCRIPTIONS_PER_USER')
parseEnv('NOTIFICATION_CONCURRENCY')
parseEnv('REACTION_RESPONSE_TIMEOUT')
parseEnv('ADMIN_AUTHENTICATION_TOKEN')

module.exports = config
