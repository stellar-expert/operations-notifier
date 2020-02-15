let chai = require('chai')
let chaiHttp = require('chai-http')
let config = require('../../models/config')
const {
    Keypair
} = require('stellar-base')
const roles = require('../../models/user/roles')
const storage = require('../../logic/storage')
const {objectToFormEncoding} = require('../../util/form-url-encoding-helper')
let should = chai.should()

let subscriptions = null //will be filled later

chai.use(chaiHttp)

if (config.authorization) {

    const newUserKeyPair = Keypair.random()

    const signData = function (key, data) {
        if (typeof data === 'object')
            data = JSON.stringify(data)
        else
            data = data.toString()

        return key.sign(data).toString('hex')
    }

    describe('Subscriptions', () => {

        before(() => {
            return storage.provider.userProvider.addUser({
                pubkey: newUserKeyPair.publicKey()
            })
        })

        after(() => {
            Promise.all([
                    storage.provider.userProvider.deleteAllUsers(),
                    storage.provider.removeAllSubscriptions()
                ])
                .then(() => {
                    return Promise.resolve()
                })
        })

        describe('/POST subscriptions', () => {

            it('it should fail to POST new subscription (no auth token)', (done) => {

                const data = {
                    reaction_url: 'http://fake.url/reaction',
                    operation_types: [0, 1, 3]
                }

                chai.request(server.app)
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

                const signature = signData(newUserKeyPair, objectToFormEncoding(data))

                chai.request(server.app)
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

                chai.request(server.app)
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

                chai.request(server.app)
                    .get('/api/subscription')
                    .set('authorization', config.adminAuthenticationToken)
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.be.a('array')
                        res.body.length.should.be.eql(2)
                        subscriptions = res.body
                        done()
                    })
            })

            it('it should GET all own subscriptions', (done) => {

                const payload = objectToFormEncoding({nonce: Date.now()})
                const signature = signData(newUserKeyPair, payload)
                chai.request(server.app)
                    .get(`/api/subscription?${payload}`)
                    .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.be.a('array')
                        res.body.length.should.be.eql(1)
                        done()
                    })
            })

            it('it should fail to GET subscription by another\'s id', (done) => {

                const payload = objectToFormEncoding({nonce: Date.now()})
                const signature = signData(newUserKeyPair, payload)

                const anothersSubs = subscriptions.find(s => s.pubkey !== newUserKeyPair.publicKey())

                chai.request(server.app)
                    .get(`/api/subscription/${anothersSubs.id}?${payload}`)
                    .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                    .end((err, res) => {
                        res.should.have.status(404)
                        done()
                    })
            })

            it('it should GET own subscription by id', (done) => {

                const payload = objectToFormEncoding({nonce: Date.now()})
                const signature = signData(newUserKeyPair, payload)

                const ownSubs = subscriptions.find(s => s.pubkey === newUserKeyPair.publicKey())

                chai.request(server.app)
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
}