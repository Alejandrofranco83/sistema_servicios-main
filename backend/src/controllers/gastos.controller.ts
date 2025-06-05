import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configuración para la subida de comprobantes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/comprobantes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

export const upload = multer({ storage });

// Función auxiliar para mapear moneda de gastos a formato de caja mayor
const mapearMonedaCajaMayor = (monedaGasto: string): 'guaranies' | 'dolares' | 'reales' => {
  switch (monedaGasto) {
    case 'GS':
    case 'PYG':
      return 'guaranies';
    case 'USD':
      return 'dolares';
    case 'BRL':
      return 'reales';
    default:
      return 'guaranies';
  }
};

// Función auxiliar para mapear moneda de gastos a formato de farmacia
const mapearMonedaFarmacia = (monedaGasto: string): 'PYG' | 'USD' | 'BRL' => {
  switch (monedaGasto) {
    case 'GS':
      return 'PYG';
    case 'USD':
      return 'USD';
    case 'BRL':
      return 'BRL';
    default:
      return 'PYG';
  }
};

// Función auxiliar para verificar si un gasto sale de caja mayor
const verificarGastoSaleDeCajaMayor = async (gastoId: number): Promise<boolean> => {
  const movimiento = await prisma.cajaMayorMovimiento.findFirst({
    where: {
      operacionId: gastoId.toString(),
      tipo: 'Gasto'
    }
  });
  return !!movimiento;
};

// Obtener todos los gastos con posibilidad de filtros
export const getGastos = async (req: Request, res: Response) => {
  try {
    const {
      fechaDesde,
      fechaHasta,
      categoriaId,
      subcategoriaId,
      sucursalId,
      moneda
    } = req.query;

    const filters: any = {};

    if (fechaDesde && fechaHasta) {
      filters.fecha = {
        gte: new Date(fechaDesde as string),
        lte: new Date(fechaHasta as string)
      };
    } else if (fechaDesde) {
      filters.fecha = { gte: new Date(fechaDesde as string) };
    } else if (fechaHasta) {
      filters.fecha = { lte: new Date(fechaHasta as string) };
    }

    if (categoriaId) filters.categoriaId = parseInt(categoriaId as string);
    if (subcategoriaId) filters.subcategoriaId = parseInt(subcategoriaId as string);
    if (sucursalId && sucursalId !== 'null') {
      filters.sucursalId = parseInt(sucursalId as string);
    } else if (sucursalId === 'null') {
      filters.sucursalId = null; // Caso para "General/Adm"
    }
    if (moneda) filters.moneda = moneda;

    const gastos = await prisma.gasto.findMany({
      where: filters,
      include: {
        categoria: true,
        subcategoria: true,
        sucursal: true,
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    // Verificar para cada gasto si sale de caja mayor
    const gastosConInfo = await Promise.all(
      gastos.map(async (gasto) => {
        const saleDeCajaMayor = await verificarGastoSaleDeCajaMayor(gasto.id);
        return {
          ...gasto,
          saleDeCajaMayor
        };
      })
    );

    res.json(gastosConInfo);
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({ error: 'Error al obtener los gastos' });
  }
};

// Obtener un gasto por su ID
export const getGastoById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const gasto = await prisma.gasto.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        subcategoria: true,
        sucursal: true,
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      }
    });
    
    if (!gasto) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    
    res.json(gasto);
  } catch (error) {
    console.error('Error al obtener gasto:', error);
    res.status(500).json({ error: 'Error al obtener el gasto' });
  }
};

