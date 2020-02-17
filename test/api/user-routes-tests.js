const chai = require('chai'),
    chaiHttp = require('chai-http'),
    config = require('../../models/config'),
    {Keypair} = require('stellar-sdk'),
    roles = require('../../models/user/roles'),
    storage = require('../../logic/storage'),
    {encodeUrlParams} = require('../../util/url-encoder'),
    initServerPromise = require('../../app')

chai.should()
chai.use(chaiHttp)

let express = null

const adminKeyPair = Keypair.random(),
    newUserKeyPair = Keypair.random()

function signData(key, data) {
    data = typeof data === 'object' ? JSON.stringify(data) : data.toString()
    return key.sign(data).toString('hex')
}

describe('Users API', () => {
    before((done) => {
        config.authorization = true
        initServerPromise
            .then(server => {
                express = server.app
                done()
            })
    })

    after((done) => {
        config.authorization = false
        storage.provider.userProvider.deleteAllUsers()
            .then(() => done())
    })

    describe('/POST user', () => {
        it('it should fail to POST new user (no auth token)', (done) => {
            chai.request(express)
                .post('/api/user')
                .send({pubkey: 'testkey'})
                .end((err, res) => {
                    res.should.have.status(401)
                    done()
                })
        })

        it('it should POST new admin user with config admin token', (done) => {
            chai.request(express)
                .post('/api/user')
                .set('authorization', config.adminAuthenticationToken)
                .send({
                    pubkey: adminKeyPair.publicKey(),
                    roles: [roles.ADMIN]
                })
                .end((err, res) => {
                    res.should.have.status(200)
                    done()
                })
        })

        it('it should POST new user with new admin credentials', (done) => {
            const newUser = {
                pubkey: newUserKeyPair.publicKey(),
                roles: [],
                nonce: Date.now()
            }

            const signature = signData(adminKeyPair, encodeUrlParams(newUser))

            chai.request(express)
                .post('/api/user')
                .set('authorization', `${adminKeyPair.publicKey()}.${signature}`)
                .send(newUser)
                .end((err, res) => {
                    res.should.have.status(200)
                    done()
                })
        })
    })

    describe('/GET user', () => {
        it('it should GET all the users', (done) => {
            const payload = encodeUrlParams({nonce: Date.now()}),
                signature = signData(adminKeyPair, payload)

            chai.request(express)
                .get('/api/user?' + payload)
                .set('authorization', `${adminKeyPair.publicKey()}.${signature}`)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('array')
                    res.body.length.should.be.eql(2)
                    done()
                })
        })

        it('it should GET own user', (done) => {
            const payload = encodeUrlParams({nonce: Date.now()}),
                signature = signData(newUserKeyPair, payload)
            chai.request(express)
                .get(`/api/user/${newUserKeyPair.publicKey()}?${payload}`)
                .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('object')
                    res.body.pubkey.should.be.eql(newUserKeyPair.publicKey())
                    done()
                })
        })
    })

    describe('/DELETE user', () => {
        it('it fail to delete user', (done) => {
            const nonce = Date.now(),
                data = {nonce},
                signature = signData(newUserKeyPair, encodeUrlParams(data))

            chai.request(express)
                .delete(`/api/user/${adminKeyPair.publicKey()}`)
                .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                .send(data)
                .end((err, res) => {
                    res.should.have.status(403)
                    done()
                })
        })

        it('it should delete user', (done) => {
            const nonce = Date.now(),
                data = {nonce},
                signature = signData(newUserKeyPair, encodeUrlParams(data))

            chai.request(express)
                .delete(`/api/user/${newUserKeyPair.publicKey()}`)
                .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                .send(data)
                .end((err, res) => {
                    res.should.have.status(200)
                    done()
                })
        })
    })
})