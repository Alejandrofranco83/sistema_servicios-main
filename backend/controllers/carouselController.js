const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las diapositivas del carrusel
exports.getAllSlides = async (req, res) => {
  try {
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

// Obtener una diapositiva específica por ID
exports.getSlideById = async (req, res) => {
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

// Crear una nueva diapositiva
exports.createSlide = async (req, res) => {
  try {
    const { title, content, bgColor, imageUrl, orden, activo } = req.body;
    
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
        imageUrl,
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

// Actualizar una diapositiva existente
exports.updateSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, bgColor, imageUrl, orden, activo } = req.body;
    
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

// Eliminar una diapositiva
exports.deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;
    
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

// Cambiar el orden de una diapositiva
exports.reorderSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' o 'down'
    
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
    
    const currentIndex = allSlides.findIndex(slide => slide.id === currentSlide.id);
    
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

// Obtener solo las diapositivas activas para mostrar en el frontend
exports.getActiveSlides = async (req, res) => {
  try {
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