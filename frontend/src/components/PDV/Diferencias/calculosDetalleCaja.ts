import axios from 'axios';
import {
    ComparacionEnCaja,
    // Quitar DiferenciaServicioSimple si no se usa
    // DiferenciaServicio as DiferenciaServicioSimple
} from '../../../interfaces/diferencias';
import cotizacionService from '../../../services/cotizacionService';
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

// --- Interfaces (Mantenidas y Añadidas) ---

// Interfaz para SaldoMoneda (si no está ya importable)
interface SaldoMoneda {
    PYG: number;
    BRL: number;
    USD: number;
}

// Interfaz para SaldoServicio (si no está ya importable)
interface SaldoServicio {
    servicio: string;
    monto: number;
}

// Interfaz simplificada para la respuesta de /api/cajas/{id}
// Ajustar según la estructura real de la API
interface CajaCompleta {
    id: string;
    fechaApertura: string;
    saldoInicial?: { total?: SaldoMoneda };
    saldoFinal?: { total?: SaldoMoneda };
    saldosServiciosInicial?: SaldoServicio[];
    saldosServiciosFinal?: SaldoServicio[];
    // Añadir otros campos si son necesarios para el cálculo
}


interface MovimientoData {
    tigo?: {
        miniCarga?: number;
        girosEnviados?: number;
        retiros?: number;
        cargaBilleteras?: number;
    };
    personal?: {
        maxiCarga?: number;
        girosEnviados?: number;
        retiros?: number;
        cargaBilleteras?: number;
    };
    claro?: {
        recargaClaro?: number;
        girosEnviados?: number;
        retiros?: number;
        cargaBilleteras?: number;
    };
    aquiPago?: {
        pagos?: number;
        retiros?: number;
    };
    wepaGuaranies?: {
        pagos?: number;
        retiros?: number;
    };
    wepaDolares?: {
        pagos?: string | number; // Permitir string o number
        retiros?: string | number; // Permitir string o number
    };
    [key: string]: any;
}

interface Pago {
    id: string;
    operadora: string;
    servicio: string;
    monto: number;
    moneda: string;
    observacion: string | null;
    rutaComprobante: string | null;
    fecha: string;
    // No tiene estado
}

interface PagoServicio {
    id: number;
    cajaId: string;
    operadora: string;
    servicio: string;
    monto: number;
    moneda: string;
    observacion: string | null;
    rutaComprobante: string | null;
    estado: string; // Asegurar que esta propiedad esté
    fechaCreacion: string;
    fechaActualizacion: string;
}

interface Retiro {
    montoPYG: number;
    montoBRL: number;
    montoUSD: number;
}

interface OperacionBancaria {
    id: number;
    cajaId: string;
    tipo: string;
    monto: number | string; // Adaptar si puede ser string
    tipoServicio: string | null;
    fecha: string;
    usuario: string;
}

interface Cotizacion {
    valorReal: number;
    valorDolar: number;
}

// Interfaz para los detalles calculados de las diferencias por servicio
interface DiferenciaServicioDetallada {
    servicio: string;
    montoInicial: number;
    montoFinal: number;
    montoMovimiento?: number;
    montoPagos?: number;
    diferencia: number;
    pagosDesdeCaja?: number;
    pagosServiciosPendientes?: number;
    pagosConComision?: number;
}

// Resultado de la función principal
export interface ResultadoCalculoDetalle {
    diferenciaTotal: number;
    diferenciasServicios: DiferenciaServicioDetallada[];
    cotizacionUsada: Cotizacion | null; // Incluir cotización usada
}

// --- Lógica de Cálculo (Adaptada y Completada) ---

