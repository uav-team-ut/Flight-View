'use strict';

const Database = require('../db/db');
const TCPServer = require('./base/tcp-server');

class HostServer extends TCPServer {
    constructor(port, coreServer, allowListeners = true) {
        super(port);

        this._allowListeners = allowListeners;

        this._database = new Database();

        this._coreServer = coreServer;
        this._imageCorrector = null;
        this._telemetrySender = null;
        this._listeners = [];

        this._addGeneralHandlers();
        this._addImageCorrectorHandlers();
    }

    handleMessage(message, socket) {
        message = JSON.parse(JSON.stringify(message));

        let type = message.type;

        if (socket._application === undefined) {
            message.type = 'all.' + type;
            return super.handleMessage(message, socket);
        }

        message.type = socket._application + '.' + type;
        return super.handleMessage(message, socket).catch((error) => {
            if (error.message.startsWith('Unhandled')) {
                message.type = 'all.' + type;
                return super.handleMessage(message, socket);
            } else {
                return Promise.reject(error);
            }
        });
    }

    _addGeneralHandlers() {
        this.on('connect', (socket) => {
            socket.send({
                type: 'connect',
                message: {
                    type: 'request'
                }
            });
        });

        this.onMessage('all.connect.data', (message, socket) => {
            if (message.program === 'image-corrector') {
                this._imageCorrector = socket;
            } else if (message.program === 'telemetry-sender') {
                this._telemetrySender = socket;
            } else if (this._allowListeners &&
                    message.program === 'flight-view') {
                this._listeners.push(socket);
            } else {
                socket.send({
                    type: 'connect',
                    message: {
                        type: 'refuse'
                    }
                });

                socket.end();

                return;
            }

            socket._application = message.program;
            socket._pings = [];
        });

        this.onMessage('all.time.request', (message, socket) => {
            socket.send({
                type: 'time',
                message: {
                    type: 'data',
                    time: this.time
                }
            });
        });

        this.onMessage('all.ping', (message, socket) => {
            let ping = (this.time - socket._pings.shift()) * 1000;

            // TODO: store this value
            console.log(ping);
        });
    }

    _addImageCorrectorHandlers() {
        this.onMessage('image-corrector.image.alert', (message, socket) => {
            console.log('Got an image alert');

            // TODO: store this alert
        });

        this.onMessage('image-corrector.telemetry.image-request',
                (message, socket) => {
            console.log('Got an image request');

            this._database.telemetry.getApprox(message.time)
                    .then((telemetry) => {
                let returnMessage = telemetry.toImageTelemetry();
                returnMessage.type = 'image-data';
                returnMessage.number = message.number;

                socket.send({
                    type: 'telemetry',
                    message: returnMessage
                });
            }).catch((error) => {
                console.log(error);
            });
        });
    }

    get time() {
        return Date.now() / 1000;
    }

    sendPing(socket) {
        socket._pings.push(this.time);

        socket.send({
            type: 'ping',
            message: {}
        });
    }
}

module.exports = HostServer;
