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
exports.deleteCuentaBancaria = exports.updateCuentaBancaria = exports.createCuentaBancaria = exports.getCuentaBancariaById = exports.getAllCuentasBancarias = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Obtener todas las cuentas bancarias
 */
const getAllCuentasBancarias = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cuentas = yield prisma.cuentaBancaria.findMany({
            orderBy: {
                banco: 'asc',
            },
        });
        return res.status(200).json(cuentas);
    }
    catch (error) {
        console.error('Error al obtener cuentas bancarias:', error);
        return res.status(500).json({ error: 'Error al obtener cuentas bancarias' });
    }
});
exports.getAllCuentasBancarias = getAllCuentasBancarias;
/**
 * Obtener una cuenta bancaria por ID
 */
const getCuentaBancariaById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const cuenta = yield prisma.cuentaBancaria.findUnique({
            where: { id: idNumber },
            include: {
                dispositivosPos: true,
            },
        });
        if (!cuenta) {
            return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
        }
        return res.status(200).json(cuenta);
    }
    catch (error) {
        console.error('Error al obtener cuenta bancaria:', error);
        return res.status(500).json({ error: 'Error al obtener cuenta bancaria' });
    }
});
exports.getCuentaBancariaById = getCuentaBancariaById;
/**
 * Crear una nueva cuenta bancaria
 */
const createCuentaBancaria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { banco, numeroCuenta, moneda, tipo } = req.body;
        // Validaciones sencillas
        if (!banco || !numeroCuenta || !moneda || !tipo) {
            return res.status(400).json({
                error: 'Faltan datos requeridos',
                details: 'El banco, número de cuenta, tipo y moneda son obligatorios'
            });
        }
        if (!['PYG', 'BRL', 'USD'].includes(moneda)) {
            return res.status(400).json({
                error: 'Moneda inválida',
                details: 'La moneda debe ser PYG, BRL o USD'
            });
        }
        // Crear la cuenta bancaria
        const newCuenta = yield prisma.cuentaBancaria.create({
            data: {
                banco,
                numeroCuenta,
                moneda,
                tipo,
            },
        });
        return res.status(201).json(newCuenta);
    }
    catch (error) {
        console.error('Error al crear cuenta bancaria:', error);
        return res.status(500).json({ error: 'Error al crear cuenta bancaria' });
    }
});
exports.createCuentaBancaria = createCuentaBancaria;
/**
 * Actualizar una cuenta bancaria existente
 */
const updateCuentaBancaria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const { banco, numeroCuenta, moneda } = req.body;
        // Verificar si se está actualizando la moneda y validarla
        if (moneda && !['PYG', 'BRL', 'USD'].includes(moneda)) {
            return res.status(400).json({
                error: 'Moneda inválida',
                details: 'La moneda debe ser PYG, BRL o USD'
            });
        }
        // Verificar si la cuenta existe
        const existingCuenta = yield prisma.cuentaBancaria.findUnique({
            where: { id: idNumber },
        });
        if (!existingCuenta) {
            return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
        }
        // Actualizar la cuenta bancaria
        const updatedCuenta = yield prisma.cuentaBancaria.update({
            where: { id: idNumber },
            data: Object.assign(Object.assign(Object.assign({}, (banco && { banco })), (numeroCuenta && { numeroCuenta })), (moneda && { moneda })),
        });
        return res.status(200).json(updatedCuenta);
    }
    catch (error) {
        console.error('Error al actualizar cuenta bancaria:', error);
        return res.status(500).json({ error: 'Error al actualizar cuenta bancaria' });
    }
});
exports.updateCuentaBancaria = updateCuentaBancaria;
/**
 * Eliminar una cuenta bancaria
 */
const deleteCuentaBancaria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        // Verificar si la cuenta existe
        const existingCuenta = yield prisma.cuentaBancaria.findUnique({
            where: { id: idNumber },
            include: {
                dispositivosPos: true,
            },
        });
        if (!existingCuenta) {
            return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
        }
        // Verificar si la cuenta tiene dispositivos POS asociados
        if (existingCuenta.dispositivosPos.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar la cuenta bancaria',
                details: 'La cuenta tiene dispositivos POS asociados'
            });
        }
        // Eliminar la cuenta bancaria
        yield prisma.cuentaBancaria.delete({
            where: { id: idNumber },
        });
        return res.status(200).json({ message: 'Cuenta bancaria eliminada correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar cuenta bancaria:', error);
        return res.status(500).json({ error: 'Error al eliminar cuenta bancaria' });
    }
});
exports.deleteCuentaBancaria = deleteCuentaBancaria;
//# sourceMappingURL=cuenta-bancaria.controller.js.map