const mapeoServicioMovimiento: { [key: string]: { operadora: string; servicio: string } } = {
    'Minicarga': { operadora: 'tigo', servicio: 'miniCarga' },
    'Mini Carga': { operadora: 'tigo', servicio: 'miniCarga' },
    'MINICARGA': { operadora: 'tigo', servicio: 'miniCarga' },
    'Tigo Money': { operadora: 'tigo', servicio: 'retiros' }, // El movimiento se calcula diferente
    'TIGO MONEY': { operadora: 'tigo', servicio: 'retiros' },
    'Maxicarga': { operadora: 'personal', servicio: 'maxiCarga' },
    'Maxi Carga': { operadora: 'personal', servicio: 'maxiCarga' },
    'MAXICARGA': { operadora: 'personal', servicio: 'maxiCarga' },
    'Billetera Personal': { operadora: 'personal', servicio: 'cargaBilleteras' }, // El movimiento se calcula diferente
    'BILLETERA PERSONAL': { operadora: 'personal', servicio: 'cargaBilleteras' },
    'Recarga Claro': { operadora: 'claro', servicio: 'recargaClaro' },
    'RECARGA CLARO': { operadora: 'claro', servicio: 'recargaClaro' },
    'Billetera Claro': { operadora: 'claro', servicio: 'cargaBilleteras' }, // El movimiento se calcula diferente
    'BILLETERA CLARO': { operadora: 'claro', servicio: 'cargaBilleteras' }
};

const obtenerMontoMovimiento = (servicio: string, movimientosData: MovimientoData): number => {
    const servicioUpper = servicio.toUpperCase();

    if (servicioUpper === 'TIGO MONEY') {
      const girosEnviados = (movimientosData.tigo?.girosEnviados || 0);
      const retiros = (movimientosData.tigo?.retiros || 0);
      const cargaBilleteras = (movimientosData.tigo?.cargaBilleteras || 0);
      return girosEnviados + cargaBilleteras - retiros;
    } else if (servicioUpper === 'BILLETERA PERSONAL') {
      const girosEnviados = (movimientosData.personal?.girosEnviados || 0);
      const retiros = (movimientosData.personal?.retiros || 0);
      const cargaBilleteras = (movimientosData.personal?.cargaBilleteras || 0);
      return girosEnviados + cargaBilleteras - retiros;
    } else if (servicioUpper === 'BILLETERA CLARO') {
      const girosEnviados = (movimientosData.claro?.girosEnviados || 0);
      const retiros = (movimientosData.claro?.retiros || 0);
      const cargaBilleteras = (movimientosData.claro?.cargaBilleteras || 0);
      return girosEnviados + cargaBilleteras - retiros;
    } else {
      const mapeo = mapeoServicioMovimiento[servicio]; // Usar nombre original para buscar
      if (!mapeo) return 0;
      const { operadora, servicio: tipoServicio } = mapeo;
      if (!movimientosData[operadora]) return 0;
      return Number(movimientosData[operadora][tipoServicio]) || 0;
    }
};

