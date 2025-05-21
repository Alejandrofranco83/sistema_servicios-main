import { Request, Response } from 'express';
import MovimientoFarmaciaModel from '../models/movimientoFarmaciaModel';

class MovimientoFarmaciaController {
  
  /**
   * Obtiene una lista paginada y filtrada de movimientos de farmacia
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Extraer y parsear parámetros de consulta
      const { 
        fechaDesde,
        fechaHasta,
        tipoMovimiento,
        monedaCodigo,   // Nuevo: Filtrar por moneda específica
        soloTotal,      // Nuevo: Indica si solo se quiere el total
        page: pageStr = '1', // Default a página 1
        limit: limitStr = '10' // Default a 10 por página
      } = req.query;

      const page = parseInt(pageStr as string, 10);
      const limit = parseInt(limitStr as string, 10);

      // Validar paginación básica
      if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
        res.status(400).json({ message: 'Parámetros de paginación inválidos.' });
        return;
      }

      // Crear objeto de filtros para el modelo
      const filters = {
        fechaDesde: fechaDesde as string | undefined,
        fechaHasta: fechaHasta as string | undefined,
        tipoMovimiento: tipoMovimiento as string | undefined,
        monedaCodigo: monedaCodigo as string | undefined,  // Nuevo
        soloTotal: soloTotal === 'true',                  // Nuevo, convertir string a boolean
        page,
        limit,
      };

      // Llamar al modelo para obtener los datos
      const result = await MovimientoFarmaciaModel.getAll(filters);

      // Enviar la respuesta
      res.json({
        data: result.data,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / limit),
        currentPage: page,
        // Convertir Decimal a string para la respuesta JSON
        totalBalancePYG: result.totalBalancePYG.toString(),
        totalBalanceUSD: result.totalBalanceUSD.toString(),
        totalBalanceBRL: result.totalBalanceBRL.toString()
      });

    } catch (error) {
      console.error('Error en MovimientoFarmaciaController.getAll:', error);
      res.status(500).json({ message: 'Error al obtener los movimientos de farmacia' });
    }
  }

  // --- Podrías añadir otros métodos del controlador aquí (getById, create, etc.) ---

}

export default new MovimientoFarmaciaController(); 