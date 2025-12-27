// ===========================================
// TPV OMERIX - ELECTRON MAIN PROCESS
// ===========================================

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

const isDev = process.env.NODE_ENV === 'development';
const NEXT_PORT = 3010;
const BACKEND_PORT = 3011;

// Crear ventana principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    fullscreen: !isDev,
    frame: isDev, // Sin marco en producción para kiosk mode
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  // Cargar la app Next.js
  const startUrl = isDev
    ? `http://localhost:${NEXT_PORT}`
    : `file://${path.join(__dirname, '../.next/server/app/index.html')}`;

  if (isDev) {
    mainWindow.loadURL(startUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, servir desde Next.js standalone
    mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);
  }

  // Prevenir navegación externa
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://localhost:${NEXT_PORT}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Iniciar backend local
function startBackend() {
  const backendPath = isDev
    ? path.join(__dirname, '../../backend')
    : path.join(process.resourcesPath, 'backend');

  backendProcess = spawn('node', ['dist/app.js'], {
    cwd: backendPath,
    env: {
      ...process.env,
      TPV_PORT: BACKEND_PORT,
      MONGODB_LOCAL_URI: 'mongodb://localhost:27017/omerix-tpv',
    },
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`[Backend] Proceso terminado con código ${code}`);
  });
}

// Inicialización de la app
app.whenReady().then(() => {
  startBackend();

  // Esperar un poco para que el backend inicie
  setTimeout(createWindow, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cerrar cuando todas las ventanas están cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill();
    }
    app.quit();
  }
});

// Cerrar backend al salir
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// ===========================================
// IPC HANDLERS
// ===========================================

// Estado del sistema
ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    version: app.getVersion(),
    backendUrl: `http://localhost:${BACKEND_PORT}`,
  };
});

// Abrir DevTools (solo en desarrollo)
ipcMain.handle('open-devtools', () => {
  if (isDev && mainWindow) {
    mainWindow.webContents.openDevTools();
  }
});

// Cerrar aplicación
ipcMain.handle('quit-app', () => {
  app.quit();
});

// Toggle fullscreen
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});