// Crear un nuevo gasto
export const createGasto = async (req: Request, res: Response) => {
  try {
    const {
      fecha,
      descripcion,
      monto,
      moneda,
      categoriaId,
      subcategoriaId,
      sucursalId,
      observaciones,
      saleDeCajaMayor
    } = req.body;
    
    // Verificar que el usuario es válido
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Convertir saleDeCajaMayor a boolean
    const saleDeCajaMayorBool = saleDeCajaMayor === 'true' || saleDeCajaMayor === true;

    console.log('Creando gasto:', { descripcion, monto, moneda, saleDeCajaMayor: saleDeCajaMayorBool });

    // Si sale de caja mayor, usar transacción atómica
    if (saleDeCajaMayorBool) {
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Crear el gasto
        const gasto = await tx.gasto.create({
          data: {
            fecha: fecha ? new Date(fecha) : new Date(),
            descripcion,
            monto: parseFloat(monto),
            moneda: moneda || 'GS',
            categoriaId: parseInt(categoriaId),
            subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
            sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
            comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : null,
            observaciones,
            usuarioId: userId
          },
          include: {
            categoria: true,
            subcategoria: true,
            sucursal: true,
            usuario: {
              select: {
                id: true,
                username: true,
                nombre: true
              }
            }
          }
        });

        // 2. Crear movimiento en caja mayor (egreso)
        const monedaCajaMayor = mapearMonedaCajaMayor(moneda || 'GS');
        
        // Buscar el último movimiento de caja mayor para obtener el saldo anterior
        const ultimoMovimiento = await tx.cajaMayorMovimiento.findFirst({
          where: { moneda: monedaCajaMayor },
          orderBy: { id: 'desc' }
        });

        const saldoAnterior = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldoActual.toString()) : 0;
        const montoGasto = parseFloat(monto);
        const saldoActual = saldoAnterior - montoGasto; // Egreso de caja

        // Crear concepto descriptivo incluyendo categoría, subcategoría y sucursal
        const conceptoCajaMayor = `Gasto: ${descripcion} - ${gasto.categoria.nombre}${gasto.subcategoria ? ` / ${gasto.subcategoria.nombre}` : ''} - ${gasto.sucursal?.nombre || 'General/Adm'}`;

        await tx.cajaMayorMovimiento.create({
          data: {
            fechaHora: new Date(),
            tipo: 'Gasto',
            operacionId: gasto.id.toString(),
            moneda: monedaCajaMayor,
            monto: montoGasto,
            esIngreso: false, // Un gasto es un egreso
            saldoAnterior,
            saldoActual,
            concepto: conceptoCajaMayor,
            usuarioId: userId
          }
        });

        // 3. Crear movimiento en balance farmacia (egreso)
        const monedaFarmacia = mapearMonedaFarmacia(moneda || 'GS');
        const montoNegativo = -montoGasto; // Negativo para representar egreso

        // Usar el mismo concepto detallado que en caja mayor
        const conceptoFarmacia = conceptoCajaMayor; // Mismo concepto que caja mayor

        await tx.movimientoFarmacia.create({
          data: {
            fechaHora: new Date(),
            tipoMovimiento: 'EGRESO',
            concepto: conceptoFarmacia,
            movimientoOrigenId: gasto.id,
            movimientoOrigenTipo: 'GASTO',
            monto: montoNegativo,
            monedaCodigo: monedaFarmacia,
            estado: 'CONFIRMADO',
            usuarioId: userId
          }
        });

        console.log(`✅ Gasto creado con movimientos en caja mayor y farmacia - ID: ${gasto.id}`);
        return gasto;
      });

      res.status(201).json(resultado);
    } else {
      // Crear gasto sin movimientos de caja mayor
      const gasto = await prisma.gasto.create({
        data: {
          fecha: fecha ? new Date(fecha) : new Date(),
          descripcion,
          monto: parseFloat(monto),
          moneda: moneda || 'GS',
          categoriaId: parseInt(categoriaId),
          subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
          sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
          comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : null,
          observaciones,
          usuarioId: userId
        },
        include: {
          categoria: true,
          subcategoria: true,
          sucursal: true,
          usuario: {
            select: {
              id: true,
              username: true,
              nombre: true
            }
          }
        }
      });
      
      res.status(201).json(gasto);
    }
  } catch (error) {
    console.error('Error al crear gasto:', error);
    
    // Si hay un archivo que se guardó y ocurrió un error en la transacción, eliminarlo
    if (req.file) {
      try {
        const filePath = path.join(__dirname, '../../uploads/comprobantes', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Archivo eliminado debido al error en la transacción');
        }
      } catch (fileError) {
        console.error('Error al eliminar archivo tras fallo en transacción:', fileError);
      }
    }
    
    res.status(500).json({ error: 'Error al crear el gasto' });
  }
};

