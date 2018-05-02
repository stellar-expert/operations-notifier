const generateToken = require('../../util/auth-token-generator')

describe('accountCypher', function () {
    it('always generates unique tokens of the same length', function () {
        const iterations = 5,
            expectedLength = 64

        let tokens = new Set()
        for (let i = 0; i < iterations; i++) {
            let token = generateToken()
            expect(token.length).to.equal(expectedLength) //tokens have the same length
            tokens.add(token)
        }
        expect(tokens.size).to.equal(iterations) //tokens are unique
    })
})