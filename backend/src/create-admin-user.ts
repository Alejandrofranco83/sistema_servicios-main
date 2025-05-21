import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando creación de usuario administrador...');

    // 1. Verificar si ya existe un rol de Administrador
    let adminRol = await prisma.rol.findFirst({
      where: {
        nombre: 'ADMINISTRADOR',
      },
    });

    // Si no existe el rol, crearlo
    if (!adminRol) {
      console.log('Creando rol de Administrador...');
      adminRol = await prisma.rol.create({
        data: {
          nombre: 'ADMINISTRADOR',
          descripcion: 'Rol con acceso completo al sistema',
        },
      });

      // Crear permisos básicos para el administrador
      const modulos = [
        'PRINCIPAL', 'CAJA_MAYOR', 'SALDOS_MONETARIOS', 'OPERACIONES',
        'PDV', 'RECURSOS_HUMANOS', 'CONFIGURACION'
      ];

      const pantallas = [
        'VER', 'BALANCE', 'USUARIOS', 'ROLES', 'COTIZACIONES',
        'SUCURSALES', 'MALETINES', 'CAJAS', 'CONTROL_CAJAS', 'PERSONAS'
      ];

      // Crear permisos y asociarlos al rol
      for (const modulo of modulos) {
        for (const pantalla of pantallas) {
          const permiso = await prisma.permiso.create({
            data: {
              modulo,
              pantalla,
              descripcion: `Permiso para ${modulo} - ${pantalla}`,
              roles: {
                connect: {
                  id: adminRol.id,
                },
              },
            },
          });
          console.log(`Permiso creado: ${modulo} - ${pantalla}`);
        }
      }
    }

    // 2. Verificar si ya existe la persona administradora
    const existingPersona = await prisma.persona.findFirst({
      where: {
        documento: '0000000',
      },
    });

    // 3. Crear la persona si no existe
    let adminPersona;
    if (!existingPersona) {
      console.log('Creando persona para el administrador...');
      adminPersona = await prisma.persona.create({
        data: {
          nombreCompleto: 'ADMINISTRADOR DEL SISTEMA',
          documento: '0000000',
          tipo: 'Funcionario',
          telefono: '0000000',
          direccion: 'Administración',
        },
      });
    } else {
      adminPersona = existingPersona;
      console.log('La persona administradora ya existe.');
    }

    // 4. Verificar si ya existe el usuario administrador
    const existingUser = await prisma.usuario.findFirst({
      where: {
        username: 'ADMIN',
      },
    });

    // 5. Crear el usuario si no existe
    if (!existingUser) {
      console.log('Creando usuario administrador...');
      const adminUser = await prisma.usuario.create({
        data: {
          nombre: 'ADMINISTRADOR',
          username: 'ADMIN',
          password: '123', // Password por defecto
          rol: {
            connect: {
              id: adminRol.id
            }
          },
          persona: {
            connect: {
              id: adminPersona.id
            }
          }
        },
      });
      console.log('Usuario administrador creado correctamente:');
      console.log(`  Username: ${adminUser.username}`);
      console.log(`  Password: 123`);
    } else {
      console.log('El usuario administrador ya existe.');
      console.log(`  Username: ${existingUser.username}`);
      console.log(`  Password: 123 (por defecto)`);
    }

    console.log('Proceso completado exitosamente.');
  } catch (error) {
    console.error('Error durante la creación del usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 