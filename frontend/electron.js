const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const url = require('url');
const { initialize, enable } = require('@electron/remote/main');

// Configurar auto-updater
autoUpdater.autoDownload = false; // No descargar automáticamente
autoUpdater.autoInstallOnAppQuit = false; // No instalar automáticamente al salir

// Inicializar @electron/remote
initialize();

// ===============================================
// IMPLEMENTAR INSTANCIA ÚNICA - SOLO UNA VENTANA
// ===============================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Si ya hay una instancia corriendo, salir inmediatamente
  console.log('Ya hay una instancia de la aplicación ejecutándose. Cerrando esta instancia.');
  app.quit();
} else {
  // Alguien trató de ejecutar una segunda instancia, enfocamos nuestra ventana en su lugar
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    console.log('Se intentó abrir una segunda instancia. Enfocando la ventana existente.');
    // Alguien trató de ejecutar una segunda instancia, enfocamos nuestra ventana
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
      if (mainWindow.moveTop) {
        mainWindow.moveTop();
      }
    }
  });
}

// Optimizaciones básicas y compatibles para Linux - mantener Windows intacto
if (process.platform === 'linux') {
  console.log('Aplicando configuración básica para Linux...');
  
  // Solo optimizaciones básicas y probadas
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  
  // NO forzar Wayland - detectar automáticamente
  // Solo habilitar aceleración GPU si está disponible
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
}

let store;

// Función para inicializar store de forma asíncrona
async function initializeStore() {
  try {
    const Store = await import('electron-store');
    store = new Store.default({
      name: 'user-preferences',
      defaults: {
        zoomLevel: 0, // Nivel de zoom por defecto (0 = 100%)
        windowBounds: {
          width: 1280,
          height: 800
        }
      }
    });
    return store;
  } catch (error) {
    console.error('Error al inicializar electron-store:', error);
    // Fallback en caso de error
    return {
      get: (key, defaultValue) => {
        const stored = localStorage?.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
      },
      set: (key, value) => {
        localStorage?.setItem(key, JSON.stringify(value));
      }
    };
  }
}

// Mantener una referencia global del objeto window para evitar que la ventana 
// se cierre automáticamente cuando el objeto JavaScript es recolectado por el GC.
let mainWindow;

// Función para configurar el auto-updater
function setupAutoUpdater() {
  // Verificar actualizaciones cada 30 minutos (menos frecuente)
  setInterval(() => {
    console.log('Verificando actualizaciones automáticamente...');
    autoUpdater.checkForUpdates();
  }, 30 * 60 * 1000);

  // También verificar al iniciar, pero después de 2 minutos
  setTimeout(() => {
    console.log('Verificación inicial de actualizaciones...');
    autoUpdater.checkForUpdates();
  }, 2 * 60 * 1000);

  // Eventos del auto-updater
  autoUpdater.on('checking-for-update', () => {
    console.log('Verificando actualizaciones...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Actualización disponible:', info.version);
    // Solo notificar si la ventana está enfocada o después de un delay
    if (mainWindow && mainWindow.isFocused()) {
      mainWindow.webContents.send('update-available', info);
    } else if (mainWindow) {
      // Si la ventana no está enfocada, esperar a que lo esté
      mainWindow.once('focus', () => {
        setTimeout(() => {
          if (mainWindow) {
            mainWindow.webContents.send('update-available', info);
          }
        }, 1000); // Delay de 1 segundo para no ser intrusivo
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('No hay actualizaciones disponibles');
  });

  autoUpdater.on('error', (err) => {
    console.error('Error en auto-updater:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Velocidad de descarga: ${progressObj.bytesPerSecond} - Descargado ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    console.log(logMessage);
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Actualización descargada, preparando para instalar...');
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });
}

async function createWindow() {
  console.log('Creando ventana de Electron...');
  
  // Inicializar store
  await initializeStore();
  
  // Obtener configuraciones guardadas
  const savedBounds = store.get('windowBounds', { width: 1280, height: 800 });
  const savedZoomLevel = store.get('zoomLevel', 0);
  
  // Configuración base simplificada para todas las plataformas
  const webPreferences = {
    nodeIntegration: true,
    contextIsolation: true,
    enableRemoteModule: true,
    preload: path.join(__dirname, 'preload.js'),
    zoomFactor: Math.pow(1.2, savedZoomLevel),
    // Configuraciones básicas para Linux
    ...(process.platform === 'linux' && {
      hardwareAcceleration: true,
      backgroundThrottling: false
    })
  };

  // Crear la ventana del navegador con configuración mejorada para Linux
  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: webPreferences,
    show: false,
    backgroundColor: '#2e2c29',
    autoHideMenuBar: true,
    // Configuraciones específicas para Linux (simplificadas)
    ...(process.platform === 'linux' && {
      frame: true,
      resizable: true,
      maximizable: true,
      minimizable: true,
      icon: path.join(__dirname, 'public/electron-icon.png')
    })
  });

  // Habilitar @electron/remote para esta ventana
  enable(mainWindow.webContents);

  // Configurar auto-updater después de crear la ventana
  setupAutoUpdater();

  // Restaurar el nivel de zoom guardado
  mainWindow.webContents.once('did-finish-load', () => {
    if (mainWindow) {
      mainWindow.webContents.setZoomLevel(savedZoomLevel);
      console.log(`Zoom restaurado a nivel: ${savedZoomLevel}`);
    }
  });

  // Escuchar cambios de zoom y guardarlos
  mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
    if (mainWindow && store) {
      const currentZoomLevel = mainWindow.webContents.getZoomLevel();
      store.set('zoomLevel', currentZoomLevel);
      console.log(`Zoom cambiado a nivel: ${currentZoomLevel}`);
    }
  });

  // Guardar dimensiones de ventana al redimensionar
  mainWindow.on('resize', () => {
    if (mainWindow && store) {
      const bounds = mainWindow.getBounds();
      store.set('windowBounds', { width: bounds.width, height: bounds.height });
    }
  });

  // Determinar la URL a cargar
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, './build/index.html'),
    protocol: 'file:',
    slashes: true
  });

  console.log('Cargando URL:', startUrl);
  
  // Cargar la URL en la ventana
  mainWindow.loadURL(startUrl);

  // Mostrar la ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Maximización simplificada para Linux
    if (process.platform === 'linux') {
      // Esperar un poco y luego maximizar
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('Maximizando ventana en Linux...');
          mainWindow.maximize();
        }
      }, 1000);
    } else {
      mainWindow.maximize();
    }
  });

  // Manejar evento de maximizar explícitamente para Linux
  if (process.platform === 'linux') {
    mainWindow.on('maximize', () => {
      console.log('Ventana maximizada en Linux');
    });
    
    mainWindow.on('unmaximize', () => {
      console.log('Ventana des-maximizada en Linux');
    });
  }

  // Emitido cuando la ventana es cerrada.
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Manejar IPC para zoom desde el renderer
ipcMain.handle('get-zoom-level', () => {
  return store ? store.get('zoomLevel', 0) : 0;
});

