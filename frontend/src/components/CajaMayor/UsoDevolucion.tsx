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
  Tabs,
  Tab,
  Divider,
  FormHelperText,
  Autocomplete,
  InputAdornment,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useCotizacion } from '../../contexts/CotizacionContext';
import { formatCurrency } from '../../utils/formatUtils';
import { handleInputClick } from '../../utils/inputUtils';
import { personaService } from '../../services/personaService';
import { usoDevolucionService } from '../../services/usoDevolucionService';
import { useAuth } from '../../contexts/AuthContext';

interface UsoDevolucionProps {
  open: boolean;
  onClose: () => void;
  onGuardarExito: () => void;
}

// Interfaz para representar los usuarios autorizados
interface Usuario {
  id: string;
  nombre: string;
  direccion: string;
  documento: string;
}

// Interfaz para saldos de usuario
interface SaldoUsuario {
  usuarioId: string;
  guaranies: number;
  dolares: number;
  reales: number;
}

// Tipo de operación
type TipoOperacion = 'USO' | 'DEVOLUCION';

const UsoDevolucion: React.FC<UsoDevolucionProps> = ({ open, onClose, onGuardarExito }) => {
  const { cotizacionVigente } = useCotizacion();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para el tipo de operación (USO o DEVOLUCIÓN)
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion>('USO');
  
  // Estado para los campos de formulario
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('');
  const [montoGuaranies, setMontoGuaranies] = useState<string>('');
  const [montoDolares, setMontoDolares] = useState<string>('');
  const [montoReales, setMontoReales] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  
  // Estado para mantener el usuario actual seleccionado
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  
  // Estado para la búsqueda de usuarios
  const [busquedaUsuario, setBusquedaUsuario] = useState<string>('');
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  
  // Estado para el saldo del usuario
  const [saldoUsuario, setSaldoUsuario] = useState<SaldoUsuario | null>(null);
  
  // Simulación de saldos de usuarios (esto vendría de una API)
  // En una implementación real, esto vendría de un servicio
  const saldosUsuarios: SaldoUsuario[] = [
    { usuarioId: '1', guaranies: 500000, dolares: 0, reales: 0 },
    { usuarioId: '2', guaranies: -200000, dolares: 50, reales: 0 },
    { usuarioId: '3', guaranies: 0, dolares: 0, reales: 100 },
    { usuarioId: '4', guaranies: 1500000, dolares: -20, reales: 0 },
    { usuarioId: '5', guaranies: -300000, dolares: 0, reales: -50 },
  ];
  
  // Resetear estados cuando se abre/cierra el diálogo
  useEffect(() => {
    if (!open) {
      resetearEstados(false);
    }
  }, [open]);
  
  // Actualizar el usuario actual cuando cambia la selección
  useEffect(() => {
    if (usuarioSeleccionado) {
      // Primero buscamos en usuariosFiltrados
      const usuario = usuariosFiltrados.find(u => u.id === usuarioSeleccionado);
      if (usuario) {
        setUsuarioActual(usuario);
      }
      // Si no se encuentra y el usuarioActual actual tiene el mismo ID, mantenemos ese valor
      // Esto previene que los detalles del usuario desaparezcan cuando cambia usuariosFiltrados
    } else {
      setUsuarioActual(null);
    }
  }, [usuarioSeleccionado, usuariosFiltrados]);
  
  // Modificar el efecto para la búsqueda de usuarios sin afectar al usuario seleccionado
  useEffect(() => {
    // Si el campo de búsqueda está vacío y hay un usuario seleccionado, no limpiar la lista filtrada
    // Esto evita que los detalles desaparezcan cuando el campo se vacía
    if (busquedaUsuario.trim() === '' && usuarioActual) {
      return;
    }
    
    // Si la búsqueda coincide con el formato "nombre - documento" del usuario seleccionado, no hacer búsqueda
    if (usuarioActual && busquedaUsuario === `${usuarioActual.nombre} - ${usuarioActual.documento}`) {
      return; // Evitamos buscar de nuevo cuando ya tenemos al usuario seleccionado
    }
    
    setBuscandoUsuarios(true);
    
    // Usamos la API real para buscar personas
    const searchPersonas = async () => {
      try {
        const personas = await personaService.searchPersonas(busquedaUsuario);
        
        // Mapeamos al formato esperado por el componente
        const usuariosMapeados: Usuario[] = personas.map((persona) => ({
          id: persona.id.toString(),
          nombre: persona.nombreCompleto,
          documento: persona.documento || '',
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
  }, [busquedaUsuario, usuarioActual]);
  
  // Efecto para cargar el saldo del usuario cuando cambia el usuario seleccionado
  useEffect(() => {
    const cargarSaldoUsuario = async () => {
      if (!usuarioSeleccionado) {
        setSaldoUsuario(null);
        return;
      }
      
      try {
        setLoading(true);
        // Llamar al servicio real para obtener el saldo
        const saldoObtenido = await usoDevolucionService.getSaldoPersona(parseInt(usuarioSeleccionado));
        setSaldoUsuario({
          usuarioId: usuarioSeleccionado,
          guaranies: saldoObtenido.guaranies,
          dolares: saldoObtenido.dolares,
          reales: saldoObtenido.reales
        });
      } catch (error) {
        console.error('Error al cargar saldo del usuario:', error);
        setSaldoUsuario({
          usuarioId: usuarioSeleccionado,
          guaranies: 0,
          dolares: 0,
          reales: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    cargarSaldoUsuario();
  }, [usuarioSeleccionado]);
  
  // Función para resetear todos los estados preservando el usuario seleccionado si es necesario
  const resetearEstados = (preservarUsuario = false) => {
    setTipoOperacion('USO');
    if (!preservarUsuario) {
      setUsuarioSeleccionado('');
      setUsuarioActual(null);
      setBusquedaUsuario('');
    }
    setMontoGuaranies('');
    setMontoDolares('');
    setMontoReales('');
    setMotivo('');
    setError(null);
    setSuccessMessage(null);
  };
  
  // Función para formatear valores en guaraníes
  const formatGuaranies = (value: string): string => {
    // Remover caracteres no numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Si está vacío, retornar vacío
    if (!numericValue) return '';
    
    // Convertir a número para validar
    const number = parseInt(numericValue, 10);
    
    // Formatear con separadores de miles
    return number ? new Intl.NumberFormat('es-PY').format(number) : '';
  };
  
  // Función para formatear valores con decimales (dólares, reales)
  const formatDecimal = (value: string, moneda: 'USD' | 'BRL'): string => {
    if (moneda === 'BRL') {
      // Para reales: formato con punto para miles y coma para decimales
      const numericValue = value.replace(/\D/g, '');
      if (numericValue === '') {
        return '';
      }
      
      // Asegurar que tengamos al menos 3 dígitos para tener formato con decimales
      const paddedValue = numericValue.padStart(3, '0');
      
      // Separar enteros y decimales
      const decimalPart = paddedValue.slice(-2);
      const integerPart = paddedValue.slice(0, -2).replace(/^0+/, '') || '0'; // Quitar ceros iniciales
      
      // Formatear la parte entera con puntos para los miles
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      
      return `${formattedInteger},${decimalPart}`;
    } else if (moneda === 'USD') {
      // Para dólares: formato con coma para miles y punto para decimales
      const numericValue = value.replace(/\D/g, '');
      if (numericValue === '') {
        return '';
      }
      
      // Asegurar que tengamos al menos 3 dígitos para tener formato con decimales
      const paddedValue = numericValue.padStart(3, '0');
      
      // Separar enteros y decimales
      const decimalPart = paddedValue.slice(-2);
      const integerPart = paddedValue.slice(0, -2).replace(/^0+/, '') || '0'; // Quitar ceros iniciales
      
      // Formatear la parte entera con comas para los miles (formato USA)
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      
      return `${formattedInteger}.${decimalPart}`;
    }
    
    return value;
  };
  
  // Manejar cambios en los montos
  const handleGuaraniesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMontoGuaranies(formatGuaranies(e.target.value));
  };
  
  const handleDolaresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMontoDolares(formatDecimal(e.target.value, 'USD'));
  };
  
  const handleRealesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMontoReales(formatDecimal(e.target.value, 'BRL'));
  };
  
  // Función para procesar la operación
  const handleProcesarOperacion = async () => {
    // Validaciones
    if (!usuarioSeleccionado) {
      setError('Debe seleccionar un usuario');
      return;
    }
    
    // Verificar que al menos un monto sea mayor a cero
    const guaranies = montoGuaranies ? parseInt(montoGuaranies.replace(/\./g, ''), 10) : 0;
    
    // Para dólares, reemplazar los separadores correctamente según formato USA
    const dolares = montoDolares ? parseFloat(montoDolares.replace(/,/g, '')) : 0;
    
    // Para reales, reemplazar los separadores correctamente según formato brasileño
    const reales = montoReales ? parseFloat(montoReales.replace(/\./g, '').replace(',', '.')) : 0;
    
    if (guaranies === 0 && dolares === 0 && reales === 0) {
      setError('Debe ingresar al menos un monto mayor a cero');
      return;
    }
    
    if (!motivo) {
      setError('Debe ingresar un motivo para la operación');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Crear datos para enviar a la API
      const datosOperacion = {
        tipo: tipoOperacion,
        persona_id: parseInt(usuarioSeleccionado),
        persona_nombre: usuarioActual?.nombre || '',
        guaranies,
        dolares,
        reales,
        motivo
      };
      
      // Llamar al servicio para registrar la operación
      const respuesta = await usoDevolucionService.create(datosOperacion);
      
      // Llamar a la función de refresco del componente padre
      onGuardarExito();
      
      // Construir mensaje de éxito con los montos
      let mensaje = `${tipoOperacion === 'USO' ? 'Uso' : 'Devolución'} registrada con éxito para ${usuarioActual?.nombre}.`;
      let detalles = '';
      
      if (guaranies > 0) {
        detalles += `${formatCurrency.guaranies(guaranies)} `;
      }
      
      if (dolares > 0) {
        detalles += `${formatCurrency.dollars(dolares)} `;
      }
      
      if (reales > 0) {
        detalles += `${formatCurrency.reals(reales)} `;
      }
      
      setSuccessMessage(`${mensaje} Montos: ${detalles}`);
      
      // Actualizar el saldo del usuario con el saldo actualizado
      if (respuesta.saldo) {
        setSaldoUsuario({
          usuarioId: usuarioSeleccionado,
          guaranies: respuesta.saldo.guaranies,
          dolares: respuesta.saldo.dolares,
          reales: respuesta.saldo.reales
        });
      }
      
      // Limpiar los montos y el motivo pero preservar el usuario seleccionado
      resetearEstados(true);
      
      // Cerrar el formulario después de 2 segundos
      setTimeout(() => {
        setSuccessMessage(null);
        handleClose(); // Cerrar el formulario automáticamente después del éxito
      }, 2000);
      
    } catch (error) {
      console.error(`Error al procesar la ${tipoOperacion === 'USO' ? 'entrega' : 'devolución'}:`, error);
      setError(`Error al registrar la ${tipoOperacion === 'USO' ? 'entrega' : 'devolución'}. Intente nuevamente.`);
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
  
  // Cambiar el tipo de operación
  const handleChangeTipoOperacion = (_event: React.SyntheticEvent, newValue: TipoOperacion) => {
    setTipoOperacion(newValue);
  };
  
  // Verificar si algún monto está ingresado
  const hayMontosIngresados = (): boolean => {
    return Boolean(montoGuaranies || montoDolares || montoReales);
  };
  
  // Función para determinar si hay saldo pendiente
  const haySaldoPendiente = (): boolean => {
    if (!saldoUsuario) return false;
    return saldoUsuario.guaranies !== 0 || saldoUsuario.dolares !== 0 || saldoUsuario.reales !== 0;
  };
  
  // Función para renderizar el saldo en un formato legible
  const renderSaldo = (valor: number, moneda: string): JSX.Element => {
    let formateado = "";
    let color = "text.primary";
    const icono = valor > 0 
      ? <ArrowUpwardIcon fontSize="small" color="success" /> 
      : valor < 0 
        ? <ArrowDownwardIcon fontSize="small" color="error" /> 
        : null;
    
    switch (moneda) {
      case 'guaranies':
        // Formato 1.000 para guaraníes
        formateado = new Intl.NumberFormat('es-PY', { 
          useGrouping: true,
          maximumFractionDigits: 0
        }).format(Math.abs(valor));
        break;
      case 'dolares':
        // Formato 1,234.56 para dólares
        formateado = new Intl.NumberFormat('en-US', { 
          useGrouping: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(Math.abs(valor));
        break;
      case 'reales':
        // Formato 1.234,56 para reales
        formateado = new Intl.NumberFormat('pt-BR', { 
          useGrouping: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(Math.abs(valor));
        break;
    }
    
    color = valor > 0 ? "success.main" : valor < 0 ? "error.main" : "text.primary";
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {icono}
        <Typography variant="body2" sx={{ color }}>
          {moneda === 'guaranies' ? 'G$ ' : moneda === 'dolares' ? 'U$D ' : 'R$ '}
          {formateado}
        </Typography>
      </Box>
    );
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
          <Typography variant="h6">Uso y Devolución de Efectivo</Typography>
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
        
        {/* Tabs para cambiar entre Uso y Devolución */}
        <Tabs
          value={tipoOperacion}
          onChange={handleChangeTipoOperacion}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab 
            value="USO" 
            label="Uso de Efectivo" 
            icon={<MoneyIcon />} 
            iconPosition="start"
          />
          <Tab 
            value="DEVOLUCION" 
            label="Devolución de Efectivo" 
            icon={<MoneyIcon />} 
            iconPosition="start"
          />
        </Tabs>
        
        <Grid container spacing={3}>
          {/* Selección de Usuario */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {tipoOperacion === 'USO' ? 'Persona que nos presta' : 'Persona a quien devolvemos'}
              </Typography>
              
              <Autocomplete
                id="usuario-autocomplete"
                options={usuariosFiltrados}
                getOptionLabel={(option) => `${option.nombre} - ${option.documento}`}
                filterOptions={(x) => x} // Desactivar el filtrado predeterminado
                value={usuarioActual}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_event, newValue) => {
                  if (newValue) {
                    setUsuarioSeleccionado(newValue.id);
                    setUsuarioActual(newValue);
                    // Al seleccionar una persona, mantenemos su nombre en el campo de búsqueda
                    setBusquedaUsuario(`${newValue.nombre} - ${newValue.documento}`);
                  } else {
                    setUsuarioSeleccionado('');
                    setUsuarioActual(null);
                    setBusquedaUsuario('');
                  }
                }}
                inputValue={busquedaUsuario}
                onInputChange={(_event, newInputValue, reason) => {
                  // No actualizar la búsqueda si estamos seleccionando un elemento o
                  // si es un cambio interno del componente
                  if (reason !== 'reset') {
                    setBusquedaUsuario(newInputValue.toUpperCase());
                  }
                }}
                loading={buscandoUsuarios}
                loadingText="Buscando usuarios..."
                noOptionsText={busquedaUsuario ? "No se encontraron usuarios" : "Ingrese un nombre o documento para buscar"}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar Persona"
                    onClick={handleInputClick}
                    onKeyDown={(e) => handleKeyDown(e, 'montoGuaranies')}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {buscandoUsuarios ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    disabled={loading}
                    autoComplete="off"
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                )}
              />
              
              {usuarioActual && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Detalles de la Persona
                  </Typography>
                  <Typography variant="body2">
                    Nombre: {usuarioActual.nombre}
                  </Typography>
                  <Typography variant="body2">
                    Dirección: {usuarioActual.direccion}
                  </Typography>
                  <Typography variant="body2">
                    Documento: {usuarioActual.documento}
                  </Typography>
                  
                  {/* Saldo del usuario */}
                  {usuarioActual && saldoUsuario && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Saldo Pendiente
                      </Typography>
                      
                      {!haySaldoPendiente() ? (
                        <Typography variant="body2" color="text.secondary">
                          No tiene saldo pendiente
                        </Typography>
                      ) : (
                        <Stack spacing={0.5}>
                          {saldoUsuario.guaranies !== 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Guaraníes:</Typography>
                              {renderSaldo(saldoUsuario.guaranies, 'guaranies')}
                            </Box>
                          )}
                          
                          {saldoUsuario.dolares !== 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Dólares:</Typography>
                              {renderSaldo(saldoUsuario.dolares, 'dolares')}
                            </Box>
                          )}
                          
                          {saldoUsuario.reales !== 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Reales:</Typography>
                              {renderSaldo(saldoUsuario.reales, 'reales')}
                            </Box>
                          )}
                          
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {saldoUsuario.guaranies > 0 || saldoUsuario.dolares > 0 || saldoUsuario.reales > 0 
                              ? "* Valores positivos indican montos prestados pendientes de devolución" 
                              : "* Valores negativos indican que ha devuelto más de lo prestado"}
                          </Typography>
                        </Stack>
                      )}
                    </>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Detalles de la Operación */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Detalles de la {tipoOperacion === 'USO' ? 'Entrega' : 'Devolución'}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Montos
              </Typography>
              
              <TextField
                fullWidth
                id="montoGuaranies"
                label="Guaraníes"
                value={montoGuaranies}
                onChange={handleGuaraniesChange}
                onKeyDown={(e) => handleKeyDown(e, 'montoDolares')}
                onClick={handleInputClick}
                disabled={loading}
                autoComplete="off"
                placeholder="0"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: <Typography variant="caption">&nbsp;G$</Typography>
                }}
              />
              
              <TextField
                fullWidth
                id="montoDolares"
                label="Dólares"
                value={montoDolares}
                onChange={handleDolaresChange}
                onKeyDown={(e) => handleKeyDown(e, 'montoReales')}
                onClick={handleInputClick}
                disabled={loading}
                autoComplete="off"
                placeholder="0"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: <Typography variant="caption">&nbsp;U$D</Typography>
                }}
              />
              
              <TextField
                fullWidth
                id="montoReales"
                label="Reales"
                value={montoReales}
                onChange={handleRealesChange}
                onKeyDown={(e) => handleKeyDown(e, 'motivo')}
                onClick={handleInputClick}
                disabled={loading}
                autoComplete="off"
                placeholder="0"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: <Typography variant="caption">&nbsp;R$</Typography>
                }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <TextField
                fullWidth
                id="motivo"
                label="Motivo"
                multiline
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value.toUpperCase())}
                onKeyDown={(e) => handleKeyDown(e, 'procesar-button')}
                onClick={handleInputClick}
                disabled={loading}
                autoComplete="off"
                sx={{ mb: 1 }}
              />
              <FormHelperText>
                Describa brevemente el motivo de la {tipoOperacion === 'USO' ? 'entrega' : 'devolución'} de efectivo
              </FormHelperText>
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
          id="procesar-button"
          variant="contained" 
          color={tipoOperacion === 'USO' ? 'primary' : 'success'}
          onClick={handleProcesarOperacion}
          disabled={loading || !usuarioActual || !hayMontosIngresados() || !motivo}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Procesando...' : tipoOperacion === 'USO' ? 'Registrar Uso' : 'Registrar Devolución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UsoDevolucion; 