const Client = require('./client').Client

const client = new Client()

client.on('connect', () => {
    console.log('CONNECTED.')
})

client.start()
