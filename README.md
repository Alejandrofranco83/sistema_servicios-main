# Módulo de Gestión de Gastos

## Componentes implementados

1. **Modelo de datos**:
   - Se ha agregado el modelo `Gasto` en `backend/prisma/schema.prisma`
   - Relaciones con las tablas de Categorías, Subcategorías, Sucursales y Usuarios

2. **Backend**:
   - Controlador de gastos: `backend/src/controllers/gastos.controller.ts`
   - Rutas para el API: `backend/src/routes/gastos.routes.ts`
   - Registro de rutas en `backend/src/index.ts`

3. **Frontend**:
   - Componente de gestión de gastos: `frontend/src/components/Controles/GestionGastos.tsx`
   - Actualización del Dashboard para incluir la opción en el menú y la ruta

## Funcionalidades implementadas

- Listado de gastos con filtros (por fecha, categoría, subcategoría, sucursal, moneda)
- Creación de nuevos gastos
- Edición de gastos existentes
- Eliminación de gastos
- Adjuntar comprobantes de gasto
- Selección entre "General/Adm" o sucursales específicas
- Uso de las categorías y subcategorías configuradas previamente

## Pasos para completar la implementación

1. Ejecutar la migración de Prisma para crear la tabla de gastos:
   ```
   cd backend
   npx prisma migrate dev --name add_gastos_model
   ```

2. Compilar el backend:
   ```
   cd backend
   npm run build
   ```

3. Reiniciar el servidor:
   ```
   cd backend
   npm start
   ```

4. Acceder al módulo a través del menú Controles -> Gastos

## Características adicionales para implementar en el futuro

- Estadísticas y reportes de gastos
- Exportación de datos a Excel/PDF
- Visualización de gráficos de gastos por categoría/sucursal/mes 