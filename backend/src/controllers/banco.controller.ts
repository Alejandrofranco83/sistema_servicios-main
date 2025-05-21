import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todos los bancos
 */
export const getAllBancos = async (_req: Request, res: Response) => {
  try {
    const bancos = await prisma.$queryRaw`SELECT * FROM "Banco" ORDER BY nombre ASC`;

    return res.status(200).json(bancos);
  } catch (error) {
    console.error('Error al obtener bancos:', error);
    return res.status(500).json({ error: 'Error al obtener bancos' });
  }
};

/**
 * Obtener un banco por ID
 */
export const getBancoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idNumber = parseInt(id, 10);

    if (isNaN(idNumber)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const banco = await prisma.$queryRaw`
      SELECT b.*, 
        (SELECT COUNT(*) FROM "CuentaBancaria" WHERE "bancoId" = ${idNumber}) as cuentas_count,
        (SELECT COUNT(*) FROM "DepositoBancario" WHERE "bancoId" = ${idNumber}) as depositos_count
      FROM "Banco" b
      WHERE b.id = ${idNumber}
    `;

    if (!banco || (Array.isArray(banco) && banco.length === 0)) {
      return res.status(404).json({ error: 'Banco no encontrado' });
    }

    return res.status(200).json(Array.isArray(banco) ? banco[0] : banco);
  } catch (error) {
    console.error('Error al obtener banco:', error);
    return res.status(500).json({ error: 'Error al obtener banco' });
  }
};

/**
 * Crear un nuevo banco
 */
export const createBanco = async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ 
        error: 'Falta el nombre del banco', 
        details: 'El nombre del banco es obligatorio'
      });
    }

    // Verificar si ya existe un banco con ese nombre
    const existingBanco = await prisma.$queryRaw`SELECT * FROM "Banco" WHERE nombre = ${nombre}`;

    if (existingBanco && Array.isArray(existingBanco) && existingBanco.length > 0) {
      return res.status(400).json({ 
        error: 'El banco ya existe', 
        details: 'Ya existe un banco con ese nombre'
      });
    }

    // Crear el banco usando SQL directo
    const newBanco = await prisma.$queryRaw`
      INSERT INTO "Banco" (nombre, "createdAt", "updatedAt")
      VALUES (${nombre}, NOW(), NOW())
      RETURNING *
    `;

    return res.status(201).json(Array.isArray(newBanco) ? newBanco[0] : newBanco);
  } catch (error) {
    console.error('Error al crear banco:', error);
    return res.status(500).json({ error: 'Error al crear banco' });
  }
};

/**
 * Actualizar un banco existente
 */
export const updateBanco = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idNumber = parseInt(id, 10);

    if (isNaN(idNumber)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { nombre } = req.body;

    // Validar que se proporciona el nombre
    if (!nombre) {
      return res.status(400).json({ 
        error: 'Falta el nombre del banco', 
        details: 'El nombre del banco es obligatorio'
      });
    }

    // Verificar si el banco existe
    const existingBanco = await prisma.$queryRaw`SELECT * FROM "Banco" WHERE id = ${idNumber}`;

    if (!existingBanco || (Array.isArray(existingBanco) && existingBanco.length === 0)) {
      return res.status(404).json({ error: 'Banco no encontrado' });
    }

    // Verificar si ya existe otro banco con ese nombre
    const bancoWithSameName = await prisma.$queryRaw`SELECT * FROM "Banco" WHERE nombre = ${nombre}`;

    if (bancoWithSameName && Array.isArray(bancoWithSameName) && bancoWithSameName.length > 0) {
      const bancoFound = bancoWithSameName[0] as any;
      if (bancoFound.id !== idNumber) {
        return res.status(400).json({ 
          error: 'El nombre del banco ya está en uso', 
          details: 'Ya existe otro banco con ese nombre'
        });
      }
    }

    // Actualizar el banco
    const updatedBanco = await prisma.$queryRaw`
      UPDATE "Banco"
      SET nombre = ${nombre}, "updatedAt" = NOW()
      WHERE id = ${idNumber}
      RETURNING *
    `;

    return res.status(200).json(Array.isArray(updatedBanco) ? updatedBanco[0] : updatedBanco);
  } catch (error) {
    console.error('Error al actualizar banco:', error);
    return res.status(500).json({ error: 'Error al actualizar banco' });
  }
};

/**
 * Eliminar un banco
 */
export const deleteBanco = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idNumber = parseInt(id, 10);

    if (isNaN(idNumber)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar si el banco existe
    const existingBanco = await prisma.$queryRaw`SELECT * FROM "Banco" WHERE id = ${idNumber}`;

    if (!existingBanco || (Array.isArray(existingBanco) && existingBanco.length === 0)) {
      return res.status(404).json({ error: 'Banco no encontrado' });
    }

    // Verificar si el banco tiene cuentas asociadas
    const cuentasAsociadas = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "CuentaBancaria" WHERE "bancoId" = ${idNumber}
    `;
    
    // Verificar si el banco tiene depósitos asociados
    const depositosAsociados = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "DepositoBancario" WHERE "bancoId" = ${idNumber}
    `;

    const cuentasCount = Array.isArray(cuentasAsociadas) ? (cuentasAsociadas[0] as any).count : 0;
    const depositosCount = Array.isArray(depositosAsociados) ? (depositosAsociados[0] as any).count : 0;

    if (cuentasCount > 0 || depositosCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el banco', 
        details: 'El banco tiene cuentas o depósitos asociados'
      });
    }

    // Eliminar el banco
    await prisma.$queryRaw`DELETE FROM "Banco" WHERE id = ${idNumber}`;

    return res.status(200).json({ message: 'Banco eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar banco:', error);
    return res.status(500).json({ error: 'Error al eliminar banco' });
  }
}; 