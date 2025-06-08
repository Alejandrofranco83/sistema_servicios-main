# 🚀 Guía de Build y Workflows

## ⚠️ **EMERGENCIA: Almacenamiento Lleno**

Si ves el error: `"Artifact storage quota has been hit"`, sigue estos pasos **INMEDIATAMENTE**:

1. **Ve a Actions** → **Emergency Artifact Cleanup**
2. **Haz clic en "Run workflow"**
3. **Espera a que termine** (liberará TODO el espacio)
4. **Después puedes hacer builds normalmente**

## 📋 Workflows Disponibles

### 1. **Build Linux App** (`build-linux.yml`)
- **Cuándo se ejecuta**: 
  - Automáticamente en cada push a `main`
  - Manualmente desde GitHub Actions
- **Qué hace**: 
  - Construye la aplicación para Linux
  - Genera archivos RPM, DEB y AppImage
  - **NO sube artefactos por defecto** (para ahorrar espacio)

### 2. **Build Release** (`release.yml`)
- **Cuándo se ejecuta**:
  - Automáticamente cuando se crea un release
  - Manualmente desde GitHub Actions
- **Qué hace**:
  - Construye la aplicación para Linux
  - Actualiza la versión en package.json
  - Sube los archivos al release de GitHub

### 3. **Cleanup Old Artifacts** (`cleanup-artifacts.yml`)
- **Cuándo se ejecuta**:
  - Automáticamente todos los días a las 2 AM UTC
  - Manualmente desde GitHub Actions
- **Qué hace**:
  - Elimina artefactos más antiguos de 7 días
  - Libera espacio de almacenamiento
  - Muestra estadísticas de limpieza

### 4. **🚨 Emergency Artifact Cleanup** (`emergency-cleanup.yml`)
- **Cuándo se ejecuta**:
  - **SOLO MANUALMENTE** cuando el almacenamiento está lleno
- **Qué hace**:
  - **ELIMINA TODOS LOS ARTEFACTOS** inmediatamente
  - Libera TODO el espacio de almacenamiento
  - Para situaciones de emergencia

## 🎯 Cómo Usar

### Para Desarrollo Normal:
1. Haz push a `main` - se ejecutará el build automáticamente
2. Los archivos se construyen pero NO se suben (ahorra espacio)
3. Puedes ver el log para confirmar que todo funciona

### Para Subir Artefactos (Solo si necesitas descargar):
1. Ve a **Actions** → **Build Linux App**
2. Haz clic en **Run workflow**
3. Marca la casilla **"Subir artefactos"**
4. Los archivos estarán disponibles por 7 días

### Para Crear un Release:
1. **Opción A - Automática**:
   - Crea un release en GitHub
   - Los archivos se adjuntarán automáticamente

2. **Opción B - Manual**:
   - Ve a **Actions** → **Build Release**
   - Haz clic en **Run workflow**
   - Especifica el tag (ej: `v1.2.2`)

## 🧹 Gestión de Espacio

### El problema:
GitHub Actions tiene límites de almacenamiento para artefactos.

### La solución:
- **Build normal**: No sube artefactos
- **Limpieza automática**: Elimina artefactos antiguos diariamente
- **Retención corta**: Solo 7 días para builds de desarrollo
- **Releases**: Se almacenan en los releases de GitHub (no cuenta para el límite)

## 📊 Monitoreo

### Verificar espacio usado:
1. Ve a **Settings** → **Actions** → **General**
2. Revisa el uso de almacenamiento en la parte inferior

### Limpiar manualmente:
1. Ve a **Actions** → **Cleanup Old Artifacts**
2. Haz clic en **Run workflow**

### Emergencia (almacenamiento lleno):
1. Ve a **Actions** → **Emergency Artifact Cleanup**
2. Haz clic en **Run workflow**
3. **ELIMINA TODOS los artefactos** inmediatamente

## ⚙️ Archivos Generados

Cada build genera estos archivos:
- `*.rpm` - Para distribuciones Red Hat/Fedora/CentOS
- `*.deb` - Para distribuciones Debian/Ubuntu
- `*.AppImage` - Portable, funciona en cualquier Linux

## 🔧 Versiones

La versión actual del sistema se define en:
- `frontend/src/components/Dashboard/Dashboard.tsx` → Constante `SYSTEM_VERSION`
- `frontend/package.json` → Campo `version` (se actualiza automáticamente en releases) 