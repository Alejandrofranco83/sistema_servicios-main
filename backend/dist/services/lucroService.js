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
const { Op } = require('sequelize');
const db = require('../models');
// Porcentajes de lucro por tipo de servicio
const PORCENTAJES_LUCRO = {
    tigo: {
        miniCarga: 5,
        girosEnviados: 1,
        retiros: 1,
        cargaBilleteras: 1
    },
    personal: {
        maxiCarga: 5,
        girosEnviados: 1,
        retiros: 1,
        cargaBilleteras: 1
    },
    claro: {
        recargaClaro: 5,
        girosEnviados: 1,
        retiros: 1,
        cargaBilleteras: 1
    },
    aquiPago: {
        pagos: 0.5,
        retiros: 0.5
    },
    wepaGuaranies: {
        pagos: 0.5,
        retiros: 0.5
    },
    wepaDolares: {
        pagos: 0.5,
        retiros: 0.5
    }
};
/**
 * Obtiene los movimientos de caja con la información necesaria para calcular lucros
 */
const obtenerMovimientosParaLucro = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filtros = {}) {
    try {
        // Construir las condiciones de filtrado
        const where = {};
        // Filtrar por fecha
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fecha = {};
            if (filtros.fechaDesde) {
                where.fecha[Op.gte] = new Date(filtros.fechaDesde);
            }
            if (filtros.fechaHasta) {
                // Ajustar la fecha hasta para incluir todo el día
                const fechaHasta = new Date(filtros.fechaHasta);
                fechaHasta.setHours(23, 59, 59, 999);
                where.fecha[Op.lte] = fechaHasta;
            }
        }
        // Filtrar por monto > 0
        where.monto = {
            [Op.gt]: 0
        };
        // Filtrar por operadora
        if (filtros.operadora) {
            where.operadora = filtros.operadora;
        }
        // Filtrar por servicio
        if (filtros.servicio) {
            where.servicio = filtros.servicio;
        }
        // Consulta principal para obtener los movimientos de caja
        const movimientos = yield db.MovimientoCaja.findAll({
            where,
            include: [
                {
                    model: db.Caja,
                    as: 'caja',
                    attributes: ['id', 'usuarioId', 'branchId'],
                    include: [
                        {
                            model: db.Usuario,
                            as: 'usuario',
                            attributes: ['id', 'username']
                        },
                        {
                            model: db.Sucursal,
                            as: 'sucursal',
                            attributes: ['id', 'nombre']
                        }
                    ]
                }
            ],
            order: [['fecha', 'DESC']]
        });
        // Filtrar por usuario si se especifica
        let movimientosFiltrados = movimientos;
        if (filtros.usuarioId) {
            movimientosFiltrados = movimientosFiltrados.filter(m => { var _a, _b; return ((_b = (_a = m.caja) === null || _a === void 0 ? void 0 : _a.usuario) === null || _b === void 0 ? void 0 : _b.id) == filtros.usuarioId; });
        }
        // Filtrar por sucursal si se especifica
        if (filtros.sucursalId) {
            movimientosFiltrados = movimientosFiltrados.filter(m => { var _a, _b; return ((_b = (_a = m.caja) === null || _a === void 0 ? void 0 : _a.sucursal) === null || _b === void 0 ? void 0 : _b.id) == filtros.sucursalId; });
        }
        // Filtrar por búsqueda de texto
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            movimientosFiltrados = movimientosFiltrados.filter(m => {
                var _a, _b, _c, _d;
                return m.operadora.toLowerCase().includes(busqueda) ||
                    m.servicio.toLowerCase().includes(busqueda) ||
                    ((_b = (_a = m.caja) === null || _a === void 0 ? void 0 : _a.usuario) === null || _b === void 0 ? void 0 : _b.username.toLowerCase().includes(busqueda)) ||
                    ((_d = (_c = m.caja) === null || _c === void 0 ? void 0 : _c.sucursal) === null || _d === void 0 ? void 0 : _d.nombre.toLowerCase().includes(busqueda));
            });
        }
        // Mapear los resultados para incluir información del usuario y sucursal
        return movimientosFiltrados.map(m => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const mov = m.toJSON();
            return {
                id: mov.id,
                fecha: mov.fecha,
                cajaId: mov.cajaId,
                operadora: mov.operadora,
                servicio: mov.servicio,
                monto: mov.monto,
                comprobante: mov.comprobante,
                createdAt: mov.createdAt,
                updatedAt: mov.updatedAt,
                usuario: (_b = (_a = mov.caja) === null || _a === void 0 ? void 0 : _a.usuario) === null || _b === void 0 ? void 0 : _b.username,
                usuarioId: (_d = (_c = mov.caja) === null || _c === void 0 ? void 0 : _c.usuario) === null || _d === void 0 ? void 0 : _d.id,
                sucursal: (_f = (_e = mov.caja) === null || _e === void 0 ? void 0 : _e.sucursal) === null || _f === void 0 ? void 0 : _f.nombre,
                sucursalId: (_h = (_g = mov.caja) === null || _g === void 0 ? void 0 : _g.sucursal) === null || _h === void 0 ? void 0 : _h.id
            };
        });
    }
    catch (error) {
        console.error('Error al obtener los movimientos para lucro:', error);
        throw error;
    }
});
/**
 * Calcula los lucros basados en los porcentajes definidos
 */
