@echo off
REM Uso: install_printer_win.bat SERVIDOR [COLA]
set SERVER=%1
if "%SERVER%"=="" set SERVER=PC-SERVER
set SHARE=%2
if "%SHARE%"=="" set SHARE=TICKET_58

set UNC=\\%SERVER%\%SHARE%
echo Instalando impresora %UNC% ...
rundll32 printui.dll,PrintUIEntry /in /n "%UNC%"

if %errorlevel%==0 (
  echo Instalación correcta.
) else (
  echo Error al instalar impresora.
  exit /b %errorlevel%
) 