'use strict';

const EventEmitter = require('events');

class MessageHandler extends EventEmitter {
    constructor() {
        super();

        this._callbacks = {};
    }

    onMessage(message, callback) {
        this._callbacks[message] = (message, socket) => {
            return new Promise((resolve, reject) => {
                callback(message, socket);

                resolve();
            });
        }
    }

    handleMessage(message, socket) {
        message = JSON.parse(JSON.stringify(message));

        if (message.message && message.message.type) {
            message.type += '.' + message.message.type;
            delete message.message.type;
        }

        if (this._callbacks.hasOwnProperty(message.type)) {
            return this._callbacks[message.type](message.message, socket);
        } else {
            return Promise.reject(new Error('Unhandled message type: \'' +
                    message.type + '\''));
        }
    }
}

module.exports = MessageHandler;
