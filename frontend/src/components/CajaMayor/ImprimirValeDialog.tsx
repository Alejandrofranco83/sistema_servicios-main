import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  IconButton
} from '@mui/material';
import { Print as PrintIcon, Close as CloseIcon } from '@mui/icons-material';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatUtils'; 
// Importar funciones de formato y conversión a letras (si están en utils)
// O copiar/pegar numeroALetras y formatearFecha aquí si no están centralizadas

// ===============================================
//      Funciones Utilitarias y Constantes
// ===============================================

// URL Base de la API
// const API_URL = 'http://localhost:3000/api';

// TipoMoneda
type TipoMoneda = 'PYG' | 'USD' | 'BRL';

// Mapeo entre códigos de moneda del backend y frontend
const mapearMoneda = (monedaBackend: string): TipoMoneda => {
  switch(monedaBackend?.toUpperCase()) { // Asegurar toUpperCase y manejar posible undefined
    case 'PYG': return 'PYG';
    case 'USD': return 'USD';
    case 'BRL': return 'BRL';
    // Casos para nombres completos si es necesario, ej: 'GUARANIES'
    case 'GUARANIES': return 'PYG';
    case 'DOLARES': return 'USD';
    case 'REALES': return 'BRL';
    default: 
      console.warn(`[mapearMoneda] Moneda no reconocida: ${monedaBackend}, se usará PYG por defecto.`);
      return 'PYG'; // Moneda por defecto o manejo de error
  }
};

// numeroALetras y sus helpers
function Unidades(num: number): string {
  switch (num) {
    case 1: return 'UN';
    case 2: return 'DOS';
    case 3: return 'TRES';
    case 4: return 'CUATRO';
    case 5: return 'CINCO';
    case 6: return 'SEIS';
    case 7: return 'SIETE';
    case 8: return 'OCHO';
    case 9: return 'NUEVE';
    default: return '';
  }
}

function Decenas(num: number): string {
  const decena = Math.floor(num / 10);
  const unidad = num % 10;

  switch (decena) {
    case 1:
      switch (unidad) {
        case 0: return 'DIEZ';
        case 1: return 'ONCE';
        case 2: return 'DOCE';
        case 3: return 'TRECE';
        case 4: return 'CATORCE';
        case 5: return 'QUINCE';
        default: return 'DIECI' + Unidades(unidad);
      }
    case 2:
      return unidad === 0 ? 'VEINTE' : 'VEINTI' + (unidad === 1 ? 'UNO' : Unidades(unidad)); 
    case 3: return DecenasY('TREINTA', unidad);
    case 4: return DecenasY('CUARENTA', unidad);
    case 5: return DecenasY('CINCUENTA', unidad);
    case 6: return DecenasY('SESENTA', unidad);
    case 7: return DecenasY('SETENTA', unidad);
    case 8: return DecenasY('OCHENTA', unidad);
    case 9: return DecenasY('NOVENTA', unidad);
    case 0:
      return Unidades(unidad);
    default: return '';
  }
}

function DecenasY(strSin: string, numUnidades: number): string {
  if (numUnidades > 0)
    return strSin + ' Y ' + (numUnidades === 1 ? 'UNO' : Unidades(numUnidades)); 
  return strSin;
}

function Centenas(num: number): string {
  const centenas = Math.floor(num / 100);
  const decenas = num % 100;

  switch (centenas) {
    case 1: 
      if (decenas > 0) return 'CIENTO ' + Decenas(decenas);
      return 'CIEN';
    case 2: return 'DOSCIENTOS ' + Decenas(decenas);
    case 3: return 'TRESCIENTOS ' + Decenas(decenas);
    case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
    case 5: return 'QUINIENTOS ' + Decenas(decenas);
    case 6: return 'SEISCIENTOS ' + Decenas(decenas);
    case 7: return 'SETECIENTOS ' + Decenas(decenas);
    case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
    case 9: return 'NOVECIENTOS ' + Decenas(decenas);
    default: return Decenas(decenas);
  }
}

function Seccion(num: number, divisor: number, strSingular: string, strPlural: string): string {
  const cientos = Math.floor(num / divisor);
  const resto = num % divisor;
  let letras = '';

  if (cientos > 0) {
    if (cientos === 1) {
      letras = strSingular.startsWith('UN') ? strSingular : ('UN ' + strSingular);
    } else {
      letras = Centenas(cientos) + ' ' + strPlural;
    }
  }
  
  let letrasResto = '';
  if (resto > 0) {
      if (divisor === 1000000) {
          letrasResto = Miles(resto);
      } else if (divisor === 1000) {
          letrasResto = Centenas(resto);
      }
  }

  let conector = '';
  if (letras !== '' && letrasResto !== '') {
      if (divisor === 1000000 && strPlural === 'MILLONES') {
          conector = ' DE ';
      } else {
          conector = ' ';
      }
  }
  
  return letras + conector + letrasResto;
}

