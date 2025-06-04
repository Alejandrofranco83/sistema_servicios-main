# Solución para el Problema de Sincronización en Operaciones Bancarias

## Problema Identificado

Al guardar una operación bancaria en el sistema, se realizaban **dos operaciones separadas** en la base de datos:

1. **Operación Bancaria**: Se guarda en la tabla `OperacionBancaria`
2. **Movimiento de Farmacia**: Se guarda en la tabla `movimientos_farmacia` con referencia a la operación bancaria

### El Problema de Sincronización

El código original **NO utilizaba transacciones** para garantizar que ambas operaciones se ejecutaran de forma atómica. Esto causaba inconsistencias aleatorias cuando:

- ✅ La operación bancaria se guardaba correctamente
- ❌ Pero el movimiento de farmacia fallaba por algún error (red, base de datos, etc.)
- 🔄 O viceversa durante la eliminación

**Resultado**: Registros huérfanos en `movimientos_farmacia` con `movimiento_origen_id = null`

### El Problema de Monedas en POS

**Problema adicional identificado**: Cuando una operación POS se realizaba en una moneda diferente a guaraníes (USD o BRL), el sistema siempre guardaba el movimiento de farmacia con `monedaCodigo = 'PYG'`, ignorando la moneda real del POS.

**Comportamiento incorrecto**:
- POS en USD: Se guardaba movimiento en PYG ❌
- POS en BRL: Se guardaba movimiento en PYG ❌
- POS en PYG: Se guardaba movimiento en PYG ✅

### El Problema de Conceptos Genéricos

**Problema adicional**: Los conceptos en los movimientos de farmacia eran muy genéricos:
- `"Operación Bancaria: POS - Tigo Minicarga"` ❌ (poco descriptivo)
- `"Operación Bancaria: Transferencia - Personal Billetera"` ❌ (no incluye cuenta)

## Solución Implementada

### 1. Transacciones Atómicas

**✅ Implementado**: Todas las operaciones CRUD ahora usan `prisma.$transaction()` para garantizar consistencia:

```typescript
await prisma.$transaction(async (tx) => {
  // Paso 1: Operación bancaria
  const operacion = await tx.operacionBancaria.create({...});
  
  // Paso 2: Movimiento de farmacia (en la misma transacción)
  await tx.movimientoFarmacia.create({...});
});
```

### 2. Manejo Correcto de Monedas

**✅ Implementado**: El sistema ahora detecta la moneda del POS y guarda el movimiento de farmacia en la moneda correcta:

#### Frontend
- Envía información de la moneda del POS: `posMoneda`
- Calcula el monto original en la moneda del POS: `montoOriginalEnMonedaPOS`

#### Backend
- Detecta si es operación POS con moneda diferente a PYG
- Calcula el monto con comisión (6%) en la moneda original del POS
- Guarda el movimiento con la `monedaCodigo` correcta

```typescript
// Lógica de monedas implementada
if (data.tipo === 'pos' && data.posMoneda && data.montoOriginalEnMonedaPOS) {
  monedaMovimiento = data.posMoneda; // USD, BRL, etc.
  montoMovimiento = data.montoOriginalEnMonedaPOS * 1.06; // Con comisión
} else {
  monedaMovimiento = 'PYG'; // Guaraníes por defecto
  montoMovimiento = data.montoACobrar || data.monto;
}
```

### 3. Conceptos Descriptivos

**✅ Implementado**: Los conceptos ahora incluyen información específica y útil:

#### Para Operaciones POS
```
Formato: "POS [Nombre del POS] - [Servicio]"
Ejemplo: "POS TIGO CENTRO - Tigo Minicarga"
```

#### Para Transferencias
```
Formato: "Transferencia [Banco] [Nro Cuenta] - [Servicio]"
Ejemplo: "Transferencia Banco Continental 123456789 - Personal Billetera"
```

```typescript
// Lógica de conceptos implementada
if (data.tipo === 'pos') {
  const dispositivoPOS = await tx.dispositivoPos.findUnique({
    where: { codigoBarras: data.codigoBarrasPos },
    select: { nombre: true }
  });
  conceptoMovimiento = `POS ${dispositivoPOS?.nombre || 'Desconocido'} - ${data.tipoServicio}`;
} else if (data.tipo === 'transferencia') {
  const cuentaBancaria = await tx.cuentaBancaria.findUnique({
    where: { id: data.cuentaBancariaId },
    select: { banco: true, numeroCuenta: true }
  });
  conceptoMovimiento = `Transferencia ${cuentaBancaria?.banco} ${cuentaBancaria?.numeroCuenta} - ${data.tipoServicio}`;
}
```

