import React, { useState, useEffect, useRef } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  FormHelperText,
  InputAdornment,
  Autocomplete,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  ReceiptLong as ReceiptLongIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { handleInputClick } from '../../utils/inputUtils';
import { formatCurrency } from '../../utils/formatUtils';
import { personaService, Persona as PersonaType } from '../../services/personaService';
import { valeService, ValeInput } from '../../services/valeService';
import { useAuth } from '../../contexts/AuthContext';

interface ValesProps {
  open: boolean;
  onClose: () => void;
  onGuardarExito: () => void;
}

// Tipo para las monedas disponibles
type TipoMoneda = 'PYG' | 'USD' | 'BRL';

// Interfaz para representar a un usuario (funcionario o VIP)
interface Usuario {
  id: string;
  nombre: string;
  tipo: 'funcionario' | 'vip';
  direccion: string;
}

// ===============================================
//      Función para convertir número a letras
// ===============================================
// (Adaptada de varias fuentes online)

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
      // Corregido para evitar VEINTIUN -> VEINTIUNO
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
    // Evitar "TREINTA Y UN" -> "TREINTA Y UNO"
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

// Ajustada para manejar mejor las secciones (miles, millones)
function Seccion(num: number, divisor: number, strSingular: string, strPlural: string): string {
  const cientos = Math.floor(num / divisor);
  const resto = num % divisor;
  let letras = '';

  if (cientos > 0) {
    if (cientos === 1) {
       // Para "UN MIL", "UN MILLON"
       letras = strSingular.startsWith('UN') ? strSingular : 'UN ' + strSingular; 
    } else {
       letras = Centenas(cientos) + ' ' + strPlural;
    }
  }

  // Solo añade el resto si hay letras en cientos o si el resto es > 0
  if (letras !== '' && resto > 0) {
      letras += ' ';
  } 
  // if (resto > 0) { // Ya no se necesita esta línea separada
  //    // letras += ''; // Originalmente vacío
  // }

  return letras;
}

function Miles(num: number): string {
  const divisor = 1000;
  const cientos = Math.floor(num / divisor);
  const resto = num % divisor;
  // Seccion maneja la lógica de "UN MIL" vs "DOS MIL" etc.
  const strMiles = Seccion(num, divisor, 'MIL', 'MIL'); 
  const strCentenas = Centenas(resto);

  if (strMiles === '') return strCentenas;
  // Evita doble espacio si strCentenas está vacío
  return (strMiles + (strCentenas !== '' ? ' ' + strCentenas : '')).trim(); 
}

function Millones(num: number): string {
  const divisor = 1000000;
  const cientos = Math.floor(num / divisor);
  const resto = num % divisor;
  // Seccion maneja "UN MILLON" vs "DOS MILLONES"
  const strMillones = Seccion(num, divisor, 'MILLON', 'MILLONES'); 
  const strMiles = Miles(resto);

  if (strMillones === '') return strMiles;
  // Ajuste para "MILLONES DE" cuando hay resto
  const conector = strMillones.endsWith('MILLONES') ? ' DE' : ''; 
  // Evita doble espacio si strMiles está vacío
  return (strMillones + conector + (strMiles !== '' ? ' ' + strMiles : '')).trim(); 
}

