# Implementación de Formato de Monedas Extranjeras

Este documento explica cómo implementar correctamente el manejo de formatos para monedas extranjeras (Reales Brasileños y Dólares Americanos) en nuestro sistema.

## Problema

Existen diferencias importantes en cómo se muestran y almacenan los valores monetarios:

1. **Visualización**: 
   - **Guaraníes (GS)**: Usan punto como separador de miles (ej. 1.000)
   - **Reales (BRL)**: Usan punto como separador de miles y coma para decimales (ej. 1.234,56)
   - **Dólares (USD)**: Usan coma como separador de miles y punto para decimales (ej. 1,234.56)

2. **Almacenamiento en BD**:
   - Todos los valores se almacenan como números decimales con punto (ej. 1234.56)

3. **Problema común**:
   - Al editar un valor de 200.00 reales, se mostraba como 2,00 en el formulario
   - Al guardar un valor de 200,00 reales, se guardaba como 20000.00 en la BD

## Solución Implementada

### 1. Visualización en la interfaz (formatear valores para mostrar)

```typescript
// Para mostrar en tablas
const formatearMonto = (monto: number, moneda: string) => {
  if (moneda === 'GS') {
    // Formato con punto como separador de miles para guaraníes
    return monto.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  } else if (moneda === 'BRL') {
    // Formato brasileño: punto como separador de miles y coma para decimales
    return new Intl.NumberFormat('pt-BR', { 
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(monto);
  } else if (moneda === 'USD') {
    // Formato estadounidense: coma como separador de miles y punto para decimales
    return new Intl.NumberFormat('en-US', { 
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(monto);
  } else {
    return new Intl.NumberFormat('es-PY', { 
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(monto);
  }
};

// Para mostrar en inputs al editar
const formatMontoForDisplay = (value: string, moneda: string) => {
  if (!value) return '';
  
  if (moneda === 'GS') {
    // Guaraníes: formato con punto como separador de miles
    const numericValue = value.replace(/\D/g, '');
    if (numericValue === '') return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  } else if (moneda === 'BRL') {
    // Reales: formato con punto para miles y coma para decimales
    const numericValue = value.replace(/\D/g, '');
    if (numericValue === '') return '';
    
    // Asegurar que tengamos al menos 3 dígitos para tener formato con decimales
    const paddedValue = numericValue.padStart(3, '0');
    
    // Separar enteros y decimales
    const decimalPart = paddedValue.slice(-2);
    const integerPart = paddedValue.slice(0, -2).replace(/^0+/, '') || '0'; // Quitar ceros iniciales
    
    // Formatear la parte entera con puntos para los miles
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    return `${formattedInteger},${decimalPart}`;
  } else if (moneda === 'USD') {
    // Dólares: formato con coma para miles y punto para decimales
    const numericValue = value.replace(/\D/g, '');
    if (numericValue === '') return '';
    
    // Asegurar que tengamos al menos 3 dígitos para tener formato con decimales
    const paddedValue = numericValue.padStart(3, '0');
    
    // Separar enteros y decimales
    const decimalPart = paddedValue.slice(-2);
    const integerPart = paddedValue.slice(0, -2).replace(/^0+/, '') || '0'; // Quitar ceros iniciales
    
    // Formatear la parte entera con comas para los miles (formato USA)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    return `${formattedInteger}.${decimalPart}`;
  }
  
  return value;
};
```

### 2. Procesar cambios en inputs (manejar entrada del usuario)

```typescript
// Manejar cambio en el campo de monto
const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const inputValue = e.target.value;
  
  // Eliminar todos los caracteres no numéricos
  const numericValue = inputValue.replace(/\D/g, '');
  
  // Actualizar el estado con solo el valor numérico
  handleChangeGasto('monto', numericValue);
};
```

### 3. ⚠️ IMPORTANTE: Al guardar en la base de datos ⚠️

**Este es un punto crítico para evitar errores de valores multiplicados por 100.**

```typescript
// Al guardar el formulario
const guardarGasto = async () => {
  // ... código existente ...
  
  // Corregir el valor del monto según la moneda
  let valorMonto = gasto.monto as string;
  
  // Para BRL y USD, dividir por 100 para guardar el valor correcto
  if (gasto.moneda === 'BRL' || gasto.moneda === 'USD') {
    const numericValue = valorMonto.replace(/\D/g, '');
    const floatValue = parseFloat(numericValue) / 100; // DIVIDIR POR 100
    valorMonto = floatValue.toString();
    console.log(`Moneda ${gasto.moneda} - Guardando valor: ${valorMonto}`);
  }
  
  formData.append('monto', valorMonto);
  // ... resto del código ...
};
```

### 4. ⚠️ IMPORTANTE: Al editar un registro existente ⚠️

**Para evitar que el valor se muestre dividido por 100 al editar:**

```typescript
// Al abrir el diálogo de edición
const abrirDialogoEditar = (gastoToEdit: Gasto) => {
  // Ajustar el monto según la moneda
  let montoAjustado = gastoToEdit.monto.toString();
  
  // Para BRL y USD, multiplicar por 100 para mostrar correctamente en el formulario
  if (gastoToEdit.moneda === 'BRL' || gastoToEdit.moneda === 'USD') {
    montoAjustado = (gastoToEdit.monto * 100).toString(); // MULTIPLICAR POR 100
    console.log(`Editando gasto en ${gastoToEdit.moneda} - Monto original: ${gastoToEdit.monto}, Monto ajustado: ${montoAjustado}`);
  }
  
  const gastoEditado = {
    // ... otros campos ...
    monto: montoAjustado,
    // ... resto de campos ...
  };
  
  setGasto(gastoEditado);
  // ... resto del código ...
};
```

## Resumen y puntos clave a recordar

1. **Visualización**:
   - Guaraníes: 1.000 (solo separador de miles)
   - Reales: 1.234,56 (punto para miles, coma para decimales)
   - Dólares: 1,234.56 (coma para miles, punto para decimales)

2. **Al guardar (BRL/USD)**:
   - **DIVIDIR** el valor numérico por 100 antes de enviarlo a la BD
   - Ejemplo: 20000 (del formulario) → 200.00 (en la BD)

3. **Al editar (BRL/USD)**:
   - **MULTIPLICAR** el valor de la BD por 100 para mostrarlo en el formulario
   - Ejemplo: 200.00 (de la BD) → 20000 (para el formulario) → mostrado como "200,00" o "200.00"

4. **Consistencia**:
   - Asegúrate de aplicar estas conversiones en todos los lugares donde se manejen estas monedas
   - Usa este documento como referencia para implementaciones futuras
   - Los valores en el estado de los componentes son siempre valores numéricos "crudos" (sin separadores)

## Ejemplo completo

Ver la implementación en `frontend/src/components/Controles/GestionGastos.tsx` para un ejemplo completo y funcional. 