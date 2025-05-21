const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener la información del panel
exports.getInfoPanel = async (req, res) => {
  try {
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

// Actualizar la información del panel
exports.updateInfoPanel = async (req, res) => {
  try {
    const { title, content, notaImportante } = req.body;
    
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