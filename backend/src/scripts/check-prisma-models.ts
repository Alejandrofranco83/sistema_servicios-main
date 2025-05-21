import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Imprimir todos los modelos disponibles en el cliente de Prisma
console.log('Modelos disponibles:');
console.log(Object.keys(prisma));

// Intentar acceder a personaIPS de diferentes formas
try {
  // @ts-ignore
  console.log('¿Existe prisma.personaIPS?', !!prisma.personaIPS);
} catch (error) {
  console.error('Error accediendo a prisma.personaIPS:', error);
}

try {
  // @ts-ignore
  console.log('¿Existe prisma.PersonaIPS?', !!prisma.PersonaIPS);
} catch (error) {
  console.error('Error accediendo a prisma.PersonaIPS:', error);
}

// Verificar el mapeo real del modelo en Prisma
console.log('Nombres mapeados:');
for (const key of Object.keys(prisma)) {
  if (typeof key === 'string' && !key.startsWith('_') && key !== '$connect' && key !== '$disconnect') {
    console.log(`- ${key}`);
  }
}

// Cerrar la conexión
prisma.$disconnect(); 