function Miles(num: number): string {
  const divisor = 1000;
  return Seccion(num, divisor, 'MIL', 'MIL').trim();
}

function Millones(num: number): string {
  const divisor = 1000000;
  return Seccion(num, divisor, 'MILLON', 'MILLONES').trim();
}

function numeroALetras(num: number, moneda?: TipoMoneda): string {
  if (num === null || num === undefined || isNaN(num)) {
    console.error("Número inválido para convertir a letras:", num);
    return "";
  }

  const data = {
    numero: num,
    enteros: Math.floor(num),
    centavos: Math.round((num - Math.floor(num)) * 100),
    letrasCentavos: '',
    letrasMonedaPlural: '',
    letrasMonedaSingular: '',
    letrasMonedaCentavoPlural: '',
    letrasMonedaCentavoSingular: ''
  };

  switch (moneda) {
    case 'PYG':
      data.letrasMonedaPlural = 'GUARANIES';
      data.letrasMonedaSingular = 'GUARANI';
      break;
    case 'USD':
      data.letrasMonedaPlural = 'DOLARES AMERICANOS';
      data.letrasMonedaSingular = 'DOLAR AMERICANO';
      data.letrasMonedaCentavoPlural = 'CENTAVOS';
      data.letrasMonedaCentavoSingular = 'CENTAVO';
      break;
    case 'BRL':
      data.letrasMonedaPlural = 'REALES BRASILEÑOS';
      data.letrasMonedaSingular = 'REAL BRASILEÑO';
      data.letrasMonedaCentavoPlural = 'CENTAVOS';
      data.letrasMonedaCentavoSingular = 'CENTAVO';
      break;
  }

  if (data.centavos > 0 && moneda !== 'PYG') {
    const centavosEnLetras = Millones(data.centavos);
    const nombreCentavo = data.centavos === 1 ? data.letrasMonedaCentavoSingular : data.letrasMonedaCentavoPlural;
    data.letrasCentavos = 'CON ' + centavosEnLetras + ' ' + nombreCentavo;
  }

  let letrasEnteros = '';
  if (data.enteros === 0) {
    letrasEnteros = 'CERO';
  } else {
    letrasEnteros = Millones(data.enteros);
  }

  let resultado = letrasEnteros;
  if (moneda) {
      const nombreMoneda = data.enteros === 1 ? data.letrasMonedaSingular : data.letrasMonedaPlural;
      if (nombreMoneda && !resultado.toUpperCase().includes(nombreMoneda)) {
          resultado += ' ' + nombreMoneda;
      }
  }
  
  if (data.letrasCentavos) {
      resultado += ' ' + data.letrasCentavos;
  }

  return resultado.replace(/\s+/g, ' ').trim().toUpperCase();
}

// formatearFechaSimple
const formatearFechaSimple = (fecha: Date | null | undefined): string => {
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return 'Fecha inválida';
  try {
    const day = fecha.getDate().toString().padStart(2, '0');
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Mes es 0-indexado
    const year = fecha.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Error formateando fecha simple:", fecha, e);
    return 'Error fecha';
  }
};
// ===============================================
//      Fin Funciones Utilitarias
// ===============================================

// Interfaz para los datos del vale esperados de la API
interface ValeDetalles {
  id: number;
  monto: number;
  moneda: TipoMoneda;
  fecha_vencimiento: string; // O Date si la API devuelve Date
  motivo: string;
  persona_nombre: string;
  // Añadir otros campos si son necesarios para la impresión
  // Por ejemplo, si necesitas el ID del usuario creador, etc.
}

interface ImprimirValeDialogProps {
  open: boolean;
  onClose: () => void;
  movimientoId: number | null;
}

