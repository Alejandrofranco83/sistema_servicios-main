import { Router } from 'express';
import { RolController } from '../controllers/rol.controller';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const controller = new RolController();
const prisma = new PrismaClient();

// Obtener todos los roles
router.get('/', controller.getRoles);

// Obtener un rol por su ID
router.get('/:id', controller.getRolById);

// Crear un nuevo rol
router.post('/', controller.createRol);

// Actualizar un rol existente
router.put('/:id', controller.updateRol);

// Eliminar un rol
router.delete('/:id', controller.deleteRol);

// Ruta temporal para asignar permisos al rol OPERADOR
router.post('/operador/asignar-permisos', async (req: Request, res: Response) => {
  try {
    console.log('Iniciando asignación de permisos al rol OPERADOR...');
    
    // Buscar el rol OPERADOR
    const rolOperador = await prisma.rol.findFirst({
      where: { nombre: 'OPERADOR' },
      include: { permisos: true }
    });
    
    if (!rolOperador) {
      return res.status(404).json({ error: 'Rol OPERADOR no encontrado' });
    }
    
    console.log('Rol OPERADOR encontrado:', rolOperador.id);
    
    // Permisos requeridos para el rol OPERADOR
    const permisosRequeridos = [
      { modulo: 'Principal', pantalla: 'Dashboard' },
      { modulo: 'Operaciones', pantalla: 'Cajas' }
    ];
    
    // Obtener todos los permisos
    const todosLosPermisos = await prisma.permiso.findMany();
    
    // Encontrar o crear los permisos requeridos
    const permisosIds: number[] = [];
    
    for (const req of permisosRequeridos) {
      let permiso = todosLosPermisos.find(p => 
        p.modulo === req.modulo && p.pantalla === req.pantalla
      );
      
      if (!permiso) {
        console.log(`Creando permiso: ${req.modulo}/${req.pantalla}`);
        permiso = await prisma.permiso.create({
          data: {
            modulo: req.modulo,
            pantalla: req.pantalla,
            descripcion: `Permiso para ${req.pantalla} en ${req.modulo}`
          }
        });
      }
      
      permisosIds.push(permiso.id);
      console.log(`Permiso agregado: ${permiso.modulo}/${permiso.pantalla} (ID: ${permiso.id})`);
    }
    
    // Mantener permisos existentes y agregar los nuevos
    const permisosActuales = rolOperador.permisos.map(p => p.id);
    const todosLosPermisosIds = Array.from(new Set([...permisosActuales, ...permisosIds]));
    
    // Actualizar el rol
    const rolActualizado = await prisma.rol.update({
      where: { id: rolOperador.id },
      data: {
        permisos: {
          set: todosLosPermisosIds.map(id => ({ id }))
        }
      },
      include: { permisos: true }
    });
    
    console.log('Rol OPERADOR actualizado exitosamente');
    console.log('Permisos asignados:', rolActualizado.permisos.map(p => `${p.modulo}/${p.pantalla}`));
    
    res.json({
      message: 'Permisos asignados al rol OPERADOR exitosamente',
      permisos: rolActualizado.permisos
    });
    
  } catch (error) {
    console.error('Error al asignar permisos al rol OPERADOR:', error);
    res.status(500).json({ error: 'Error al asignar permisos' });
  }
});

export default router; 