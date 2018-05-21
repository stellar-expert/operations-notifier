const storage = require('./storage')

const notificationsMap = {

    markProcessed(subscription, notification) {
        if (!notification) return
        throw  new Error('Not implemented')
    }
}

module.exports = notificationsMap