import express from 'express';
import { PersonaController } from '../controllers/persona.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';

const router = express.Router();

// --- Aplicar isAuthenticated a todas las rutas --- 
router.use(isAuthenticated);

// Rutas protegidas que requieren autenticación y permisos específicos
// El módulo es 'Recursos Humanos' y las acciones son 'Ver', 'Crear', 'Editar', 'Eliminar'

// Buscar personas - Requiere permiso 'Ver'
router.get('/search', 
  hasPermission('Recursos Humanos', 'Ver'),
  PersonaController.searchPersonas
);

// Nueva ruta para buscar personas por término (utilizada por el componente IPS)
router.get('/buscar-personas', 
  (req, res) => {
    try {
      const termino = req.query.termino as string;
      
      if (!termino || termino.trim().length < 3) {
        return res.json([]);
      }
      
      // Buscar en la base de datos
      const prisma = require('@prisma/client').PrismaClient;
      const prismaClient = new prisma();
      
      prismaClient.persona.findMany({
        where: {
          OR: [
            { nombreCompleto: { contains: termino, mode: 'insensitive' } },
            { documento: { contains: termino, mode: 'insensitive' } }
          ]
        },
        orderBy: {
          nombreCompleto: 'asc'
        }
      })
      .then((personas: any) => {
        return res.json(personas);
      })
      .catch((error: any) => {
        console.error('Error al buscar personas por término:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
      })
      .finally(() => {
        prismaClient.$disconnect();
      });
    } catch (error) {
      console.error('Error en la búsqueda de personas:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Obtener funcionarios - Requiere permiso 'Ver'
router.get('/funcionarios',
  hasPermission('Recursos Humanos', 'Ver'),
  PersonaController.getFuncionarios
);

// Obtener todas las personas - Requiere permiso 'Ver'
router.get('/', 
  hasPermission('Recursos Humanos', 'Ver'),
  PersonaController.getAllPersonas
);

// Obtener una persona por ID - Requiere permiso 'Ver'
router.get('/:id', 
  hasPermission('Recursos Humanos', 'Ver'),
  PersonaController.getPersonaById
);

// Crear una nueva persona - Requiere permiso 'Crear'
router.post('/', 
  hasPermission('Recursos Humanos', 'Crear'),
  PersonaController.createPersona
);

// Actualizar una persona - Requiere permiso 'Editar'
router.put('/:id', 
  hasPermission('Recursos Humanos', 'Editar'),
  PersonaController.updatePersona
);

// Eliminar una persona - Requiere permiso 'Eliminar'
router.delete('/:id', 
  hasPermission('Recursos Humanos', 'Eliminar'),
  PersonaController.deletePersona
);

export default router; 