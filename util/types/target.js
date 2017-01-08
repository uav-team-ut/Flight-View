'use strict';

const BaseType = require('./base-type');
const targetCharacteristics = require('./target-characteristics');
const units = require('./units');

STANDARD_TARGET_FIELDS = {
    lat: {
        type: units.ANGLE,
        verify: (lat) => {
            return MATH.abs(lat) <= 90;
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
    orientation = {
        type: targetCharacteristics.ORIENTATION,
        default: null
    },
    shape = {
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

OFF_AXIS_TARGET_FIELDS = {
    orientation = {
        type: targetCharacteristics.ORIENTATION,
        default: null
    },
    shape = {
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

EMERGENT_TARGET_FIELDS = {
    lat: {
        type: units.ANGLE,
        verify: (lat) => {
            return MATH.abs(lat) <= 90;
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

class StandardTarget extends BaseType {
    constructor(fields, options) {
        super(STANDARD_TARGET_FIELDS, fields, options)
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

    static deserialize(string) {
        return super.deserialize(STANDARD_TARGET_FIELDS, string);
    }
}

class OffAxisTarget extends BaseType {
    toAUVSITarget(OFF_AXIS_TARGET_FIELDS, fields, options) {
        return {
            orientation: this.orientation.value,
            shape: this.shape.value,
            background_color: this.background_color.value,
            alphanumeric: this.alphanumeric.value,
            alphanumeric_color: this.alphanumeric_color.value
        };
    }

    static deserialize(string) {
        return super.deserialize(OFF_AXIS_TARGET_FIELDS, string);
    }
}

class EmergentTarget extends BaseType {
    toAUVSITarget(EMERGENT_TARGET_FIELDS, fields, options) {
        return {
            latitude: this.lat.degrees,
            longitude: this.lon.degrees,
            description: this.description.value
        };
    }

    static deserialize(string) {
        return super.deserialize(EMERGENT_TARGET_FIELDS, string);
    }
}

exports.StandardTarget = StandardTarget;
exports.OffAxisTarget = OffAxisTarget;
exports.EmergentTarget = EmergentTarget;
