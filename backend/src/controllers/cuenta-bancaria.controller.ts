import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todas las cuentas bancarias
 */
export const getAllCuentasBancarias = async (_req: Request, res: Response) => {
  try {
    const cuentas = await prisma.cuentaBancaria.findMany({
      orderBy: {
        banco: 'asc',
      },
    });

    return res.status(200).json(cuentas);
  } catch (error) {
    console.error('Error al obtener cuentas bancarias:', error);
    return res.status(500).json({ error: 'Error al obtener cuentas bancarias' });
  }
};

/**
 * Obtener una cuenta bancaria por ID
 */
export const getCuentaBancariaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idNumber = parseInt(id, 10);

    if (isNaN(idNumber)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: idNumber },
      include: {
        dispositivosPos: true,
      },
    });

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
    }

    return res.status(200).json(cuenta);
  } catch (error) {
    console.error('Error al obtener cuenta bancaria:', error);
    return res.status(500).json({ error: 'Error al obtener cuenta bancaria' });
  }
};

/**
 * Crear una nueva cuenta bancaria
 */
export const createCuentaBancaria = async (req: Request, res: Response) => {
  try {
    const { banco, numeroCuenta, moneda, tipo } = req.body;

    // Validaciones sencillas
    if (!banco || !numeroCuenta || !moneda || !tipo) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos', 
        details: 'El banco, número de cuenta, tipo y moneda son obligatorios'
      });
    }

    if (!['PYG', 'BRL', 'USD'].includes(moneda)) {
      return res.status(400).json({ 
        error: 'Moneda inválida', 
        details: 'La moneda debe ser PYG, BRL o USD'
      });
    }

    // Crear la cuenta bancaria
    const newCuenta = await prisma.cuentaBancaria.create({
      data: {
        banco,
        numeroCuenta,
        moneda,
        tipo,
      },
    });

    return res.status(201).json(newCuenta);
  } catch (error) {
    console.error('Error al crear cuenta bancaria:', error);
    return res.status(500).json({ error: 'Error al crear cuenta bancaria' });
  }
};

/**
 * Actualizar una cuenta bancaria existente
 */
export const updateCuentaBancaria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idNumber = parseInt(id, 10);

    if (isNaN(idNumber)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { banco, numeroCuenta, moneda } = req.body;

    // Verificar si se está actualizando la moneda y validarla
    if (moneda && !['PYG', 'BRL', 'USD'].includes(moneda)) {
      return res.status(400).json({ 
        error: 'Moneda inválida', 
        details: 'La moneda debe ser PYG, BRL o USD'
      });
    }

    // Verificar si la cuenta existe
    const existingCuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: idNumber },
    });

    if (!existingCuenta) {
      return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
    }

    // Actualizar la cuenta bancaria
    const updatedCuenta = await prisma.cuentaBancaria.update({
      where: { id: idNumber },
      data: {
        ...(banco && { banco }),
        ...(numeroCuenta && { numeroCuenta }),
        ...(moneda && { moneda }),
      },
    });

    return res.status(200).json(updatedCuenta);
  } catch (error) {
    console.error('Error al actualizar cuenta bancaria:', error);
    return res.status(500).json({ error: 'Error al actualizar cuenta bancaria' });
  }
};

/**
 * Eliminar una cuenta bancaria
 */
export const deleteCuentaBancaria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idNumber = parseInt(id, 10);

    if (isNaN(idNumber)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar si la cuenta existe
    const existingCuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: idNumber },
      include: {
        dispositivosPos: true,
      },
    });

    if (!existingCuenta) {
      return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
    }

    // Verificar si la cuenta tiene dispositivos POS asociados
    if (existingCuenta.dispositivosPos.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la cuenta bancaria', 
        details: 'La cuenta tiene dispositivos POS asociados'
      });
    }

    // Eliminar la cuenta bancaria
    await prisma.cuentaBancaria.delete({
      where: { id: idNumber },
    });

    return res.status(200).json({ message: 'Cuenta bancaria eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cuenta bancaria:', error);
    return res.status(500).json({ error: 'Error al eliminar cuenta bancaria' });
  }
}; 