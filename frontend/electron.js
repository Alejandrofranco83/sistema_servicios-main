const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { initialize, enable } = require('@electron/remote/main');

// Inicializar @electron/remote
initialize();

// Optimizaciones simplificadas SOLO para Linux - mantener Windows intacto
if (process.platform === 'linux') {
  console.log('Aplicando optimizaciones básicas para Linux...');
  
  // Solo optimizaciones básicas y seguras
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  
  // Desactivar sandbox solo en Linux para mejor compatibilidad
  app.commandLine.appendSwitch('no-sandbox');
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
    // Configuraciones específicas para Linux
    ...(process.platform === 'linux' && {
      frame: true, // Asegurar que tenga marco en Linux
      titleBarStyle: 'default', // Estilo de barra de título por defecto
      resizable: true, // Asegurar que sea redimensionable
      maximizable: true, // Asegurar que sea maximizable
      minimizable: true, // Asegurar que sea minimizable
      icon: path.join(__dirname, 'public/electron-icon.png') // Icono para Linux
    })
  });

  // Habilitar @electron/remote para esta ventana
  enable(mainWindow.webContents);

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

  // Mostrar la ventana cuando esté lista - configuración mejorada
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Intentar maximizar en un timeout para Linux
    if (process.platform === 'linux') {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('Intentando maximizar ventana en Linux...');
          mainWindow.maximize();
        }
      }, 500);
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