const calcularLucrosDesdeMovimientos = (movimientos) => {
    return movimientos.map(mov => {
        var _a;
        const porcentaje = ((_a = PORCENTAJES_LUCRO[mov.operadora]) === null || _a === void 0 ? void 0 : _a[mov.servicio]) || 0;
        const lucro = (mov.monto * porcentaje) / 100;
        return {
            id: mov.id,
            movimientoCajaId: mov.id,
            fecha: mov.fecha,
            operadora: mov.operadora,
            servicio: mov.servicio,
            monto: mov.monto,
            porcentaje: porcentaje,
            lucro: lucro,
            cajaId: mov.cajaId,
            usuario: mov.usuario,
            usuarioId: mov.usuarioId,
            sucursal: mov.sucursal,
            sucursalId: mov.sucursalId,
            createdAt: mov.createdAt,
            updatedAt: mov.updatedAt
        };
    });
};
/**
 * Calcula y guarda los lucros en la base de datos
 */
const calcularYGuardarLucros = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filtros = {}) {
    const transaction = yield db.sequelize.transaction();
    try {
        // Obtener los movimientos según los filtros
        const movimientos = yield obtenerMovimientosParaLucro(filtros);
        // Calcular los lucros
        const lucros = calcularLucrosDesdeMovimientos(movimientos);
        // Guardar los lucros calculados en la base de datos
        for (const lucro of lucros) {
            yield db.MovimientoLucro.findOrCreate({
                where: { movimientoCajaId: lucro.movimientoCajaId },
                defaults: {
                    fecha: lucro.fecha,
                    operadora: lucro.operadora,
                    servicio: lucro.servicio,
                    monto: lucro.monto,
                    porcentaje: lucro.porcentaje,
                    lucro: lucro.lucro,
                    usuarioId: lucro.usuarioId,
                    sucursalId: lucro.sucursalId
                },
                transaction
            });
        }
        yield transaction.commit();
        return lucros;
    }
    catch (error) {
        yield transaction.rollback();
        console.error('Error al calcular y guardar lucros:', error);
        throw error;
    }
});
/**
 * Obtiene los lucros calculados con posibilidad de filtrado
 */
const obtenerLucros = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filtros = {}) {
    try {
        // Si no hay lucros calculados, calcularlos primero
        const countLucros = yield db.MovimientoLucro.count();
        if (countLucros === 0) {
            yield calcularYGuardarLucros(filtros);
        }
        // Construir las condiciones de filtrado
        const where = {};
        // Filtrar por fecha
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fecha = {};
            if (filtros.fechaDesde) {
                where.fecha[Op.gte] = new Date(filtros.fechaDesde);
            }
            if (filtros.fechaHasta) {
                // Ajustar la fecha hasta para incluir todo el día
                const fechaHasta = new Date(filtros.fechaHasta);
                fechaHasta.setHours(23, 59, 59, 999);
                where.fecha[Op.lte] = fechaHasta;
            }
        }
        // Filtrar por operadora
        if (filtros.operadora) {
            where.operadora = filtros.operadora;
        }
        // Filtrar por servicio
        if (filtros.servicio) {
            where.servicio = filtros.servicio;
        }
        // Filtrar por usuario
        if (filtros.usuarioId) {
            where.usuarioId = filtros.usuarioId;
        }
        // Filtrar por sucursal
        if (filtros.sucursalId) {
            where.sucursalId = filtros.sucursalId;
        }
        // Consulta principal para obtener los lucros
        const lucros = yield db.MovimientoLucro.findAll({
            where,
            include: [
                {
                    model: db.MovimientoCaja,
                    as: 'movimientoCaja',
                    attributes: ['id', 'cajaId', 'comprobante']
                }
            ],
            order: [['fecha', 'DESC']]
        });
        // Incluir datos del usuario y sucursal
        const lucrosConDatos = yield Promise.all(lucros.map((lucro) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const l = lucro.toJSON();
            // Obtener datos del usuario
            let usuario = null;
            if (l.usuarioId) {
                usuario = yield db.Usuario.findByPk(l.usuarioId);
            }
            // Obtener datos de la sucursal
            let sucursal = null;
            if (l.sucursalId) {
                sucursal = yield db.Sucursal.findByPk(l.sucursalId);
            }
            return Object.assign(Object.assign({}, l), { cajaId: (_a = l.movimientoCaja) === null || _a === void 0 ? void 0 : _a.cajaId, comprobante: (_b = l.movimientoCaja) === null || _b === void 0 ? void 0 : _b.comprobante, usuario: usuario === null || usuario === void 0 ? void 0 : usuario.username, sucursal: sucursal === null || sucursal === void 0 ? void 0 : sucursal.nombre });
        })));
        // Filtrar por búsqueda de texto
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            return lucrosConDatos.filter(l => l.operadora.toLowerCase().includes(busqueda) ||
                l.servicio.toLowerCase().includes(busqueda) ||
                (l.usuario && l.usuario.toLowerCase().includes(busqueda)) ||
                (l.sucursal && l.sucursal.toLowerCase().includes(busqueda)));
        }
        return lucrosConDatos;
    }
    catch (error) {
        console.error('Error al obtener lucros:', error);
        throw error;
    }
});
/**
 * Obtiene un resumen de lucros agrupados por categoría
 */
