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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CotizacionController = void 0;
const cotizacion_model_1 = require("../models/cotizacion.model");
class CotizacionController {
}
exports.CotizacionController = CotizacionController;
_a = CotizacionController;
// Obtener todas las cotizaciones
CotizacionController.getCotizaciones = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cotizaciones = yield cotizacion_model_1.CotizacionModel.findAll();
        return res.json(cotizaciones);
    }
    catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        return res.status(500).json({ error: 'Error al obtener cotizaciones' });
    }
});
// Obtener cotización vigente
CotizacionController.getCotizacionVigente = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cotizacion = yield cotizacion_model_1.CotizacionModel.findVigente();
        if (!cotizacion) {
            return res.status(404).json({ error: 'No hay cotización vigente' });
        }
        return res.json(cotizacion);
    }
    catch (error) {
        console.error('Error al obtener cotización vigente:', error);
        return res.status(500).json({ error: 'Error al obtener cotización vigente' });
    }
});
// Obtener una cotización por ID
CotizacionController.getCotizacionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const cotizacion = yield cotizacion_model_1.CotizacionModel.findById(Number(id));
        if (!cotizacion) {
            return res.status(404).json({ error: 'Cotización no encontrada' });
        }
        return res.json(cotizacion);
    }
    catch (error) {
        console.error('Error al obtener cotización:', error);
        return res.status(500).json({ error: 'Error al obtener cotización' });
    }
});
// Crear una nueva cotización
CotizacionController.createCotizacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { valorDolar, valorReal } = req.body;
        // Validaciones básicas
        if (!valorDolar || !valorReal || valorDolar <= 0 || valorReal <= 0) {
            return res.status(400).json({
                error: 'Los valores de cotización deben ser números positivos'
            });
        }
        // Obtener el ID del usuario autenticado desde el middleware de autenticación
        const usuarioId = req.usuarioId;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const cotizacionData = {
            valorDolar,
            valorReal,
            usuarioId
        };
        const nuevaCotizacion = yield cotizacion_model_1.CotizacionModel.create(cotizacionData);
        return res.status(201).json(nuevaCotizacion);
    }
    catch (error) {
        console.error('Error al crear cotización:', error);
        return res.status(500).json({ error: 'Error al crear cotización' });
    }
});
// Actualizar una cotización existente
CotizacionController.updateCotizacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { valorDolar, valorReal } = req.body;
        // Validaciones básicas
        if ((!valorDolar && !valorReal) ||
            (valorDolar && valorDolar <= 0) ||
            (valorReal && valorReal <= 0)) {
            return res.status(400).json({
                error: 'Los valores de cotización deben ser números positivos'
            });
        }
        // Verificar que la cotización existe
        const cotizacionExistente = yield cotizacion_model_1.CotizacionModel.findById(Number(id));
        if (!cotizacionExistente) {
            return res.status(404).json({ error: 'Cotización no encontrada' });
        }
        // Datos a actualizar
        const cotizacionData = {};
        if (valorDolar)
            cotizacionData.valorDolar = valorDolar;
        if (valorReal)
            cotizacionData.valorReal = valorReal;
        const cotizacionActualizada = yield cotizacion_model_1.CotizacionModel.update(Number(id), cotizacionData);
        return res.json(cotizacionActualizada);
    }
    catch (error) {
        console.error('Error al actualizar cotización:', error);
        return res.status(500).json({ error: 'Error al actualizar cotización' });
    }
});
// Eliminar una cotización
CotizacionController.deleteCotizacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        try {
            yield cotizacion_model_1.CotizacionModel.delete(Number(id));
            return res.json({ message: 'Cotización eliminada correctamente' });
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    catch (error) {
        console.error('Error al eliminar cotización:', error);
        return res.status(500).json({ error: 'Error al eliminar cotización' });
    }
});
//# sourceMappingURL=cotizacion.controller.js.map