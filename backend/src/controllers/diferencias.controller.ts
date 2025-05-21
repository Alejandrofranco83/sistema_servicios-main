import { Request, Response } from 'express';
import * as diferenciaService from '../services/diferencia.service';
import { Prisma } from '@prisma/client'; // Importa tipos de Prisma si los usas

export const getComparacionesMaletines = async (req: Request, res: Response): Promise<Response> => {
  try {
    const comparaciones = await diferenciaService.calcularComparacionesMaletines();
    return res.status(200).json({ comparaciones });
  } catch (error) {
    console.error("Error al obtener comparaciones de maletines:", error);
    // Considerar un manejo de errores más específico
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
         // Manejo específico de errores de Prisma
         return res.status(400).json({ message: 'Error de base de datos al obtener comparaciones.' });
    }
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}; 

// Nueva función para obtener comparaciones de saldos de servicios
export const getComparacionesSaldosServicios = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Llamar a la nueva función del servicio (a implementar)
    const comparaciones = await diferenciaService.calcularComparacionesSaldosServicios();
    return res.status(200).json({ comparaciones });
  } catch (error) {
    console.error("Error al obtener comparaciones de saldos de servicios:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
         return res.status(400).json({ message: 'Error de base de datos al obtener comparaciones de servicios.' });
    }
    return res.status(500).json({ message: 'Error interno del servidor al obtener comparaciones de servicios' });
  }
}; 

// Nueva función para obtener diferencias internas de caja
export const getDiferenciasEnCajas = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Llamar a la nueva función del servicio (a implementar)
    const comparaciones = await diferenciaService.calcularDiferenciasEnCajas();
    return res.status(200).json({ comparaciones });
  } catch (error) {
    console.error("Error al obtener diferencias internas de cajas:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
         return res.status(400).json({ message: 'Error de base de datos al obtener diferencias internas.' });
    }
    return res.status(500).json({ message: 'Error interno del servidor al obtener diferencias internas' });
  }
}; 