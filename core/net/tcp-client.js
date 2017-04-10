'use strict';

const Socket = require('net').Socket;

const sprintf = require('sprintf-js').sprintf;

const MessageBuffer = require('../../util/message-buffer');
const MessageHandler = require('../../util/message-handler');

class TCPClient extends MessageHandler {
    constructor(host, port) {
        super();

        this._host = host;
        this._port = port;

        this._socket = new Socket();
        this._messageBuffer = new MessageBuffer();

        this._addEventListeners();

        this._socket.setEncoding('utf8');
    }

    _addEventListeners() {
        this._socket.on('connect', () => {
            this.emit('connect');
        });

        this._socket.on('data', (data) => {
            this._messageBuffer.addString(data);
        });

        this._socket.on('close', (hadError) => {
            this.emit('close');
        });

        this._socket.on('error', (e) => {
            console.error(e.name + ': ' + e.message);
            this.emit('error', e);
        });

        this._messageBuffer.on('message', (message) => {
            this.handleMessage(message).catch((error) => {
                console.log(error);
            });

            this.emit('receive', message);
        });
    }

    connect() {
        this._socket.connect(this._port, this._host);
    }

    disconnect() {
        this._socket.end();
    }

    send(message) {
        messageString = JSON.stringify(message);

        let length = sprintf('%8d', messageString.length);

        if (length.length > 8) {
            console.error('Cannot send message. Too long.');
        } else {
            this._socket.write(length + messageString);
            this.emit('send', message);
        }
    }
}

module.exports = TCPClient;
