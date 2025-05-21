import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Constantes Configurables para Farmacia Franco ---
const FARMACIA_FRANCO_PERSONA_ID = 1; // ID Fijo elegido
const FARMACIA_FRANCO_NOMBRE = "FARMACIA FRANCO";
const FARMACIA_FRANCO_DOC = "FARMACIA_FRANCO_ID_01"; // Debe ser único
const FARMACIA_FRANCO_TIPO = "INTERNO";
// --- ---

async function main() {
  // Crear permisos por módulo
  const permisos = [
    // Módulo Principal
    { modulo: 'Principal', pantalla: 'Dashboard', descripcion: 'Acceso al dashboard principal' },
    
    // Módulo Clientes
    { modulo: 'Clientes', pantalla: 'Ver Clientes', descripcion: 'Ver listado de clientes' },
    { modulo: 'Clientes', pantalla: 'Crear Cliente', descripcion: 'Crear nuevos clientes' },
    { modulo: 'Clientes', pantalla: 'Editar Cliente', descripcion: 'Modificar clientes existentes' },
    { modulo: 'Clientes', pantalla: 'Eliminar Cliente', descripcion: 'Eliminar clientes' },
    
    // Módulo Inventario
    { modulo: 'Inventario', pantalla: 'Ver Inventario', descripcion: 'Ver listado de productos' },
    { modulo: 'Inventario', pantalla: 'Crear Producto', descripcion: 'Crear nuevos productos' },
    { modulo: 'Inventario', pantalla: 'Editar Producto', descripcion: 'Modificar productos existentes' },
    { modulo: 'Inventario', pantalla: 'Eliminar Producto', descripcion: 'Eliminar productos' },
    
    // Módulo Ventas
    { modulo: 'Ventas', pantalla: 'Ver Ventas', descripcion: 'Ver listado de ventas' },
    { modulo: 'Ventas', pantalla: 'Crear Venta', descripcion: 'Crear nuevas ventas' },
    { modulo: 'Ventas', pantalla: 'Anular Venta', descripcion: 'Anular ventas existentes' },
    
    // Módulo RRHH
    { modulo: 'Recursos Humanos', pantalla: 'Ver Empleados', descripcion: 'Ver listado de empleados' },
    { modulo: 'Recursos Humanos', pantalla: 'Crear Empleado', descripcion: 'Crear nuevos empleados' },
    { modulo: 'Recursos Humanos', pantalla: 'Editar Empleado', descripcion: 'Modificar empleados existentes' },
    { modulo: 'Recursos Humanos', pantalla: 'Eliminar Empleado', descripcion: 'Eliminar empleados' },
    
    // Módulo Configuración - Usuarios
    { modulo: 'Configuración', pantalla: 'Ver Usuarios', descripcion: 'Ver listado de usuarios' },
    { modulo: 'Configuración', pantalla: 'Crear Usuario', descripcion: 'Crear nuevos usuarios' },
    { modulo: 'Configuración', pantalla: 'Editar Usuario', descripcion: 'Modificar usuarios existentes' },
    { modulo: 'Configuración', pantalla: 'Eliminar Usuario', descripcion: 'Eliminar usuarios' },
    { modulo: 'Configuración', pantalla: 'Resetear Contraseña', descripcion: 'Resetear contraseña de usuarios' },
    
    // Módulo Configuración - Roles
    { modulo: 'Configuración', pantalla: 'Ver Roles', descripcion: 'Ver listado de roles' },
    { modulo: 'Configuración', pantalla: 'Crear Rol', descripcion: 'Crear nuevos roles' },
    { modulo: 'Configuración', pantalla: 'Editar Rol', descripcion: 'Modificar roles existentes' },
    { modulo: 'Configuración', pantalla: 'Eliminar Rol', descripcion: 'Eliminar roles' },
  ];
  
  console.log('Creando permisos...');
  for (const permiso of permisos) {
    const existente = await prisma.permiso.findFirst({
      where: {
        modulo: permiso.modulo,
        pantalla: permiso.pantalla
      }
    });
    
    if (!existente) {
      await prisma.permiso.create({
        data: permiso
      });
    }
  }
  
  // Crear roles predefinidos
  const roles = [
    {
      nombre: 'ADMINISTRADOR',
      descripcion: 'Acceso completo al sistema',
      // Todos los permisos
      permisos: { connect: (await prisma.permiso.findMany()).map(p => ({ id: p.id })) }
    },
    {
      nombre: 'OPERADOR',
      descripcion: 'Acceso básico para operaciones diarias',
      // Solo permisos específicos
      permisos: { 
        connect: (await prisma.permiso.findMany({
          where: {
            modulo: {
              in: ['Principal', 'Clientes', 'Ventas']
            },
            NOT: {
              pantalla: {
                endsWith: 'Eliminar'
              }
            }
          }
        })).map(p => ({ id: p.id }))
      }
    }
  ];
  
  console.log('Creando roles...');
  for (const rol of roles) {
    const existente = await prisma.rol.findUnique({
      where: {
        nombre: rol.nombre
      }
    });
    
    if (!existente) {
      await prisma.rol.create({
        data: rol
      });
    }
  }
  
  // --- Asegurar la existencia de Persona "FARMACIA FRANCO" con ID 1 ---
  console.log(`Asegurando existencia de Persona ID ${FARMACIA_FRANCO_PERSONA_ID} ('${FARMACIA_FRANCO_NOMBRE}')...`);
  const farmaciaPersona = await prisma.persona.upsert({
    where: { id: FARMACIA_FRANCO_PERSONA_ID },
    update: {
      // No incluimos nombre aquí para no sobrescribir cambios manuales
    },
    create: {
      id: FARMACIA_FRANCO_PERSONA_ID,
      nombreCompleto: FARMACIA_FRANCO_NOMBRE,
      documento: FARMACIA_FRANCO_DOC, // Asegura unicidad
      tipo: FARMACIA_FRANCO_TIPO,
      telefono: '(No Especificado)',
      direccion: '(No Especificada)',
      email: 'contacto@farmaciafranco.com'
    },
  });
  console.log(`Persona '${farmaciaPersona.nombreCompleto}' (ID: ${farmaciaPersona.id}) asegurada.`);
  // --- Fin sección Farmacia Franco ---

  // Crear usuario Administrador por defecto
  console.log('Creando/Verificando usuario Administrador...');
  const adminRol = await prisma.rol.findUnique({ where: { nombre: 'ADMINISTRADOR' } });

  if (adminRol) {
    // Ahora usaremos la persona FARMACIA FRANCO para el usuario admin
    console.log('Usando persona FARMACIA FRANCO para el usuario admin...');
    
    // Verificar si ya existe el usuario admin
    const adminUser = await prisma.usuario.findUnique({ 
      where: { username: 'admin' } 
    });

    if (!adminUser) {
      await prisma.usuario.create({
        data: {
          username: 'admin',
          password: '123', // Contraseña por defecto
          nombre: 'Admin User',
          rol: {
            connect: {
              id: adminRol.id
            }
          },
          persona: {
            connect: {
              id: farmaciaPersona.id // Conectar con FARMACIA FRANCO
            }
          }
        }
      });
      console.log('Usuario Admin creado y vinculado a FARMACIA FRANCO (usuario: admin, pass: 123).');
    } else {
      console.log('Usuario Admin ya existe.');
    }
  } else {
    console.error('Rol ADMINISTRADOR no encontrado. No se pudo crear el usuario Admin.');
  }

  console.log('Datos de ejemplo creados/verificados correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 