"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const aquipago_controller_1 = require("../controllers/aquipago.controller");
const auth_1 = __importDefault(require("../middleware/auth")); // Importación por defecto
console.log('[DEBUG] Cargando configuracion.routes.ts...');
const router = (0, express_1.Router)();
// Configuración de Multer para guardar archivos en disco
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // La misma ruta que definimos en el controlador
        const UPLOADS_DIR = path_1.default.join(__dirname, '../../../uploads/contratos');
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Usar timestamp para evitar sobreescritura, manteniendo extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
// Filtrar para aceptar solo ciertos tipos de archivo si es necesario
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no permitido.'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Limitar tamaño a 10MB, por ejemplo
});
// Aplicar middleware de autenticación a todas las rutas
router.use(auth_1.default);
// Rutas para Aquipago Configuración
console.log('[DEBUG] Configurando rutas de Aquipago...');
// POST /api/configuracion/aquipago - Crear nueva configuración (maneja subida de archivo)
router.post('/aquipago', upload.single('contratoFile'), aquipago_controller_1.createAquipagoConfig);
console.log('[DEBUG] Ruta POST /aquipago registrada');
// GET /api/configuracion/aquipago/actual - Obtener la última configuración
router.get('/aquipago/actual', aquipago_controller_1.getLatestAquipagoConfig);
console.log('[DEBUG] Ruta GET /aquipago/actual registrada');
// GET /api/configuracion/aquipago/historial - Obtener historial de configuraciones
router.get('/aquipago/historial', aquipago_controller_1.getAquipagoConfigHistory);
console.log('[DEBUG] Ruta GET /aquipago/historial registrada');
// GET /api/configuracion/aquipago/:id/contrato - Descargar archivo de contrato
router.get('/aquipago/:id/contrato', aquipago_controller_1.downloadContrato);
console.log('[DEBUG] Ruta GET /aquipago/:id/contrato registrada');
// Importar el controlador de WepaGs
console.log('[DEBUG] Configurando rutas de WepaGs...');
// Integrar las rutas WepaGs pasando explícitamente el middleware de autenticación
router.use('/wepa-gs', require('../../routes/wepa-gs.routes')(auth_1.default));
console.log('[DEBUG] Rutas de WepaGs registradas');
// Integrar las rutas WepaUsd pasando explícitamente el middleware de autenticación
router.use('/wepa-usd', require('../../routes/wepa-usd.routes')(auth_1.default));
console.log('[DEBUG] Rutas de WepaUsd registradas');
console.log('[DEBUG] Exportando router desde configuracion.routes.ts');
exports.default = router;
//# sourceMappingURL=configuracion.routes.js.map