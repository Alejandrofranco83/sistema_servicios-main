import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Box,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  AttachMoney as AttachMoneyIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  Close as CloseIcon,
  MonetizationOn as MonetizationOnIcon,
  Payment as PaymentIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useCajas } from '../CajasContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearIdCaja, formatearMontoConSeparadores } from '../helpers';
import axios from 'axios';
import { useCotizacion } from '../../../contexts/CotizacionContext';
import cotizacionService from '../../../services/cotizacionService';
import TicketCierreCaja from '../ImpresionTicket/TicketCierreCaja';

// Interfaces para movimientos y pagos
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
    pagos?: string;
    retiros?: string;
  };
  [key: string]: any; // Agregar índice de tipo string
}

interface Pago {
  id: string;
  operadora: string;
  servicio: string;
  monto: number;
  moneda: string;
  observacion: string | null;
  rutaComprobante: string | null;
  fecha: string; // Asegurar que las propiedades necesarias estén
  // No tiene estado
}

// Interfaz para mapear nombres de servicios en la apertura/cierre con los de movimientos
interface MapeoServicioMovimiento {
  [key: string]: { operadora: string; servicio: string };
}

interface DetalleDialogProps {
  open: boolean;
  onClose: () => void;
}

// Interfaz para PagoServicio (viene de /pagos-servicios, CON estado)
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

