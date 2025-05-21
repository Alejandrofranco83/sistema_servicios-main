"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getDiferenciasEnCajas = exports.getComparacionesSaldosServicios = exports.getComparacionesMaletines = void 0;
const diferenciaService = __importStar(require("../services/diferencia.service"));
const client_1 = require("@prisma/client"); // Importa tipos de Prisma si los usas
const getComparacionesMaletines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const comparaciones = yield diferenciaService.calcularComparacionesMaletines();
        return res.status(200).json({ comparaciones });
    }
    catch (error) {
        console.error("Error al obtener comparaciones de maletines:", error);
        // Considerar un manejo de errores más específico
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // Manejo específico de errores de Prisma
            return res.status(400).json({ message: 'Error de base de datos al obtener comparaciones.' });
        }
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});
exports.getComparacionesMaletines = getComparacionesMaletines;
// Nueva función para obtener comparaciones de saldos de servicios
const getComparacionesSaldosServicios = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Llamar a la nueva función del servicio (a implementar)
        const comparaciones = yield diferenciaService.calcularComparacionesSaldosServicios();
        return res.status(200).json({ comparaciones });
    }
    catch (error) {
        console.error("Error al obtener comparaciones de saldos de servicios:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ message: 'Error de base de datos al obtener comparaciones de servicios.' });
        }
        return res.status(500).json({ message: 'Error interno del servidor al obtener comparaciones de servicios' });
    }
});
exports.getComparacionesSaldosServicios = getComparacionesSaldosServicios;
// Nueva función para obtener diferencias internas de caja
const getDiferenciasEnCajas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Llamar a la nueva función del servicio (a implementar)
        const comparaciones = yield diferenciaService.calcularDiferenciasEnCajas();
        return res.status(200).json({ comparaciones });
    }
    catch (error) {
        console.error("Error al obtener diferencias internas de cajas:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ message: 'Error de base de datos al obtener diferencias internas.' });
        }
        return res.status(500).json({ message: 'Error interno del servidor al obtener diferencias internas' });
    }
});
exports.getDiferenciasEnCajas = getDiferenciasEnCajas;
//# sourceMappingURL=diferencias.controller.js.map