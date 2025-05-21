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
exports.getOperacionesBancariasByCaja = exports.getPagosByCaja = exports.getRetirosByCaja = exports.agregarComprobante = exports.agregarMovimiento = exports.cerrarCaja = exports.abrirCaja = exports.getCajaById = exports.getCajasBySucursal = exports.getCajas = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Obtener todas las cajas
const getCajas = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cajas = yield prisma.caja.findMany({
            include: {
                sucursal: true,
                usuario: true,
                maletin: true
            },
            orderBy: {
                fechaApertura: 'desc'
            }
        });
        // Convertir datos de Prisma a formato esperado por el frontend
        const cajasFormateadas = cajas.map(caja => ({
            id: caja.id,
            sucursalId: caja.sucursalId.toString(),
            sucursal: {
                id: caja.sucursal.id.toString(),
                nombre: caja.sucursal.nombre,
                codigo: caja.sucursal.codigo,
                direccion: caja.sucursal.direccion,
                telefono: caja.sucursal.telefono,
                email: caja.sucursal.email || ''
            },
            usuarioId: caja.usuarioId.toString(),
            usuario: caja.usuario.nombre,
            maletinId: caja.maletinId.toString(),
            fechaApertura: caja.fechaApertura.toISOString(),
            fechaCierre: caja.fechaCierre ? caja.fechaCierre.toISOString() : null,
            estado: caja.estado,
            saldoInicial: caja.detallesDenominacion ? JSON.parse(caja.detallesDenominacion.toString()) : null,
            saldosServiciosInicial: caja.servicios ? JSON.parse(caja.servicios.toString()) : [],
            saldoFinal: null, // Esto debería cargarse de otra tabla o campo
            saldosServiciosFinal: null, // Esto debería cargarse de otra tabla o campo
            createdAt: caja.createdAt.toISOString(),
            updatedAt: caja.updatedAt.toISOString()
        }));
        return res.json(cajasFormateadas);
    }
    catch (error) {
        console.error('Error al obtener cajas:', error);
        return res.status(500).json({ error: 'Error al obtener las cajas' });
    }
});
exports.getCajas = getCajas;
// Obtener las cajas de una sucursal específica
const getCajasBySucursal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sucursalId } = req.params;
    try {
        // Consultar las cajas de la sucursal en la base de datos
        const cajas = yield prisma.caja.findMany({
            where: {
                sucursalId: parseInt(sucursalId)
            },
            include: {
                sucursal: true,
                usuario: true,
                maletin: true
            },
            orderBy: {
                fechaApertura: 'desc'
            }
        });
        if (cajas.length === 0) {
            return res.json([]);
        }
        // Convertir datos de Prisma a formato esperado por el frontend
        const cajasFormateadas = cajas.map(caja => ({
            id: caja.id,
            sucursalId: caja.sucursalId.toString(),
            sucursal: {
                id: caja.sucursal.id.toString(),
                nombre: caja.sucursal.nombre,
                codigo: caja.sucursal.codigo,
                direccion: caja.sucursal.direccion,
                telefono: caja.sucursal.telefono,
                email: caja.sucursal.email || ''
            },
            usuarioId: caja.usuarioId.toString(),
            usuario: caja.usuario.nombre,
            maletinId: caja.maletinId.toString(),
            fechaApertura: caja.fechaApertura.toISOString(),
            fechaCierre: caja.fechaCierre ? caja.fechaCierre.toISOString() : null,
            estado: caja.estado,
            saldoInicial: caja.detallesDenominacion ? JSON.parse(caja.detallesDenominacion.toString()) : null,
            saldosServiciosInicial: caja.servicios ? JSON.parse(caja.servicios.toString()) : [],
            saldoFinal: null, // Esto debería cargarse de otra tabla o campo
            saldosServiciosFinal: null, // Esto debería cargarse de otra tabla o campo
            createdAt: caja.createdAt.toISOString(),
            updatedAt: caja.updatedAt.toISOString()
        }));
        return res.json(cajasFormateadas);
    }
    catch (error) {
        console.error(`Error al obtener cajas de sucursal ${sucursalId}:`, error);
        return res.status(500).json({ error: 'Error al obtener las cajas de la sucursal' });
    }
});
exports.getCajasBySucursal = getCajasBySucursal;
// Obtener una caja por ID
const getCajaById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Consultar la caja en la base de datos
        const caja = yield prisma.caja.findUnique({
            where: { id },
            include: {
                sucursal: true,
                usuario: true,
                maletin: true
            }
        });
        if (!caja) {
            return res.status(404).json({ error: 'Caja no encontrada' });
        }
        // Convertir los datos de Prisma al formato esperado por el frontend
        const cajaFormateada = {
            id: caja.id,
            sucursalId: caja.sucursalId.toString(),
            sucursal: {
                id: caja.sucursal.id.toString(),
                nombre: caja.sucursal.nombre,
                codigo: caja.sucursal.codigo,
                direccion: caja.sucursal.direccion,
                telefono: caja.sucursal.telefono,
                email: caja.sucursal.email || ''
            },
            usuarioId: caja.usuarioId.toString(),
            usuario: caja.usuario.nombre,
            maletinId: caja.maletinId.toString(),
            fechaApertura: caja.fechaApertura.toISOString(),
            fechaCierre: caja.fechaCierre ? caja.fechaCierre.toISOString() : null,
            estado: caja.estado,
            saldoInicial: caja.detallesDenominacion ? JSON.parse(caja.detallesDenominacion.toString()) : null,
            saldosServiciosInicial: caja.servicios ? JSON.parse(caja.servicios.toString()) : [],
            saldoFinal: null, // Esto debería cargarse de otra tabla o campo
            saldosServiciosFinal: null, // Esto debería cargarse de otra tabla o campo
            createdAt: caja.createdAt.toISOString(),
            updatedAt: caja.updatedAt.toISOString()
        };
        return res.json(cajaFormateada);
    }
    catch (error) {
        console.error(`Error al obtener caja ${id}:`, error);
        return res.status(500).json({ error: 'Error al obtener la caja' });
    }
});
exports.getCajaById = getCajaById;
// Abrir una nueva caja
const abrirCaja = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sucursalId, usuarioId, maletinId, saldoInicial, saldosServiciosInicial } = req.body;
    try {
        // Verificar datos requeridos
        if (!sucursalId || !usuarioId || !maletinId || !saldoInicial || !saldosServiciosInicial) {
            return res.status(400).json({ error: 'Faltan datos requeridos para abrir la caja' });
        }
        // Verificar si existe la sucursal
        const sucursal = yield prisma.sucursal.findUnique({
            where: { id: parseInt(sucursalId) }
        });
        if (!sucursal) {
            return res.status(404).json({ error: 'Sucursal no encontrada' });
        }
        // Verificar si el maletín ya está en uso en una caja abierta
        const maletinEnUso = yield prisma.caja.findFirst({
            where: {
                maletinId: parseInt(maletinId),
                estado: 'abierta'
            }
        });
        if (maletinEnUso) {
            return res.status(400).json({
                error: 'El maletín seleccionado ya está en uso por otra caja abierta',
                codigo: 'MALETIN_EN_USO'
            });
        }
        // Crear la nueva caja
        const nuevaCaja = yield prisma.caja.create({
            data: {
                sucursalId: parseInt(sucursalId),
                usuarioId: parseInt(usuarioId),
                maletinId: parseInt(maletinId),
                estado: 'abierta',
                fechaApertura: new Date(),
                saldoInicialPYG: saldoInicial.total.PYG || 0,
                saldoInicialBRL: saldoInicial.total.BRL || 0,
                saldoInicialUSD: saldoInicial.total.USD || 0,
                detallesDenominacion: JSON.stringify(saldoInicial),
                servicios: JSON.stringify(saldosServiciosInicial)
            },
            include: {
                sucursal: true,
                usuario: true,
                maletin: true
            }
        });
        // Convertir los datos de Prisma al formato esperado por el frontend
        const cajaFormateada = {
            id: nuevaCaja.id,
            sucursalId: nuevaCaja.sucursalId.toString(),
            sucursal: {
                id: nuevaCaja.sucursal.id.toString(),
                nombre: nuevaCaja.sucursal.nombre,
                codigo: nuevaCaja.sucursal.codigo,
                direccion: nuevaCaja.sucursal.direccion,
                telefono: nuevaCaja.sucursal.telefono,
                email: nuevaCaja.sucursal.email || ''
            },
            usuarioId: nuevaCaja.usuarioId.toString(),
            usuario: nuevaCaja.usuario.nombre,
            maletinId: nuevaCaja.maletinId.toString(),
            fechaApertura: nuevaCaja.fechaApertura.toISOString(),
            fechaCierre: nuevaCaja.fechaCierre ? nuevaCaja.fechaCierre.toISOString() : null,
            estado: nuevaCaja.estado,
            saldoInicial: saldoInicial,
            saldosServiciosInicial: saldosServiciosInicial,
            createdAt: nuevaCaja.createdAt.toISOString(),
            updatedAt: nuevaCaja.updatedAt.toISOString()
        };
        return res.status(201).json(cajaFormateada);
    }
    catch (error) {
        console.error('Error al abrir caja:', error);
        return res.status(500).json({ error: 'Error al abrir la caja', details: String(error) });
    }
});
exports.abrirCaja = abrirCaja;
// Cerrar una caja
const cerrarCaja = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { saldoFinal, saldosServiciosFinal } = req.body;
    try {
        // Verificar datos requeridos
        if (!saldoFinal || !saldosServiciosFinal) {
            return res.status(400).json({ error: 'Faltan datos requeridos para cerrar la caja' });
        }
        // Buscar la caja
        const caja = yield prisma.caja.findUnique({
            where: { id }
        });
        if (!caja) {
            return res.status(404).json({ error: 'Caja no encontrada' });
        }
        if (caja.estado === 'cerrada') {
            return res.status(400).json({ error: 'La caja ya está cerrada' });
        }
        // Actualizar la caja
        const cajaActualizada = yield prisma.caja.update({
            where: { id },
            data: {
                estado: 'cerrada',
                fechaCierre: new Date(),
                saldoFinalPYG: saldoFinal.total.PYG || 0,
                saldoFinalBRL: saldoFinal.total.BRL || 0,
                saldoFinalUSD: saldoFinal.total.USD || 0,
                detallesDenominacionFinal: JSON.stringify(saldoFinal),
                serviciosFinal: JSON.stringify(saldosServiciosFinal)
            },
            include: {
                sucursal: true,
                usuario: true,
                maletin: true
            }
        });
        // Convertir a formato esperado
        const cajaFormateada = {
            id: cajaActualizada.id,
            sucursalId: cajaActualizada.sucursalId.toString(),
            sucursal: {
                id: cajaActualizada.sucursal.id.toString(),
                nombre: cajaActualizada.sucursal.nombre,
                codigo: cajaActualizada.sucursal.codigo,
                direccion: cajaActualizada.sucursal.direccion,
                telefono: cajaActualizada.sucursal.telefono,
                email: cajaActualizada.sucursal.email || ''
            },
            usuarioId: cajaActualizada.usuarioId.toString(),
            usuario: cajaActualizada.usuario.nombre,
            maletinId: cajaActualizada.maletinId.toString(),
            fechaApertura: cajaActualizada.fechaApertura.toISOString(),
            fechaCierre: cajaActualizada.fechaCierre ? cajaActualizada.fechaCierre.toISOString() : null,
            estado: cajaActualizada.estado,
            saldoInicial: cajaActualizada.detallesDenominacion ? JSON.parse(cajaActualizada.detallesDenominacion.toString()) : null,
            saldosServiciosInicial: cajaActualizada.servicios ? JSON.parse(cajaActualizada.servicios.toString()) : [],
            saldoFinal: saldoFinal,
            saldosServiciosFinal: saldosServiciosFinal,
            createdAt: cajaActualizada.createdAt.toISOString(),
            updatedAt: cajaActualizada.updatedAt.toISOString()
        };
        return res.json(cajaFormateada);
    }
    catch (error) {
        console.error(`Error al cerrar caja ${id}:`, error);
        return res.status(500).json({ error: 'Error al cerrar la caja' });
    }
});
exports.cerrarCaja = cerrarCaja;
// Agregar un movimiento de servicio a una caja
const agregarMovimiento = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const datosMovimiento = req.body;
    try {
        // Verificar que exista la caja
        const caja = yield prisma.caja.findUnique({
            where: { id }
        });
        if (!caja) {
            return res.status(404).json({ error: 'Caja no encontrada' });
        }
        if (caja.estado !== 'abierta') {
            return res.status(400).json({ error: 'No se pueden agregar movimientos a una caja cerrada' });
        }
        // Validar estructura de los datos de movimientos
        if (!datosMovimiento) {
            return res.status(400).json({ error: 'Formato de datos inválido' });
        }
        // Transformamos el objeto de movimientos a un array de operadora/servicio/monto
        const movimientosArray = [];
        // Procesamos el objeto datosMovimiento que viene del frontend (VerMovimientosDialog)
        // El formato es { tigo: { miniCarga: 1000, ... }, personal: { ... } }
        Object.entries(datosMovimiento).forEach(([operadora, servicios]) => {
            if (typeof servicios === 'object' && servicios !== null) {
                Object.entries(servicios).forEach(([servicio, monto]) => {
                    // Solo agregamos movimientos con monto > 0
                    if (Number(monto) > 0) {
                        movimientosArray.push({
                            operadora,
                            servicio,
                            monto: Number(monto)
                        });
                    }
                });
            }
        });
        // Crear múltiples registros en MovimientoCaja
        const movimientosCreados = yield Promise.all(movimientosArray.map((movimiento) => __awaiter(void 0, void 0, void 0, function* () {
            return prisma.movimientoCaja.create({
                data: {
                    cajaId: id,
                    operadora: movimiento.operadora,
                    servicio: movimiento.servicio,
                    monto: movimiento.monto
                }
            });
        })));
        return res.status(201).json({
            mensaje: 'Movimientos agregados correctamente',
            movimientos: movimientosCreados
        });
    }
    catch (error) {
        console.error(`Error al agregar movimientos a caja ${id}:`, error);
        return res.status(500).json({ error: 'Error al agregar los movimientos' });
    }
});
exports.agregarMovimiento = agregarMovimiento;
// Agregar un comprobante a una caja
const agregarComprobante = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { tipo, url } = req.body;
    try {
        // Verificar si la caja existe
        const caja = yield prisma.caja.findUnique({
            where: { id }
        });
        if (!caja) {
            return res.status(404).json({ error: 'Caja no encontrada' });
        }
        // Verificar datos requeridos
        if (!tipo || !url) {
            return res.status(400).json({ error: 'Faltan datos requeridos para el comprobante' });
        }
        // Verificar que el tipo de comprobante sea válido
        const tiposValidos = [
            'minicargas', 'maxicargas', 'recargaClaro',
            'retirosTigoMoney', 'retirosBilleteraPersonal', 'retirosBilleteraClaro',
            'cargasBilleteraTigo', 'cargasBilleteraPersonal', 'cargasBilleteraClaro'
        ];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({ error: `Tipo de comprobante no válido. Debe ser uno de: ${tiposValidos.join(', ')}` });
        }
        // Para los comprobantes, almacenaremos las URLs en un campo JSON en la caja
        // Primero, obtenemos los comprobantes existentes (si los hay)
        let comprobantes = {};
        if (caja.servicios) {
            try {
                comprobantes = JSON.parse(caja.servicios.toString());
            }
            catch (e) {
                // Si hay error al parsear, iniciamos con un objeto vacío
                comprobantes = {};
            }
        }
        // Actualizamos el comprobante según su tipo
        comprobantes[tipo] = url;
        // Actualizamos la caja con los nuevos comprobantes
        const cajaActualizada = yield prisma.caja.update({
            where: { id },
            data: {
                servicios: JSON.stringify(comprobantes)
            },
            include: {
                sucursal: true,
                usuario: true,
                maletin: true
            }
        });
        // Convertir a formato esperado
        const cajaFormateada = {
            id: cajaActualizada.id,
            sucursalId: cajaActualizada.sucursalId.toString(),
            sucursal: {
                id: cajaActualizada.sucursal.id.toString(),
                nombre: cajaActualizada.sucursal.nombre,
                codigo: cajaActualizada.sucursal.codigo,
                direccion: cajaActualizada.sucursal.direccion,
                telefono: cajaActualizada.sucursal.telefono,
                email: cajaActualizada.sucursal.email || ''
            },
            usuarioId: cajaActualizada.usuarioId.toString(),
            usuario: cajaActualizada.usuario.nombre,
            maletinId: cajaActualizada.maletinId.toString(),
            fechaApertura: cajaActualizada.fechaApertura.toISOString(),
            fechaCierre: cajaActualizada.fechaCierre ? cajaActualizada.fechaCierre.toISOString() : null,
            estado: cajaActualizada.estado,
            saldoInicial: cajaActualizada.detallesDenominacion ? JSON.parse(cajaActualizada.detallesDenominacion.toString()) : null,
            saldosServiciosInicial: cajaActualizada.servicios ? JSON.parse(cajaActualizada.servicios.toString()) : [],
            comprobantes,
            createdAt: cajaActualizada.createdAt.toISOString(),
            updatedAt: cajaActualizada.updatedAt.toISOString()
        };
        return res.json(cajaFormateada);
    }
    catch (error) {
        console.error(`Error al agregar comprobante a caja ${id}:`, error);
        return res.status(500).json({ error: 'Error al agregar el comprobante' });
    }
});
exports.agregarComprobante = agregarComprobante;
// Obtener los retiros de una caja
const getRetirosByCaja = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Verificar si la caja existe
        const caja = yield prisma.caja.findUnique({
            where: { id }
        });
        if (!caja) {
            return res.status(404).json({ error: 'Caja no encontrada' });
        }
        // Buscar los retiros asociados a esta caja
        const retiros = yield prisma.movimiento.findMany({
            where: {
                cajaId: id,
                tipoMovimiento: 'EGRESO'
            },
            orderBy: {
                fecha: 'desc'
            }
        });
        // Formatear los retiros para el frontend
        const retirosFormateados = retiros.map(retiro => ({
            id: retiro.id,
            fecha: retiro.fecha.toISOString(),
            personaNombre: retiro.nombrePersona || '',
            montoPYG: retiro.moneda === 'PYG' ? Number(retiro.monto) : 0,
            montoBRL: retiro.moneda === 'BRL' ? Number(retiro.monto) : 0,
            montoUSD: retiro.moneda === 'USD' ? Number(retiro.monto) : 0,
            observacion: retiro.observaciones || ''
        }));
        return res.json(retirosFormateados);
    }
    catch (error) {
        console.error(`Error al obtener retiros de caja ${id}:`, error);
        return res.status(500).json({ error: 'Error al obtener los retiros' });
    }
});
exports.getRetirosByCaja = getRetirosByCaja;
// Obtener los pagos de una caja
const getPagosByCaja = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Verificar si la caja existe
        const caja = yield prisma.caja.findUnique({
            where: { id }
        });
        if (!caja) {
            return res.status(404).json({ error: 'Caja no encontrada' });
        }
        // Buscar los pagos asociados a esta caja (movimientos con tipo PAGO)
        const pagos = yield prisma.movimientoCaja.findMany({
            where: {
                cajaId: id,
                servicio: { contains: 'pago', mode: 'insensitive' }
            },
            orderBy: {
                fecha: 'desc'
            }
        });
        // Formatear los pagos para el frontend
        const pagosFormateados = pagos.map(pago => ({
            id: pago.id,
            fecha: pago.fecha.toISOString(),
            operadora: pago.operadora,
            servicio: pago.servicio,
            monto: Number(pago.monto),
            moneda: 'PYG', // Asumimos que todos los pagos son en guaraníes
            observacion: ''
        }));
        return res.json(pagosFormateados);
    }
    catch (error) {
        console.error(`Error al obtener pagos de caja ${id}:`, error);
        return res.status(500).json({ error: 'Error al obtener los pagos' });
    }
});
exports.getPagosByCaja = getPagosByCaja;
// Obtener las operaciones bancarias de una caja
const getOperacionesBancariasByCaja = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Verificar si la caja existe
        const caja = yield prisma.caja.findUnique({
            where: { id }
        });
        if (!caja) {
            return res.status(404).json({ error: 'Caja no encontrada' });
        }
        // Por ahora, devolvemos un array vacío ya que no tenemos tabla de operaciones bancarias
        // En el futuro, aquí buscaríamos operaciones bancarias asociadas a la caja
        return res.json([]);
    }
    catch (error) {
        console.error(`Error al obtener operaciones bancarias de caja ${id}:`, error);
        return res.status(500).json({ error: 'Error al obtener las operaciones bancarias' });
    }
});
exports.getOperacionesBancariasByCaja = getOperacionesBancariasByCaja;
//# sourceMappingURL=caja.controller.nuevo.js.map