# Script para compilar la aplicación React y empaquetar con Electron Builder
# Este script es para PowerShell

Write-Host "Compilando la aplicación React..."
Set-Location -Path frontend
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Falló la compilación de React"
    exit 1
}

Write-Host "Empaquetando con Electron Builder..."
npm run electron-build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Falló el empaquetado con Electron Builder"
    exit 1
}

Write-Host "¡Aplicación compilada y empaquetada con éxito!"
Write-Host "Revisa la carpeta 'dist' para encontrar los instaladores generados." 