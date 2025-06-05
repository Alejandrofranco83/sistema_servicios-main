import { Request, Response } from 'express';
import { prisma } from '../config/db';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, DepositoBancario, Prisma } from '@prisma/client';

const UPLOADS_DIR = path.join(__dirname, '../../uploads/comprobantes');

// Crear directorio de uploads si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Obtener todos los depósitos bancarios
 */
export const getAllDepositosBancarios = async (req: Request, res: Response) => {
  try {
    const { desde, hasta, bancoId, cuentaId } = req.query;
    
    // Construir consulta SQL con filtros
    let whereClause = '';
    const params: any[] = [];
    
    if (desde && hasta) {
      const fechaDesde = new Date(desde as string);
      const fechaHasta = new Date(hasta as string);
      fechaHasta.setHours(23, 59, 59, 999);
      
      whereClause += ' AND db.fecha BETWEEN $1 AND $2';
      params.push(fechaDesde, fechaHasta);
    }
    
    if (bancoId) {
      whereClause += ` AND db."bancoId" = $${params.length + 1}`;
      params.push(parseInt(bancoId as string, 10));
    }
    
    if (cuentaId) {
      whereClause += ` AND db."cuentaBancariaId" = $${params.length + 1}`;
      params.push(parseInt(cuentaId as string, 10));
    }

    // Consulta SQL para obtener depósitos con sus relaciones
    const query = `
      SELECT 
        db.*, 
        b.nombre as "bancoNombre",
        cb.moneda as "cuentaMoneda",
        cb.numeroCuenta as "numeroCuenta",
        u.nombre as "usuarioNombre",
        u.username as "usuarioUsername"
      FROM "DepositoBancario" db
      LEFT JOIN "Banco" b ON db."bancoId" = b.id
      LEFT JOIN "CuentaBancaria" cb ON db."cuentaBancariaId" = cb.id
      LEFT JOIN "Usuario" u ON db."usuarioId" = u.id
      WHERE 1=1 ${whereClause}
      ORDER BY db.fecha DESC
    `;

    const depositos = await prisma.$queryRawUnsafe(query, ...params);

    return res.status(200).json(depositos);
  } catch (error) {
    console.error('Error al obtener depósitos bancarios:', error);
    return res.status(500).json({ error: 'Error al obtener depósitos bancarios' });
  }
};

/**
 * Obtener un depósito bancario por ID
 */
