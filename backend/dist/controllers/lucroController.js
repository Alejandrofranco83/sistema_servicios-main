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
const lucroService = require('../services/lucroService');
const exceljs = require('exceljs');
/**
 * Obtener todos los lucros con posibilidad de filtrado
 */
const obtenerLucros = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extraer los parámetros de consulta
        const { fechaDesde, fechaHasta, usuarioId, sucursalId, operadora, servicio, busqueda } = req.query;
        // Crear objeto de filtros
        const filtros = {
            fechaDesde,
            fechaHasta,
            usuarioId,
            sucursalId,
            operadora,
            servicio,
            busqueda
        };
        // Obtener los lucros
        const lucros = yield lucroService.obtenerLucros(filtros);
        // Calcular totales
        const totalMovimientos = lucros.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
        const totalLucro = lucros.reduce((acc, curr) => acc + parseFloat(curr.lucro), 0);
        const porcentajePromedio = totalMovimientos > 0 ? (totalLucro / totalMovimientos) * 100 : 0;
        res.status(200).json({
            success: true,
            data: lucros,
            resumen: {
                totalMovimientos,
                totalLucro,
                porcentajePromedio
            }
        });
    }
    catch (error) {
        console.error('Error al obtener lucros:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos de lucro',
            message: error.message
        });
    }
});
/**
 * Obtener resumen por categoría
 */
const obtenerResumenPorCategoria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extraer los parámetros de consulta
        const { fechaDesde, fechaHasta, usuarioId, sucursalId, operadora, servicio, busqueda } = req.query;
        // Crear objeto de filtros
        const filtros = {
            fechaDesde,
            fechaHasta,
            usuarioId,
            sucursalId,
            operadora,
            servicio,
            busqueda
        };
        // Obtener el resumen por categoría
        const resumen = yield lucroService.obtenerResumenPorCategoria(filtros);
        // Calcular totales
        const totalMovimientos = resumen.reduce((acc, curr) => acc + curr.monto, 0);
        const totalLucro = resumen.reduce((acc, curr) => acc + curr.lucro, 0);
        res.status(200).json({
            success: true,
            data: resumen,
            resumen: {
                totalMovimientos,
                totalLucro
            }
        });
    }
    catch (error) {
        console.error('Error al obtener resumen por categoría:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el resumen por categoría',
            message: error.message
        });
    }
});
/**
 * Calcular lucros al vuelo desde movimientos de caja
 */
const calcularLucros = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extraer los parámetros de consulta
        const { fechaDesde, fechaHasta, usuarioId, sucursalId, operadora, servicio, busqueda } = req.query;
        // Crear objeto de filtros
        const filtros = {
            fechaDesde,
            fechaHasta,
            usuarioId,
            sucursalId,
            operadora,
            servicio,
            busqueda
        };
        // Obtener movimientos de caja
        const movimientos = yield lucroService.obtenerMovimientosParaLucro(filtros);
        // Calcular lucros sin guardar en la base de datos
        const lucros = lucroService.calcularLucrosDesdeMovimientos(movimientos);
        // Calcular totales
        const totalMovimientos = lucros.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
        const totalLucro = lucros.reduce((acc, curr) => acc + parseFloat(curr.lucro), 0);
        const porcentajePromedio = totalMovimientos > 0 ? (totalLucro / totalMovimientos) * 100 : 0;
        res.status(200).json({
            success: true,
            data: lucros,
            resumen: {
                totalMovimientos,
                totalLucro,
                porcentajePromedio
            }
        });
    }
    catch (error) {
        console.error('Error al calcular lucros:', error);
        res.status(500).json({
            success: false,
            error: 'Error al calcular los lucros',
            message: error.message
        });
    }
});
/**
 * Calcular y guardar lucros en la base de datos
 */
const calcularYGuardarLucros = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extraer los parámetros de consulta
        const { fechaDesde, fechaHasta, usuarioId, sucursalId, operadora, servicio } = req.query;
        // Crear objeto de filtros
        const filtros = {
            fechaDesde,
            fechaHasta,
            usuarioId,
            sucursalId,
            operadora,
            servicio
        };
        // Calcular y guardar lucros
        const lucros = yield lucroService.calcularYGuardarLucros(filtros);
        res.status(200).json({
            success: true,
            message: 'Lucros calculados y guardados correctamente',
            count: lucros.length
        });
    }
    catch (error) {
        console.error('Error al calcular y guardar lucros:', error);
        res.status(500).json({
            success: false,
            error: 'Error al calcular y guardar lucros',
            message: error.message
        });
    }
});
/**
 * Exportar lucros a Excel
 */
const exportarExcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extraer los parámetros de consulta
        const { fechaDesde, fechaHasta, usuarioId, sucursalId, operadora, servicio, busqueda } = req.query;
        // Crear objeto de filtros
        const filtros = {
            fechaDesde,
            fechaHasta,
            usuarioId,
            sucursalId,
            operadora,
            servicio,
            busqueda
        };
        // Obtener datos para Excel
        const datosExcel = yield lucroService.generarDatosExcel(filtros);
        // Crear un nuevo libro de Excel
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Lucros');
        // Definir encabezados
        worksheet.columns = [
            { header: 'Fecha', key: 'Fecha', width: 15 },
            { header: 'Operadora', key: 'Operadora', width: 15 },
            { header: 'Servicio', key: 'Servicio', width: 20 },
            { header: 'Monto (Gs)', key: 'Monto (Gs)', width: 15, style: { numFmt: '#,##0' } },
            { header: 'Porcentaje (%)', key: 'Porcentaje (%)', width: 15, style: { numFmt: '0.00' } },
            { header: 'Lucro (Gs)', key: 'Lucro (Gs)', width: 15, style: { numFmt: '#,##0' } },
            { header: 'Usuario', key: 'Usuario', width: 20 },
            { header: 'Sucursal', key: 'Sucursal', width: 20 },
        ];
        // Agregar datos
        worksheet.addRows(datosExcel);
        // Aplicar estilos a los encabezados
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };
        // Calcular totales
        const totalMovimientos = datosExcel.reduce((acc, curr) => acc + curr['Monto (Gs)'], 0);
        const totalLucro = datosExcel.reduce((acc, curr) => acc + curr['Lucro (Gs)'], 0);
        // Agregar fila de totales
        worksheet.addRow([
            'TOTAL', '', '', totalMovimientos, '', totalLucro, '', ''
        ]);
        // Aplicar estilo a la fila de totales
        const totalRow = worksheet.lastRow;
        totalRow.font = { bold: true };
        // Configurar respuesta para descarga
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=lucros.xlsx');
        // Enviar archivo
        yield workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error('Error al exportar a Excel:', error);
        res.status(500).json({
            success: false,
            error: 'Error al exportar los datos a Excel',
            message: error.message
        });
    }
});
module.exports = {
    obtenerLucros,
    obtenerResumenPorCategoria,
    calcularLucros,
    calcularYGuardarLucros,
    exportarExcel
};
//# sourceMappingURL=lucroController.js.map