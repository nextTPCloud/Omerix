// ===========================================
// TPV OMERIX - ELECTRON PRELOAD
// ===========================================

const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electron', {
  // Información del sistema
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Control de ventana
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  openDevTools: () => ipcRenderer.invoke('open-devtools'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // Eventos
  onBackendStatus: (callback) => {
    ipcRenderer.on('backend-status', (event, status) => callback(status));
  },

  // Verificar si estamos en Electron
  isElectron: true,
});
