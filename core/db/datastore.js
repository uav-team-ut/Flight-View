'use strict';

const path = require('path');

const dateFormat = require('dateformat');
const NeDBDatastore = require('nedb');

class Datastore extends NeDBDatastore {
    constructor(options) {
        let filename = options.filename;
        let useArchive = options['use-archive'] || false;
        let isArchive = options['is-archive'] || false;
        let persistent = options.persistent || false;

        let filePath;

        if (persistent) {
            filePath = path.join(__dirname, '../..', '.data/db', 'persistent');
        } else if (!isArchive) {
            filePath = path.join(__dirname, '../..', '.data/db', 'current');
        } else {
            filePath = path.join(__dirname, '../..', '.data/db', 'archive',
                    dateFormat(new Date(), 'yyyy-mm-dd HH-MM-ss'));
        }

        filePath = path.join(filePath, filename);

        super({
            filename: filePath,
            autoload: true
        });

        if (!persistent) {
            this.clear();

            this.count = 0;
        }

        this.filename = filename;
        this.persistent = persistent;

        if (useArchive && !isArchive) {
            let archiveOptions = JSON.parse(JSON.stringify(options));

            archiveOptions['is-archive'] = true;

            this._archive = new Datastore(archiveOptions);
        }
    }

    insert(object) {
        return new Promise((resolve, reject) => {
            let doc = object.toDocument();

            if (!this.persistent) {
                this.count++;
                doc._id = this.count.toString();
            }

            super.insert(doc, (err, newDoc) => {
                if (this._archive) {
                    this._archive.insert(doc).catch((error) => {
                        console.log('Error saving document to archive: '
                                + error);
                    });
                }

                if (err) reject(err);
                else resolve(newDoc._id);
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

    clear() {
        this.remove({}, {multi: true});
        this.persistence.compactDatafile();
    }
}

module.exports = Datastore;
