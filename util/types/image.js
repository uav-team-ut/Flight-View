'use strict';

const BaseType = require('./base-type');
const units = require('./units');

const IMAGE_FIELDS = {
    file_original: {
        type: 'string',
        default: ''
    },
    file_warped: {
        type: 'string',
        default: ''
    },
    lat: {
        type: units.ANGLE,
        verify: (lat) => {
            return Math.abs(lat) <= 90;
        }
    },
    lon: {
        type: units.ANGLE,
        verify: (lon) => {
            return Math.abs(lon) <= 180;
        }
    },
    width: {
        type: units.LEGNTH,
        verify: (width) => {
            return width >= 0;
        }
    },
    height: {
        type: units.LENGTH,
        verify: (height) => {
            return height >= 0;
        }
    },
    processed: {
        type: 'boolean',
        default: false
    }
};

class Image extends BaseType {
    constructor(fields, options) {
        super(IMAGE_FIELDS, fields, options);
    }
}

module.exports = Image;
