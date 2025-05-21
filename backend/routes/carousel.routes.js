const express = require('express');
const router = express.Router();
const carouselController = require('../controllers/carouselController');
const infoPanelController = require('../controllers/infoPanelController');
const { authenticateToken } = require('../middleware/auth');

// Rutas para el carrusel (diapositivas)
router.get('/slides', carouselController.getAllSlides);
router.get('/slides/active', carouselController.getActiveSlides);
router.get('/slides/:id', carouselController.getSlideById);
router.post('/slides', authenticateToken, carouselController.createSlide);
router.put('/slides/:id', authenticateToken, carouselController.updateSlide);
router.delete('/slides/:id', authenticateToken, carouselController.deleteSlide);
router.post('/slides/:id/reorder', authenticateToken, carouselController.reorderSlide);

// Rutas para el panel informativo
router.get('/info-panel', infoPanelController.getInfoPanel);
router.put('/info-panel', authenticateToken, infoPanelController.updateInfoPanel);

module.exports = router; 