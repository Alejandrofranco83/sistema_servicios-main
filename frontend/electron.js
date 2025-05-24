const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { initialize, enable } = require('@electron/remote/main');

// Inicializar @electron/remote
initialize();

// Optimizaciones SOLO para Linux - Windows queda intacto
if (process.platform === 'linux') {
  console.log('Aplicando optimizaciones para Linux...');
  
  // Habilitar aceleración de hardware para Linux
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');
  app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
  
  // Optimizaciones de rendering para Linux
  app.commandLine.appendSwitch('enable-gpu-compositing');
  app.commandLine.appendSwitch('enable-smooth-scrolling');
  app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
  app.commandLine.appendSwitch('enable-accelerated-video-decode');
  
  // Configuraciones específicas para Wayland/X11
  app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder');
  app.commandLine.appendSwitch('use-gl', 'desktop');
  
  // Desactivar sandbox solo en Linux para mejor compatibilidad
  app.commandLine.appendSwitch('no-sandbox');
  
  // Optimización de memoria en Linux
  app.commandLine.appendSwitch('max_old_space_size', '4096');
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
  
  // Configuración base (igual para todas las plataformas)
  const baseWebPreferences = {
    nodeIntegration: true,
    contextIsolation: true, // Activado para seguridad
    enableRemoteModule: true, // Habilitamos el módulo remote
    preload: path.join(__dirname, 'preload.js'),
    zoomFactor: Math.pow(1.2, savedZoomLevel), // Convertir nivel a factor de zoom
  };

  // Optimizaciones ADICIONALES solo para Linux
  const linuxWebPreferences = process.platform === 'linux' ? {
    ...baseWebPreferences,
    hardwareAcceleration: true, // Forzar aceleración de hardware solo en Linux
    backgroundThrottling: false, // Evitar throttling en segundo plano solo en Linux
    experimentalFeatures: true, // Solo en Linux
    enableBlinkFeatures: 'CSSBackdropFilter,WebAssembly', // Solo en Linux
  } : baseWebPreferences;

  // Crear la ventana del navegador.
  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: linuxWebPreferences,
    // Configuraciones adicionales para una mejor apariencia
    show: false, // No mostrar hasta que esté listo
    backgroundColor: '#2e2c29',
    autoHideMenuBar: true // Ocultar la barra de menú por defecto
  });

  // Habilitar @electron/remote para esta ventana
  enable(mainWindow.webContents);

  // Restaurar el nivel de zoom guardado
  mainWindow.webContents.once('did-finish-load', () => {
    if (mainWindow) {
      mainWindow.webContents.setZoomLevel(savedZoomLevel);
      console.log(`Zoom restaurado a nivel: ${savedZoomLevel}`);
      
      // Optimizaciones post-carga SOLO para Linux
      if (process.platform === 'linux') {
        console.log('Aplicando optimizaciones post-carga para Linux...');
        // Forzar repaint para resolver posibles problemas de rendering
        mainWindow.webContents.invalidate();
        
        // Configurar framerate óptimo
        mainWindow.webContents.setFrameRate(60);
        
        // Optimización adicional de throttling
        setTimeout(() => {
          mainWindow.webContents.setBackgroundThrottling(false);
        }, 1000);
      }
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
    mainWindow.maximize();
  });

  // Emitido cuando la ventana es cerrada.
  mainWindow.on('closed', function () {
    // Desreferencia el objeto window, normalmente guardarías las ventanas
    // en un array si tu aplicación soporta múltiples ventanas, este es el momento
    // en el que deberías borrar el elemento correspondiente.
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