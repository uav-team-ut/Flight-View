'use strict';

const net = require('net');

const sprintf = require('sprintf-js').sprintf;

const MessageBuffer = require('../../util/message-buffer');
const MessageHandler = require('../../util/message-handler');

class TCPServer extends MessageHandler {
    constructor(port, maxClients) {
        super();

        this._port = port;

        this._server = net.createServer((socket) => {
            socket.setEncoding('utf8');
            socket._messageBuffer = new MessageBuffer();

            socket.send = (message) => {
                message = JSON.parse(message);

                let length = sprintf('%8d', message.length);

                if (length.length > 8) {
                    console.error('Cannot send message. Too long.');
                } else {
                    socket.write(length + message);
                    this.emit('send', length + message, socket);
                }
            };

            this._sockets.push(socket);

            this._addEventListeners(socket);

            this.emit('connect', socket);
        });

        if (maxClients !== undefined) {
            this._server.maxConnections = maxClients;
        }

        this._sockets = [];
    }

    _addEventListeners(socket) {
        socket.on('data', (data) => {
            socket._messageBuffer.addString(data);
        });

        socket.on('close', (hadError) => {
            this.emit('disconnect', socket);
        });

        socket.on('error', (e) => {
            console.log(e.name + ': ' + e.message);

            this.emit('error', e, socket);
        });

        this._server.on('close', () => {
            this.emit('close');
        });

        this._server.on('error', (e) => {
            console.log(e.name + ': ' + e.message);

            this.emit('error', e);
        });

        this._server.on('listening', () => {
            this.emit('listening');
        });

        socket._messageBuffer.on('message', (message) => {
            this.handleMessage(message, socket);

            this.emit('receive', message, socket);
        });
    }

    listen() {
        this._server.listen(this._port);
    }

    stopListening() {
        this._server.close();
    }

    broadcast(message) {
        for (let i = 0; i < this._sockets.length; i++) {
            this._sockets[i].send(message);
        }
    }
}

module.exports = TCPServer;
