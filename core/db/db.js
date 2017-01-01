const Datastore = require('nedb')

let db = {};

db.telemetry = new Datastore({
    filename: __dirname + '/current/telemetry.db',
    autoload: true
})

db.telemetry.remove({}, {multi: true})
db.telemetry.persistence.compactDatafile()

db.telemetry.ensureIndex({
    fieldName: 'time',
    unique: true
})

db.telemetry.oldInsert = db.telemetry.insert
db.telemetry.count = 0

db.telemetry.insert = (doc, callback) => {
    doc._id = db.telemetry.count.toString()

    db.telemetry.oldInsert(doc, callback)

    db.telemetry.count++
}

db.telemetry._getTelemetry = (time, callback, deleteID, middleCase) => {
    let count = db.telemetry.count

    db.telemetry.findOne({time: {$gte: time}}, (err, doc) => {
        if (err) {
            callback(err, doc)
        } else if (doc === null) {
            let index = count - 1

            db.telemetry.findOne({_id: index.toString()}, (err2, doc2) => {
                if (deleteID) {
                    delete doc2._id
                }

                callback(err2, doc2)
            })
        } else if (doc._id === '0') {
            if (deleteID) {
                delete doc._id
            }

            callback(err, doc)
        } else {
            let index = parseInt(doc._id) - 1

            db.telemetry.findOne({_id: index.toString()}, (err2, doc2) => {
                middleCase(err, doc, err2, doc2)
            })
        }
    })
}

db.telemetry.getNearestTelemetry = (time, callback) => {
    return db.telemetry._getTelemetry(time, callback, false,
            (err, doc, err2, doc2) => {
        if (err2) {
            callback(err2, doc2)
        } else if (Math.abs(doc.time - time) <=
                Math.abs(doc2.time - time)) {
            callback(err, doc)
        } else {
            callback(err2, doc2)
        }
    })
}

db.telemetry.getApproxTelemetry = (time, callback) => {
    return db.telemetry._getTelemetry(time, callback, true,
            (err, doc, err2, doc2) => {
        let averaged_doc = {}

        let ratio = (time - doc2.time) / (doc.time - doc2.time)

        for (let key in doc) {
            if (doc.hasOwnProperty(key) && key !== '_id') {
                averaged_doc[key] = ratio * (doc[key] - doc2[key])
                        + doc2[key]
            }
        }

        callback(err2, averaged_doc)
    })
}

module.exports = db

