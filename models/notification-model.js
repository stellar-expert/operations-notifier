const Model = require('./base-model')

class Notification extends Model {
    id
    subscriptions
    payload
    created
    updated
}

module.exports = Notification