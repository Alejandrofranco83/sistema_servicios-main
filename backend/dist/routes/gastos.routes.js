"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gastos_controller_1 = require("../controllers/gastos.controller");
const auth_1 = __importDefault(require("../middleware/auth"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// Ruta para visualizar comprobantes sin requerir autenticación
router.get('/gastos/comprobante/:nombreArchivo', (req, res) => {
    try {
        const { nombreArchivo } = req.params;
        if (!nombreArchivo) {
            return res.status(400).json({ error: 'El nombre del archivo es requerido' });
        }
        console.log(`[DEBUG] Solicitando comprobante: ${nombreArchivo}`);
        // Construir varias posibles rutas donde podría estar el archivo
        const rutasComprobante = [
            path_1.default.join(__dirname, '../../uploads/comprobantes', nombreArchivo),
            path_1.default.join(process.cwd(), 'uploads/comprobantes', nombreArchivo),
            path_1.default.join(process.cwd(), '../uploads/comprobantes', nombreArchivo),
            path_1.default.join(__dirname, '../../../uploads/comprobantes', nombreArchivo),
            // Ruta absoluta mencionada por el usuario
            path_1.default.join('C:/Users/User/Documents/sistema servicios/backend/uploads/comprobantes', nombreArchivo)
        ];
        console.log('[DEBUG] Buscando archivo en las siguientes rutas:');
        rutasComprobante.forEach((ruta, i) => {
            console.log(`[${i}] ${ruta} - Existe: ${fs_1.default.existsSync(ruta)}`);
        });
        // Buscar el archivo en las posibles rutas
        let rutaArchivo = '';
        for (const ruta of rutasComprobante) {
            if (fs_1.default.existsSync(ruta)) {
                rutaArchivo = ruta;
                console.log(`[DEBUG] ¡Archivo encontrado en: ${rutaArchivo}!`);
                break;
            }
        }
        if (!rutaArchivo) {
            console.error(`[ERROR] Comprobante no encontrado: ${nombreArchivo}`);
            console.error('[ERROR] Rutas probadas:', rutasComprobante);
            return res.status(404).json({ error: 'Comprobante no encontrado' });
        }
        // Determinar el tipo de archivo
        const ext = path_1.default.extname(rutaArchivo).toLowerCase();
        let contentType = 'application/octet-stream'; // Tipo por defecto
        if (ext === '.pdf') {
            contentType = 'application/pdf';
        }
        else if (ext === '.png') {
            contentType = 'image/png';
        }
        else if (ext === '.jpg' || ext === '.jpeg') {
            contentType = 'image/jpeg';
        }
        // Configurar cabeceras para visualización inline
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
        // Enviar el archivo
        return fs_1.default.createReadStream(rutaArchivo).pipe(res);
    }
    catch (error) {
        console.error('[ERROR] Error al obtener comprobante:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Aplicar middleware de autenticación a todas las rutas excepto la de comprobantes
router.use(auth_1.default);
// Rutas para gastos
router.get('/gastos', gastos_controller_1.getGastos);
router.get('/gastos/:id', gastos_controller_1.getGastoById);
router.post('/gastos', gastos_controller_1.upload.single('comprobante'), gastos_controller_1.createGasto);
router.put('/gastos/:id', gastos_controller_1.upload.single('comprobante'), gastos_controller_1.updateGasto);
router.delete('/gastos/:id', gastos_controller_1.deleteGasto);
// Ruta para obtener sucursales (para el selector)
router.get('/sucursales', gastos_controller_1.getSucursales);
exports.default = router;
//# sourceMappingURL=gastos.routes.js.map