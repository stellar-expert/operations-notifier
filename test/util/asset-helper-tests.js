const {isValidAsset, assetsEqual, parseAsset} = require('../../util/asset-helper')

describe('assetHelper.isValidAsset', function () {
    it('signs the data', function () {
        let testData = [
            { //positive
                input: {
                    asset_code: 'CODE',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 1
                },
                expected: true
            },
            { //positive - XLM
                input: {
                    asset_type: 0
                },
                expected: true
            },
            { //invalid issuer
                input: {
                    asset_code: 'CODE',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJC',
                    asset_type: 1
                },
                expected: false
            },
            { //invalid type
                input: {
                    asset_code: 'CODE',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 2
                },
                expected: false
            },
            { //code without issuer
                input: {
                    asset_code: 'CODE',
                },
                expected: false
            },
            { //issuer without code
                input: {
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 2
                },
                expected: false
            },
            { //empty code
                input: {
                    asset_code: '',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 1
                },
                expected: false
            },
            { //too long code
                input: {
                    asset_code: '12345678901234567890',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 1
                },
                expected: false
            },
            { //XLM with non-empty code
                input: {
                    asset_code: 'CODE',
                    asset_type: 0
                },
                expected: false
            },
            { //XLM with non-empty issuer
                input: {
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 0
                },
                expected: false
            }
        ]

        testData.forEach(entry => expect(isValidAsset(entry.input)).to.equal(entry.expected, `test case data: ${JSON.stringify(entry)}`))
    })
})

describe('assetHelper.parseAsset', function () {
    it('should parse assets and correct possible collisions', function () {
        let testData = [
            { //direct parsing without a prefix, with garbage check
                input: {
                    asset_code: 'CODE',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    garbage: 'some garbage',
                    asset_garbage: 'more garbage'
                },
                expected: {
                    asset_code: 'CODE',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 1
                }
            },
            { //with a prefix
                input: {
                    test_asset_code: 'CODE',
                    test_asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV'
                },
                prefix: 'test_',
                expected: {
                    asset_code: 'CODE',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 1
                }
            },
            { //XLM
                input: {
                    asset_code: 'XLM'
                },
                expected: {
                    asset_type: 0
                }
            },
            { //XLM with asset_type field
                input: {
                    asset_type: 'native'
                },
                expected: {
                    asset_type: 0
                }
            },
            { //automatic asset type correction
                input: {
                    asset_code: 'CODE',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 'credit_alphanum12'
                },
                expected: {
                    asset_code: 'CODE',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 1
                }
            },
            { //alphanum12 asset type
                input: {
                    asset_code: 'CODE123',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV'
                },
                expected: {
                    asset_code: 'CODE123',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJV',
                    asset_type: 2
                }
            },
            { //invalid asset
                input: {
                    asset_code: 'CODE123',
                    asset_issuer: 'GAG36IX3EZ34PG4TYY5OJIIDACHXOFVQ6IZUWLMJNKJYY2B7DYZJWEJA'
                },
                expected: null
            }
        ]
        
        testData.forEach(entry => expect(parseAsset(entry.input, entry.prefix)).to.be.deep.equal(entry.expected, `test case data: ${JSON.stringify(entry)}`))
    })
})