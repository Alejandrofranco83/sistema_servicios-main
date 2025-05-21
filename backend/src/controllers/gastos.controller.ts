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

    res.json(gastos);
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
      observaciones
    } = req.body;
    
    // Verificar que el usuario es válido
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Crear el gasto
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
  } catch (error) {
    console.error('Error al crear gasto:', error);
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

    // Si hay un comprobante, eliminarlo del sistema de archivos
    if (gasto.comprobante) {
      const filePath = path.join(__dirname, '../../', gasto.comprobante);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Eliminar el gasto
    await prisma.gasto.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Gasto eliminado correctamente' });
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