export const getDepositoBancarioById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        db.*, 
        b.nombre as "bancoNombre",
        cb.moneda as "cuentaMoneda",
        cb.numeroCuenta as "numeroCuenta",
        u.nombre as "usuarioNombre",
        u.username as "usuarioUsername"
      FROM "DepositoBancario" db
      LEFT JOIN "Banco" b ON db."bancoId" = b.id
      LEFT JOIN "CuentaBancaria" cb ON db."cuentaBancariaId" = cb.id
      LEFT JOIN "Usuario" u ON db."usuarioId" = u.id
      WHERE db.id = $1
    `;

    const deposito = await prisma.$queryRaw`${query} ${id}`;

    if (!deposito || (Array.isArray(deposito) && deposito.length === 0)) {
      return res.status(404).json({ error: 'Depósito bancario no encontrado' });
    }

    return res.status(200).json(Array.isArray(deposito) ? deposito[0] : deposito);
  } catch (error) {
    console.error('Error al obtener depósito bancario:', error);
    return res.status(500).json({ error: 'Error al obtener depósito bancario' });
  }
};

/**
 * Crear un nuevo depósito bancario
 */
export const createDepositoBancario = async (req: Request, res: Response) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const { 
      numeroBoleta, 
      monto, 
      bancoId, 
      cuentaBancariaId, 
      observacion 
    } = req.body;
    
    console.log('Datos recibidos:', req.body);
    console.log('Archivo recibido:', req.file);
    console.log('bancoId recibido:', bancoId, 'tipo:', typeof bancoId);
    console.log('cuentaBancariaId recibido:', cuentaBancariaId, 'tipo:', typeof cuentaBancariaId);
    
    // Verificar datos obligatorios
    if (!numeroBoleta || !monto || !bancoId || !cuentaBancariaId) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos', 
        details: 'El número de boleta, monto, banco y cuenta son obligatorios'
      });
    }

    // Asegurarse de que bancoId sea un número
    let bancoIdNumber: number;
    try {
      bancoIdNumber = parseInt(bancoId, 10);
      if (isNaN(bancoIdNumber)) {
        return res.status(400).json({ 
          error: 'ID de banco inválido', 
          details: `El ID del banco debe ser un número. Valor recibido: ${bancoId}`
        });
      }
    } catch (error) {
      console.error('Error al convertir bancoId a número:', error);
      return res.status(400).json({ 
        error: 'ID de banco inválido', 
        details: `Error al procesar el ID del banco: ${bancoId}`
      });
    }

    /* Comentamos la validación del banco ya que no tenemos esos datos
    // Verificar si el banco existe
    const banco = await prisma.$queryRaw`SELECT * FROM "Banco" WHERE id = ${bancoIdNumber}`;
    console.log('Resultado de búsqueda de banco:', banco);

    if (!banco || (Array.isArray(banco) && banco.length === 0)) {
      return res.status(404).json({ error: 'Banco no encontrado' });
    }
    */

    // Asegurarse de que cuentaBancariaId sea un número
    let cuentaIdNumber: number;
    try {
      cuentaIdNumber = parseInt(cuentaBancariaId, 10);
      if (isNaN(cuentaIdNumber)) {
        return res.status(400).json({ 
          error: 'ID de cuenta bancaria inválido', 
          details: `El ID de la cuenta bancaria debe ser un número. Valor recibido: ${cuentaBancariaId}`
        });
      }
    } catch (error) {
      console.error('Error al convertir cuentaBancariaId a número:', error);
      return res.status(400).json({ 
        error: 'ID de cuenta bancaria inválido', 
        details: `Error al procesar el ID de la cuenta bancaria: ${cuentaBancariaId}`
      });
    }

    // Verificar si la cuenta bancaria existe y obtener información del banco
    const cuenta = await prisma.$queryRaw`
      SELECT cb.*, b.nombre as nombre_banco 
      FROM "CuentaBancaria" cb
      LEFT JOIN "Banco" b ON cb."bancoId" = b.id
      WHERE cb.id = ${cuentaIdNumber}
    `;
    console.log('Resultado de búsqueda de cuenta bancaria:', cuenta);

    if (!cuenta || (Array.isArray(cuenta) && cuenta.length === 0)) {
      return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
    }

    // Verificar si ya existe un depósito con ese número de boleta
    const depositoExistente = await prisma.$queryRaw`SELECT * FROM "DepositoBancario" WHERE "numeroBoleta" = ${numeroBoleta}`;

    if (depositoExistente && Array.isArray(depositoExistente) && depositoExistente.length > 0) {
      return res.status(400).json({ 
        error: 'Número de boleta duplicado', 
        details: 'Ya existe un depósito con ese número de boleta'
      });
    }

    // Procesar el archivo si existe
    let rutaComprobante = null;
    if (req.file) {
      const extension = path.extname(req.file.originalname).toLowerCase();
      const nombreArchivo = `deposito_${Date.now()}${extension}`;
      rutaComprobante = path.join('comprobantes', nombreArchivo);
      
      // Crear directorio si no existe
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      
      // Guardar el archivo
      fs.writeFileSync(
        path.join(UPLOADS_DIR, nombreArchivo),
        req.file.buffer
      );
    }

    // Obtener el ID del usuario desde el token (asumiendo que está en req.user)
    let usuarioId = req.usuarioId || req.usuario?.id || (req as any).user?.id || null;

    // SOLUCIÓN TEMPORAL: Si no hay usuario autenticado, usar el ID 1 (administrador)
    // Esta es una solución provisional mientras se resuelve el problema de autenticación
    if (!usuarioId) {
      console.warn('⚠️ ADVERTENCIA: Usuario no autenticado. Usando ID de usuario predeterminado (1) para pruebas.');
      usuarioId = 1;
    }

    /* Comentamos esta validación temporalmente
    // Verificar que usuarioId no sea null
    if (!usuarioId) {
      console.error('Error: No se pudo obtener el ID del usuario autenticado');
      return res.status(400).json({ 
        error: 'Usuario no autenticado', 
        details: 'No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.'
      });
    }
    */

    // Insertar el depósito bancario usando la sintaxis correcta de plantilla etiquetada
    const nuevoDeposito = await prisma.$queryRaw`
      INSERT INTO "DepositoBancario" (
        id, 
        "numeroBoleta", 
        monto, 
        fecha, 
        observacion, 
        "rutaComprobante", 
        "cuentaBancariaId", 
        "usuarioId", 
        "createdAt", 
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(), 
        ${numeroBoleta}, 
        ${parseFloat(monto)}, 
        NOW(), 
        ${observacion || null}, 
        ${rutaComprobante}, 
        ${cuentaIdNumber},
        ${usuarioId}, 
        NOW(), 
        NOW()
      )
      RETURNING *
    `;

    const depositoObj = Array.isArray(nuevoDeposito) ? nuevoDeposito[0] : nuevoDeposito;

    // Registrar el movimiento en la tabla caja_mayor_movimientos
    try {
      // Mapear moneda según el formato esperado por la tabla caja_mayor_movimientos
      const monedaMovimiento = (cuenta as any)[0].moneda === 'PYG' ? 'guaranies' 
                             : (cuenta as any)[0].moneda === 'USD' ? 'dolares' 
                             : 'reales';
      
      // Buscar el último movimiento para obtener el saldo anterior
      const ultimoMovimiento = await prisma.$queryRaw`
        SELECT * FROM "caja_mayor_movimientos"
        WHERE moneda = ${monedaMovimiento}
        ORDER BY id DESC
        LIMIT 1
      `;
      
      const saldoAnterior = ultimoMovimiento && Array.isArray(ultimoMovimiento) && ultimoMovimiento.length > 0
                          ? parseFloat(ultimoMovimiento[0].saldoActual.toString())
                          : 0;
      
      const montoDeposito = parseFloat(monto);
      const saldoActual = saldoAnterior - montoDeposito; // Un depósito bancario es un egreso de caja
      
      // Concepto del movimiento - INCLUIR EL NOMBRE DEL BANCO
      const numeroCuenta = (cuenta as any)[0].numeroCuenta || '';
      const nombreBanco = (cuenta as any)[0].nombre_banco || (cuenta as any)[0].banco || 'Banco';
      const conceptoMovimiento = `Depósito bancario - ${nombreBanco} - ${numeroBoleta} - ${numeroCuenta}`;
      
      const depositoId = depositoObj.id;
      
      // Registrar el movimiento de caja usando una consulta SQL nativa pero con valores seguros
      console.log('Valores para inserción en caja_mayor_movimientos:', {
        depositoId,
        monedaMovimiento,
        montoDeposito,
        saldoAnterior,
        saldoActual,
        conceptoMovimiento,
        usuarioId
      });
      
      await prisma.$executeRaw`
        INSERT INTO "caja_mayor_movimientos" (
          "fechaHora",
          tipo,
          "operacionId",
          moneda,
          monto,
          "esIngreso",
          "saldoAnterior",
          "saldoActual",
          concepto,
          "usuarioId",
          "depositoId",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          NOW(),
          'Depósito Bancario',
          ${depositoId},
          ${monedaMovimiento},
          ${montoDeposito},
          false,
          ${saldoAnterior},
          ${saldoActual},
          ${conceptoMovimiento},
          ${usuarioId},
          ${depositoId},
          NOW(),
          NOW()
        )
      `;
      console.log('✅ Movimiento de caja registrado correctamente para el depósito bancario');
    } catch (errorMovimiento) {
      console.error('❌ Error al registrar movimiento en caja_mayor_movimientos:', errorMovimiento);
      // No revertimos la creación del depósito, solo registramos el error
    }

    return res.status(201).json(depositoObj);
  } catch (error) {
    console.error('Error al crear depósito bancario:', error);
    return res.status(500).json({ error: 'Error al crear depósito bancario' });
  }
};

/**
 * Actualizar un depósito bancario existente (Número de Boleta y/o Comprobante)
 */
export const updateDepositoBancario = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { numeroBoleta, movimientoId } = req.body;
  const file = req.file;

  console.log(`Actualizando depósito ID: ${id}`);
  console.log('Datos recibidos:', req.body);
  console.log('Archivo recibido:', file ? file.originalname : 'Ninguno');

  if (!numeroBoleta || numeroBoleta.trim() === '') {
    return res.status(400).json({ error: 'El número de boleta es requerido' });
  }

  try {
    // Usar transacción para asegurar consistencia entre tablas
    const depositoActualizado = await prisma.$transaction(async (tx: any) => {
      const depositoActual = await tx.depositoBancario.findUnique({
        where: { id },
        include: { cuentaBancaria: true }
      });

      if (!depositoActual) {
        throw new Error('Depósito bancario no encontrado');
      }

      if (depositoActual.observacion?.includes('CANCELADO')) {
        throw new Error('No se puede editar un depósito cancelado.');
      }

      if (numeroBoleta.trim() !== depositoActual.numeroBoleta) {
        const depositoExistente = await tx.depositoBancario.findFirst({
          where: {
            numeroBoleta: numeroBoleta.trim(),
            id: { not: id }
          }
        });

        if (depositoExistente) {
          throw new Error('Ya existe otro depósito con ese número de boleta');
        }
      }

      let rutaComprobante = depositoActual.rutaComprobante;
      if (file) {
        if (rutaComprobante) {
          const rutaAnteriorAbsoluta = path.join(UPLOADS_DIR, path.basename(rutaComprobante));
          if (fs.existsSync(rutaAnteriorAbsoluta)) {
            try {
              fs.unlinkSync(rutaAnteriorAbsoluta);
              console.log(`Archivo anterior eliminado: ${rutaAnteriorAbsoluta}`);
            } catch (unlinkError) {
              console.error('Error al eliminar archivo anterior:', unlinkError);
            }
          }
        }

        const extension = path.extname(file.originalname).toLowerCase();
        const nombreArchivo = `deposito_${id}_${Date.now()}${extension}`;
        const nuevaRutaAbsoluta = path.join(UPLOADS_DIR, nombreArchivo);
        rutaComprobante = path.join('comprobantes', nombreArchivo);

        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }

        fs.writeFileSync(nuevaRutaAbsoluta, file.buffer);
        console.log(`Nuevo comprobante guardado: ${nuevaRutaAbsoluta}`);
        console.log(`Ruta guardada en DB: ${rutaComprobante}`);
      }

      const updateData: Prisma.DepositoBancarioUpdateInput = {
        numeroBoleta: numeroBoleta.trim(),
        rutaComprobante: rutaComprobante,
        updatedAt: new Date()
      };

      const updatedDeposito: DepositoBancario = await tx.depositoBancario.update({
        where: { id },
        data: updateData
      });

      if (movimientoId) {
         const movId = parseInt(movimientoId as string, 10);
         if (!isNaN(movId)) {
            try {
                const movimientoOriginal = await tx.cajaMayorMovimiento.findFirst({
                    where: {
                        id: movId,
                        depositoId: id
                    }
                });

                if (movimientoOriginal) {
                    // Obtener información del banco para el concepto actualizado
                    const cuentaConBanco = await tx.$queryRaw`
                      SELECT cb.*, b.nombre as nombre_banco 
                      FROM "CuentaBancaria" cb
                      LEFT JOIN "Banco" b ON cb."bancoId" = b.id
                      WHERE cb.id = ${depositoActual.cuentaBancariaId}
                    `;
                    
                    const numeroCuenta = depositoActual.cuentaBancaria?.numeroCuenta || '';
                    const nombreBanco = (cuentaConBanco as any)[0]?.nombre_banco || (cuentaConBanco as any)[0]?.banco || 'Banco';
                    const nuevoConcepto = `Depósito bancario - ${nombreBanco} - ${numeroBoleta.trim()} - ${numeroCuenta}`;

                    await tx.cajaMayorMovimiento.update({
                        where: { id: movimientoOriginal.id },
                        data: {
                            concepto: nuevoConcepto,
                            updatedAt: new Date()
                        }
                    });
                    console.log(`Movimiento de caja ${movimientoOriginal.id} actualizado con nuevo concepto.`);
                } else {
                    console.warn(`No se encontró movimiento de caja original con ID ${movId} y depositoId ${id} para actualizar.`);
                }
            } catch (errorMovimiento) {
                 console.error('Error al actualizar caja_mayor_movimientos:', errorMovimiento);
                 throw new Error('Error al actualizar el movimiento de caja asociado.');
            }
         } else {
             console.warn(`ID de movimiento (${movimientoId}) inválido, no se actualizará caja_mayor_movimientos.`);
         }
      }

      return updatedDeposito;
    });

    return res.status(200).json(depositoActualizado);

  } catch (error: any) {
    console.error('Error al actualizar depósito bancario:', error);

    if (file && error.message !== 'Depósito bancario no encontrado' && error.message !== 'No se puede editar un depósito cancelado.' && error.message !== 'Ya existe otro depósito con ese número de boleta') {
        const extension = path.extname(file.originalname).toLowerCase();
        const nombreArchivo = `deposito_${id}_${Date.now()}${extension}`;
         const rutaArchivoFallido = path.join(UPLOADS_DIR, path.basename(path.join('comprobantes', nombreArchivo)));
        if (fs.existsSync(rutaArchivoFallido)) {
            try {
                 fs.unlinkSync(rutaArchivoFallido);
                 console.log(`Archivo subido ${nombreArchivo} eliminado debido a error en transacción.`);
             } catch (unlinkErr) {
                 console.error(`Error al intentar eliminar archivo ${nombreArchivo} tras error:`, unlinkErr);
             }
        }
    }

    if (error.message === 'Depósito bancario no encontrado' || error.message === 'No se puede editar un depósito cancelado.') {
        return res.status(404).json({ error: error.message });
    }
     if (error.message === 'Ya existe otro depósito con ese número de boleta') {
        return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error interno al actualizar el depósito bancario', detalles: error.message });
  }
};

/**
 * Eliminar un depósito bancario
 */
export const deleteDepositoBancario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si el depósito existe
    const deposito = await prisma.$queryRaw`SELECT * FROM "DepositoBancario" WHERE id = ${id}`;

    if (!deposito || (Array.isArray(deposito) && deposito.length === 0)) {
      return res.status(404).json({ error: 'Depósito bancario no encontrado' });
    }

    const depositoActual = Array.isArray(deposito) ? deposito[0] : deposito;

    // Si hay un comprobante, eliminar el archivo
    if ((depositoActual as any).rutaComprobante) {
      const rutaArchivo = path.join(UPLOADS_DIR, path.basename((depositoActual as any).rutaComprobante));
      if (fs.existsSync(rutaArchivo)) {
        fs.unlinkSync(rutaArchivo);
      }
    }

    // Eliminar el depósito
    await prisma.$queryRaw`DELETE FROM "DepositoBancario" WHERE id = ${id}`;

    return res.status(200).json({ message: 'Depósito bancario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar depósito bancario:', error);
    return res.status(500).json({ error: 'Error al eliminar depósito bancario' });
  }
};

/**
 * Cancelar un depósito bancario (marcar como cancelado en la observación)
 */
export const cancelarDepositoBancario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { movimientoId, razon } = req.body;

    // Verificar si el depósito existe
    const deposito = await prisma.$queryRaw`SELECT * FROM "DepositoBancario" WHERE id = ${id}`;

    if (!deposito || (Array.isArray(deposito) && deposito.length === 0)) {
      return res.status(404).json({ error: 'Depósito bancario no encontrado' });
    }

    const depositoActual = Array.isArray(deposito) ? deposito[0] : deposito;

    // Verificar si ya está cancelado comprobando si la observación contiene "CANCELADO"
    const observacionActual = (depositoActual as any).observacion || '';
    if (observacionActual.includes('CANCELADO')) {
      return res.status(400).json({ error: 'Este depósito ya ha sido cancelado previamente' });
    }

    // Actualizar la observación para marcar como cancelado
    const nuevaObservacion = `${observacionActual}${observacionActual ? ' | ' : ''}CANCELADO: ${razon}`;

    // Obtener el ID del usuario desde el token
    let usuarioId = req.usuarioId || req.usuario?.id || (req as any).user?.id || 1;

    // Transacción para cancelar el depósito y crear el movimiento inverso
    await prisma.$transaction(async (tx: any) => {
      // 1. Actualizar la observación del depósito para marcarlo como cancelado
      await tx.$executeRaw`
        UPDATE "DepositoBancario" 
        SET 
          observacion = ${nuevaObservacion},
          "updatedAt" = NOW()
        WHERE id = ${id}
      `;

      // 2. Si existe el ID de movimiento, crear un movimiento inverso en caja_mayor_movimientos
      if (movimientoId) {
        // Obtener el movimiento original para conocer la moneda y el monto
        const movimientoOriginal = await tx.$queryRaw`
          SELECT * FROM "caja_mayor_movimientos" WHERE id = ${movimientoId}
        `;

        if (movimientoOriginal && Array.isArray(movimientoOriginal) && movimientoOriginal.length > 0) {
          const mov = movimientoOriginal[0] as any;
          
          // Obtener información completa del depósito para el concepto detallado
          const depositoCompleto = await tx.depositoBancario.findUnique({
            where: {
              id: id
            },
            include: {
              banco: {
                select: {
                  id: true,
                  nombre: true
                }
              },
              cuentaBancaria: {
                select: {
                  id: true,
                  numeroCuenta: true,
                  tipo: true,
                  banco: true
                }
              }
            }
          });
          
          let conceptoDetallado = `Cancelación depósito`;
          
          if (depositoCompleto) {
            // Obtener el nombre del banco usando la misma lógica que getDepositoBancarioPorMovimiento
            const nombreBanco = depositoCompleto.cuentaBancaria?.banco || depositoCompleto.banco?.nombre || 'N/A';
            
            // Formatear fecha del depósito
            const fechaDeposito = depositoCompleto.fecha ? new Date(depositoCompleto.fecha).toLocaleDateString('es-PY') : 'N/A';
            
            // Construir concepto detallado
            conceptoDetallado = `Cancelación depósito: ${nombreBanco} - Cta: ${depositoCompleto.cuentaBancaria?.numeroCuenta || 'N/A'} - Boleta: ${depositoCompleto.numeroBoleta || 'N/A'} - Fecha: ${fechaDeposito} - Motivo: ${razon}`;
          } else {
            // Fallback si no se puede obtener la información completa
            conceptoDetallado = `Cancelación del depósito ID: ${id}. Motivo: ${razon}`;
          }
          
          // CORREGIR: Buscar el último movimiento de la misma moneda para obtener el saldo actual correcto
          const ultimoMovimiento = await tx.$queryRaw`
            SELECT * FROM "caja_mayor_movimientos" 
            WHERE moneda = ${mov.moneda || 'guaranies'}
            ORDER BY id DESC 
            LIMIT 1
          `;
          
          // Calcular el saldo anterior y actual correctamente
          const saldoAnterior = ultimoMovimiento && Array.isArray(ultimoMovimiento) && ultimoMovimiento.length > 0 
            ? parseFloat(ultimoMovimiento[0].saldoActual.toString()) 
            : 0;
          
          const montoDeposito = Math.abs(parseFloat(mov.monto));
          const saldoActual = saldoAnterior + montoDeposito; // Ingreso a caja mayor (sumar el depósito cancelado)
          
          console.log(`Cancelación depósito - Saldo anterior: ${saldoAnterior}, Monto a sumar: ${montoDeposito}, Saldo resultante: ${saldoActual}`);
          
          // Crear movimiento inverso (como ingreso positivo)
          await tx.$executeRaw`
            INSERT INTO "caja_mayor_movimientos" (
              "fechaHora",
              "tipo",
              "monto",
              "moneda",
              "concepto",
              "operacionId",
              "esIngreso",
              "saldoAnterior",
              "saldoActual",
              "usuarioId",
              "depositoId",
              "createdAt",
              "updatedAt"
            ) VALUES (
              NOW(),
              'Cancelación depósito',
              ${montoDeposito},
              ${mov.moneda || 'guaranies'},
              ${conceptoDetallado},
              ${mov.id},
              true,
              ${saldoAnterior},
              ${saldoActual},
              ${usuarioId},
              ${id},
              NOW(),
              NOW()
            )
          `;
        }
      }
    });

    return res.status(200).json({ 
      mensaje: 'Depósito bancario cancelado correctamente',
      depositoId: id 
    });
  } catch (error) {
    console.error('Error al cancelar depósito bancario:', error);
    return res.status(500).json({ 
      error: 'Error al cancelar depósito bancario',
      detalles: (error as any).message 
    });
  }
};

/**
 * Obtener un depósito bancario por ID de movimiento
 */
export const getDepositoBancarioPorMovimiento = async (req: Request, res: Response) => {
  try {
    const { movimientoId } = req.params;

    if (!movimientoId || isNaN(parseInt(movimientoId))) {
      return res.status(400).json({ error: 'ID de movimiento no válido' });
    }

    // Primero obtenemos el depositoId desde caja_mayor_movimientos
    const movimiento = await prisma.cajaMayorMovimiento.findUnique({
      where: {
        id: parseInt(movimientoId)
      },
      select: {
        depositoId: true,
        tipo: true
      }
    });

    // Verificar si el movimiento existe
    if (!movimiento) {
      return res.status(404).json({ error: 'No se encontró el movimiento especificado' });
    }

    // Verificar si es un movimiento de tipo depósito
    if (!movimiento.depositoId) {
      // Si el tipo contiene "depósito" pero no tiene depositoId
      if (movimiento.tipo && movimiento.tipo.toLowerCase().includes('depósito')) {
        return res.status(404).json({ 
          error: 'Este movimiento corresponde a un depósito, pero no tiene enlace con la tabla de depósitos' 
        });
      }
      
      // Si es otro tipo de movimiento
      return res.status(404).json({ 
        error: 'Este movimiento no está asociado a un depósito bancario' 
      });
    }

    // Ahora consultamos el depósito con el id obtenido
    const deposito = await prisma.depositoBancario.findUnique({
      where: {
        id: movimiento.depositoId
      },
      include: {
        banco: {
          select: {
            id: true,
            nombre: true
          }
        },
        cuentaBancaria: {
          select: {
            id: true,
            moneda: true,
            numeroCuenta: true,
            tipo: true,
            banco: true
          }
        },
        usuario: {
          select: {
            nombre: true,
            username: true
          }
        }
      }
    });

    if (!deposito) {
      return res.status(404).json({ error: 'Depósito bancario no encontrado para este movimiento' });
    }

    // Formatear la respuesta
    const depositoFormateado = {
      ...deposito,
      bancoNombre: deposito.cuentaBancaria?.banco || deposito.banco?.nombre,
      cuentaMoneda: deposito.cuentaBancaria?.moneda,
      numeroCuenta: deposito.cuentaBancaria?.numeroCuenta,
      tipoCuenta: deposito.cuentaBancaria?.tipo,
      usuarioNombre: deposito.usuario?.nombre,
      usuarioUsername: deposito.usuario?.username
    };

    return res.status(200).json(depositoFormateado);
  } catch (error) {
    console.error('Error al obtener depósito bancario por movimiento:', error);
    return res.status(500).json({ error: 'Error al obtener depósito bancario por movimiento' });
  }
}; 