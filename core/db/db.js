'use strict';

const TelemetryDatastore = require('./telemetry-datastore');
const ImageDatastore = require('./image-datastore');

class Database {
    constructor(useArchives = true) {
        this.telemetry = new TelemetryDatastore(useArchives);
        this.images = new ImageDatastore(useArchives);
    }
}

module.exports = Database;
