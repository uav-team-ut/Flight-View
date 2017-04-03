'use strict';

const Datastore = require('./datastore');
const flightViewTypes = require('../../util/types');

const Image = flightViewTypes.Image;

class ImageDatastore extends Datastore {
    constructor(useArchive, isArchive) {
        super({
            filename: 'images.db',
            'use-archive': useArchive,
            'is-archive': isArchive,
            persistent: false
        });
    }
}

module.exports = ImageDatastore;