// Función para obtener monto de pagos (Adaptada de DetalleDialog)
const obtenerMontoPagos = (nombreServicio: string, todosPagosServicios: PagoServicio[]): number => {
    if (!todosPagosServicios || !Array.isArray(todosPagosServicios) || todosPagosServicios.length === 0) {
        return 0;
    }

    const mapeo = mapeoServicioMovimiento[nombreServicio];
    if (!mapeo) return 0;

    const { operadora, servicio } = mapeo;
    const operadoraLower = operadora.toLowerCase();
    const servicioLower = servicio.toLowerCase();
    let terminosBusqueda: string[] = [];

    if (servicioLower === 'minicarga') terminosBusqueda = ['mini carga', 'minicarga'];
    else if (servicioLower === 'maxicarga') terminosBusqueda = ['maxi carga', 'maxicarga'];
    else if (servicioLower === 'recargaclaro') terminosBusqueda = ['recarga claro', 'recargaclaro', 'recargas', 'recarga'];
    else if (nombreServicio.toUpperCase() === 'TIGO MONEY') terminosBusqueda = ['billetera', 'billeteras', 'tigo money'];
    else if (nombreServicio.toUpperCase() === 'BILLETERA PERSONAL') terminosBusqueda = ['billetera personal', 'billetera', 'personal'];
    else if (nombreServicio.toUpperCase() === 'BILLETERA CLARO') terminosBusqueda = ['billetera claro', 'billetera', 'claro'];
    else terminosBusqueda = [servicioLower];

    const pagosFiltrados = todosPagosServicios.filter((p: PagoServicio) => {
        const pagoOperadora = p.operadora.toLowerCase();
        const pagoServicio = p.servicio.toLowerCase();

        if (operadoraLower === 'claro' && servicioLower === 'recargaclaro') {
            return pagoOperadora.includes('claro') && (pagoServicio.includes('recarga') || pagoServicio.includes('recargas'));
        }
        if (nombreServicio.toUpperCase() === 'TIGO MONEY') {
            return pagoOperadora.includes('tigo') && (pagoServicio.includes('billetera') || pagoServicio.includes('tigo money'));
        }
        if (nombreServicio.toUpperCase() === 'BILLETERA PERSONAL') {
            return pagoOperadora.includes('personal') && (pagoServicio.includes('billetera') || pagoServicio.includes('personal'));
        }
        if (nombreServicio.toUpperCase() === 'BILLETERA CLARO') {
            return pagoOperadora.includes('claro') && (pagoServicio.includes('billetera') || pagoServicio.includes('claro'));
        }
        if (pagoOperadora !== operadoraLower && !pagoOperadora.includes(operadoraLower)) {
            return false;
        }
        return terminosBusqueda.some(termino => pagoServicio.includes(termino));
    });

    const totalPagosSinComision = pagosFiltrados.reduce((sum: number, pago: PagoServicio) => {
        const montoNumerico = Number(pago.monto) || 0;
        return sum + montoNumerico;
    }, 0);

    const esTigoMoney = nombreServicio.toUpperCase() === 'TIGO MONEY';
    const esBilleteraPersonal = nombreServicio.toUpperCase() === 'BILLETERA PERSONAL';
    const esBilleteraClaro = nombreServicio.toUpperCase() === 'BILLETERA CLARO';
    const sinComision = esTigoMoney || esBilleteraPersonal || esBilleteraClaro;

    // Retornar la suma de pagos SIN comisión para el cálculo de servicios.
    // La comisión se aplicará LUEGO en el cálculo específico si corresponde.
    return totalPagosSinComision;
};


// --- Función Principal Exportada (Implementación Opción B) ---

