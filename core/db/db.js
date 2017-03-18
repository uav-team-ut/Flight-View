'use strict';

const TelemetryDatastore = require('./telemetry-datastore');
const ImageDatastore = require('./image-datastore');
const MapCacheDatastore = require('./map-cache-datastore');

class Database {
    constructor(useArchives = true) {
        this.telemetry = new TelemetryDatastore(useArchives);
        this.images = new ImageDatastore(useArchives);
        this.mapCache = new MapCacheDatastore();
    }
}

module.exports = Database;
