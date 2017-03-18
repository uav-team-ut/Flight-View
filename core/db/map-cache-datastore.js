'use strict';

const Datastore = require('./datastore');
const MapCacheImage = require('../../util/types').MapCacheImage;

class MapCacheDatastore extends Datastore {
    constructor() {
        super({
            filename: 'map-cache.db',
            persistent: true
        });
    }

    getImages() {
        return this.find({}).then((doc) => {
            if (doc == null) {
                return [];
            }

            if (Array.isArray(doc)) {
                let list = [];

                for (let inner in doc) {
                    if (doc.hasOwnProperty(inner)) {
                        delete doc[inner]._id;

                        list.push(MapCacheImage.fromDocument(doc[inner]));
                    }
                }

                list.sort((mapCache) => mapCache.time);

                return list;
            }

            delete doc._id;

            return [MapCacheImage.fromDocument(doc)];
        });
    }
}

module.exports = MapCacheDatastore;
