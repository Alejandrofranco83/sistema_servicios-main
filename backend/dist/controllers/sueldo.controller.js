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
exports.SueldoController = void 0;
const sueldo_model_1 = require("../models/sueldo.model");
const persona_model_1 = require("../models/persona.model");
exports.SueldoController = {
    // Obtener todos los sueldos
    getAllSueldos: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const sueldos = yield sueldo_model_1.SueldoModel.findAll();
            res.status(200).json(sueldos);
        }
        catch (error) {
            console.error('Error al obtener todos los sueldos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Obtener sueldo por ID
    getSueldoById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const sueldo = yield sueldo_model_1.SueldoModel.findById(parseInt(id));
            if (!sueldo) {
                return res.status(404).json({ error: 'Sueldo no encontrado' });
            }
            res.status(200).json(sueldo);
        }
        catch (error) {
            console.error('Error al obtener sueldo por ID:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Obtener sueldos por persona
    getSueldosByPersona: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { personaId } = req.params;
            const sueldos = yield sueldo_model_1.SueldoModel.findByPersona(parseInt(personaId));
            res.status(200).json(sueldos);
        }
        catch (error) {
            console.error('Error al obtener sueldos por persona:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Obtener sueldos por mes y año
    getSueldosByMesAnio: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { anio, mes } = req.params;
            const sueldos = yield sueldo_model_1.SueldoModel.findByMesAnio(parseInt(mes), parseInt(anio));
            res.status(200).json(sueldos);
        }
        catch (error) {
            console.error('Error al obtener sueldos por mes y año:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Crear un nuevo sueldo
    createSueldo: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { personaId, mes, anio, monto } = req.body;
            // Validar que la persona exista
            const persona = yield persona_model_1.PersonaModel.findById(personaId);
            if (!persona) {
                return res.status(404).json({ error: 'Persona no encontrada' });
            }
            // Validar los datos
            if (!personaId || !mes || !anio || !monto) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }
            // Convertir valores a números
            const sueldoData = {
                personaId: parseInt(personaId),
                mes: parseInt(mes),
                anio: parseInt(anio),
                monto: parseFloat(monto)
            };
            const sueldo = yield sueldo_model_1.SueldoModel.create(sueldoData);
            res.status(201).json(sueldo);
        }
        catch (error) {
            console.error('Error al crear sueldo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Guardar múltiples sueldos
    guardarSueldos: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const sueldosData = req.body;
            if (!Array.isArray(sueldosData) || sueldosData.length === 0) {
                return res.status(400).json({ error: 'Debe proporcionar un array de sueldos' });
            }
            // Validar cada uno de los datos
            for (const sueldo of sueldosData) {
                if (!sueldo.personaId || !sueldo.mes || !sueldo.anio || !sueldo.monto) {
                    return res.status(400).json({ error: 'Todos los campos son requeridos para cada sueldo' });
                }
            }
            // Convertir los valores a números
            const sueldosFormateados = sueldosData.map(sueldo => ({
                personaId: parseInt(sueldo.personaId),
                mes: parseInt(sueldo.mes),
                anio: parseInt(sueldo.anio),
                monto: parseFloat(sueldo.monto)
            }));
            yield sueldo_model_1.SueldoModel.guardarMultiples(sueldosFormateados);
            res.status(201).json({ message: 'Sueldos guardados correctamente' });
        }
        catch (error) {
            console.error('Error al guardar múltiples sueldos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Actualizar un sueldo
    updateSueldo: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const { personaId, mes, anio, monto } = req.body;
            // Validar que el sueldo exista
            const existingSueldo = yield sueldo_model_1.SueldoModel.findById(parseInt(id));
            if (!existingSueldo) {
                return res.status(404).json({ error: 'Sueldo no encontrado' });
            }
            // Validar que la persona exista si se está actualizando personaId
            if (personaId) {
                const persona = yield persona_model_1.PersonaModel.findById(parseInt(personaId));
                if (!persona) {
                    return res.status(404).json({ error: 'Persona no encontrada' });
                }
            }
            const sueldoData = {};
            if (personaId)
                sueldoData.personaId = parseInt(personaId);
            if (mes)
                sueldoData.mes = parseInt(mes);
            if (anio)
                sueldoData.anio = parseInt(anio);
            if (monto)
                sueldoData.monto = parseFloat(monto);
            const sueldo = yield sueldo_model_1.SueldoModel.update(parseInt(id), sueldoData);
            res.status(200).json(sueldo);
        }
        catch (error) {
            console.error('Error al actualizar sueldo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }),
    // Eliminar un sueldo
    deleteSueldo: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            // Validar que el sueldo exista
            const existingSueldo = yield sueldo_model_1.SueldoModel.findById(parseInt(id));
            if (!existingSueldo) {
                return res.status(404).json({ error: 'Sueldo no encontrado' });
            }
            yield sueldo_model_1.SueldoModel.delete(parseInt(id));
            res.status(200).json({ message: 'Sueldo eliminado correctamente' });
        }
        catch (error) {
            console.error('Error al eliminar sueldo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    })
};
//# sourceMappingURL=sueldo.controller.js.map