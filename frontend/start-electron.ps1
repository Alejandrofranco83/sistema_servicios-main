# Script para iniciar Electron directamente
Write-Host "Verificando si React está ejecutándose en http://localhost:3000..."

# Intenta hacer una solicitud a localhost:3000
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -ErrorAction SilentlyContinue
    Write-Host "React está ejecutándose correctamente."
} catch {
    Write-Host "ADVERTENCIA: React no parece estar ejecutándose en http://localhost:3000"
    Write-Host "Asegúrate de iniciar el servidor React primero con 'npm run react-start'"
    Write-Host "Continuando de todos modos..."
}

# Define la variable de entorno y ejecuta Electron
Write-Host "Iniciando Electron..."
$env:ELECTRON_START_URL = "http://localhost:3000"
Set-Location -Path frontend
electron . 