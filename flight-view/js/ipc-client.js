'use strict';

const IPC = require('node-ipc').IPC;

const MessageHandler = require('../../util/message-handler');

class IPCClient extends MessageHandler {
    constructor(id, connectID) {
        super();

        this._id = id;
        this._connectID = connectID;

        this._ipc = new IPC();
        this._ipc.config.id = id;
        this._ipc.config.silent = true;
    }

    _addEventListeners() {
        this._ipc.of[this._connectID].on('connect', () => {
            this.emit('connect');
        });

        this._ipc.of[this._connectID].on('message', (data) => {
            this.handleMessage(data.message);

            this.emit('receive', data.message);
        });

        this._ipc.of[this._connectID].on('disconnect', () => {
            this.emit('close');
        });

        this._ipc.of[this._connectID].on('error', (e) => {
            if (!e.message.startsWith('connect ECONNREFUSED')) {
                console.log(e.name + ': ' + e.message);
            }

            this.emit('error', e);
        });
    }

    connect() {
        this._ipc.connectTo(this._connectID, () => {
            this._addEventListeners();
        });
    }

    disconnect() {
        this._ipc.disconnect(this._ipc._connectID);
    }

    send(message) {
        this._ipc.of[this._connectID].emit('message', {
            id: this._id,
            message: message
        });

        this.emit('send', message);
    }
}

module.exports = IPCClient;
