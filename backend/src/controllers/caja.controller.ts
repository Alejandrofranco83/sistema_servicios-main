import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Definición de interfaces
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

// Definir tipos específicos para comprobantes
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

// Función auxiliar para analizar JSON de forma segura
const parseSafely = (value: any): any => {
  if (!value) return null;
  
  // Si ya es un objeto (pero no un string), devolverlo tal cual
  if (typeof value === 'object' && value !== null) {
    return value;
  }
  
  // Si es un string, intentar parsearlo
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('Error al parsear JSON:', error);
      console.log('Valor problemático:', value);
      return null;
    }
  }
  
  // Para cualquier otro tipo, devolver el valor original
  return value;
};

// Obtener todas las cajas
export const getCajas = async (_req: Request, res: Response) => {
  try {
    const cajas = await prisma.caja.findMany({
      include: {
        sucursal: true,
        usuario: true,
        maletin: true
      },
      orderBy: {
        fechaApertura: 'desc'
      }
    });

    // Convertir datos de Prisma a formato esperado por el frontend
    const cajasFormateadas = cajas.map(caja => ({
      id: caja.id,
      cajaEnteroId: caja.cajaEnteroId,
      sucursalId: caja.sucursalId.toString(),
      sucursal: {
        id: caja.sucursal.id.toString(),
        nombre: caja.sucursal.nombre,
        codigo: caja.sucursal.codigo,
        direccion: caja.sucursal.direccion,
        telefono: caja.sucursal.telefono,
        email: caja.sucursal.email || ''
      },
      usuarioId: caja.usuarioId.toString(),
      usuario: caja.usuario.nombre,
      maletinId: caja.maletinId.toString(),
      fechaApertura: caja.fechaApertura.toISOString(),
      fechaCierre: caja.fechaCierre ? caja.fechaCierre.toISOString() : null,
      estado: caja.estado,
      saldoInicial: parseSafely(caja.detallesDenominacion),
      saldosServiciosInicial: parseSafely(caja.servicios) || [],
      saldoFinal: null, // Esto debería cargarse de otra tabla o campo
      saldosServiciosFinal: null, // Esto debería cargarse de otra tabla o campo
      createdAt: caja.createdAt.toISOString(),
      updatedAt: caja.updatedAt.toISOString()
    }));
    
    return res.json(cajasFormateadas);
  } catch (error) {
    console.error('Error al obtener cajas:', error);
    return res.status(500).json({ error: 'Error al obtener las cajas' });
  }
};

// Obtener las cajas de una sucursal específica
export const getCajasBySucursal = async (req: Request, res: Response) => {
  const { sucursalId } = req.params;

  try {
    // Consultar las cajas de la sucursal en la base de datos
    const cajas = await prisma.caja.findMany({
      where: {
        sucursalId: parseInt(sucursalId)
      },
      include: {
        sucursal: true,
        usuario: true,
        maletin: true
      },
      orderBy: {
        fechaApertura: 'desc'
      }
    });
    
    if (cajas.length === 0) {
      return res.json([]);
    }
    
    // Convertir datos de Prisma a formato esperado por el frontend
    const cajasFormateadas = cajas.map(caja => ({
      id: caja.id,
      cajaEnteroId: caja.cajaEnteroId,
      sucursalId: caja.sucursalId.toString(),
      sucursal: {
        id: caja.sucursal.id.toString(),
        nombre: caja.sucursal.nombre,
        codigo: caja.sucursal.codigo,
        direccion: caja.sucursal.direccion,
        telefono: caja.sucursal.telefono,
        email: caja.sucursal.email || ''
      },
      usuarioId: caja.usuarioId.toString(),
      usuario: caja.usuario.nombre,
      maletinId: caja.maletinId.toString(),
      fechaApertura: caja.fechaApertura.toISOString(),
      fechaCierre: caja.fechaCierre ? caja.fechaCierre.toISOString() : null,
      estado: caja.estado,
      saldoInicial: parseSafely(caja.detallesDenominacion),
      saldosServiciosInicial: parseSafely(caja.servicios) || [],
      saldoFinal: null, // Esto debería cargarse de otra tabla o campo
      saldosServiciosFinal: null, // Esto debería cargarse de otra tabla o campo
      createdAt: caja.createdAt.toISOString(),
      updatedAt: caja.updatedAt.toISOString()
    }));
    
    return res.json(cajasFormateadas);
  } catch (error) {
    console.error(`Error al obtener cajas de sucursal ${sucursalId}:`, error);
    return res.status(500).json({ error: 'Error al obtener las cajas de la sucursal' });
  }
};

