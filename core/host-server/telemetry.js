const telem = require('./proto/messages').telemetry;

const request = require('superagent');
const addProtobuf = require('superagent-protobuf');

addProtobuf(request);

class Telemetry {
  constructor(server) {
    this._server = server;
    this._url = process.env.TELEMETRY_URL || '127.0.0.1:5000';
    this._polling = true;

    this.start();
  }

  start() {
    console.log('Starting telemetry poller');

    this._poll();
    this._pollWaypoints();
  }

  close() {
    this._polling = false;
  }

  async _poll() {
    if (!this._polling) return;

    this._server.broadcast({
      type: 'telemetry',
      message: (await request
        .get(`${this._url}/api/overview`)
        .proto(telem.Overview)
        .timeout(5000)).body
    });

    setTimeout(() => this._poll(), 500);
  }

  async _pollWaypoints() {
    if (!this._polling) return;

    this._server.broadcast({
      type: 'waypoints',
      message: {
        mission_waypoints: (await request
          .get(`${this._url}/api/raw-mission`)
          .proto(telem.RawMission)
          .timeout(5000)).body
      }
    });

    setTimeout(() => this._pollWaypoints(), 2500);
  }
}

module.exports = Telemetry;
