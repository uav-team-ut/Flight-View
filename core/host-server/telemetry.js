'use strict';

module.exports = function Telemetry(server) {
    let telemetry = {};

    telemetry.add = (telem) => {
        server.coreSocket.send({
            type: 'telemetry',
            message: telem.serialize()
        });
    };

    return telemetry;
};
