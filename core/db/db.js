'use strict';

const path = require('path');

const dateFormat = require('dateformat');
const NeDBDatastore = require('nedb');

const Telemetry = require('../../util/types/telemetry');

const CURRENT_DIR = path.join(__dirname, 'current');
const ARCHIVE_DIR = path.join(__dirname, 'archive');

class Database {
    constructor(useArchives) {
        this.telemetry = new TelemetryDatastore(useArchives);
    }
}

class Datastore extends NeDBDatastore {
    insert(doc) {
        return new Promise((resolve, reject) => {
            super.insert(doc, (err, doc) => {
                if (err) reject(err);
                else resolve(doc);
            });
        });
    }

    find(query) {
        return new Promise((resolve, reject) => {
            super.find(query, (err, doc) => {
                if (err) reject(err);
                else resolve(doc);
            });
        });
    }

    findOne(query) {
        return new Promise((resolve, reject) => {
            super.findOne(query, (err, doc) => {
                if (err) reject(err);
                else resolve(doc);
            });
        });
    }

    update(query, update, options) {
        return new Promise((resolve, reject) => {
            super.findOne(query, update, options, (err, numAffected,
                    affectedDocuments, upsert) => {
                if (err) reject(err);
                else resolve([numAffected, affectedDocuments, upsert]);
            });
        });
    }

    remove(query, options) {
        return new Promise((resolve, reject) => {
            super.remove(query, options, (err, numRemoved) => {
                if (err) reject(err);
                else resolve(numRemoved);
            });
        });
    }
}

class TelemetryDatastore extends Datastore {
    constructor(useArchive, isArchive) {
        let filename;

        if (!isArchive) {
            filename = CURRENT_DIR;
        } else {
            filename = path.join(ARCHIVE_DIR, dateFormat(new Date(),
                    'yyyy-mm-dd HH-MM-ss'));
        }

        filename = path.join(filename, 'telemetry.db');

        super({
            filename: filename,
            autoload: true
        });

        this.remove({}, {multi: true});
        this.persistence.compactDatafile()

        this.ensureIndex({
            fieldName: 'time',
            unique: true
        });

        this.filename = filename;
        this.count = 0;

        if (useArchive && !isArchive) {
            this._archive = new TelemetryDatastore(false, true);
        }
    }

    insertTelemetry(telemetry) {
        let doc = telemetry.toDocument();

        doc._id = this.count.toString();
        this.count++;

        let id = doc._id;

        return super.insert(doc).then((newDoc) => {
            if (this._archive) {
                this._archive.insertTelemetry(telemetry).catch((error) => {
                    console.log('Error saving telemetry to archive: ' + error);
                });
            }

            return id;
        });
    }

    _getCloseTelemetry(time, deleteID) {
        let count = this.count;

        return this.findOne({time: {$gte: time}}).then((doc) => {
            if (doc === null) {
                let index = count - 1;

                return this.findOne({_id: index.toString()}).then((doc2) => {
                    return [doc2];
                });
            } else if (doc._id === '0' || doc.time === time) {
                return [doc];
            } else {
                let index = parseInt(doc._id) - 1;

                return this.findOne({_id: index.toString()}).then((doc2) => {
                    return [doc, doc2];
                });
            }
        });
    }

    getNearest(time, returnID) {
        return this._getCloseTelemetry(time).then((docs) => {
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
        })
    }
}

module.exports = Database;
