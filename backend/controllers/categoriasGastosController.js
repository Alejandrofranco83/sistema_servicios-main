const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las categorías
exports.getCategorias = async (req, res) => {
  try {
    const categorias = await prisma.categoriaGasto.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
    
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener las categorías' });
  }
};

// Obtener una categoría por ID
exports.getCategoriaById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const categoria = await prisma.categoriaGasto.findUnique({
      where: { id: Number(id) },
      include: {
        subcategorias: true
      }
    });
    
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json(categoria);
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ error: 'Error al obtener la categoría' });
  }
};

// Crear una nueva categoría
exports.createCategoria = async (req, res) => {
  const { nombre, activo = true } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  
  try {
    // Verificar si ya existe una categoría con el mismo nombre
    const existente = await prisma.categoriaGasto.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } }
    });
    
    if (existente) {
      return res.status(400).json({ error: 'Ya existe una categoría con este nombre' });
    }
    
    const nuevaCategoria = await prisma.categoriaGasto.create({
      data: {
        nombre,
        activo
      }
    });
    
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
};

// Actualizar una categoría
exports.updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, activo } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  
  try {
    // Verificar si la categoría existe
    const categoria = await prisma.categoriaGasto.findUnique({
      where: { id: Number(id) }
    });
    
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    // Verificar si ya existe otra categoría con el mismo nombre
    const existente = await prisma.categoriaGasto.findFirst({
      where: { 
        nombre: { equals: nombre, mode: 'insensitive' },
        id: { not: Number(id) }
      }
    });
    
    if (existente) {
      return res.status(400).json({ error: 'Ya existe otra categoría con este nombre' });
    }
    
    const categoriaActualizada = await prisma.categoriaGasto.update({
      where: { id: Number(id) },
      data: {
        nombre,
        activo
      }
    });
    
    res.json(categoriaActualizada);
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
};

// Eliminar una categoría
exports.deleteCategoria = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar si la categoría existe
    const categoria = await prisma.categoriaGasto.findUnique({
      where: { id: Number(id) }
    });
    
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    // Eliminar la categoría (las subcategorías se eliminan automáticamente por la relación Cascade)
    await prisma.categoriaGasto.delete({
      where: { id: Number(id) }
    });
    
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
}; 