"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoPanel = exports.CarruselSlide = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../database"));
// Clase para el modelo de Slide
class CarruselSlide extends sequelize_1.Model {
}
exports.CarruselSlide = CarruselSlide;
// Inicializar el modelo
CarruselSlide.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    bgColor: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '#f0f0f0',
    },
    imageUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    orden: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    activo: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: database_1.default,
    tableName: 'carrusel_slides',
    timestamps: true,
});
// Clase para el modelo de Panel Informativo
class InfoPanel extends sequelize_1.Model {
}
exports.InfoPanel = InfoPanel;
// Inicializar el modelo
InfoPanel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    notaImportante: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    tableName: 'info_panel',
    timestamps: true,
});
//# sourceMappingURL=carrusel.model.js.map