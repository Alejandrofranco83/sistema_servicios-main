/**
 * Representa los saldos monetarios para cada moneda principal.
 */
export interface SaldoMoneda {
  PYG: number;
  USD: number;
  BRL: number;
}

/**
 * Información básica de una caja relevante para las comparaciones.
 */
export interface CajaInfoComparacion {
  id: string; // uuid
  cajaEnteroId: number;
  maletinId: string | number; // Necesario para agrupar y referenciar
  fechaApertura?: string; // ISO date string - Relevante para cajaSiguiente
  fechaCierre?: string;   // ISO date string - Relevante para cajaAnterior
  saldoInicial?: { total: SaldoMoneda }; // Relevante para cajaSiguiente
  saldoFinal?: { total: SaldoMoneda };   // Relevante para cajaAnterior
  usuario?: string; // Opcional, para contexto
}

/**
 * Representa una comparación entre el cierre de una caja y la apertura de la siguiente
 * que utilizó el mismo maletín.
 */
export interface ComparacionMaletin {
  cajaAnterior: CajaInfoComparacion;
  cajaSiguiente: CajaInfoComparacion;
  /** Diferencia calculada (Apertura Siguiente - Cierre Anterior) por moneda */
  diferencias: SaldoMoneda;
  /** Indica si existe alguna diferencia (!= 0) en cualquier moneda */
  tieneDiferencia: boolean;
}

/**
 * Estructura de datos esperada del endpoint que agrupa las comparaciones por maletín.
 */
export interface MaletinComparacionData {
  maletinId: string | number;
  /** Lista ordenada de comparaciones para este maletín */
  comparaciones: ComparacionMaletin[];
}

// --- Interfaces para Comparación de Saldos de Servicios ---

/**
 * Representa el saldo de un servicio específico.
 */
export interface SaldoServicio {
  servicio: string;
  monto: number;
}

/**
 * Información relevante de una caja para la comparación de saldos de servicios.
 */
export interface CajaInfoServicios {
  id: string;
  cajaEnteroId: number;
  sucursalId: number;
  sucursalNombre?: string; // Nombre de la sucursal
  fechaCierre?: string; // ISO string
  fechaApertura?: string; // ISO string
  saldosServicios: SaldoServicio[]; // Saldos de servicios (iniciales o finales)
}

/**
 * Representa una comparación de saldos de servicios entre el cierre de una caja 
 * y la apertura de la siguiente caja en la misma sucursal.
 */
export interface ComparacionSaldosServicios {
  cajaAnterior: CajaInfoServicios;
  cajaSiguiente: CajaInfoServicios;
  tieneDiferencia: boolean;
}

// --- Interfaces para Comparación Interna En Caja ---

/**
 * Representa los saldos comparados (declarado vs. sistema) para una moneda o tipo.
 */
export interface SaldosComparados {
  declarado: number;
  sistema: number;
  diferencia: number;
}

/**
 * Detalle de la comparación de saldos para efectivo y servicios.
 */
export interface ComparacionDetalladaCaja {
  PYG: SaldosComparados;
  USD: SaldosComparados;
  BRL: SaldosComparados;
  ServiciosPYG: SaldosComparados; // Asumiendo que los servicios se totalizan en PYG
}

/**
 * Representa la comparación interna de saldos para una caja cerrada.
 */
export interface ComparacionEnCaja {
  id: string;
  cajaEnteroId: number;
  sucursalId: number;
  sucursalNombre?: string;
  maletinId: number | null;
  fechaApertura?: string;
  fechaCierre?: string;
  estadoCaja: string;
  comparacion: ComparacionDetalladaCaja;
  tieneDiferencia: boolean; // Indica si alguna diferencia en comparacion.*.diferencia no es cero
}

/**
 * Extiende ComparacionEnCaja para incluir campos calculados/añadidos en el frontend.
 */
export interface ComparacionEnCajaExtendido extends ComparacionEnCaja {
  diferenciaTotal: number; // Calculada en el frontend (PYG.diferencia + ServiciosPYG.diferencia)
  diferenciasServicios?: DiferenciaServicio[]; // Añadido en el frontend (datos dummy por ahora)
}

/**
 * Representa la diferencia encontrada para un servicio específico dentro de una caja.
 */
export interface DiferenciaServicio {
  servicio: string;
  diferencia: number;
} 