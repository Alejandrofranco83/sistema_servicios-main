"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const carouselController = __importStar(require("../controllers/carousel.controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// Middleware para subir imágenes
const uploadMiddleware = carouselController.upload.single('image');
// Rutas para el carrusel (diapositivas)
router.get('/slides', carouselController.getAllSlides);
router.get('/slides/active', carouselController.getActiveSlides);
router.get('/slides/:id', carouselController.getSlideById);
// Rutas protegidas que requieren autenticación
router.post('/slides', auth_1.default, carouselController.createSlide);
router.put('/slides/:id', auth_1.default, carouselController.updateSlide);
router.delete('/slides/:id', auth_1.default, carouselController.deleteSlide);
router.post('/slides/:id/reorder', auth_1.default, carouselController.reorderSlide);
// Ruta para subir imágenes
router.post('/uploads', auth_1.default, (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error('Error al subir la imagen:', err);
            return res.status(400).json({
                error: err.message || 'Error al subir la imagen'
            });
        }
        next();
    });
}, carouselController.uploadImage);
// Rutas para el panel informativo
router.get('/info-panel', carouselController.getInfoPanel);
router.put('/info-panel', auth_1.default, carouselController.updateInfoPanel);
exports.default = router;
//# sourceMappingURL=carousel.routes.js.map