function numeroALetras(num: number, moneda?: TipoMoneda): string {
  // Asegurarse que el número sea válido
  if (num === null || num === undefined || isNaN(num)) {
    console.error("Número inválido para convertir a letras:", num);
    return ""; 
  }

  const data = {
    numero: num,
    enteros: Math.floor(num),
    // Corregido cálculo de centavos para mayor precisión
    centavos: Math.round((num - Math.floor(num)) * 100),
    letrasCentavos: '',
    letrasMonedaPlural: '',
    letrasMonedaSingular: '',
    letrasMonedaCentavoPlural: '',
    letrasMonedaCentavoSingular: ''
  };
  
  // Definir nombres de monedas
  switch (moneda) {
    case 'PYG':
      data.letrasMonedaPlural = 'GUARANIES';
      data.letrasMonedaSingular = 'GUARANI';
      // Guaraníes no usan centavos
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
    default:
       // Si no se especifica moneda, no añadir nombres
       data.letrasMonedaPlural = '';
       data.letrasMonedaSingular = '';
       break;
  }

  // Convertir centavos a letras (solo si no es PYG)
  if (data.centavos > 0 && moneda !== 'PYG') {
    // Usar la misma lógica de Millones para convertir centavos
    const centavosEnLetras = data.centavos === 1 
                              ? Millones(data.centavos)
                              : Millones(data.centavos); // Ya maneja pluralidad interna?
    const nombreCentavo = data.centavos === 1 
                           ? data.letrasMonedaCentavoSingular 
                           : data.letrasMonedaCentavoPlural;
    data.letrasCentavos = 'CON ' + centavosEnLetras + ' ' + nombreCentavo;
  }

  // Convertir parte entera a letras
  let letrasEnteros = '';
  if (data.enteros === 0) {
    letrasEnteros = 'CERO';
  } else {
    letrasEnteros = Millones(data.enteros);
  }

  // Construir resultado final
  let resultado = letrasEnteros;
  if (moneda) {
    const nombreMoneda = data.enteros === 1 ? data.letrasMonedaSingular : data.letrasMonedaPlural;
    resultado += ' ' + nombreMoneda;
  }
  if (data.letrasCentavos) {
    resultado += ' ' + data.letrasCentavos;
  }

  // Limpiar espacios extra y convertir a mayúsculas (opcional)
  return resultado.replace(/\s+/g, ' ').trim().toUpperCase(); 
}
// ===============================================
//             Fin Conversion a Letras
// ===============================================

