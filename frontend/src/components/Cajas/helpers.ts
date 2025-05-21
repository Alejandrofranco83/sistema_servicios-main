// Funciones auxiliares para el componente Cajas y sus subcomponentes
import { Denominacion, Maletin, Caja } from './interfaces';

/**
 * Calcula el total de denominaciones para una moneda específica
 */
export const calcularTotalDenominaciones = (denominaciones: Denominacion[], moneda: 'PYG' | 'BRL' | 'USD'): number => {
  return denominaciones
    .filter(d => d.moneda === moneda)
    .reduce((total, denom) => total + (denom.valor * denom.cantidad), 0);
};

/**
 * Formatea un número con separadores de miles
 */
export const formatearMontoConSeparadores = (monto: number): string => {
  return new Intl.NumberFormat('es-PY').format(monto);
};

/**
 * Convierte texto formateado a número
 */
export const textoFormateadoANumero = (texto: string): number => {
  if (!texto) return 0;
  // Eliminar todos los separadores y convertir a número
  return parseFloat(texto.replace(/\./g, '').replace(',', '.')) || 0;
};

/**
 * Formatea un número según la moneda
 */
export const formatearSegunMoneda = (valor: number, moneda: 'PYG' | 'BRL' | 'USD'): string => {
  if (moneda === 'PYG') {
    // Para guaraníes, solo separador de miles
    return new Intl.NumberFormat('es-PY').format(valor);
  } else {
    // Para dólares y reales, separador de miles y dos decimales
    return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
  }
};

/**
 * Formatea el ID de la caja para mostrar
 */
export const formatearIdCaja = (cajaId: string): string => {
  // Para IDs numéricos (autoincrementados), mostrar solo el número
  if (!isNaN(Number(cajaId))) {
    return cajaId;
  }
  
  // Si es un ID legacy (UUID), mantener comportamiento anterior
  if (cajaId.includes('-')) {
    return `CAJA #${cajaId.split('-')[0].toUpperCase()}`;
  }
  
  return cajaId;
};

/**
 * Verifica si un maletín está en uso
 */
export const estaEnUso = (maletinId: string, maletinesEnUso: string[]): boolean => {
  return maletinesEnUso.includes(maletinId);
};

/**
 * Obtiene un mensaje indicando el estado de un maletín
 */
export const getMensajeEstadoMaletin = (maletin: Maletin, maletinesEnUso: string[]): string => {
  if (estaEnUso(maletin.id, maletinesEnUso)) {
    return 'En uso';
  }
  return 'Disponible';
};

/**
 * Obtiene el código de un maletín
 */
export const obtenerCodigoMaletin = (maletinId: string, maletines: Maletin[]): string => {
  const maletin = maletines.find(m => m.id === maletinId);
  return maletin ? maletin.codigo : 'Desconocido';
};

/**
 * Genera un ID de campo para las denominaciones
 */
export const getDenominacionFieldId = (moneda: string, valor: number): string => `${moneda}-${valor}`;

/**
 * Genera un ID de campo para los servicios
 */
export const getServicioFieldId = (servicio: string): string => `servicio-${servicio.replace(/\s+/g, '-').toLowerCase()}`;

/**
 * Genera un ID para los campos de movimientos
 */
export const getMovimientoFieldId = (operadora: string, servicio: string): string => 
  `movimiento-${operadora}-${servicio.replace(/\s+/g, '-').toLowerCase()}`;

/**
 * Convierte texto a número
 */
export const textoANumero = (texto: string): number => {
  if (!texto) return 0;
  return parseInt(texto.replace(/\D/g, '')) || 0;
};

/**
 * Formatea un monto para servicios con separadores de miles
 * @param monto Monto a formatear
 * @returns Monto formateado como string
 */
export const formatearMontoServicio = (monto: number): string => {
  return new Intl.NumberFormat('es-PY').format(monto);
}; 