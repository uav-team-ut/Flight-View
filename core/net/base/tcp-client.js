'use strict';

/**
 * Contains the TCPClient class.
 *
 * @module core/net/base/tcp-client
 */

const Socket = require('net').Socket;

const sprintf = require('sprintf-js').sprintf;

const MessageBuffer = require('../../../util/message-buffer');
const MessageHandler = require('../../../util/message-handler');

/**
 *
 * TODO: asldf
 *
 * @extends MessageHandler
 * @emits   module:core/net/base/tcp-client~TCPClient#connect
 * @emits   module:core/net/base/tcp-client~TCPClient#close
 * @emits   module:core/net/base/tcp-client~TCPClient#error
 * @emits   module:core/net/base/tcp-client~TCPClient#send
 * @emits   module:core/net/base/tcp-client~TCPClient#receive
 */
class TCPClient extends MessageHandler {
    /**
     * Create a new TCPClient.
     *
     * <p>The client will not automatically connect to the server. To
     * connect see [send]{@link module:core/net/base/tcp-client~TCPClient#send}.
     *
     * @param {String} host The hont to connect to.
     * @param {Number} port The port to connect to.
     */
    constructor(host, port) {
        super();

        this._host = host;
        this._port = port;

        this._socket = new Socket();
        this._messageBuffer = new MessageBuffer();

        this._addEventListeners();

        this._socket.setEncoding('utf8');
    }

    /**
     * Make the required event listeners for the socket and the
     * message buffer.
     *
     * @private
     */
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

    /**
     * Connect to the server.
     *
     * <p>A connect event will be fired on success.
     */
    connect() {
        this._socket.connect(this._port, this._host);
    }

    /**
     * Close the conection with the server.
     *
     * <p>A close event will be fired on success.
     */
    disconnect() {
        this._socket.end();
    }

    /**
     * Send a message to the server.
     *
     * <p>The message will be sent a JSON string to the other end.
     * The message should only contain a <code>type</code> and
     * <code>message</code> property so that it can be read on the
     * other side.
     *
     * <p>A send event will be fired on success.
     *
     * @param {Object} message The message to be sent.
     */
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

/**
 * TCPClient connect event.
 *
 * <p>Fires after the TCPClient has established a
 * connection with a server.
 *
 * @event module:core/net/base/tcp-client~TCPClient#connect
 */

/**
 * TCPClient close event.
 *
 * <p>Fires after the TCPClient has been closed, wether
 * safely or by an error.
 *
 * @event module:core/net/base/tcp-client~TCPClient#close
 */

/**
 * TCPClient error event.
 *
 * <p>Fires after the TCPClient has an error.
 *
 * @event module:core/net/base/tcp-client~TCPClient#error
 * @type  {String}
 */

/**
 * TCPClient send event.
 *
 * <p>Fires after the TCPClient has a sent a message.
 *
 * @event module:core/net/base/tcp-client~TCPClient#send
 * @type  {Object}
 */

/**
 * TCPClient receive event.
 *
 * <p>Fires after the TCPClient has a received a message.
 *
 *
 *
 * @event module:core/net/base/tcp-client~TCPClient#receive
 * @type  {Object}
 */

module.exports = TCPClient;
