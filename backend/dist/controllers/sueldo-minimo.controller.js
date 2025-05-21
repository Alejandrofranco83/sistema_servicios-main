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
exports.SueldoMinimoController = void 0;
const sueldo_minimo_model_1 = require("../models/sueldo-minimo.model");
class SueldoMinimoController {
}
exports.SueldoMinimoController = SueldoMinimoController;
_a = SueldoMinimoController;
// Obtener todos los sueldos mínimos
SueldoMinimoController.getSueldosMinimos = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sueldosMinimos = yield sueldo_minimo_model_1.SueldoMinimoModel.findAll();
        return res.json(sueldosMinimos);
    }
    catch (error) {
        console.error('Error al obtener sueldos mínimos:', error);
        return res.status(500).json({ error: 'Error al obtener sueldos mínimos' });
    }
});
// Obtener sueldo mínimo vigente
SueldoMinimoController.getSueldoMinimoVigente = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sueldoMinimo = yield sueldo_minimo_model_1.SueldoMinimoModel.findVigente();
        if (!sueldoMinimo) {
            return res.status(404).json({ error: 'No hay sueldo mínimo vigente' });
        }
        return res.json(sueldoMinimo);
    }
    catch (error) {
        console.error('Error al obtener sueldo mínimo vigente:', error);
        return res.status(500).json({ error: 'Error al obtener sueldo mínimo vigente' });
    }
});
// Obtener un sueldo mínimo por ID
SueldoMinimoController.getSueldoMinimoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const sueldoMinimo = yield sueldo_minimo_model_1.SueldoMinimoModel.findById(Number(id));
        if (!sueldoMinimo) {
            return res.status(404).json({ error: 'Sueldo mínimo no encontrado' });
        }
        return res.json(sueldoMinimo);
    }
    catch (error) {
        console.error('Error al obtener sueldo mínimo:', error);
        return res.status(500).json({ error: 'Error al obtener sueldo mínimo' });
    }
});
// Crear un nuevo sueldo mínimo
SueldoMinimoController.createSueldoMinimo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { valor } = req.body;
        // Validaciones básicas
        if (!valor || valor <= 0) {
            return res.status(400).json({
                error: 'El valor del sueldo mínimo debe ser un número positivo'
            });
        }
        // Obtener el ID del usuario autenticado desde el middleware de autenticación
        const usuarioId = req.usuarioId;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const sueldoMinimoData = {
            valor,
            usuarioId
        };
        const nuevoSueldoMinimo = yield sueldo_minimo_model_1.SueldoMinimoModel.create(sueldoMinimoData);
        return res.status(201).json(nuevoSueldoMinimo);
    }
    catch (error) {
        console.error('Error al crear sueldo mínimo:', error);
        return res.status(500).json({ error: 'Error al crear sueldo mínimo' });
    }
});
// Actualizar un sueldo mínimo existente
SueldoMinimoController.updateSueldoMinimo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { valor } = req.body;
        // Validaciones básicas
        if (!valor || valor <= 0) {
            return res.status(400).json({
                error: 'El valor del sueldo mínimo debe ser un número positivo'
            });
        }
        // Verificar que el sueldo mínimo existe
        const sueldoMinimoExistente = yield sueldo_minimo_model_1.SueldoMinimoModel.findById(Number(id));
        if (!sueldoMinimoExistente) {
            return res.status(404).json({ error: 'Sueldo mínimo no encontrado' });
        }
        // Datos a actualizar
        const sueldoMinimoData = { valor };
        const sueldoMinimoActualizado = yield sueldo_minimo_model_1.SueldoMinimoModel.update(Number(id), sueldoMinimoData);
        return res.json(sueldoMinimoActualizado);
    }
    catch (error) {
        console.error('Error al actualizar sueldo mínimo:', error);
        return res.status(500).json({ error: 'Error al actualizar sueldo mínimo' });
    }
});
// Eliminar un sueldo mínimo
SueldoMinimoController.deleteSueldoMinimo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        try {
            yield sueldo_minimo_model_1.SueldoMinimoModel.delete(Number(id));
            return res.json({ message: 'Sueldo mínimo eliminado correctamente' });
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    catch (error) {
        console.error('Error al eliminar sueldo mínimo:', error);
        return res.status(500).json({ error: 'Error al eliminar sueldo mínimo' });
    }
});
//# sourceMappingURL=sueldo-minimo.controller.js.map