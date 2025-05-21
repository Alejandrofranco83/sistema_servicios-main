const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las subcategorías
exports.getSubcategorias = async (req, res) => {
  try {
    const subcategorias = await prisma.subcategoriaGasto.findMany({
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: [
        {
          categoria: {
            nombre: 'asc'
          }
        },
        {
          nombre: 'asc'
        }
      ]
    });
    
    // Formatear para el frontend
    const formattedSubcategorias = subcategorias.map(sub => ({
      id: sub.id,
      nombre: sub.nombre,
      categoriaId: sub.categoriaId,
      categoriaNombre: sub.categoria.nombre,
      activo: sub.activo,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }));
    
    res.json(formattedSubcategorias);
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    res.status(500).json({ error: 'Error al obtener las subcategorías' });
  }
};

// Obtener subcategorías por categoría
exports.getSubcategoriasByCategoria = async (req, res) => {
  const { categoriaId } = req.params;
  
  try {
    const subcategorias = await prisma.subcategoriaGasto.findMany({
      where: {
        categoriaId: Number(categoriaId)
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    res.json(subcategorias);
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    res.status(500).json({ error: 'Error al obtener las subcategorías' });
  }
};

// Obtener una subcategoría por ID
exports.getSubcategoriaById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const subcategoria = await prisma.subcategoriaGasto.findUnique({
      where: { id: Number(id) },
      include: {
        categoria: true
      }
    });
    
    if (!subcategoria) {
      return res.status(404).json({ error: 'Subcategoría no encontrada' });
    }
    
    res.json(subcategoria);
  } catch (error) {
    console.error('Error al obtener subcategoría:', error);
    res.status(500).json({ error: 'Error al obtener la subcategoría' });
  }
};

// Crear una nueva subcategoría
exports.createSubcategoria = async (req, res) => {
  const { nombre, categoriaId, activo = true } = req.body;
  
  if (!nombre || !categoriaId) {
    return res.status(400).json({ error: 'El nombre y la categoría son obligatorios' });
  }
  
  try {
    // Verificar si la categoría existe
    const categoria = await prisma.categoriaGasto.findUnique({
      where: { id: Number(categoriaId) }
    });
    
    if (!categoria) {
      return res.status(404).json({ error: 'La categoría seleccionada no existe' });
    }
    
    // Verificar si ya existe una subcategoría con el mismo nombre en la misma categoría
    const existente = await prisma.subcategoriaGasto.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        categoriaId: Number(categoriaId)
      }
    });
    
    if (existente) {
      return res.status(400).json({ error: 'Ya existe una subcategoría con este nombre en la misma categoría' });
    }
    
    const nuevaSubcategoria = await prisma.subcategoriaGasto.create({
      data: {
        nombre,
        categoriaId: Number(categoriaId),
        activo
      }
    });
    
    res.status(201).json(nuevaSubcategoria);
  } catch (error) {
    console.error('Error al crear subcategoría:', error);
    res.status(500).json({ error: 'Error al crear la subcategoría' });
  }
};

// Actualizar una subcategoría
exports.updateSubcategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, categoriaId, activo } = req.body;
  
  if (!nombre || !categoriaId) {
    return res.status(400).json({ error: 'El nombre y la categoría son obligatorios' });
  }
  
  try {
    // Verificar si la subcategoría existe
    const subcategoria = await prisma.subcategoriaGasto.findUnique({
      where: { id: Number(id) }
    });
    
    if (!subcategoria) {
      return res.status(404).json({ error: 'Subcategoría no encontrada' });
    }
    
    // Verificar si la categoría existe
    const categoria = await prisma.categoriaGasto.findUnique({
      where: { id: Number(categoriaId) }
    });
    
    if (!categoria) {
      return res.status(404).json({ error: 'La categoría seleccionada no existe' });
    }
    
    // Verificar si ya existe otra subcategoría con el mismo nombre en la misma categoría
    const existente = await prisma.subcategoriaGasto.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        categoriaId: Number(categoriaId),
        id: { not: Number(id) }
      }
    });
    
    if (existente) {
      return res.status(400).json({ error: 'Ya existe otra subcategoría con este nombre en la misma categoría' });
    }
    
    const subcategoriaActualizada = await prisma.subcategoriaGasto.update({
      where: { id: Number(id) },
      data: {
        nombre,
        categoriaId: Number(categoriaId),
        activo
      }
    });
    
    res.json(subcategoriaActualizada);
  } catch (error) {
    console.error('Error al actualizar subcategoría:', error);
    res.status(500).json({ error: 'Error al actualizar la subcategoría' });
  }
};

// Eliminar una subcategoría
exports.deleteSubcategoria = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar si la subcategoría existe
    const subcategoria = await prisma.subcategoriaGasto.findUnique({
      where: { id: Number(id) }
    });
    
    if (!subcategoria) {
      return res.status(404).json({ error: 'Subcategoría no encontrada' });
    }
    
    // Eliminar la subcategoría
    await prisma.subcategoriaGasto.delete({
      where: { id: Number(id) }
    });
    
    res.json({ message: 'Subcategoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar subcategoría:', error);
    res.status(500).json({ error: 'Error al eliminar la subcategoría' });
  }
}; 