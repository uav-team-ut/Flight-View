'use strict';

const BaseType = require('./base-type');
const units = require('./units');

const IMAGE_FIELDS = {
    data_original: {
        type: 'string',
        default: ''
    },
    scale_original: {
        type: units.PERCENTAGE
    },
    data_warped: {
        type: 'string',
        default: ''
    },
    scale_warped: {
        type: units.PERCENTAGE
    },
    has_warp: {
        type: 'boolean',
        default: false
    },
    time: {
        type: units.TIME,
        verify: (time) => {
            return time >= 0;
        }
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
    }
};

class Image extends BaseType {
    constructor(fields, options) {
        super(IMAGE_FIELDS, fields, options);
    }
}

module.exports = Image;
