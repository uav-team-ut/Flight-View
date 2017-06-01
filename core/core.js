'use strict';

const Database = require('./db/db');
const IPCServer = require('./net/ipc-server');
const HostServer = require('./host-server');

const mapboxStatic = require('../util/mapbox-static');

let coreServer = new IPCServer('core');
let activeServer = null;

coreServer.on('listening', () => {
    console.log('server listening');
});

coreServer.on('connect', (socket) => {
    console.log('socket connected');
});

coreServer.onMessage('start.solo', (message, socket) => {
    console.log('Running core in Solo mode.');

    activeServer = new HostServer(coreServer, socket, false, message.port);

    activeServer.listen();
});

coreServer.onMessage('stop', (message, socket) => {
    console.log('Stopping.');

    activeServer.close();
});

coreServer.onMessage('map-cache-image', (message, socket) => {
    mapboxStatic.downloadRange(message.zoom, message.lat_1, message.lon_1,
            message.lat_2, message.lon_2, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log('cache download complete');
        }
    });
});

coreServer.listen();

module.exports = {
    cleanup() {
        if (activeServer !== null) {
            activeServer.close();
        }
    }
};
