import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { AttachFile as AttachFileIcon } from '@mui/icons-material';
import { useCajas } from '../CajasContext';
import { formatearIdCaja } from '../helpers';
import { serviciosOperacionesBancarias } from '../constants';
import axios from 'axios';
import { useCotizacion } from '../../../contexts/CotizacionContext';
import posService, { Pos } from '../../../services/posService';

// Constantes
const API_URL = 'http://localhost:3000/api';

interface FormOperacionProps {
  open: boolean;
  onClose: () => void;
}

const FormOperacion: React.FC<FormOperacionProps> = ({ open, onClose }) => {
  const {
    cajaSeleccionada,
    formOperacion,
    setFormOperacion,
    cargarOperacionesBancarias
  } = useCajas();
  
  // Usar el contexto de cotización
  const { cotizacionVigente } = useCotizacion();
  
  // Estado para controlar la apertura del dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Estado para almacenar el POS seleccionado
  const [posSeleccionado, setPosSeleccionado] = useState<Pos | null>(null);
  
  // Estados para controlar errores y loading
  const [posError, setPosError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para almacenar cuentas bancarias
  const [cuentasBancarias, setCuentasBancarias] = useState<any[]>([]);
  
  // Referencias para los campos de texto
  const numeroComprobanteRef = useRef<HTMLInputElement>(null);
  const montoRef = useRef<HTMLInputElement>(null);
  
  // Cargar las cuentas bancarias al inicio
  useEffect(() => {
    const cargarCuentasBancarias = async () => {
      try {
        const response = await axios.get(`${API_URL}/cuentas-bancarias`);
        setCuentasBancarias(response.data);
      } catch (error) {
        console.error('Error al cargar cuentas bancarias:', error);
      }
    };
    
    cargarCuentasBancarias();
  }, []);
  
  // Función para manejar cambios en campos de texto
  const handleOperacionFormChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'monto') {
      // Resetear el error del POS
      setPosError(null);
      
      // Convertir el texto formateado a número
      const monto = textoFormateadoANumero(value);
      
      // Calcular el monto a cobrar basado en el tipo y la moneda del POS
      let montoACobrar = 0;
      
      if (formOperacion.tipo === 'pos' && posSeleccionado && posSeleccionado.cuentaBancaria) {
        const monedaPOS = posSeleccionado.cuentaBancaria.moneda;
        
        if (monedaPOS === 'PYG') {
          montoACobrar = monto * 1.06;
        } else if (monedaPOS === 'BRL' && cotizacionVigente) {
          const montoEnReales = monto / cotizacionVigente.valorReal;
          const montoConComisionReales = montoEnReales * 1.06;
          montoACobrar = montoConComisionReales * cotizacionVigente.valorReal;
        } else {
          montoACobrar = monto * 1.06;
        }
      } else if (formOperacion.tipo === 'pos') {
        montoACobrar = monto * 1.06;
      } else {
        // Para transferencias, el montoACobrar es igual al monto
        montoACobrar = monto;
      }
      
      setFormOperacion(prev => ({
        ...prev,
        [name]: monto,
        montoACobrar
      }));
    } else if (name === 'codigoBarrasPos') {
      // Resetear el error
      setPosError(null);
      
      // Actualizar inmediatamente el código de barras
      setFormOperacion(prev => ({
        ...prev,
        [name]: value,
        posDescripcion: 'Buscando...'
      }));
      
      if (value.trim() === '') {
        setFormOperacion(prev => ({
          ...prev,
          posDescripcion: ''
        }));
        setPosSeleccionado(null);
        return;
      }
      
      try {
        // Buscar el POS por código de barras
        const pos = await posService.getPosByCodigoBarras(value);
        setPosSeleccionado(pos);
        
        if (pos) {
          // Calcular montoACobrar según la moneda
          let montoACobrar = 0;
          
          if (pos.cuentaBancaria) {
            const monedaPOS = pos.cuentaBancaria.moneda;
            const monto = formOperacion.monto || 0;
            
            if (monedaPOS === 'PYG') {
              montoACobrar = monto * 1.06;
            } else if (monedaPOS === 'BRL' && cotizacionVigente) {
              const montoEnReales = monto / cotizacionVigente.valorReal;
              const montoConComisionReales = montoEnReales * 1.06;
              montoACobrar = montoConComisionReales * cotizacionVigente.valorReal;
            } else {
              montoACobrar = monto * 1.06;
            }
          } else {
            montoACobrar = (formOperacion.monto || 0) * 1.06;
          }
          
          setFormOperacion(prev => ({
            ...prev,
            posDescripcion: pos.nombre || '',
            montoACobrar
          }));
        } else {
          setPosError('Código de POS no válido');
          setFormOperacion(prev => ({
            ...prev,
            posDescripcion: `POS ${value} (No encontrado)`
          }));
        }
      } catch (error) {
        console.error('Error al obtener descripción del POS:', error);
        setPosError('Error al buscar el POS');
        setFormOperacion(prev => ({
          ...prev,
          posDescripcion: 'Error al buscar el POS'
        }));
      }
    } else {
      setFormOperacion(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Función para manejar cambios en selects
  const handleOperacionSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    if (name === 'tipo') {
      // Resetear el error del POS
      setPosError(null);
      
      // Reiniciar campos específicos según el tipo
      const newType = value as 'pos' | 'transferencia';
      let newState: Partial<any> = { 
        tipo: newType,
        cuentaBancariaId: undefined,
        tipoServicio: ''
      };
      
      // Calcular montoACobrar para ambos tipos
      const monto = formOperacion.monto || 0;
      if (newType === 'pos') {
        newState.montoACobrar = monto * 1.06;
        newState.codigoBarrasPos = formOperacion.codigoBarrasPos || '';
        newState.posDescripcion = formOperacion.posDescripcion || '';
        newState.numeroComprobante = formOperacion.numeroComprobante || '';
      } else {
        // Para transferencias también necesitamos montoACobrar
        newState.montoACobrar = monto;
        newState.codigoBarrasPos = undefined;
        newState.posDescripcion = undefined;
        newState.numeroComprobante = undefined;
        setPosSeleccionado(null);
      }
      
      setFormOperacion(prev => ({
        ...prev,
        ...newState
      }));
    } else {
      setFormOperacion(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Función para manejar cambios en archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormOperacion(prev => ({
        ...prev,
        archivoAdjunto: file,
        nombreArchivo: file.name
      }));
    }
  };
  
  // Función para seleccionar un servicio
  const seleccionarServicio = (servicio: string, event?: React.MouseEvent<HTMLLIElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('Seleccionando servicio:', servicio);
    
    // Actualizar el estado con el servicio seleccionado
    setFormOperacion(prev => ({...prev, tipoServicio: servicio}));
    
    // Cerrar el dropdown con un pequeño retraso para permitir que el estado se actualice primero
    setTimeout(() => {
      setDropdownOpen(false);
    }, 100);
  };
  
  // Función para convertir texto formateado a número
  const textoFormateadoANumero = (texto: string): number => {
    if (!texto) return 0;
    return parseFloat(texto.replace(/\./g, '').replace(',', '.')) || 0;
  };
  
  // Función para obtener el símbolo de moneda según la moneda del POS
  const obtenerSimboloMoneda = (): string => {
    if (posSeleccionado && posSeleccionado.cuentaBancaria) {
      const moneda = posSeleccionado.cuentaBancaria.moneda;
      if (moneda === 'BRL') return 'R$';
      if (moneda === 'USD') return 'US$';
    }
    return '₲';
  };
  
  // Función para formatear monto según la moneda
  const formatearMonto = (monto: number): string => {
    if (!monto) return '';
    
    if (posSeleccionado && posSeleccionado.cuentaBancaria) {
      const moneda = posSeleccionado.cuentaBancaria.moneda;
      if (moneda === 'BRL' && cotizacionVigente) {
        const montoEnReales = monto / cotizacionVigente.valorReal;
        return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(montoEnReales);
      }
      if (moneda === 'USD' && cotizacionVigente) {
        const montoEnDolares = monto / cotizacionVigente.valorDolar;
        return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(montoEnDolares);
      }
    }
    
    return new Intl.NumberFormat('es-PY').format(monto);
  };
  
  // Función para manejar la tecla Enter en el campo de código de barras
  const handleCodigoBarrasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (!posError && formOperacion.codigoBarrasPos && formOperacion.codigoBarrasPos.trim() !== '') {
        if (numeroComprobanteRef.current) {
          numeroComprobanteRef.current.focus();
        }
      }
    }
  };
  
  // Función para guardar la operación bancaria
  const guardarOperacion = async () => {
    if (!cajaSeleccionada) {
      setError('No hay una caja seleccionada');
      return;
    }

    // Validación básica
    if (!formOperacion.tipo) {
      setError('Debe seleccionar un tipo de operación');
      return;
    }

    if (!formOperacion.monto || formOperacion.monto <= 0) {
      setError('Debe ingresar un monto válido');
      return;
    }

    if (formOperacion.tipo === 'pos' && !formOperacion.codigoBarrasPos) {
      setError('Debe ingresar el código de barras del POS');
      return;
    }

    if (formOperacion.tipo === 'transferencia' && !formOperacion.cuentaBancariaId) {
      setError('Debe seleccionar una cuenta bancaria');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      console.log('Guardando operación bancaria...');
      console.log('Datos a enviar:', formOperacion);
      
      // Crear FormData para enviar los datos y el archivo
      const formData = new FormData();
      
      // Preparar los datos para enviar
      const datosOperacion = {
        tipo: formOperacion.tipo,
        monto: formOperacion.monto,
        montoACobrar: formOperacion.montoACobrar,
        tipoServicio: formOperacion.tipoServicio || 'Sin especificar',
        codigoBarrasPos: formOperacion.codigoBarrasPos,
        posDescripcion: formOperacion.posDescripcion,
        numeroComprobante: formOperacion.numeroComprobante,
        cuentaBancariaId: formOperacion.tipo === 'transferencia' ? Number(formOperacion.cuentaBancariaId) : undefined,
        cajaId: cajaSeleccionada.id,
        // Agregar flag para indicar que se debe crear un movimiento en farmacia
        crearMovimientoFarmacia: true
      };
      
      console.log('Datos operación preparados:', datosOperacion);
      
      // Añadir datos como JSON
      formData.append('data', JSON.stringify(datosOperacion));
      
      // Añadir archivo si existe
      if (formOperacion.archivoAdjunto) {
        formData.append('comprobante', formOperacion.archivoAdjunto);
        console.log('Archivo adjunto añadido:', formOperacion.archivoAdjunto.name);
      }
      
      let respuesta;
      
      // Enviar la petición
      if (formOperacion.id) {
        // Actualizar operación existente
        console.log(`Actualizando operación con ID ${formOperacion.id}...`);
        respuesta = await axios.put(`${API_URL}/operaciones-bancarias/${formOperacion.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Crear nueva operación
        console.log('Creando nueva operación...');
        respuesta = await axios.post(`${API_URL}/operaciones-bancarias`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      console.log('Respuesta del servidor:', respuesta.data);

      // Recargar operaciones
      if (cargarOperacionesBancarias) {
        console.log('Recargando operaciones bancarias...');
        const operacionesActualizadas = await cargarOperacionesBancarias(cajaSeleccionada.id);
        console.log('Operaciones actualizadas:', operacionesActualizadas);
      } else {
        console.error('La función cargarOperacionesBancarias no está disponible');
      }

      // Limpiar formulario y cerrar
      setFormOperacion({
        tipo: 'pos',
        monto: 0,
        tipoServicio: ''
      });
      onClose();
    } catch (error: any) {
      console.error('Error al guardar operación bancaria:', error);
      setError(error.response?.data?.error || 'Error al guardar la operación bancaria');
    } finally {
      setGuardando(false);
    }
  };
  
  // Función para manejar cambios en el tipo de operación
  const handleTipoOperacionChange = (e: SelectChangeEvent<string>) => {
    const tipo = e.target.value as "pos" | "transferencia";

    const monto = formOperacion.monto || 0;
    
    // Resetear valores específicos del formulario al cambiar de tipo
    setFormOperacion(prev => {
      const updatedForm = {
        ...prev,
        tipo,
        posId: null,
        codigoBarrasPos: '',
        // Para transferencias, el montoACobrar es igual al monto
        // Para POS, aplicamos el 6% de comisión
        montoACobrar: tipo === 'transferencia' ? monto : monto * 1.06
      };
      
      return updatedForm;
    });
    
    // Resetear el POS seleccionado si se cambia de tipo
    setPosSeleccionado(null);
    
    // Poner el foco en el campo monto después de cambiar el tipo
    setTimeout(() => {
      if (montoRef.current) {
        montoRef.current.focus();
      }
    }, 100);
  };
  
  // Función para manejar cambios en el monto
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Usar la función que maneja correctamente el formato numérico
    const montoNumerico = textoFormateadoANumero(value);
    
    setFormOperacion(prev => ({
      ...prev,
      monto: montoNumerico,
      // Actualizar montoACobrar según el tipo de operación
      montoACobrar: prev.tipo === 'transferencia' ? montoNumerico : montoNumerico * 1.06
    }));
  };
  
  const handleOperacionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newState = { ...formOperacion, [name]: value };

    // Si es el monto, actualizar también el montoACobrar para POS
    if (name === 'monto') {
      const montoValue = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
      newState.monto = montoValue;
      
      // Actualizar monto a cobrar dependiendo del tipo
      if (formOperacion.tipo === 'pos') {
        newState.montoACobrar = montoValue * 1.06;
      } else if (formOperacion.tipo === 'transferencia') {
        // Para transferencias, el montoACobrar es igual al monto
        newState.montoACobrar = montoValue;
      }
    }

    setFormOperacion(newState);
  };
  
  // Efecto para poner el foco en el campo monto cuando se abre el formulario
  useEffect(() => {
    if (open && montoRef.current) {
      setTimeout(() => {
        montoRef.current?.focus();
      }, 300);
    }
  }, [open]);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {formOperacion.id ? 'Editar Operación Bancaria' : 'Nueva Operación Bancaria'}
      </DialogTitle>
      <DialogContent>
        {cajaSeleccionada && (
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            {formatearIdCaja(cajaSeleccionada.id)} (ID: {cajaSeleccionada.cajaEnteroId})
          </Typography>
        )}
        {error && (
          <Box sx={{ mt: 2, mb: 2, p: 1, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
        
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Operación</InputLabel>
                <Select
                  name="tipo"
                  value={formOperacion.tipo}
                  label="Tipo de Operación"
                  onChange={handleTipoOperacionChange}
                  autoComplete="off"
                >
                  <MenuItem value="pos">POS</MenuItem>
                  <MenuItem value="transferencia">Transferencia Bancaria</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monto"
                name="monto"
                value={formOperacion.monto ? new Intl.NumberFormat('es-PY').format(formOperacion.monto) : ''}
                onChange={handleMontoChange}
                autoComplete="off"
                inputRef={montoRef}
                InputProps={{
                  startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₲</Typography>,
                }}
                helperText="Ingrese el monto en guaraníes"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </Grid>
            
            {formOperacion.tipo === 'pos' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Código de Barras POS"
                    name="codigoBarrasPos"
                    value={formOperacion.codigoBarrasPos || ''}
                    onChange={handleOperacionFormChange}
                    onKeyDown={handleCodigoBarrasKeyDown}
                    autoComplete="off"
                    error={posError !== null}
                    helperText={posError || "Escanee o ingrese el código de barras del POS"}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Número de Comprobante"
                    name="numeroComprobante"
                    value={formOperacion.numeroComprobante || ''}
                    onChange={handleOperacionFormChange}
                    autoComplete="off"
                    inputRef={numeroComprobanteRef}
                    helperText="Ingrese el número de comprobante"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Descripción POS"
                    name="posDescripcion"
                    value={formOperacion.posDescripcion || ''}
                    onChange={handleOperacionFormChange}
                    autoComplete="off"
                    InputProps={{
                      readOnly: true,
                    }}
                    error={posError !== null}
                    helperText={
                      posError ? posError :
                      (posSeleccionado && posSeleccionado.cuentaBancaria ? 
                      `Moneda: ${posSeleccionado.cuentaBancaria.moneda}` : 
                      "Descripción del POS (se completa automáticamente)")
                    }
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Monto a Cobrar (6%)"
                    name="montoACobrar"
                    value={formOperacion.montoACobrar ? 
                      posSeleccionado && posSeleccionado.cuentaBancaria?.moneda === 'BRL' && cotizacionVigente ? 
                      `${formatearMonto(formOperacion.montoACobrar)} (₲ ${new Intl.NumberFormat('es-PY').format(formOperacion.montoACobrar)})` :
                      formatearMonto(formOperacion.montoACobrar) : 
                      ''
                    }
                    autoComplete="off"
                    InputProps={{
                      readOnly: true,
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{obtenerSimboloMoneda()}</Typography>,
                    }}
                    helperText={`Monto a cobrar con comisión del 6% (${posSeleccionado?.cuentaBancaria?.moneda || 'PYG'})`}
                  />
                </Grid>
              </>
            )}
            
            {formOperacion.tipo === 'transferencia' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Cuenta Bancaria</InputLabel>
                    <Select
                      name="cuentaBancariaId"
                      value={formOperacion.cuentaBancariaId ? formOperacion.cuentaBancariaId.toString() : ''}
                      label="Cuenta Bancaria"
                      onChange={handleOperacionSelectChange}
                      autoComplete="off"
                    >
                      <MenuItem value="" disabled>Seleccione una cuenta bancaria</MenuItem>
                      {cuentasBancarias.map(cuenta => (
                        <MenuItem key={cuenta.id} value={cuenta.id.toString()}>
                          {cuenta.banco} - {cuenta.numeroCuenta} ({cuenta.moneda})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Monto a Cobrar"
                    name="montoACobrar"
                    value={formOperacion.montoACobrar ? formatearMonto(formOperacion.montoACobrar) : ''}
                    autoComplete="off"
                    InputProps={{
                      readOnly: true,
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₲</Typography>,
                    }}
                    helperText="Monto a cobrar (igual al monto ingresado)"
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Servicio</InputLabel>
                <Select
                  name="tipoServicio"
                  value={formOperacion.tipoServicio || ''}
                  label="Tipo de Servicio"
                  onChange={handleOperacionSelectChange}
                  autoComplete="off"
                  renderValue={(selected) => selected as string}
                  open={dropdownOpen}
                  onOpen={() => setDropdownOpen(true)}
                  onClose={() => setDropdownOpen(false)}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 400,
                        width: 800
                      },
                      onClick: (e: React.MouseEvent) => e.stopPropagation()
                    }
                  }}
                >
                  <MenuItem value="">Seleccione un servicio</MenuItem>
                  <Box sx={{ display: 'flex', flexDirection: 'row', p: 1 }}>
                    {/* Columna TIGO */}
                    <Box sx={{ width: 200 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#0066CC', backgroundColor: '#E6F0FF', p: 0.5, borderRadius: 1, textAlign: 'center' }}>
                        TIGO
                      </Typography>
                      {serviciosOperacionesBancarias.tigo.map(servicio => (
                        <MenuItem 
                          key={`tigo-${servicio}`}
                          value={`Tigo ${servicio}`}
                          onClick={(event) => seleccionarServicio(`Tigo ${servicio}`, event)}
                        >
                          {servicio}
                        </MenuItem>
                      ))}
                    </Box>
                    
                    {/* Columna PERSONAL */}
                    <Box sx={{ width: 200 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#CC0000', backgroundColor: '#FFEBEE', p: 0.5, borderRadius: 1, textAlign: 'center' }}>
                        PERSONAL
                      </Typography>
                      {serviciosOperacionesBancarias.personal.map(servicio => (
                        <MenuItem 
                          key={`personal-${servicio}`}
                          value={`Personal ${servicio}`}
                          onClick={(event) => seleccionarServicio(`Personal ${servicio}`, event)}
                        >
                          {servicio}
                        </MenuItem>
                      ))}
                    </Box>
                    
                    {/* Columna CLARO */}
                    <Box sx={{ width: 200 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#FF0000', backgroundColor: '#FFF0F0', p: 0.5, borderRadius: 1, textAlign: 'center' }}>
                        CLARO
                      </Typography>
                      {serviciosOperacionesBancarias.claro.map(servicio => (
                        <MenuItem 
                          key={`claro-${servicio}`}
                          value={`Claro ${servicio}`}
                          onClick={(event) => seleccionarServicio(`Claro ${servicio}`, event)}
                        >
                          {servicio}
                        </MenuItem>
                      ))}
                    </Box>
                    
                    {/* Columna OTROS SERVICIOS */}
                    <Box sx={{ width: 200 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#9C27B0', backgroundColor: '#F3E5F5', p: 0.5, borderRadius: 1, textAlign: 'center' }}>
                        OTROS SERVICIOS
                      </Typography>
                      {serviciosOperacionesBancarias.otrosServicios.map((servicio: string) => (
                        <MenuItem 
                          key={`otros-${servicio}`}
                          value={servicio}
                          onClick={(event) => seleccionarServicio(servicio, event)}
                        >
                          {servicio}
                        </MenuItem>
                      ))}
                    </Box>
                  </Box>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AttachFileIcon />}
                sx={{ mt: 1 }}
              >
                {formOperacion.nombreArchivo || "Adjuntar comprobante"}
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
              </Button>
              {formOperacion.nombreArchivo && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Archivo seleccionado: {formOperacion.nombreArchivo}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={guardando}>
          Cancelar
        </Button>
        <Button 
          onClick={guardarOperacion} 
          variant="contained" 
          color="primary"
          disabled={guardando}
          startIcon={guardando ? <CircularProgress size={20} /> : null}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormOperacion; 