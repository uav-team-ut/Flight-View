const EventEmitter = require('events')

class MessageHandler extends EventEmitter {
    constructor() {
        super()

        this._eventEmitter = new EventEmitter()
        this._eventEmitter.setMaxListeners(1)
    }

    onMessage(message, callback) {
        this._eventEmitter.on(message, callback)
    }

    handleMessage(message, socket) {
        message = JSON.parse(message)

        if (message.message !== null) {
            message.type += '.' + message.message.type
            delete message.message.type
        }

        if (this._eventEmitter.listenerCount(message.type)) {
            this._eventEmitter.emit(message.type, message.message, socket)
        } else {
            console.error('Unhandled message type: \'' + message.type + '\'')
        }
    }
}

module.exports = MessageHandler