// Obtener una caja por ID
export const getCajaById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Consultar la caja en la base de datos
    const caja = await prisma.caja.findUnique({
      where: { id },
      include: {
        sucursal: true,
        usuario: true,
        maletin: true
      }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Convertir los datos de Prisma al formato esperado por el frontend
    const cajaFormateada = {
      id: caja.id,
      sucursalId: caja.sucursalId.toString(),
      sucursal: {
        id: caja.sucursal.id.toString(),
        nombre: caja.sucursal.nombre,
        codigo: caja.sucursal.codigo,
        direccion: caja.sucursal.direccion,
        telefono: caja.sucursal.telefono,
        email: caja.sucursal.email || ''
      },
      usuarioId: caja.usuarioId.toString(),
      usuario: caja.usuario.nombre,
      maletinId: caja.maletinId.toString(),
      fechaApertura: caja.fechaApertura.toISOString(),
      fechaCierre: caja.fechaCierre ? caja.fechaCierre.toISOString() : null,
      estado: caja.estado,
      saldoInicial: parseSafely(caja.detallesDenominacion),
      saldosServiciosInicial: parseSafely(caja.servicios) || [],
      saldoFinal: null, // Esto debería cargarse de otra tabla o campo
      saldosServiciosFinal: null, // Esto debería cargarse de otra tabla o campo
      createdAt: caja.createdAt.toISOString(),
      updatedAt: caja.updatedAt.toISOString()
    };

    return res.json(cajaFormateada);
  } catch (error) {
    console.error(`Error al obtener caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener la caja' });
  }
};

// Abrir una nueva caja
export const abrirCaja = async (req: Request, res: Response) => {
  const { 
    sucursalId, 
    usuarioId, 
    maletinId, 
    saldoInicial, 
    saldosServiciosInicial 
  } = req.body;

  try {
    // Verificar datos requeridos
    if (!sucursalId || !usuarioId || !maletinId || !saldoInicial || !saldosServiciosInicial) {
      return res.status(400).json({ error: 'Faltan datos requeridos para abrir la caja' });
    }

    // Verificar si existe la sucursal
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: parseInt(sucursalId) }
    });
    
    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    
    // Verificar si el maletín ya está en uso en una caja abierta
    const maletinEnUso = await prisma.caja.findFirst({
      where: {
        maletinId: parseInt(maletinId),
        estado: 'abierta'
      }
    });
    
    if (maletinEnUso) {
      return res.status(400).json({ 
        error: 'El maletín seleccionado ya está en uso por otra caja abierta',
        codigo: 'MALETIN_EN_USO'
      });
    }
    
    // Crear la nueva caja
    const nuevaCaja = await prisma.caja.create({
      data: {
        sucursalId: parseInt(sucursalId),
        usuarioId: parseInt(usuarioId),
        maletinId: parseInt(maletinId),
        estado: 'abierta',
        fechaApertura: new Date(),
        saldoInicialPYG: saldoInicial.total.PYG || 0,
        saldoInicialBRL: saldoInicial.total.BRL || 0,
        saldoInicialUSD: saldoInicial.total.USD || 0,
        detallesDenominacion: JSON.stringify(saldoInicial),
        servicios: JSON.stringify(saldosServiciosInicial)
      },
      include: {
        sucursal: true,
        usuario: true,
        maletin: true
      }
    });

    // Convertir los datos de Prisma al formato esperado por el frontend
    const cajaFormateada = {
      id: nuevaCaja.id,
      sucursalId: nuevaCaja.sucursalId.toString(),
      sucursal: {
        id: nuevaCaja.sucursal.id.toString(),
        nombre: nuevaCaja.sucursal.nombre,
        codigo: nuevaCaja.sucursal.codigo,
        direccion: nuevaCaja.sucursal.direccion,
        telefono: nuevaCaja.sucursal.telefono,
        email: nuevaCaja.sucursal.email || ''
      },
      usuarioId: nuevaCaja.usuarioId.toString(),
      usuario: nuevaCaja.usuario.nombre,
      maletinId: nuevaCaja.maletinId.toString(),
      fechaApertura: nuevaCaja.fechaApertura.toISOString(),
      fechaCierre: nuevaCaja.fechaCierre ? nuevaCaja.fechaCierre.toISOString() : null,
      estado: nuevaCaja.estado,
      saldoInicial: saldoInicial,
      saldosServiciosInicial: saldosServiciosInicial,
      createdAt: nuevaCaja.createdAt.toISOString(),
      updatedAt: nuevaCaja.updatedAt.toISOString()
    };

    return res.status(201).json(cajaFormateada);
  } catch (error) {
    console.error('Error al abrir caja:', error);
    return res.status(500).json({ error: 'Error al abrir la caja', details: String(error) });
  }
};

// Cerrar una caja
export const cerrarCaja = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    saldoFinal, 
    saldosServiciosFinal
  } = req.body;

  try {
    // Verificar datos requeridos
    if (!saldoFinal || !saldoFinal.total) {
      return res.status(400).json({ error: 'Datos de saldo incompletos' });
    }
    
    // Asegurar que saldosServiciosFinal sea un array
    const serviciosFinalArray = Array.isArray(saldosServiciosFinal) ? saldosServiciosFinal : [];

    // Buscar la caja
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (caja.estado === 'cerrada') {
      return res.status(400).json({ error: 'La caja ya está cerrada' });
    }

    // Asegurarse de que los valores numéricos sean válidos
    const saldoFinalPYG = parseFloat(saldoFinal.total.PYG || 0);
    const saldoFinalBRL = parseFloat(saldoFinal.total.BRL || 0);
    const saldoFinalUSD = parseFloat(saldoFinal.total.USD || 0);

    // Convertir los objetos a JSON de forma segura
    let detallesDenominacionFinalJSON;
    let serviciosFinalJSON;

    try {
      detallesDenominacionFinalJSON = JSON.stringify(saldoFinal);
    } catch (error) {
      console.error('Error al convertir saldoFinal a JSON:', error);
      return res.status(400).json({ error: 'Error en el formato de los datos de saldo' });
    }

    try {
      serviciosFinalJSON = JSON.stringify(serviciosFinalArray);
    } catch (error) {
      console.error('Error al convertir saldosServiciosFinal a JSON:', error);
      return res.status(400).json({ error: 'Error en el formato de los datos de servicios' });
    }

    // Actualizar la caja
    // @ts-ignore - Ignoramos el error de tipo para detallesDenominacionFinal y serviciosFinal
    const cajaActualizada = await prisma.caja.update({
      where: { id },
      data: {
        estado: 'cerrada',
        fechaCierre: new Date(),
        saldoFinalPYG: saldoFinalPYG,
        saldoFinalBRL: saldoFinalBRL,
        saldoFinalUSD: saldoFinalUSD,
        // Usamos any para evitar errores de tipo
        detallesDenominacionFinal: detallesDenominacionFinalJSON as any,
        serviciosFinal: serviciosFinalJSON as any
      },
      include: {
        sucursal: true,
        usuario: true,
        maletin: true
      }
    });

    // Función auxiliar para transformar detalles JSON
    const parseJSONSafely = (value: any): any => {
      if (value === null || value === undefined) {
        return null;
      }
      
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          console.error("Error al parsear JSON:", e);
          return null;
        }
      }
      
      return value;
    };

    // Convertir a formato esperado
    const cajaFormateada = {
      id: cajaActualizada.id,
      sucursalId: cajaActualizada.sucursalId.toString(),
      sucursal: {
        id: cajaActualizada.sucursal.id.toString(),
        nombre: cajaActualizada.sucursal.nombre,
        codigo: cajaActualizada.sucursal.codigo,
        direccion: cajaActualizada.sucursal.direccion,
        telefono: cajaActualizada.sucursal.telefono,
        email: cajaActualizada.sucursal.email || ''
      },
      usuarioId: cajaActualizada.usuarioId.toString(),
      usuario: cajaActualizada.usuario.nombre,
      maletinId: cajaActualizada.maletinId.toString(),
      fechaApertura: cajaActualizada.fechaApertura.toISOString(),
      fechaCierre: cajaActualizada.fechaCierre ? cajaActualizada.fechaCierre.toISOString() : null,
      estado: cajaActualizada.estado,
      saldoInicial: parseJSONSafely(cajaActualizada.detallesDenominacion),
      saldosServiciosInicial: parseJSONSafely(cajaActualizada.servicios) || [],
      saldoFinal: saldoFinal,
      saldosServiciosFinal: serviciosFinalArray,
      createdAt: cajaActualizada.createdAt.toISOString(),
      updatedAt: cajaActualizada.updatedAt.toISOString()
    };

    return res.json(cajaFormateada);
  } catch (error) {
    console.error(`Error al cerrar caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al cerrar la caja' });
  }
};

// Agregar un movimiento de servicio a una caja
export const agregarMovimiento = async (req: Request, res: Response) => {
  const { id } = req.params;
  const datosMovimiento = req.body;

  try {
    // Verificar que exista la caja
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Validar estructura de los datos de movimientos
    if (!datosMovimiento) {
      return res.status(400).json({ error: 'Formato de datos inválido' });
    }

    // Definimos la interfaz para el tipo de movimiento
    interface MovimientoItem {
      operadora: string;
      servicio: string;
      monto: number;
    }

    // Verificar si es una actualización completa (que incluya valores en cero)
    const actualizarTodos = datosMovimiento.actualizarTodos === true;

    // Si es una actualización completa, primero eliminamos todos los movimientos existentes de la caja
    if (actualizarTodos) {
      await prisma.movimientoCaja.deleteMany({
        where: {
          cajaId: id
        }
      });
    }

    // Transformamos el objeto de movimientos a un array de operadora/servicio/monto
    const movimientosArray: MovimientoItem[] = [];
    
    // Procesamos el objeto datosMovimiento que viene del frontend (VerMovimientosDialog)
    // El formato es { tigo: { miniCarga: 1000, ... }, personal: { ... } }
    Object.entries(datosMovimiento).forEach(([operadora, servicios]) => {
      // Saltamos las propiedades que no son objetos de servicios
      if (operadora === 'actualizarTodos') return;
      
      if (typeof servicios === 'object' && servicios !== null) {
        Object.entries(servicios).forEach(([servicio, monto]) => {
          // Si es actualización completa, incluimos todos los valores, incluso ceros
          // Si no, solo incluimos valores > 0
          if (actualizarTodos || Number(monto) > 0) {
            movimientosArray.push({
              operadora,
              servicio,
              monto: Number(monto)
            });
          }
        });
      }
    });

    // Crear múltiples registros en MovimientoCaja
    const movimientosCreados = await Promise.all(
      movimientosArray.map(async (movimiento) => {
        return prisma.movimientoCaja.create({
          data: {
            cajaId: id,
            operadora: movimiento.operadora,
            servicio: movimiento.servicio,
            monto: movimiento.monto
          }
        });
      })
    );
    
    return res.status(201).json({ 
      mensaje: 'Movimientos agregados correctamente',
      movimientos: movimientosCreados
    });
  } catch (error) {
    console.error(`Error al agregar movimientos a caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al agregar los movimientos' });
  }
};

// Función para agregar un comprobante a una caja
export const agregarComprobante = async (req: Request, res: Response) => {
  const { id } = req.params; // Caja ID
  const { tipo } = req.body; // Tipo de comprobante (e.g., 'minicargas')

  // Verificar datos requeridos ANTES de la transacción
  if (!tipo) {
    return res.status(400).json({ error: 'Faltan datos requeridos para el comprobante (tipo)' });
  }
  if (!req.file || !req.file.filename) {
    console.error('Error: req.file.filename no está disponible en agregarComprobante.');
    return res.status(400).json({ error: 'No se ha proporcionado un archivo válido' });
  }
  
  // Obtener la ruta relativa fuera de la transacción
  const urlRelativa = `/uploads/${req.file.filename}`;
  console.log(`[${tipo}] Archivo preparado. Ruta relativa:`, urlRelativa);

  // Determinar operadora y servicio basados en el tipo
  let operadora = '';
  let servicio = '';
  // ... (Lógica de mapeo tipo -> operadora/servicio - Copiada de la versión anterior) ...
    if (tipo === 'minicargas') { operadora = 'tigo'; servicio = 'miniCarga'; }
    else if (tipo === 'girosEnviadosTigo') { operadora = 'tigo'; servicio = 'girosEnviados'; }
    else if (tipo === 'retirosTigoMoney') { operadora = 'tigo'; servicio = 'retiros'; }
    else if (tipo === 'cargasBilleteraTigo') { operadora = 'tigo'; servicio = 'cargaBilleteras'; }
    else if (tipo === 'maxicargas') { operadora = 'personal'; servicio = 'maxiCarga'; }
    else if (tipo === 'girosEnviadosPersonal') { operadora = 'personal'; servicio = 'girosEnviados'; }
    else if (tipo === 'retirosBilleteraPersonal') { operadora = 'personal'; servicio = 'retiros'; }
    else if (tipo === 'cargasBilleteraPersonal') { operadora = 'personal'; servicio = 'cargaBilleteras'; }
    else if (tipo === 'recargaClaro') { operadora = 'claro'; servicio = 'recargaClaro'; }
    else if (tipo === 'girosEnviadosClaro') { operadora = 'claro'; servicio = 'girosEnviados'; }
    else if (tipo === 'retirosBilleteraClaro') { operadora = 'claro'; servicio = 'retiros'; }
    else if (tipo === 'cargasBilleteraClaro') { operadora = 'claro'; servicio = 'cargaBilleteras'; }
    else if (tipo === 'aquiPago') { operadora = 'aquiPago'; servicio = 'pagos'; } // Asume tipo general es pagos
    else if (tipo === 'wepaGuaranies') { operadora = 'wepaGuaranies'; servicio = 'pagos'; } // Asume tipo general es pagos
    else if (tipo === 'wepaDolares') { operadora = 'wepaDolares'; servicio = 'pagos'; } // Asume tipo general es pagos
    else if (tipo === 'retirosAquiPago') { operadora = 'aquiPago'; servicio = 'retiros'; }
    else if (tipo === 'retirosWepaGuaranies') { operadora = 'wepaGuaranies'; servicio = 'retiros'; }
    else if (tipo === 'retirosWepaDolares') { operadora = 'wepaDolares'; servicio = 'retiros'; }

  try {
    // Ejecutar actualizaciones de DB dentro de una transacción interactiva
    const cajaActualizada = await prisma.$transaction(async (tx) => {
      console.log(`[${tipo}] Iniciando transacción...`);

      // 1. Verificar existencia de la caja DENTRO de la transacción
      const cajaInicial = await tx.caja.findUnique({ where: { id }, select: { id: true, servicios: true }});
      if (!cajaInicial) {
          throw new Error('Caja no encontrada'); // Error abortará la transacción
      }

      // 2. Actualizar MovimientoCaja (o crear si no existe) DENTRO de la transacción
      if (operadora && servicio) {
        const movimientoActualizado = await tx.movimientoCaja.updateMany({
          where: { cajaId: id, operadora: operadora, servicio: servicio },
          data: { rutaComprobante: urlRelativa }
        });
        console.log(`[${tipo}] Resultado update MovimientoCaja:`, movimientoActualizado);
        if (movimientoActualizado.count === 0) {
          // Si no existe, crearlo (asumiendo monto 0 por defecto para comprobantes)
          await tx.movimientoCaja.create({
            data: {
              cajaId: id, operadora: operadora, servicio: servicio,
              monto: 0, rutaComprobante: urlRelativa
            }
          });
          console.log(`[${tipo}] Nuevo MovimientoCaja creado.`);
        }
      }
      // Lógica especial AquiPago/Wepa (actualizar ambos registros si es el tipo general)
      else if (tipo === 'aquiPago' || tipo === 'wepaGuaranies' || tipo === 'wepaDolares') {
         const op = tipo as 'aquiPago' | 'wepaGuaranies' | 'wepaDolares';
         // Actualizar pagos (el mapeo ya debería haber asignado servicio='pagos')
         await tx.movimientoCaja.updateMany({ where: { cajaId: id, operadora: op, servicio: 'pagos' }, data: { rutaComprobante: urlRelativa }});
         // Actualizar retiros también con la misma URL para estos casos generales
         await tx.movimientoCaja.updateMany({ where: { cajaId: id, operadora: op, servicio: 'retiros' }, data: { rutaComprobante: urlRelativa }});
         console.log(`[${tipo}] Movimientos (pagos/retiros) actualizados.`);
      }

      // 3. Leer el estado MÁS RECIENTE de Caja.servicios (ya lo hicimos con cajaInicial)
      let serviciosActuales = {};
      if (cajaInicial.servicios) {
        try {
          serviciosActuales = typeof cajaInicial.servicios === 'string'
            ? JSON.parse(cajaInicial.servicios)
            : (cajaInicial.servicios || {}); // Asegurar que sea objeto o vacío
        } catch (e) {
          console.error(`[${tipo}] Error parseando servicios en transacción:`, e);
          // Considerar si abortar la transacción o continuar con objeto vacío
          serviciosActuales = {};
        }
      }

      // 4. Fusionar el nuevo comprobante
      const serviciosParaGuardar = {
        ...serviciosActuales,
        [tipo]: urlRelativa // Añade o sobrescribe la clave actual
      };
      console.log(`[${tipo}] Servicios JSON a guardar:`, serviciosParaGuardar);

      // 5. Actualizar Caja.servicios DENTRO de la transacción
      const cajaActualizadaEnTx = await tx.caja.update({
        where: { id },
        data: {
          // Guardar como JSON stringificado
          servicios: JSON.stringify(serviciosParaGuardar)
        },
        // Incluir relaciones para la respuesta final si es necesario
        include: { sucursal: true, usuario: true, maletin: true }
      });
      console.log(`[${tipo}] Caja.servicios actualizado en transacción.`);
      
      return cajaActualizadaEnTx; // Devolver la caja actualizada desde la transacción
    }); // Fin de la transacción

    console.log(`[${tipo}] Transacción completada exitosamente.`);

    // Convertir a formato esperado (usando cajaActualizada devuelta por la transacción)
     const parseSafely = (value: any): any => {
      if (!value) return null;
      if (typeof value === 'object') return value; // Si ya es objeto (JSON de DB)
      try { return JSON.parse(value); } catch (e) { return null; }
    };
    const cajaFormateada = {
      id: cajaActualizada.id,
      sucursalId: cajaActualizada.sucursalId.toString(),
      sucursal: {
        id: cajaActualizada.sucursal.id.toString(),
        nombre: cajaActualizada.sucursal.nombre,
        codigo: cajaActualizada.sucursal.codigo,
        direccion: cajaActualizada.sucursal.direccion,
        telefono: cajaActualizada.sucursal.telefono,
        email: cajaActualizada.sucursal.email || ''
      },
      usuarioId: cajaActualizada.usuarioId.toString(),
      usuario: cajaActualizada.usuario.nombre, // Asumiendo que 'nombre' está en el include
      maletinId: cajaActualizada.maletinId.toString(),
      fechaApertura: cajaActualizada.fechaApertura.toISOString(),
      fechaCierre: cajaActualizada.fechaCierre ? cajaActualizada.fechaCierre.toISOString() : null,
      estado: cajaActualizada.estado,
       // Parsear los campos JSON para la respuesta
      saldoInicial: parseSafely(cajaActualizada.detallesDenominacion),
      saldosServiciosInicial: parseSafely(cajaActualizada.servicios), // Devolvemos los servicios actualizados
      // Los campos comprobantes no parecen estar en el modelo Caja, los servicios contienen las URLs
      createdAt: cajaActualizada.createdAt.toISOString(),
      updatedAt: cajaActualizada.updatedAt.toISOString()
    };

    return res.json(cajaFormateada); // Devolver la caja formateada

  } catch (error) {
    console.error(`[${tipo}] Error procesando agregarComprobante:`, error);
    // Importante: Borrar el archivo físico si Multer lo guardó y la transacción falló
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log(`[${tipo}] Archivo ${req.file.filename} borrado debido a error en transacción.`);
      } catch (e) {
        console.error(`[${tipo}] Error al intentar borrar archivo ${req.file.filename} tras fallo:`, e);
      }
    }
     // Devolver un error genérico o más específico si es posible
     const errorMessage = error instanceof Error ? error.message : 'Error interno al agregar el comprobante';
    return res.status(500).json({ error: errorMessage });
  }
};

// --- Ajuste similar necesario para actualizarComprobante ---

// Obtener los retiros de una caja
export const getRetirosByCaja = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Verificar si la caja existe
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Buscar los retiros asociados a esta caja usando SQL crudo
    // para evitar problemas de tipado con el campo estadoRecepcion
    const retiros = await prisma.$queryRaw`
      SELECT 
        id, fecha, descripcion, "tipoMovimiento", 
        monto, moneda, "cajaId", "nombrePersona", 
        "documentoPersona", observaciones, "estadoRecepcion"
      FROM "Movimiento"
      WHERE "cajaId" = ${id}
      AND "tipoMovimiento" = 'EGRESO'
      ORDER BY fecha DESC
    `;

    // Creamos un mapa para agrupar por persona y fecha
    interface RetiroAgrupado {
      id: string;
      ids: string[]; // Array de IDs originales
      fecha: Date;
      personaNombre: string;
      documentoPersona: string | null;
      montoPYG: number;
      montoBRL: number;
      montoUSD: number;
      observacion: string;
      estadoRecepcion: string; // Campo para el estado de recepción
    }

    const mapaRetiros = new Map<string, RetiroAgrupado>();

    // Agrupamos los retiros por personaNombre + fecha redondeada al minuto + observación
    // @ts-ignore - Ignoramos errores de tipado porque estamos usando SQL crudo
    retiros.forEach(retiro => {
      // Redondeamos la fecha al minuto para agrupar retiros cercanos
      const fechaRedondeada = new Date(retiro.fecha);
      fechaRedondeada.setSeconds(0, 0); // Eliminamos segundos y milisegundos
      
      // Creamos una clave única para el grupo
      const clave = `${retiro.nombrePersona || ''}_${fechaRedondeada.toISOString()}_${retiro.observaciones || ''}`;
      
      if (mapaRetiros.has(clave)) {
        // Si ya existe un retiro con esta clave, actualizamos los montos
        const retiroExistente = mapaRetiros.get(clave)!;
        
        // Añadimos el ID original
        retiroExistente.ids.push(retiro.id);
        
        // Sumamos el monto según la moneda
        if (retiro.moneda === 'PYG') {
          retiroExistente.montoPYG += Number(retiro.monto);
        } else if (retiro.moneda === 'BRL') {
          retiroExistente.montoBRL += Number(retiro.monto);
        } else if (retiro.moneda === 'USD') {
          retiroExistente.montoUSD += Number(retiro.monto);
        }

        // Actualizamos el estado si alguno de los retiros no está recibido
        if (retiro.estadoRecepcion !== 'RECIBIDO') {
          retiroExistente.estadoRecepcion = 'PENDIENTE';
        }
      } else {
        // Si no existe, creamos un nuevo retiro agrupado
        mapaRetiros.set(clave, {
          id: retiro.id, // Usamos el primer ID como ID principal
          ids: [retiro.id], // Guardamos todos los IDs para posible eliminación en conjunto
          fecha: retiro.fecha,
          personaNombre: retiro.nombrePersona || '',
          documentoPersona: retiro.documentoPersona,
          montoPYG: retiro.moneda === 'PYG' ? Number(retiro.monto) : 0,
          montoBRL: retiro.moneda === 'BRL' ? Number(retiro.monto) : 0,
          montoUSD: retiro.moneda === 'USD' ? Number(retiro.monto) : 0,
          observacion: retiro.observaciones || '',
          estadoRecepcion: retiro.estadoRecepcion || 'PENDIENTE'
        });
      }
    });

    // Convertimos el mapa a un array y ordenamos por fecha descendente
    const retirosAgrupados = Array.from(mapaRetiros.values())
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    // Formatear los retiros para el frontend
    const retirosFormateados = retirosAgrupados.map(retiro => ({
      id: retiro.id,
      ids: retiro.ids, // Incluimos todos los IDs para manejo en el frontend
      fecha: retiro.fecha.toISOString(),
      personaNombre: retiro.personaNombre,
      montoPYG: retiro.montoPYG,
      montoBRL: retiro.montoBRL,
      montoUSD: retiro.montoUSD,
      observacion: retiro.observacion,
      estadoRecepcion: retiro.estadoRecepcion // Incluimos el estado de recepción
    }));

    return res.json(retirosFormateados);
  } catch (error) {
    console.error(`Error al obtener retiros de caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener los retiros' });
  }
};

// Crear un retiro
export const createRetiro = async (req: Request, res: Response) => {
  const { cajaId } = req.params;
  const { montoPYG, montoBRL, montoUSD, personaId, personaNombre, observacion } = req.body;

  try {
    // Verificar si la caja existe y está abierta
    const caja = await prisma.caja.findUnique({
      where: { id: cajaId },
      include: { sucursal: true } // Incluir la información de la sucursal
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Verificar que al menos un monto sea mayor a cero
    if (
      (parseFloat(montoPYG) <= 0 || isNaN(parseFloat(montoPYG))) &&
      (parseFloat(montoBRL) <= 0 || isNaN(parseFloat(montoBRL))) &&
      (parseFloat(montoUSD) <= 0 || isNaN(parseFloat(montoUSD)))
    ) {
      return res.status(400).json({ error: 'Debe ingresar al menos un monto válido para realizar el retiro' });
    }

    // Obtener información de la sucursal
    const sucursalId = caja.sucursalId.toString();
    const sucursalNombre = caja.sucursal.nombre;

    // Array para almacenar los IDs de los retiros creados
    const retirosIds: string[] = [];

    // Función para crear un retiro usando SQL directo
    const crearRetiro = async (monto: number, moneda: string) => {
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "Movimiento" (
          "id", "fecha", "descripcion", "tipoMovimiento", 
          "monto", "moneda", "cajaId", "nombrePersona", 
          "documentoPersona", "observaciones", "sucursalId", 
          "sucursalNombre", "estadoRecepcion", "createdAt", "updatedAt"
        ) VALUES (
          ${id}, ${new Date()}, 'Retiro de caja', 'EGRESO', 
          ${monto}, ${moneda}, ${cajaId}, ${personaNombre}, 
          ${personaId}, ${observacion}, ${sucursalId}, 
          ${sucursalNombre}, 'PENDIENTE', ${new Date()}, ${new Date()}
        )
      `;
      return id;
    };

    // Crear los retiros para cada moneda con valor
    if (parseFloat(montoPYG) > 0) {
      const id = await crearRetiro(parseFloat(montoPYG), 'PYG');
      retirosIds.push(id);
    }

    if (parseFloat(montoBRL) > 0) {
      const id = await crearRetiro(parseFloat(montoBRL), 'BRL');
      retirosIds.push(id);
    }

    if (parseFloat(montoUSD) > 0) {
      const id = await crearRetiro(parseFloat(montoUSD), 'USD');
      retirosIds.push(id);
    }

    // Formatear la respuesta
    const retiroFormateado = {
      id: retirosIds[0],
      fecha: new Date().toISOString(),
      personaNombre,
      montoPYG: parseFloat(montoPYG) || 0,
      montoBRL: parseFloat(montoBRL) || 0,
      montoUSD: parseFloat(montoUSD) || 0,
      observacion,
      sucursalId,
      sucursalNombre,
      estadoRecepcion: 'PENDIENTE'
    };

    return res.status(201).json(retiroFormateado);
  } catch (error) {
    console.error(`Error al crear retiro para la caja ${cajaId}:`, error);
    return res.status(500).json({ error: 'Error al registrar el retiro' });
  }
};

// Eliminar un retiro
export const deleteRetiro = async (req: Request, res: Response) => {
  const { retiroId } = req.params;
  const { ids } = req.body; // Array de IDs a eliminar (opcional)

  try {
    // Si se proporciona una lista de IDs, eliminamos todos esos registros
    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Verificar que todos los IDs existan y pertenezcan a la misma caja
      const retiros = await prisma.movimiento.findMany({
        where: {
          id: { in: ids },
          tipoMovimiento: 'EGRESO'
        },
        include: { caja: true }
      });

      if (retiros.length !== ids.length) {
        return res.status(404).json({ error: 'Uno o más retiros no fueron encontrados' });
      }

      // Verificar que todos los retiros pertenezcan a la misma caja
      const cajaId = retiros[0]?.cajaId;
      const todosMismaCaja = retiros.every(r => r.cajaId === cajaId);
      
      if (!todosMismaCaja) {
        return res.status(400).json({ error: 'Todos los retiros deben pertenecer a la misma caja' });
      }

      // Eliminar todos los retiros
      await prisma.movimiento.deleteMany({
        where: {
          id: { in: ids },
          tipoMovimiento: 'EGRESO'
        }
      });

      return res.json({ message: 'Retiros eliminados correctamente' });
    } else {
      // Comportamiento original para un solo ID
      // Buscar el retiro para verificar que existe
      const retiro = await prisma.movimiento.findUnique({
        where: { id: retiroId },
        include: { caja: true }
      });

      if (!retiro) {
        return res.status(404).json({ error: 'Retiro no encontrado' });
      }

      // Verificar que el retiro sea un movimiento de egreso
      if (retiro.tipoMovimiento !== 'EGRESO') {
        return res.status(400).json({ error: 'El movimiento no corresponde a un retiro' });
      }

      // Eliminar el retiro
      await prisma.movimiento.delete({
        where: { id: retiroId }
      });

      return res.json({ message: 'Retiro eliminado correctamente' });
    }
  } catch (error) {
    console.error(`Error al eliminar el retiro ${retiroId}:`, error);
    return res.status(500).json({ error: 'Error al eliminar el retiro' });
  }
};

// Obtener los pagos de una caja
export const getPagosByCaja = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Verificar si la caja existe
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Buscar los pagos asociados a esta caja
    const pagos = await prisma.pago.findMany({
      where: {
        cajaId: id
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    return res.json(pagos);
  } catch (error) {
    console.error(`Error al obtener pagos de caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener los pagos' });
  }
};

// Crear un nuevo pago
export const createPago = async (req: Request, res: Response) => {
  const { id } = req.params; // id de la caja
  const { operadora, servicio, monto, moneda, observacion } = req.body;

  try {
    // Verificar si la caja existe y está abierta
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Validaciones
    if (!operadora || !servicio || !monto || !moneda) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const montoNumerico = parseFloat(monto.toString());
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a cero' });
    }

    // Preparar datos para el pago
    let rutaComprobante = null;

    // Si hay un archivo adjunto (comprobante)
    if (req.file) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(req.file.originalname);
      const fileName = `pago-${uniqueSuffix}${fileExt}`;
      
      // Crear directorio si no existe
      const comprobantesDir = path.join(__dirname, '../../uploads/comprobantes');
      if (!fs.existsSync(comprobantesDir)) {
        fs.mkdirSync(comprobantesDir, { recursive: true });
      }
      
      // Guardar el archivo
      fs.writeFileSync(path.join(comprobantesDir, fileName), req.file.buffer);
      rutaComprobante = `/uploads/comprobantes/${fileName}`;
    }

    // Crear el pago
    const nuevoPago = await prisma.pago.create({
      data: {
        operadora,
        servicio,
        monto: montoNumerico,
        moneda,
        observacion,
        cajaId: id,
        rutaComprobante
      }
    });

    return res.status(201).json(nuevoPago);
  } catch (error) {
    console.error(`Error al crear pago para caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al crear el pago' });
  }
};

// Eliminar un pago
export const deletePago = async (req: Request, res: Response) => {
  const { pagoId } = req.params;

  try {
    // Buscar el pago
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: { caja: true }
    });

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Eliminar el comprobante si existe
    if (pago.rutaComprobante) {
      const rutaComprobante = path.join(__dirname, '../..', pago.rutaComprobante);
      if (fs.existsSync(rutaComprobante)) {
        fs.unlinkSync(rutaComprobante);
      }
    }

    // Eliminar el pago
    await prisma.pago.delete({
      where: { id: pagoId }
    });

    return res.json({ mensaje: 'Pago eliminado correctamente' });
  } catch (error) {
    console.error(`Error al eliminar pago ${pagoId}:`, error);
    return res.status(500).json({ error: 'Error al eliminar el pago' });
  }
};

// Actualizar un pago existente
export const updatePago = async (req: Request, res: Response) => {
  const { pagoId } = req.params;
  const { operadora, servicio, monto, moneda, observacion } = req.body;

  try {
    // Buscar el pago
    const pagoExistente = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: { caja: true }
    });

    if (!pagoExistente) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Validaciones
    if (!operadora || !servicio || !monto || !moneda) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const montoNumerico = parseFloat(monto.toString());
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a cero' });
    }

    // Preparar datos para actualizar el pago
    let rutaComprobante = pagoExistente.rutaComprobante;

    // Si hay un archivo adjunto (comprobante) nuevo
    if (req.file) {
      // Eliminar el comprobante anterior si existe
      if (pagoExistente.rutaComprobante) {
        const rutaComprobanteAnterior = path.join(__dirname, '../..', pagoExistente.rutaComprobante);
        if (fs.existsSync(rutaComprobanteAnterior)) {
          fs.unlinkSync(rutaComprobanteAnterior);
        }
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(req.file.originalname);
      const fileName = `pago-${uniqueSuffix}${fileExt}`;
      
      // Crear directorio si no existe
      const comprobantesDir = path.join(__dirname, '../../uploads/comprobantes');
      if (!fs.existsSync(comprobantesDir)) {
        fs.mkdirSync(comprobantesDir, { recursive: true });
      }
      
      // Guardar el archivo
      fs.writeFileSync(path.join(comprobantesDir, fileName), req.file.buffer);
      rutaComprobante = `/uploads/comprobantes/${fileName}`;
    }

    // Actualizar el pago
    const pagoActualizado = await prisma.pago.update({
      where: { id: pagoId },
      data: {
        operadora,
        servicio,
        monto: montoNumerico,
        moneda,
        observacion,
        rutaComprobante
      }
    });

    return res.status(200).json(pagoActualizado);
  } catch (error) {
    console.error(`Error al actualizar pago ${pagoId}:`, error);
    return res.status(500).json({ error: 'Error al actualizar el pago' });
  }
};

// Obtener las operaciones bancarias de una caja
export const getOperacionesBancariasByCaja = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Verificar si la caja existe
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Por ahora, devolvemos un array vacío ya que no tenemos tabla de operaciones bancarias
    // En el futuro, aquí buscaríamos operaciones bancarias asociadas a la caja
    return res.json([]);
  } catch (error) {
    console.error(`Error al obtener operaciones bancarias de caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener las operaciones bancarias' });
  }
};

// Obtener movimientos de una caja
export const obtenerMovimientos = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Verificar que exista la caja
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Obtener todos los movimientos de la caja
    const movimientos = await prisma.movimientoCaja.findMany({
      where: {
        cajaId: id
      }
    });

    // Agrupar los movimientos por operadora y servicio
    const movimientosAgrupados: Record<string, Record<string, number>> = {};

    movimientos.forEach(movimiento => {
      if (!movimientosAgrupados[movimiento.operadora]) {
        movimientosAgrupados[movimiento.operadora] = {};
      }
      // Convertir Decimal a number si es necesario
      const monto = typeof movimiento.monto === 'object' && 'toNumber' in movimiento.monto
        ? movimiento.monto.toNumber()
        : Number(movimiento.monto);
      
      movimientosAgrupados[movimiento.operadora][movimiento.servicio] = monto;
    });

    // Obtener también el campo servicios de la caja para los comprobantes
    let serviciosData: Record<string, any> | null = null;
    if (caja.servicios) {
      try {
        serviciosData = typeof caja.servicios === 'string'
          ? JSON.parse(caja.servicios)
          : caja.servicios; // Asumimos que ya es un objeto si no es string
      } catch (e) {
        console.error(`Error al parsear servicios para caja ${id} en obtenerMovimientos:`, e);
        // Dejar serviciosData como null si hay error
      }
    }

    // --- Código anterior que buscaba en comprobanteCaja (eliminado/comentado) ---
    /*
    // Obtener comprobantes relacionados con esta caja
    // Verificar si la tabla comprobanteCaja existe en el modelo
    let comprobantes = [];
    if ('comprobanteCaja' in prisma) {
      comprobantes = await (prisma as any).comprobanteCaja.findMany({
        where: {
          cajaId: id
        },
        select: {
          id: true,
          tipo: true,
          nombre: true
        }
      });
    }
    */

    return res.status(200).json({
      data: movimientosAgrupados,
      // comprobantes // Ya no devolvemos esto
      serviciosData: serviciosData ?? {} // Devolvemos el objeto servicios o un objeto vacío
    });
  } catch (error) {
    console.error(`Error al obtener movimientos de caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener los movimientos' });
  }
};

// Obtener un comprobante específico por ID
export const obtenerComprobante = async (req: Request, res: Response) => {
  const { id, comprobanteId } = req.params;

  try {
    // Verificar si la caja existe
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Obtener los servicios donde se almacenan las URLs de los comprobantes
    let servicios: any = {};
    if (caja.servicios) {
      try {
        servicios = typeof caja.servicios === 'string'
          ? JSON.parse(caja.servicios.toString())
          : caja.servicios;
      } catch (error) {
        console.error('Error al parsear servicios:', error);
        return res.status(500).json({ error: 'Error al obtener los datos de comprobantes' });
      }
    }

    // Verificar si existe el comprobante con el ID proporcionado
    // En este caso, comprobanteId corresponde al tipo del comprobante
    if (!servicios[comprobanteId]) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }

    // Construir la URL completa para el comprobante
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'; // <-- Cambiado a 3000
    const url = `${serverUrl}${servicios[comprobanteId]}`;

    return res.json({
      id: comprobanteId,
      tipo: comprobanteId,
      nombre: `Comprobante de ${comprobanteId}`,
      url
    });
  } catch (error) {
    console.error(`Error al obtener comprobante ${comprobanteId} de caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener el comprobante' });
  }
};

// Actualizar los datos de apertura de una caja
export const actualizarDatosApertura = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    saldoInicial, 
    saldosServiciosInicial 
  } = req.body;

  try {
    // Verificar datos requeridos
    if (!saldoInicial || !saldosServiciosInicial) {
      return res.status(400).json({ error: 'Faltan datos requeridos para actualizar la apertura de caja' });
    }

    // Buscar la caja
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Actualizar la caja
    const cajaActualizada = await prisma.caja.update({
      where: { id },
      data: {
        saldoInicialPYG: saldoInicial.total.PYG || 0,
        saldoInicialBRL: saldoInicial.total.BRL || 0,
        saldoInicialUSD: saldoInicial.total.USD || 0,
        detallesDenominacion: JSON.stringify(saldoInicial),
        servicios: JSON.stringify(saldosServiciosInicial)
      },
      include: {
        sucursal: true,
        usuario: true,
        maletin: true
      }
    });

    // Convertir a formato esperado
    const cajaFormateada = {
      id: cajaActualizada.id,
      sucursalId: cajaActualizada.sucursalId.toString(),
      sucursal: {
        id: cajaActualizada.sucursal.id.toString(),
        nombre: cajaActualizada.sucursal.nombre,
        codigo: cajaActualizada.sucursal.codigo,
        direccion: cajaActualizada.sucursal.direccion,
        telefono: cajaActualizada.sucursal.telefono,
        email: cajaActualizada.sucursal.email || ''
      },
      usuarioId: cajaActualizada.usuarioId.toString(),
      usuario: cajaActualizada.usuario.nombre,
      maletinId: cajaActualizada.maletinId.toString(),
      fechaApertura: cajaActualizada.fechaApertura.toISOString(),
      fechaCierre: cajaActualizada.fechaCierre ? cajaActualizada.fechaCierre.toISOString() : null,
      estado: cajaActualizada.estado,
      saldoInicial: saldoInicial,
      saldosServiciosInicial: saldosServiciosInicial,
      createdAt: cajaActualizada.createdAt.toISOString(),
      updatedAt: cajaActualizada.updatedAt.toISOString()
    };

    return res.json(cajaFormateada);
  } catch (error) {
    console.error(`Error al actualizar datos de apertura de caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al actualizar los datos de apertura de caja' });
  }
};

// Obtener datos de cierre de una caja
export const obtenerDatosCierre = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Consultar la caja en la base de datos con todos los campos para diagnóstico
    const cajaDiagnostico = await prisma.caja.findUnique({
      where: { id }
    });
    
    console.log("DIAGNÓSTICO - Campos disponibles en la caja:", Object.keys(cajaDiagnostico || {}));
    
    // Usar una función auxiliar para imprimir de forma segura la información de diagnóstico
    const logSafely = (label: string, value: any) => {
      try {
        console.log(`DIAGNÓSTICO - ${label}:`, 
          value === undefined ? 'undefined' : 
          value === null ? 'null' : 
          typeof value === 'object' ? JSON.stringify(value).substring(0, 100) + '...' : value);
      } catch (e) {
        console.log(`DIAGNÓSTICO - Error al imprimir ${label}:`, e);
      }
    };
    
    logSafely('Valor de detallesDenominacionFinal', cajaDiagnostico?.detallesDenominacionFinal);
    logSafely('Tipo de detallesDenominacionFinal', cajaDiagnostico?.detallesDenominacionFinal !== undefined ? typeof cajaDiagnostico.detallesDenominacionFinal : 'undefined');
    logSafely('Tipo de detallesDenominacion', cajaDiagnostico?.detallesDenominacion !== undefined ? typeof cajaDiagnostico.detallesDenominacion : 'undefined');
    
    // Consultar la caja con los campos específicos
    const caja = await prisma.caja.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        detallesDenominacion: true,
        detallesDenominacionFinal: true,
        serviciosFinal: true,
        saldoFinalPYG: true,
        saldoFinalBRL: true,
        saldoFinalUSD: true
      }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (caja.estado !== 'cerrada') {
      return res.status(400).json({ error: 'La caja no está cerrada' });
    }

    logSafely('Valores disponibles', {
      detallesDenominacion: typeof caja.detallesDenominacion,
      detallesDenominacionFinal: typeof caja.detallesDenominacionFinal,
    });

    // Función para parsear de forma segura
    const parseSafely = (value: any): any => {
      if (value === null || value === undefined) {
        return null;
      }
      
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          console.error("Error parseando JSON de string:", e);
          return null;
        }
      }
      
      return value; // Ya es un objeto o algún otro tipo
    };

    // Manejo seguro de detallesDenominacionFinal
    let datosDenominaciones = null;
    
    // Primero intentar con detallesDenominacionFinal
    if (caja.detallesDenominacionFinal !== null && caja.detallesDenominacionFinal !== undefined) {
      datosDenominaciones = parseSafely(caja.detallesDenominacionFinal);
      console.log("DIAGNÓSTICO - Usando detallesDenominacionFinal");
    } 
    // Si no hay detallesDenominacionFinal, intentamos con detallesDenominacion
    else if (caja.detallesDenominacion !== null && caja.detallesDenominacion !== undefined) {
      datosDenominaciones = parseSafely(caja.detallesDenominacion);
      console.log("DIAGNÓSTICO - Usando detallesDenominacion");
    }
    
    // Si ambos son null o undefined o si el parseo falló, creamos un objeto predeterminado
    if (!datosDenominaciones) {
      datosDenominaciones = {
        denominaciones: [],
        total: {
          PYG: caja.saldoFinalPYG || 0,
          BRL: caja.saldoFinalBRL || 0,
          USD: caja.saldoFinalUSD || 0
        }
      };
      console.log("DIAGNÓSTICO - Usando objeto predeterminado");
    }

    // Manejo seguro de serviciosFinal
    let saldosServiciosFinal = parseSafely(caja.serviciosFinal) || [];

    // Validar que datosDenominaciones tenga la estructura esperada
    if (!datosDenominaciones.total) {
      console.log("DIAGNÓSTICO - Estructura de datosDenominaciones incompleta, añadiendo total");
      datosDenominaciones.total = {
        PYG: caja.saldoFinalPYG || 0,
        BRL: caja.saldoFinalBRL || 0,
        USD: caja.saldoFinalUSD || 0
      };
    }

    if (!datosDenominaciones.denominaciones) {
      console.log("DIAGNÓSTICO - Estructura de datosDenominaciones incompleta, añadiendo denominaciones");
      datosDenominaciones.denominaciones = [];
    }

    // Construir la respuesta
    const datosCierre = {
      saldoFinal: datosDenominaciones,
      saldosServiciosFinal: saldosServiciosFinal
    };

    return res.json(datosCierre);
  } catch (error) {
    console.error(`Error al obtener datos de cierre de la caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener los datos de cierre de la caja' });
  }
};

// Actualizar datos de cierre de una caja
export const actualizarDatosCierre = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { saldoFinal, saldosServiciosFinal } = req.body;

  try {
    // Verificar datos requeridos
    if (!saldoFinal || !saldoFinal.total) {
      return res.status(400).json({ error: 'Datos de saldo incompletos' });
    }
    
    // Asegurar que saldosServiciosFinal sea un array
    const serviciosFinalArray = Array.isArray(saldosServiciosFinal) ? saldosServiciosFinal : [];

    // Verificar si la caja existe y está cerrada
    const caja = await prisma.caja.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true
      }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (caja.estado !== 'cerrada') {
      return res.status(400).json({ error: 'La caja no está cerrada' });
    }

    // Asegurarse de que los valores numéricos sean válidos
    const saldoFinalPYG = parseFloat(saldoFinal.total.PYG || 0);
    const saldoFinalBRL = parseFloat(saldoFinal.total.BRL || 0);
    const saldoFinalUSD = parseFloat(saldoFinal.total.USD || 0);

    // Convertir los objetos a JSON de forma segura
    let detallesDenominacionFinalJSON;
    let serviciosFinalJSON;

    try {
      detallesDenominacionFinalJSON = JSON.stringify(saldoFinal);
    } catch (error) {
      console.error('Error al convertir saldoFinal a JSON:', error);
      return res.status(400).json({ error: 'Error en el formato de los datos de saldo' });
    }

    try {
      serviciosFinalJSON = JSON.stringify(serviciosFinalArray);
    } catch (error) {
      console.error('Error al convertir saldosServiciosFinal a JSON:', error);
      return res.status(400).json({ error: 'Error en el formato de los datos de servicios' });
    }

    // Actualizar los datos de cierre
    // @ts-ignore - Ignoramos el error de tipo para detallesDenominacionFinal y serviciosFinal
    const cajaActualizada = await prisma.caja.update({
      where: { id },
      data: {
        saldoFinalPYG: saldoFinalPYG,
        saldoFinalBRL: saldoFinalBRL,
        saldoFinalUSD: saldoFinalUSD,
        // Usamos any para evitar errores de tipo
        detallesDenominacionFinal: detallesDenominacionFinalJSON as any,
        serviciosFinal: serviciosFinalJSON as any,
        updatedAt: new Date()
      }
    });

    return res.json({
      message: 'Datos de cierre actualizados correctamente',
      caja: {
        id: cajaActualizada.id
      }
    });
  } catch (error) {
    console.error(`Error al actualizar datos de cierre de la caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al actualizar los datos de cierre de la caja' });
  }
};

// --- Nueva función para actualizar un comprobante existente ---
export const actualizarComprobante = async (req: Request, res: Response) => {
  const { id, tipoComprobante } = req.params; // ID de caja y TIPO de comprobante

  // Verificar datos requeridos ANTES de la transacción
  if (!tipoComprobante) {
      return res.status(400).json({ error: 'Falta el tipo de comprobante en la URL' });
  }
  if (!req.file || !req.file.filename) {
    console.error('Error: req.file.filename no está disponible en actualizarComprobante.');
    return res.status(400).json({ error: 'No se ha proporcionado un nuevo archivo válido para actualizar' });
  }

  // Obtener la ruta relativa fuera de la transacción
  const nuevaUrlRelativa = `/uploads/${req.file.filename}`;
  console.log(`[${tipoComprobante}] Archivo actualizado preparado. Nueva ruta relativa: ${nuevaUrlRelativa}`);

  // Determinar operadora y servicio basados en el tipo
  let operadora = '';
  let servicio = '';
   // ... (Lógica de mapeo tipoComprobante -> operadora/servicio - Copiada de la versión anterior) ...
    if (tipoComprobante === 'minicargas') { operadora = 'tigo'; servicio = 'miniCarga'; }
    else if (tipoComprobante === 'girosEnviadosTigo') { operadora = 'tigo'; servicio = 'girosEnviados'; }
    else if (tipoComprobante === 'retirosTigoMoney') { operadora = 'tigo'; servicio = 'retiros'; }
    else if (tipoComprobante === 'cargasBilleteraTigo') { operadora = 'tigo'; servicio = 'cargaBilleteras'; }
    else if (tipoComprobante === 'maxicargas') { operadora = 'personal'; servicio = 'maxiCarga'; }
    else if (tipoComprobante === 'girosEnviadosPersonal') { operadora = 'personal'; servicio = 'girosEnviados'; }
    else if (tipoComprobante === 'retirosBilleteraPersonal') { operadora = 'personal'; servicio = 'retiros'; }
    else if (tipoComprobante === 'cargasBilleteraPersonal') { operadora = 'personal'; servicio = 'cargaBilleteras'; }
    else if (tipoComprobante === 'recargaClaro') { operadora = 'claro'; servicio = 'recargaClaro'; }
    else if (tipoComprobante === 'girosEnviadosClaro') { operadora = 'claro'; servicio = 'girosEnviados'; }
    else if (tipoComprobante === 'retirosBilleteraClaro') { operadora = 'claro'; servicio = 'retiros'; }
    else if (tipoComprobante === 'cargasBilleteraClaro') { operadora = 'claro'; servicio = 'cargaBilleteras'; }
    else if (tipoComprobante === 'aquiPago') { operadora = 'aquiPago'; servicio = 'pagos'; } // Asume tipo general es pagos
    else if (tipoComprobante === 'wepaGuaranies') { operadora = 'wepaGuaranies'; servicio = 'pagos'; } // Asume tipo general es pagos
    else if (tipoComprobante === 'wepaDolares') { operadora = 'wepaDolares'; servicio = 'pagos'; } // Asume tipo general es pagos
    else if (tipoComprobante === 'retirosAquiPago') { operadora = 'aquiPago'; servicio = 'retiros'; }
    else if (tipoComprobante === 'retirosWepaGuaranies') { operadora = 'wepaGuaranies'; servicio = 'retiros'; }
    else if (tipoComprobante === 'retirosWepaDolares') { operadora = 'wepaDolares'; servicio = 'retiros'; }

  try {
    // Ejecutar actualizaciones de DB dentro de una transacción interactiva
    const resultado = await prisma.$transaction(async (tx) => {
      console.log(`[${tipoComprobante}] Iniciando transacción para actualizar...`);

       // 1. Verificar existencia de la caja DENTRO de la transacción
       const cajaInicial = await tx.caja.findUnique({ where: { id }, select: { id: true, servicios: true }});
       if (!cajaInicial) {
           throw new Error('Caja no encontrada');
       }

      // 2. Actualizar MovimientoCaja DENTRO de la transacción
      if (operadora && servicio) {
        const resultUpdate = await tx.movimientoCaja.updateMany({
          where: { cajaId: id, operadora: operadora, servicio: servicio },
          data: { rutaComprobante: nuevaUrlRelativa }
        });
        console.log(`[${tipoComprobante}] MovimientoCaja actualizado (${resultUpdate.count} registros)`);
      } 
      // Lógica especial AquiPago/Wepa
      else if (tipoComprobante === 'aquiPago' || tipoComprobante === 'wepaGuaranies' || tipoComprobante === 'wepaDolares') {
        const op = tipoComprobante as 'aquiPago' | 'wepaGuaranies' | 'wepaDolares';
        await tx.movimientoCaja.updateMany({ where: { cajaId: id, operadora: op, servicio: 'pagos' }, data: { rutaComprobante: nuevaUrlRelativa }});
        await tx.movimientoCaja.updateMany({ where: { cajaId: id, operadora: op, servicio: 'retiros' }, data: { rutaComprobante: nuevaUrlRelativa }});
        console.log(`[${tipoComprobante}] Movimientos (pagos/retiros) actualizados.`);
      }

      // 3. Leer estado MÁS RECIENTE de servicios (ya lo hicimos con cajaInicial)
      let serviciosActuales = {};
      if (cajaInicial.servicios) {
        try {
          serviciosActuales = typeof cajaInicial.servicios === 'string'
            ? JSON.parse(cajaInicial.servicios)
            : (cajaInicial.servicios || {});
        } catch (e) {
          console.error(`[${tipoComprobante}] Error parseando servicios en transacción (actualizar):`, e);
          serviciosActuales = {};
        }
      }

      // 4. Fusionar/Sobrescribir el comprobante
      const serviciosParaGuardar = {
        ...serviciosActuales,
        [tipoComprobante]: nuevaUrlRelativa // Sobrescribe la clave actual con la nueva URL
      };
      console.log(`[${tipoComprobante}] Servicios JSON a guardar (actualizar):`, serviciosParaGuardar);

      // 5. Actualizar Caja.servicios DENTRO de la transacción
      await tx.caja.update({
        where: { id },
        data: {
          servicios: JSON.stringify(serviciosParaGuardar)
        }
        // No necesitamos devolver la caja completa aquí, solo confirmar éxito
      });
      console.log(`[${tipoComprobante}] Caja.servicios actualizado en transacción (actualizar).`);
      
      // Podríamos querer borrar el archivo antiguo aquí si la transacción tiene éxito
      // Pero requiere pasar la URL antigua o buscarla. Es más simple dejarlo por ahora.

      return { success: true }; // Indicar éxito de la transacción
    }); // Fin de la transacción

    console.log(`[${tipoComprobante}] Transacción de actualización completada.`);
    // Devolver una respuesta simple de éxito
    return res.json({ 
      mensaje: `Comprobante ${tipoComprobante} actualizado correctamente para la caja ${id}`, 
      tipo: tipoComprobante,
      url: nuevaUrlRelativa 
    });

  } catch (error) {
    console.error(`[${tipoComprobante}] Error procesando actualizarComprobante:`, error);
    // Borrar el NUEVO archivo si la transacción falló
    if (req.file && req.file.path) {
      try { 
        fs.unlinkSync(req.file.path); 
        console.log(`[${tipoComprobante}] Archivo NUEVO ${req.file.filename} borrado debido a error en transacción.`);
      } catch (e) { 
        console.error(`[${tipoComprobante}] Error al intentar borrar archivo NUEVO ${req.file.filename} tras fallo:`, e); 
      }
    }
    const errorMessage = error instanceof Error ? error.message : 'Error interno al actualizar el comprobante';
    return res.status(500).json({ error: errorMessage });
  }
};

// --- Fin de la función actualizada ---

// --- Nueva función para agregar MÚLTIPLES comprobantes en lote --- 
export const agregarComprobantesBatch = async (req: Request, res: Response) => {
  const { id } = req.params; // Caja ID
  const { tipos } = req.body; // JSON stringified array de tipos ['minicargas', 'maxicargas', ...]

  // Verificar que llegaron archivos
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No se recibieron archivos para procesar.' });
  }
  
  // Parsear el array de tipos
  let tiposArray: string[] = [];
  try {
    if (tipos && typeof tipos === 'string') {
        tiposArray = JSON.parse(tipos);
    } else {
        // Corregir quotes en el mensaje de error
        throw new Error("El campo 'tipos' es inválido o no es un array JSON stringified.");
    }
  } catch (e) {
      console.error('Error al parsear el array de tipos:', e);
      return res.status(400).json({ error: 'Error al procesar la lista de tipos de archivo.' });
  }

  // Verificar que la cantidad de tipos coincida con la cantidad de archivos
  if (tiposArray.length !== req.files.length) {
      console.error(`Discrepancia: ${req.files.length} archivos recibidos pero ${tiposArray.length} tipos.`);
      return res.status(400).json({ error: 'La cantidad de tipos no coincide con la cantidad de archivos.' });
  }

  // Guardar la longitud para usarla después de forma segura
  const numArchivos = req.files.length;
  console.log(`[Lote Caja ${id}] Recibidos ${numArchivos} archivos con tipos:`, tiposArray);

  // Array para guardar las URLs relativas generadas
  const urlsRelativas: { tipo: string, url: string }[] = [];

  try {
    // Ejecutar todo dentro de UNA transacción
    const resultado = await prisma.$transaction(async (tx) => {
      console.log(`[Lote Caja ${id}] Iniciando transacción batch...`);

      // 1. Leer el estado inicial de la caja (incluyendo servicios)
      const cajaInicial = await tx.caja.findUnique({ where: { id }, select: { id: true, servicios: true } });
      if (!cajaInicial) {
          throw new Error('Caja no encontrada');
      }

      // Parsear servicios actuales
      let serviciosActuales = {};
      if (cajaInicial.servicios) {
        try {
          serviciosActuales = typeof cajaInicial.servicios === 'string'
            ? JSON.parse(cajaInicial.servicios)
            : (cajaInicial.servicios || {});
        } catch (e) {
          console.error(`[Lote Caja ${id}] Error parseando servicios iniciales:`, e);
          serviciosActuales = {}; // Continuar con objeto vacío
        }
      }

      // 2. Iterar sobre los archivos recibidos (Asegurar que req.files es array)
      if (!Array.isArray(req.files)) {
          // Esto no debería ocurrir por la verificación inicial, pero es una doble seguridad
          throw new Error("req.files no es un array dentro de la transacción.");
      }

      for (let i = 0; i < numArchivos; i++) { // Usar la variable numArchivos
        const file = req.files[i] as Express.Multer.File; // Ahora es seguro indexar
        const tipo = tiposArray[i];

        // Validar filename y tipo
        if (!file.filename) {
            throw new Error(`Archivo en índice ${i} no tiene filename (error de Multer?).`);
        }
        if (!tipo || tipo === 'desconocido') {
            throw new Error(`Tipo inválido o desconocido para archivo en índice ${i}`);
        }

        const urlRelativa = `/uploads/${file.filename}`;
        urlsRelativas.push({ tipo, url: urlRelativa }); // Guardar para la respuesta final
        console.log(`[Lote Caja ${id}] Procesando archivo ${i + 1}/${req.files!.length}: Tipo=${tipo}, URL=${urlRelativa}`);

        // Mapear tipo a operadora/servicio (reutilizar lógica)
        let operadora = '';
        let servicio = '';
        // ... (Pegar aquí la lógica completa de mapeo tipo -> operadora/servicio) ...
        if (tipo === 'minicargas') { operadora = 'tigo'; servicio = 'miniCarga'; }
        else if (tipo === 'girosEnviadosTigo') { operadora = 'tigo'; servicio = 'girosEnviados'; }
        else if (tipo === 'retirosTigoMoney') { operadora = 'tigo'; servicio = 'retiros'; }
        else if (tipo === 'cargasBilleteraTigo') { operadora = 'tigo'; servicio = 'cargaBilleteras'; }
        else if (tipo === 'maxicargas') { operadora = 'personal'; servicio = 'maxiCarga'; }
        else if (tipo === 'girosEnviadosPersonal') { operadora = 'personal'; servicio = 'girosEnviados'; }
        else if (tipo === 'retirosBilleteraPersonal') { operadora = 'personal'; servicio = 'retiros'; }
        else if (tipo === 'cargasBilleteraPersonal') { operadora = 'personal'; servicio = 'cargaBilleteras'; }
        else if (tipo === 'recargaClaro') { operadora = 'claro'; servicio = 'recargaClaro'; }
        else if (tipo === 'girosEnviadosClaro') { operadora = 'claro'; servicio = 'girosEnviados'; }
        else if (tipo === 'retirosBilleteraClaro') { operadora = 'claro'; servicio = 'retiros'; }
        else if (tipo === 'cargasBilleteraClaro') { operadora = 'claro'; servicio = 'cargaBilleteras'; }
        else if (tipo === 'aquiPago') { operadora = 'aquiPago'; servicio = 'pagos'; }
        else if (tipo === 'wepaGuaranies') { operadora = 'wepaGuaranies'; servicio = 'pagos'; }
        else if (tipo === 'wepaDolares') { operadora = 'wepaDolares'; servicio = 'pagos'; }
        else if (tipo === 'retirosAquiPago') { operadora = 'aquiPago'; servicio = 'retiros'; }
        else if (tipo === 'retirosWepaGuaranies') { operadora = 'wepaGuaranies'; servicio = 'retiros'; }
        else if (tipo === 'retirosWepaDolares') { operadora = 'wepaDolares'; servicio = 'retiros'; }

        // 3. Actualizar/Crear MovimientoCaja
        if (operadora && servicio) {
            const movUpdate = await tx.movimientoCaja.updateMany({
                where: { cajaId: id, operadora: operadora, servicio: servicio },
                data: { rutaComprobante: urlRelativa }
            });
            if (movUpdate.count === 0) {
                await tx.movimientoCaja.create({ data: { cajaId: id, operadora, servicio, monto: 0, rutaComprobante: urlRelativa } });
            }
        } else if (tipo === 'aquiPago' || tipo === 'wepaGuaranies' || tipo === 'wepaDolares') {
            const op = tipo as 'aquiPago' | 'wepaGuaranies' | 'wepaDolares';
            await tx.movimientoCaja.updateMany({ where: { cajaId: id, operadora: op, servicio: 'pagos' }, data: { rutaComprobante: urlRelativa } });
            await tx.movimientoCaja.updateMany({ where: { cajaId: id, operadora: op, servicio: 'retiros' }, data: { rutaComprobante: urlRelativa } });
        }
        
        // 4. Añadir al objeto servicios en memoria (IMPORTANTE: Hacerlo *después* de actualizar DB)
        serviciosActuales = { ...serviciosActuales, [tipo]: urlRelativa };

      } // Fin del bucle for

      // 5. Actualizar Caja.servicios UNA SOLA VEZ al final
      console.log(`[Lote Caja ${id}] Actualizando Caja.servicios con:`, serviciosActuales);
      await tx.caja.update({
          where: { id },
          data: { servicios: JSON.stringify(serviciosActuales) }
      });
      console.log(`[Lote Caja ${id}] Caja.servicios actualizado.`);

      return { message: `Lote de ${numArchivos} comprobantes procesado exitosamente.` }; // Devolver resultado
    }); // Fin de la transacción

    console.log(`[Lote Caja ${id}] Transacción batch completada.`);
    return res.json({ ...resultado, urls: urlsRelativas }); // Devolver éxito y las URLs generadas

  } catch (error) {
    console.error(`[Lote Caja ${id}] Error procesando lote de comprobantes:`, error);
    // Borrar todos los archivos subidos en este lote si la transacción falló
    if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => {
            if (file.path) {
                try { fs.unlinkSync(file.path); console.log(`Archivo ${file.filename} borrado por error batch.`); } catch (e) { console.error(`Error borrando archivo ${file.filename}:`, e);}
            }
        });
    }
    const errorMessage = error instanceof Error ? error.message : 'Error interno al procesar el lote de comprobantes';
    return res.status(500).json({ error: errorMessage });
  }
}; // Fin agregarComprobantesBatch