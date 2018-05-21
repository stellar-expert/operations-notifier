const StorageProvider = require('../storage-provider'),
    mongoose = require('mongoose'),
    {ObjectId} = mongoose.Types

mongoose.connection.on('error', console.error)
mongoose.connection.on('disconnected', () => setTimeout(() => connect(), 1000))

let connectionInitialized = false,
    User,
    Subscription,
    TxIngestionCursor,
    Notification

function toObjectId(id) {
    if (typeof id === 'string') {
        id = new ObjectId(id)
    }
    return id
}

//init connection
function connect(config) {
    mongoose.connect(config.storageConnectionString, {
        keepAlive: 1
    })

    if (connectionInitialized) return
    connectionInitialized = true
    //init models
    User = require('./models/user-db-model')
    Subscription = require('./models/subscription-db-model')
    TxIngestionCursor = require('./models/tx-ingestion-cursor-db-model')
    Notification = require('./models/notification-db-model')
}

class MongoDBStorageProvider extends StorageProvider {
    constructor(config) {
        super()
        connect(config)
    }

    fetchSubscriptions() {
        return Subscription.find({status: 0})
    }

    fetchSubscription(id) {
        return Subscription.findById(id)
    }

    fetchNextNotification(subscriptionId) {
        return Notification.findOne({subscriptions: toObjectId(subscriptionId)})
    }

    createNotifications(notifications) {
        return Notification.insertMany(notifications, {ordered: false})
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
        Notification.update({_id: toObjectId(notification.id)}, {$pull: {subscriptions: toObjectId(subscription.id)}}, function (err, res) {
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

    createDefaultAdminUser(adminAuthenticationToken) {
        return User.findOne({admin: true})
            .then(admin => {
                if (admin) {
                    if (adminAuthenticationToken && admin.authToken !== adminAuthenticationToken) {
                        admin.authToken = adminAuthenticationToken
                        return admin.save()
                    }
                    return admin
                }
                return new User({admin: true, authToken: adminAuthenticationToken}).save()
            })
    }

    updateLastIngestedTx(ingestedTxSequence) {
        return TxIngestionCursor.update(
            {
                _id: 0
            },
            {
                lastIngestedTx: ingestedTxSequence,
                updated: new Date()
            },
            {
                upsert: true
            })
    }

    getLastIngestedTx() {
        return TxIngestionCursor.findOne()
            .then(pointer => pointer && pointer.lastIngestedTx)
    }

    getUserByAuthToken(authToken) {
        //TODO: cache user models for a short period of time to prevent flooding
        return User.findOne({authToken: authToken})
    }
}

module.exports = MongoDBStorageProvider