const Vales: React.FC<ValesProps> = ({ open, onClose, onGuardarExito }) => {
  // Obtener el usuario autenticado
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para buscar usuarios
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  
  // Estado para el tipo de moneda y monto
  const [moneda, setMoneda] = useState<TipoMoneda>('PYG');
  const [monto, setMonto] = useState<string>('');
  
  // Estado para la fecha de vencimiento
  const [fechaVencimiento, setFechaVencimiento] = useState<Date | null>(null);
  
  // Estado para observaciones
  const [observacion, setObservacion] = useState<string>('');
  
  // Estado para el diálogo de impresión
  const [dialogoImpresionOpen, setDialogoImpresionOpen] = useState(false);
  const [valeGuardado, setValeGuardado] = useState<any>(null);
  
  // Efecto para filtrar usuarios según la búsqueda
  useEffect(() => {
    if (busquedaUsuario.trim() === '') {
      setUsuariosFiltrados([]);
      return;
    }
    
    setBuscandoUsuarios(true);
    
    // Usamos la API real para buscar personas
    const searchPersonas = async () => {
      try {
        const personas = await personaService.searchPersonas(busquedaUsuario);
        
        // Filtramos solo funcionarios y VIP
        const personasFiltradas = personas.filter(
          (persona) => persona.tipo === 'Funcionario' || persona.tipo === 'Vip'
        );
        
        // Mapeamos al formato esperado por el componente
        const usuariosMapeados: Usuario[] = personasFiltradas.map((persona) => ({
          id: persona.id.toString(),
          nombre: persona.nombreCompleto,
          tipo: persona.tipo === 'Funcionario' ? 'funcionario' : 'vip',
          direccion: persona.direccion || 'No especificada'
        }));
        
        setUsuariosFiltrados(usuariosMapeados);
      } catch (err) {
        console.error('Error al buscar personas:', err);
        setError('Error al buscar personas. Intente nuevamente.');
      } finally {
        setBuscandoUsuarios(false);
      }
    };

    // Usamos un timeout para evitar demasiadas llamadas mientras el usuario escribe
    const timeoutId = setTimeout(() => {
      searchPersonas();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [busquedaUsuario]);
  
  // Efecto para establecer fecha de vencimiento predeterminada
  useEffect(() => {
    if (open) {
      // Establecer la fecha de vencimiento al final del mes actual
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFechaVencimiento(lastDayOfMonth);
      
      // Limpiar estados
      resetearFormulario();
    }
  }, [open]);
  
  // Función para preparar monto para edición
  const prepararMontoParaEdicion = (valorOriginal: number, tipoMoneda: TipoMoneda): string => {
    if (tipoMoneda === 'PYG') {
      // Para guaraníes, formatear con separador de miles
      return valorOriginal.toLocaleString('es-PY').split(',')[0];
    } else if (tipoMoneda === 'BRL') {
      // Para reales, multiplicar por 100 y formatear con punto para miles y coma para decimales
      const valor = valorOriginal.toFixed(2);
      const [entero, decimal] = valor.split('.');
      const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return `${enteroFormateado},${decimal}`;
    } else if (tipoMoneda === 'USD') {
      // Para dólares, multiplicar por 100 y formatear con coma para miles y punto para decimales
      const valor = valorOriginal.toFixed(2);
      const [entero, decimal] = valor.split('.');
      const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `${enteroFormateado}.${decimal}`;
    }
    
    // Valor por defecto si no coincide ninguna moneda
    return valorOriginal.toString();
  };
  
  // Función para resetear el formulario
  const resetearFormulario = () => {
    setBusquedaUsuario('');
    setUsuarioSeleccionado(null);
    setMoneda('PYG');
    setMonto('');
    setObservacion('');
    setError(null);
    setSuccessMessage(null);
  };
  
  // Función para cerrar el diálogo
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };
  
  // Manejar cambios en la moneda
  const handleMonedaChange = (e: SelectChangeEvent<TipoMoneda>) => {
    setMoneda(e.target.value as TipoMoneda);
    setMonto(''); // Resetear el monto al cambiar de moneda
  };
  
  // Manejar cambios en el monto
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    if (moneda === 'PYG') {
      // Para guaraníes, solo números enteros con punto como separador de miles
      const value = input.replace(/[^\d]/g, '');
      input = value ? Number(value).toLocaleString('es-PY').split(',')[0] : '';
    } else if (moneda === 'BRL') {
      // Para reales: formato con punto para miles y coma para decimales
      const numericValue = input.replace(/\D/g, '');
      if (numericValue === '') {
        input = '';
      } else {
        // Asegurar que tengamos al menos 3 dígitos para tener formato con decimales
        const paddedValue = numericValue.padStart(3, '0');
        
        // Separar enteros y decimales
        const decimalPart = paddedValue.slice(-2);
        const integerPart = paddedValue.slice(0, -2).replace(/^0+/, '') || '0'; // Quitar ceros iniciales
        
        // Formatear la parte entera con puntos para los miles
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        
        input = `${formattedInteger},${decimalPart}`;
      }
    } else if (moneda === 'USD') {
      // Para dólares: formato con coma para miles y punto para decimales
      const numericValue = input.replace(/\D/g, '');
      if (numericValue === '') {
        input = '';
      } else {
        // Asegurar que tengamos al menos 3 dígitos para tener formato con decimales
        const paddedValue = numericValue.padStart(3, '0');
        
        // Separar enteros y decimales
        const decimalPart = paddedValue.slice(-2);
        const integerPart = paddedValue.slice(0, -2).replace(/^0+/, '') || '0'; // Quitar ceros iniciales
        
        // Formatear la parte entera con comas para los miles (formato USA)
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        input = `${formattedInteger}.${decimalPart}`;
      }
    }
    
    setMonto(input);
  };
  
  // Función para obtener símbolo de moneda
  const obtenerSimboloMoneda = (tipoMoneda: TipoMoneda): string => {
    switch (tipoMoneda) {
      case 'PYG':
        return 'G$';
      case 'USD':
        return 'U$D';
      case 'BRL':
        return 'R$';
      default:
        return '';
    }
  };
  
  // Función para manejar la tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, nextId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextElement = document.getElementById(nextId);
      if (nextElement) {
        nextElement.focus();
      }
    }
  };
  
  // Función para guardar el vale
  const handleGuardarVale = async () => {
    // Validaciones
    if (!usuarioSeleccionado) {
      setError('Debe seleccionar una persona');
      return;
    }
    
    if (!monto || monto.trim() === '') {
      setError('Debe ingresar un monto válido');
      return;
    }
    
    if (!fechaVencimiento) {
      setError('Debe seleccionar una fecha de vencimiento');
      return;
    }
    
    if (!observacion || observacion.trim() === '') {
      setError('Debe ingresar una observación o motivo para el vale');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Parsear valores numéricos según el tipo de moneda
      let montoNumerico: number;
      if (moneda === 'PYG') {
        // Para guaraníes, simplemente quitar los separadores de miles
        montoNumerico = parseInt(monto.replace(/\./g, ''), 10);
      } else if (moneda === 'BRL') {
        // Para reales, reemplazar los separadores y dividir por 100
        const valorLimpio = monto.replace(/\./g, '').replace(',', '.');
        montoNumerico = parseFloat(valorLimpio);
      } else if (moneda === 'USD') {
        // Para dólares, reemplazar los separadores y dividir por 100
        const valorLimpio = monto.replace(/,/g, '');
        montoNumerico = parseFloat(valorLimpio);
      } else {
        montoNumerico = parseFloat(monto.replace(/\./g, '').replace(',', '.'));
      }
      
      // Verificar si hay un usuario autenticado
      if (!user || !user.id) {
        setError('No se pudo identificar al usuario actual');
        setLoading(false);
        return;
      }
      
      // Crear datos para enviar a la API
      const datosVale: ValeInput = {
        moneda,
        monto: montoNumerico,
        fecha_vencimiento: fechaVencimiento,
        motivo: observacion,
        persona_id: parseInt(usuarioSeleccionado.id),
        persona_nombre: usuarioSeleccionado.nombre,
        usuario_creador_id: user.id
      };
      
      console.log('Enviando datos del vale:', datosVale);
      
      // Llamar al servicio para crear el vale
      const nuevoVale = await valeService.createVale(datosVale);
      
      console.log('Vale creado exitosamente:', nuevoVale);
      
      // Llamar a la función de refresco del componente padre
      onGuardarExito();
      
      // Formatear montos para mostrar mensaje de éxito
      let montoFormateado;
      switch (moneda) {
        case 'PYG':
          montoFormateado = formatCurrency.guaranies(montoNumerico);
          break;
        case 'USD':
          montoFormateado = formatCurrency.dollars(montoNumerico);
          break;
        case 'BRL':
          montoFormateado = formatCurrency.reals(montoNumerico);
          break;
      }
      
      setSuccessMessage(`Vale registrado: ${montoFormateado} para ${usuarioSeleccionado.nombre}`);
      
      // Guardar los datos del vale para posible impresión
      setValeGuardado({
        ...nuevoVale,
        montoFormateado
      });
      
      // Mostrar diálogo de impresión en lugar de cerrar automáticamente
      setDialogoImpresionOpen(true);
      
    } catch (error) {
      console.error('Error al procesar el vale:', error);
      setError('Error al registrar el vale. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para imprimir el vale
  const handleImprimirVale = () => {
    if (!valeGuardado) return;

    // Crear ventana de impresión con el contenido del recibo
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita las ventanas emergentes para imprimir el recibo');
      return;
    }

    // Formatear fecha actual
    const fechaActual = new Date().toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });

    // --- Convertir monto a letras --- 
    const montoEnLetras = numeroALetras(valeGuardado.monto, valeGuardado.moneda as TipoMoneda);

    // Crear contenido HTML del recibo
    const reciboHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Vale</title>
        <style>
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.2;
            font-size: 10pt;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 100%;
            height: 9.9cm; /* Aproximadamente 1/3 de una hoja A4 */
            padding: 0.5cm;
            box-sizing: border-box;
            border-bottom: 1px dashed #999;
            page-break-inside: avoid;
            position: relative; /* Needed for potential absolute positioning if float fails */
          }
          .title {
            font-size: 12pt;
            font-weight: bold;
            margin: 5px 0 10px 0;
            text-align: center;
          }
          .recibo-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px; /* Reduced margin */
          }
          .recibo-nro {
            font-weight: bold;
          }
          .fecha {
            text-align: right;
          }
          .contenido {
            margin: 10px 0;
            clear: both; /* Clear floats */
          }
          .recibido {
            font-size: 11pt;
            margin: 10px 0;
          }
          .recibido strong.monto-letras { /* Style for amount in words */
              font-weight: bold; /* Make it bold */
              /* Add specific styling if needed */
          }
          .detalles {
            margin: 10px 0;
          }
          .detalles p {
            margin: 3px 0;
          }
          .monto {
            font-size: 12pt;
            font-weight: bold;
            margin: 0 0 10px 10px; /* Adjust margins */
            border: 1px solid #000;
            padding: 5px;
            float: right; /* Position to the right */
            clear: right; /* Prevent interference */
            /* display: inline-block; <-- Removed */
          }
          .observacion {
            margin: 10px 0;
          }
          .firma {
            margin-top: 30px;
            text-align: center;
          }
          .firma-box {
            width: 60%;
            margin: 0 auto;
            border-top: 1px solid #000;
            padding-top: 3px;
            text-align: center;
          }
          .info-adicional {
            margin-top: 10px;
            font-size: 8pt;
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title">RECIBO DE VALE</div>
          
          <div class="recibo-info">
            <div class="recibo-nro">Nº: ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</div>
            <div class="fecha">Fecha: ${fechaActual}</div>
          </div>
          
          <div class="monto">
            ${valeGuardado.montoFormateado}
          </div>
          
          <div class="contenido">
            <div class="recibido">
              <strong>Recibí de FARMACIA FRANCO AREVALOS S.A.</strong> la suma de: 
              <strong class="monto-letras">${montoEnLetras}</strong>
            </div>
            
            <div class="detalles">
              <p><strong>Beneficiario:</strong> ${valeGuardado.persona_nombre}</p>
              <p><strong>Vencimiento:</strong> ${formatearFecha(new Date(valeGuardado.fecha_vencimiento))}</p>
            </div>
            
            <div class="observacion">
              <strong>En concepto de:</strong> ${valeGuardado.motivo}
            </div>
          </div>
          
          <div class="firma">
            <div class="firma-box">
              Firma del Beneficiario
            </div>
          </div>
          
          <div class="info-adicional">
            <p>Este vale vence el ${formatearFecha(new Date(valeGuardado.fecha_vencimiento))} y será descontado en el cierre del mes.</p>
          </div>
        </div>
        
        <script>
          // Imprimir automáticamente y cerrar la ventana después
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(reciboHTML);
    printWindow.document.close();
    
    // Informar al usuario que ha finalizado
    setTimeout(() => {
      finalizarProceso();
    }, 2000);
  };
  
  // Función para finalizar el proceso sin imprimir
  const handleNoImprimir = () => {
    finalizarProceso();
  };
  
  // Función para finalizar todo el proceso
  const finalizarProceso = () => {
    setDialogoImpresionOpen(false);
    resetearFormulario();
    onClose();
  };
  
  // Formatear fecha
  const formatearFecha = (fecha: Date | null): string => {
    if (!fecha) return '';
    return fecha.toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              <ReceiptLongIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Registro de Vales
            </Typography>
            <IconButton onClick={handleClose} size="small" disabled={loading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Selección de persona */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Persona que recibe el vale
                </Typography>
                
                <Autocomplete
                  id="busqueda-usuario"
                  options={usuariosFiltrados}
                  getOptionLabel={(option) => option.nombre}
                  filterOptions={(x) => x} // Desactivar el filtrado predeterminado
                  value={usuarioSeleccionado}
                  onChange={(_event, newValue) => {
                    setUsuarioSeleccionado(newValue);
                  }}
                  inputValue={busquedaUsuario}
                  onInputChange={(_event, newInputValue) => {
                    setBusquedaUsuario(newInputValue.toUpperCase());
                  }}
                  loading={buscandoUsuarios}
                  loadingText="Buscando..."
                  noOptionsText="No se encontraron coincidencias"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar por nombre o documento"
                      fullWidth
                      onClick={handleInputClick}
                      onKeyDown={(e) => handleKeyDown(e, 'moneda')}
                      autoComplete="off"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {buscandoUsuarios ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={{ mb: 2 }}
                />
                
                {usuarioSeleccionado && (
                  <Box sx={{ mt: 2, bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Detalles de la Persona
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">ID:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{usuarioSeleccionado.id}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{usuarioSeleccionado.nombre}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {usuarioSeleccionado.tipo === 'funcionario' ? 'Funcionario' : 'VIP'}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Dirección:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{usuarioSeleccionado.direccion}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            {/* Datos del vale */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Datos del Vale
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="moneda-label">Moneda</InputLabel>
                  <Select
                    labelId="moneda-label"
                    id="moneda"
                    value={moneda}
                    label="Moneda"
                    onChange={handleMonedaChange}
                    disabled={loading}
                  >
                    <MenuItem value="PYG">Guaraníes (Gs)</MenuItem>
                    <MenuItem value="USD">Dólares (US$)</MenuItem>
                    <MenuItem value="BRL">Reales (R$)</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  id="monto"
                  label="Monto del Vale"
                  value={monto}
                  onChange={handleMontoChange}
                  onClick={handleInputClick}
                  onKeyDown={(e) => handleKeyDown(e, 'fecha-vencimiento')}
                  disabled={loading}
                  autoComplete="off"
                  placeholder="0"
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: <Typography variant="caption">&nbsp;{obtenerSimboloMoneda(moneda)}</Typography>
                  }}
                />
                
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha de Vencimiento"
                    value={fechaVencimiento}
                    onChange={(newValue) => setFechaVencimiento(newValue)}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        id: 'fecha-vencimiento',
                        disabled: loading,
                        sx: { mb: 2 },
                        onKeyDown: (e) => handleKeyDown(e, 'observacion')
                      },
                    }}
                  />
                </LocalizationProvider>
                
                <TextField
                  fullWidth
                  id="observacion"
                  label="Motivo del Vale"
                  multiline
                  rows={3}
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value.toUpperCase())}
                  onClick={handleInputClick}
                  onKeyDown={(e) => handleKeyDown(e, 'guardar-button')}
                  disabled={loading}
                  autoComplete="off"
                  sx={{ mb: 1 }}
                  placeholder="Ingrese el motivo de la emisión del vale"
                />
                <FormHelperText>
                  Proporcione una descripción clara del motivo del vale
                </FormHelperText>
                
                {fechaVencimiento && (
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <CalendarMonthIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      Este vale vence el {formatearFecha(fechaVencimiento)} y será descontado en el cierre del mes.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleClose} 
            color="inherit"
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            id="guardar-button"
            variant="contained" 
            color="primary"
            onClick={handleGuardarVale}
            disabled={loading || !usuarioSeleccionado || !monto || !fechaVencimiento || !observacion}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Procesando...' : 'Registrar Vale'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de confirmación para imprimir */}
      <Dialog
        open={dialogoImpresionOpen}
        onClose={handleNoImprimir}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            <ReceiptLongIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Vale Registrado Correctamente
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ p: 1 }}>
            <Typography variant="body1" gutterBottom>
              El vale ha sido registrado con éxito.
            </Typography>
            
            {valeGuardado && (
              <Box sx={{ mt: 2, bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detalles del Vale:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Persona:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{valeGuardado.persona_nombre}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Monto:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{valeGuardado.montoFormateado}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Vencimiento:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{formatearFecha(new Date(valeGuardado.fecha_vencimiento))}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <Typography variant="body1" sx={{ mt: 2 }}>
              ¿Desea imprimir el comprobante del vale?
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            color="inherit"
            onClick={handleNoImprimir}
          >
            No Imprimir
          </Button>
          
          <Button
            variant="contained" 
            color="primary"
            onClick={handleImprimirVale}
            startIcon={<ReceiptLongIcon />}
          >
            Imprimir Vale
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Vales; 