const DetalleDialog: React.FC<DetalleDialogProps> = ({ open, onClose }) => {
  console.log("Renderizando DetalleDialog, open:", open);
  const { 
    cajaSeleccionada,
    handleVerApertura,
    handleVerMovimientos,
    handleRetiros,
    handleVerOperacionesBancarias,
    handlePagos,
    handleCerrarCaja,
    handleImprimirResumen,
    setLoading,
    setErrorMessage,
    operacionesBancarias,
    setOperacionesBancarias
  } = useCajas();
  
  // Obtener el contexto de cotización
  const { cotizacionVigente } = useCotizacion();

  // Estados para movimientos y pagos
  const [movimientos, setMovimientos] = useState<MovimientoData>({});
  const [pagos, setPagos] = useState<Pago[]>([]); // <-- RESTAURADO
  const [todosPagosServicios, setTodosPagosServicios] = useState<PagoServicio[]>([]); 
  const [datosActualizados, setDatosActualizados] = useState(false);
  
  // Estado para almacenar los retiros de la caja
  const [retiros, setRetiros] = useState<{
    montoPYG: number;
    montoBRL: number;
    montoUSD: number;
  }[]>([]);
  
  // Estado para almacenar la cotización de la fecha de apertura de la caja
  const [cotizacionApertura, setCotizacionApertura] = useState<{
    valorReal: number;
    valorDolar: number;
  } | null>(null);

  // Cargar movimientos y pagos cuando el diálogo se abre
  useEffect(() => {
    if (open && cajaSeleccionada && cajaSeleccionada.id) {
      // Reiniciar el estado de datos actualizados cuando se abre el diálogo
      setDatosActualizados(false);
      cargarDatosAdicionales();
      cargarCotizacionApertura();
      cargarRetiros();
      
      console.log('Iniciando carga de operaciones bancarias para caja:', cajaSeleccionada.id);
      
      // Cargar operaciones bancarias sin abrir el diálogo
      const url = `${process.env.REACT_APP_API_URL}/operaciones-bancarias/caja/${cajaSeleccionada.id}`;
      console.log('URL de carga de operaciones bancarias:', url);
      
      axios.get(url)
        .then(response => {
          console.log('Operaciones bancarias recibidas:', response.data);
          setOperacionesBancarias(response.data);
        })
        .catch(error => {
          console.error('Error al cargar operaciones bancarias para cálculo:', error);
          // En caso de error, establecer un array vacío
          setOperacionesBancarias([]);
        });
    }
  }, [open, cajaSeleccionada, setOperacionesBancarias]);

  // Reset del estado cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      // Limpiar los datos cuando se cierra el diálogo
      setMovimientos({});
      setTodosPagosServicios([]);
      setRetiros([]);
      setDatosActualizados(false);
      setCotizacionApertura(null);
    }
  }, [open]);

  // Función para cargar los retiros de la caja
  const cargarRetiros = async () => {
    if (!cajaSeleccionada || !cajaSeleccionada.id) return;
    
    try {
      console.log(`Cargando retiros para caja ID: ${cajaSeleccionada.id}`);
      const resRetiros = await axios.get(`${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/retiros`);
      
      if (resRetiros.data && Array.isArray(resRetiros.data)) {
        setRetiros(resRetiros.data);
        console.log("Retiros cargados:", resRetiros.data);
      } else {
        console.warn("No se recibieron datos de retiros válidos");
        setRetiros([]);
      }
    } catch (error) {
      console.error('Error al cargar retiros:', error);
      setRetiros([]);
    }
  };

  // Función para cargar la cotización vigente en la fecha de apertura de la caja
  const cargarCotizacionApertura = async () => {
    if (!cajaSeleccionada || !cajaSeleccionada.fechaApertura) return;
    
    try {
      console.log(`Cargando cotización para la fecha de apertura: ${cajaSeleccionada.fechaApertura}`);
      let cotizacion;
      
      try {
        // Intenta obtener cotización por fecha
        cotizacion = await cotizacionService.getCotizacionByFecha(cajaSeleccionada.fechaApertura);
      } catch (error) {
        console.error('Error al cargar cotización por fecha, usando cotización vigente:', error);
        // Si falla, usar la cotización vigente actual como fallback
        cotizacion = cotizacionVigente || { valorReal: 1380, valorDolar: 7980 };
      }
      
      console.log('Cotización de apertura cargada:', cotizacion);
      setCotizacionApertura({
        valorReal: Number(cotizacion.valorReal) || 1380,
        valorDolar: Number(cotizacion.valorDolar) || 7980
      });
    } catch (error) {
      console.error('Error al cargar cotización de apertura:', error);
      // Usar valores predeterminados como fallback
      setCotizacionApertura({
        valorReal: cotizacionVigente?.valorReal || 1380,
        valorDolar: cotizacionVigente?.valorDolar || 7980
      });
    }
  };

  // Función para cargar movimientos y pagos
  const cargarDatosAdicionales = async () => {
    if (!cajaSeleccionada || !cajaSeleccionada.id) return;
    
    setLoading(true);
    setDatosActualizados(false); 
    
    try {
      console.log(`Cargando datos para caja ID: ${cajaSeleccionada.id}`);
      
      // Usamos Promise.all para cargar todo en paralelo
      const [resMovimientos, resPagosServicios, resPagosCaja] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/movimiento`),
        axios.get(`${process.env.REACT_APP_API_URL}/pagos-servicios?cajaId=${cajaSeleccionada.id}`),
        axios.get(`${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/pagos`) // <-- LLAMADA RESTAURADA
      ]);
      
      // Cargar movimientos
      if (resMovimientos.data && resMovimientos.data.data) {
        setMovimientos(resMovimientos.data.data);
        console.log("Movimientos cargados:", resMovimientos.data.data);
      } else {
        console.warn("No se recibieron datos de movimientos válidos");
        setMovimientos({});
      }
      
      // Cargar TODOS los pagos de servicio asociados a la caja
      if (resPagosServicios.data) {
        setTodosPagosServicios(resPagosServicios.data);
        console.log("Pagos de Servicios (todos) cargados:", resPagosServicios.data);
      } else {
        console.warn("No se recibieron datos de pagos de servicios válidos");
        setTodosPagosServicios([]);
      }

      // Cargar Pagos desde Caja (endpoint original)
      if (resPagosCaja.data) {
        setPagos(resPagosCaja.data);
        console.log("Pagos desde Caja cargados:", resPagosCaja.data);
      } else {
        console.warn("No se recibieron datos de pagos desde caja válidos");
        setPagos([]);
      }
      
      // Marcar los datos como actualizados SOLO si tenemos movimientos cargados
      setDatosActualizados(!!resMovimientos.data && !!resMovimientos.data.data);
      console.log("Datos actualizados correctamente");
    } catch (error) {
      console.error('Error al cargar datos adicionales:', error);
      setErrorMessage('Error al cargar datos de movimientos y pagos');
      setMovimientos({});
      setTodosPagosServicios([]);
      setPagos([]); // Limpiar también pagos caja
      setDatosActualizados(false);
    } finally {
      setLoading(false);
    }
  };

  // Recalcular la diferencia cuando cambian las operaciones bancarias
  useEffect(() => {
    if (operacionesBancarias && operacionesBancarias.length > 0) {
      console.log('Operaciones bancarias actualizadas, recalculando diferencia:', operacionesBancarias);
      // Forzar una actualización para recalcular la diferencia
      setDatosActualizados(true);
    }
  }, [operacionesBancarias]);

  if (!cajaSeleccionada) {
    return null;
  }

  // Determinar si la caja está abierta o cerrada
  const estaAbierta = cajaSeleccionada.estado === 'abierta';
  
  // Verificar si saldoInicial existe y tiene la estructura esperada
  const saldoInicialValido = cajaSeleccionada.saldoInicial && 
                           cajaSeleccionada.saldoInicial.total &&
                           typeof cajaSeleccionada.saldoInicial.total === 'object';
  
  // Añadir validación y depuración para los saldos
  console.log('Estado de caja:', cajaSeleccionada.estado);
  console.log('Saldo final:', cajaSeleccionada.saldoFinal);
  console.log('Servicios finales:', cajaSeleccionada.saldosServiciosFinal);
  
  // Verificar saldos finales
  const saldoFinalValido = cajaSeleccionada.saldoFinal && 
                           cajaSeleccionada.saldoFinal.total &&
                           typeof cajaSeleccionada.saldoFinal.total === 'object';
  
  // Calcular diferencias entre saldos iniciales y finales
  const calcularDiferencias = () => {
    if (!cajaSeleccionada.saldoFinal || !saldoInicialValido) {
      return {
        PYG: 0,
        BRL: 0,
        USD: 0
      };
    }
    
    // Asegurar que los valores existan o usar 0 por defecto
    const saldoFinalPYG = cajaSeleccionada.saldoFinal.total?.PYG || 0;
    const saldoFinalBRL = cajaSeleccionada.saldoFinal.total?.BRL || 0;
    const saldoFinalUSD = cajaSeleccionada.saldoFinal.total?.USD || 0;
    
    const saldoInicialPYG = cajaSeleccionada.saldoInicial.total?.PYG || 0;
    const saldoInicialBRL = cajaSeleccionada.saldoInicial.total?.BRL || 0;
    const saldoInicialUSD = cajaSeleccionada.saldoInicial.total?.USD || 0;
    
    return {
      PYG: saldoFinalPYG - saldoInicialPYG,
      BRL: saldoFinalBRL - saldoInicialBRL,
      USD: saldoFinalUSD - saldoInicialUSD
    };
  };
  
  // Mapeo entre nombres de servicios en apertura/cierre y movimientos
  const mapeoServicioMovimiento: MapeoServicioMovimiento = {
    'Minicarga': { operadora: 'tigo', servicio: 'miniCarga' },
    'Mini Carga': { operadora: 'tigo', servicio: 'miniCarga' },
    'MINICARGA': { operadora: 'tigo', servicio: 'miniCarga' },
    'Tigo Money': { operadora: 'tigo', servicio: 'retiros' },
    'TIGO MONEY': { operadora: 'tigo', servicio: 'retiros' },
    'Maxicarga': { operadora: 'personal', servicio: 'maxiCarga' },
    'Maxi Carga': { operadora: 'personal', servicio: 'maxiCarga' },
    'MAXICARGA': { operadora: 'personal', servicio: 'maxiCarga' },
    'Billetera Personal': { operadora: 'personal', servicio: 'cargaBilleteras' },
    'BILLETERA PERSONAL': { operadora: 'personal', servicio: 'cargaBilleteras' },
    'Recarga Claro': { operadora: 'claro', servicio: 'recargaClaro' },
    'RECARGA CLARO': { operadora: 'claro', servicio: 'recargaClaro' },
    'Billetera Claro': { operadora: 'claro', servicio: 'cargaBilleteras' },
    'BILLETERA CLARO': { operadora: 'claro', servicio: 'cargaBilleteras' }
  };
  
  // Función para obtener monto de movimiento
  const obtenerMontoMovimiento = (servicio: string, movimientosData: any, pagosList: any[]) => {
    if (servicio === 'Tigo Money' || servicio === 'TIGO MONEY') {
      // Para Tigo Money, el monto es girosEnviados + cargaBilleteras - retiros
      const girosEnviados = (movimientosData.tigo?.girosEnviados || 0);
      const retiros = (movimientosData.tigo?.retiros || 0);
      const cargaBilleteras = (movimientosData.tigo?.cargaBilleteras || 0);
      
      console.log('TigoMoney - girosEnviados:', girosEnviados, 'retiros:', retiros, 'cargaBilleteras:', cargaBilleteras);
      
      return girosEnviados + cargaBilleteras - retiros;
    } else if (servicio === 'Billetera Personal' || servicio === 'BILLETERA PERSONAL') {
      // Para Billetera Personal, usamos la misma lógica que Tigo Money
      const girosEnviados = (movimientosData.personal?.girosEnviados || 0);
      const retiros = (movimientosData.personal?.retiros || 0);
      const cargaBilleteras = (movimientosData.personal?.cargaBilleteras || 0);
      
      console.log('BilleteraPersonal - girosEnviados:', girosEnviados, 'retiros:', retiros, 'cargaBilleteras:', cargaBilleteras);
      
      return girosEnviados + cargaBilleteras - retiros;
    } else if (servicio === 'Billetera Claro' || servicio === 'BILLETERA CLARO') {
      // Para Billetera Claro, usamos la misma lógica que Billetera Personal
      const girosEnviados = (movimientosData.claro?.girosEnviados || 0);
      const retiros = (movimientosData.claro?.retiros || 0);
      const cargaBilleteras = (movimientosData.claro?.cargaBilleteras || 0);
      
      console.log('BilleteraClaro - girosEnviados:', girosEnviados, 'retiros:', retiros, 'cargaBilleteras:', cargaBilleteras);
      
      return girosEnviados + cargaBilleteras - retiros;
    } else {
      // Para otros servicios, depende del tipo de servicio
      const mapeo = mapeoServicioMovimiento[servicio];
      if (!mapeo) return 0;
      
      const { operadora, servicio: tipoServicio } = mapeo;
      
      // Verificar si existe la operadora en movimientosData
      if (!movimientosData[operadora]) return 0;
      
      // Verificar si existe el servicio en la operadora
      return movimientosData[operadora][tipoServicio] || 0;
    }
  };
  
  // Función para obtener monto de pagos por operadora y servicio, incluyendo el 5% adicional
  const obtenerMontoPagos = (nombreServicio: string): number => {
    // Verificar si pagos está disponible
    if (!todosPagosServicios || !Array.isArray(todosPagosServicios) || todosPagosServicios.length === 0) {
      return 0;
    }
    
    const mapeo = mapeoServicioMovimiento[nombreServicio];
    if (!mapeo) return 0;
    
    const { operadora, servicio } = mapeo;
    
    // Aplicar un filtrado más preciso, adaptando la lógica del backend
    // Convertir a minúsculas para comparación insensible a mayúsculas
    const operadoraLower = operadora.toLowerCase();
    const servicioLower = servicio.toLowerCase();
    
    // Mapear nombres específicos para pagos
    let terminosBusqueda: string[] = [];
    
    // Terminos específicos para diferentes servicios
    if (servicioLower === 'minicarga') {
      terminosBusqueda = ['mini carga', 'minicarga'];
    } else if (servicioLower === 'maxicarga') {
      terminosBusqueda = ['maxi carga', 'maxicarga'];
    } else if (servicioLower === 'recargaclaro') {
      terminosBusqueda = ['recarga claro', 'recargaclaro', 'recargas', 'recarga'];
    } else if (servicioLower === 'retiros') {
      // Para Tigo Money, buscamos pagos relacionados con billetera
      if (nombreServicio === 'Tigo Money' || nombreServicio === 'TIGO MONEY') {
        terminosBusqueda = ['billetera', 'billeteras', 'tigo money'];
      } else {
        terminosBusqueda = ['retiro', 'tigo money'];
      }
    } else if (servicioLower === 'cargabilleteras') {
      // Para Billetera Personal, buscamos pagos relacionados con billetera personal
      if (nombreServicio === 'Billetera Personal' || nombreServicio === 'BILLETERA PERSONAL') {
        terminosBusqueda = ['billetera personal', 'billetera', 'personal'];
      } else {
        terminosBusqueda = ['billetera', 'billeteras'];
      }
    } else {
      terminosBusqueda = [servicioLower];
    }
    
    // Filtrar pagos que coincidan con la operadora y alguno de los términos de búsqueda
    const pagosFiltrados = todosPagosServicios.filter((pago: PagoServicio) => {
      const pagoOperadora = pago.operadora.toLowerCase();
      const pagoServicio = pago.servicio.toLowerCase();
      
      // Para Recarga Claro, hacemos un caso especial
      if (operadoraLower === 'claro' && servicioLower === 'recargaclaro') {
        return (pagoOperadora.includes('claro') && 
                (pagoServicio.includes('recarga') || pagoServicio.includes('recargas')));
      }
      
      // Para Tigo Money, hacemos un caso especial buscando pagos de billetera Tigo
      if (nombreServicio === 'Tigo Money' || nombreServicio === 'TIGO MONEY') {
        return (pagoOperadora.includes('tigo') && 
                (pagoServicio.includes('billetera') || pagoServicio.includes('tigo money')));
      }
      
      // Para Billetera Personal, hacemos un caso especial buscando pagos de billetera Personal
      if (nombreServicio === 'Billetera Personal' || nombreServicio === 'BILLETERA PERSONAL') {
        return (pagoOperadora.includes('personal') && 
                (pagoServicio.includes('billetera') || pagoServicio.includes('personal')));
      }
      
      // Para Billetera Claro, hacemos un caso especial buscando pagos de billetera Claro
      if (nombreServicio === 'Billetera Claro' || nombreServicio === 'BILLETERA CLARO') {
        return (pagoOperadora.includes('claro') && 
                (pagoServicio.includes('billetera') || pagoServicio.includes('claro')));
      }
      
      // Verificar si la operadora coincide
      if (pagoOperadora !== operadoraLower && !pagoOperadora.includes(operadoraLower)) {
        return false;
      }
      
      // Verificar si el servicio contiene alguno de los términos de búsqueda
      return terminosBusqueda.some(termino => pagoServicio.includes(termino));
    });
    
    // Sumar los montos de los pagos filtrados - asegurar que cada monto sea un número
    const totalPagosSinComision = pagosFiltrados.reduce((sum: number, pago: PagoServicio) => {
      // Convertir explícitamente a número y asegurar que es un valor válido
      const montoNumerico = Number(pago.monto) || 0;
      return sum + montoNumerico;
    }, 0);
    
    // Añadir 5% al total de pagos solo si NO es Tigo Money ni Billetera Personal
    const esTigoMoney = nombreServicio === 'Tigo Money' || nombreServicio === 'TIGO MONEY';
    const esBilleteraPersonal = nombreServicio === 'Billetera Personal' || nombreServicio === 'BILLETERA PERSONAL';
    const esBilleteraClaro = nombreServicio === 'Billetera Claro' || nombreServicio === 'BILLETERA CLARO';
    const sinComision = esTigoMoney || esBilleteraPersonal || esBilleteraClaro;
    
    const totalPagosConComision = sinComision ? totalPagosSinComision : totalPagosSinComision * 1.05;
    
    console.log(`Pagos filtrados para ${nombreServicio} (${operadora}/${servicio}):`, 
      pagosFiltrados.map((p: PagoServicio) => ({...p, monto: Number(p.monto)}))
    );
    console.log(`Total pagos sin comisión para ${nombreServicio}: ${totalPagosSinComision}`);
    
    if (!sinComision) {
      console.log(`Total pagos CON 5% para ${nombreServicio}: ${totalPagosConComision}`);
    } else {
      console.log(`Total pagos para ${nombreServicio} (sin comisión): ${totalPagosConComision}`);
    }
    
    return totalPagosConComision;
  };
  
  // Agregar esta función para validar la disponibilidad de los datos
  const datosDisponibles = () => {
    const hayMovimientos = movimientos !== undefined && movimientos !== null;
    const hayPagosOriginales = pagos && Array.isArray(pagos);
    const hayPagosServicios = todosPagosServicios && Array.isArray(todosPagosServicios);
    const hayCotizacion = cotizacionApertura !== null;
    
    console.log("Estado de disponibilidad de datos:", { 
      hayMovimientos, 
      hayPagosOriginales,
      hayPagosServicios,
      hayCotizacion,
      datosActualizados
    });
    
    // Se necesita que todos los datos relevantes estén cargados
    return datosActualizados && hayPagosOriginales && hayPagosServicios && hayMovimientos && hayCotizacion;
  };

  // Calcular diferencias en servicios con la nueva fórmula
  const calcularDiferenciasServicios = () => {
    // Verificar que los datos estén actualizados
    if (!datosDisponibles()) {
      console.log("No se pueden calcular diferencias de servicios - datos no disponibles");
      return [];
    }

    console.log("Calculando diferencias con datos actualizados:", { movimientos, todosPagosServicios, pagos });

    const serviciosMap = new Map<string, DiferenciaServicio>();

    // Verificar si ambos valores existen y son arrays
    // CORRECCIÓN: Buscar servicios en la propiedad adecuada (servicios en lugar de saldosServiciosInicial)
    const serviciosIniciales = Array.isArray(cajaSeleccionada.saldosServiciosInicial) 
      ? cajaSeleccionada.saldosServiciosInicial 
      : Array.isArray(cajaSeleccionada.servicios)
        ? cajaSeleccionada.servicios
        : [];
    
    const serviciosFinales = Array.isArray(cajaSeleccionada.saldosServiciosFinal) 
      ? cajaSeleccionada.saldosServiciosFinal 
      : [];
    
    console.log("Servicios iniciales:", serviciosIniciales);
    console.log("Servicios finales:", serviciosFinales);
    
    if (serviciosIniciales.length === 0 && serviciosFinales.length === 0) {
      console.warn("No hay servicios iniciales ni finales para calcular diferencias");
      return [];
    }
    
    // Mapear servicios iniciales
    serviciosIniciales.forEach((servicio: { servicio: string; monto: number }) => {
      const nombreServicio = servicio.servicio || '';
      const montoMovimiento = obtenerMontoMovimiento(nombreServicio, movimientos, []);
      const montoPagos = obtenerMontoPagos(nombreServicio);
      
      console.log(`Agregando servicio inicial: ${nombreServicio}, monto: ${servicio.monto}`);
      
      serviciosMap.set(nombreServicio, {
        servicio: nombreServicio,
        montoInicial: Number(servicio.monto) || 0,
        montoFinal: 0,
        montoMovimiento: montoMovimiento,
        montoPagos: montoPagos,
        // Fórmula: Inicial - Movimientos + Pagos - Final
        diferencia: 0 // Se calculará cuando tengamos el monto final
      });
    });
    
    // Actualizar con servicios finales
    serviciosFinales.forEach(servicio => {
      const nombreServicio = servicio.servicio || '';
      
      if (serviciosMap.has(nombreServicio)) {
        const registroExistente = serviciosMap.get(nombreServicio);

        // --- AÑADIR COMPROBACIÓN --- 
        if (!registroExistente) {
          console.warn(`Servicio ${nombreServicio} encontrado en Map keys pero no al obtenerlo? Saltando.`);
          return; // Usar return en forEach es como continue en un for loop
        }
        // --- FIN COMPROBACIÓN ---

        registroExistente.montoFinal = Number(servicio.monto) || 0;
        
        const inicial = Number(registroExistente.montoInicial) || 0;
        const movimiento = Number(registroExistente.montoMovimiento) || 0;
        const final = Number(servicio.monto) || 0;
        let pagosCalculados = 0;

        // --- INICIO: Lógica de cálculo específica por servicio --- 
        const servicioNombreUpper = nombreServicio.toUpperCase();

        if (servicioNombreUpper.includes('MINICARGA')) {
          // ... (resto del código existente para esta condición)
          const pagosCaja = pagos
            .filter((p: Pago) => p.servicio.toLowerCase().includes('minicarga') || p.servicio.toLowerCase().includes('mini carga'))
            .reduce((sum: number, pago: Pago) => sum + (Number(pago.monto) || 0), 0);
            
          const pagosPendientesFiltrados = todosPagosServicios
            .filter((p: PagoServicio) => (p.servicio.toLowerCase().includes('minicarga') || p.servicio.toLowerCase().includes('mini carga')) && p.estado?.toUpperCase() === 'PENDIENTE');
            
          const pagosServiciosPendientes = pagosPendientesFiltrados
            .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0); 

          const totalPagosParaComision = pagosCaja + pagosServiciosPendientes;
          pagosCalculados = totalPagosParaComision * 1.05;

          registroExistente.pagosDesdeCaja = pagosCaja; 
          registroExistente.pagosServiciosPendientes = pagosServiciosPendientes;
          registroExistente.pagosConComision = pagosCalculados;
          console.log(`Cálculo diferencia para ${servicio.servicio} (Minicarga Modificado):`, { inicial, movimiento, final, pagosCaja, pagosServiciosPendientes, totalPagosParaComision, pagosCalculados });

        } else if (servicioNombreUpper.includes('MAXICARGA')) { 
          // --- INICIO: Lógica Maxicarga RESTAURADA ---
          const pagosCaja = pagos
            .filter((p: Pago) => p.servicio.toLowerCase().includes('maxicarga') || p.servicio.toLowerCase().includes('maxi carga'))
            .reduce((sum: number, pago: Pago) => sum + (Number(pago.monto) || 0), 0);
            
          const pagosPendientesFiltrados = todosPagosServicios
            .filter((p: PagoServicio) => (p.servicio.toLowerCase().includes('maxicarga') || p.servicio.toLowerCase().includes('maxi carga')) && p.estado?.toUpperCase() === 'PENDIENTE');
            
          const pagosServiciosPendientes = pagosPendientesFiltrados
            .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0); 

          const totalPagosParaComision = pagosCaja + pagosServiciosPendientes;
          pagosCalculados = totalPagosParaComision * 1.05;

          registroExistente.pagosDesdeCaja = pagosCaja; 
          registroExistente.pagosServiciosPendientes = pagosServiciosPendientes;
          registroExistente.pagosConComision = pagosCalculados;
          console.log(`Cálculo diferencia para ${servicio.servicio} (Maxicarga Modificado):`, { inicial, movimiento, final, pagosCaja, pagosServiciosPendientes, totalPagosParaComision, pagosCalculados });
          // --- FIN: Lógica Maxicarga RESTAURADA ---

        } else if (servicioNombreUpper.includes('RECARGA CLARO')) { 
          
          // --- INICIO: Filtro Recarga Claro CORREGIDO ---
          const pagosCaja = pagos
            .filter((p: Pago) => 
              p.operadora.toLowerCase() === 'claro' && 
              p.servicio.toLowerCase() === 'recarga'
            )
            .reduce((sum: number, pago: Pago) => sum + (Number(pago.monto) || 0), 0);
            
          const pagosPendientesFiltrados = todosPagosServicios
            .filter((p: PagoServicio) => 
              p.operadora.toLowerCase() === 'claro' && 
              p.servicio.toLowerCase() === 'recarga' && 
              p.estado?.toUpperCase() === 'PENDIENTE'
            );
          // --- FIN: Filtro Recarga Claro CORREGIDO ---
            
          const pagosServiciosPendientes = pagosPendientesFiltrados
            .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0); 

          const totalPagosParaComision = pagosCaja + pagosServiciosPendientes;
          pagosCalculados = totalPagosParaComision * 1.05;

          registroExistente.pagosDesdeCaja = pagosCaja; 
          registroExistente.pagosServiciosPendientes = pagosServiciosPendientes;
          registroExistente.pagosConComision = pagosCalculados;
          console.log(`Cálculo diferencia para ${servicio.servicio} (Recarga Claro Modificado):`, { inicial, movimiento, final, pagosCaja, pagosServiciosPendientes, totalPagosParaComision, pagosCalculados });
          
        } else if (servicioNombreUpper === 'TIGO MONEY') { // <--- NUEVO CASO PARA TIGO MONEY
          
          const pagosCaja = pagos
            .filter((p: Pago) => 
              p.operadora.toLowerCase() === 'tigo' && 
              p.servicio.toLowerCase() === 'billetera'
            )
            .reduce((sum: number, pago: Pago) => sum + (Number(pago.monto) || 0), 0);
            
          const pagosPendientesFiltrados = todosPagosServicios
            .filter((p: PagoServicio) => 
              p.operadora.toLowerCase() === 'tigo' && 
              p.servicio.toLowerCase() === 'billetera' && 
              p.estado?.toUpperCase() === 'PENDIENTE'
            );
            
          const pagosServiciosPendientes = pagosPendientesFiltrados
            .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0); 

          // Suma SIN comisión
          pagosCalculados = pagosCaja + pagosServiciosPendientes;

          registroExistente.pagosDesdeCaja = pagosCaja; 
          registroExistente.pagosServiciosPendientes = pagosServiciosPendientes;
          registroExistente.pagosConComision = pagosCalculados; // Guardamos la suma (sin comisión) aquí para consistencia
          console.log(`Cálculo diferencia para ${servicio.servicio} (Tigo Money Modificado):`, { inicial, movimiento, final, pagosCaja, pagosServiciosPendientes, pagosCalculados });
          
        } else if (servicioNombreUpper.includes('BILLETERA PERSONAL')) { // <--- NUEVO CASO PARA BILLETERA PERSONAL
          
          const pagosCaja = pagos
            .filter((p: Pago) => 
              p.operadora.toLowerCase() === 'personal' && 
              p.servicio.toLowerCase() === 'billetera'
            )
            .reduce((sum: number, pago: Pago) => sum + (Number(pago.monto) || 0), 0);
            
          const pagosPendientesFiltrados = todosPagosServicios
            .filter((p: PagoServicio) => 
              p.operadora.toLowerCase() === 'personal' && 
              p.servicio.toLowerCase() === 'billetera' && 
              p.estado?.toUpperCase() === 'PENDIENTE'
            );
            
          const pagosServiciosPendientes = pagosPendientesFiltrados
            .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0); 

          // Suma SIN comisión
          pagosCalculados = pagosCaja + pagosServiciosPendientes;

          registroExistente.pagosDesdeCaja = pagosCaja; 
          registroExistente.pagosServiciosPendientes = pagosServiciosPendientes;
          registroExistente.pagosConComision = pagosCalculados; // Guardamos la suma (sin comisión)
          console.log(`Cálculo diferencia para ${servicio.servicio} (Billetera Personal Modificado):`, { inicial, movimiento, final, pagosCaja, pagosServiciosPendientes, pagosCalculados });
          
        } else if (servicioNombreUpper.includes('BILLETERA CLARO')) { // <--- NUEVO CASO PARA BILLETERA CLARO
          
          const pagosCaja = pagos
            .filter((p: Pago) => 
              p.operadora.toLowerCase() === 'claro' && 
              p.servicio.toLowerCase() === 'billetera'
            )
            .reduce((sum: number, pago: Pago) => sum + (Number(pago.monto) || 0), 0);
            
          const pagosPendientesFiltrados = todosPagosServicios
            .filter((p: PagoServicio) => 
              p.operadora.toLowerCase() === 'claro' && 
              p.servicio.toLowerCase() === 'billetera' && 
              p.estado?.toUpperCase() === 'PENDIENTE'
            );
            
          const pagosServiciosPendientes = pagosPendientesFiltrados
            .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0); 

          // Suma SIN comisión
          pagosCalculados = pagosCaja + pagosServiciosPendientes;

          registroExistente.pagosDesdeCaja = pagosCaja; 
          registroExistente.pagosServiciosPendientes = pagosServiciosPendientes;
          registroExistente.pagosConComision = pagosCalculados; // Guardamos la suma (sin comisión)
          console.log(`Cálculo diferencia para ${servicio.servicio} (Billetera Claro Modificado):`, { inicial, movimiento, final, pagosCaja, pagosServiciosPendientes, pagosCalculados });
          
        } else {
          // Lógica original/genérica para otros servicios
          pagosCalculados = Number(registroExistente.montoPagos) || 0;
          registroExistente.pagosConComision = pagosCalculados; 
          console.log(`Cálculo diferencia para ${servicio.servicio} (Original):`, { inicial, movimiento, final, pagosCalculados });
        }
        // --- FIN: Lógica de cálculo --- 

        // Calcular diferencia final (común para todos)
        const calculoIntermedio = inicial - movimiento + pagosCalculados - final;
        const calculoDiferencia = calculoIntermedio * -1; 
        registroExistente.diferencia = calculoDiferencia;

      } else { // Servicio no existe en iniciales, solo en finales
        // Para servicios que solo aparecen en saldos finales, crear entrada con inicial=0
        const montoMovimiento = obtenerMontoMovimiento(nombreServicio, movimientos, []);
        const montoPagos = obtenerMontoPagos(nombreServicio);
        
        console.log(`Agregando servicio solo en final: ${nombreServicio}, monto: ${servicio.monto}`);
        
        serviciosMap.set(nombreServicio, {
          servicio: nombreServicio,
          montoInicial: 0,
          montoFinal: Number(servicio.monto) || 0,
          montoMovimiento: montoMovimiento,
          montoPagos: montoPagos,
          diferencia: -1 * (Number(servicio.monto) || 0) // Valor negativo porque no había inicial
        });
      }
    });
    
    console.log("Mapa de servicios calculado:", Array.from(serviciosMap.values()));
    return Array.from(serviciosMap.values());
  };
  
  // Definir interfaz para los servicios
  interface DiferenciaServicio {
    servicio: string;
    montoInicial: number;
    montoFinal: number;
    montoMovimiento?: number;
    montoPagos?: number; // Este podría representar el monto de pagos original antes de la lógica de Minicarga
    diferencia: number;
    // Campos adicionales para el tooltip de Minicarga
    pagosDesdeCaja?: number;
    pagosServiciosPendientes?: number;
    pagosConComision?: number; // Este guardará el (Pagos Caja + Pagos Pendientes) * 1.05
  }
  
  // Agregar esta función después de calcularDiferenciasServicios
  const obtenerDiferenciasServiciosEstandarizados = (): DiferenciaServicio[] => {
    try {
      // Servicios predefinidos que siempre queremos mostrar
      const serviciosEstandar = [
        'Minicarga',
        'Tigo Money',
        'Maxicarga',
        'Billetera Personal',
        'Recarga Claro',
        'Billetera Claro'
      ];
      
      // Obtener las diferencias calculadas
      const diferenciasCalculadas = calcularDiferenciasServicios();
      
      // Crear un mapa para acceso rápido a las diferencias calculadas
      const mapaDiferencias = new Map<string, DiferenciaServicio>();
      
      // Verificar que diferenciasCalculadas es un array antes de usar forEach
      if (Array.isArray(diferenciasCalculadas)) {
        diferenciasCalculadas.forEach(item => {
          if (item && item.servicio) {
            mapaDiferencias.set(item.servicio.toUpperCase(), item);
          }
        });
      }
      
      // Generar la lista estandarizada
      return serviciosEstandar.map(servicio => {
        const itemExistente = mapaDiferencias.get(servicio.toUpperCase());
        
        if (itemExistente) {
          return itemExistente;
        } else {
          // Si no existe, crear un objeto con valores en cero
          return {
            servicio: servicio,
            montoInicial: 0,
            montoFinal: 0,
            montoMovimiento: 0,
            montoPagos: 0,
            diferencia: 0
          };
        }
      });
    } catch (error) {
      console.error('Error en obtenerDiferenciasServiciosEstandarizados:', error);
      // En caso de error, devolver array vacío o servicios con valores en cero
      return [
        'Minicarga',
        'Tigo Money',
        'Maxicarga',
        'Billetera Personal',
        'Recarga Claro',
        'Billetera Claro'
      ].map(servicio => ({
        servicio,
        montoInicial: 0,
        montoFinal: 0,
        montoMovimiento: 0,
        montoPagos: 0,
        diferencia: 0
      }));
    }
  };

  // Nueva función para calcular la diferencia total en guaraníes según la fórmula específica
  const calcularDiferenciaTotal = () => {
    if (!datosDisponibles() || !cajaSeleccionada.saldoFinal || !saldoInicialValido || !cotizacionApertura) {
      return 0;
    }

    // Log para verificar el estado de operaciones bancarias al calcular
    console.log('Operaciones bancarias disponibles al calcular diferencia:', operacionesBancarias);

    // Obtener cotizaciones de la fecha de apertura de la caja
    const cotizacionBRL = cotizacionApertura.valorReal;
    const cotizacionUSD = cotizacionApertura.valorDolar;

    console.log('Cotizaciones para cálculo (fecha apertura):', { BRL: cotizacionBRL, USD: cotizacionUSD });

    // 1. Saldos de apertura convertidos a guaraníes
    const saldoInicialPYG = cajaSeleccionada.saldoInicial.total?.PYG || 0;
    const saldoInicialBRLenPYG = (cajaSeleccionada.saldoInicial.total?.BRL || 0) * cotizacionBRL;
    const saldoInicialUSDenPYG = (cajaSeleccionada.saldoInicial.total?.USD || 0) * cotizacionUSD;
    
    const totalInicialEnPYG = saldoInicialPYG + saldoInicialBRLenPYG + saldoInicialUSDenPYG;
    
    // 2. Sumar todos los valores de la columna "Movimiento"
    const totalMovimientos = diferenciasServiciosEstandarizados.reduce((sum, servicio) => {
      return sum + (servicio.montoMovimiento || 0);
    }, 0);
    
    // 3. Sumar Aqui Pago: pagos (de los movimientos)
    const aquiPagoPagos = movimientos.aquiPago?.pagos || 0;
    
    // 4. Restar Aqui Pago: Retiros (de los movimientos)
    const aquiPagoRetiros = movimientos.aquiPago?.retiros || 0;
    
    // 5. Sumar Wepa Guaranies: pagos (de los movimientos)
    const wepaGuaraniesPagos = movimientos.wepaGuaranies?.pagos || 0;
    
    // 6. Restar Wepa Guaranies: retiros (de los movimientos)
    const wepaGuaraniesRetiros = movimientos.wepaGuaranies?.retiros || 0;
    
    // 7. Sumar Wepa Dolares: pagos (convertido a guaraníes)
    // Asegurarse de que el valor sea un número antes de convertirlo
    const wepaDolaresPagosUSD = typeof movimientos.wepaDolares?.pagos === 'string' 
      ? parseFloat(movimientos.wepaDolares.pagos) || 0 
      : movimientos.wepaDolares?.pagos || 0;
    const wepaDolaresPagos = wepaDolaresPagosUSD * cotizacionUSD;
    
    // 8. Restar Wepa Dolares: retiros (convertido a guaraníes)
    // Asegurarse de que el valor sea un número antes de convertirlo
    const wepaDolaresRetirosUSD = typeof movimientos.wepaDolares?.retiros === 'string' 
      ? parseFloat(movimientos.wepaDolares.retiros) || 0 
      : movimientos.wepaDolares?.retiros || 0;
    const wepaDolaresRetiros = wepaDolaresRetirosUSD * cotizacionUSD;
    
    // 9. Restar la suma de retiros en guaraníes
    const totalRetirosPYG = retiros.reduce((sum, retiro) => sum + (Number(retiro.montoPYG) || 0), 0);
    
    // 10. Restar la suma de retiros en reales convertidos a guaraníes
    const totalRetirosBRL = retiros.reduce((sum, retiro) => sum + (Number(retiro.montoBRL) || 0), 0);
    const totalRetirosBRLenPYG = totalRetirosBRL * cotizacionBRL;
    
    // 11. Restar la suma de retiros en dólares convertidos a guaraníes
    const totalRetirosUSD = retiros.reduce((sum, retiro) => sum + (Number(retiro.montoUSD) || 0), 0);
    const totalRetirosUSDenPYG = totalRetirosUSD * cotizacionUSD;
    
    // 12. Restar todos los valores de la columna "Pagos" (directamente de la tabla Pago, sin comisión)
    const totalPagosTablaPago = pagos.reduce((sum, pago) => sum + (Number(pago.monto) || 0), 0);

    // 12.5. Restar las operaciones bancarias
    const totalOperacionesBancarias = Array.isArray(operacionesBancarias) 
      ? operacionesBancarias.reduce((sum, operacion) => {
          // Asegurar que el monto es un número
          const monto = Number(operacion.monto) || 0;
          console.log('Operación bancaria:', operacion.tipo, operacion.tipoServicio, 'Monto:', monto);
          return sum + monto;
        }, 0)
      : 0;
    
    console.log('Total operaciones bancarias calculado:', totalOperacionesBancarias);
    
    // 13. Saldos de cierre convertidos a guaraníes
    const saldoFinalPYG = cajaSeleccionada.saldoFinal.total?.PYG || 0;
    const saldoFinalBRLenPYG = (cajaSeleccionada.saldoFinal.total?.BRL || 0) * cotizacionBRL;
    const saldoFinalUSDenPYG = (cajaSeleccionada.saldoFinal.total?.USD || 0) * cotizacionUSD;
    
    const totalFinalEnPYG = saldoFinalPYG + saldoFinalBRLenPYG + saldoFinalUSDenPYG;
    
    // --- INICIO: NUEVO CÁLCULO Pagos Efectivo Pendiente (Caja Mayor) --- 
    const pagosEfectivoPendientes = todosPagosServicios.filter(
      (pago: PagoServicio) => 
        pago.servicio.toLowerCase() === 'efectivo' &&
        pago.estado?.toUpperCase() === 'PENDIENTE'
    );

    const totalPagosEfectivoPendientePYG = pagosEfectivoPendientes
      .filter((p: PagoServicio) => p.moneda === 'PYG')
      .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0);

    const totalPagosEfectivoPendienteBRL = pagosEfectivoPendientes
      .filter((p: PagoServicio) => p.moneda === 'BRL')
      .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0);
      
    const totalPagosEfectivoPendienteUSD = pagosEfectivoPendientes
      .filter((p: PagoServicio) => p.moneda === 'USD')
      .reduce((sum: number, pago: PagoServicio) => sum + (Number(pago.monto) || 0), 0);

    const totalPagosEfectivoPendienteEnPYG = 
      totalPagosEfectivoPendientePYG + 
      (totalPagosEfectivoPendienteBRL * cotizacionBRL) + 
      (totalPagosEfectivoPendienteUSD * cotizacionUSD);
    // --- FIN: NUEVO CÁLCULO --- 
    
    // Aplicar la fórmula actualizada: 
    // Inicial + Movimientos 
    // + Aqui Pago pagos - Aqui Pago retiros 
    // + Wepa Guaranies pagos - Wepa Guaranies retiros 
    // + Wepa Dolares pagos - Wepa Dolares retiros 
    // + Pagos Efectivo Pendiente
    // - Retiros PYG - Retiros BRL - Retiros USD
    // - Pagos (Tabla Pago) - Operaciones Bancarias - Final // <-- MODIFICADO AQUI
    const diferenciaIntermedida = totalInicialEnPYG + totalMovimientos 
                      + aquiPagoPagos - aquiPagoRetiros 
                      + wepaGuaraniesPagos - wepaGuaraniesRetiros
                      + wepaDolaresPagos - wepaDolaresRetiros
                      + totalPagosEfectivoPendienteEnPYG 
                      - totalRetirosPYG - totalRetirosBRLenPYG - totalRetirosUSDenPYG
                      - totalPagosTablaPago - totalOperacionesBancarias - totalFinalEnPYG; // <-- Usar la suma directa de 'pagos'
    
    // NUEVO: Multiplicar por -1 para invertir el signo
    const diferencia = diferenciaIntermedida * -1;
    
    console.log('Cálculo diferencia total en guaraníes:', {
      totalInicialEnPYG,
      totalMovimientos,
      aquiPagoPagos,
      aquiPagoRetiros,
      wepaGuaraniesPagos,
      wepaGuaraniesRetiros,
      wepaDolaresPagosUSD,
      wepaDolaresPagos,
      wepaDolaresRetirosUSD,
      wepaDolaresRetiros,
      totalPagosEfectivoPendienteEnPYG, 
      totalRetirosPYG,
      totalRetirosBRL,
      totalRetirosBRLenPYG,
      totalRetirosUSD,
      totalRetirosUSDenPYG,
      totalPagosTablaPago, // <-- Log actualizado
      totalOperacionesBancarias,
      totalFinalEnPYG,
      diferenciaIntermedida,
      diferenciaFinal: diferencia
    });
    
    return diferencia;
  };

  // Obtener las diferencias estandarizadas
  const diferenciasEfectivo = calcularDiferencias();
  const diferenciasServiciosEstandarizados = obtenerDiferenciasServiciosEstandarizados();
  const diferenciaTotal = calcularDiferenciaTotal();

  const diferencia_tooltip = (
    <div className="p-4 max-w-md">
      <h3 className="text-lg font-bold mb-2">Diferencia Total (Gs)</h3>
      <p>Esta diferencia se calcula con la siguiente fórmula:</p>
      <p className="mt-2">(<strong>Inicial</strong> + <strong>Movimientos</strong> + <strong>Aqui Pago</strong> + <strong>Wepa</strong> + <strong>Pagos Efectivo (Caja Mayor)</strong> - <strong>Retiros</strong> - <strong>Pagos Servicios</strong> - <strong>Operaciones Bancarias</strong> - <strong>Final</strong>) × <strong>-1</strong> = <strong>Diferencia</strong></p>

      <p className="mt-2">Donde:</p>
      <ul className="list-disc pl-6 mt-1">
        {datosDisponibles() && cajaSeleccionada.saldoFinal && saldoInicialValido && cotizacionApertura && (
          <>
            <li><strong>Inicial:</strong></li>
            <ul className="list-disc pl-6">
              <li>+ Saldo Inicial PYG: {formatearMontoConSeparadores(cajaSeleccionada.saldoInicial?.total?.PYG || 0)} Gs</li>
              <li>+ Saldo Inicial BRL: {formatearMontoConSeparadores((cajaSeleccionada.saldoInicial?.total?.BRL || 0) * cotizacionApertura.valorReal)} Gs</li>
              <li>+ Saldo Inicial USD: {formatearMontoConSeparadores((cajaSeleccionada.saldoInicial?.total?.USD || 0) * cotizacionApertura.valorDolar)} Gs</li>
            </ul>
            
            <li><strong>Movimientos:</strong></li>
            <ul className="list-disc pl-6">
              <li>+ Total Movimientos: {formatearMontoConSeparadores(diferenciasServiciosEstandarizados.reduce((sum, servicio) => sum + (servicio.montoMovimiento || 0), 0))} Gs</li>
            </ul>
            
            <li><strong>Aqui Pago:</strong></li>
            <ul className="list-disc pl-6">
              <li>+ Pagos: {formatearMontoConSeparadores(movimientos.aquiPago?.pagos || 0)} Gs</li>
              <li>- Retiros: {formatearMontoConSeparadores(movimientos.aquiPago?.retiros || 0)} Gs</li>
            </ul>
            
            <li><strong>Wepa Guaraníes:</strong></li>
            <ul className="list-disc pl-6">
              <li>+ Pagos: {formatearMontoConSeparadores(movimientos.wepaGuaranies?.pagos || 0)} Gs</li>
              <li>- Retiros: {formatearMontoConSeparadores(movimientos.wepaGuaranies?.retiros || 0)} Gs</li>
            </ul>
            
            <li><strong>Wepa Dólares:</strong></li>
            <ul className="list-disc pl-6">
              <li>+ Pagos: {formatearMontoConSeparadores((typeof movimientos.wepaDolares?.pagos === 'string' ? parseFloat(movimientos.wepaDolares.pagos) || 0 : movimientos.wepaDolares?.pagos || 0) * cotizacionApertura.valorDolar)} Gs</li>
              <li>- Retiros: {formatearMontoConSeparadores((typeof movimientos.wepaDolares?.retiros === 'string' ? parseFloat(movimientos.wepaDolares.retiros) || 0 : movimientos.wepaDolares?.retiros || 0) * cotizacionApertura.valorDolar)} Gs</li>
            </ul>
            
            {/* --- INICIO: NUEVA LÍNEA TOOLTIP --- */}
            <li><strong>Efectivo (Caja Mayor):</strong></li>
            <ul className="list-disc pl-6">
              <li>+ Total Efectivo: {formatearMontoConSeparadores(
                (todosPagosServicios.filter(p => p.servicio.toLowerCase() === 'efectivo' && p.estado?.toUpperCase() === 'PENDIENTE' && p.moneda === 'PYG').reduce((s, p) => s + (Number(p.monto) || 0), 0)) +
                (todosPagosServicios.filter(p => p.servicio.toLowerCase() === 'efectivo' && p.estado?.toUpperCase() === 'PENDIENTE' && p.moneda === 'BRL').reduce((s, p) => s + (Number(p.monto) || 0), 0) * cotizacionApertura.valorReal) +
                (todosPagosServicios.filter(p => p.servicio.toLowerCase() === 'efectivo' && p.estado?.toUpperCase() === 'PENDIENTE' && p.moneda === 'USD').reduce((s, p) => s + (Number(p.monto) || 0), 0) * cotizacionApertura.valorDolar)
              )} Gs</li>
            </ul>
            {/* --- FIN: NUEVA LÍNEA TOOLTIP --- */}
            
            <li><strong>Retiros:</strong></li>
            <ul className="list-disc pl-6">
              <li>- Retiros PYG: {formatearMontoConSeparadores(retiros.reduce((sum, retiro) => sum + (Number(retiro.montoPYG) || 0), 0))} Gs</li>
              <li>- Retiros BRL: {formatearMontoConSeparadores(retiros.reduce((sum, retiro) => sum + (Number(retiro.montoBRL) || 0), 0) * cotizacionApertura.valorReal)} Gs</li>
              <li>- Retiros USD: {formatearMontoConSeparadores(retiros.reduce((sum, retiro) => sum + (Number(retiro.montoUSD) || 0), 0) * cotizacionApertura.valorDolar)} Gs</li>
            </ul>
            
            <li><strong>Pagos Servicios:</strong></li>
            <ul className="list-disc pl-6">
              {/* Modificar para sumar directamente del array 'pagos' */}
              <li>- Total Pagos Servicios (sin comisión): {formatearMontoConSeparadores(
                pagos.reduce((sum, pago) => sum + (Number(pago.monto) || 0), 0)
              )} Gs</li>
            </ul>
            
            <li><strong>Operaciones Bancarias:</strong></li>
            <ul className="list-disc pl-6">
              <li>- Total Operaciones: {formatearMontoConSeparadores(operacionesBancarias.reduce((sum, operacion) => sum + (Number(operacion.monto) || 0), 0))} Gs</li>
            </ul>
            
            <li><strong>Final:</strong></li>
            <ul className="list-disc pl-6">
              <li>- Saldo Final PYG: {formatearMontoConSeparadores(cajaSeleccionada.saldoFinal?.total?.PYG || 0)} Gs</li>
              <li>- Saldo Final BRL: {formatearMontoConSeparadores((cajaSeleccionada.saldoFinal?.total?.BRL || 0) * cotizacionApertura.valorReal)} Gs</li>
              <li>- Saldo Final USD: {formatearMontoConSeparadores((cajaSeleccionada.saldoFinal?.total?.USD || 0) * cotizacionApertura.valorDolar)} Gs</li>
            </ul>
            
            <li><strong>Resultado intermedio:</strong> {formatearMontoConSeparadores(-diferenciaTotal)} Gs</li>
            <li><strong>Resultado final (× -1):</strong> {formatearMontoConSeparadores(diferenciaTotal)} Gs</li>
            <li><strong>Cotización Apertura:</strong> USD: {cotizacionApertura?.valorDolar.toLocaleString()} Gs | Real: {cotizacionApertura?.valorReal.toLocaleString()} Gs</li>
          </>
        )}
      </ul>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ p: 1, pb: 0.5 }}>
        <Box>
          <Typography variant="h6" component="span">Detalle de Caja</Typography>
          <Typography variant="subtitle2" component="div" color="text.secondary" sx={{ mb: 0 }}>
            {formatearIdCaja(cajaSeleccionada.id)} (ID: {cajaSeleccionada.cajaEnteroId}) {/* Añadido ID entero */}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 1 }}>
        <Grid container spacing={1}>
          {/* Información general de la caja */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 1, mb: 0.5 }}>
              <Grid container spacing={1}>
                {/* Columna 1: Estado y Fecha Apertura */}
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado:
                  </Typography>
                  <Box sx={{
                    backgroundColor: estaAbierta ? 'green' : 'gray',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    mt: 1,
                    mb: 1 // Margen inferior
                  }}>
                    {estaAbierta ? 'ABIERTA' : 'CERRADA'}
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    Fecha Apertura:
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(cajaSeleccionada.fechaApertura), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Typography>
                </Grid>
                
                {/* Columna 2: Usuario y Fecha Cierre */}
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Usuario:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}> {/* Margen inferior */}
                    {cajaSeleccionada.usuario}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    Fecha Cierre:
                  </Typography>
                  <Typography variant="body1">
                    {cajaSeleccionada.fechaCierre
                      ? format(new Date(cajaSeleccionada.fechaCierre), 'dd/MM/yyyy HH:mm', { locale: es })
                      : '-'}
                  </Typography>
                </Grid>
                
                {/* Columna 3: Maletín y Sucursal */}
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Maletín:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}> {/* Margen inferior */}
                    {cajaSeleccionada.maletinId}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    Sucursal:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}> {/* Margen inferior */}
                    {cajaSeleccionada.sucursal?.nombre || '-'}
                  </Typography>
                   {/* --- Cotización movida a Columna 4 --- */}
                </Grid>

                {/* Columna 4: Cotización */}
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cotización Apertura:
                  </Typography>
                  {cotizacionApertura ? (
                    <Box>
                  <Typography variant="body1">
                        USD: {formatearMontoConSeparadores(cotizacionApertura.valorDolar)} Gs
                  </Typography>
                  <Typography variant="body1">
                        BRL: {formatearMontoConSeparadores(cotizacionApertura.valorReal)} Gs
                  </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body1">Cargando...</Typography>
                  )}
                </Grid>
                
                {/* Botones de acciones */}
                <Grid item xs={12} sx={{ mt: 0.5 }}>
                  <Divider sx={{ mb: 0.5 }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 0.5 }}>
                    Acciones disponibles:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Tooltip title="Ver Datos de Apertura">
                      <Button 
                        variant="outlined" 
                        color="info"
                        size="small"
                        startIcon={<MonetizationOnIcon />}
                        onClick={() => {
                          handleVerApertura(cajaSeleccionada);
                          onClose();
                        }}
                        sx={{ mb: 1 }}
                      >
                        Datos Apertura
                      </Button>
                    </Tooltip>
                    
                    <Tooltip title="Ver Movimientos">
                      <Button 
                        variant="outlined" 
                        color="secondary"
                        size="small"
                        startIcon={<AssignmentIcon />}
                        onClick={() => {
                          handleVerMovimientos(cajaSeleccionada);
                          onClose();
                        }}
                        sx={{ mb: 1 }}
                      >
                        Movimientos
                      </Button>
                    </Tooltip>
                    
                    {estaAbierta && (
                      <>
                        <Tooltip title="Retiros">
                          <Button 
                            variant="outlined" 
                            color="warning"
                            size="small"
                            startIcon={<AttachMoneyIcon />}
                            onClick={() => {
                              handleRetiros(cajaSeleccionada);
                              onClose();
                            }}
                            sx={{ mb: 1 }}
                          >
                            Retiros
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="Operaciones Bancarias">
                          <Button 
                            variant="outlined" 
                            color="success"
                            size="small"
                            startIcon={<AccountBalanceIcon />}
                            onClick={() => {
                              handleVerOperacionesBancarias(cajaSeleccionada);
                              onClose();
                            }}
                            sx={{ mb: 1 }}
                          >
                            Op. Bancarias
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="Pagos">
                          <Button 
                            variant="outlined" 
                            color="info"
                            size="small"
                            startIcon={<PaymentIcon />}
                            onClick={() => {
                              handlePagos(cajaSeleccionada);
                              onClose();
                            }}
                            sx={{ mb: 1 }}
                          >
                            Pagos
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="Cerrar Caja">
                          <Button 
                            variant="outlined" 
                            color="error"
                            size="small"
                            startIcon={<CloseIcon />}
                            onClick={() => {
                              handleCerrarCaja(cajaSeleccionada);
                              onClose();
                            }}
                            sx={{ mb: 1 }}
                          >
                            Cerrar Caja
                          </Button>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Imprimir Resumen">
                       {/* Envolver en span por advertencia de tooltip en botón deshabilitado */}
                      <span> 
                      <Button 
                        variant="contained" 
                        color="primary"
                        size="small"
                        startIcon={<PrintIcon />}
                        onClick={() => handleImprimirResumen(cajaSeleccionada)}
                        sx={{ mb: 1 }}
                          disabled={estaAbierta} 
                      >
                        Imprimir
                      </Button>
                      </span>
                    </Tooltip>
                    
                    {/* Nuevo botón para imprimir ticket */}
                    {!estaAbierta && (
                      <Tooltip title="Imprimir Ticket de Cierre">
                        <Box sx={{ mb: 1 }}>
                          <TicketCierreCaja 
                            cajaSeleccionada={cajaSeleccionada}
                            diferenciasEfectivo={diferenciasEfectivo}
                            diferenciasServicios={diferenciasServiciosEstandarizados}
                            diferenciaTotal={diferenciaTotal}
                          />
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Título de Resumen de Saldos */}
          <Grid item xs={12} sx={{ mt: 0.5 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
              Resumen de Saldos
            </Typography>
            <Divider sx={{ mb: 0.5 }} />
          </Grid>
          
          {/* Saldos de Apertura */}
          <Grid item xs={12} md={3.3} sx={{ p: 0.5 }}>
            <Paper 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                borderRadius: 2, 
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ bgcolor: '#1976d2', p: 0.5, color: 'white' }}>
                <Typography variant="subtitle1" fontWeight="bold" align="center">
                  Saldos de Apertura
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small" padding="none">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#333', color: 'white' }}>
                      <TableCell sx={{ color: 'white', py: 0.3, px: 0.8 }}><strong>Moneda</strong></TableCell>
                      <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.8 }}><strong>Monto</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Guaraníes */}
                    <TableRow>
                      <TableCell sx={{ py: 0.3, px: 0.8 }}><strong>Guaraníes</strong></TableCell>
                      <TableCell align="right" sx={{ py: 0.3, px: 0.8 }}>
                        {saldoInicialValido 
                          ? formatearMontoConSeparadores(cajaSeleccionada.saldoInicial.total.PYG || 0) + " Gs"
                          : "0 Gs"}
                      </TableCell>
                    </TableRow>
                    
                    {/* Reales */}
                    <TableRow>
                      <TableCell sx={{ py: 0.3, px: 0.8 }}><strong>Reales</strong></TableCell>
                      <TableCell align="right" sx={{ py: 0.3, px: 0.8 }}>
                        {saldoInicialValido
                          ? "R$ " + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cajaSeleccionada.saldoInicial.total.BRL || 0)
                          : "R$ 0,00"}
                      </TableCell>
                    </TableRow>
                    
                    {/* Dólares */}
                    <TableRow>
                      <TableCell sx={{ py: 0.3, px: 0.8 }}><strong>Dólares</strong></TableCell>
                      <TableCell align="right" sx={{ py: 0.3, px: 0.8 }}>
                        {saldoInicialValido
                          ? "$ " + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cajaSeleccionada.saldoInicial.total.USD || 0)
                          : "$ 0.00"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Servicios de Apertura - CORRECCIÓN: Buscar en servicios o saldosServiciosInicial */}
              {(Array.isArray(cajaSeleccionada.saldosServiciosInicial) && cajaSeleccionada.saldosServiciosInicial.length > 0) || 
               (Array.isArray(cajaSeleccionada.servicios) && cajaSeleccionada.servicios.length > 0) ? (
                <>
                  <Box sx={{ bgcolor: '#1976d2', p: 0.3, color: 'white', mt: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold" align="center">
                      Servicios (Apertura)
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small" padding="none">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#333', color: 'white' }}>
                          <TableCell sx={{ color: 'white', py: 0.3, px: 0.8 }}><strong>Servicio</strong></TableCell>
                          <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.8 }}><strong>Monto</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* CORRECCIÓN: Usar servicios o saldosServiciosInicial, lo que esté disponible */}
                        {(Array.isArray(cajaSeleccionada.saldosServiciosInicial) 
                          ? cajaSeleccionada.saldosServiciosInicial 
                          : cajaSeleccionada.servicios || []).map((servicio: {servicio: string, monto: number}, index: number) => (
                          <TableRow key={`servicio-apertura-${index}`}>
                            <TableCell sx={{ py: 0.3, px: 0.8 }}>{servicio.servicio}</TableCell>
                            <TableCell align="right" sx={{ py: 0.3, px: 0.8 }}>
                              {formatearMontoConSeparadores(servicio.monto)} Gs
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : null}
            </Paper>
          </Grid>
          
          {/* Saldos de Cierre */}
          <Grid item xs={12} md={3.3} sx={{ p: 0.5 }}>
            <Paper 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                borderRadius: 2, 
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ bgcolor: '#f44336', p: 0.5, color: 'white' }}>
                <Typography variant="subtitle1" fontWeight="bold" align="center">
                  Saldos de Cierre
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small" padding="none">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#333', color: 'white' }}>
                      <TableCell sx={{ color: 'white', py: 0.3, px: 0.8 }}><strong>Moneda</strong></TableCell>
                      <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.8 }}><strong>Monto</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Guaraníes */}
                    <TableRow>
                      <TableCell sx={{ py: 0.3, px: 0.8 }}><strong>Guaraníes</strong></TableCell>
                      <TableCell align="right" sx={{ py: 0.3, px: 0.8 }}>
                        {estaAbierta 
                          ? '-'
                          : formatearMontoConSeparadores(cajaSeleccionada.saldoFinal?.total?.PYG || 0) + " Gs"}
                      </TableCell>
                    </TableRow>
                    
                    {/* Reales */}
                    <TableRow>
                      <TableCell sx={{ py: 0.3, px: 0.8 }}><strong>Reales</strong></TableCell>
                      <TableCell align="right" sx={{ py: 0.3, px: 0.8 }}>
                        {estaAbierta
                          ? '-'
                          : "R$ " + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cajaSeleccionada.saldoFinal?.total?.BRL || 0)}
                      </TableCell>
                    </TableRow>
                    
                    {/* Dólares */}
                    <TableRow>
                      <TableCell sx={{ py: 0.3, px: 0.8 }}><strong>Dólares</strong></TableCell>
                      <TableCell align="right" sx={{ py: 0.3, px: 0.8 }}>
                        {estaAbierta
                          ? '-'
                          : "$ " + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cajaSeleccionada.saldoFinal?.total?.USD || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Servicios de Cierre */}
              {!estaAbierta && (
                <>
                  <Box sx={{ bgcolor: '#f44336', p: 0.3, color: 'white', mt: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold" align="center">
                      Servicios (Cierre)
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small" padding="none">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#333', color: 'white' }}>
                          <TableCell sx={{ color: 'white', py: 0.3, px: 0.8 }}><strong>Servicio</strong></TableCell>
                          <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.8 }}><strong>Monto</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cajaSeleccionada.saldosServiciosFinal && cajaSeleccionada.saldosServiciosFinal.length > 0 ? (
                          cajaSeleccionada.saldosServiciosFinal.map((servicio, index) => (
                            <TableRow key={`servicio-cierre-${index}`}>
                              <TableCell sx={{ py: 0.3, px: 0.8 }}>{servicio.servicio}</TableCell>
                              <TableCell align="right" sx={{ py: 0.3, px: 0.8 }}>
                                {formatearMontoConSeparadores(servicio.monto)} Gs
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} align="center" sx={{ py: 1 }}>
                              No hay servicios registrados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Paper>
          </Grid>
          
          {/* Diferencias */}
          <Grid item xs={12} md={5.4} sx={{ p: 0.5 }}>
            <Paper 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                borderRadius: 2, 
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ bgcolor: '#4caf50', p: 0.5, color: 'white' }}>
                <Typography variant="subtitle1" fontWeight="bold" align="center">
                  Diferencias
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small" padding="none" sx={{ '& .MuiTableCell-root': { fontSize: '0.8rem' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#333', color: 'white' }}>
                      <TableCell sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Moneda</strong></TableCell>
                      <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Diferencia</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Se eliminó la fila de Guaraníes por no utilizarse */}

                    {/* Nueva fila para la diferencia total */}
                    <TableRow>
                      <TableCell sx={{ py: 0.3, px: 0.6 }}><strong>Diferencia Total</strong></TableCell>
                      <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                        {estaAbierta
                          ? '-'
                          : <Tooltip
                              title={diferencia_tooltip}
                              arrow
                            >
                              <Typography
                                color={diferenciaTotal > 0 ? 'success.main' : diferenciaTotal < 0 ? 'error.main' : 'inherit'}
                                fontWeight="bold"
                                sx={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                              >
                                {diferenciaTotal === 0 ? '0 Gs' : formatearMontoConSeparadores(diferenciaTotal) + ' Gs'}
                                <VisibilityIcon fontSize="small" sx={{ ml: 0.4, fontSize: '0.8rem', opacity: 0.7 }} />
                              </Typography>
                            </Tooltip>}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Diferencias de Servicios */}
              {!estaAbierta && (
                <>
                  <Box sx={{ bgcolor: '#4caf50', p: 0.3, color: 'white', mt: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold" align="center" sx={{ fontSize: '0.8rem' }}>
                      Diferencias en Servicios
                    </Typography>
                  </Box>
                  
                  {!datosActualizados ? (
                    <Box sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        Cargando datos de movimientos y pagos...
                      </Typography>
                    </Box>
                  ) : diferenciasServiciosEstandarizados.length > 0 ? (
                    <>
                      <TableContainer>
                        <Table size="small" padding="none" sx={{ '& .MuiTableCell-root': { fontSize: '0.8rem' } }}>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#333', color: 'white' }}>
                              <TableCell sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Servicio</strong></TableCell>
                              <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Diferencia</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {diferenciasServiciosEstandarizados
                              .filter(servicio => servicio.servicio !== 'Efectivo')
                              .map((servicio, index) => (
                              <TableRow key={`servicio-diferencia-${index}`}>
                                <TableCell sx={{ py: 0.3, px: 0.6 }}>
                                  <Tooltip title={
                                    <React.Fragment>
                                      <Typography color="inherit" sx={{ fontSize: '0.8rem' }}>Cálculo de diferencia:</Typography>
                                      <Box component="ul" sx={{ pl: 2, m: 0, fontSize: '0.8rem' }}>
                                        {servicio.servicio.toUpperCase().includes('MINICARGA') || 
                                         servicio.servicio.toUpperCase().includes('MAXICARGA') || 
                                         servicio.servicio.toUpperCase().includes('RECARGA CLARO') ? (
                                          <React.Fragment>
                                            {/* Tooltip para M/M/RC con Comisión */}
                                            <li>Inicial: {formatearMontoConSeparadores(servicio.montoInicial)} Gs</li>
                                            <li>- Movimientos: {formatearMontoConSeparadores(servicio.montoMovimiento || 0)} Gs</li>
                                            <li>+ Pagos Caja: {formatearMontoConSeparadores(servicio.pagosDesdeCaja || 0)} Gs</li>
                                            <li>+ Pagos Caja Mayor: {formatearMontoConSeparadores(servicio.pagosServiciosPendientes || 0)} Gs</li>
                                            <li>&nbsp;&nbsp;Total Pagos: {formatearMontoConSeparadores((servicio.pagosDesdeCaja || 0) + (servicio.pagosServiciosPendientes || 0))} Gs</li>
                                            <li>&nbsp;&nbsp;× 1.05 (Comisión) = {formatearMontoConSeparadores(servicio.pagosConComision || 0)} Gs</li>
                                            <li>- Final: {formatearMontoConSeparadores(servicio.montoFinal)} Gs</li>
                                            <li>= Subtotal: {formatearMontoConSeparadores(servicio.montoInicial - (servicio.montoMovimiento || 0) + (servicio.pagosConComision || 0) - servicio.montoFinal)} Gs</li>
                                            <li>× (-1) = {formatearMontoConSeparadores(servicio.diferencia)} Gs</li>
                                          </React.Fragment>
                                        ) : servicio.servicio.toUpperCase().includes('TIGO MONEY') || 
                                            servicio.servicio.toUpperCase().includes('BILLETERA PERSONAL') || 
                                            servicio.servicio.toUpperCase().includes('BILLETERA CLARO') ? ( 
                                          <React.Fragment>
                                            {/* Tooltip para Billeteras */}
                                            <li>Inicial: {formatearMontoConSeparadores(servicio.montoInicial)} Gs</li>
                                            <li>- Movimiento (G+C-R): {formatearMontoConSeparadores(servicio.montoMovimiento || 0)} Gs</li>
                                            <li>+ Pagos Caja: {formatearMontoConSeparadores(servicio.pagosDesdeCaja || 0)} Gs</li>
                                            <li>+ Pagos Caja Mayor: {formatearMontoConSeparadores(servicio.pagosServiciosPendientes || 0)} Gs</li>
                                            <li>- Final: {formatearMontoConSeparadores(servicio.montoFinal)} Gs</li>
                                            <li>= Subtotal: {formatearMontoConSeparadores(servicio.montoInicial - (servicio.montoMovimiento || 0) + (servicio.pagosDesdeCaja || 0) + (servicio.pagosServiciosPendientes || 0) - servicio.montoFinal)} Gs</li>
                                            <li>× (-1) = {formatearMontoConSeparadores(servicio.diferencia)} Gs</li>
                                          </React.Fragment>
                                        ) : (
                                          <React.Fragment>
                                            {/* Tooltip Otros Servicios (Sin cambios específicos ahora) */}
                                            <li>Inicial: {formatearMontoConSeparadores(servicio.montoInicial)} Gs</li>
                                            <li>- Movimientos: {formatearMontoConSeparadores(servicio.montoMovimiento || 0)} Gs</li>
                                            <li>+ Pagos c/Comisión 5%: {formatearMontoConSeparadores(servicio.pagosConComision || 0)} Gs</li>
                                            <li>- Final: {formatearMontoConSeparadores(servicio.montoFinal)} Gs</li>
                                            <li>= Subtotal: {formatearMontoConSeparadores(servicio.montoInicial - (servicio.montoMovimiento || 0) + (servicio.pagosConComision || 0) - servicio.montoFinal)} Gs</li>
                                            <li>× (-1) = {formatearMontoConSeparadores(servicio.diferencia)} Gs</li>
                                          </React.Fragment>
                                        )}
                                      </Box>
                                    </React.Fragment>
                                  } arrow>
                                    {/* Contenido sobre el que se aplica el Tooltip */}
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {servicio.servicio}
                                      <VisibilityIcon fontSize="small" sx={{ ml: 0.4, fontSize: '0.8rem', opacity: 0.7 }} />
                                    </Box>
                                  </Tooltip>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                                  {estaAbierta ? (
                                    '-'
                                  ) : (
                                    <Typography
                                      color={servicio.diferencia > 0 ? 'success.main' : servicio.diferencia < 0 ? 'error.main' : 'inherit'}
                                      fontWeight="bold"
                                      sx={{ fontSize: '0.8rem' }}
                                    >
                                      {servicio.diferencia === 0 ? '0 Gs' : formatearMontoConSeparadores(servicio.diferencia) + ' Gs'}
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      {/* Tabla detallada del cálculo */}
                      <Box sx={{ bgcolor: '#4caf50', p: 0.3, color: 'white', mt: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold" align="center" sx={{ fontSize: '0.8rem' }}>
                          Detalle del cálculo
                        </Typography>
                      </Box>
                      <TableContainer>
                        <Table size="small" padding="none" sx={{ '& .MuiTableCell-root': { fontSize: '0.8rem' } }}>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#333', color: 'white' }}>
                              <TableCell sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Servicio</strong></TableCell>
                              <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Inicial</strong></TableCell>
                              <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Movimiento</strong></TableCell>
                              <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Pagos</strong></TableCell>
                              <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Com. 5%</strong></TableCell>
                              <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Final</strong></TableCell>
                              <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Diferencia</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {diferenciasServiciosEstandarizados
                              .filter(servicio => servicio.servicio !== 'Efectivo')
                              .map((servicio, index) => (
                              <TableRow key={`servicio-calculo-${index}`}>
                                <TableCell sx={{ py: 0.3, px: 0.6 }}>{servicio.servicio}</TableCell>
                                <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                                  {formatearMontoConSeparadores(servicio.montoInicial)} Gs
                                </TableCell>
                                <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                                  {/* Mostrar movimiento normal */}
                                        {formatearMontoConSeparadores(servicio.montoMovimiento || 0)} Gs
                                </TableCell>
                                <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                                  {/* --- INICIO: Tabla detallada pagos Minicarga --- */}
                                  {servicio.servicio === 'Minicarga' || servicio.servicio === 'Mini Carga' || servicio.servicio === 'MINICARGA' ? (
                                    <Tooltip title={`Pagos Caja: ${formatearMontoConSeparadores(servicio.pagosDesdeCaja || 0)} Gs + Pagos Caja Mayor: ${formatearMontoConSeparadores(servicio.pagosServiciosPendientes || 0)} Gs`} arrow>
                                      <Box>{formatearMontoConSeparadores((servicio.pagosDesdeCaja || 0) + (servicio.pagosServiciosPendientes || 0))} Gs</Box>
                                    </Tooltip>
                                  ) : servicio.servicio === 'Tigo Money' || servicio.servicio === 'TIGO MONEY' || 
                                   servicio.servicio === 'Billetera Personal' || servicio.servicio === 'BILLETERA PERSONAL' ||
                                   servicio.servicio === 'Billetera Claro' || servicio.servicio === 'BILLETERA CLARO' ? (
                                    <>{formatearMontoConSeparadores(servicio.montoPagos || 0)} Gs</>
                                  ) : (
                                    // Otros servicios: Pagos sin comisión
                                    <>{formatearMontoConSeparadores(servicio.pagosConComision ? Math.round(servicio.pagosConComision / 1.05) : 0)} Gs</>
                                  )}
                                  {/* --- FIN: Tabla detallada pagos Minicarga --- */}
                                </TableCell>
                                <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                                  {/* --- INICIO: Tabla detallada comisión Minicarga --- */}
                                  {servicio.servicio === 'Minicarga' || servicio.servicio === 'Mini Carga' || servicio.servicio === 'MINICARGA' ? (
                                    <>{formatearMontoConSeparadores(servicio.pagosConComision ? Math.round(servicio.pagosConComision - ((servicio.pagosDesdeCaja || 0) + (servicio.pagosServiciosPendientes || 0))) : 0)} Gs</>
                                  ) : servicio.servicio === 'Tigo Money' || servicio.servicio === 'TIGO MONEY' ||
                                   servicio.servicio === 'Billetera Personal' || servicio.servicio === 'BILLETERA PERSONAL' ||
                                   servicio.servicio === 'Billetera Claro' || servicio.servicio === 'BILLETERA CLARO' ? (
                                    <>0 Gs</>
                                  ) : (
                                    // Otros servicios: Comisión 5%
                                    <>{formatearMontoConSeparadores(servicio.pagosConComision ? Math.round(servicio.pagosConComision - (servicio.pagosConComision / 1.05)) : 0)} Gs</>
                                  )}
                                  {/* --- FIN: Tabla detallada comisión Minicarga --- */}
                                </TableCell>
                                <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                                  {formatearMontoConSeparadores(servicio.montoFinal)} Gs
                                </TableCell>
                                <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                                  <Typography
                                    color={servicio.diferencia > 0 ? 'success.main' : servicio.diferencia < 0 ? 'error.main' : 'inherit'}
                                    fontWeight="bold"
                                    sx={{ fontSize: '0.8rem' }}
                                  >
                                    {servicio.diferencia === 0 ? '0 Gs' : formatearMontoConSeparadores(servicio.diferencia) + ' Gs'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  ) : (
                    <Box sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        No hay diferencias de servicios para mostrar
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Grid>

          {/* Detalle de Denominaciones - Botones para expandir */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Box>
              <Button 
                color="primary" 
                onClick={() => handleVerApertura(cajaSeleccionada)}
                sx={{ mr: 1, py: 0.5, px: 1, fontSize: '0.8rem' }}
                size="small"
              >
                Ver detalle completo de denominaciones
              </Button>
              {!estaAbierta && (
                <Button 
                  color="secondary"
                  onClick={() => handleVerMovimientos(cajaSeleccionada)}
                  sx={{ py: 0.5, px: 1, fontSize: '0.8rem' }}
                  size="small"
                >
                  Ver movimientos
                </Button>
              )}
            </Box>
          </Grid>

          {/* Resumen imprimible (oculto visualmente, solo aparece al imprimir) */}
          <Grid item xs={12} sx={{ display: 'none' }}>
            <Box id="resumen-para-imprimir" sx={{ p: 2 }}>
              <Typography variant="h5" align="center" gutterBottom>
                Resumen de Caja - {formatearIdCaja(cajaSeleccionada.id)}
              </Typography>
              <Typography variant="subtitle1" align="center" gutterBottom>
                {cajaSeleccionada.sucursal?.nombre || 'N/A'} - {format(new Date(cajaSeleccionada.fechaApertura), 'dd/MM/yyyy', { locale: es })}
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Información General
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Usuario:</strong> {cajaSeleccionada.usuario}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Estado:</strong> {estaAbierta ? 'ABIERTA' : 'CERRADA'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Fecha Apertura:</strong> {format(new Date(cajaSeleccionada.fechaApertura), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Fecha Cierre:</strong> {cajaSeleccionada.fechaCierre
                        ? format(new Date(cajaSeleccionada.fechaCierre), 'dd/MM/yyyy HH:mm', { locale: es })
                        : '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                Saldos
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Moneda</strong></TableCell>
                    <TableCell align="right"><strong>Saldo Inicial</strong></TableCell>
                    <TableCell align="right"><strong>Saldo Final</strong></TableCell>
                    <TableCell align="right"><strong>Diferencia</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Guaraníes</strong></TableCell>
                    <TableCell align="right">
                      {saldoInicialValido 
                        ? formatearMontoConSeparadores(cajaSeleccionada.saldoInicial.total.PYG || 0) + " Gs"
                        : "0 Gs"}
                    </TableCell>
                    <TableCell align="right">
                      {estaAbierta
                        ? '-'
                        : `${formatearMontoConSeparadores(cajaSeleccionada.saldoFinal?.total.PYG || 0)} Gs`}
                    </TableCell>
                    <TableCell align="right">
                      {estaAbierta
                        ? '-'
                        : `${formatearMontoConSeparadores(diferenciasEfectivo.PYG)} Gs`}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              {cajaSeleccionada.saldosServiciosInicial && cajaSeleccionada.saldosServiciosInicial.length > 0 && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3 }}>
                    Servicios
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Servicio</strong></TableCell>
                        <TableCell align="right"><strong>Saldo Inicial</strong></TableCell>
                        <TableCell align="right"><strong>Saldo Final</strong></TableCell>
                        <TableCell align="right"><strong>Diferencia</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diferenciasServiciosEstandarizados
                        .filter(servicio => servicio.servicio !== 'Efectivo')
                        .map((servicio, index) => (
                        <TableRow key={`print-servicio-${index}`}>
                          <TableCell>{servicio.servicio}</TableCell>
                          <TableCell align="right">{formatearMontoConSeparadores(servicio.montoInicial)} Gs</TableCell>
                          <TableCell align="right">
                            {estaAbierta ? '-' : `${formatearMontoConSeparadores(servicio.montoFinal)} Gs`}
                          </TableCell>
                          <TableCell align="right">
                            {estaAbierta
                              ? '-'
                              : `${formatearMontoConSeparadores(servicio.diferencia)} Gs`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  <strong>Fecha de impresión:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center', width: '40%', borderTop: '1px solid black', pt: 1 }}>
                  <Typography variant="body2">Firma Responsable</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', width: '40%', borderTop: '1px solid black', pt: 1 }}>
                  <Typography variant="body2">Firma Supervisor</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetalleDialog; 