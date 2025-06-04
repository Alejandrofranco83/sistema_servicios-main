@echo off
echo Iniciando primera instancia de la aplicacion...
start "Primera Instancia" cmd /c "cd /d %~dp0 && npm run electron"
timeout /t 3 /nobreak
echo.
echo Intentando abrir segunda instancia...
echo Si la funcionalidad de instancia unica funciona, esta se cerrara y se enfocara la primera.
start "Segunda Instancia" cmd /c "cd /d %~dp0 && npm run electron"
timeout /t 3 /nobreak
echo.
echo Intentando abrir tercera instancia...
start "Tercera Instancia" cmd /c "cd /d %~dp0 && npm run electron"
echo.
echo Prueba completada. Solo deberia haber una ventana de la aplicacion abierta.
pause 