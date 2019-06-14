const IPCServer = require('./net/ipc-server');
const HostServer = require('./host-server');

const mapboxStatic = require('../util/mapbox-static');

let coreServer = new IPCServer('core');
let activeServer = null;

coreServer.on('listening', () => {
  console.log('IPC server listening');
});

coreServer.on('connect', (socket) => {
  console.log('IPC socket connected');
});

coreServer.onMessage('start.solo', (message, socket) => {
  console.log('Starting core in Solo mode.');

  activeServer = new HostServer(coreServer, socket, false, message.port);

  activeServer.listen();
});

coreServer.onMessage('stop', (message, socket) => {
  console.log('Stopping.');

  activeServer.close();
});

coreServer.onMessage('map-cache-image', (message, socket) => {
  mapboxStatic.downloadRange(
    message.zoom,
    message.lat_1,
    message.lon_1,
    message.lat_2,
    message.lon_2,
    (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Cache download complete. It is now ready for use.');
      }
    }
  );
});

coreServer.onMessage('get-plane-mission', async (_message, _socket) => {
  await activeServer.telemetry.pollRawMission();
});

coreServer.listen();

module.exports = {
  cleanup() {
    if (activeServer !== null) {
      activeServer.close();
    }
  }
};
