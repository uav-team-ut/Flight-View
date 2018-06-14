'use strict';

const request = require('request');

const TelemetryType = require('../../util/types').Telemetry;

module.exports = function Telemetry(server) {
    let telemetry = {};

    console.log('Starting telemetry poller');

    setInterval(() => {
        request.get({
            uri: `http://${process.env.TELEMETRY_HOST || '127.0.0.1:5000'}/api/overview`,
            time: true,
            timeout: 5000,
            headers: {
                accept: 'application/json'
            }
        }, (err, res) => {
            if (err) {
                console.error(err);
                return;
            }
            const telem = JSON.parse(res.body);
            try {
                const telemMessage = {
                    lat: telem.pos.lat,
                    lon: telem.pos.lon,
                    alt: telem.alt.agl,
                    alt_msl: telem.alt.msl,
                    yaw: telem.rot.yaw,
                    pitch: telem.rot.pitch,
                    roll: telem.rot.roll,
                    airspeed: telem.speed.airspeed,
                    groundspeed: telem.speed.ground_speed,
                    battery_percentage: telem.battery.percentage,
                    battery_current: telem.battery.current
                };
                server.broadcast({
                    type: 'telemetry',
                    message: new TelemetryType(telemMessage).serialize()
                });
            } catch (e) {
                console.error(e);
            }
        });
    }, 500);

    return telemetry;
};
