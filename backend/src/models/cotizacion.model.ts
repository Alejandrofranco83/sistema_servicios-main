import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CotizacionInput {
  valorDolar: number;
  valorReal: number;
  usuarioId: number;
}

export const CotizacionModel = {
  findAll: async () => {
    return prisma.cotizacion.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });
  },

  findById: async (id: number) => {
    return prisma.cotizacion.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      }
    });
  },

  findVigente: async () => {
    return prisma.cotizacion.findFirst({
      where: { vigente: true },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      }
    });
  },

  create: async (data: CotizacionInput) => {
    // Primero desactivamos todas las cotizaciones vigentes
    await prisma.cotizacion.updateMany({
      where: { vigente: true },
      data: { vigente: false }
    });

    // Luego creamos la nueva cotización
    return prisma.cotizacion.create({
      data,
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      }
    });
  },

  update: async (id: number, data: Partial<CotizacionInput>) => {
    // Si se está marcando como vigente, desactivamos las demás
    if (data.valorDolar || data.valorReal) {
      await prisma.cotizacion.updateMany({
        where: { vigente: true },
        data: { vigente: false }
      });
    }

    return prisma.cotizacion.update({
      where: { id },
      data: {
        ...data,
        vigente: true // Al actualizar, siempre se marca como vigente
      },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true
          }
        }
      }
    });
  },

  delete: async (id: number) => {
    // Verificar si la cotización a eliminar es la vigente
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id }
    });

    if (cotizacion?.vigente) {
      throw new Error('No se puede eliminar la cotización vigente');
    }

    return prisma.cotizacion.delete({
      where: { id }
    });
  }
}; 