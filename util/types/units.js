'use strict';

exports.TIME = {
    name: 'time',
    type: 'number',
    unit: {
        seconds: {
            default: true,
            format: '{} s'
        }
    },
    default: 0
};

exports.LENGTH = {
    name: 'length',
    type: 'number',
    unit: {
        meters: {
            default: true,
            format: '{} m'
        },
        feet: {
            default: false,
            format: '{} ft',
            convertFrom: (feet) => {
                return feet * 0.3048;
            },
            convertTo: (meters) => {
                return meters / 0.3048;
            }
        }
    },
    default: 0
};

exports.ANGLE = {
    name: 'angle',
    type: 'number',
    unit: {
        degrees: {
            default: true,
            format: '{} deg'
        },
        radians: {
            default: false,
            format: '{} rad',
            convertFrom: (radians) => {
                return radians * 180 / Math.PI;
            },
            convertTo: (degrees) => {
                return degrees * Math.PI / 180;
            }
        }
    },
    default: 0
};

exports.SPEED = {
    name: 'speed',
    type: 'number',
    unit: {
        metersPerSecond: {
            default: true,
            format: '{} m/s'
        },
        feetPerSecond: {
            default: false,
            format: '{} ft/s',
            convertFrom: exports.LENGTH.unit.feet.convertFrom,
            convertTo: exports.LENGTH.unit.feet.convertTo
        },
        knots: {
            default: false,
            format: '{} kt',
            convertFrom: (knots) => {
                return knots * 0.514444;
            },
            convertTo: (metersPerSecond) => {
                return metersPerSecond / 0.514444;
            }
        }
    },
    default: 0
};

exports.VOLTAGE = {
    name: 'voltage',
    type: 'number',
    unit: {
        volts: {
            default: true,
            format: '{} V'
        }
    },
    default: 0
};

exports.CURRENT = {
    name: 'current',
    type: 'number',
    unit: {
        amps: {
            default: true,
            format: '{} A'
        }
    },
    default: 0
}

exports.PERCENTAGE = {
    name: 'percentage',
    type: 'number',
    unit: {
        percent: {
            default: true,
            format: '{}%'
        }
    },
    default: 0
};