// Actualizar un gasto existente
export const updateGasto = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const {
      fecha,
      descripcion,
      monto,
      moneda,
      categoriaId,
      subcategoriaId,
      sucursalId,
      observaciones
    } = req.body;

    // Verificar que el gasto existe
    const gastoExistente = await prisma.gasto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!gastoExistente) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    // Actualizar el gasto
    const gasto = await prisma.gasto.update({
      where: { id: parseInt(id) },
      data: {
        fecha: fecha ? new Date(fecha) : undefined,
        descripcion,
        monto: monto ? parseFloat(monto) : undefined,
        moneda,
        categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
        subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
        sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
        comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : undefined,
        observaciones
      },
      include: {
        categoria: true,
        subcategoria: true,
        sucursal: true,
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      }
    });
    
    res.json(gasto);
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    res.status(500).json({ error: 'Error al actualizar el gasto' });
  }
};

// Eliminar un gasto
export const deleteGasto = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Verificar que el gasto existe
    const gasto = await prisma.gasto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!gasto) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    // Verificar si el gasto sale de caja mayor
    const saleDeCajaMayor = await verificarGastoSaleDeCajaMayor(parseInt(id));
    
    if (saleDeCajaMayor) {
      return res.status(400).json({ 
        error: 'Este gasto debe eliminarse desde el Balance de Caja Mayor',
        code: 'DEBE_ELIMINAR_DESDE_BALANCE'
      });
    }

    // Eliminar archivo de comprobante si existe
    if (gasto.comprobante) {
      const comprobanteePath = path.join(__dirname, '../../uploads/comprobantes', gasto.comprobante);
      if (fs.existsSync(comprobanteePath)) {
        fs.unlinkSync(comprobanteePath);
      }
    }

    // Eliminar el gasto (solo si no sale de caja mayor)
    await prisma.gasto.delete({
      where: { id: parseInt(id) }
    });

    res.json({ 
      message: 'Gasto eliminado exitosamente',
      gastoEliminado: gasto
    });

  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({ error: 'Error al eliminar el gasto' });
  }
};

// Obtener todas las sucursales
export const getSucursales = async (req: Request, res: Response) => {
  try {
    const sucursales = await prisma.sucursal.findMany({
      orderBy: { nombre: 'asc' }
    });
    
    res.json(sucursales);
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    res.status(500).json({ error: 'Error al obtener las sucursales' });
  }
};

