# Layout Components - Versión Móvil

Este directorio contiene los componentes de layout para la versión móvil del sistema.

## Componentes

### MobileAppBar
- **Propósito**: Barra superior de la aplicación móvil
- **Características**:
  - Logo de la empresa
  - Título de la aplicación
  - Botón de menú hamburguesa
  - Posición fija en la parte superior
  - Estilo consistente con la versión desktop

### MobileSidebar
- **Propósito**: Menú lateral deslizable para navegación
- **Características**:
  - Navegación entre secciones principales
  - Botón de cerrar sesión con confirmación
  - Indicador visual de la sección activa
  - Drawer temporal optimizado para móvil
  - Estilo consistente con la versión desktop

## Uso

```tsx
import { MobileAppBar, MobileSidebar } from '../components/Layout';

// En tu componente
const [sidebarOpen, setSidebarOpen] = useState(false);

<MobileAppBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
<MobileSidebar
  open={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  currentTab={currentTab}
  onTabChange={setCurrentTab}
/>
```

## Integración

Los componentes están integrados en `MobileApp.tsx` y mantienen la funcionalidad del bottom navigation existente, proporcionando una experiencia de navegación dual (sidebar + bottom nav). 