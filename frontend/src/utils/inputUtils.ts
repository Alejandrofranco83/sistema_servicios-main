/**
 * Utilidades para manejar comportamientos comunes de campos de entrada
 */

/**
 * Maneja el clic en un campo de texto para seleccionar todo su contenido.
 * Compatible con TextField de Material-UI y elementos nativos.
 * @param event Evento de clic del mouse
 */
export const handleInputClick = (event: React.MouseEvent<HTMLDivElement | HTMLInputElement | HTMLTextAreaElement>) => {
  // Para TextField de Material-UI, necesitamos manejar el input anidado
  const inputElement = event.currentTarget.querySelector('input, textarea');
  if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement) {
    inputElement.select();
    return;
  }
  
  // Para inputs nativos
  if (event.currentTarget instanceof HTMLInputElement || event.currentTarget instanceof HTMLTextAreaElement) {
    event.currentTarget.select();
  }
  
  // Fallback alternativo cuando el target no es el currentTarget
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (target !== event.currentTarget && target.select) {
    target.select();
  }
};

/**
 * Función para formatear un valor numérico como monto con separadores
 * @param value Valor a formatear
 * @param moneda Tipo de moneda (PYG, BRL, USD)
 * @returns Valor formateado con separadores según el tipo de moneda
 */
export const formatearMonto = (value: string | number, moneda: 'PYG' | 'BRL' | 'USD'): string => {
  // Convertir a string si es un número
  const stringValue = typeof value === 'number' ? value.toString() : value;
  
  // Eliminar caracteres no numéricos excepto el punto decimal
  const numericValue = stringValue.replace(/[^\d.]/g, '');
  
  switch (moneda) {
    case 'PYG':
      // Para guaraníes, sin decimales, formato: 1.000
      return new Intl.NumberFormat('es-PY', { 
        maximumFractionDigits: 0 
      }).format(parseInt(numericValue) || 0);
      
    case 'BRL':
    case 'USD':
      // Para reales y dólares, con 2 decimales, formato: 1.000,00
      return new Intl.NumberFormat('es-PY', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      }).format(parseFloat(numericValue) || 0);
      
    default:
      return numericValue;
  }
}; 