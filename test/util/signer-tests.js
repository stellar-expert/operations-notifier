const serverSigner = require('../../util/server-signer')

describe('signer.sign', function () {
    it('fails to sign an empty data', function () {
        expect(() => serverSigner.sign('')).to.throw(/Invalid data/)
    })

    it('signs the data', function () {
        let data = new Date().toJSON(),
            signature = serverSigner.sign(data, 'utf8', 'base64')
        expect(signature.length).to.equal(88)
        expect(serverSigner.verify(data, signature, 'utf8', 'base64')).to.be.true
    })
})