export const calcularDetalleDiferencias = async (
    cajaInfoBasica: ComparacionEnCaja // Recibe la info básica como antes
): Promise<ResultadoCalculoDetalle> => {

    const cajaId = cajaInfoBasica.id;
    const fechaApertura = cajaInfoBasica.fechaApertura;

    if (!cajaId || !fechaApertura) {
        throw new Error("ID de caja o fecha de apertura faltantes.");
    }

    try {
        console.log(`Calculando detalle COMPLETO para Caja ID: ${cajaId}`);

        // 1. Obtener Cotización (igual que antes)
        let cotizacion: Cotizacion | null = null;
        try {
            const fechaAperturaStr = fechaApertura.substring(0, 10);
            cotizacion = await cotizacionService.getCotizacionByFecha(fechaAperturaStr);
            console.log(`Cotización obtenida para fecha ${fechaAperturaStr}:`, cotizacion);
        } catch (error) {
            console.error('Error al cargar cotización, usando fallback 0:', error);
            cotizacion = { valorReal: 0, valorDolar: 0 };
        }
        const cotizacionBRL = cotizacion.valorReal;
        const cotizacionUSD = cotizacion.valorDolar;

        // 2. Obtener Datos Adicionales en Paralelo (Incluyendo Caja Completa Y NUEVO ENDPOINT)
        const [
            resCajaCompleta,
            resDatosCierre, // <--- NUEVA LLAMADA
            resMovimientos,
            resPagosServicios,
            resPagosCaja,
            resRetiros,
            resOperacionesBancarias
        ] = await Promise.all([
            axios.get<CajaCompleta>(`${process.env.REACT_APP_API_URL}/cajas/${cajaId}`),
            axios.get<any>(`${process.env.REACT_APP_API_URL}/cajas/${cajaId}/datos-cierre`), // <-- NUEVA LLAMADA (usar any por ahora)
            axios.get<{ data: MovimientoData }>(`${process.env.REACT_APP_API_URL}/cajas/${cajaId}/movimiento`),
            axios.get<PagoServicio[]>(`${process.env.REACT_APP_API_URL}/pagos-servicios?cajaId=${cajaId}`),
            axios.get<Pago[]>(`${process.env.REACT_APP_API_URL}/cajas/${cajaId}/pagos`),
            axios.get<Retiro[]>(`${process.env.REACT_APP_API_URL}/cajas/${cajaId}/retiros`),
            axios.get<OperacionBancaria[]>(`${process.env.REACT_APP_API_URL}/operaciones-bancarias/caja/${cajaId}`),
        ]);

        const cajaCompleta = resCajaCompleta.data;
        const datosCierre = resDatosCierre.data; // <--- Guardar respuesta
        const movimientos = resMovimientos.data?.data || {};
        const todosPagosServicios = resPagosServicios.data || [];
        const pagosCaja = resPagosCaja.data || [];
        const retiros = resRetiros.data || [];
        const operacionesBancarias = resOperacionesBancarias.data || [];

        console.log("Datos completos cargados:", { cajaCompleta, movimientos, todosPagosServicios, pagosCaja, retiros, operacionesBancarias });
        // Log adicional para depurar la estructura de cajaCompleta
        console.log("Estructura recibida de cajaCompleta (/cajas/{id}):", JSON.stringify(cajaCompleta, null, 2));
        // Log para la nueva respuesta
        console.log("Estructura recibida de datosCierre (/cajas/{id}/datos-cierre):", JSON.stringify(datosCierre, null, 2));

        // Extraer saldos necesarios (Intentar usar datosCierre si existen)
        const saldoInicial = cajaCompleta?.saldoInicial?.total;
        // Usar saldoFinal de datosCierre si existe, si no, el de cajaCompleta (que podría ser null)
        const saldoFinal = datosCierre?.saldoFinal?.total ?? cajaCompleta?.saldoFinal?.total;
        // Usar saldosServiciosFinal de datosCierre si existe, si no, el de cajaCompleta
        const serviciosIniciales = cajaCompleta.saldosServiciosInicial || []; // Mantenemos el de cajaCompleta
        const serviciosFinales = datosCierre?.saldosServiciosFinal ?? cajaCompleta.saldosServiciosFinal ?? []; // Usar el nuevo endpoint como prioridad

        // Verificar que tenemos los saldos INICIALES Y FINALES para continuar
        if (!saldoInicial || !saldoFinal) {
            console.error("Datos de saldoInicial o saldoFinal faltantes o incompletos en las respuestas de API:", { saldoInicial, saldoFinal });
            throw new Error(`Faltan saldos iniciales y/o finales en las respuestas de /api/cajas/${cajaId} o /api/cajas/${cajaId}/datos-cierre`);
        }

        // 3. Calcular Diferencias de Servicios (Lógica de DetalleDialog adaptada)
        const serviciosMap = new Map<string, DiferenciaServicioDetallada>();

        serviciosIniciales.forEach((servicio: { servicio: string; monto: number }) => {
            serviciosMap.set(servicio.servicio, {
                servicio: servicio.servicio,
                montoInicial: servicio.monto,
                montoFinal: 0, // Se actualizará después
                montoMovimiento: obtenerMontoMovimiento(servicio.servicio, movimientos),
                montoPagos: 0, // Se actualizará después
                diferencia: 0 // Se calculará al final
            });
        });

        // Usar for...of para intentar mejorar la inferencia de tipos
        for (const servicio of serviciosFinales) {
            let registro = serviciosMap.get(servicio.servicio);
            if (!registro) {
                // Si no estaba en iniciales, crearlo
                registro = {
                    servicio: servicio.servicio,
                    montoInicial: 0,
                    montoFinal: servicio.monto,
                    montoMovimiento: obtenerMontoMovimiento(servicio.servicio, movimientos),
                    montoPagos: 0,
                    diferencia: 0
                };
                serviciosMap.set(servicio.servicio, registro);
            } else {
                registro.montoFinal = servicio.monto;
            }

            // Calcular pagos específicos para la fórmula de diferencia
            const servicioNombreUpper = servicio.servicio.toUpperCase();
            const inicial = Number(registro.montoInicial) || 0;
            const movimiento = Number(registro.montoMovimiento) || 0;
            const final = Number(servicio.monto) || 0;
            let pagosCalculados = 0;
            let pagosDesdeCajaLocal = 0;
            let pagosServiciosPendientesLocal = 0;

            // Filtrar pagos de CAJA MAYOR (estado PENDIENTE)
            const pagosPendientesFiltrados = todosPagosServicios.filter((p: PagoServicio) =>
                p.estado?.toUpperCase() === 'PENDIENTE'
            );

            if (servicioNombreUpper.includes('MINICARGA') || servicioNombreUpper.includes('MAXICARGA') || servicioNombreUpper.includes('RECARGA CLARO')) {
                 pagosDesdeCajaLocal = pagosCaja
                    .filter((p: Pago) => {
                        const srvLower = p.servicio.toLowerCase();
                        if (servicioNombreUpper.includes('MINICARGA')) return srvLower.includes('minicarga') || srvLower.includes('mini carga');
                        if (servicioNombreUpper.includes('MAXICARGA')) return srvLower.includes('maxicarga') || srvLower.includes('maxi carga');
                        // Ajuste para Recarga Claro (asumiendo que en pagosCaja se guarda como 'recarga')
                        if (servicioNombreUpper.includes('RECARGA CLARO')) return p.operadora.toLowerCase() === 'claro' && srvLower === 'recarga';
                        return false;
                     })
                    .reduce((sum: number, pago: Pago) => sum + (Number(pago.monto) || 0), 0);

                 pagosServiciosPendientesLocal = pagosPendientesFiltrados
                    .filter((p: PagoServicio) => {
                         const srvLower = p.servicio.toLowerCase();
                         if (servicioNombreUpper.includes('MINICARGA')) return srvLower.includes('minicarga') || srvLower.includes('mini carga');
                         if (servicioNombreUpper.includes('MAXICARGA')) return srvLower.includes('maxicarga') || srvLower.includes('maxi carga');
                         // Ajuste para Recarga Claro
                         if (servicioNombreUpper.includes('RECARGA CLARO')) return p.operadora.toLowerCase() === 'claro' && srvLower === 'recarga';
                         return false;
                    })
                    .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0);

                const totalPagosParaComision = pagosDesdeCajaLocal + pagosServiciosPendientesLocal;
                pagosCalculados = totalPagosParaComision * 1.05;
                registro.pagosConComision = pagosCalculados; // Guardar con comisión

            } else if (servicioNombreUpper === 'TIGO MONEY' || servicioNombreUpper.includes('BILLETERA PERSONAL') || servicioNombreUpper.includes('BILLETERA CLARO')) {
                 pagosDesdeCajaLocal = pagosCaja
                    .filter((p: Pago) => {
                         const opLower = p.operadora.toLowerCase();
                         const srvLower = p.servicio.toLowerCase();
                         if (servicioNombreUpper === 'TIGO MONEY') return opLower === 'tigo' && srvLower === 'billetera';
                         if (servicioNombreUpper.includes('BILLETERA PERSONAL')) return opLower === 'personal' && srvLower === 'billetera';
                         if (servicioNombreUpper.includes('BILLETERA CLARO')) return opLower === 'claro' && srvLower === 'billetera';
                         return false;
                    })
                    .reduce((sum: number, pago: Pago) => sum + (Number(pago.monto) || 0), 0);

                 pagosServiciosPendientesLocal = pagosPendientesFiltrados
                    .filter((p: PagoServicio) => {
                         const opLower = p.operadora.toLowerCase();
                         const srvLower = p.servicio.toLowerCase();
                         if (servicioNombreUpper === 'TIGO MONEY') return opLower === 'tigo' && srvLower === 'billetera';
                         if (servicioNombreUpper.includes('BILLETERA PERSONAL')) return opLower === 'personal' && srvLower === 'billetera';
                         if (servicioNombreUpper.includes('BILLETERA CLARO')) return opLower === 'claro' && srvLower === 'billetera';
                         return false;
                    })
                    .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0);

                // Suma SIN comisión para billeteras
                pagosCalculados = pagosDesdeCajaLocal + pagosServiciosPendientesLocal;
                registro.pagosConComision = pagosCalculados; // Guardar suma sin comisión
            } else {
                // Lógica genérica para otros servicios (si aplica, o dejar en 0)
                // Podrías necesitar obtener pagos para estos también
                pagosCalculados = 0;
                registro.pagosConComision = 0;
            }

            registro.pagosDesdeCaja = pagosDesdeCajaLocal;
            registro.pagosServiciosPendientes = pagosServiciosPendientesLocal;
            registro.montoPagos = pagosCalculados; // Guardar el monto usado en la fórmula

            // Calcular diferencia final: (Inicial - Movimiento + PagosCalculados - Final) * -1
            const diferencia = (inicial - movimiento + pagosCalculados - final) * -1;
            registro.diferencia = diferencia;
        }

        // Estandarizar la salida para incluir siempre los servicios principales
        const serviciosEstandar = [
            'Minicarga', 'Tigo Money', 'Maxicarga', 'Billetera Personal', 'Recarga Claro', 'Billetera Claro'
        ];
        const diferenciasServiciosFinal: DiferenciaServicioDetallada[] = serviciosEstandar.map(nombreServicio => {
            const encontrado = serviciosMap.get(nombreServicio);
            if (encontrado) return encontrado;
            // Si no se encontró (no hubo ni inicial ni final), devolver con ceros
            return {
                servicio: nombreServicio,
                montoInicial: 0, montoFinal: 0, montoMovimiento: 0, montoPagos: 0,
                diferencia: 0, pagosDesdeCaja: 0, pagosServiciosPendientes: 0, pagosConComision: 0
            };
        });


        // 4. Calcular Diferencia Total (Lógica de DetalleDialog adaptada)
        const saldoInicialPYG = saldoInicial.PYG || 0;
        const saldoInicialBRLenPYG = (saldoInicial.BRL || 0) * cotizacionBRL;
        const saldoInicialUSDenPYG = (saldoInicial.USD || 0) * cotizacionUSD;
        const totalInicialEnPYG = saldoInicialPYG + saldoInicialBRLenPYG + saldoInicialUSDenPYG;

        const totalMovimientos = diferenciasServiciosFinal.reduce((sum, s) => sum + (s.montoMovimiento || 0), 0);

        const aquiPagoPagos = Number(movimientos.aquiPago?.pagos) || 0;
        const aquiPagoRetiros = Number(movimientos.aquiPago?.retiros) || 0;
        const wepaGuaraniesPagos = Number(movimientos.wepaGuaranies?.pagos) || 0;
        const wepaGuaraniesRetiros = Number(movimientos.wepaGuaranies?.retiros) || 0;
        const wepaDolaresPagosUSD = Number(movimientos.wepaDolares?.pagos) || 0;
        const wepaDolaresPagos = wepaDolaresPagosUSD * cotizacionUSD;
        const wepaDolaresRetirosUSD = Number(movimientos.wepaDolares?.retiros) || 0;
        const wepaDolaresRetiros = wepaDolaresRetirosUSD * cotizacionUSD;

        // Pagos Efectivo Pendiente (Caja Mayor)
        const pagosEfectivoPendientes = todosPagosServicios.filter(
            (p: PagoServicio) =>
                p.servicio.toLowerCase() === 'efectivo' &&
                p.estado?.toUpperCase() === 'PENDIENTE'
        );
        const totalPagosEfectivoPendientePYG = pagosEfectivoPendientes
            .filter((p: PagoServicio) => p.moneda === 'PYG')
            .reduce((sum: number, p: PagoServicio) => sum + (Number(p.monto) || 0), 0);
        const totalPagosEfectivoPendienteBRL = pagosEfectivoPendientes
            .filter((p: PagoServicio) => p.moneda === 'BRL')
            .reduce((sum: number, p: PagoServicio) => sum + (Number(p.monto) || 0), 0);
        const totalPagosEfectivoPendienteUSD = pagosEfectivoPendientes
            .filter((p: PagoServicio) => p.moneda === 'USD')
            .reduce((sum: number, p: PagoServicio) => sum + (Number(p.monto) || 0), 0);
        const totalPagosEfectivoPendienteEnPYG =
            totalPagosEfectivoPendientePYG +
            (totalPagosEfectivoPendienteBRL * cotizacionBRL) +
            (totalPagosEfectivoPendienteUSD * cotizacionUSD);

        const totalRetirosPYG = retiros.reduce((sum, r) => sum + (Number(r.montoPYG) || 0), 0);
        const totalRetirosBRLenPYG = retiros.reduce((sum, r) => sum + (Number(r.montoBRL) || 0), 0) * cotizacionBRL;
        const totalRetirosUSDenPYG = retiros.reduce((sum, r) => sum + (Number(r.montoUSD) || 0), 0) * cotizacionUSD;

        // Usar pagosCaja (los del modal)
        const totalPagosTablaPago = pagosCaja.reduce((sum, pago) => sum + (Number(pago.monto) || 0), 0);

        const totalOperacionesBancarias = operacionesBancarias.reduce((sum, op) => sum + (Number(op.monto) || 0), 0);

        const saldoFinalPYG = saldoFinal.PYG || 0;
        const saldoFinalBRLenPYG = (saldoFinal.BRL || 0) * cotizacionBRL;
        const saldoFinalUSDenPYG = (saldoFinal.USD || 0) * cotizacionUSD;
        const totalFinalEnPYG = saldoFinalPYG + saldoFinalBRLenPYG + saldoFinalUSDenPYG;

        const diferenciaIntermedida = totalInicialEnPYG + totalMovimientos
                      + aquiPagoPagos - aquiPagoRetiros
                      + wepaGuaraniesPagos - wepaGuaraniesRetiros
                      + wepaDolaresPagos - wepaDolaresRetiros
                      + totalPagosEfectivoPendienteEnPYG
                      - totalRetirosPYG - totalRetirosBRLenPYG - totalRetirosUSDenPYG
                      - totalPagosTablaPago - totalOperacionesBancarias - totalFinalEnPYG;

        const diferenciaTotalCalculada = diferenciaIntermedida * -1;

        console.log("Cálculo REAL finalizado:", { diferenciaTotalCalculada, diferenciasServiciosFinal });

        return {
            diferenciaTotal: diferenciaTotalCalculada,
            diferenciasServicios: diferenciasServiciosFinal,
            cotizacionUsada: cotizacion
        };

    } catch (error) {
        console.error(`Error calculando detalle COMPLETO para caja ${cajaId}:`, error);
        if (axios.isAxiosError(error)) {
            console.error("Detalle error Axios:", error.response?.data || error.message);
        }
        // Devolver un resultado indicando el error o lanzar para que el componente lo maneje
        throw new Error(`Error al calcular diferencias detalladas para la caja ${cajaInfoBasica.cajaEnteroId}.`);
    }
}; 