'use strict';

const IPC = require('node-ipc').IPC;

const MessageHandler = require('../../../util/message-handler');

class IPCServer extends MessageHandler {
    constructor(id) {
        super();

        this._id = id;

        this._ipc = new IPC();
        this._ipc.config.id = id;
        this._ipc.config.silent = true;

        this._sockets = [];
    }

    _addEventListeners() {
        this._ipc.server.on('connect', (socket) => {
            socket.send = (message) => {
                this._ipc.server.emit(socket, 'message', {
                    id: this._id,
                    message: message
                });
            };

            this._sockets.push(socket);

            this.emit('connect', socket);
        });

        this._ipc.server.on('message', (data, socket) => {
            this.handleMessage(data.message, socket);

            this.emit('receive', data.message, socket);
        });

        this._ipc.server.on('socket.disconnect', (socket) => {
            this.emit('disconnect', socket);
        });

        this._ipc.server.on('close', () => {
            this.emit('close');
        });

        this._ipc.server.on('error', (e, socket) => {
            this.emit('error', e, socket);
        });
    }

    listen() {
        this._ipc.serve(() => {
            this._addEventListeners();

            this.emit('listening');
        });

        this._ipc.server.start();
    }

    stopListening() {
        this._ipc.server.stop();
    }

    broadcast(message) {
        for (let i = 0; i < this._sockets.length; i++) {
            this._sockets[i].send(message);
        }
    }
}

module.exports = IPCServer;
