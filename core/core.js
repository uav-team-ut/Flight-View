'use strict';

const Database = require('./db/db');
const IPCServer = require('./net/base/ipc-server');
const HostServer = require('./net/host-server');

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

    activeServer = new HostServer(message.port, coreServer, false);

    activeServer.listen();
});

coreServer.onMessage('stop', (message, socket) => {
    console.log('Stopping.');

    activeServer.stopListening();
});

coreServer.listen();
