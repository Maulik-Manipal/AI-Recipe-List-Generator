const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'icon.ico'),
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start backend services before creating the window
app.whenReady().then(() => {
  // Start Python service
  exec('start "" cmd /c "cd backend\\food-service && python app.py"', (err) => {
    if (err) console.error('Failed to start Python service:', err);
  });

  // Start Node.js server
  exec('start "" cmd /c "cd backend && node server.js"', (err) => {
    if (err) console.error('Failed to start Node.js server:', err);
  });

  // Wait a bit to ensure both services start
  setTimeout(createWindow, 8000);
});

app.on('window-all-closed', () => {
  // Quit app on all platforms
  if (process.platform !== 'darwin') app.quit();
});
