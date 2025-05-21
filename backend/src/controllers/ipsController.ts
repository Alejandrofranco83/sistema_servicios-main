import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todas las personas registradas en IPS
 */
export const getPersonasIPS = async (req: Request, res: Response) => {
  try {
    // Usando la notación persona-a-persona para evitar problemas de nombres
    const personasIPS = await prisma.$queryRaw`
      SELECT 
        p_ips.id, 
        p_ips."personaId", 
        p_ips."fechaInicio", 
        p_ips.estado, 
        p_ips."createdAt", 
        p_ips."updatedAt",
        p.id as "persona.id", 
        p."nombreCompleto" as "persona.nombreCompleto", 
        p.documento as "persona.documento", 
        p.tipo as "persona.tipo"
      FROM "PersonaIPS" p_ips
      JOIN "Persona" p ON p.id = p_ips."personaId"
      ORDER BY p_ips."fechaInicio" DESC
    `;

    // Formatear los resultados para que coincidan con la estructura esperada
    const resultados = Array.isArray(personasIPS) ? personasIPS.map(item => {
      return {
        id: item.id,
        personaId: item.personaId,
        fechaInicio: item.fechaInicio,
        estado: item.estado,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        persona: {
          id: item['persona.id'],
          nombreCompleto: item['persona.nombreCompleto'],
          documento: item['persona.documento'],
          tipo: item['persona.tipo']
        }
      };
    }) : [];

    res.status(200).json(resultados);
  } catch (error) {
    console.error('Error al obtener personas de IPS:', error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener las personas de IPS'
    });
  }
};

/**
 * Agregar una persona a IPS
 */
export const agregarPersonaIPS = async (req: Request, res: Response) => {
  const { personaId, fechaInicio, estado } = req.body;

  // Validación de datos
  if (!personaId || !fechaInicio) {
    return res.status(400).json({
      message: 'Los campos personaId y fechaInicio son obligatorios'
    });
  }

  try {
    // Verificar si la persona existe
    const personaExiste = await prisma.persona.findUnique({
      where: { id: personaId }
    });

    if (!personaExiste) {
      return res.status(404).json({
        message: 'La persona no existe'
      });
    }

    // Verificar si la persona ya está registrada en IPS usando SQL directo
    const personasRegistradas = await prisma.$queryRaw`
      SELECT id FROM "PersonaIPS" WHERE "personaId" = ${personaId}
    `;

    if (Array.isArray(personasRegistradas) && personasRegistradas.length > 0) {
      return res.status(400).json({
        message: 'Esta persona ya está registrada en IPS'
      });
    }

    // Crear el registro en IPS usando SQL directo
    // Ajustamos la fecha para que use la fecha local sin problemas de zona horaria
    let fechaInicioDate;
    try {
      // Asegurarnos de usar la fecha local correcta
      const [year, month, day] = fechaInicio.split('-').map((n: string) => parseInt(n, 10));
      fechaInicioDate = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar problemas de zona horaria
      console.log('Fecha a guardar:', fechaInicioDate);
    } catch (error) {
      console.error('Error al procesar la fecha:', error);
      fechaInicioDate = new Date(fechaInicio);
    }
    
    const estadoFinal = estado || 'ACTIVO';

    await prisma.$executeRaw`
      INSERT INTO "PersonaIPS" ("personaId", "fechaInicio", estado, "createdAt", "updatedAt")
      VALUES (${personaId}, ${fechaInicioDate}, ${estadoFinal}, NOW(), NOW())
    `;

    // Obtener el registro recién creado
    const nuevosRegistros = await prisma.$queryRaw`
      SELECT 
        p_ips.id, 
        p_ips."personaId", 
        p_ips."fechaInicio", 
        p_ips.estado, 
        p_ips."createdAt", 
        p_ips."updatedAt",
        p.id as "persona.id", 
        p."nombreCompleto" as "persona.nombreCompleto", 
        p.documento as "persona.documento", 
        p.tipo as "persona.tipo"
      FROM "PersonaIPS" p_ips
      JOIN "Persona" p ON p.id = p_ips."personaId"
      WHERE p_ips."personaId" = ${personaId}
      ORDER BY p_ips.id DESC
      LIMIT 1
    `;

    // Formatear el resultado
    const nuevaPersonaIPS = Array.isArray(nuevosRegistros) && nuevosRegistros.length > 0 ? {
      id: nuevosRegistros[0].id,
      personaId: nuevosRegistros[0].personaId,
      fechaInicio: nuevosRegistros[0].fechaInicio,
      estado: nuevosRegistros[0].estado,
      createdAt: nuevosRegistros[0].createdAt,
      updatedAt: nuevosRegistros[0].updatedAt,
      persona: {
        id: nuevosRegistros[0]['persona.id'],
        nombreCompleto: nuevosRegistros[0]['persona.nombreCompleto'],
        documento: nuevosRegistros[0]['persona.documento'],
        tipo: nuevosRegistros[0]['persona.tipo']
      }
    } : null;

    res.status(201).json(nuevaPersonaIPS);
  } catch (error) {
    console.error('Error al agregar persona a IPS:', error);
    res.status(500).json({
      message: 'Error interno del servidor al agregar la persona a IPS'
    });
  }
};

