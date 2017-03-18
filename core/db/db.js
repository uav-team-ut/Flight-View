'use strict';

const path = require('path');

const dateFormat = require('dateformat');
const NeDBDatastore = require('nedb');

const FlightViewTypes = require('../../util/types');

const Image = FlightViewTypes.Image;
const Telemetry = FlightViewTypes.Telemetry;

const CURRENT_DIR = path.join(__dirname, 'current');
const ARCHIVE_DIR = path.join(__dirname, 'archive', dateFormat(new Date(),
        'yyyy-mm-dd HH-MM-ss'));

class Database {
    constructor(useArchives = true) {
        this.telemetry = new TelemetryDatastore(useArchives);
        this.images = new ImageDatastore(useArchives);
    }
}

class Datastore extends NeDBDatastore {
    constructor(filename, useArchive, isArchive) {
        let filePath = !isArchive ? CURRENT_DIR : ARCHIVE_DIR;

        filePath = path.join(filePath, filename);

        super({
            filename: filePath,
            autoload: true
        });

        this.remove({}, {multi: true});
        this.persistence.compactDatafile();

        this.filename = filename;
        this.count = 0;

        if (useArchive && !isArchive) {
            this._archive = new TelemetryDatastore(false, true);
        }
    }

    insert(object) {
        return new Promise((resolve, reject) => {
            let doc = object.toDocument();

            this.count++;
            doc._id = this.count.toString();

            let id = doc._id;

            super.insert(doc, (err, newDoc) => {
                if (this._archive) {
                    this._archive.insert(doc).catch((error) => {
                        console.log('Error saving document to archive: '
                                + error);
                    });
                }

                if (err) reject(err);
                else resolve(id);
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

    findID(id) {
        if (typeof id == 'number') {
            id = id.toString();
        }

        return this.findOne({_id: id});
    }

    update(query, update, options) {
        return new Promise((resolve, reject) => {
            super.update(query, update, options, (err, numAffected,
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
        super('telemetry.db', useArchive, isArchive);

        this.ensureIndex({
            fieldName: 'time',
            unique: true
        });
    }

    _getCloseTelemetry(time, deleteID) {
        let count = this.count;

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
}

class ImageDatastore extends Datastore {
    constructor(useArchive, isArchive) {
        super('images.db', useArchive, isArchive);
    }
}

module.exports = Database;
