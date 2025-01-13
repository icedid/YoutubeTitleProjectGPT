import { app, BrowserWindow } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

function createWindow() {
  const __dirname = dirname(fileURLToPath(import.meta.url));

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Allows Node.js integration in the renderer process
      contextIsolation: false, // Make sure this is set to false if you are using Node.js features
    },
  });

  // If we're in development mode, load the React app from localhost
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:300');
  } else { 
    // In production mode, load the built React app from the build directory
    win.loadFile(path.join(__dirname, 'index.html'));
  }

  // Optionally, open the DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

// Electron's app is ready to start
app.whenReady().then(() => {
  createWindow();

  // macOS: when the app is activated, create a new window if none are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Close the app when all windows are closed (except on macOS where it's common to leave the app running)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
