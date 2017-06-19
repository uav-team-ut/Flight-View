'use strict';

const Datastore = require('./datastore');
const flightViewTypes = require('../../util/types');

const Telemetry = flightViewTypes.Telemetry;

class TelemetryDatastore extends Datastore {
    constructor(useArchive, isArchive) {
        super({
            filename: 'telemetry.db',
            'use-archive': useArchive,
            'is-archive': isArchive,
            persistent: false
        });

        this.ensureIndex({
            fieldName: 'time',
            unique: true
        });
    }

    _getCloseTelemetry(time, deleteID) {
        let count = this.count;

        if (count == 0) {
            return Promise.resolve(null);
        }

        return this.findOne({time: {$gte: time}}).then((doc) => {
            if (doc === null) {
                let index = count;

                return this.findID(index).then((doc2) => [doc2]);
            } else if (doc._id === '1' || doc.time === time) {
                return [doc];
            } else {
                let index = parseInt(doc._id) - 1;

                return this.findID(index).then((doc2) => [doc, doc2]);
            }
        });
    }

    getNearest(time, returnID) {
        return this._getCloseTelemetry(time).then((docs) => {
            if (docs === null) {
                return null;
            }

            let index;

            if (docs.length === 1 || Math.abs(docs[0].time - time) <=
                    Math.abs(docs[1].time - time)) {
                index = 0;
            } else {
                index = 1;
            }

            let id = docs[index]._id;
            delete docs[index]._id;

            if (!returnID) return Telemetry.fromDocument(docs[index]);
            else return [Telemetry.fromDocument(docs[index]), id];
        });
    }

    getApprox(time) {
        return this._getCloseTelemetry(time).then((docs) => {
            if (docs.length === 1) {
                delete docs[0]._id;

                return Telemetry.fromDocument(docs[0]);

            } else {
                let averaged_doc = {};

                let ratio = (time - docs[1].time) /
                        (docs[0].time - docs[1].time);

                for (let key in docs[0]) {
                    if (docs[0].hasOwnProperty(key) && key !== '_id') {
                        averaged_doc[key] = ratio *
                                (docs[0][key] - docs[1][key]) + docs[1][key];
                    }
                }

                return Telemetry.fromDocument(averaged_doc);
            }
        });
    }

    getAlt(time) {
        if (this.count === 0) {
            return Promise.resolve(null);
        }

        return this.findOne({time: {$gte: time}}).then((doc) => {
            if (doc !== null) return Telemetry.fromDocument(doc);
            else return null;

            // return new Promise((resolve, reject) => {
            //     this.oldFind({}).sort({time: -1}).limit(1).exec((doc2) => {
            //         if (doc2 === null) {
            //             console.log('well crap this is bad');
            //
            //             resolve(null);
            //             return;
            //         }
            //
            //         resolve(Telemetry.fromDocument(doc2));
            //     });
            // });
        });
    }
}

module.exports = TelemetryDatastore;
