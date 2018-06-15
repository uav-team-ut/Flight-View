'use strict';

const request = require('request');

const TargetType = require('../../util/types').Target;

module.exports = function Targets(server, interop) {
    let targets = {};
    targets.polling = true;
    targets.close = function () {
        targets.polling = false;
    }

    console.log('Starting targets poller');

    targets._poll = function () {
        if (!targets.polling) return;

        try {
            interop.getTargets((targets) => {
                server.broadcast({
                    type: 'targets',
                    //message: new TargetType(targets).serialize()
                    message: targets
                });
            });
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => targets._poll(), 500);
        }
    }

    targets._poll();

    return targets;
};