// Eliminar un gasto desde caja mayor 
export const deleteGastoCajaMayor = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Verificar que el gasto existe
    const gasto = await prisma.gasto.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        subcategoria: true,
        sucursal: true
      }
    });

    if (!gasto) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    // Verificar si el gasto sale de caja mayor
    const saleDeCajaMayor = await verificarGastoSaleDeCajaMayor(parseInt(id));
    
    if (!saleDeCajaMayor) {
      return res.status(400).json({ 
        error: 'Este gasto no sale de caja mayor',
        code: 'NO_ES_GASTO_CAJA_MAYOR'
      });
    }

    // Obtener el usuario del token
    const userId = (req as any).user?.id || 1;

    // Construir concepto detallado para el movimiento contrario
    let concepto = `Anulación Gasto: ${gasto.descripcion} - ${gasto.categoria.nombre}`;
    
    if (gasto.subcategoria) {
      concepto += ` / ${gasto.subcategoria.nombre}`;
    }
    
    if (gasto.sucursal) {
      concepto += ` - ${gasto.sucursal.nombre}`;
    } else {
      concepto += ` - General/Adm`;
    }

    // Usar transacción atómica para eliminar registros y crear movimiento contrario
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar movimientos de farmacia relacionados al gasto
      await tx.movimientoFarmacia.deleteMany({
        where: {
          movimientoOrigenId: gasto.id,
          movimientoOrigenTipo: 'GASTO'
        }
      });

      // 2. Crear movimiento contrario huérfano en caja mayor (para mantener trazabilidad)
      const monedaCajaMayor = mapearMonedaCajaMayor(gasto.moneda);
      
      // Buscar el último movimiento de caja mayor para obtener el saldo anterior
      const ultimoMovimiento = await tx.cajaMayorMovimiento.findFirst({
        where: { moneda: monedaCajaMayor },
        orderBy: { id: 'desc' }
      });

      const saldoAnterior = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldoActual.toString()) : 0;
      const montoGasto = parseFloat(gasto.monto.toString());
      const saldoActual = saldoAnterior + montoGasto; // Ingreso (sumamos porque estamos devolviendo el dinero)

      await tx.cajaMayorMovimiento.create({
        data: {
          tipo: 'ANULACION_GASTO',
          monto: montoGasto,
          moneda: monedaCajaMayor,
          concepto: concepto,
          fechaHora: new Date(),
          operacionId: `ANULADO_${gasto.id}`, // Cambiar ID para que sea huérfano
          esIngreso: true,
          saldoAnterior: saldoAnterior,
          saldoActual: saldoActual,
          usuarioId: userId
        }
      });

      // 3. Eliminar el gasto de la tabla
      await tx.gasto.delete({
        where: { id: parseInt(id) }
      });
    });

    console.log(`✅ Gasto eliminado con movimiento contrario de respaldo - ID: ${id}`);

    res.json({ 
      message: 'Gasto eliminado correctamente',
      gastoId: parseInt(id)
    });

  } catch (error) {
    console.error('❌ Error al eliminar gasto desde caja mayor:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al eliminar el gasto',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Actualizar un gasto desde caja mayor (actualiza también movimientos relacionados)
export const updateGastoCajaMayor = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const {
      fecha,
      descripcion,
      monto,
      moneda,
      categoriaId,
      subcategoriaId,
      sucursalId,
      observaciones
    } = req.body;

    // Verificar que el gasto existe
    const gastoExistente = await prisma.gasto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!gastoExistente) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    // Verificar si el gasto sale de caja mayor
    const saleDeCajaMayor = await verificarGastoSaleDeCajaMayor(parseInt(id));
    
    if (!saleDeCajaMayor) {
      return res.status(400).json({ 
        error: 'Este gasto no sale de caja mayor',
        code: 'NO_ES_GASTO_CAJA_MAYOR'
      });
    }

    // Usar transacción atómica para actualizar todo relacionado
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar el gasto
      const gastoActualizado = await tx.gasto.update({
        where: { id: parseInt(id) },
        data: {
          fecha: fecha ? new Date(fecha) : undefined,
          descripcion,
          monto: monto ? parseFloat(monto) : undefined,
          moneda,
          categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
          subcategoriaId: subcategoriaId ? parseInt(subcategoriaId) : null,
          sucursalId: sucursalId && sucursalId !== 'null' ? parseInt(sucursalId) : null,
          comprobante: req.file ? `/uploads/comprobantes/${req.file.filename}` : undefined,
          observaciones
        },
        include: {
          categoria: true,
          subcategoria: true,
          sucursal: true,
          usuario: {
            select: {
              id: true,
              username: true,
              nombre: true
            }
          }
        }
      });

      // 2. Actualizar movimientos de caja mayor si cambiaron datos relevantes
      if (descripcion || monto || moneda || categoriaId || subcategoriaId || sucursalId) {
        // Buscar el movimiento de caja mayor
        const movimientoCajaMayor = await tx.cajaMayorMovimiento.findFirst({
          where: {
            operacionId: id,
            tipo: 'Gasto'
          }
        });

        if (movimientoCajaMayor) {
          const monedaCajaMayor = mapearMonedaCajaMayor(moneda || gastoExistente.moneda);
          const montoNuevo = monto ? parseFloat(monto) : gastoExistente.monto;
          
          // Crear concepto actualizado
          const conceptoActualizado = `Gasto: ${descripcion || gastoExistente.descripcion} - ${gastoActualizado.categoria.nombre}${gastoActualizado.subcategoria ? ` / ${gastoActualizado.subcategoria.nombre}` : ''} - ${gastoActualizado.sucursal?.nombre || 'General/Adm'}`;

          // Actualizar movimiento de caja mayor
          await tx.cajaMayorMovimiento.update({
            where: { id: movimientoCajaMayor.id },
            data: {
              monto: montoNuevo,
              moneda: monedaCajaMayor,
              concepto: conceptoActualizado
            }
          });

          // 3. Actualizar movimiento de farmacia
          const monedaFarmacia = mapearMonedaFarmacia(moneda || gastoExistente.moneda);
          const montoNegativo = -montoNuevo;

          await tx.movimientoFarmacia.updateMany({
            where: {
              movimientoOrigenId: parseInt(id),
              movimientoOrigenTipo: 'GASTO'
            },
            data: {
              monto: montoNegativo,
              monedaCodigo: monedaFarmacia,
              concepto: conceptoActualizado
            }
          });

          console.log(`✅ Gasto de caja mayor actualizado con movimientos - ID: ${id}`);
        }
      }

      return gastoActualizado;
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error al actualizar gasto de caja mayor:', error);
    res.status(500).json({ error: 'Error al actualizar el gasto de caja mayor' });
  }
}; 