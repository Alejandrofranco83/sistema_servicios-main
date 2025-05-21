const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar si el rol ADMINISTRADOR existe
    const adminRole = await prisma.rol.findUnique({ 
      where: { 
        nombre: 'ADMINISTRADOR' 
      } 
    });
    
    if (!adminRole) {
      console.log('El rol ADMINISTRADOR no existe');
      return;
    }
    
    console.log('Rol encontrado:', adminRole);
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findFirst({
      where: {
        username: 'TEST'
      }
    });
    
    if (existingUser) {
      console.log('El usuario de prueba ya existe:', existingUser);
      return;
    }
    
    // Crear una nueva persona
    const persona = await prisma.persona.create({
      data: {
        nombreCompleto: 'Usuario de Prueba',
        documento: '1234567',
        tipo: 'FISICA',
        telefono: '0981123456'
      }
    });
    
    console.log('Persona creada:', persona);
    
    // Crear el usuario
    const usuario = await prisma.usuario.create({
      data: {
        username: 'TEST',
        password: '123456',
        nombre: 'Usuario de Prueba',
        tipo: 'INTERNO',
        personaId: persona.id,
        rolId: adminRole.id
      }
    });
    
    console.log('Usuario creado exitosamente:');
    console.log('Username:', usuario.username);
    console.log('Password: 123456');
    console.log('Rol: ADMINISTRADOR');
    
  } catch (error) {
    console.error('Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 