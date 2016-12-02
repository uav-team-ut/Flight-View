const EventEmitter = require('events')
const Socket = require('net').Socket
const sprintf = require('sprintf-js').sprintf

const HOST = '127.0.0.1'
const PORT = 25000

class Client extends EventEmitter {
    constructor() {
        super()

        this._started = false
        this._socket = new Socket()
        this._messageHandler = new MessageHandler(this)

        this._newData = ''
        this._nextLength = 0

        this._addEventListeners()

        this._socket.setEncoding('utf8')
        this._socket.connect(PORT, HOST)
    }

    _addEventListeners() {
        this._socket.on('connect', () => {
            console.log('Connected to core.')

            this.emit('connect')
        })

        this._socket.on('data', (data) => {
            this._newData += data

            if (this._started) {
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

                    this._messageHandler.handleMessage(message)
                    this.emit('receive', message)
                }
            }
        })

        this._socket.on('close', (had_error) => {
            console.log('Connection lost with core.')

            this.emit('close')
        })

        this._socket.on('error', (e) => {
            if (e.message.startsWith('connect ECONNREFUSED')) {
                console.log('Could not connect to core... trying again.')

                setTimeout(() => {
                    this._socket.connect(PORT, HOST)
                }, 5000)
            } else {
                console.log(e.name + ': ' + e.message)
            }

            this.emit('error', e)
        })
    }

    _handleNewMessages() {

    }

    send(message) {
        length = sprintf('%8d', message.length)

        if (length.length > 8) {
            console.error('Cannot send message. Too long.')
        } else {
            this._socket.write(length + message, 'utf8')
            this.emit('send', length + message)
        }
    }

    start() {
        this._started = true

        this._handleNewMessages()
    }
}

class MessageHandler extends EventEmitter {
    constructor(client) {
        super()

        this._client = client

        this.setMaxListeners(1)
        this._addEventListeners()
    }

    _addEventListeners() {
        this.on('connect.request', (message) => {
            this._client.send(JSON.stringify({
                type: 'connect',
                message: {
                    type: 'data',
                    program: 'flight-view'
                }
            }))
        })

        this.on('ping', (message) => {
            this._client.send(JSON.stringify({
                type: 'ping',
                message: null
            }))

            this._client.emit('ping')
        })

        this.on('telemetry.data', (message) => {
            this._client.emit('telemetry', message)
        })
    }

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

exports.Client = Client
