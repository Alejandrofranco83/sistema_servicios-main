import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PersonaInput {
  nombreCompleto: string;
  documento: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo: 'Cliente' | 'Funcionario' | 'Conveniado' | 'Vip';
  fechaNacimiento?: Date;
}

export const PersonaModel = {
  findAll: async () => {
    return prisma.persona.findMany();
  },

  findById: async (id: number) => {
    return prisma.persona.findUnique({
      where: { id },
    });
  },

  findByTipo: async (tipo: string) => {
    return prisma.persona.findMany({
      where: { tipo },
      orderBy: {
        nombreCompleto: 'asc'
      }
    });
  },

  create: async (data: PersonaInput) => {
    return prisma.persona.create({
      data,
    });
  },

  update: async (id: number, data: Partial<PersonaInput>) => {
    return prisma.persona.update({
      where: { id },
      data,
    });
  },

  delete: async (id: number) => {
    return prisma.persona.delete({
      where: { id },
    });
  },
  
  search: async (query: string) => {
    return prisma.persona.findMany({
      where: {
        OR: [
          { nombreCompleto: { contains: query, mode: 'insensitive' } },
          { documento: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: {
        nombreCompleto: 'asc'
      }
    });
  }
}; 