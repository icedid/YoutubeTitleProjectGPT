import { app, BrowserWindow } from 'electron';


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