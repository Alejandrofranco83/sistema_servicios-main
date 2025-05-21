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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValeController = void 0;
const vale_model_1 = require("../models/vale.model");
const client_1 = require("@prisma/client");
exports.ValeController = {
    getAllVales: (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const vales = yield vale_model_1.ValeModel.findAll();
            return res.json(vales);
        }
        catch (error) {
            console.error('Error al obtener vales:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    getValeById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            const vale = yield vale_model_1.ValeModel.findById(id);
            if (!vale) {
                return res.status(404).json({ error: 'Vale no encontrado' });
            }
            return res.json(vale);
        }
        catch (error) {
            console.error('Error al obtener vale:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    getValesByPersona: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const personaId = parseInt(req.params.personaId);
            const vales = yield vale_model_1.ValeModel.findByPersona(personaId);
            return res.json(vales);
        }
        catch (error) {
            console.error('Error al obtener vales por persona:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    getValesPendientes: (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const vales = yield vale_model_1.ValeModel.findPendientes();
            return res.json(vales);
        }
        catch (error) {
            console.error('Error al obtener vales pendientes:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    getEstadisticasVales: (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const estadisticas = yield vale_model_1.ValeModel.getEstadisticas();
            return res.json(estadisticas);
        }
        catch (error) {
            console.error('Error al obtener estadísticas de vales:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    createVale: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const valeData = req.body;
            // Validar campos requeridos
            if (!valeData.moneda || !valeData.monto || !valeData.fecha_vencimiento ||
                !valeData.motivo || !valeData.persona_id || !valeData.persona_nombre ||
                !valeData.usuario_creador_id) {
                return res.status(400).json({
                    error: 'Faltan campos requeridos para crear el vale'
                });
            }
            // Parsear la fecha de vencimiento si viene como string
            if (typeof valeData.fecha_vencimiento === 'string') {
                valeData.fecha_vencimiento = new Date(valeData.fecha_vencimiento);
            }
            // Intentar crear el vale
            const nuevoVale = yield vale_model_1.ValeModel.create(valeData);
            return res.status(201).json(nuevoVale);
        }
        catch (error) {
            console.error('Error al crear vale:', error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(400).json({
                        error: 'Ya existe un vale con ese número'
                    });
                }
            }
            return res.status(500).json({
                error: 'Error al crear el vale. Por favor, intente nuevamente.'
            });
        }
    }),
    updateVale: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            const valeData = req.body;
            // Parsear la fecha de vencimiento si viene como string
            if (typeof valeData.fecha_vencimiento === 'string') {
                valeData.fecha_vencimiento = new Date(valeData.fecha_vencimiento);
            }
            const valeActualizado = yield vale_model_1.ValeModel.update(id, valeData);
            return res.json(valeActualizado);
        }
        catch (error) {
            console.error('Error al actualizar vale:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    marcarValeCobrado: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            const vale = yield vale_model_1.ValeModel.marcarCobrado(id);
            return res.json(vale);
        }
        catch (error) {
            console.error('Error al marcar vale como cobrado:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    marcarValeAnulado: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            const vale = yield vale_model_1.ValeModel.marcarAnulado(id);
            return res.json(vale);
        }
        catch (error) {
            console.error('Error al marcar vale como anulado:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    marcarValeImpreso: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            const vale = yield vale_model_1.ValeModel.marcarImpreso(id);
            return res.json(vale);
        }
        catch (error) {
            console.error('Error al marcar vale como impreso:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    deleteVale: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            yield vale_model_1.ValeModel.delete(id);
            return res.status(204).send();
        }
        catch (error) {
            console.error('Error al eliminar vale:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    getValeByMovimientoId: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const movimientoId = parseInt(req.params.movimientoId);
            if (isNaN(movimientoId)) {
                return res.status(400).json({ error: 'ID de movimiento inválido' });
            }
            const vale = yield vale_model_1.ValeModel.findByMovimientoId(movimientoId);
            if (!vale) {
                return res.status(404).json({ error: 'No se encontró vale asociado a este movimiento' });
            }
            return res.json(vale);
        }
        catch (error) {
            console.error('Error al obtener vale por ID de movimiento:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    cancelarVale: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            const { movimientoId, razon } = req.body;
            const usuarioId = req.body.usuarioId || 1; // Si no hay usuario, usar uno por defecto
            if (!movimientoId) {
                return res.status(400).json({ error: 'ID de movimiento es requerido' });
            }
            const resultado = yield vale_model_1.ValeModel.cancelarVale(id, razon || 'Vale cancelado', parseInt(movimientoId), usuarioId);
            return res.json(Object.assign({ mensaje: 'Vale cancelado exitosamente' }, resultado));
        }
        catch (error) {
            console.error('Error al cancelar vale:', error);
            return res.status(500).json({
                error: error.message || 'Error al cancelar el vale. Por favor, intente nuevamente.'
            });
        }
    })
};
//# sourceMappingURL=vale.controller.js.map