// Constantes para el componente Cajas
import { Denominacion, SaldoServicio, FormularioApertura } from './interfaces';

// Denominaciones por defecto
export const denominacionesGuaranies: Denominacion[] = [
  { valor: 100000, cantidad: 0, moneda: 'PYG' },
  { valor: 50000, cantidad: 0, moneda: 'PYG' },
  { valor: 20000, cantidad: 0, moneda: 'PYG' },
  { valor: 10000, cantidad: 0, moneda: 'PYG' },
  { valor: 5000, cantidad: 0, moneda: 'PYG' },
  { valor: 2000, cantidad: 0, moneda: 'PYG' },
  { valor: 1000, cantidad: 0, moneda: 'PYG' },
  { valor: 500, cantidad: 0, moneda: 'PYG' }
];

export const denominacionesReales: Denominacion[] = [
  { valor: 200, cantidad: 0, moneda: 'BRL' },
  { valor: 100, cantidad: 0, moneda: 'BRL' },
  { valor: 50, cantidad: 0, moneda: 'BRL' },
  { valor: 20, cantidad: 0, moneda: 'BRL' },
  { valor: 10, cantidad: 0, moneda: 'BRL' },
  { valor: 5, cantidad: 0, moneda: 'BRL' },
  { valor: 2, cantidad: 0, moneda: 'BRL' },
  { valor: 1, cantidad: 0, moneda: 'BRL' },
  { valor: 0.50, cantidad: 0, moneda: 'BRL' },
  { valor: 0.25, cantidad: 0, moneda: 'BRL' },
  { valor: 0.10, cantidad: 0, moneda: 'BRL' },
  { valor: 0.05, cantidad: 0, moneda: 'BRL' }
];

export const denominacionesDolares: Denominacion[] = [
  { valor: 100, cantidad: 0, moneda: 'USD' },
  { valor: 50, cantidad: 0, moneda: 'USD' },
  { valor: 20, cantidad: 0, moneda: 'USD' },
  { valor: 10, cantidad: 0, moneda: 'USD' },
  { valor: 5, cantidad: 0, moneda: 'USD' },
  { valor: 1, cantidad: 0, moneda: 'USD' }
];

// Servicios iniciales
export const serviciosIniciales: SaldoServicio[] = [
  { servicio: 'Minicarga', monto: 0 },
  { servicio: 'Maxicarga', monto: 0 },
  { servicio: 'Recarga Claro', monto: 0 },
  { servicio: 'Tigo Money', monto: 0 },
  { servicio: 'Billetera Personal', monto: 0 },
  { servicio: 'Billetera Claro', monto: 0 }
];

// Formulario de caja inicial
export const cajaInicial: FormularioApertura = {
  sucursalId: '',
  usuarioId: '1', // Esto vendría del contexto de autenticación
  usuario: 'Usuario Actual', // Esto vendría del contexto de autenticación
  maletinId: '', // Nuevo campo para el maletín
  saldoInicial: {
    denominaciones: [
      ...denominacionesGuaranies.map(d => ({...d, cantidad: 0})),
      ...denominacionesReales.map(d => ({...d, cantidad: 0})),
      ...denominacionesDolares.map(d => ({...d, cantidad: 0}))
    ],
    total: {
      PYG: 0,
      BRL: 0,
      USD: 0
    }
  },
  saldosServiciosInicial: serviciosIniciales.map(s => ({...s, monto: 0}))
};

// Servicios disponibles para operaciones bancarias
export const serviciosOperacionesBancarias = {
  tigo: ['Minicarga', 'Giros', 'Billetera'],
  personal: ['Maxicarga', 'Giros', 'Billetera'],
  claro: ['Recarga', 'Giros', 'Billetera'],
  otrosServicios: ['Aqui Pago Pagos', 'Wepa Pagos', 'Efectivizacion Tarjeta'],
  vepaguaranies: ['Envío', 'Retiro'],
  vepadolares: ['Envío', 'Retiro'],
  aquiPago: ['Copaco', 'ANDE', 'ESSAP', 'Tigo Hogar', 'Personal Hogar', 'Creditos', 'Impuestos']
}; 