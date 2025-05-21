import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const prisma = new PrismaClient();

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/comprobantes');
    
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Crear un nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `comprobante-pago-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limitar a 5MB
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen') as any);
    }
  }
});

// Crear un nuevo pago de servicio
export const crearPagoServicio = async (req: Request, res: Response) => {
  try {
    console.log('Recibida solicitud en /api/pagos-servicios:', req.body);
    
    const { cajaId, operadora, servicio, monto, moneda, observacion, estado } = req.body;
    
    // Validar los datos obligatorios
    if (!cajaId || !operadora || !servicio || !monto || !moneda) {
      return res.status(400).json({ 
        error: 'Datos incompletos. Se requiere cajaId, operadora, servicio, monto y moneda.' 
      });
    }

    // Convertir el monto a entero
    const montoEntero = parseInt(monto, 10);
    
    // Verificar que el monto sea un número válido
    if (isNaN(montoEntero) || montoEntero <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número entero positivo.' });
    }

    // Variable para la ruta del comprobante
    let rutaComprobante: string | null = null;
    
    // Si hay comprobante, guardar la ruta
    if (req.file) {
      console.log('Archivo recibido:', req.file);
      rutaComprobante = `uploads/comprobantes/${req.file.filename}`;
    }
    
    // Usar el estado proporcionado o el predeterminado "PENDIENTE"
    const estadoPago = estado || 'PENDIENTE';
    
    // Usar SQL nativo para evitar problemas con el modelo
    const query = `
      INSERT INTO "pagos_servicios" 
      ("cajaId", "operadora", "servicio", "monto", "moneda", "observacion", "rutaComprobante", "estado", "fechaCreacion", "fechaActualizacion") 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *;
    `;
    
    const values = [
      cajaId,
      operadora,
      servicio,
      montoEntero,
      moneda,
      observacion || null,
      rutaComprobante,
      estadoPago
    ];

    console.log('Ejecutando SQL con valores:', values);
    
    // Ejecutar la consulta directamente en la base de datos
    const result = await prisma.$queryRawUnsafe(query, ...values);
    
    console.log('Pago registrado exitosamente:', result);

    const nuevoPago = Array.isArray(result) ? result[0] : result;
    
    // Registrar movimiento en caja_mayor_movimientos
    try {
      // Obtener usuarioId (asumiendo que el middleware isAuthenticated lo añade)
      let usuarioId = req.usuarioId || req.usuario?.id || null;
      if (!usuarioId) {
        console.warn('⚠️ ADVERTENCIA: Usuario no autenticado. Usando ID de usuario predeterminado (1) para el movimiento de caja.');
        usuarioId = 1; // Usar un ID por defecto si no hay usuario
      }

      // Mapear moneda al formato de caja_mayor_movimientos
      const monedaMovimiento = moneda === 'PYG' ? 'guaranies' 
                             : moneda === 'USD' ? 'dolares' 
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
      
      const montoPago = parseFloat(monto);
      const saldoActual = saldoAnterior - montoPago; // Egreso de caja

      // --- NUEVO: Obtener cajaEnteroId ---
      const cajaInfo = await prisma.caja.findUnique({
        where: { id: cajaId },
        select: { cajaEnteroId: true }
      });
      
      const cajaIdentificador = cajaInfo?.cajaEnteroId ? `Caja #${cajaInfo.cajaEnteroId}` : `Caja ${cajaId}`; // Fallback al UUID si no se encuentra

      // Concepto del movimiento
      const conceptoMovimiento = `Pago Servicio - ${operadora} ${servicio} - ${cajaIdentificador}`;
      const pagoId = nuevoPago.id;

      // Insertar en caja_mayor_movimientos
      await prisma.$executeRaw`
        INSERT INTO "caja_mayor_movimientos" (
          "fechaHora", tipo, "operacionId", moneda, monto, "esIngreso", 
          "saldoAnterior", "saldoActual", concepto, "usuarioId", 
          "pagoServicioId", "createdAt", "updatedAt"
        )
        VALUES (
          NOW(), 'Pago Servicio', ${pagoId}, ${monedaMovimiento}, ${montoPago}, false,
          ${saldoAnterior}, ${saldoActual}, ${conceptoMovimiento}, ${usuarioId},
          ${pagoId}, NOW(), NOW()
        )
      `;
      console.log('✅ Movimiento de caja registrado para el pago de servicio');

    } catch (errorMovimiento) {
      console.error('❌ Error al registrar movimiento en caja_mayor_movimientos:', errorMovimiento);
      // No revertimos la creación del pago, solo registramos el error
    }

    res.status(201).json({
      message: 'Pago de servicio registrado correctamente',
      pago: nuevoPago
    });
  } catch (error: any) {
    console.error('Error al crear pago de servicio:', error);
    res.status(500).json({ 
      error: 'Error al registrar el pago de servicio', 
      details: error.message 
    });
  }
};

