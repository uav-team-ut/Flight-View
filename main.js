const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const dotenv = require('dotenv');

const core = require('./core');

dotenv.config();

app.on('ready', () => {
  let mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    title: 'UAV Austin - Flight View',
    show: false,
    webPreferences: {
      devTools: true
    }
  });

  mainWindow.loadURL('file://' + __dirname + '/flight-view/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
});

app.on('quit', () => {
  core.cleanup();
});
