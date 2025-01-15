const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fileURLToPath } = require('url');

function createWindow(){
  const win = new BrowserWindow({
    width:800,
    height:600,
    webPreferences: {
      enableRemoteModule: true
    }
  })
  win.loadURL('http://localhost:5173')
}

app.on('ready',createWindow)