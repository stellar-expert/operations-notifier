const chai = require('chai'),
    chaiHttp = require('chai-http'),
    config = require('../../models/config'),
    {Keypair} = require('stellar-sdk'),
    storage = require('../../logic/storage'),
    {encodeUrlParams} = require('../../util/url-encoder'),
    initServerPromise = require('../../app')

let subscriptions = null,
    express = null

chai.should()
chai.use(chaiHttp)

const newUserKeyPair = Keypair.random()

function signData(key, data) {
    data = typeof data === 'object' ? JSON.stringify(data) : data.toString()
    return key.sign(data).toString('hex')
}

describe('Subscriptions', () => {
    before((done) => {
        config.authorization = true
        initServerPromise
            .then(server => {
                express = server.app
            })
            .then(() => {
                return storage.provider.userProvider.addUser({
                    pubkey: newUserKeyPair.publicKey()
                })
            })
            .then(()=>done())
    })

    after((done) => {
        config.authorization = false
        Promise.all([
            storage.provider.userProvider.deleteAllUsers(),
            storage.provider.removeAllSubscriptions()
        ])
            .then(()=>done())
    })

    describe('/POST subscriptions', () => {
        it('it should fail to POST new subscription (no auth token)', (done) => {
            const data = {
                reaction_url: 'http://fake.url/reaction',
                operation_types: [0, 1, 3]
            }

            chai.request(express)
                .post('/api/subscription')
                .send(data)
                .end((err, res) => {
                    res.should.have.status(401)
                    done()
                })
        })

        it('it should POST new subscription', (done) => {
            const nonce = Date.now()

            const data = {
                reaction_url: 'http://fake.url/reaction',
                operation_types: [0, 1, 3],
                nonce: nonce
            }

            const signature = signData(newUserKeyPair, encodeUrlParams(data))

            chai.request(express)
                .post('/api/subscription')
                .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                .send(data)
                .end((err, res) => {
                    res.should.have.status(200)
                    done()
                })
        })


        it('it should POST new subscription with admin token', (done) => {
            const data = {
                reaction_url: 'http://fake.url/reaction',
                operation_types: [0, 1, 3]
            }

            chai.request(express)
                .post('/api/subscription')
                .set('authorization', config.adminAuthenticationToken)
                .send(data)
                .end((err, res) => {
                    res.should.have.status(200)
                    done()
                })
        })
    })

    describe('/GET subscriptions', () => {
        it('it should GET all the subscriptions', (done) => {

            chai.request(express)
                .get('/api/subscription')
                .set('authorization', config.adminAuthenticationToken)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.an('array')
                    res.body.length.should.be.eql(2)
                    subscriptions = res.body
                    done()
                })
        })

        it('it should GET all own subscriptions', (done) => {
            const payload = encodeUrlParams({nonce: Date.now()})
            const signature = signData(newUserKeyPair, payload)
            chai.request(express)
                .get(`/api/subscription?${payload}`)
                .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.an('array')
                    res.body.length.should.be.eql(1)
                    done()
                })
        })

        it('it should fail to GET subscription by another\'s id', (done) => {

            const payload = encodeUrlParams({nonce: Date.now()})
            const signature = signData(newUserKeyPair, payload)

            const anothersSubs = subscriptions.find(s => s.pubkey !== newUserKeyPair.publicKey())

            chai.request(express)
                .get(`/api/subscription/${anothersSubs.id}?${payload}`)
                .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                .end((err, res) => {
                    res.should.have.status(404)
                    done()
                })
        })

        it('it should GET own subscription by id', (done) => {
            const payload = encodeUrlParams({nonce: Date.now()}),
                signature = signData(newUserKeyPair, payload),
                ownSubs = subscriptions.find(s => s.pubkey === newUserKeyPair.publicKey())

            chai.request(express)
                .get(`/api/subscription/${ownSubs.id}?${payload}`)
                .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.id.should.be.eql(ownSubs.id)
                    done()
                })
        })
    })
})