const EventEmitter = require('events')
const IPC = require('node-ipc').IPC
const sprintf = require('sprintf-js').sprintf

class IPCClient extends EventEmitter {
    constructor(id, connectID) {
        super()

        this._id = id
        this._connectID = connectID

        this._ipc = new IPC()
        this._ipc.config.id = id
        this._ipc.config.silent = true

        this._messageHandler = new MessageHandler()
    }

    _addEventListeners() {
        this._ipc.of[this._connectID].on('connect', () => {
            this.emit('connect')
        })

        this._ipc.of[this._connectID].on('message', (data) => {
            this._messageHandler.handleMessage(data.message)

            this.emit('receive', data.message)
        })

        this._ipc.of[this._connectID].on('disconnect', () => {
            this.emit('close')
        })

        this._ipc.of[this._connectID].on('error', (e) => {
            if (e.message.startsWith('connect ECONNREFUSED')) {
                setTimeout(() => {
                    this._socket.connect(PORT, HOST)
                }, 5000)
            } else {
                console.log(e.name + ': ' + e.message)
            }

            this.emit('error', e)
        })
    }

    connect() {
        this._ipc.connectTo(this._connectID, () => {
            this._addEventListeners()
        })
    }

    disconnect() {
        this._ipc.disconnect(this._ipc._connectID)
    }

    send(message) {
        this._ipc.of[this._connectID].emit(
            'message',
            {
                id: this._id,
                message: message
            }
        )

        this.emit('send', message)
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

    // _addEventListeners() {
    //     this.on('ping', (message) => {
    //         this._client.send(JSON.stringify({
    //             type: 'ping',
    //             message: null
    //         }))
    //
    //         this._client.emit('ping')
    //     })
    //
    //     this.on('telemetry.data', (message) => {
    //         this._client.emit('telemetry', message)
    //     })
    // }

    handleMessage(message) {
        message = JSON.parse(message)

        if (message.message !== null) {
            message.type += '.' + message.message.type
            delete message.message.type
        }

        if (this.listenerCount(message.type)) {
            this.emit(message.type, message.message)
        } else {
            console.error('Unhandled message type: \'' + message.type + '\'')
        }
    }
}

module.exports = IPCClient
