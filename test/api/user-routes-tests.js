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

chai.use(chaiHttp)

if (config.authorization) {

    const adminKeyPair = Keypair.random()
    const newUserKeyPair = Keypair.random()

    const signData = function (key, data) {
        if (typeof data === 'object')
            data = JSON.stringify(data)
        else
            data = data.toString()

        return key.sign(data).toString('hex')
    }

    describe('Users', () => {

        after(() => {
            storage.provider.userProvider.deleteAllUsers()
                .then(() => {
                    return Promise.resolve()
                })
        })

        describe('/POST user', () => {

            it('it should fail to POST new user (no auth token)', (done) => {
                chai.request(server.app)
                    .post('/api/user')
                    .send({
                        pubkey: 'testkey'
                    })
                    .end((err, res) => {
                        res.should.have.status(401)
                        done()
                    })
            })

            it('it should POST new admin user with config admin token', (done) => {
                chai.request(server.app)
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

                let newUser = {
                    pubkey: newUserKeyPair.publicKey(),
                    roles: [],
                    nonce: Date.now()
                }

                const signature = signData(adminKeyPair, objectToFormEncoding(newUser))

                
                chai.request(server.app)
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

                const payload =  objectToFormEncoding({
                     nonce: Date.now()
                })
                const signature = signData(adminKeyPair, payload)

                chai.request(server.app)
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

                const payload =  objectToFormEncoding({
                    nonce: Date.now()
               })
                const signature = signData(newUserKeyPair, payload)
                chai.request(server.app)
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

                const nonce = Date.now()
                const data = {nonce}
                const signature = signData(newUserKeyPair, objectToFormEncoding(data))

                chai.request(server.app)
                    .delete(`/api/user/${adminKeyPair.publicKey()}`)
                    .set('authorization', `${newUserKeyPair.publicKey()}.${signature}`)
                    .send(data)
                    .end((err, res) => {
                        res.should.have.status(403)
                        done()
                    })
            })

            it('it should delete user', (done) => {

                const nonce = Date.now()
                const data = {nonce}
                const signature = signData(newUserKeyPair, objectToFormEncoding(data))

                chai.request(server.app)
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
}