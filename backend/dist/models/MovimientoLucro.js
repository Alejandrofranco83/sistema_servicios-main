"use strict";
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    class MovimientoLucro extends Model {
        static associate(models) {
            // Definir las asociaciones aquí
            MovimientoLucro.belongsTo(models.MovimientoCaja, {
                foreignKey: 'movimientoCajaId',
                as: 'movimientoCaja'
            });
        }
    }
    MovimientoLucro.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        movimientoCajaId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'MovimientoCaja',
                key: 'id'
            }
        },
        operadora: {
            type: DataTypes.STRING,
            allowNull: false
        },
        servicio: {
            type: DataTypes.STRING,
            allowNull: false
        },
        monto: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0
        },
        porcentaje: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0
        },
        lucro: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false
        },
        usuarioId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        sucursalId: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'MovimientoLucro',
        tableName: 'movimiento_lucros',
        timestamps: true
    });
    return MovimientoLucro;
};
//# sourceMappingURL=MovimientoLucro.js.map