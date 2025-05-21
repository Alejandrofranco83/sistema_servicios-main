import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const prisma = new PrismaClient();

// Configuración para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/carousel');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'slide-' + uniqueSuffix + ext);
  }
});

export const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// Controlador para el carrusel
export const getAllSlides = async (req: Request, res: Response) => {
  try {
    console.log('Obteniendo todos los slides del carrusel');
    
    const slides = await prisma.carouselSlide.findMany({
      orderBy: {
        orden: 'asc'
      }
    });
    
    res.status(200).json(slides);
  } catch (error) {
    console.error('Error al obtener slides del carrusel:', error);
    res.status(500).json({ error: 'Error al obtener los slides del carrusel' });
  }
};

export const getActiveSlides = async (req: Request, res: Response) => {
  try {
    console.log('Obteniendo slides activos del carrusel');
    
    const slides = await prisma.carouselSlide.findMany({
      where: {
        activo: true
      },
      orderBy: {
        orden: 'asc'
      }
    });
    
    res.status(200).json(slides);
  } catch (error) {
    console.error('Error al obtener slides activos:', error);
    res.status(500).json({ error: 'Error al obtener los slides activos' });
  }
};

export const getSlideById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const slide = await prisma.carouselSlide.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    
    if (!slide) {
      return res.status(404).json({ error: 'Slide no encontrado' });
    }
    
    res.status(200).json(slide);
  } catch (error) {
    console.error('Error al obtener slide por ID:', error);
    res.status(500).json({ error: 'Error al obtener el slide' });
  }
};

export const createSlide = async (req: Request, res: Response) => {
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
      const lastSlide = await prisma.carouselSlide.findFirst({
        orderBy: {
          orden: 'desc'
        }
      });
      slideOrden = lastSlide ? lastSlide.orden + 1 : 1;
    }
    
    const newSlide = await prisma.carouselSlide.create({
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
  } catch (error) {
    console.error('Error al crear slide:', error);
    res.status(500).json({ error: 'Error al crear el slide' });
  }
};

export const updateSlide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, bgColor, imageUrl, orden, activo } = req.body;
    
    console.log(`Actualizando slide ${id}:`, req.body);
    
    // Verificar si el slide existe
    const existingSlide = await prisma.carouselSlide.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    
    if (!existingSlide) {
      return res.status(404).json({ error: 'Slide no encontrado' });
    }
    
    // Actualizar el slide
    const updatedSlide = await prisma.carouselSlide.update({
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
  } catch (error) {
    console.error('Error al actualizar slide:', error);
    res.status(500).json({ error: 'Error al actualizar el slide' });
  }
};

export const deleteSlide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`Eliminando slide ${id}`);
    
    // Verificar si el slide existe
    const existingSlide = await prisma.carouselSlide.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    
    if (!existingSlide) {
      return res.status(404).json({ error: 'Slide no encontrado' });
    }
    
    // Eliminar el slide
    await prisma.carouselSlide.delete({
      where: {
        id: parseInt(id)
      }
    });
    
    // Reordenar los slides restantes
    const remainingSlides = await prisma.carouselSlide.findMany({
      orderBy: {
        orden: 'asc'
      }
    });
    
    // Actualizar órdenes
    for (let i = 0; i < remainingSlides.length; i++) {
      await prisma.carouselSlide.update({
        where: {
          id: remainingSlides[i].id
        },
        data: {
          orden: i + 1
        }
      });
    }
    
    res.status(200).json({ message: 'Slide eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar slide:', error);
    res.status(500).json({ error: 'Error al eliminar el slide' });
  }
};

export const reorderSlide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' o 'down'
    
    console.log(`Reordenando slide ${id} dirección: ${direction}`);
    
    if (!direction || (direction !== 'up' && direction !== 'down')) {
      return res.status(400).json({ error: 'La dirección debe ser "up" o "down"' });
    }
    
    // Obtener el slide actual
    const currentSlide = await prisma.carouselSlide.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    
    if (!currentSlide) {
      return res.status(404).json({ error: 'Slide no encontrado' });
    }
    
    // Obtener todos los slides ordenados
    const allSlides = await prisma.carouselSlide.findMany({
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
    await prisma.$transaction([
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
  } catch (error) {
    console.error('Error al reordenar slide:', error);
    res.status(500).json({ error: 'Error al reordenar el slide' });
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha enviado ninguna imagen' });
    }
    
    console.log('Imagen subida:', req.file);
    
    // Devolver la URL de la imagen
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/carousel/${req.file.filename}`;
    
    res.status(200).json({ url: imageUrl });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
};

// Controlador para el panel informativo
export const getInfoPanel = async (req: Request, res: Response) => {
  try {
    console.log('Obteniendo información del panel');
    
    // Buscar el primer panel informativo (debería ser único)
    let infoPanel = await prisma.infoPanel.findFirst();
    
    // Si no existe, crear uno por defecto
    if (!infoPanel) {
      infoPanel = await prisma.infoPanel.create({
        data: {
          title: 'Información importante',
          content: 'Bienvenido al sistema de servicios de nuestra empresa. Esta plataforma está diseñada para facilitar todas las operaciones relacionadas con el manejo de efectivo y pagos.',
          notaImportante: 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'
        }
      });
    }
    
    res.status(200).json(infoPanel);
  } catch (error) {
    console.error('Error al obtener información del panel:', error);
    res.status(500).json({ error: 'Error al obtener la información del panel' });
  }
};

export const updateInfoPanel = async (req: Request, res: Response) => {
  try {
    const { title, content, notaImportante } = req.body;
    
    console.log('Actualizando panel informativo:', req.body);
    
    // Validar campos requeridos
    if (!title || !content || !notaImportante) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    // Buscar el panel existente
    let infoPanel = await prisma.infoPanel.findFirst();
    
    // Si existe, actualizarlo
    if (infoPanel) {
      infoPanel = await prisma.infoPanel.update({
        where: {
          id: infoPanel.id
        },
        data: {
          title,
          content,
          notaImportante
        }
      });
    } else {
      // Si no existe, crear uno nuevo
      infoPanel = await prisma.infoPanel.create({
        data: {
          title,
          content,
          notaImportante
        }
      });
    }
    
    res.status(200).json(infoPanel);
  } catch (error) {
    console.error('Error al actualizar información del panel:', error);
    res.status(500).json({ error: 'Error al actualizar la información del panel' });
  }
}; 