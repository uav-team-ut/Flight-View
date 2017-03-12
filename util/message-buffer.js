'use strict';

/**
 * Contains the MessageBuffer class.
 *
 * @module util/message-buffer
 */

const EventEmitter = require('events')

/**
 * Buffer that emits events when a message has been received.
 *
 * <p>Messages are defined as being valid JSON strings and are
 * prefixed with an eight character string indicating the number of
 * characters the JSON string contains.
 *
 * <p>
 * Ex:
 * <pre>
 *    '20      {"example":"string"}'
 * </pre>
 *
 * @extends EventEmitter
 * @emits   module:util/message-buffer~MessageBuffer#message
 */
class MessageBuffer extends EventEmitter {
    /**
     * Create an empty MessageBuffer.
     */
    constructor() {
        super()

        this._newData = ''
        this._nextLength = 0
    }

    /**
     * Add a string to the buffer.
     *
     * <p>A {@link MessageBuffer#message} event will be emitted for
     * each full message found.
     *
     * @param {String} string The string to be added to the buffer.
     */
    addString(string) {
        this._newData += string

        // If the data length is at least 8 characters, find how long
        // the JSON string should be.
        if (this._newData.length >= 8) {
            this._nextLength = parseInt(this._newData.substring(0, 8))
        }

        // Loop until all messages are taken off the new data string.
        while (this._nextLength &&
                this._newData.length >= this._nextLength + 8) {

            let message = this._newData.substring(8,
                this._nextLength + 8)

            this._newData = this._newData.substring(
                this._nextLength + 8)

            if (this._newData.length >= 8) {
                this._nextLength = parseInt(
                    this._newData.substring(0, 8))
            } else {
                this._nextLength = 0
            }

            this.emit('message', message)
        }
    }
}

/**
 * Message event.
 *
 * @event module:util/message-buffer~MessageBuffer#message
 * @type  {String}
 */

module.exports = MessageBuffer
