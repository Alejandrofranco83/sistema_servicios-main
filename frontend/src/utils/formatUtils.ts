/**
 * Formatea un valor en guaraníes con punto como separador de miles
 * Ejemplo: 1000 -> 1.000
 */
export const formatGuaranies = (value: number): string => {
  return new Intl.NumberFormat('es-PY', {
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Formatea un valor en dólares/reales con coma como separador decimal
 * Ejemplo: 1 -> 1,00
 */
export const formatForeignCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value).replace('.', ',');
};

/**
 * Formatea un valor monetario con su símbolo de moneda
 */
export const formatCurrency = {
  /**
   * Formatea un valor en guaraníes con símbolo
   * Ejemplo: 1000 -> G$ 1.000
   */
  guaranies: (value: number): string => {
    return new Intl.NumberFormat('es-PY', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value);
  },
  
  /**
   * Formatea un valor en dólares con símbolo
   * Ejemplo: 1 -> US$ 1,00
   */
  dollars: (value: number): string => {
    return `US$ ${formatForeignCurrency(value)}`;
  },
  
  /**
   * Formatea un valor en reales con símbolo
   * Ejemplo: 1 -> R$ 1,00
   */
  reals: (value: number): string => {
    return `R$ ${formatForeignCurrency(value)}`;
  },
  
  /**
   * Formatea un valor en dólares (versión alternativa)
   */
  dolares: (value: number): string => {
    return new Intl.NumberFormat('es-PY', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },
  
  /**
   * Formatea un valor en reales (versión alternativa)
   */
  reales: (value: number): string => {
    return new Intl.NumberFormat('es-PY', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
};

/**
 * Formatea una fecha
 * Ejemplo: 2024-04-15 -> 15 de abril de 2024
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-PY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * Formatea un número con un número determinado de decimales
 * Ejemplo: 1234.5678 -> 1.234,57
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}; 