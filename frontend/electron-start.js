// Script para iniciar Electron en modo desarrollo
const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando Electron...');

// Establecer la variable de entorno
process.env.ELECTRON_START_URL = 'http://localhost:3000';

// Iniciar Electron
const electronProcess = spawn('electron', ['.'], {
  stdio: 'inherit',
  shell: true, // Importante para Windows
  cwd: __dirname
});

electronProcess.on('error', (err) => {
  console.error('Error al iniciar Electron:', err);
});

electronProcess.on('close', (code) => {
  console.log(`Electron se ha cerrado con código ${code}`);
}); 