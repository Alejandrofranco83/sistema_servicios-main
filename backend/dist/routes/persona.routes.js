"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const persona_controller_1 = require("../controllers/persona.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = express_1.default.Router();
// --- Aplicar isAuthenticated a todas las rutas --- 
router.use(auth_middleware_1.isAuthenticated);
// Rutas protegidas que requieren autenticación y permisos específicos
// El módulo es 'Recursos Humanos' y las acciones son 'Ver', 'Crear', 'Editar', 'Eliminar'
// Buscar personas - Requiere permiso 'Ver'
router.get('/search', (0, permission_middleware_1.hasPermission)('Recursos Humanos', 'Ver'), persona_controller_1.PersonaController.searchPersonas);
// Nueva ruta para buscar personas por término (utilizada por el componente IPS)
router.get('/buscar-personas', (req, res) => {
    try {
        const termino = req.query.termino;
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
            .then((personas) => {
            return res.json(personas);
        })
            .catch((error) => {
            console.error('Error al buscar personas por término:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        })
            .finally(() => {
            prismaClient.$disconnect();
        });
    }
    catch (error) {
        console.error('Error en la búsqueda de personas:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Obtener funcionarios - Requiere permiso 'Ver'
router.get('/funcionarios', (0, permission_middleware_1.hasPermission)('Recursos Humanos', 'Ver'), persona_controller_1.PersonaController.getFuncionarios);
// Obtener todas las personas - Requiere permiso 'Ver'
router.get('/', (0, permission_middleware_1.hasPermission)('Recursos Humanos', 'Ver'), persona_controller_1.PersonaController.getAllPersonas);
// Obtener una persona por ID - Requiere permiso 'Ver'
router.get('/:id', (0, permission_middleware_1.hasPermission)('Recursos Humanos', 'Ver'), persona_controller_1.PersonaController.getPersonaById);
// Crear una nueva persona - Requiere permiso 'Crear'
router.post('/', (0, permission_middleware_1.hasPermission)('Recursos Humanos', 'Crear'), persona_controller_1.PersonaController.createPersona);
// Actualizar una persona - Requiere permiso 'Editar'
router.put('/:id', (0, permission_middleware_1.hasPermission)('Recursos Humanos', 'Editar'), persona_controller_1.PersonaController.updatePersona);
// Eliminar una persona - Requiere permiso 'Eliminar'
router.delete('/:id', (0, permission_middleware_1.hasPermission)('Recursos Humanos', 'Eliminar'), persona_controller_1.PersonaController.deletePersona);
exports.default = router;
//# sourceMappingURL=persona.routes.js.map