'use strict';

module.exports = function Telemetry(server) {
    let telemetry = {};

    telemetry.add = (telem) => {
        server.broadcast({
            type: 'telemetry',
            message: telem.serialize()
        });

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

    return telemetry;
};
