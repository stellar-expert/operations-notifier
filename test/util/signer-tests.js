const {signer} = require('../../util/signer')

describe('signer.sign', function () {
    it('fails to sign an empty data', function () {
        expect(() => signer.sign('')).to.throw(/Invalid data/)
    })

    it('signs the data', function () {
        let data = new Date().toJSON(),
            signature = signer.sign(data, 'utf8', 'base64')
        expect(signature.length).to.equal(88)
        expect(signer.verify(data, signature, 'utf8', 'base64')).to.be.true
    })
})