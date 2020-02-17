const timespans = {
    day: 60 * 60 * 24,
    hour: 60 * 60,
    minute: 60
}

/**
 * Print elapsed time between two dates.
 * @param {Date} from
 * @param {Date} to
 * @return {String}
 */
function elapsed(from, to) {
    let seconds = Math.floor(Math.abs((to - from) / 1000)),
        diff = {},
        res = []

    const days = Math.floor(seconds / timespans.day)
    if (days > 0) {
        seconds -= days * timespans.day
        res.push(days + 'd')
    }

    const hours = Math.floor(seconds / timespans.hour)
    if (hours > 0) {
        seconds -= hours * timespans.hour
        res.push(hours + 'h')
    }

    const minutes = Math.floor(seconds / timespans.minute)
    if (minutes > 0) {
        seconds -= minutes * timespans.minute
        res.push(minutes + 'm')
    }

    res.push(seconds + 's')

    return res.join(' ')
}

module.exports = {elapsed}