@echo off
echo Iniciando Electron en modo desarrollo...
cd frontend
set ELECTRON_START_URL=http://localhost:3000
npx electron . 