const obtenerResumenPorCategoria = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filtros = {}) {
    try {
        // Obtener todos los lucros con los filtros
        const lucros = yield obtenerLucros(filtros);
        // Crear un mapa para agrupar por categoría
        const categorias = {};
        lucros.forEach(lucro => {
            const nombreOperadora = obtenerNombreOperadora(lucro.operadora);
            const nombreServicio = obtenerNombreServicio(lucro.servicio);
            const categoriaKey = `${nombreOperadora} - ${nombreServicio}`;
            if (!categorias[categoriaKey]) {
                categorias[categoriaKey] = {
                    categoria: categoriaKey,
                    monto: 0,
                    lucro: 0
                };
            }
            categorias[categoriaKey].monto += parseFloat(lucro.monto);
            categorias[categoriaKey].lucro += parseFloat(lucro.lucro);
        });
        // Convertir el mapa a un array y ordenar por lucro (mayor a menor)
        return Object.values(categorias).sort((a, b) => b.lucro - a.lucro);
    }
    catch (error) {
        console.error('Error al obtener resumen por categoría:', error);
        throw error;
    }
});
/**
 * Funciones de utilidad para nombres legibles
 */
const obtenerNombreOperadora = (operadora) => {
    const nombres = {
        tigo: 'Tigo',
        personal: 'Personal',
        claro: 'Claro',
        aquiPago: 'Aquí Pago',
        wepaGuaranies: 'Wepa Guaraníes',
        wepaDolares: 'Wepa Dólares'
    };
    return nombres[operadora] || operadora;
};
const obtenerNombreServicio = (servicio) => {
    const nombres = {
        miniCarga: 'Mini Carga',
        maxiCarga: 'Maxi Carga',
        recargaClaro: 'Recarga',
        girosEnviados: 'Giros Enviados',
        retiros: 'Retiros',
        cargaBilleteras: 'Carga de Billeteras',
        pagos: 'Pagos'
    };
    return nombres[servicio] || servicio;
};
/**
 * Genera datos para exportación a Excel
 */
const generarDatosExcel = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filtros = {}) {
    try {
        // Obtener los lucros con los filtros aplicados
        const lucros = yield obtenerLucros(filtros);
        // Mapear los datos para la exportación
        const datosExcel = lucros.map(lucro => ({
            Fecha: new Date(lucro.fecha).toLocaleDateString('es-PY'),
            Operadora: obtenerNombreOperadora(lucro.operadora),
            Servicio: obtenerNombreServicio(lucro.servicio),
            'Monto (Gs)': parseFloat(lucro.monto),
            'Porcentaje (%)': parseFloat(lucro.porcentaje),
            'Lucro (Gs)': parseFloat(lucro.lucro),
            Usuario: lucro.usuario || 'N/A',
            Sucursal: lucro.sucursal || 'N/A'
        }));
        return datosExcel;
    }
    catch (error) {
        console.error('Error al generar datos para Excel:', error);
        throw error;
    }
});
module.exports = {
    obtenerMovimientosParaLucro,
    calcularLucrosDesdeMovimientos,
    calcularYGuardarLucros,
    obtenerLucros,
    obtenerResumenPorCategoria,
    generarDatosExcel
};
//# sourceMappingURL=lucroService.js.map