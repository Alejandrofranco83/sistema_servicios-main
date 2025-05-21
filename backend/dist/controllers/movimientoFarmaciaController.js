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
const movimientoFarmaciaModel_1 = __importDefault(require("../models/movimientoFarmaciaModel"));
class MovimientoFarmaciaController {
    /**
     * Obtiene una lista paginada y filtrada de movimientos de farmacia
     */
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Extraer y parsear parámetros de consulta
                const { fechaDesde, fechaHasta, tipoMovimiento, monedaCodigo, // Nuevo: Filtrar por moneda específica
                soloTotal, // Nuevo: Indica si solo se quiere el total
                page: pageStr = '1', // Default a página 1
                limit: limitStr = '10' // Default a 10 por página
                 } = req.query;
                const page = parseInt(pageStr, 10);
                const limit = parseInt(limitStr, 10);
                // Validar paginación básica
                if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
                    res.status(400).json({ message: 'Parámetros de paginación inválidos.' });
                    return;
                }
                // Crear objeto de filtros para el modelo
                const filters = {
                    fechaDesde: fechaDesde,
                    fechaHasta: fechaHasta,
                    tipoMovimiento: tipoMovimiento,
                    monedaCodigo: monedaCodigo, // Nuevo
                    soloTotal: soloTotal === 'true', // Nuevo, convertir string a boolean
                    page,
                    limit,
                };
                // Llamar al modelo para obtener los datos
                const result = yield movimientoFarmaciaModel_1.default.getAll(filters);
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
            }
            catch (error) {
                console.error('Error en MovimientoFarmaciaController.getAll:', error);
                res.status(500).json({ message: 'Error al obtener los movimientos de farmacia' });
            }
        });
    }
}
exports.default = new MovimientoFarmaciaController();
//# sourceMappingURL=movimientoFarmaciaController.js.map