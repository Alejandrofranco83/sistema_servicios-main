@echo off
echo Iniciando la aplicación...

REM Ruta completa a node.js (ajusta según donde esté instalado)
set NODE_PATH="C:\Program Files\nodejs\node.exe"

REM Verificar si node.js está en la ruta especificada
if exist %NODE_PATH% (
  echo Usando Node.js en %NODE_PATH%
) else (
  echo Node.js no encontrado en %NODE_PATH%. Intentando usar "node" del PATH...
  set NODE_PATH=node
)

REM Iniciar el servidor React
start cmd /k "%NODE_PATH% .\node_modules\react-scripts\bin\react-scripts.js start"

REM Esperar a que el servidor esté listo (10 segundos)
echo Esperando que React inicie...
timeout /t 10

REM Iniciar Electron
echo Iniciando Electron...
set ELECTRON_START_URL=http://localhost:3000
%NODE_PATH% .\node_modules\electron\cli.js . 