const fs = require('fs'),
    path = require('path')

module.exports = function (dir, ext, cb) {
    function walk(dir, dirPrefix) {
        fs.readdirSync(dir).forEach(function (file) {
            let fullPath = path.join(dir, file),
                stat = fs.statSync(fullPath)

            if (stat && stat.isDirectory()) {
                walk(fullPath, path.join(dirPrefix, file))
            } else if (~file.indexOf(ext)) {
                let newPath = path.basename(file, ext)
                if (dirPrefix)
                    newPath = dirPrefix.replace('\\', '/') + '/' + newPath
                cb(fullPath, newPath)
            }
        })
    }

    walk(path.join(__dirname, '../', dir), '')
}