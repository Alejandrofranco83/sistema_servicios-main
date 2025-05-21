import express from 'express';
import { SueldoController } from '../controllers/sueldo.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(isAuthenticated);

// Rutas para la gestión de sueldos
router.get('/', SueldoController.getAllSueldos);
router.get('/:id', SueldoController.getSueldoById);
router.get('/persona/:personaId', SueldoController.getSueldosByPersona);
router.get('/:anio/:mes', SueldoController.getSueldosByMesAnio);
router.post('/', SueldoController.createSueldo);
router.post('/guardar', SueldoController.guardarSueldos);
router.put('/:id', SueldoController.updateSueldo);
router.delete('/:id', SueldoController.deleteSueldo);

export default router; 