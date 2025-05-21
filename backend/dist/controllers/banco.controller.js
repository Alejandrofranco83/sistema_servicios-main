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
exports.deleteBanco = exports.updateBanco = exports.createBanco = exports.getBancoById = exports.getAllBancos = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Obtener todos los bancos
 */
const getAllBancos = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bancos = yield prisma.$queryRaw `SELECT * FROM "Banco" ORDER BY nombre ASC`;
        return res.status(200).json(bancos);
    }
    catch (error) {
        console.error('Error al obtener bancos:', error);
        return res.status(500).json({ error: 'Error al obtener bancos' });
    }
});
exports.getAllBancos = getAllBancos;
/**
 * Obtener un banco por ID
 */
const getBancoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const banco = yield prisma.$queryRaw `
      SELECT b.*, 
        (SELECT COUNT(*) FROM "CuentaBancaria" WHERE "bancoId" = ${idNumber}) as cuentas_count,
        (SELECT COUNT(*) FROM "DepositoBancario" WHERE "bancoId" = ${idNumber}) as depositos_count
      FROM "Banco" b
      WHERE b.id = ${idNumber}
    `;
        if (!banco || (Array.isArray(banco) && banco.length === 0)) {
            return res.status(404).json({ error: 'Banco no encontrado' });
        }
        return res.status(200).json(Array.isArray(banco) ? banco[0] : banco);
    }
    catch (error) {
        console.error('Error al obtener banco:', error);
        return res.status(500).json({ error: 'Error al obtener banco' });
    }
});
exports.getBancoById = getBancoById;
/**
 * Crear un nuevo banco
 */
const createBanco = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nombre } = req.body;
        // Validaciones básicas
        if (!nombre) {
            return res.status(400).json({
                error: 'Falta el nombre del banco',
                details: 'El nombre del banco es obligatorio'
            });
        }
        // Verificar si ya existe un banco con ese nombre
        const existingBanco = yield prisma.$queryRaw `SELECT * FROM "Banco" WHERE nombre = ${nombre}`;
        if (existingBanco && Array.isArray(existingBanco) && existingBanco.length > 0) {
            return res.status(400).json({
                error: 'El banco ya existe',
                details: 'Ya existe un banco con ese nombre'
            });
        }
        // Crear el banco usando SQL directo
        const newBanco = yield prisma.$queryRaw `
      INSERT INTO "Banco" (nombre, "createdAt", "updatedAt")
      VALUES (${nombre}, NOW(), NOW())
      RETURNING *
    `;
        return res.status(201).json(Array.isArray(newBanco) ? newBanco[0] : newBanco);
    }
    catch (error) {
        console.error('Error al crear banco:', error);
        return res.status(500).json({ error: 'Error al crear banco' });
    }
});
exports.createBanco = createBanco;
/**
 * Actualizar un banco existente
 */
const updateBanco = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const { nombre } = req.body;
        // Validar que se proporciona el nombre
        if (!nombre) {
            return res.status(400).json({
                error: 'Falta el nombre del banco',
                details: 'El nombre del banco es obligatorio'
            });
        }
        // Verificar si el banco existe
        const existingBanco = yield prisma.$queryRaw `SELECT * FROM "Banco" WHERE id = ${idNumber}`;
        if (!existingBanco || (Array.isArray(existingBanco) && existingBanco.length === 0)) {
            return res.status(404).json({ error: 'Banco no encontrado' });
        }
        // Verificar si ya existe otro banco con ese nombre
        const bancoWithSameName = yield prisma.$queryRaw `SELECT * FROM "Banco" WHERE nombre = ${nombre}`;
        if (bancoWithSameName && Array.isArray(bancoWithSameName) && bancoWithSameName.length > 0) {
            const bancoFound = bancoWithSameName[0];
            if (bancoFound.id !== idNumber) {
                return res.status(400).json({
                    error: 'El nombre del banco ya está en uso',
                    details: 'Ya existe otro banco con ese nombre'
                });
            }
        }
        // Actualizar el banco
        const updatedBanco = yield prisma.$queryRaw `
      UPDATE "Banco"
      SET nombre = ${nombre}, "updatedAt" = NOW()
      WHERE id = ${idNumber}
      RETURNING *
    `;
        return res.status(200).json(Array.isArray(updatedBanco) ? updatedBanco[0] : updatedBanco);
    }
    catch (error) {
        console.error('Error al actualizar banco:', error);
        return res.status(500).json({ error: 'Error al actualizar banco' });
    }
});
exports.updateBanco = updateBanco;
/**
 * Eliminar un banco
 */
const deleteBanco = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        // Verificar si el banco existe
        const existingBanco = yield prisma.$queryRaw `SELECT * FROM "Banco" WHERE id = ${idNumber}`;
        if (!existingBanco || (Array.isArray(existingBanco) && existingBanco.length === 0)) {
            return res.status(404).json({ error: 'Banco no encontrado' });
        }
        // Verificar si el banco tiene cuentas asociadas
        const cuentasAsociadas = yield prisma.$queryRaw `
      SELECT COUNT(*) as count FROM "CuentaBancaria" WHERE "bancoId" = ${idNumber}
    `;
        // Verificar si el banco tiene depósitos asociados
        const depositosAsociados = yield prisma.$queryRaw `
      SELECT COUNT(*) as count FROM "DepositoBancario" WHERE "bancoId" = ${idNumber}
    `;
        const cuentasCount = Array.isArray(cuentasAsociadas) ? cuentasAsociadas[0].count : 0;
        const depositosCount = Array.isArray(depositosAsociados) ? depositosAsociados[0].count : 0;
        if (cuentasCount > 0 || depositosCount > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el banco',
                details: 'El banco tiene cuentas o depósitos asociados'
            });
        }
        // Eliminar el banco
        yield prisma.$queryRaw `DELETE FROM "Banco" WHERE id = ${idNumber}`;
        return res.status(200).json({ message: 'Banco eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar banco:', error);
        return res.status(500).json({ error: 'Error al eliminar banco' });
    }
});
exports.deleteBanco = deleteBanco;
//# sourceMappingURL=banco.controller.js.map