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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  AccountBalance as BankIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useCotizacion } from '../../contexts/CotizacionContext';
import { formatCurrency } from '../../utils/formatUtils';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { depositoBancarioService, MovimientoCajaInput } from '../../services/depositoBancarioService';

// URL base para las peticiones API (debe coincidir con la configuración del proyecto)
const API_BASE_URL = 'http://localhost:3000/api';

interface DepositoBancarioProps {
  open: boolean;
  onClose: () => void;
  onGuardarExito: () => void;
}

// Interfaz para banco
interface Banco {
  id: number;
  nombre: string;
}

// Interfaz para cuenta bancaria
interface Cuenta {
  id: string;
  numero: string;
  tipoCuenta: string;
  moneda: 'PYG' | 'USD' | 'BRL';
  bancoId: number;
  bancoNombre: string;
}

const DepositoBancario: React.FC<DepositoBancarioProps> = ({ open, onClose, onGuardarExito }) => {
  // Obtener el usuario autenticado
  const { user } = useAuth();
  const { cotizacionVigente } = useCotizacion();
  const [loading, setLoading] = useState(false);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estados para el formulario
  const [busquedaCuenta, setBusquedaCuenta] = useState<string>('');
  const [numeroBoleta, setNumeroBoleta] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  
  // Estado para las cuentas disponibles y filtradas
  const [cuentasDisponibles, setCuentasDisponibles] = useState<Cuenta[]>([]);
  const [cuentasFiltradas, setCuentasFiltradas] = useState<Cuenta[]>([]);
  const [cuentaActual, setCuentaActual] = useState<Cuenta | null>(null);
  
  // Cargar cuentas al abrir el diálogo
  useEffect(() => {
    if (open) {
      cargarCuentasBancarias();
    } else {
      resetearEstados();
    }
  }, [open]);
  
  // Función para cargar las cuentas bancarias desde la API
  const cargarCuentasBancarias = async () => {
    try {
      setLoadingCuentas(true);
      setError(null);
      
      // Llamada a la API real para obtener las cuentas bancarias
      console.log('Obteniendo cuentas bancarias desde:', `${API_BASE_URL}/cuentas-bancarias`);
      const response = await api.get('/cuentas-bancarias');
      console.log('Respuesta del servidor (cuentas bancarias):', response.data);
      
      // Transformar los datos al formato que espera nuestro componente
      const cuentasFormateadas = response.data.map((cuenta: any) => ({
        id: cuenta.id.toString(),
        numero: cuenta.numeroCuenta,
        tipoCuenta: cuenta.tipo || 'Cuenta Corriente',
        moneda: cuenta.moneda || 'PYG',
        bancoId: cuenta.bancoId || 0,
        bancoNombre: cuenta.banco
      }));
      
      setCuentasDisponibles(cuentasFormateadas);
      
    } catch (error) {
      console.error('Error al cargar cuentas bancarias:', error);
      setError('No se pudieron cargar las cuentas bancarias. Intente nuevamente.');
      
      // Datos de ejemplo para desarrollo (solo si falla la API)
      const cuentasDemo: Cuenta[] = [
        { 
          id: 'IT001', 
          numero: '123456789', 
          tipoCuenta: 'Cuenta Corriente', 
          moneda: 'PYG',
          bancoId: 1,
          bancoNombre: 'Banco Itaú'
        },
        { 
          id: 'IT002', 
          numero: '987654321', 
          tipoCuenta: 'Caja de Ahorro', 
          moneda: 'USD',
          bancoId: 1,
          bancoNombre: 'Banco Itaú'
        },
        { 
          id: 'CO001', 
          numero: '456789123', 
          tipoCuenta: 'Cuenta Corriente', 
          moneda: 'PYG',
          bancoId: 2,
          bancoNombre: 'Banco Continental'
        },
        { 
          id: 'CO002', 
          numero: '321654987', 
          tipoCuenta: 'Caja de Ahorro', 
          moneda: 'BRL',
          bancoId: 2,
          bancoNombre: 'Banco Continental'
        }
      ];
      setCuentasDisponibles(cuentasDemo);
    } finally {
      setLoadingCuentas(false);
    }
  };
  
  // Filtrar cuentas cuando cambia el texto de búsqueda
  useEffect(() => {
    if (busquedaCuenta.trim().length > 0 && cuentasDisponibles.length > 0) {
      const terminoBusqueda = busquedaCuenta.toLowerCase();
      
      const resultados = cuentasDisponibles.filter(cuenta => {
        // Verificar cada propiedad antes de usar toLowerCase
        return (
          (cuenta.bancoNombre && cuenta.bancoNombre.toLowerCase().includes(terminoBusqueda)) ||
          (cuenta.numero && cuenta.numero.toLowerCase().includes(terminoBusqueda)) ||
          (cuenta.tipoCuenta && cuenta.tipoCuenta.toLowerCase().includes(terminoBusqueda)) ||
          (cuenta.moneda && cuenta.moneda.toLowerCase().includes(terminoBusqueda))
        );
      });
      
      setCuentasFiltradas(resultados);
      console.log('Cuentas filtradas:', resultados.length);
    } else {
      setCuentasFiltradas([]);
    }
  }, [busquedaCuenta, cuentasDisponibles]);
  
  // Función para resetear todos los estados
  const resetearEstados = () => {
    setBusquedaCuenta('');
    setNumeroBoleta('');
    setMonto('');
    setObservacion('');
    setComprobante(null);
    setError(null);
    setSuccessMessage(null);
    setCuentasFiltradas([]);
    setCuentaActual(null);
  };
  
  // Función para formatear valores según moneda
  const formatearMonto = (value: string, moneda?: 'PYG' | 'USD' | 'BRL'): string => {
    if (moneda === 'USD' || moneda === 'BRL') {
      // Para reales y dólares, permitir decimales
      let input = value.replace(/[^\d.,]/g, '');
      
      if (input.includes(',')) {
        const parts = input.split(',');
        // Asegurar que solo haya una coma decimal
        if (parts.length > 2) {
          input = parts[0] + ',' + parts.slice(1).join('');
        }
        
        // Limitar a 2 decimales
        if (parts[1] && parts[1].length > 2) {
          parts[1] = parts[1].substring(0, 2);
          input = parts[0] + ',' + parts[1];
        }
        
        // Eliminar puntos del número entero y formatearlo
        const entero = parts[0].replace(/\./g, '');
        
        let enteroFormateado = '';
        if (entero) {
          enteroFormateado = Number(entero).toLocaleString('es-PY').split(',')[0];
        }
        
        // Combinar parte entera formateada con decimales
        return enteroFormateado + ',' + parts[1];
      } else {
        // Si no hay coma decimal, solo formatear la parte entera
        const entero = input.replace(/\./g, '');
        if (entero) {
          return Number(entero).toLocaleString('es-PY');
        }
        return '';
      }
    } else {
      // Para PYG, remover todos los caracteres no numéricos
      const numericValue = value.replace(/\D/g, '');
      
      // Si está vacío, retornar vacío
      if (!numericValue) return '';
      
      // Formatear sin decimales para guaraníes
      const number = parseInt(numericValue, 10);
      return number ? Number(number).toLocaleString('es-PY') : '';
    }
  };
  
  // Función para manejar cambios en el monto
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatearMonto(e.target.value, cuentaActual?.moneda);
    setMonto(formattedValue);
  };
  
  // Función para manejar la subida de archivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setComprobante(file);
      setSuccessMessage(`Comprobante ${file.name} subido correctamente`);
      
      // Limpiar mensaje después de 2 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    }
  };
  
  // Función para ver el comprobante
  const handleVerComprobante = () => {
    if (comprobante) {
      // Abrir en una nueva ventana
      window.open(URL.createObjectURL(comprobante), '_blank');
    } else {
      setError('No hay comprobante disponible');
      
      // Limpiar mensaje después de 2 segundos
      setTimeout(() => {
        setError(null);
      }, 2000);
    }
  };
  
  // Función para seleccionar una cuenta
  const handleSeleccionarCuenta = (cuenta: Cuenta) => {
    // Asegurarse de que bancoId esté disponible
    const cuentaCompleta = {
      ...cuenta,
      bancoId: cuenta.bancoId || 1 // Valor por defecto si no está disponible
    };
    
    setCuentaActual(cuentaCompleta);
    setBusquedaCuenta('');
    setCuentasFiltradas([]);
    // Al cambiar de cuenta, resetear el monto para que se adapte al formato de la nueva moneda
    setMonto('');
    
    // Mover el foco al siguiente campo
    const nextElement = document.getElementById('numeroBoleta');
    if (nextElement) {
      nextElement.focus();
    }
  };
  
  // Función para guardar el depósito
  const handleGuardarDeposito = async () => {
    // Validaciones
    if (!cuentaActual) {
      setError('Debe seleccionar una cuenta bancaria');
      return;
    }
    
    // Verificar si el monto está vacío
    if (!monto || monto.trim() === '') {
      setError('Debe ingresar un monto válido mayor a cero');
      return;
    }
    
    // Validar monto según moneda
    let montoNumerico: number;
    if (cuentaActual.moneda === 'USD' || cuentaActual.moneda === 'BRL') {
      // Para USD y BRL, convertir coma a punto antes de parsear
      const montoSinFormato = monto.replace(/\./g, '').replace(',', '.');
      montoNumerico = parseFloat(montoSinFormato);
    } else {
      // Para PYG, eliminar puntos y convertir a número
      const montoSinFormato = monto.replace(/\./g, '');
      montoNumerico = parseInt(montoSinFormato, 10);
    }
    
    // Verificar que sea un número válido y mayor a cero
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setError('Debe ingresar un monto válido mayor a cero');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null); // Limpiar mensaje previo
      
      console.log('Cuenta seleccionada:', cuentaActual);
      
      // Crear un FormData para enviar los datos
      const formData = new FormData();
      
      // Generar un identificador único para boletas sin número
      let boletaValue = numeroBoleta;
      if (!boletaValue || boletaValue.trim() === '') {
        // Generar un identificador con fecha/hora + "SIN BOLETA"
        const ahora = new Date();
        const fechaHora = `${ahora.getDate()}${ahora.getMonth()+1}${ahora.getFullYear()}_${ahora.getHours()}${ahora.getMinutes()}${ahora.getSeconds()}`;
        boletaValue = `${fechaHora}_SIN BOLETA`;
      }
      
      formData.append('numeroBoleta', boletaValue);
      
      formData.append('monto', montoNumerico.toString());
      
      // Asegurarse de que bancoId está disponible
      if (!cuentaActual.bancoId) {
        console.error('Error: bancoId no está disponible en la cuenta seleccionada');
        setError('Error en la configuración de la cuenta bancaria. Contacte al administrador.');
        setLoading(false);
        return;
      }
      
      // Asegurarse de que bancoId sea un número y se envíe como tal
      const bancoId = Number(cuentaActual.bancoId);
      if (isNaN(bancoId)) {
        console.error('Error: bancoId no es un número válido:', cuentaActual.bancoId);
        setError('Error en la configuración de la cuenta bancaria. El ID del banco no es válido.');
        setLoading(false);
        return;
      }
      
      formData.append('bancoId', bancoId.toString());
      
      // Convertir el ID de cuenta bancaria a número si es posible
      let cuentaId;
      try {
        cuentaId = Number(cuentaActual.id);
        // Si no es un número válido, usar el ID original
        if (isNaN(cuentaId)) {
          cuentaId = cuentaActual.id;
        }
      } catch (e) {
        cuentaId = cuentaActual.id;
      }
      
      formData.append('cuentaBancariaId', cuentaId.toString());
      
      if (observacion) {
        formData.append('observacion', observacion);
      }
      
      // Verificar si hay comprobante, y si no crear uno vacío
      if (comprobante) {
        formData.append('comprobante', comprobante);
      } else {
        // Crear un archivo de texto vacío como comprobante por defecto
        const emptyBlob = new Blob(['Sin comprobante'], { type: 'text/plain' });
        const emptyFile = new File([emptyBlob], 'sin_comprobante.txt', { type: 'text/plain' });
        formData.append('comprobante', emptyFile);
      }
      
      // Imprimir el contenido del FormData para depuración
      console.log('Contenido del FormData:');
      // Usar una forma compatible con TypeScript para imprimir el FormData
      formData.forEach((value, key) => {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      });
      
      // Usar el servicio para crear el depósito. El backend se encargará del movimiento de caja.
      const deposito = await depositoBancarioService.createDeposito(formData);
      console.log('Respuesta del servidor (depósito creado):', deposito);
      
      // Llamar a la función de refresco del componente padre
      onGuardarExito();
      
      // Mostrar mensaje de éxito
      let montoFormateado;
      if (cuentaActual.moneda === 'PYG') {
        montoFormateado = formatCurrency.guaranies(montoNumerico);
      } else if (cuentaActual.moneda === 'USD') {
        montoFormateado = formatCurrency.dollars(montoNumerico);
      } else {
        montoFormateado = formatCurrency.reals(montoNumerico);
      }
      
      setSuccessMessage(`Depósito de ${montoFormateado} registrado correctamente en la cuenta de ${cuentaActual.bancoNombre}. Movimiento de caja generado.`);
      
      // Limpiar el formulario después de 2 segundos y cerrar
      setTimeout(() => {
        resetearEstados();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error al procesar el depósito:', error);
      
      // Mejorar manejo de errores
      if (axios.isAxiosError(error)) {
        console.error('Detalles del error Axios:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
        
        if (error.response) {
          setError(`Error (${error.response.status}): ${error.response.data.error || 'Intente nuevamente'}`);
        } else if (error.request) {
          setError('No se recibió respuesta del servidor. Verifique su conexión.');
        } else {
          setError(`Error al enviar la solicitud: ${error.message}`);
        }
      } else {
        setError('Error al registrar el depósito. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Función para navegar al siguiente campo con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement | HTMLTextAreaElement>, nextId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextElement = document.getElementById(nextId);
      if (nextElement) {
        nextElement.focus();
      }
    }
  };
  
  // Cerrar el diálogo
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };
  
  // Obtener etiqueta para la moneda
  const getMonedaLabel = (moneda?: 'PYG' | 'USD' | 'BRL'): string => {
    switch (moneda) {
      case 'USD':
        return 'US$';
      case 'BRL':
        return 'R$';
      default:
        return 'Gs';
    }
  };

  // Manejar cambio en el campo de búsqueda
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toUpperCase();
    setBusquedaCuenta(valor);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Depósito Bancario</Typography>
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
          {/* Selección de Banco y Cuenta */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Información Bancaria
              </Typography>
              
              {!cuentaActual ? (
                <>
                  <TextField
                    fullWidth
                    id="busquedaCuenta"
                    label="Buscar cuenta bancaria"
                    value={busquedaCuenta}
                    onChange={handleBusquedaChange}
                    placeholder="Ingrese banco, número de cuenta o tipo"
                    autoComplete="off"
                    disabled={loading || loadingCuentas}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: loadingCuentas ? (
                        <CircularProgress size={20} />
                      ) : null
                    }}
                    autoFocus
                  />
                  
                  {busquedaCuenta.trim().length > 0 && (
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        maxHeight: 200, 
                        overflow: 'auto',
                        mb: 2,
                        p: cuentasFiltradas.length ? 1 : 0
                      }}
                    >
                      {cuentasFiltradas.length > 0 ? (
                        cuentasFiltradas.map((cuenta) => (
                          <Box
                            key={cuenta.id}
                            sx={{
                              p: 1,
                              '&:hover': {
                                bgcolor: 'action.hover',
                                cursor: 'pointer'
                              },
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              '&:last-child': {
                                borderBottom: 'none'
                              }
                            }}
                            onClick={() => handleSeleccionarCuenta(cuenta)}
                          >
                            <Typography variant="subtitle2">{cuenta.bancoNombre}</Typography>
                            <Typography variant="body2">
                              {cuenta.numero} - {cuenta.tipoCuenta}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Moneda: {cuenta.moneda === 'PYG' ? 'Guaraníes' : cuenta.moneda === 'USD' ? 'Dólares' : 'Reales'}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">
                            No se encontraron cuentas
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  )}
                  
                  {cuentasDisponibles.length === 0 && !loadingCuentas && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No hay cuentas bancarias disponibles
                    </Alert>
                  )}
                </>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2">Cuenta seleccionada</Typography>
                    <Button 
                      size="small" 
                      onClick={() => setCuentaActual(null)}
                      disabled={loading}
                    >
                      Cambiar
                    </Button>
                  </Box>
                  
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {cuentaActual.bancoNombre}
                    </Typography>
                    <Typography variant="body2">
                      Número: {cuentaActual.numero}
                    </Typography>
                    <Typography variant="body2">
                      Tipo: {cuentaActual.tipoCuenta}
                    </Typography>
                    <Typography variant="body2">
                      Moneda: {cuentaActual.moneda === 'PYG' ? 'Guaraníes' : cuentaActual.moneda === 'USD' ? 'Dólares' : 'Reales'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Detalle del Depósito */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Detalle del Depósito
              </Typography>
              
              <TextField
                fullWidth
                id="numeroBoleta"
                label="Número de Boleta/Comprobante"
                value={numeroBoleta}
                onChange={(e) => setNumeroBoleta(e.target.value.toUpperCase())}
                onKeyDown={(e) => handleKeyDown(e, 'monto')}
                disabled={loading || !cuentaActual}
                autoComplete="off"
                sx={{ mb: 2 }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              
              <TextField
                fullWidth
                id="monto"
                label="Monto"
                value={monto}
                onChange={handleMontoChange}
                onKeyDown={(e) => handleKeyDown(e, 'observacion')}
                disabled={loading || !cuentaActual}
                autoComplete="off"
                placeholder="0"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: <Typography variant="caption">&nbsp;{getMonedaLabel(cuentaActual?.moneda)}</Typography>
                }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              
              <TextField
                fullWidth
                id="observacion"
                label="Observaciones"
                multiline
                rows={2}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value.toUpperCase())}
                onKeyDown={(e) => handleKeyDown(e, 'guardar-button')}
                disabled={loading || !cuentaActual}
                autoComplete="off"
                sx={{ mb: 2 }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AttachFileIcon />}
                  disabled={loading || !cuentaActual}
                >
                  Adjuntar Comprobante
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={loading || !cuentaActual}
                  />
                </Button>
                {comprobante && (
                  <>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }} title={comprobante.name}>
                      {comprobante.name}
                    </Typography>
                    <Tooltip title="Ver comprobante">
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={handleVerComprobante}
                        disabled={loading}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Cotización Vigente */}
        {cotizacionVigente && (
          <Paper sx={{ p: 1.5, bgcolor: 'background.paper', mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Cotización Vigente
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                Dólar: {formatCurrency.guaranies(cotizacionVigente.valorDolar)}
              </Typography>
              <Typography variant="body2">
                Real: {formatCurrency.guaranies(cotizacionVigente.valorReal)}
              </Typography>
            </Box>
          </Paper>
        )}
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
          onClick={handleGuardarDeposito}
          disabled={loading || !cuentaActual || !monto}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Procesando...' : 'Guardar Depósito'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepositoBancario; 