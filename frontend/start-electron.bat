@echo off
echo Iniciando Electron...
cd %~dp0
set ELECTRON_START_URL=http://localhost:3000
npx.cmd electron . 