## Resultados

### ✅ Problemas Resueltos

1. **Sincronización**: Ya no habrá registros huérfanos
2. **Monedas**: Los movimientos se guardan en la moneda correcta del POS
3. **Conceptos**: Información clara y específica para cada movimiento
4. **Consistencia**: Si falla una operación, falla toda la transacción
5. **Precisión**: Los montos se calculan correctamente según la moneda
6. **Trazabilidad**: Fácil identificación del origen de cada movimiento

### 📊 Comportamiento Esperado

| Tipo Operación | Moneda POS | Moneda Movimiento | Concepto |
|----------------|------------|-------------------|----------|
| POS | USD | USD | `POS VISA USD - Tigo Minicarga` |
| POS | BRL | BRL | `POS MASTERCARD BRL - Personal Paquete` |
| POS | PYG | PYG | `POS TIGO CENTRO - Claro Saldo` |
| Transferencia | N/A | PYG | `Transferencia Banco Continental 123456 - Personal Billetera` |

### 🔍 Beneficios en BalanceFarmaciaLista

Los usuarios ahora verán conceptos mucho más informativos:

**Antes**:
- `Operación Bancaria: POS - Tigo Minicarga`
- `Operación Bancaria: Transferencia - Personal Billetera`

**Ahora**:
- `POS TIGO CENTRO - Tigo Minicarga`
- `Transferencia Banco Continental 123456789 - Personal Billetera`

### 📊 Nueva Funcionalidad: Tooltip Informativo

**✅ Implementado**: Los movimientos provenientes de operaciones bancarias ahora muestran un tooltip detallado en la columna "Detalle" con:

- **Sucursal**: Nombre de la sucursal donde se realizó la operación
- **Usuario**: Nombre del usuario que realizó la operación  
- **Nro. Caja**: Número entero de la caja utilizada
- **Tipo**: Tipo de operación (POS/TRANSFERENCIA)

**Experiencia de usuario**:
1. El usuario ve el ícono del ojo en la columna "Detalle"
2. Al posicionar el cursor sobre el ícono, aparece un tooltip con información completa
3. La información es específica y útil para auditoría y seguimiento

## Archivos Modificados

### Backend
- `backend/src/controllers/operacion-bancaria.controller.ts`
  - ✅ `createOperacionBancaria()`: Transacciones + monedas + conceptos
  - ✅ `updateOperacionBancaria()`: Transacciones + monedas + conceptos
  - ✅ `deleteOperacionBancaria()`: Transacciones
  - ✅ Esquema de validación actualizado

- `backend/src/models/movimientoFarmaciaModel.ts`
  - ✅ `getAll()`: Incluye información de operaciones bancarias con datos de caja
  - ✅ Consultas adicionales para obtener sucursal, usuario y número de caja

### Frontend
- `frontend/src/components/Cajas/OperacionesBancarias/FormOperacion.tsx`
  - ✅ Envío de información de moneda del POS
  - ✅ Cálculo de monto original en moneda del POS

- `frontend/src/components/SaldosMonetarios/BalanceFarmaciaLista.tsx`
  - ✅ Interfaz actualizada con información de operación bancaria
  - ✅ Tooltip detallado con sucursal, usuario y número de caja
  - ✅ Lógica condicional para mostrar información específica

## Próximos Pasos

1. **Reiniciar backend** para aplicar cambios
2. **Probar operaciones POS** en diferentes monedas
3. **Verificar conceptos descriptivos** en `BalanceFarmaciaLista`
4. **Confirmar** que las eliminaciones funcionen sin dejar registros huérfanos

## Testing Recomendado

### Operaciones POS
- ✅ Crear operación POS en USD → Verificar concepto: `POS [Nombre] - [Servicio]`
- ✅ Crear operación POS en BRL → Verificar moneda BRL en lista
- ✅ Crear operación POS en PYG → Verificar funcionamiento normal

### Transferencias
- ✅ Crear transferencia → Verificar concepto: `Transferencia [Banco] [Cuenta] - [Servicio]`
- ✅ Verificar moneda siempre en PYG

### Consistencia
- ✅ Eliminar operaciones y verificar limpieza completa
- ✅ Verificar que conceptos sean informativos y específicos 