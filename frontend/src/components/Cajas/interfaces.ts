// Interfaces para el componente Cajas

// Interfaces para datos básicos
export interface Denominacion {
  valor: number;
  cantidad: number;
  moneda: 'PYG' | 'BRL' | 'USD';
}

export interface SaldoServicio {
  servicio: string;
  monto: number;
}

export interface MovimientoServicio {
  servicio: string;
  tipo: 'envio' | 'retiro' | 'pago';
  monto: number;
  comprobante?: string;
}

export interface Conteo {
  denominaciones: Denominacion[];
  total: {
    PYG: number;
    BRL: number;
    USD: number;
  };
}

export interface Comprobantes {
  minicargas?: string;
  maxicargas?: string;
  recargaClaro?: string;
  retirosTigoMoney?: string;
  retirosBilleteraPersonal?: string;
  retirosBilleteraClaro?: string;
  cargasBilleteraTigo?: string;
  cargasBilleteraPersonal?: string;
  cargasBilleteraClaro?: string;
}

// Interfaces para entidades principales
export interface Maletin {
  id: string;
  codigo: string;
  sucursalId: string;
  sucursal?: {
    id: string;
    nombre: string;
  };
}

export interface User {
  id: string;
  username?: string;
  name?: string;
  email?: string;
}

export interface Caja {
  id: string;
  cajaEnteroId: number;
  sucursalId: string;
  sucursal?: {
    id: string;
    nombre: string;
    codigo: string;
    direccion: string;
    telefono: string;
    email?: string;
  };
  usuarioId: string;
  usuario: string;
  fechaApertura: string;
  fechaCierre?: string;
  estado: 'abierta' | 'cerrada';
  maletinId: string;
  
  // Saldos iniciales
  saldoInicial: Conteo;
  saldosServiciosInicial: SaldoServicio[];
  
  // Saldos finales
  saldoFinal?: Conteo;
  saldosServiciosFinal?: SaldoServicio[];
  
  // Movimientos durante el día
  movimientosServicios?: MovimientoServicio[];
  
  // Comprobantes (urls de las imágenes)
  comprobantes?: Comprobantes;
  
  // Campo servicios que almacena JSON con datos y comprobantes
  servicios?: any;
  
  createdAt: string;
  updatedAt: string;
}

// Interfaces para operaciones bancarias
export interface OperacionBancaria {
  id?: string;
  tipo: 'pos' | 'transferencia';
  cuentaBancariaId?: number;
  cuentaBancaria?: {
    id: number;
    banco: string;
    numeroCuenta: string;
    moneda: string;
  };
  codigoBarrasPos?: string;
  posDescripcion?: string;
  numeroComprobante?: string;
  monto: number;
  montoACobrar?: number;
  tipoServicio: string;
  archivoAdjunto?: File | null;
  nombreArchivo?: string;
  fecha?: string;
  rutaComprobante?: string;
  cajaId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interfaces para retiros
export interface Retiro {
  id: string;
  ids?: string[]; // Array de IDs para retiros agrupados
  fecha: string;
  personaNombre: string;
  montoPYG: number;
  montoBRL: number;
  montoUSD: number;
  observacion: string;
}

export interface FormRetiro {
  montoPYG: string;
  montoBRL: string;
  montoUSD: string;
  personaId: string;
  personaNombre: string;
  observacion: string;
}

// Interfaces para personas
export interface Persona {
  id: string;
  nombreCompleto: string;
  documento: string;
  tipo: string;
  // Otros campos que pueda tener la entidad Persona
}

// Interfaces para formularios
export interface FormularioApertura {
  sucursalId: string;
  usuarioId: string;
  usuario: string;
  maletinId: string;
  saldoInicial: Conteo;
  saldosServiciosInicial: SaldoServicio[];
}

export interface FormularioCierre {
  saldoFinal: Conteo;
  saldosServiciosFinal: SaldoServicio[];
  // Otros campos necesarios para el cierre
}

// Interfaces para pagos
export interface Pago {
  id: string;
  fecha: string;
  operadora: string;
  servicio: string;
  monto: number;
  moneda: 'PYG' | 'USD';
  comprobante?: string;
  observacion?: string;
}

export interface FormPago {
  id?: string;
  operadora: string;
  servicio: string;
  monto: string;
  moneda: 'PYG' | 'USD';
  comprobante?: File | null;
  observacion?: string;
} 