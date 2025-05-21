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
exports.updateInfoPanel = exports.getInfoPanel = exports.uploadImage = exports.reorderSlide = exports.deleteSlide = exports.updateSlide = exports.createSlide = exports.getSlideById = exports.getActiveSlides = exports.getAllSlides = exports.upload = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const prisma = new client_1.PrismaClient();
// Configuración para subir imágenes
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/carousel');
        // Crear directorio si no existe
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'slide-' + uniqueSuffix + ext);
    }
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});
// Controlador para el carrusel
const getAllSlides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Obteniendo todos los slides del carrusel');
        const slides = yield prisma.carouselSlide.findMany({
            orderBy: {
                orden: 'asc'
            }
        });
        res.status(200).json(slides);
    }
    catch (error) {
        console.error('Error al obtener slides del carrusel:', error);
        res.status(500).json({ error: 'Error al obtener los slides del carrusel' });
    }
});
exports.getAllSlides = getAllSlides;
const getActiveSlides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Obteniendo slides activos del carrusel');
        const slides = yield prisma.carouselSlide.findMany({
            where: {
                activo: true
            },
            orderBy: {
                orden: 'asc'
            }
        });
        res.status(200).json(slides);
    }
    catch (error) {
        console.error('Error al obtener slides activos:', error);
        res.status(500).json({ error: 'Error al obtener los slides activos' });
    }
});
exports.getActiveSlides = getActiveSlides;
const getSlideById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const slide = yield prisma.carouselSlide.findUnique({
            where: {
                id: parseInt(id)
            }
        });
        if (!slide) {
            return res.status(404).json({ error: 'Slide no encontrado' });
        }
        res.status(200).json(slide);
    }
    catch (error) {
        console.error('Error al obtener slide por ID:', error);
        res.status(500).json({ error: 'Error al obtener el slide' });
    }
});
exports.getSlideById = getSlideById;
const createSlide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, bgColor, imageUrl, orden, activo } = req.body;
        console.log('Creando nuevo slide:', req.body);
        // Validar campos requeridos
        if (!title || !content) {
            return res.status(400).json({ error: 'El título y el contenido son obligatorios' });
        }
        // Determinar el orden si no se proporciona
        let slideOrden = orden;
        if (!slideOrden) {
            // Obtener el último orden y agregar 1
            const lastSlide = yield prisma.carouselSlide.findFirst({
                orderBy: {
                    orden: 'desc'
                }
            });
            slideOrden = lastSlide ? lastSlide.orden + 1 : 1;
        }
        const newSlide = yield prisma.carouselSlide.create({
            data: {
                title,
                content,
                bgColor: bgColor || '#f0f0f0',
                imageUrl: imageUrl || '',
                orden: slideOrden,
                activo: activo !== undefined ? activo : true
            }
        });
        res.status(201).json(newSlide);
    }
    catch (error) {
        console.error('Error al crear slide:', error);
        res.status(500).json({ error: 'Error al crear el slide' });
    }
});
exports.createSlide = createSlide;
const updateSlide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, content, bgColor, imageUrl, orden, activo } = req.body;
        console.log(`Actualizando slide ${id}:`, req.body);
        // Verificar si el slide existe
        const existingSlide = yield prisma.carouselSlide.findUnique({
            where: {
                id: parseInt(id)
            }
        });
        if (!existingSlide) {
            return res.status(404).json({ error: 'Slide no encontrado' });
        }
        // Actualizar el slide
        const updatedSlide = yield prisma.carouselSlide.update({
            where: {
                id: parseInt(id)
            },
            data: {
                title: title !== undefined ? title : existingSlide.title,
                content: content !== undefined ? content : existingSlide.content,
                bgColor: bgColor !== undefined ? bgColor : existingSlide.bgColor,
                imageUrl: imageUrl !== undefined ? imageUrl : existingSlide.imageUrl,
                orden: orden !== undefined ? orden : existingSlide.orden,
                activo: activo !== undefined ? activo : existingSlide.activo
            }
        });
        res.status(200).json(updatedSlide);
    }
    catch (error) {
        console.error('Error al actualizar slide:', error);
        res.status(500).json({ error: 'Error al actualizar el slide' });
    }
});
exports.updateSlide = updateSlide;
const deleteSlide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        console.log(`Eliminando slide ${id}`);
        // Verificar si el slide existe
        const existingSlide = yield prisma.carouselSlide.findUnique({
            where: {
                id: parseInt(id)
            }
        });
        if (!existingSlide) {
            return res.status(404).json({ error: 'Slide no encontrado' });
        }
        // Eliminar el slide
        yield prisma.carouselSlide.delete({
            where: {
                id: parseInt(id)
            }
        });
        // Reordenar los slides restantes
        const remainingSlides = yield prisma.carouselSlide.findMany({
            orderBy: {
                orden: 'asc'
            }
        });
        // Actualizar órdenes
        for (let i = 0; i < remainingSlides.length; i++) {
            yield prisma.carouselSlide.update({
                where: {
                    id: remainingSlides[i].id
                },
                data: {
                    orden: i + 1
                }
            });
        }
        res.status(200).json({ message: 'Slide eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar slide:', error);
        res.status(500).json({ error: 'Error al eliminar el slide' });
    }
});
exports.deleteSlide = deleteSlide;
const reorderSlide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { direction } = req.body; // 'up' o 'down'
        console.log(`Reordenando slide ${id} dirección: ${direction}`);
        if (!direction || (direction !== 'up' && direction !== 'down')) {
            return res.status(400).json({ error: 'La dirección debe ser "up" o "down"' });
        }
        // Obtener el slide actual
        const currentSlide = yield prisma.carouselSlide.findUnique({
            where: {
                id: parseInt(id)
            }
        });
        if (!currentSlide) {
            return res.status(404).json({ error: 'Slide no encontrado' });
        }
        // Obtener todos los slides ordenados
        const allSlides = yield prisma.carouselSlide.findMany({
            orderBy: {
                orden: 'asc'
            }
        });
        const currentIndex = allSlides.findIndex(slide => slide.id === parseInt(id));
        // Verificar si puede moverse en la dirección solicitada
        if (direction === 'up' && currentIndex === 0) {
            return res.status(400).json({ error: 'El slide ya está en la primera posición' });
        }
        if (direction === 'down' && currentIndex === allSlides.length - 1) {
            return res.status(400).json({ error: 'El slide ya está en la última posición' });
        }
        // Calcular nueva posición
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const targetSlide = allSlides[targetIndex];
        // Intercambiar órdenes
        yield prisma.$transaction([
            prisma.carouselSlide.update({
                where: { id: currentSlide.id },
                data: { orden: targetSlide.orden }
            }),
            prisma.carouselSlide.update({
                where: { id: targetSlide.id },
                data: { orden: currentSlide.orden }
            })
        ]);
        res.status(200).json({ message: 'Orden actualizado correctamente' });
    }
    catch (error) {
        console.error('Error al reordenar slide:', error);
        res.status(500).json({ error: 'Error al reordenar el slide' });
    }
});
exports.reorderSlide = reorderSlide;
const uploadImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha enviado ninguna imagen' });
        }
        console.log('Imagen subida:', req.file);
        // Devolver la URL de la imagen
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/uploads/carousel/${req.file.filename}`;
        res.status(200).json({ url: imageUrl });
    }
    catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});
exports.uploadImage = uploadImage;
// Controlador para el panel informativo
const getInfoPanel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Obteniendo información del panel');
        // Buscar el primer panel informativo (debería ser único)
        let infoPanel = yield prisma.infoPanel.findFirst();
        // Si no existe, crear uno por defecto
        if (!infoPanel) {
            infoPanel = yield prisma.infoPanel.create({
                data: {
                    title: 'Información importante',
                    content: 'Bienvenido al sistema de servicios de nuestra empresa. Esta plataforma está diseñada para facilitar todas las operaciones relacionadas con el manejo de efectivo y pagos.',
                    notaImportante: 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'
                }
            });
        }
        res.status(200).json(infoPanel);
    }
    catch (error) {
        console.error('Error al obtener información del panel:', error);
        res.status(500).json({ error: 'Error al obtener la información del panel' });
    }
});
exports.getInfoPanel = getInfoPanel;
const updateInfoPanel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, notaImportante } = req.body;
        console.log('Actualizando panel informativo:', req.body);
        // Validar campos requeridos
        if (!title || !content || !notaImportante) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        // Buscar el panel existente
        let infoPanel = yield prisma.infoPanel.findFirst();
        // Si existe, actualizarlo
        if (infoPanel) {
            infoPanel = yield prisma.infoPanel.update({
                where: {
                    id: infoPanel.id
                },
                data: {
                    title,
                    content,
                    notaImportante
                }
            });
        }
        else {
            // Si no existe, crear uno nuevo
            infoPanel = yield prisma.infoPanel.create({
                data: {
                    title,
                    content,
                    notaImportante
                }
            });
        }
        res.status(200).json(infoPanel);
    }
    catch (error) {
        console.error('Error al actualizar información del panel:', error);
        res.status(500).json({ error: 'Error al actualizar la información del panel' });
    }
});
exports.updateInfoPanel = updateInfoPanel;
//# sourceMappingURL=carousel.controller.js.map