function encodeUrlParams(object) {
    if (!object) return ''
    return Object.keys(object)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(object[k])}`)
        .join('&')
}

module.exports = {encodeUrlParams}