// Obtener todos los pagos de servicios
export const obtenerPagosServicios = async (req: Request, res: Response) => {
  try {
    const { cajaId, fechaInicio, fechaFin, estado } = req.query;
    
    // Consulta SQL base
    let query = `SELECT * FROM "pagos_servicios" WHERE 1=1`;
    const params: any[] = [];
    
    // Agregar filtros si existen
    if (cajaId) {
      query += ` AND "cajaId" = $${params.length + 1}`;
      params.push(cajaId);
    }
    
    if (fechaInicio) {
      query += ` AND "fechaCreacion" >= $${params.length + 1}`;
      params.push(new Date(fechaInicio as string));
    }
    
    if (fechaFin) {
      const fechaFinAjustada = new Date(fechaFin as string);
      fechaFinAjustada.setHours(23, 59, 59, 999);
      query += ` AND "fechaCreacion" <= $${params.length + 1}`;
      params.push(fechaFinAjustada);
    }
    
    if (estado) {
      query += ` AND "estado" = $${params.length + 1}`;
      params.push(estado);
    }
    
    query += ` ORDER BY "fechaCreacion" DESC`;
    
    // Ejecutar la consulta
    const result = await prisma.$queryRawUnsafe(query, ...params);
    
    res.json(result);
  } catch (error: any) {
    console.error('Error al obtener pagos de servicios:', error);
    res.status(500).json({ 
      error: 'Error al obtener los pagos de servicios', 
      details: error.message 
    });
  }
};

// Obtener un pago de servicio por ID
export const obtenerPagoServicioPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Consulta SQL para obtener un pago por ID y su cajaEnteroId
    const query = `
      SELECT ps.*, c."cajaEnteroId"
      FROM "pagos_servicios" ps
      LEFT JOIN "Caja" c ON ps."cajaId" = c.id
      WHERE ps.id = $1
    `;
    
    // Ejecutar la consulta
    const result = await prisma.$queryRawUnsafe(query, parseInt(id, 10));
    
    // Verificar si se encontró un pago
    if (!result || (Array.isArray(result) && result.length === 0)) {
      return res.status(404).json({ error: 'Pago de servicio no encontrado' });
    }
    
    // Devolver el resultado (primer elemento si es un array)
    res.json(Array.isArray(result) ? result[0] : result);
  } catch (error: any) {
    console.error('Error al obtener pago de servicio:', error);
    res.status(500).json({ 
      error: 'Error al obtener el pago de servicio', 
      details: error.message 
    });
  }
};

// Actualizar un pago de servicio
export const actualizarPagoServicio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { operadora, servicio, monto, moneda, observacion, estado } = req.body;
    
    // Validar datos obligatorios
    if (!operadora || !servicio || !monto || !moneda) {
      return res.status(400).json({ 
        error: 'Datos incompletos. Se requieren operadora, servicio, monto y moneda.' 
      });
    }

    // Convertir el monto a entero
    const montoEntero = parseInt(monto, 10);
    
    // Verificar que el monto sea un número válido
    if (isNaN(montoEntero) || montoEntero <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número entero positivo.' });
    }
    
    // Obtener el pago actual para verificar cambios
    const query = `SELECT * FROM "pagos_servicios" WHERE id = $1`;
    const pagoExistente = await prisma.$queryRawUnsafe(query, parseInt(id, 10));
    
    if (!pagoExistente || (Array.isArray(pagoExistente) && pagoExistente.length === 0)) {
      return res.status(404).json({ error: 'Pago de servicio no encontrado' });
    }
    
    // Variable para la ruta del comprobante
    let rutaComprobante: string | null = null;
    
    // Si hay un archivo nuevo, guardar la nueva ruta
    if (req.file) {
      console.log('Archivo recibido:', req.file);
      rutaComprobante = `uploads/comprobantes/${req.file.filename}`;
      
      // Si había un comprobante anterior, eliminarlo
      const pagoActual = Array.isArray(pagoExistente) ? pagoExistente[0] : pagoExistente;
      if (pagoActual.rutaComprobante) {
        try {
          const rutaAnterior = path.join(__dirname, '../../', pagoActual.rutaComprobante);
          if (fs.existsSync(rutaAnterior)) {
            fs.unlinkSync(rutaAnterior);
            console.log('Comprobante anterior eliminado:', rutaAnterior);
          }
        } catch (errorFS) {
          console.error('Error al eliminar comprobante anterior:', errorFS);
        }
      }
    } else {
      // Mantener la ruta anterior si no hay archivo nuevo
      const pagoActual = Array.isArray(pagoExistente) ? pagoExistente[0] : pagoExistente;
      rutaComprobante = pagoActual.rutaComprobante;
    }
    
    // Consulta SQL para actualizar el pago
    const updateQuery = `
      UPDATE "pagos_servicios"
      SET 
        "operadora" = $1, 
        "servicio" = $2, 
        "monto" = $3, 
        "moneda" = $4, 
        "observacion" = $5, 
        "rutaComprobante" = $6,
        "estado" = $7,
        "fechaActualizacion" = NOW()
      WHERE id = $8
      RETURNING *;
    `;
    
    const values = [
      operadora,
      servicio,
      montoEntero,
      moneda,
      observacion || null,
      rutaComprobante,
      estado || 'PENDIENTE', // Usar el estado dado o mantener PENDIENTE como predeterminado
      parseInt(id, 10)
    ];
    
    // Ejecutar la consulta
    const result = await prisma.$queryRawUnsafe(updateQuery, ...values);
    
    // Verificar si se actualizó el pago
    if (!result || (Array.isArray(result) && result.length === 0)) {
      return res.status(404).json({ error: 'No se pudo actualizar el pago de servicio' });
    }
    
    res.json({
      message: 'Pago de servicio actualizado correctamente',
      pago: Array.isArray(result) ? result[0] : result
    });
  } catch (error: any) {
    console.error('Error al actualizar pago de servicio:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el pago de servicio', 
      details: error.message 
    });
  }
};

