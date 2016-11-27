const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

app.on('ready', function() {
    let mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        title: 'Flight View'
    })

    mainWindow.loadURL('file://' + __dirname + '/index.html')

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })
})
