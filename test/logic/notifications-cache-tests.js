const NotificationsCache = require('../../logic/notifications-cache')

describe('NotificationsCache', function () {
    it('expects valid maxSize argument', function () {
        expect(() => new NotificationsCache()).to.throw(/cache size/)
        expect(() => new NotificationsCache('-10')).to.throw(/cache size/)
        expect(() => new NotificationsCache('wrong number')).to.throw(/cache size/)
        expect(() => new NotificationsCache({test: 1})).to.throw(/cache size/)
        expect(() => new NotificationsCache(0)).to.throw(/cache size/)
        expect(() => new NotificationsCache(0.5)).to.throw(/cache size/)
        expect(() => new NotificationsCache(-10)).to.throw(/cache size/)
        let cache = new NotificationsCache(100)
        expect(cache.maxSize).to.be.equal(100)
        expect(cache.size).to.be.equal(0)
    })

    it('evicts old entries when the limit is reached', function () {
        let cache = new NotificationsCache(2)
        cache.add({id: 1, subscriptions: [101]})
        expect(cache.size).to.be.equal(1)
        cache.add({id: 2, subscriptions: [102]})
        expect(cache.size).to.be.equal(2)
        cache.add({id: 3, subscriptions: [101, 102]})
        expect(cache.size).to.be.equal(2)
        expect(cache.get()).to.be.equal(2)
    })
})