const ImprimirValeDialog: React.FC<ImprimirValeDialogProps> = ({ open, onClose, movimientoId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valeData, setValeData] = useState<ValeDetalles | null>(null);
  const [movimientoIdOriginal, setMovimientoIdOriginal] = useState<number | null>(null);

  useEffect(() => {
    // console.log('[ImprimirValeDialog] useEffect triggered. Open:', open, 'Movimiento ID:', movimientoId);
    const fetchValeDetails = async () => {
      // La validación de !movimientoId se hace antes de llamar a fetchValeDetails ahora
      
      setLoading(true);
      setError(null); // Limpiar error antes de nueva carga
      setValeData(null); // Limpiar datos anteriores
      // console.log(`[ImprimirValeDialog] Buscando detalles para movimiento ID: ${movimientoId}`);

      try {
        // Asumimos que movimientoId ya es válido aquí por la lógica del useEffect
        const movimientoResponse = await api.get(`/api/caja_mayor_movimientos/${movimientoId!}`);
        const operacionId = movimientoResponse.data?.operacionId;

        if (!operacionId) {
          console.error('[ImprimirValeDialog] No se encontró operacionId (ID del vale) en el movimiento.', movimientoResponse.data);
          throw new Error('No se pudo obtener el ID de operación del vale desde el movimiento.');
        }

        const valeResponse = await api.get(`/api/vales/${operacionId}`);
        
        console.log('[ImprimirValeDialog] valeResponse.data completo:', JSON.stringify(valeResponse.data, null, 2));

        if (!valeResponse.data) {
          throw new Error('No se recibieron datos del vale.');
        }

        const backendData = valeResponse.data;
        const datosParaSetear = {
          id: backendData.id,
          monto: parseFloat(backendData.monto),
          moneda: mapearMoneda(backendData.moneda),
          fecha_vencimiento: backendData.fecha_vencimiento,
          motivo: backendData.motivo || backendData.observaciones_internas || 'Sin motivo específico',
          persona_nombre: backendData.persona_nombre || backendData.persona?.nombreCompleto || 'No especificado',
        };
        console.log('[ImprimirValeDialog] Objeto construido para setValeData:', JSON.stringify(datosParaSetear, null, 2));
        
        setValeData(datosParaSetear);
        console.log('[ImprimirValeDialog] setValeData ha sido llamado.');

      } catch (err: any) {
        console.error('[ImprimirValeDialog] Error en fetchValeDetails CATCH:', err);
        setError(
          err.response?.data?.error || 
          err.response?.data?.mensaje || 
          err.message || 
          'Error al cargar detalles del vale para imprimir.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      if (movimientoId) {
        setMovimientoIdOriginal(movimientoId); // <--- ESTABLECER movimientoIdOriginal AQUÍ
        fetchValeDetails();
      } else {
        console.error('[ImprimirValeDialog] ERROR: movimientoId es nulo o inválido al abrir el diálogo.');
        setError('ID de movimiento no válido para imprimir.');
        setValeData(null);
        setMovimientoIdOriginal(null);
        setLoading(false);
      }
    } else {
      // Limpiar cuando el diálogo se cierra (opcional, pero buena práctica)
      setValeData(null);
      setError(null);
      setLoading(false);
      setMovimientoIdOriginal(null);
    }
  }, [open, movimientoId]);
  
  // Corregir getMontoFormateado para usar formatCurrency correctamente
  const getMontoFormateado = (monto: number, moneda: TipoMoneda): string => {
      try {
          switch (moneda) {
              case 'PYG': return formatCurrency.guaranies(monto);
              case 'USD': return formatCurrency.dollars(monto);
              case 'BRL': return formatCurrency.reals(monto);
              default:
                console.warn(`[getMontoFormateado] Moneda no reconocida: ${moneda}. Retornando valor sin formato.`);
                return monto.toString(); 
          }
      } catch (e) {
          console.error(`[getMontoFormateado] Error formateando monto: ${monto}, moneda: ${moneda}`, e);
          return monto.toString(); // Fallback en caso de error
      }
  };

  // Función para generar el HTML e imprimir
  const handlePrint = () => {
    if (!valeData || movimientoIdOriginal === null) {
      setError('No hay datos del vale o falta ID de movimiento para imprimir.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita las ventanas emergentes para imprimir el recibo.');
      return;
    }

    // Formatear fecha actual y de vencimiento
    const fechaActual = new Date().toLocaleDateString('es-PY', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const fechaVencimientoFormateada = formatearFechaSimple(new Date(valeData.fecha_vencimiento));

    // Obtener monto en letras
    const montoEnLetras = numeroALetras(valeData.monto, valeData.moneda);
    
    // Obtener monto formateado
    const montoFormateado = getMontoFormateado(valeData.monto, valeData.moneda);

    // Usar el mismo HTML que en Vales.tsx (idealmente desde una función utilitaria)
    const reciboHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Vale</title>
        <style>
          @page { size: A4; margin: 1cm; }
          body { font-family: Arial, sans-serif; line-height: 1.2; font-size: 10pt; margin: 0; padding: 0; }
          .container { max-width: 100%; height: 9.9cm; padding: 0.5cm; box-sizing: border-box; border-bottom: 1px dashed #999; page-break-inside: avoid; position: relative; }
          .title { font-size: 12pt; font-weight: bold; margin: 5px 0 10px 0; text-align: center; }
          .recibo-info { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .recibo-nro { font-weight: bold; }
          .fecha { text-align: right; }
          .contenido { margin: 10px 0; clear: both; }
          .recibido { font-size: 11pt; margin: 10px 0; }
          .recibido strong.monto-letras { font-weight: bold; }
          .detalles { margin: 10px 0; }
          .detalles p { margin: 3px 0; }
          .monto { font-size: 12pt; font-weight: bold; margin: 0 0 10px 10px; border: 1px solid #000; padding: 5px; float: right; clear: right; }
          .observacion { margin: 10px 0; }
          .firma { margin-top: 30px; text-align: center; }
          .firma-box { width: 60%; margin: 0 auto; border-top: 1px solid #000; padding-top: 3px; text-align: center; }
          .info-adicional { margin-top: 10px; font-size: 8pt; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title">RECIBO DE VALE</div>
          <div class="recibo-info">
            <div class="recibo-nro">Nº: ${movimientoIdOriginal.toString().padStart(4, '0')}</div>
            <div class="fecha">Fecha: ${fechaActual}</div>
          </div>
          <div class="monto">${montoFormateado}</div>
          <div class="contenido">
            <div class="recibido">
              <strong>Recibí de FARMACIA FRANCO AREVALOS S.A.</strong> la suma de: 
              <strong class="monto-letras">${montoEnLetras}</strong>
            </div>
            <div class="detalles">
              <p><strong>Beneficiario:</strong> ${valeData.persona_nombre}</p> 
              <p><strong>Vencimiento:</strong> ${fechaVencimientoFormateada}</p>
            </div>
            <div class="observacion">
              <strong>En concepto de:</strong> ${valeData.motivo}
            </div>
          </div>
          <div class="firma">
            <div class="firma-box">Firma del Beneficiario</div>
          </div>
          <div class="info-adicional">
            <p>Este vale vence el ${fechaVencimientoFormateada} y será descontado en el cierre del mes.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(reciboHTML);
    printWindow.document.close();
    
    onClose(); // Cerrar el diálogo después de mandar a imprimir
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Imprimir Comprobante de Vale
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Cargando detalles del vale...</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {valeData && !loading && !error && (
          <Box sx={{ p: 1 }}>
            <Typography variant="body1" gutterBottom>
              Se imprimirán los detalles del siguiente vale:
            </Typography>
            <Box sx={{ mt: 2, bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Detalles:
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}><Typography variant="body2" color="text.secondary">ID:</Typography></Grid>
                <Grid item xs={8}><Typography variant="body2">{valeData.id}</Typography></Grid>
                
                <Grid item xs={4}><Typography variant="body2" color="text.secondary">Persona:</Typography></Grid>
                <Grid item xs={8}><Typography variant="body2">{valeData.persona_nombre}</Typography></Grid>
                
                <Grid item xs={4}><Typography variant="body2" color="text.secondary">Monto:</Typography></Grid>
                <Grid item xs={8}><Typography variant="body2">{getMontoFormateado(valeData.monto, valeData.moneda)}</Typography></Grid>

                <Grid item xs={4}><Typography variant="body2" color="text.secondary">Vencimiento:</Typography></Grid>
                <Grid item xs={8}><Typography variant="body2">{formatearFechaSimple(new Date(valeData.fecha_vencimiento))}</Typography></Grid>
                
                <Grid item xs={4}><Typography variant="body2" color="text.secondary">Motivo:</Typography></Grid>
                <Grid item xs={8}><Typography variant="body2">{valeData.motivo}</Typography></Grid>
              </Grid>
            </Box>
             <Typography variant="body1" sx={{ mt: 2 }}>
              ¿Desea continuar con la impresión?
            </Typography>
          </Box>
        )}
        {!valeData && !loading && !error && open && (
             <Typography sx={{ textAlign: 'center', my: 3 }}>No se seleccionó ningún vale para imprimir.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePrint}
          disabled={loading || !!error || !valeData}
          startIcon={<PrintIcon />}
        >
          Imprimir Vale
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImprimirValeDialog;

// --- Funciones Utilitarias (Mover a archivos utils si es posible) ---

// Asumiendo que numeroALetras está en utils/conversionUtils.ts
// Asumiendo que formatCurrency y formatearFechaSimple están en utils/formatUtils.ts

// Si no están centralizadas, copia aquí las definiciones de:
// - numeroALetras (y sus helpers Unidades, Decenas, Centenas, etc.)
// - TipoMoneda
// - formatCurrency (o las funciones específicas guaranies, dollars, reals)
// - formatearFechaSimple (o una similar para dd/mm/yyyy)
// Ejemplo de formatearFechaSimple:
/*
export const formatearFechaSimple = (fecha: Date | null | undefined): string => {
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return 'Fecha inválida';
  try {
    const day = fecha.getDate().toString().padStart(2, '0');
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Mes es 0-indexado
    const year = fecha.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Error formateando fecha simple:", fecha, e);
    return 'Error fecha';
  }
};
*/ 