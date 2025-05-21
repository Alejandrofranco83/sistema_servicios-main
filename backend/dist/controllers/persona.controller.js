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
exports.PersonaController = void 0;
const persona_model_1 = require("../models/persona.model");
const client_1 = require("@prisma/client");
exports.PersonaController = {
    getAllPersonas: (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const personas = yield persona_model_1.PersonaModel.findAll();
            return res.json(personas);
        }
        catch (error) {
            console.error('Error al obtener personas:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    getPersonaById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = parseInt(req.params.id);
            const persona = yield persona_model_1.PersonaModel.findById(id);
            if (!persona) {
                return res.status(404).json({ error: 'Persona no encontrada' });
            }
            return res.json(persona);
        }
        catch (error) {
            console.error('Error al obtener persona:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    createPersona: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const personaData = req.body;
            // Validar campos requeridos
            if (!personaData.nombreCompleto || !personaData.documento) {
                return res.status(400).json({
                    error: 'Los campos nombreCompleto y documento son requeridos'
                });
            }
            // Intentar crear la persona
            const nuevaPersona = yield persona_model_1.PersonaModel.create(personaData);
            return res.status(201).json(nuevaPersona);
        }
        catch (error) {
            console.error('Error al crear persona:', error);
            // Manejar error de documento duplicado
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(400).json({
                        error: 'Ya existe una persona con ese número de documento'
                    });
                }
            }
            return res.status(500).json({
                error: 'Error al crear la persona. Por favor, intente nuevamente.'
            });
        }
    }),
    updatePersona: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = parseInt(req.params.id);
            const personaData = req.body;
            const personaActualizada = yield persona_model_1.PersonaModel.update(id, personaData);
            return res.json(personaActualizada);
        }
        catch (error) {
            console.error('Error al actualizar persona:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    deletePersona: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = parseInt(req.params.id);
            yield persona_model_1.PersonaModel.delete(id);
            return res.status(204).send();
        }
        catch (error) {
            console.error('Error al eliminar persona:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    searchPersonas: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const query = req.query.query || '';
            if (!query || query.trim() === '') {
                return res.json([]);
            }
            const personas = yield persona_model_1.PersonaModel.search(query);
            return res.json(personas);
        }
        catch (error) {
            console.error('Error al buscar personas:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Obtener solo las personas que son funcionarios
    getFuncionarios: (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Utilizamos PrismaClient directamente para esta consulta específica
            const funcionarios = yield persona_model_1.PersonaModel.findByTipo('Funcionario');
            return res.json(funcionarios);
        }
        catch (error) {
            console.error('Error al obtener funcionarios:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    })
};
//# sourceMappingURL=persona.controller.js.map