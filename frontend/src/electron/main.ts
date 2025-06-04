import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as remoteMain from '@electron/remote/main';
import '../types/electron';

// Importar electron-store con any para evitar problemas de tipos
const Store = require('electron-store');

// Inicializar remote
remoteMain.initialize();

// Declarar mainWindow antes de la lógica de instancia única
let mainWindow: BrowserWindow | null = null;

// Implementar instancia única SIEMPRE (desarrollo y producción)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Si ya hay una instancia corriendo, salir inmediatamente
  console.log('Ya hay una instancia de la aplicación ejecutándose. Cerrando esta instancia.');
  app.quit();
} else {
  // Alguien trató de ejecutar una segunda instancia, enfocamos nuestra ventana en su lugar
  app.on('second-instance', (event: Electron.Event, commandLine: string[], workingDirectory: string) => {
    console.log('Se intentó abrir una segunda instancia. Enfocando la ventana existente.');
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
      mainWindow.moveTop();
    }
  });
}

// Inicializar store para persistir configuraciones
const store = new Store({
  name: 'user-preferences',
  defaults: {
    zoomLevel: 0, // Nivel de zoom por defecto (0 = 100%)
    windowBounds: {
      width: 1200,
      height: 800
    }
  }
});

/**
 * Crea la ventana principal de la aplicación
 */
function createWindow() {
  // Obtener configuraciones guardadas
  const savedBounds = store.get('windowBounds') || { width: 1200, height: 800 };
  const savedZoomLevel = store.get('zoomLevel') || 0;

  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      zoomFactor: Math.pow(1.2, savedZoomLevel), // Convertir nivel a factor de zoom
    },
  });

  // Habilitar remote para esta ventana
  if (mainWindow) {
    remoteMain.enable(mainWindow.webContents);
  }

  // Restaurar el nivel de zoom guardado
  mainWindow.webContents.once('did-finish-load', () => {
    if (mainWindow) {
      mainWindow.webContents.setZoomLevel(savedZoomLevel);
    }
  });

  // Escuchar cambios de zoom y guardarlos
  mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
    if (mainWindow) {
      const currentZoomLevel = mainWindow.webContents.getZoomLevel();
      store.set('zoomLevel', currentZoomLevel);
      console.log(`Zoom cambiado a nivel: ${currentZoomLevel}`);
    }
  });

  // Guardar dimensiones de ventana al redimensionar
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      store.set('windowBounds', { width: bounds.width, height: bounds.height });
    }
  });

  // Cargar la URL principal de la aplicación
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Manejar IPC para zoom desde el renderer
ipcMain.handle('get-zoom-level', (): number => {
  return store.get('zoomLevel') || 0;
});

ipcMain.handle('set-zoom-level', (_event: IpcMainInvokeEvent, zoomLevel: number): number => {
  store.set('zoomLevel', zoomLevel);
  if (mainWindow) {
    mainWindow.webContents.setZoomLevel(zoomLevel);
  }
  return zoomLevel;
});

ipcMain.handle('zoom-in', (): number => {
  if (mainWindow) {
    const currentLevel = mainWindow.webContents.getZoomLevel();
    const newLevel = Math.min(currentLevel + 0.5, 3); // Máximo zoom +3
    mainWindow.webContents.setZoomLevel(newLevel);
    store.set('zoomLevel', newLevel);
    return newLevel;
  }
  return 0;
});

ipcMain.handle('zoom-out', (): number => {
  if (mainWindow) {
    const currentLevel = mainWindow.webContents.getZoomLevel();
    const newLevel = Math.max(currentLevel - 0.5, -3); // Mínimo zoom -3
    mainWindow.webContents.setZoomLevel(newLevel);
    store.set('zoomLevel', newLevel);
    return newLevel;
  }
  return 0;
});

ipcMain.handle('reset-zoom', (): number => {
  if (mainWindow) {
    mainWindow.webContents.setZoomLevel(0);
    store.set('zoomLevel', 0);
    return 0;
  }
  return 0;
});

// Establecer la impresora predeterminada al inicio
app.whenReady().then(async () => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Salir cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});