const IPCServer = require('./net/ipc-server')

let ipcServer = new IPCServer('core')

ipcServer.listen()
