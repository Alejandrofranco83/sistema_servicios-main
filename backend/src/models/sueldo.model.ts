import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SueldoInput {
  personaId: number;
  mes: number;
  anio: number;
  monto: number;
}

export const SueldoModel = {
  findAll: async () => {
    return prisma.sueldo.findMany({
      include: {
        persona: true
      },
      orderBy: {
        anio: 'desc',
        mes: 'desc'
      }
    });
  },

  findById: async (id: number) => {
    return prisma.sueldo.findUnique({
      where: { id },
      include: {
        persona: true
      }
    });
  },

  findByPersona: async (personaId: number) => {
    return prisma.sueldo.findMany({
      where: { personaId },
      orderBy: {
        anio: 'desc',
        mes: 'desc'
      },
      include: {
        persona: true
      }
    });
  },
  
  findByMesAnio: async (mes: number, anio: number) => {
    return prisma.sueldo.findMany({
      where: { 
        mes,
        anio
      },
      include: {
        persona: true
      },
      orderBy: {
        personaId: 'asc'
      }
    });
  },

  create: async (data: SueldoInput) => {
    return prisma.sueldo.create({
      data,
      include: {
        persona: true
      }
    });
  },

  update: async (id: number, data: Partial<SueldoInput>) => {
    return prisma.sueldo.update({
      where: { id },
      data,
      include: {
        persona: true
      }
    });
  },

  // Actualiza o crea un sueldo si no existe
  upsert: async (data: SueldoInput) => {
    const { personaId, mes, anio, monto } = data;
    
    return prisma.sueldo.upsert({
      where: {
        personaId_mes_anio: {
          personaId,
          mes,
          anio
        }
      },
      update: {
        monto
      },
      create: {
        personaId,
        mes,
        anio,
        monto
      },
      include: {
        persona: true
      }
    });
  },

  // Crea o actualiza múltiples sueldos en una transacción
  guardarMultiples: async (sueldos: SueldoInput[]) => {
    return prisma.$transaction(
      sueldos.map(sueldo => {
        const { personaId, mes, anio, monto } = sueldo;
        
        return prisma.sueldo.upsert({
          where: {
            personaId_mes_anio: {
              personaId,
              mes,
              anio
            }
          },
          update: {
            monto
          },
          create: {
            personaId,
            mes,
            anio,
            monto
          }
        });
      })
    );
  },

  delete: async (id: number) => {
    return prisma.sueldo.delete({
      where: { id }
    });
  }
}; 