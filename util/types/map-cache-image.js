'use strict';

const BaseType = require('./base-type');
const units = require('./units');

const MAP_CACHE_IMAGE_FIELDS = {
    data: {
        type: 'string',
        default: ''
    },
    time: {
        type: units.TIME,
        verify: (time) => {
            return time >= 0;
        }
    },
    lat_1: {
        type: units.ANGLE,
        verify: (lat) => {
            return Math.abs(lat) <= 90;
        }
    },
    lon_1: {
        type: units.ANGLE,
        verify: (lon) => {
            return Math.abs(lon) <= 180;
        }
    },
    lat_2: {
        type: units.ANGLE,
        verify: (lat) => {
            return Math.abs(lat) <= 90;
        }
    },
    lon_2: {
        type: units.ANGLE,
        verify: (lon) => {
            return Math.abs(lon) <= 180;
        }
    },
};

class MapCacheImage extends BaseType {
    constructor(fields, options) {
        super(MAP_CACHE_IMAGE_FIELDS, fields, options);
    }
}

module.exports = MapCacheImage;
