# 📱 Versión Móvil - Sistema de Cajas

Este directorio contiene la implementación móvil **completamente separada** del sistema de gestión de cajas.

## 🗂️ Estructura de Carpetas

```
mobile/
├── components/          # Componentes UI móviles
│   ├── Auth/           # Login móvil
│   ├── Cajas/          # Gestión de cajas móvil
│   ├── Layout/         # Layouts móviles
│   ├── QR/            # Escáner QR
│   ├── Notificaciones/ # Notificaciones móviles
│   └── Common/         # Componentes comunes
├── contexts/           # Contextos específicos móvil
├── hooks/             # Hooks móviles
├── pages/             # Páginas principales
├── services/          # Servicios API móvil
├── styles/            # Estilos específicos
└── utils/             # Utilidades móviles
```

## 🚀 Cómo Probar la Versión Móvil

### Opción 1: Activar Modo Móvil Forzado
```javascript
// En la consola del navegador (F12):
localStorage.setItem('force_mobile', 'true')
window.location.reload()
```

### Opción 2: Usar Controles de Desarrollo
1. En modo desarrollo, verás un botón 🛠️ en la esquina superior derecha
2. Haz clic en él para abrir los controles
3. Activa "Modo Móvil Forzado"

### Opción 3: DevTools del Navegador
1. Presiona **F12** para abrir DevTools
2. Presiona **Ctrl+Shift+M** para modo responsive
3. Selecciona un dispositivo móvil (iPhone, Galaxy, etc.)

### Opción 4: Reducir Ventana
- Reduce el ancho de la ventana a menos de 900px

## 🔧 Configuración de Desarrollo

### Habilitar/Deshabilitar Móvil
En `frontend/src/App.tsx`, cambiar:
```typescript
const MOBILE_DEVELOPMENT = true;  // ← true = móvil habilitado
                                  // ← false = solo desktop
```

### Desarrollo Seguro
- ✅ **Desktop NUNCA se rompe** - siempre funciona como fallback
- ✅ **Móvil completamente separado** - no afecta código existente
- ✅ **Activación manual** - solo se ve cuando quieres

## 📱 Estado Actual

### ✅ Implementado
- [x] Estructura de carpetas
- [x] App móvil básica
- [x] Sistema de navegación con BottomNavigation
- [x] Controles de desarrollo
- [x] Hook de detección móvil
- [x] Login móvil placeholder

### 🚧 Por Implementar
- [ ] Gestión de cajas móvil
- [ ] Escáner QR para sucursales
- [ ] Notificaciones móviles
- [ ] Contexto de sucursales móvil
- [ ] Subida de fotos/comprobantes

## 🎯 Próximos Pasos

1. **Crear componente de gestión de cajas móvil**
2. **Implementar escáner QR**
3. **Crear contexto de sucursales móvil**
4. **Integrar notificaciones**

## 🐛 Debugging

### Ver qué versión se está renderizando
Abre la consola del navegador y busca:
- `🔄 Renderizando versión MÓVIL` - Estás en móvil
- `🔄 Renderizando versión DESKTOP` - Estás en desktop

### Información de detección
Busca en consola:
```
📱 Detección: Screen=true, Force=false, Dev=true, Result=true
```

### Resetear todo
```javascript
// En consola del navegador:
localStorage.removeItem('force_mobile')
window.location.reload()
```

## ⚠️ Importante

- **No tocar** archivos en `frontend/src/components/` (layout desktop)
- **Solo desarrollar** en `frontend/src/mobile/`
- **Siempre probar** que desktop sigue funcionando
- **En producción** el control de desarrollo no aparece

## 📞 Contacto

Si tienes dudas sobre el desarrollo móvil, consulta este README o pregunta al equipo de desarrollo. 