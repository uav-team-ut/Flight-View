'use strict';

const EventEmitter = require('events')

class MessageBuffer extends EventEmitter {
    constructor() {
        super()

        this._newData = ''
        this._nextLength = 0
    }

    addString(string) {
        this._newData += string

        if (this._newData.length >= 8) {
            this._nextLength = parseInt(this._newData.substring(0, 8))
        }

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

module.exports = MessageBuffer
