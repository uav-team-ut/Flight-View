const Client = require('./client').Client

const client = new Client()

client.on('connect', () => {
    console.log('CONNECTED.')
})

client.on('telemetry', (message) => {
    test.innerHTML = (JSON.stringify(message, null, '\t'))
})

// // FOR CHECKING MESSAGES IN AND OUT
// client.on('send', (message) => {
//     console.log('Sending: ' + message)
// })
//
// client.on('receive', (message) => {
//     console.log('Received: ' + message)
// })

// Make sure this happens after all things are loaded.
client.start()
