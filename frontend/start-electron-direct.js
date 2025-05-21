const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

console.log('Iniciando Electron...');
process.env.ELECTRON_START_URL = 'http://localhost:3000';

const proc = spawn(electron, ['.'], {
    stdio: 'inherit'
});

proc.on('close', (code) => {
    console.log(`Electron se cerró con código ${code}`);
}); 