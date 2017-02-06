'use strict';

const BaseType = require('./base-type');
const units = require('./units');

const TELEMETRY_FIELDS = {
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
    alt: {
        type: units.LENGTH
    },
    alt_msl: {
        type: units.LENGTH
    },
    yaw: {
        type: units.ANGLE,
        verify: (yaw) => {
            return 0 <= yaw && yaw <= 360;
        }
    },
    pitch: {
        type: units.ANGLE,
        verify: (pitch) => {
            return Math.abs(pitch) <= 90;
        }
    },
    roll: {
        type: units.ANGLE,
        verify: (roll) => {
            return Math.abs(roll) <= 180;
        }
    },
    cam_pitch: {
        type: units.ANGLE,
        verify: (cam_pitch) => {
            return Math.abs(cam_pitch) <= 90;
        }
    },
    cam_roll: {
        type: units.ANGLE,
        verify: (cam_roll) => {
            return Math.abs(cam_roll) < 180;
        }
    },
    airspeed: {
        type: units.SPEED
    },
    groundspeed: {
        type: units.SPEED
    },
    battery_percentage: {
        type: units.PERCENTAGE,
        verify: (battery_percentage) => {
            return 0 <= battery_percentage && battery_percentage <= 100;
        }
    },
    battery_voltage: {
        type: units.VOLTAGE,
        verify: (battery_voltage) => {
            return battery_voltage >= 0;
        }
    },
    battery_current: {
        type: units.CURRENT,
        verify: (battery_current) => {
            return battery_current >= 0;
        }
    },
    wind_speed: {
        type: units.SPEED,
        verify: (wind) => {
            return wind >= 0;
        }
    },
    wind_direction: {
        type: units.ANGLE,
        verify: (wind_direction) => {
            return 0 <= wind_direction && wind_direction <= 360;
        }
    },
    mode: {
        type: 'string',
        verify: (mode) => {
            return [
                'MANUAL',
                'STABILIZE',
                'FBWA',
                'FBWB',
                'AUTOTUNE',
                'TRAINING',
                'ACRO',
                'CRUISE',
                'AUTO',
                'RTL',
                'LOITER',
                'CIRCLE',
                'GUIDED'
            ].includes(mode);
        },
        default: 'UNKNOWN'
    },
    air_time: {
        type: units.TIME,
        verify: (time) => {
            return time >= 0;
        }
    }
};

class Telemetry extends BaseType {
    constructor(fields, options) {
        super(TELEMETRY_FIELDS, fields, options);
    }

    toAUVSITelemetry() {
        return {
            latitude: this.lat.degrees,
            longitude: this.lon.degrees,
            altitude_msl: this.alt_msl.feet,
            uas_heading: this.yaw.degrees
        };
    }

    toImageTelemetry() {
        return {
            lat: this.lat.radians,
            lon: this.lon.radians,
            alt: this.alt.meters,
            yaw: this.yaw.radians,
            pitch: this.pitch.radians,
            roll: this.roll.radians,
            cam_pitch: this.cam_pitch.radians,
            cam_roll: this.cam_roll.radians
        };
    }
}

module.exports = Telemetry;
