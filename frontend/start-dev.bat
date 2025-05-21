@echo off
echo Iniciando el entorno de desarrollo...

REM Configura para que React no abra el navegador automáticamente
set BROWSER=none

REM Inicia el servidor de React en una nueva ventana
start cmd /k "cd %~dp0 && node_modules\.bin\react-scripts.cmd start"

REM Espera 10 segundos para que React inicie
echo Esperando que el servidor React inicie...
timeout /t 10

REM Inicia Electron
echo Iniciando Electron...
cd %~dp0
set ELECTRON_START_URL=http://localhost:3001
call node_modules\.bin\electron.cmd . 