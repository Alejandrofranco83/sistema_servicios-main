import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema de validación para crear/actualizar dispositivo POS
const PosSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  codigoBarras: z.string().min(1, 'El código de barras es requerido'),
  cuentaBancariaId: z.number({
    required_error: 'El ID de la cuenta bancaria es requerido',
    invalid_type_error: 'El ID de la cuenta bancaria debe ser un número'
  })
});

/**
 * Obtener todos los dispositivos POS
 */
export const getAllPos = async (_req: Request, res: Response) => {
  try {
    const dispositivos = await prisma.dispositivoPos.findMany({
      include: {
        cuentaBancaria: true
      }
    });
    
    return res.status(200).json(dispositivos);
  } catch (error) {
    console.error('Error al obtener dispositivos POS:', error);
    return res.status(500).json({ error: 'Error al obtener dispositivos POS' });
  }
};

/**
 * Obtener un dispositivo POS por ID
 */
export const getPosById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const dispositivo = await prisma.dispositivoPos.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        cuentaBancaria: true
      }
    });
    
    if (!dispositivo) {
      return res.status(404).json({ error: 'Dispositivo POS no encontrado' });
    }
    
    return res.status(200).json(dispositivo);
  } catch (error) {
    console.error(`Error al obtener dispositivo POS ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Error al obtener dispositivo POS' });
  }
};

/**
 * Obtener un dispositivo POS por código de barras
 */
export const getPosByCodigoBarras = async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    
    if (!codigo) {
      return res.status(400).json({ error: 'Código de barras requerido' });
    }
    
    const dispositivo = await prisma.dispositivoPos.findUnique({
      where: {
        codigoBarras: codigo
      },
      include: {
        cuentaBancaria: true
      }
    });
    
    if (!dispositivo) {
      return res.status(404).json({ error: 'Dispositivo POS no encontrado con ese código de barras' });
    }
    
    return res.status(200).json(dispositivo);
  } catch (error) {
    console.error(`Error al obtener dispositivo POS con código ${req.params.codigo}:`, error);
    return res.status(500).json({ error: 'Error al obtener dispositivo POS' });
  }
};

/**
 * Crear un nuevo dispositivo POS
 */
export const createPos = async (req: Request, res: Response) => {
  try {
    const validationResult = PosSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: validationResult.error.errors
      });
    }
    
    const data = validationResult.data;
    
    // Verificar que la cuenta bancaria existe
    const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
      where: { id: data.cuentaBancariaId }
    });
    
    if (!cuentaBancaria) {
      return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
    }
    
    // Verificar que el código de barras no esté duplicado
    const existingPos = await prisma.dispositivoPos.findUnique({
      where: { codigoBarras: data.codigoBarras }
    });
    
    if (existingPos) {
      return res.status(400).json({ error: 'Ya existe un dispositivo POS con ese código de barras' });
    }
    
    // Crear el dispositivo POS
    const nuevoPOS = await prisma.dispositivoPos.create({
      data,
      include: {
        cuentaBancaria: true
      }
    });
    
    return res.status(201).json(nuevoPOS);
  } catch (error) {
    console.error('Error al crear dispositivo POS:', error);
    return res.status(500).json({ error: 'Error al crear dispositivo POS' });
  }
};

/**
 * Actualizar un dispositivo POS existente
 */
export const updatePos = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const validationResult = PosSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: validationResult.error.errors
      });
    }
    
    const data = validationResult.data;
    
    // Verificar que el dispositivo POS existe
    const dispositivoExistente = await prisma.dispositivoPos.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!dispositivoExistente) {
      return res.status(404).json({ error: 'Dispositivo POS no encontrado' });
    }
    
    // Verificar que la cuenta bancaria existe
    const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
      where: { id: data.cuentaBancariaId }
    });
    
    if (!cuentaBancaria) {
      return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
    }
    
    // Verificar que el código de barras no esté duplicado (si se está cambiando)
    if (data.codigoBarras !== dispositivoExistente.codigoBarras) {
      const existingPos = await prisma.dispositivoPos.findUnique({
        where: { codigoBarras: data.codigoBarras }
      });
      
      if (existingPos) {
        return res.status(400).json({ error: 'Ya existe un dispositivo POS con ese código de barras' });
      }
    }
    
    // Actualizar el dispositivo POS
    const dispositivoActualizado = await prisma.dispositivoPos.update({
      where: { id: parseInt(id) },
      data,
      include: {
        cuentaBancaria: true
      }
    });
    
    return res.status(200).json(dispositivoActualizado);
  } catch (error) {
    console.error(`Error al actualizar dispositivo POS ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Error al actualizar dispositivo POS' });
  }
};

/**
 * Eliminar un dispositivo POS
 */
export const deletePos = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar que el dispositivo POS existe
    const dispositivo = await prisma.dispositivoPos.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!dispositivo) {
      return res.status(404).json({ error: 'Dispositivo POS no encontrado' });
    }
    
    // Eliminar el dispositivo POS
    await prisma.dispositivoPos.delete({
      where: { id: parseInt(id) }
    });
    
    return res.status(200).json({ message: 'Dispositivo POS eliminado correctamente' });
  } catch (error) {
    console.error(`Error al eliminar dispositivo POS ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Error al eliminar dispositivo POS' });
  }
}; 