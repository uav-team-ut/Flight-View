const db = require('./db/db.js')
const IPCServer = require('./net/ipc-server')

let ipcServer = new IPCServer('core')

ipcServer.listen()

exports.ipcServer = ipcServer
