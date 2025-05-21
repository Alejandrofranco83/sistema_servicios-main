const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { initialize, enable } = require('@electron/remote/main');

// Inicializar @electron/remote
initialize();

// Mantener una referencia global del objeto window para evitar que la ventana 
// se cierre automáticamente cuando el objeto JavaScript es recolectado por el GC.
let mainWindow;

function createWindow() {
  console.log('Creando ventana de Electron...');
  
  // Crear la ventana del navegador.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true, // Activado para seguridad
      enableRemoteModule: true, // Habilitamos el módulo remote
      preload: path.join(__dirname, 'preload.js')
    },
    // Configuraciones adicionales para una mejor apariencia
    show: false, // No mostrar hasta que esté listo
    backgroundColor: '#2e2c29',
    autoHideMenuBar: true // Ocultar la barra de menú por defecto
  });

  // Habilitar @electron/remote para esta ventana
  enable(mainWindow.webContents);

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