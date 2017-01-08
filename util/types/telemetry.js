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
            return MATH.abs(lat) <= 90;
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
            return Math.abs(rol) <= 180;
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
}

module.exports = Telemetry;
