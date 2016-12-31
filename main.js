const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const core = require('./core/core')

app.on('ready', () => {
    let mainWindow = new BrowserWindow({
        width: 1200,
        height: 750,
        show: false,
        title: 'Flight View'
    })

    mainWindow.loadURL('file://' + __dirname + '/flight-view/index.html')

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    core.ipcServer.onMessage('console', () => {
        if (!mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.openDevTools({detach: true})
        } else {
            mainWindow.webContents.closeDevTools()
        }
    })
})
