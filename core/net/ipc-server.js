const EventEmitter = require('events')
const IPC = require('node-ipc').IPC
const sprintf = require('sprintf-js').sprintf

class IPCServer extends EventEmitter {
    constructor(id) {
        super()

        this._id = id

        this._ipc = new IPC()
        this._ipc.config.id = id
        this._ipc.config.silent = true

        this._messageHandler = new MessageHandler()

        this._sockets = []
    }

    _addEventListeners() {
        this._ipc.server.on('connect', (socket) => {
            this.emit('connect', socket)
        })

        this._ipc.server.on('message', (data, socket) => {
            this._messageHandler.handleMessage(data.message, socket)

            this.emit('receive', data.message, socket)
        })

        this._ipc.server.on('socket.disconnect', (socket) => {
            this.emit('disconnect', socket)
        })

        this._ipc.server.on('close', () => {
            this.emit('close')
        })

        this._ipc.server.on('error', (e, socket) => {
            this.emit('error', e, socket)
        })
    }

    listen() {
        this._ipc.serve(() => {
            this._addEventListeners()

            this.emit('listening')
        })

        this._ipc.server.start()
    }

    stopListening() {
        this._ipc.server.stop()
    }

    send(socket, message) {
        this._ipc.server.emit(
            socket,
            'message',
            {
                id: this._id,
                message: message
            }
        )
    }

    broadcast(message) {
        for (let i = 0; i < this._sockets.length; i++) {
            this.send(this._sockets[i], message)
        }
    }

    onMessage(message, callback) {
        this._messageHandler.on(message, callback)
    }
}

class MessageHandler extends EventEmitter {
    constructor() {
        super()

        this.setMaxListeners(1)
    }

    handleMessage(message, socket) {
        message = JSON.parse(message)

        if (message.message !== null) {
            message.type += '.' + message.message.type
            delete message.message.type
        }

        if (this.listenerCount(message.type)) {
            this.emit(message.type, message.message, socket)
        } else {
            console.error('Unhandled message type: \'' + message.type + '\'')
        }
    }
}

module.exports = IPCServer
