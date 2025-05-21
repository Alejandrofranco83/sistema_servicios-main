/**
 * Devolver un retiro recibido previamente
 * @route POST /api/cajas-mayor/retiros/devolver
 * @access Private
 */
exports.devolverRetiro = async (req, res) => {
  try {
    const { retiroId, observacion, usuarioDevolucionId } = req.body;

    // Validar datos requeridos
    if (!retiroId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere el ID del retiro a devolver' 
      });
    }

    // Buscar el retiro en la base de datos
    const retiro = await Retiro.findOne({ 
      where: { 
        id: retiroId,
        estadoRecepcion: 'RECIBIDO' // Solo se pueden devolver retiros recibidos
      }
    });

    if (!retiro) {
      return res.status(404).json({ 
        success: false, 
        message: 'No se encontró el retiro o no está en estado RECIBIDO' 
      });
    }

    // Obtener fecha actual para el nuevo registro
    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toISOString();
    
    // Generar ID para el nuevo movimiento de egreso
    const nuevoId = `${retiroId}_devuelto_${fechaActual.getTime()}`;
    
    // Iniciar transacción para garantizar que ambas operaciones se completen o ninguna
    const t = await sequelize.transaction();

    try {
      // 1. Cambiar estado del retiro a PENDIENTE
      await Retiro.update({
        estadoRecepcion: 'PENDIENTE',
        fechaDevolucion: fechaFormateada,
        usuarioDevolucionId: usuarioDevolucionId,
        observacionDevolucion: observacion || ''
      }, {
        where: { id: retiroId },
        transaction: t
      });

      // 2. Crear movimiento de egreso en la tabla caja_mayor_movimientos
      await CajaMayorMovimiento.create({
        id: nuevoId,
        fecha: fechaFormateada,
        concepto: `Retiro devuelto - Caja ${retiro.cajaId}`,
        montoPYG: retiro.montoPYG, // Mismo monto pero será egreso
        montoBRL: retiro.montoBRL,
        montoUSD: retiro.montoUSD,
        observacion: observacion || 'Devolución de retiro',
        tipo: 'Retiro Devuelto',
        retiroId: retiroId, // Referencia al retiro original
        esIngreso: false, // Es un egreso
        usuarioId: usuarioDevolucionId
      }, { transaction: t });

      // Confirmar transacción
      await t.commit();

      return res.status(200).json({
        success: true,
        message: 'Retiro devuelto correctamente',
        id: nuevoId
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await t.rollback();
      console.error('Error al procesar la devolución del retiro:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al devolver retiro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la devolución del retiro'
    });
  }
}; 