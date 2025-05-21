import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SueldoMinimoInput {
  valor: number;
  usuarioId: number;
}

export const SueldoMinimoModel = {
  findAll: async () => {
    return prisma.sueldoMinimo.findMany({
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
    return prisma.sueldoMinimo.findUnique({
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
    return prisma.sueldoMinimo.findFirst({
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

  create: async (data: SueldoMinimoInput) => {
    // Primero desactivamos todos los sueldos mínimos vigentes
    await prisma.sueldoMinimo.updateMany({
      where: { vigente: true },
      data: { vigente: false }
    });

    // Luego creamos el nuevo sueldo mínimo
    return prisma.sueldoMinimo.create({
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

  update: async (id: number, data: Partial<SueldoMinimoInput>) => {
    // Si se está actualizando el valor, desactivamos los demás
    if (data.valor) {
      await prisma.sueldoMinimo.updateMany({
        where: { vigente: true },
        data: { vigente: false }
      });
    }

    return prisma.sueldoMinimo.update({
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
    // Verificar si el sueldo mínimo a eliminar es el vigente
    const sueldoMinimo = await prisma.sueldoMinimo.findUnique({
      where: { id }
    });

    if (sueldoMinimo?.vigente) {
      throw new Error('No se puede eliminar el sueldo mínimo vigente');
    }

    return prisma.sueldoMinimo.delete({
      where: { id }
    });
  }
}; 