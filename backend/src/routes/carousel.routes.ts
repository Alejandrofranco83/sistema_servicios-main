import express from 'express';
import * as carouselController from '../controllers/carousel.controller';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Middleware para subir imágenes
const uploadMiddleware = carouselController.upload.single('image');

// Rutas para el carrusel (diapositivas)
router.get('/slides', carouselController.getAllSlides);
router.get('/slides/active', carouselController.getActiveSlides);
router.get('/slides/:id', carouselController.getSlideById);

// Rutas protegidas que requieren autenticación
router.post('/slides', authMiddleware, carouselController.createSlide);
router.put('/slides/:id', authMiddleware, carouselController.updateSlide);
router.delete('/slides/:id', authMiddleware, carouselController.deleteSlide);
router.post('/slides/:id/reorder', authMiddleware, carouselController.reorderSlide);

// Ruta para subir imágenes
router.post('/uploads', authMiddleware, (req, res, next) => {
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
router.put('/info-panel', authMiddleware, carouselController.updateInfoPanel);

export default router; 