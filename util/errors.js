const standardErrors = {
    genericError: {
        message: 'Error occurred. If this error persists, please contact our support team.',
        code: 0
    },
    badRequest: {
        message: 'Bad request.',
        code: 400
    },
    notFound: {
        message: 'Object not found.',
        code: 404
    }
}

function generateError({message, code}) {
    //todo: implement custom Error class with customized toString serialization which displays code and original message details
    let error = new Error(message)
    error.code = code || 0
    return error
}

function withDetails(message, details) {
    if (!details) return message
    return message + details
}

module.exports = {
    handleSystemError: function (error) {
        console.error(error)
    },
    genericError: function (internalError) {
        return generateError({
            message: 'Error occurred. If this error persists, please contact our support team.',
            code: 0,
            internalError: internalError
        })
    },
    badRequest: function (details = null) {
        return generateError({
            message: withDetails('Bad request. ', details),
            code: 400
        })
    },
    validationError: function (invalidParamName, details = null) {
        return this.badRequest(`Invalid parameter: ${invalidParamName}. `, details)
    },
    notFound: function (details = null) {
        return generateError({
            message: withDetails('Not found. ', details),
            code: 404
        })
    }
}