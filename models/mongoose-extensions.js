const mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Model = mongoose.Model

function getObjValue(field, data) {
    return field.split('.').reduce((obj, f) => obj && obj[f] || undefined, data)
}

function setObjValue(field, data, value) {
    const fieldArr = field.split('.')
    return fieldArr.reduce((o, f, i) => {
        if (i === fieldArr.length - 1) {
            o[f] = value
        } else {
            if (!o[f]) o[f] = {}
        }
        return o[f]
    }, data)
}

function serializeArray(array, settings) {
    const promises = array.map(val => val instanceof Model ? serializeModel(val, settings) : Promise.resolve(val))
    return Promise.all(promises)
}

function getModelFieldsToSerialize(model, settings) {
    const allFilters = model.schema.statics.serializationFilter
    if (settings.filter) {
        // fields specified explicitly
        if (settings.filter instanceof Array) return settings.filter

        // named filter
        if (typeof settings.filter === 'string') {

            if (!allFilters) {
                console.warn('Filter ' + settings.filter + ' is not defined. Set static "serializationFilter" property with serialization map.')
            }
            else {
                //use predefined filter by name
                let keys = allFilters[settings.filter]

                if (keys === false) {//allow all fields
                    return Object.keys(model._doc)
                }
                //filter was not found
                if (keys === undefined) {
                    console.warn('Filter ' + settings.filter + ' is not defined. Unknown serialization filter.')
                }
                return keys
            }
        }
    }
    //use a default filter or just retrieve all keys from the model
    return (allFilters && allFilters['default']) || Object.keys(model._doc)
}

//extend model prototype with utility methods
function serializeModel(model, settings) {
    let serialized = {},
        source = model._doc,
        valuePromises = []

    if (!settings) settings = {}
    const keys = getModelFieldsToSerialize(model, settings)
    keys.forEach(key => {
        const value = source[key]
        switch (key) {
            case 'id':
                serialized.id = source._id.toString()
                break
            case '_id':
                serialized.id = value.toString()
                break
            case '__v':
                if (settings.includeVersion) {
                    serialized[key] = value
                }
                break
            case 'initiator':
                if (settings.author === true) {
                    if (settings.author === 'id') {
                        serialized[key] = value ? value.toString() : undefined
                    } else {
                        valuePromises.push(User.findById(value).exec().then(function (user) {
                            serialized.author = user ? user.toJSON() : null
                        }, function (err) {
                            if (err !== null) throw err
                        }))
                    }
                }
                break
            default:
                if (value instanceof Array && value.length) {
                    if (settings.recursive === false) break
                    valuePromises.push(mongooseExtensions.serialize(value, settings).then(function (serializedValue) {
                        serialized[key] = serializedValue
                        return serialized
                    }))
                } else if (value instanceof Model) {
                    if (settings.recursive === false) break
                    valuePromises.push(mongooseExtensions.serialize(value, settings).then(function (serializedArray) {
                        serialized[key] = serializedArray
                        return serialized
                    }))
                } else { //assign original value
                    serialized[key] = value
                }
                break
        }
    })

    return Promise.all(valuePromises)
        .then(() => serialized)
        .catch(err => console.error(err))
}

const mongooseExtensions = {
    serialize: function (modelOrArrayOfModels, settings = null) {
        if (modelOrArrayOfModels instanceof Model) return serializeModel(modelOrArrayOfModels, settings)
        if (modelOrArrayOfModels instanceof Array) return serializeArray(modelOrArrayOfModels, settings)
        return modelOrArrayOfModels
    },
    serializeToResponse: function (modelOrArrayOfModels, response, settings = null) {
        return mongooseExtensions.serialize(modelOrArrayOfModels, settings)
            .then(res => response.json(res))
    },
    updateModel: function (model, data, fieldsToCopy) {
        fieldsToCopy.forEach(field => {
            const newValue = getObjValue(field, data)
            if (newValue !== undefined) {
                setObjValue(field, model, newValue)
            }
        })
        return model
    }
}

module.exports = mongooseExtensions