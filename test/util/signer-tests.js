const signer = require('../../util/signing')

describe('signer.sign', function () {
    it('fails to sign an empty data', function () {
        expect(() => signer.sign('')).to.throw(/Invalid data/)
    })

    it('signs the data', function () {
        let data = new Date().toJSON(),
            signature = signer.sign(data)
        expect(signature.length).to.equal(88)
        expect(signer.verify(data, signature)).to.be.true
    })
})