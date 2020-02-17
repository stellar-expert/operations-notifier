const {elapsed} = require('../../util/elapsed-time')

describe('elapsed', function () {
    it('formats timespans', function () {
        const to = new Date('2020-01-15T12:57:14.428Z')
        expect(elapsed(new Date('2020-01-15T12:57:13.429Z'), to)).to.eq('0s')
        expect(elapsed(new Date('2020-01-15T12:57:13.427Z'), to)).to.eq('1s')
        expect(elapsed(new Date('2020-01-15T12:57:16.428Z'), to)).to.eq('2s')
        expect(elapsed(new Date('2020-01-15T12:56:01.428Z'), to)).to.eq('1m 13s')
        expect(elapsed(new Date('2020-01-15T09:53:01.428Z'), to)).to.eq('3h 4m 13s')
        expect(elapsed(new Date('2020-01-15T09:53:01.427Z'), to)).to.eq('3h 4m 13s')
        expect(elapsed(new Date('2018-03-14T23:00:00.000Z'), to)).to.eq('671d 13h 57m 14s')
    })
})