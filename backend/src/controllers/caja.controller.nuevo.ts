import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
      saldoInicial: caja.detallesDenominacion ? JSON.parse(caja.detallesDenominacion.toString()) : null,
      saldosServiciosInicial: caja.servicios ? JSON.parse(caja.servicios.toString()) : [],
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
      saldoInicial: caja.detallesDenominacion ? JSON.parse(caja.detallesDenominacion.toString()) : null,
      saldosServiciosInicial: caja.servicios ? JSON.parse(caja.servicios.toString()) : [],
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
      saldoInicial: caja.detallesDenominacion ? JSON.parse(caja.detallesDenominacion.toString()) : null,
      saldosServiciosInicial: caja.servicios ? JSON.parse(caja.servicios.toString()) : [],
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
    if (!saldoFinal || !saldosServiciosFinal) {
      return res.status(400).json({ error: 'Faltan datos requeridos para cerrar la caja' });
    }

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

    // Actualizar la caja
    const cajaActualizada = await prisma.caja.update({
      where: { id },
      data: {
        estado: 'cerrada',
        fechaCierre: new Date(),
        saldoFinalPYG: saldoFinal.total.PYG || 0,
        saldoFinalBRL: saldoFinal.total.BRL || 0,
        saldoFinalUSD: saldoFinal.total.USD || 0,
        detallesDenominacionFinal: JSON.stringify(saldoFinal),
        serviciosFinal: JSON.stringify(saldosServiciosFinal)
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
      saldoInicial: cajaActualizada.detallesDenominacion ? JSON.parse(cajaActualizada.detallesDenominacion.toString()) : null,
      saldosServiciosInicial: cajaActualizada.servicios ? JSON.parse(cajaActualizada.servicios.toString()) : [],
      saldoFinal: saldoFinal,
      saldosServiciosFinal: saldosServiciosFinal,
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

    if (caja.estado !== 'abierta') {
      return res.status(400).json({ error: 'No se pueden agregar movimientos a una caja cerrada' });
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

    // Transformamos el objeto de movimientos a un array de operadora/servicio/monto
    const movimientosArray: MovimientoItem[] = [];
    
    // Procesamos el objeto datosMovimiento que viene del frontend (VerMovimientosDialog)
    // El formato es { tigo: { miniCarga: 1000, ... }, personal: { ... } }
    Object.entries(datosMovimiento).forEach(([operadora, servicios]) => {
      if (typeof servicios === 'object' && servicios !== null) {
        Object.entries(servicios).forEach(([servicio, monto]) => {
          // Solo agregamos movimientos con monto > 0
          if (Number(monto) > 0) {
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

// Agregar un comprobante a una caja
export const agregarComprobante = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tipo, url } = req.body;

  try {
    // Verificar si la caja existe
    const caja = await prisma.caja.findUnique({
      where: { id }
    });

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Verificar datos requeridos
    if (!tipo || !url) {
      return res.status(400).json({ error: 'Faltan datos requeridos para el comprobante' });
    }

    // Verificar que el tipo de comprobante sea válido
    const tiposValidos = [
      'minicargas', 'maxicargas', 'recargaClaro',
      'retirosTigoMoney', 'retirosBilleteraPersonal', 'retirosBilleteraClaro',
      'cargasBilleteraTigo', 'cargasBilleteraPersonal', 'cargasBilleteraClaro'
    ];

    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: `Tipo de comprobante no válido. Debe ser uno de: ${tiposValidos.join(', ')}` });
    }

    // Para los comprobantes, almacenaremos las URLs en un campo JSON en la caja
    // Primero, obtenemos los comprobantes existentes (si los hay)
    let comprobantes: any = {};
    if (caja.servicios) {
      try {
        comprobantes = JSON.parse(caja.servicios.toString());
      } catch (e) {
        // Si hay error al parsear, iniciamos con un objeto vacío
        comprobantes = {};
      }
    }

    // Actualizamos el comprobante según su tipo
    comprobantes[tipo] = url;

    // Actualizamos la caja con los nuevos comprobantes
    const cajaActualizada = await prisma.caja.update({
      where: { id },
      data: {
        servicios: JSON.stringify(comprobantes)
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
      saldoInicial: cajaActualizada.detallesDenominacion ? JSON.parse(cajaActualizada.detallesDenominacion.toString()) : null,
      saldosServiciosInicial: cajaActualizada.servicios ? JSON.parse(cajaActualizada.servicios.toString()) : [],
      comprobantes,
      createdAt: cajaActualizada.createdAt.toISOString(),
      updatedAt: cajaActualizada.updatedAt.toISOString()
    };

    return res.json(cajaFormateada);
  } catch (error) {
    console.error(`Error al agregar comprobante a caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al agregar el comprobante' });
  }
};

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

    // Buscar los retiros asociados a esta caja
    const retiros = await prisma.movimiento.findMany({
      where: {
        cajaId: id,
        tipoMovimiento: 'EGRESO'
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    // Formatear los retiros para el frontend
    const retirosFormateados = retiros.map(retiro => ({
      id: retiro.id,
      fecha: retiro.fecha.toISOString(),
      personaNombre: retiro.nombrePersona || '',
      montoPYG: retiro.moneda === 'PYG' ? Number(retiro.monto) : 0,
      montoBRL: retiro.moneda === 'BRL' ? Number(retiro.monto) : 0,
      montoUSD: retiro.moneda === 'USD' ? Number(retiro.monto) : 0,
      observacion: retiro.observaciones || ''
    }));

    return res.json(retirosFormateados);
  } catch (error) {
    console.error(`Error al obtener retiros de caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener los retiros' });
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

    // Buscar los pagos asociados a esta caja (movimientos con tipo PAGO)
    const pagos = await prisma.movimientoCaja.findMany({
      where: {
        cajaId: id,
        servicio: { contains: 'pago', mode: 'insensitive' }
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    // Formatear los pagos para el frontend
    const pagosFormateados = pagos.map(pago => ({
      id: pago.id,
      fecha: pago.fecha.toISOString(),
      operadora: pago.operadora,
      servicio: pago.servicio,
      monto: Number(pago.monto),
      moneda: 'PYG', // Asumimos que todos los pagos son en guaraníes
      observacion: ''
    }));

    return res.json(pagosFormateados);
  } catch (error) {
    console.error(`Error al obtener pagos de caja ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener los pagos' });
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