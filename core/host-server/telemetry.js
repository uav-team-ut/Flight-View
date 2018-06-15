'use strict';

const request = require('request');

const TelemetryType = require('../../util/types').Telemetry;

module.exports = function Telemetry(server) {
    let telemetry = {};
    telemetry.polling = true;
    telemetry.close = function () {
        telemetry.polling = false;
    }

    console.log('Starting telemetry poller');

    telemetry._poll = function () {
        if (!telemetry.polling) return;

        request.get({
            uri: `http://${process.env.TELEMETRY_HOST || '127.0.0.1:5000'}/api/overview`,
            time: true,
            timeout: 5000,
            headers: {
                accept: 'application/json'
            }
        }, (err, res) => {
            try {
                if (err) throw err;
                const telem = JSON.parse(res.body);
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
                    battery_percentage: telem.battery ? telem.battery.percentage : undefined,
                    battery_current: telem.battery ? telem.battery.current : undefined,
                    mode: telem.mode
                };
                server.broadcast({
                    type: 'telemetry',
                    message: new TelemetryType(telemMessage).serialize()
                });
            } catch (e) {
                console.error(e);
            } finally {
                setTimeout(() => telemetry._poll(), 500);
            }
        });
    }

    telemetry._pollWaypoints = function () {
        if (!telemetry.polling) return;

        request.get({
            uri: `http://${process.env.TELEMETRY_HOST || '127.0.0.1:5000'}/api/raw-mission`,
            time: true,
            timeout: 5000,
            headers: {
                accept: 'application/json'
            }
        }, (err, res) => {
            try {
                if (err) throw err;
                const telem = JSON.parse(res.body);
                server.broadcast({
                    type: 'waypoints',
                    message: {
                        mission_waypoints: telem
                    }
                });
            } catch (e) {
                console.error(e);
            } finally {
                setTimeout(() => telemetry._pollWaypoints(), 2500);
            }
        });
    }

    telemetry._poll();
    telemetry._pollWaypoints();

    return telemetry;
};
