'use strict';

const BaseType = require('./base-type');
const targetCharacteristics = require('./target-characteristics');
const units = require('./units');

const STANDARD_TARGET_FIELDS = {
    file: {
        type: 'string',
        default: ''
    },
    lat: {
        type: units.ANGLE,
        verify: (lat) => {
            return Math.abs(lat) <= 90;
        },
        default: null
    },
    lon: {
        type: units.ANGLE,
        verify: (lon) => {
            return Math.abs(lon) <= 180;
        },
        default: null
    },
    orientation: {
        type: targetCharacteristics.ORIENTATION,
        default: null
    },
    shape: {
        type: targetCharacteristics.SHAPE,
        default: null
    },
    background_color: {
        type: targetCharacteristics.COLOR,
        default: null
    },
    alphameric: {
        type: targetCharacteristics.ALPHANUMERIC,
        default: null
    },
    alphanumeric_color: {
        type: targetCharacteristics.COLOR,
        default: null
    },
    autonomous: {
        type: 'boolean',
        default: false
    }
};

const OFF_AXIS_TARGET_FIELDS = {
    file: {
        type: 'string',
        default: ''
    },
    orientation: {
        type: targetCharacteristics.ORIENTATION,
        default: null
    },
    shape: {
        type: targetCharacteristics.SHAPE,
        default: null
    },
    background_color: {
        type: targetCharacteristics.COLOR,
        default: null
    },
    alphameric: {
        type: targetCharacteristics.ALPHANUMERIC,
        default: null
    },
    alphanumeric_color: {
        type: targetCharacteristics.COLOR,
        default: null
    }
};

const EMERGENT_TARGET_FIELDS = {
    file: {
        type: 'string',
        default: ''
    },
    lat: {
        type: units.ANGLE,
        verify: (lat) => {
            return Math.abs(lat) <= 90;
        },
        default: null
    },
    lon: {
        type: units.ANGLE,
        verify: (lon) => {
            return Math.abs(lon) <= 180;
        },
        default: null
    },
    description: {
        type: 'string',
        default: null
    }
};

exports.StandardTarget = class StandardTarget extends BaseType {
    constructor(fields, options) {
        super(STANDARD_TARGET_FIELDS, fields, options);
    }

    toAUVSITarget() {
        return {
            latitude: this.lat.degrees,
            longitude: this.lon.degrees,
            orientation: this.orientation.value,
            shape: this.shape.value,
            background_color: this.background_color.value,
            alphanumeric: this.alphanumeric.value,
            alphanumeric_color: this.alphanumeric_color.value,
            autonomous: this.autonomous.value
        };
    }
};

exports.OffAxisTarget = class OffAxisTarget extends BaseType {
    constructor(fields, options) {
        super(OFF_AXIS_TARGET_FIELDS, fields, options);
    }

    toAUVSITarget(OFF_AXIS_TARGET_FIELDS, fields, options) {
        return {
            orientation: this.orientation.value,
            shape: this.shape.value,
            background_color: this.background_color.value,
            alphanumeric: this.alphanumeric.value,
            alphanumeric_color: this.alphanumeric_color.value
        };
    }
};

exports.EmergentTarget = class EmergentTarget extends BaseType {
    constructor(fields, options) {
        super(EMERGENT_TARGET_FIELDS, fields, options);
    }

    toAUVSITarget(EMERGENT_TARGET_FIELDS, fields, options) {
        return {
            latitude: this.lat.degrees,
            longitude: this.lon.degrees,
            description: this.description.value
        };
    }
};