/**
 * Actualizar el estado de una persona en IPS
 */
export const actualizarEstadoIPS = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado)) {
    return res.status(400).json({
      message: 'El estado debe ser ACTIVO o INACTIVO'
    });
  }

  try {
    // Actualizar el estado usando SQL directo
    await prisma.$executeRaw`
      UPDATE "PersonaIPS" 
      SET estado = ${estado}, "updatedAt" = NOW()
      WHERE id = ${parseInt(id)}
    `;

    // Obtener el registro actualizado
    const registrosActualizados = await prisma.$queryRaw`
      SELECT 
        p_ips.id, 
        p_ips."personaId", 
        p_ips."fechaInicio", 
        p_ips.estado, 
        p_ips."createdAt", 
        p_ips."updatedAt",
        p.id as "persona.id", 
        p."nombreCompleto" as "persona.nombreCompleto", 
        p.documento as "persona.documento", 
        p.tipo as "persona.tipo"
      FROM "PersonaIPS" p_ips
      JOIN "Persona" p ON p.id = p_ips."personaId"
      WHERE p_ips.id = ${parseInt(id)}
    `;

    // Formatear el resultado
    const personaIPS = Array.isArray(registrosActualizados) && registrosActualizados.length > 0 ? {
      id: registrosActualizados[0].id,
      personaId: registrosActualizados[0].personaId,
      fechaInicio: registrosActualizados[0].fechaInicio,
      estado: registrosActualizados[0].estado,
      createdAt: registrosActualizados[0].createdAt,
      updatedAt: registrosActualizados[0].updatedAt,
      persona: {
        id: registrosActualizados[0]['persona.id'],
        nombreCompleto: registrosActualizados[0]['persona.nombreCompleto'],
        documento: registrosActualizados[0]['persona.documento'],
        tipo: registrosActualizados[0]['persona.tipo']
      }
    } : null;

    if (!personaIPS) {
      return res.status(404).json({
        message: 'No se encontró el registro de IPS'
      });
    }

    res.status(200).json(personaIPS);
  } catch (error) {
    console.error('Error al actualizar estado de IPS:', error);
    res.status(500).json({
      message: 'Error interno del servidor al actualizar el estado'
    });
  }
};

/**
 * Eliminar una persona de IPS
 */
export const eliminarPersonaIPS = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Eliminar usando SQL directo
    await prisma.$executeRaw`
      DELETE FROM "PersonaIPS" WHERE id = ${parseInt(id)}
    `;

    res.status(200).json({
      message: 'Persona eliminada de IPS exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar persona de IPS:', error);
    res.status(500).json({
      message: 'Error interno del servidor al eliminar la persona de IPS'
    });
  }
}; 