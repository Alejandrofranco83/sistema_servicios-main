const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando tabla PersonaIPS...');
    
    // Verificar si la tabla existe intentando hacer una consulta
    try {
      const result = await prisma.$queryRaw`
        SELECT * FROM "PersonaIPS" LIMIT 1
      `;
      console.log('La tabla PersonaIPS existe en la base de datos');
      console.log('Ejemplo de registro:', result);
    } catch (error) {
      console.error('Error al consultar la tabla PersonaIPS:', error);
      console.log('La tabla probablemente no existe o tiene un nombre diferente');
      
      // Verificar esquema de la base de datos
      const tablas = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      console.log('Tablas disponibles en la base de datos:');
      tablas.forEach(tabla => {
        console.log(` - ${tabla.table_name}`);
      });
    }
    
    // Verificar si hay personas que se puedan registrar en IPS
    const personasDisponibles = await prisma.persona.findMany({
      where: {
        OR: [
          { tipo: 'Funcionario' },
          { tipo: 'Vip' },
          { tipo: 'funcionario' },
          { tipo: 'vip' }
        ]
      },
      take: 5
    });
    
    console.log(`\nPersonas disponibles para IPS: ${personasDisponibles.length}`);
    if (personasDisponibles.length > 0) {
      personasDisponibles.forEach(p => {
        console.log(` - ID: ${p.id}, Nombre: ${p.nombreCompleto}, Tipo: ${p.tipo}`);
      });
    } else {
      console.log('No hay personas de tipo Funcionario o VIP en la base de datos');
    }
    
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 