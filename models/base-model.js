class Model {
    static projectFrom(source) {
        throw new Error('Refactor!')
        if (source===null || source===undefined) return null
        if (typeof source !== 'object') throw new TypeError('Invalid source')
        let model = new this.constructor()
        Object.keys(model).forEach(key => {
            if (model.hasOwnProperty(key)) {
                model[key] = source[key]
            }
        })

        return model
    }

    projectTo(destination) {
        throw new Error('Refactor!')
        if (!destination) throw new TypeError('Invalid destination')
        Object.assign(destination, this)
    }

/*    toJSON() {
        return {...this}
    }*/
}

module.exports = Model