const interop = require('../../proto/messages').interop;

const superagent = require('superagent');
const addProtobuf = require('superagent-protobuf');

addProtobuf(superagent);

const request = superagent.agent();

class InteropClient {
  constructor(server) {
    this._server = server;
    this._url = process.env.INTEROP_URL;
    this._running = false;
    this.start();
  }

  start() {
    this._running = true;

    const broadcastMission = async () => {
      this._server.broadcast({
        type: 'interop-mission',
        message: await this.getMission()
      });
    };

    const broadcastObstacles = async () => {
      this._server.broadcast({
        type: 'obstacles',
        message: await this.getObstacles()
      });
    };

    const broadcastTargets = async () => {
      this._server.broadcast({
        type: 'targets',
        message: await this.getTargets()
      });
    };

    const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const task = (fn, interval) => Promise.resolve().then(async () => {
      while (this._running) {
        try {
          await fn();
        } catch (err) {
          if (err.syscall !== 'getaddrinfo' && err.code !== 'ABORTED')
            console.error(err);
        } finally {
          await timeout(interval);
        }
      }
    }).catch(console.error);

    task(broadcastMission, 500);
    task(broadcastObstacles, 500);
    task(broadcastTargets, 1000);
  }

  stop() {
    this._running = false;
  }

  async getMission() {
    return (await request.get(`${this._url}/api/mission`)
      .proto(interop.InteropMission)
      .timeout(1000)).body;
  }

  async getObstacles() {
    return (await request.get(`${this._url}/api/obstacles`)
      .proto(interop.Obstacles)
      .timeout(1000)).body;
  }

  async getTargets(image = false) {
    return (await request.get(`${this._url}/api/odlcs`)
      .send({ image })
      .proto(interop.OdlcList)
      .timeout(8000)).body;
  }

  async getTarget(id, image = false) {
    return (await request.get(`${this._url}/api/odlcs/${id}`)
      .send({ image })
      .proto(interop.Odlc)
      .timeout(2000)).body;
  }
}

module.exports = InteropClient;
