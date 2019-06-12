class Targets {
  constructor(server, interop) {
    this._server = server;
    this._interop = interop;
    this._running = false;
    this.start();
  }

  start() {
    this._running = true;

    console.log('Starting targets poller');

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

    task(this._poll.bind(this), 500);
  }

  stop() {
    this._running = false;
  }

  async _poll() {
    this._server.broadcast({
      type: 'targets',
      message: await this._interop.getTargets()
    });
  }
}

module.exports = Targets;