// Eliminar un pago de servicio
export const eliminarPagoServicio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obtener el pago para verificar si tiene comprobante
    const query = `SELECT * FROM "pagos_servicios" WHERE id = $1`;
    const result = await prisma.$queryRawUnsafe(query, parseInt(id, 10));
    
    if (!result || (Array.isArray(result) && result.length === 0)) {
      return res.status(404).json({ error: 'Pago de servicio no encontrado' });
    }
    
    const pago = Array.isArray(result) ? result[0] : result;
    
    // Eliminar el comprobante del sistema de archivos si existe
    if (pago.rutaComprobante) {
      const rutaComprobante = path.join(__dirname, '../../', pago.rutaComprobante);
      if (fs.existsSync(rutaComprobante)) {
        fs.unlinkSync(rutaComprobante);
      }
    }
    
    // Eliminar el pago de la base de datos
    const deleteQuery = `DELETE FROM "pagos_servicios" WHERE id = $1`;
    await prisma.$queryRawUnsafe(deleteQuery, parseInt(id, 10));
    
    res.json({ message: 'Pago de servicio eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar pago de servicio:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el pago de servicio', 
      details: error.message 
    });
  }
};

// Cambiar el estado de un pago de servicio
export const cambiarEstadoPagoServicio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, observacionAnulacion } = req.body;
    
    // Validar que se proporcione un estado
    if (!estado) {
      return res.status(400).json({ error: 'Se requiere especificar el estado del pago.' });
    }
    
    // Validar que el estado sea uno de los valores permitidos
    const estadosPermitidos = ['PENDIENTE', 'PROCESADO', 'ANULADO', 'RECHAZADO'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({ 
        error: `Estado no válido. Los valores permitidos son: ${estadosPermitidos.join(', ')}.` 
      });
    }
    
    // Si es anulación, validar que haya motivo
    if (estado === 'ANULADO' && !observacionAnulacion) {
      return res.status(400).json({
        error: 'Se requiere especificar el motivo de la anulación.'
      });
    }
    
    // Verificar que el pago exista y obtener sus datos
    const verificarQuery = `SELECT * FROM "pagos_servicios" WHERE id = $1`;
    const pagoExistente = await prisma.$queryRawUnsafe(verificarQuery, parseInt(id, 10));
    
    if (!pagoExistente || (Array.isArray(pagoExistente) && pagoExistente.length === 0)) {
      return res.status(404).json({ error: 'Pago de servicio no encontrado' });
    }
    
    const pago = Array.isArray(pagoExistente) ? pagoExistente[0] : pagoExistente;
    
    // Verificar si ya está anulado
    if (pago.estado === 'ANULADO') {
      return res.status(400).json({ error: 'Este pago ya se encuentra anulado.' });
    }
    
    // Consulta SQL para actualizar solo el estado
    const updateQuery = `
      UPDATE "pagos_servicios"
      SET 
        "estado" = $1,
        "observacion" = CASE WHEN $2 IS NOT NULL THEN COALESCE("observacion" || ' | ', '') || 'ANULADO: ' || $2 ELSE "observacion" END,
        "fechaActualizacion" = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    
    // Ejecutar la consulta
    const result = await prisma.$queryRawUnsafe(
      updateQuery, 
      estado, 
      estado === 'ANULADO' ? observacionAnulacion : null, 
      parseInt(id, 10)
    );
    
    const pagoActualizado = Array.isArray(result) ? result[0] : result;
    
    // Si el estado es ANULADO, crear un movimiento contrario en caja_mayor_movimientos
    if (estado === 'ANULADO') {
      try {
        // Obtener usuarioId (asumiendo que el middleware isAuthenticated lo añade)
        let usuarioId = req.usuarioId || req.usuario?.id || null;
        if (!usuarioId) {
          console.warn('⚠️ ADVERTENCIA: Usuario no autenticado. Usando ID de usuario predeterminado (1) para el movimiento de caja.');
          usuarioId = 1; // Usar un ID por defecto si no hay usuario
        }
        
        // Mapear moneda al formato de caja_mayor_movimientos
        const monedaMovimiento = pago.moneda === 'PYG' ? 'guaranies' 
                               : pago.moneda === 'USD' ? 'dolares' 
                               : 'reales';
        
        // Buscar el último movimiento relacionado con este pago
        const ultimoMovimientoQuery = `
          SELECT * FROM "caja_mayor_movimientos"
          WHERE "pagoServicioId" = $1
          ORDER BY id DESC
          LIMIT 1
        `;
        
        const ultimoMovimiento = await prisma.$queryRawUnsafe(ultimoMovimientoQuery, parseInt(id, 10));
        
        if (!ultimoMovimiento || (Array.isArray(ultimoMovimiento) && ultimoMovimiento.length === 0)) {
          console.error('No se encontró el movimiento original para el pago', id);
          return res.status(500).json({ error: 'Error al crear movimiento de anulación: Movimiento original no encontrado' });
        }
        
        const movimientoOriginal = Array.isArray(ultimoMovimiento) ? ultimoMovimiento[0] : ultimoMovimiento;
        
        // Buscar el último movimiento de esta moneda para obtener el saldo actual
        const ultimoMovimientoMonedaQuery = `
          SELECT * FROM "caja_mayor_movimientos"
          WHERE moneda = $1
          ORDER BY id DESC
          LIMIT 1
        `;
        
        const ultimoMovimientoMoneda = await prisma.$queryRawUnsafe(ultimoMovimientoMonedaQuery, monedaMovimiento);
        const ultimoMovimientoMonedaData = Array.isArray(ultimoMovimientoMoneda) && ultimoMovimientoMoneda.length > 0 
          ? ultimoMovimientoMoneda[0] 
          : null;
        
        // Calcular saldos para el movimiento contrario
        const saldoAnterior = ultimoMovimientoMonedaData ? parseFloat(ultimoMovimientoMonedaData.saldoActual.toString()) : 0;
        const montoPago = parseFloat(pago.monto.toString());
        
        // Como el movimiento original era un egreso, la anulación es un ingreso (devuelve el dinero a la caja)
        const saldoActual = saldoAnterior + montoPago;
        
        // Concepto para el movimiento de anulación
        const conceptoAnulacion = `ANULACIÓN de Pago Servicio #${pago.id} - ${pago.operadora} ${pago.servicio} - ${observacionAnulacion}`;
        
        // Crear operacionId para el movimiento de anulación (ID original + "anulado")
        const operacionIdAnulacion = `${id}-ANULADO`;
        
        // Convertir ID a número entero explícitamente
        const pagoServicioIdNumero = Number(id);
        
        // Insertar movimiento de anulación en caja_mayor_movimientos
        await prisma.$executeRaw`
          INSERT INTO "caja_mayor_movimientos" (
            "fechaHora", tipo, "operacionId", moneda, monto, "esIngreso", 
            "saldoAnterior", "saldoActual", concepto, "usuarioId", 
            "pagoServicioId", "createdAt", "updatedAt"
          )
          VALUES (
            NOW(), 'Anulación Pago Servicio', ${operacionIdAnulacion}, ${monedaMovimiento}, ${montoPago}, true,
            ${saldoAnterior}, ${saldoActual}, ${conceptoAnulacion}, ${usuarioId},
            ${pagoServicioIdNumero}, NOW(), NOW()
          )
        `;
        
        console.log('✅ Movimiento de anulación registrado para el pago de servicio');
      } catch (errorMovimiento) {
        console.error('❌ Error al registrar movimiento de anulación:', errorMovimiento);
        // Continuamos y devolvemos el resultado de la actualización de estado
      }
    }
    
    res.json({
      message: `Estado del pago actualizado a "${estado}" correctamente`,
      pago: pagoActualizado
    });
  } catch (error: any) {
    console.error('Error al cambiar el estado del pago de servicio:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el estado del pago', 
      details: error.message 
    });
  }
}; 