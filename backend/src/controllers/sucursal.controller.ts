import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definición de interfaces
export interface Sucursal {
  id: string;
  nombre: string;
  codigo: string;
  direccion: string;
  telefono: string;
  email?: string;
  maletines?: any[];
  createdAt: string;
  updatedAt: string;
}

// Obtener todas las sucursales
export const getSucursales = async (_req: Request, res: Response) => {
  console.log('Accediendo a getSucursales - inicio de función');
  try {
    const sucursales = await prisma.sucursal.findMany({
      include: {
        maletines: true
      }
    });
    
    // Convertir los IDs numéricos a string para mantener compatibilidad con el frontend
    const sucursalesFormateadas = sucursales.map(sucursal => ({
      ...sucursal,
      id: String(sucursal.id),
      maletines: sucursal.maletines.map(maletin => ({
        ...maletin,
        id: String(maletin.id),
        sucursalId: String(maletin.sucursalId)
      }))
    }));
    
    return res.json(sucursalesFormateadas);
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    return res.status(500).json({ error: 'Error al obtener las sucursales', details: String(error) });
  }
};

// Obtener una sucursal por ID
export const getSucursalById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: parseInt(id) },
      include: {
        maletines: true
      }
    });

    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    
    // Formatear la respuesta para mantener compatibilidad con el frontend
    const sucursalFormateada = {
      ...sucursal,
      id: String(sucursal.id),
      maletines: sucursal.maletines.map(maletin => ({
        ...maletin,
        id: String(maletin.id),
        sucursalId: String(maletin.sucursalId)
      }))
    };

    return res.json(sucursalFormateada);
  } catch (error) {
    console.error(`Error al obtener sucursal ${id}:`, error);
    return res.status(500).json({ error: 'Error al obtener la sucursal' });
  }
};

// Crear una nueva sucursal
export const createSucursal = async (req: Request, res: Response) => {
  const { nombre, codigo, direccion, telefono, email } = req.body;

  try {
    // Verificar si el código ya existe
    const sucursalExistente = await prisma.sucursal.findFirst({
      where: { codigo }
    });

    if (sucursalExistente) {
      return res.status(400).json({ error: 'El código de sucursal ya existe' });
    }

    // Crear la nueva sucursal en la base de datos
    const nuevaSucursal = await prisma.sucursal.create({
      data: {
        nombre,
        codigo,
        direccion,
        telefono,
        email
      }
    });

    // Formatear la respuesta para mantener compatibilidad con el frontend
    const sucursalFormateada = {
      ...nuevaSucursal,
      id: String(nuevaSucursal.id),
      maletines: []
    };

    return res.status(201).json(sucursalFormateada);
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    return res.status(500).json({ error: 'Error al crear la sucursal' });
  }
};

// Actualizar una sucursal existente
export const updateSucursal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, codigo, direccion, telefono, email } = req.body;

  try {
    // Verificar si la sucursal existe
    const sucursalExistente = await prisma.sucursal.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sucursalExistente) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Verificar si el nuevo código ya existe en otra sucursal
    if (codigo && codigo !== sucursalExistente.codigo) {
      const codigoExistente = await prisma.sucursal.findFirst({
        where: {
          codigo,
          id: { not: parseInt(id) }
        }
      });

      if (codigoExistente) {
        return res.status(400).json({ error: 'El código de sucursal ya está en uso' });
      }
    }

    // Actualizar la sucursal
    const sucursalActualizada = await prisma.sucursal.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        codigo,
        direccion,
        telefono,
        email
      },
      include: {
        maletines: true
      }
    });

    // Formatear la respuesta para mantener compatibilidad con el frontend
    const sucursalFormateada = {
      ...sucursalActualizada,
      id: String(sucursalActualizada.id),
      maletines: sucursalActualizada.maletines.map(maletin => ({
        ...maletin,
        id: String(maletin.id),
        sucursalId: String(maletin.sucursalId)
      }))
    };

    return res.json(sucursalFormateada);
  } catch (error) {
    console.error(`Error al actualizar sucursal ${id}:`, error);
    return res.status(500).json({ error: 'Error al actualizar la sucursal' });
  }
};

// Eliminar una sucursal
export const deleteSucursal = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Verificar si la sucursal existe
    const sucursalExistente = await prisma.sucursal.findUnique({
      where: { id: parseInt(id) },
      include: {
        maletines: true
      }
    });

    if (!sucursalExistente) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Verificar si la sucursal tiene maletines asociados
    if (sucursalExistente.maletines.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la sucursal porque tiene maletines asociados',
        maletinesCount: sucursalExistente.maletines.length
      });
    }

    // Eliminar la sucursal
    await prisma.sucursal.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({ message: 'Sucursal eliminada correctamente' });
  } catch (error) {
    console.error(`Error al eliminar sucursal ${id}:`, error);
    return res.status(500).json({ error: 'Error al eliminar la sucursal' });
  }
}; 