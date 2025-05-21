"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const carrusel_service_1 = __importDefault(require("../services/carrusel.service"));
const auth_1 = __importDefault(require("../middleware/auth"));
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Rutas públicas (sin autenticación)
// Obtener todos los slides activos para mostrar en el frontend
router.get('/slides', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const slides = yield carrusel_service_1.default.getAllSlides();
        res.json(slides);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Obtener la configuración del panel informativo
router.get('/info-panel', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const infoPanel = yield carrusel_service_1.default.getInfoPanel();
        res.json(infoPanel);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Rutas protegidas (requieren autenticación)
// Obtener todos los slides para administración
router.get('/admin/slides', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const slides = yield carrusel_service_1.default.getAllSlidesAdmin();
        res.json(slides);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Obtener un slide específico
router.get('/admin/slides/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const slide = yield carrusel_service_1.default.getSlideById(parseInt(req.params.id));
        res.json(slide);
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
}));
// Crear un nuevo slide
router.post('/admin/slides', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newSlide = yield carrusel_service_1.default.createSlide(req.body);
        res.status(201).json(newSlide);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Actualizar un slide existente
router.put('/admin/slides/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedSlide = yield carrusel_service_1.default.updateSlide(parseInt(req.params.id), req.body);
        res.json(updatedSlide);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Eliminar un slide
router.delete('/admin/slides/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield carrusel_service_1.default.deleteSlide(parseInt(req.params.id));
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Cambiar el orden de un slide
router.patch('/admin/slides/:id/order', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { direction } = req.body;
        if (!direction || (direction !== 'up' && direction !== 'down')) {
            return res.status(400).json({ error: 'Dirección inválida. Debe ser "up" o "down"' });
        }
        const result = yield carrusel_service_1.default.changeSlideOrder(parseInt(req.params.id), direction);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Subir una imagen para un slide
router.post('/admin/upload-image', auth_1.default, upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
        }
        const result = yield carrusel_service_1.default.uploadImage(req.file);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Actualizar el panel informativo
router.put('/admin/info-panel', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const infoPanel = yield carrusel_service_1.default.updateInfoPanel(req.body);
        res.json(infoPanel);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
exports.default = router;
//# sourceMappingURL=carrusel.routes.js.map