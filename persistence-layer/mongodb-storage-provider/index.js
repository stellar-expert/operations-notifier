const StorageProvider = require('../storage-provider'),
    MongoUserProvider = require('./mongo-user-provider'),
    mongoose = require('mongoose'),
    {
        ObjectId
    } = mongoose.Types

mongoose.connection.on('error', console.error)
mongoose.connection.on('disconnected', () => setTimeout(() => connect(), 1000))

let connectionInitialized = false,
    Subscription,
    TxIngestionCursor,
    Notification

function toObjectId(id) {
    if (typeof id === 'string') {
        id = new ObjectId(id)
    }
    return id
}

class MongoDBStorageProvider extends StorageProvider {

    init(config) {
        if (connectionInitialized)
            return Promise.resolve()
        return mongoose.connect(config.storageConnectionString, {
            keepAlive: 1
        }).then(() => {

            connectionInitialized = true
            //init models
            Subscription = require('./models/subscription-db-model')
            TxIngestionCursor = require('./models/tx-ingestion-cursor-db-model')
            Notification = require('./models/notification-db-model')

            return Promise.resolve()
        })
    }

    fetchSubscriptions() {
        return Subscription.find({
            status: 0
        })
    }

    fetchSubscription(id) {
        return Subscription.findById(id)
    }

    fetchNextNotification(subscriptionId) {
        return Notification.findOne({
            subscriptions: toObjectId(subscriptionId)
        })
    }

    createNotifications(notifications) {
        return Notification.insertMany(notifications, {
                ordered: false
            })
            .catch(err => {
                //TODO: test duplicate primary key handling
                //if the error thrown is a BulkWriteError with error codes 11000, than it's ok
                //https://docs.mongodb.com/manual/reference/method/db.collection.insertMany/#unordered-inserts
                console.error(err)
                if (err.code === 11000) {
                    return err.result.nInserted //return inserted notifications count
                }
                return 0
            })
    }

    removeNotification(notification) {
        return notification.remove()
    }

    markAsProcessed(notification, subscription) {
        Notification.update({
            _id: toObjectId(notification.id)
        }, {
            $pull: {
                subscriptions: toObjectId(subscription.id)
            }
        }, function (err, res) {
            if (err) console.error(err)
        })
        return Promise.resolve(notification)
    }

    saveSubscription(subscription) {
        if (!(subscription instanceof Subscription)) {
            subscription = new Subscription(subscription)
        }
        return subscription.save()
    }

    removeAllSubscriptions() {
        return Subscription.deleteMany({})
            .then(() => {
                return Notification.deleteMany({})
            })
    }

    updateLastIngestedTx(ingestedTxSequence) {
        return TxIngestionCursor.update({
            _id: 0
        }, {
            lastIngestedTx: ingestedTxSequence,
            updated: new Date()
        }, {
            upsert: true
        })
    }

    getLastIngestedTx() {
        return TxIngestionCursor.findOne()
            .then(pointer => pointer && pointer.lastIngestedTx)
    }

    get userProvider() {
        return new MongoUserProvider()
    }
}

module.exports = MongoDBStorageProvider