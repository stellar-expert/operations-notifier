const mongoose = require('mongoose'),
    TxIngestionCursor = mongoose.model('TxIngestionCursor'),
    {horizon} = require('./stellar-connector'),
    {parseTransaction} = require('./stream-processor')

/**
 * Tracks transactions using event streaming from Horizon server
 */
class TransactionWatcher {
    constructor(observer) {
        this.queue = []
        this.processing = false
        this.observer = observer
    }

    /**
     * Add transactions to the processing queue
     * @param {Array<Transaction>}transactions
     */
    enqueue(transactions) {
        if (!transactions || !transactions.length) return
        Array.prototype.push.apply(this.queue, transactions)
        this.processQueue()
    }

    /**
     * Pick the entry from the queue and process it
     */
    processQueue() {
        //TODO: check method performance under maximum load
        if (!this.observer.subscriptions || !this.observer.observing || !this.queue.length || this.processing) return
        this.processing = true
        const rawTx = this.queue.pop(),
            tx = parseTransaction(rawTx),
            notifications = []

        if (!tx) { //failed to parse transaction
            this.processing = false
            return this.processQueue()
        }

        //iterate through subscriptions
        this.observer.subscriptions.forEach(subscription => tx.operations.forEach(operation => {
            //TODO: ignore subscriptions that were added AFTER the tx ledger close date to prevent false notifications on fast-forwarding
            //find subscriptions that match an operation
            if (subscription.matches(operation)) {
                //create a notification
                let notification = {
                    _id: subscription.id + '-' + operation.id,
                    subscription: subscription._id,
                    payload: operation
                }
                notifications.push(notification)
                //mark subscription as ready to be processed
                subscription.processed = false
            }
        }))

        this.observer.notifier.createNotifications(notifications)
            .then(() => {
                TxIngestionCursor.updateLastIngestedTx(tx.details.paging_token)
                    .catch(err => console.error(err))
                this.processing = false
                this.processQueue()
            })
    }

    /**
     * Start watching
     */
    watch() {
        if (this.releaseStream) return
        TxIngestionCursor.getLastIngestedTx()
            .then(cursor => {
                this.cursor = cursor
                this.trackTransactions()
            })
    }

    /**
     * Fast-forward transaction tracking from the last known tx
     */
    trackTransactions() {
        if (!this.observer.observing) return // redundant check
        if (!this.cursor || this.cursor === '0') return this.trackLiveStream()

        //check previously set cursor
        horizon
            .transactions()
            .cursor(cursor)
            .order('asc')
            .limit(200)
            .call()
            .then(transactions => {
                if (!transactions.records || !transactions.records.length) {
                    this.trackLiveStream()
                } else {
                    this.enqueue(transactions.records)
                    setImmediate(() => this.trackTransactions())
                }
            })
            .catch(err => {
                console.error(err)
                this.stopWatching() //TODO: add bulletproof error handling with resume on error
            })
    }

    /**
     * Track live transactions stream from the Horizon server
     */
    trackLiveStream() {
        //subscribe to transactions live stream
        this.releaseStream = horizon
            .transactions()
            .order('asc')
            .cursor('now')
            .stream({onmessage: (rawTx) => this.enqueue([rawTx])})
    }

    /**
     * Terminates watching stream
     */
    stopWatching() {
        this.releaseStream && this.releaseStream()
    }
}

module.exports = TransactionWatcher