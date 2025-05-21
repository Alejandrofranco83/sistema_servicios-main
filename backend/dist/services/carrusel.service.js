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
const carrusel_model_1 = require("../models/carrusel.model");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class CarruselService {
    // MÉTODOS PARA GESTIONAR LOS SLIDES DEL CARRUSEL
    /**
     * Obtener todos los slides activos ordenados
     */
    getAllSlides() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slides = yield carrusel_model_1.CarruselSlide.findAll({
                    where: {
                        activo: true
                    },
                    order: [['orden', 'ASC']]
                });
                return slides;
            }
            catch (error) {
                console.error('Error al obtener slides:', error);
                throw new Error('Error al obtener los slides del carrusel');
            }
        });
    }
    /**
     * Obtener todos los slides (incluyendo inactivos) para administración
     */
    getAllSlidesAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slides = yield carrusel_model_1.CarruselSlide.findAll({
                    order: [['orden', 'ASC']]
                });
                return slides;
            }
            catch (error) {
                console.error('Error al obtener slides para admin:', error);
                throw new Error('Error al obtener los slides del carrusel');
            }
        });
    }
    /**
     * Obtener un slide por su ID
     */
    getSlideById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slide = yield carrusel_model_1.CarruselSlide.findByPk(id);
                if (!slide) {
                    throw new Error('Slide no encontrado');
                }
                return slide;
            }
            catch (error) {
                console.error(`Error al obtener slide #${id}:`, error);
                throw new Error('Error al obtener el slide del carrusel');
            }
        });
    }
    /**
     * Crear un nuevo slide
     */
    createSlide(slideData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Determinar el último orden para asignar el siguiente
                const lastSlide = yield carrusel_model_1.CarruselSlide.findOne({
                    order: [['orden', 'DESC']]
                });
                const newOrden = lastSlide ? lastSlide.orden + 1 : 1;
                // Crear el nuevo slide
                const newSlide = yield carrusel_model_1.CarruselSlide.create(Object.assign(Object.assign({}, slideData), { orden: newOrden }));
                return newSlide;
            }
            catch (error) {
                console.error('Error al crear slide:', error);
                throw new Error('Error al crear el slide del carrusel');
            }
        });
    }
    /**
     * Actualizar un slide existente
     */
    updateSlide(id, slideData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slide = yield carrusel_model_1.CarruselSlide.findByPk(id);
                if (!slide) {
                    throw new Error('Slide no encontrado');
                }
                yield slide.update(slideData);
                return slide;
            }
            catch (error) {
                console.error(`Error al actualizar slide #${id}:`, error);
                throw new Error('Error al actualizar el slide del carrusel');
            }
        });
    }
    /**
     * Eliminar un slide
     */
    deleteSlide(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slide = yield carrusel_model_1.CarruselSlide.findByPk(id);
                if (!slide) {
                    throw new Error('Slide no encontrado');
                }
                // Si tiene una imagen, eliminarla del sistema de archivos
                if (slide.imageUrl && !slide.imageUrl.startsWith('http')) {
                    const imagePath = path_1.default.join(__dirname, '../../public', slide.imageUrl);
                    if (fs_1.default.existsSync(imagePath)) {
                        fs_1.default.unlinkSync(imagePath);
                    }
                }
                yield slide.destroy();
                // Reordenar los slides restantes
                const remainingSlides = yield carrusel_model_1.CarruselSlide.findAll({
                    order: [['orden', 'ASC']]
                });
                for (let i = 0; i < remainingSlides.length; i++) {
                    yield remainingSlides[i].update({ orden: i + 1 });
                }
                return { message: 'Slide eliminado correctamente' };
            }
            catch (error) {
                console.error(`Error al eliminar slide #${id}:`, error);
                throw new Error('Error al eliminar el slide del carrusel');
            }
        });
    }
    /**
     * Cambiar el orden de un slide (subir o bajar)
     */
    changeSlideOrder(id, direction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slide = yield carrusel_model_1.CarruselSlide.findByPk(id);
                if (!slide) {
                    throw new Error('Slide no encontrado');
                }
                // Encontrar el slide con el que intercambiar posición
                let targetSlide;
                if (direction === 'up' && slide.orden > 1) {
                    targetSlide = yield carrusel_model_1.CarruselSlide.findOne({
                        where: { orden: slide.orden - 1 }
                    });
                }
                else if (direction === 'down') {
                    targetSlide = yield carrusel_model_1.CarruselSlide.findOne({
                        where: { orden: slide.orden + 1 }
                    });
                }
                if (!targetSlide) {
                    throw new Error('No se puede cambiar el orden del slide');
                }
                // Intercambiar órdenes
                const tempOrden = slide.orden;
                yield slide.update({ orden: targetSlide.orden });
                yield targetSlide.update({ orden: tempOrden });
                return { message: 'Orden actualizado correctamente' };
            }
            catch (error) {
                console.error(`Error al cambiar orden del slide #${id}:`, error);
                throw new Error('Error al cambiar el orden del slide');
            }
        });
    }
    /**
     * Subir una imagen para un slide
     */
    uploadImage(file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Crear directorio si no existe
                const uploadDir = path_1.default.join(__dirname, '../../public/uploads/carrusel');
                if (!fs_1.default.existsSync(uploadDir)) {
                    fs_1.default.mkdirSync(uploadDir, { recursive: true });
                }
                // Generar nombre único para la imagen
                const fileName = `${(0, uuid_1.v4)()}-${file.originalname}`;
                const filePath = path_1.default.join(uploadDir, fileName);
                // Escribir archivo
                fs_1.default.writeFileSync(filePath, file.buffer);
                // Devolver la ruta relativa
                return {
                    imageUrl: `/uploads/carrusel/${fileName}`
                };
            }
            catch (error) {
                console.error('Error al subir imagen:', error);
                throw new Error('Error al subir la imagen');
            }
        });
    }
    // MÉTODOS PARA GESTIONAR EL PANEL INFORMATIVO
    /**
     * Obtener la configuración del panel informativo
     */
    getInfoPanel() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Intentar obtener el primer registro
                let infoPanel = yield carrusel_model_1.InfoPanel.findOne();
                // Si no existe, crear uno con valores predeterminados
                if (!infoPanel) {
                    infoPanel = yield carrusel_model_1.InfoPanel.create({
                        title: 'Información importante',
                        content: 'Bienvenido al sistema de servicios de nuestra empresa. Esta plataforma está diseñada para facilitar todas las operaciones relacionadas con el manejo de efectivo y pagos.',
                        notaImportante: 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'
                    });
                }
                return infoPanel;
            }
            catch (error) {
                console.error('Error al obtener panel informativo:', error);
                throw new Error('Error al obtener la información del panel');
            }
        });
    }
    /**
     * Actualizar la configuración del panel informativo
     */
    updateInfoPanel(infoPanelData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Intentar obtener el primer registro
                let infoPanel = yield carrusel_model_1.InfoPanel.findOne();
                // Si no existe, crear uno nuevo
                if (!infoPanel) {
                    infoPanel = yield carrusel_model_1.InfoPanel.create(infoPanelData);
                }
                else {
                    // Actualizar el existente
                    yield infoPanel.update(infoPanelData);
                }
                return infoPanel;
            }
            catch (error) {
                console.error('Error al actualizar panel informativo:', error);
                throw new Error('Error al actualizar la información del panel');
            }
        });
    }
}
exports.default = new CarruselService();
//# sourceMappingURL=carrusel.service.js.map