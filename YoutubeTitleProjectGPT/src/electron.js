import { app, BrowserWindow } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

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