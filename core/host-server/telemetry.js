'use strict';

const TelemetryType = require('../../util/types').Telemetry;

module.exports = function Telemetry(server) {
    let telemetry = {};

    let recentTelem = new TelemetryType({}, {filled: true});

    telemetry.add = (telem) => {
        server.broadcast({
            type: 'telemetry',
            message: telem.serialize()
        });

        recentTelem.add(telem.toDocument());

        // FIXME: we should be able to send in partial types to the
        // database in the future
        server.db.telemetry.insert(recentTelem);

        let auvsiTelem = telem.toAUVSITelemetry();
        let fields = ['latitude', 'longitude', 'altitude_msl', 'uas_heading'];
        let send = true;

        for (let i = 0; i < fields.length; i++) {
            if (auvsiTelem[fields[i]] === undefined) {
                send = false;
                break;
            }
        }

        if (send && server.auvsiClient.loggedIn) {
            server.auvsiClient.postTelemetry(auvsiTelem, (error) => {
                if (error) console.error(error);
            });
        }
    };

    telemetry.get = (time) => {
        if (time === undefined) {
            return TelemetryType.deserialize(recentTelem.serialize());
        }

        return server.db.telemetry.getNearest(time, false)
    }

    return telemetry;
};
