# 🔍 Funcionalidad de Zoom Persistente en Electron

## ✨ Características Implementadas

Esta implementación permite que el nivel de zoom seleccionado por el usuario se mantenga entre sesiones de la aplicación.

### 🎯 **Funcionalidades principales:**

1. **Zoom Persistente**: El nivel de zoom se guarda automáticamente
2. **Restauración Automática**: Al abrir la app, se restaura el último zoom usado
3. **Controles de Teclado**: Funcionan los atajos estándar de zoom
4. **Controles Visuales**: Componente opcional con botones de zoom
5. **Límites Seguros**: Zoom limitado entre -3 y +3 (aproximadamente 40% a 240%)

### ⚙️ **Archivos modificados/creados:**

#### **Backend Electron:**
- `frontend/electron.js` - Lógica principal de persistencia de zoom
- `frontend/src/electron/preload.ts` - APIs expuestas al renderer
- `frontend/src/types/electron.d.ts` - Tipos TypeScript

#### **Frontend React:**
- `frontend/src/hooks/useElectronZoom.ts` - Hook personalizado para zoom
- `frontend/src/components/Common/ZoomControls.tsx` - Componente de controles visuales

#### **Dependencias:**
- `electron-store` - Para persistir configuraciones entre sesiones

## 🚀 Cómo usar

### **1. Zoom automático (sin código adicional)**

El zoom ya funciona automáticamente con:
- **Ctrl + Plus** para aumentar
- **Ctrl + Minus** para disminuir  
- **Ctrl + 0** para resetear
- **Rueda del mouse + Ctrl**

### **2. Hook personalizado en componentes React**

```tsx
import { useElectronZoom } from '../hooks/useElectronZoom';

const MiComponente = () => {
  const { 
    zoomLevel, 
    zoomPercentage, 
    isElectron,
    zoomIn, 
    zoomOut, 
    resetZoom 
  } = useElectronZoom();

  if (!isElectron) return <div>Solo funciona en Electron</div>;

  return (
    <div>
      <p>Zoom actual: {zoomPercentage}%</p>
      <button onClick={zoomIn}>Aumentar</button>
      <button onClick={zoomOut}>Disminuir</button>
      <button onClick={resetZoom}>Resetear</button>
    </div>
  );
};
```

### **3. Componente de controles visuales**

```tsx
import ZoomControls from '../components/Common/ZoomControls';

const MiPantalla = () => {
  return (
    <div>
      {/* Controles compactos horizontales */}
      <ZoomControls compact orientation="horizontal" />
      
      {/* Controles completos verticales */}
      <ZoomControls orientation="vertical" showPercentage />
      
      {/* Solo en la esquina (como en AdminView) */}
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <ZoomControls compact />
      </div>
    </div>
  );
};
```

## 📊 Niveles de Zoom

| Nivel | Porcentaje | Descripción |
|-------|------------|-------------|
| -3    | ~40%       | Mínimo zoom |
| -2    | ~55%       | Muy pequeño |
| -1    | ~75%       | Pequeño |
| 0     | 100%       | Normal (por defecto) |
| 1     | ~120%      | Grande |
| 2     | ~140%      | Muy grande |
| 3     | ~240%      | Máximo zoom |

## 🔧 Configuración Técnica

### **Persistencia de datos:**
- Los datos se guardan en: `%APPDATA%/[nombre-app]/user-preferences.json`
- Incluye tanto el zoom como las dimensiones de ventana

### **APIs disponibles:**
```typescript
window.zoomAPI.getZoomLevel()     // Obtener nivel actual
window.zoomAPI.setZoomLevel(1)    // Establecer nivel específico
window.zoomAPI.zoomIn()           // Aumentar zoom
window.zoomAPI.zoomOut()          // Disminuir zoom  
window.zoomAPI.resetZoom()        // Resetear a 100%
```

## 🎉 Ejemplo implementado

Puedes ver un ejemplo funcionando en **AdminView.tsx** donde se agregaron controles de zoom flotantes en la esquina superior derecha.

---

**¡Ahora tu aplicación recordará el nivel de zoom preferido del usuario! 🎯** 