ipcMain.handle('set-zoom-level', (event, zoomLevel) => {
  if (store) {
    store.set('zoomLevel', zoomLevel);
  }
  if (mainWindow) {
    mainWindow.webContents.setZoomLevel(zoomLevel);
  }
  return zoomLevel;
});

ipcMain.handle('zoom-in', () => {
  if (mainWindow) {
    const currentLevel = mainWindow.webContents.getZoomLevel();
    const newLevel = Math.min(currentLevel + 0.5, 3); // Máximo zoom +3
    mainWindow.webContents.setZoomLevel(newLevel);
    if (store) {
      store.set('zoomLevel', newLevel);
    }
    return newLevel;
  }
  return 0;
});

ipcMain.handle('zoom-out', () => {
  if (mainWindow) {
    const currentLevel = mainWindow.webContents.getZoomLevel();
    const newLevel = Math.max(currentLevel - 0.5, -3); // Mínimo zoom -3
    mainWindow.webContents.setZoomLevel(newLevel);
    if (store) {
      store.set('zoomLevel', newLevel);
    }
    return newLevel;
  }
  return 0;
});

ipcMain.handle('reset-zoom', () => {
  if (mainWindow) {
    mainWindow.webContents.setZoomLevel(0);
    if (store) {
      store.set('zoomLevel', 0);
    }
    return 0;
  }
  return 0;
});

// IPC handlers para actualizaciones
ipcMain.handle('start-update-download', async () => {
  try {
    console.log('Iniciando descarga de actualización...');
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error al descargar actualización:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', async () => {
  console.log('Instalando actualización...');
  autoUpdater.quitAndInstall();
});

ipcMain.handle('check-for-updates', async () => {
  try {
    console.log('Verificando actualizaciones manualmente...');
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    console.error('Error al verificar actualizaciones:', error);
    return null;
  }
});

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas de navegador.
console.log('Iniciando aplicación Electron...');

// Algunas APIs pueden usarse solo después de que ocurra este evento.
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas están cerradas.
app.on('window-all-closed', function () {
  // En macOS es común que las aplicaciones y su barra de menú
  // permanezcan activas hasta que el usuario salga explícitamente con Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // En macOS es común volver a crear una ventana en la app cuando
  // el icono del dock es clickeado y no hay otras ventanas abiertas.
  if (mainWindow === null) createWindow();
}); 