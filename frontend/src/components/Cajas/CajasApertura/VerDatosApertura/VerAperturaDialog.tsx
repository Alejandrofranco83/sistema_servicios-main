import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Box,
  TextField,
  CircularProgress
} from '@mui/material';
import { useCajas } from '../../CajasContext';
import { formatearIdCaja, formatearMontoConSeparadores } from '../../helpers';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { handleInputClick } from '../../../../utils/inputUtils';
import { 
  denominacionesGuaranies, 
  denominacionesReales, 
  denominacionesDolares,
  serviciosIniciales as serviciosDefault 
} from '../../constants';
import { Denominacion } from '../../interfaces';
import axios from 'axios';

interface VerAperturaDialogProps {
  open: boolean;
  onClose: () => void;
}

const VerAperturaDialog: React.FC<VerAperturaDialogProps> = ({ open, onClose }) => {
  const { cajaSeleccionada, setSuccessMessage, setErrorMessage } = useCajas();
  const [modo, setModo] = useState<'visualizacion' | 'edicion'>('visualizacion');
  const [loading, setLoading] = useState(false);
  
  // Verificar si saldoInicial existe y tiene la estructura esperada
  const saldoInicialValido = cajaSeleccionada?.saldoInicial && 
                           cajaSeleccionada.saldoInicial.total &&
                           typeof cajaSeleccionada.saldoInicial.total === 'object';
  
  // Estado para los datos editados (inicializado con los datos actuales)
  const [datosEditados, setDatosEditados] = useState(() => ({
    saldoInicial: cajaSeleccionada?.saldoInicial || { denominaciones: [], total: { PYG: 0, BRL: 0, USD: 0 } },
    saldosServiciosInicial: cajaSeleccionada?.saldosServiciosInicial || []
  }));
  
  // Referencias para los campos de entrada (para navegación con teclado)
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // Función para registrar las refs de los inputs
  const registerInputRef = (id: string, ref: HTMLInputElement | null) => {
    inputRefs.current[id] = ref;
  };

  // Obtener ID del campo de denominación
  const getDenominacionFieldId = (moneda: string, valor: number): string => {
    return `denom-${moneda}-${valor}`;
  };

  // Efecto para inicializar los datos editados con todas las denominaciones cuando cambia cajaSeleccionada o se abre el diálogo
  useEffect(() => {
    if (cajaSeleccionada) {
      // Verificar si saldoInicial tiene la estructura completa
      const saldoValido = cajaSeleccionada.saldoInicial && 
                          cajaSeleccionada.saldoInicial.total &&
                          typeof cajaSeleccionada.saldoInicial.total === 'object';
                           
      // Clonar las denominaciones actuales
      const denominacionesActuales = saldoValido 
        ? [...cajaSeleccionada.saldoInicial.denominaciones] 
        : [];
      
      // Función para verificar si una denominación ya existe
      const existeDenominacion = (valor: number, moneda: 'PYG' | 'BRL' | 'USD') => {
        return denominacionesActuales.some(d => d.valor === valor && d.moneda === moneda);
      };
      
      // Agregar denominaciones faltantes
      const todasDenominaciones = [...denominacionesActuales];
      
      // Agregar denominaciones faltantes de Guaraníes
      denominacionesGuaranies.forEach(denom => {
        if (!existeDenominacion(denom.valor, 'PYG')) {
          todasDenominaciones.push({...denom, cantidad: 0});
        }
      });
      
      // Agregar denominaciones faltantes de Reales
      denominacionesReales.forEach(denom => {
        if (!existeDenominacion(denom.valor, 'BRL')) {
          todasDenominaciones.push({...denom, cantidad: 0});
        }
      });
      
      // Agregar denominaciones faltantes de Dólares
      denominacionesDolares.forEach(denom => {
        if (!existeDenominacion(denom.valor, 'USD')) {
          todasDenominaciones.push({...denom, cantidad: 0});
        }
      });

      // Verificar si hay servicios iniciales
      let serviciosIniciales = [];
      if (cajaSeleccionada.saldosServiciosInicial && Array.isArray(cajaSeleccionada.saldosServiciosInicial)) {
        serviciosIniciales = [...cajaSeleccionada.saldosServiciosInicial];
      } else {
        // Si no hay servicios o no es un array, usar la lista de servicios por defecto
        serviciosIniciales = serviciosDefault.map(s => ({...s, monto: 0}));
      }

      console.log('Servicios iniciales:', serviciosIniciales);
      
      // Actualizar el estado con todas las denominaciones y servicios
      setDatosEditados({
        saldoInicial: {
          denominaciones: todasDenominaciones,
          total: saldoValido 
            ? { ...cajaSeleccionada.saldoInicial.total }
            : { PYG: 0, BRL: 0, USD: 0 }
        },
        saldosServiciosInicial: serviciosIniciales
      });
    }
  }, [cajaSeleccionada, open]);

  if (!cajaSeleccionada) {
    return null;
  }
  
  // Función para ordenar denominaciones
  const ordenarDenominaciones = (denominaciones: Denominacion[], moneda: 'PYG' | 'BRL' | 'USD'): Denominacion[] => {
    return [...denominaciones]
      .filter(d => d.moneda === moneda)
      .sort((a, b) => b.valor - a.valor); // Ordenar de mayor a menor
  };
  
  // Cambiar a modo edición
  const habilitarEdicion = () => {
    // Ya no necesitamos inicializar datos editados aquí porque lo hacemos en el useEffect
    setModo('edicion');
  };
  
  // Cancelar edición
  const cancelarEdicion = () => {
    setModo('visualizacion');
  };
  
  // Guardar cambios
  const guardarCambios = async () => {
    setLoading(true);
    try {
      // Enviar los datos actualizados al backend
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/datos-apertura`, 
        datosEditados
      );
      
      console.log('Datos actualizados:', response.data);
      
      // Actualizar la caja seleccionada con los nuevos datos
      if (cajaSeleccionada) {
        cajaSeleccionada.saldoInicial = response.data.saldoInicial;
        cajaSeleccionada.saldosServiciosInicial = response.data.saldosServiciosInicial;
      }
      
      setSuccessMessage('Datos de apertura actualizados correctamente');
      setModo('visualizacion');
    } catch (error: any) {
      console.error('Error al actualizar datos:', error);
      setErrorMessage('Error al actualizar los datos de apertura: ' + 
                     (error.response?.data?.error || 'Error en la conexión con el servidor'));
    } finally {
      setLoading(false);
    }
  };
  
  // Función para manejar cambios en denominaciones
  const handleDenominacionChange = (index: number, cantidad: number) => {
    const nuevasDenominaciones = [...datosEditados.saldoInicial.denominaciones];
    nuevasDenominaciones[index].cantidad = cantidad;

    // Recalcular totales
    const totalPYG = nuevasDenominaciones
      .filter(d => d.moneda === 'PYG')
      .reduce((sum, d) => sum + (d.valor * d.cantidad), 0);
    
    const totalBRL = nuevasDenominaciones
      .filter(d => d.moneda === 'BRL')
      .reduce((sum, d) => sum + (d.valor * d.cantidad), 0);
    
    const totalUSD = nuevasDenominaciones
      .filter(d => d.moneda === 'USD')
      .reduce((sum, d) => sum + (d.valor * d.cantidad), 0);

    setDatosEditados(prev => ({
      ...prev,
      saldoInicial: {
        ...prev.saldoInicial,
        denominaciones: nuevasDenominaciones,
        total: {
          PYG: totalPYG,
          BRL: totalBRL,
          USD: totalUSD
        }
      }
    }));
  };
  
  // Función para manejar cambios en servicios iniciales
  const handleServicioChange = (index: number, monto: number) => {
    const nuevosServicios = [...datosEditados.saldosServiciosInicial];
    nuevosServicios[index].monto = monto;

    setDatosEditados(prev => ({
      ...prev,
      saldosServiciosInicial: nuevosServicios
    }));
  };
  
  // Función para manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId: string) => {
    if (e.key === 'Enter' && nextFieldId && inputRefs.current[nextFieldId]) {
      e.preventDefault();
      inputRefs.current[nextFieldId]?.focus();
      inputRefs.current[nextFieldId]?.select();
    }
  };

  // Denominaciones ordenadas por valor (de mayor a menor)
  const denominacionesPYG = ordenarDenominaciones(datosEditados.saldoInicial.denominaciones, 'PYG');
  const denominacionesBRL = ordenarDenominaciones(datosEditados.saldoInicial.denominaciones, 'BRL');
  const denominacionesUSD = ordenarDenominaciones(datosEditados.saldoInicial.denominaciones, 'USD');

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
      <DialogTitle>
        <Box>
          <Typography variant="h6" component="span">
            {modo === 'visualizacion' ? 'Datos de Apertura de Caja' : 'Editar Datos de Apertura'}
          </Typography>
          <Typography variant="subtitle2" component="div" color="text.secondary">
            {formatearIdCaja(cajaSeleccionada.id)}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Información general de la caja */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Apertura:
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(cajaSeleccionada.fechaApertura), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Usuario:
                  </Typography>
                  <Typography variant="body1">
                    {cajaSeleccionada.usuario}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Maletín:
                  </Typography>
                  <Typography variant="body1">
                    {cajaSeleccionada.maletinId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sucursal:
                  </Typography>
                  <Typography variant="body1">
                    {cajaSeleccionada.sucursal?.nombre || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado:
                  </Typography>
                  <Box sx={{
                    backgroundColor: cajaSeleccionada.estado === 'abierta' ? 'green' : 'gray',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    mt: 1
                  }}>
                    {cajaSeleccionada.estado === 'abierta' ? 'ABIERTA' : 'CERRADA'}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Saldos iniciales */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Saldos Iniciales
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              {/* Guaraníes Inicial */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Guaraníes
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Denominación</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {denominacionesPYG.map((denom, index, arr) => {
                        const originalIndex = datosEditados.saldoInicial.denominaciones.indexOf(denom);
                        const isLast = index === arr.length - 1;
                        
                        // Determinar el ID del siguiente campo para modo edición
                        let nextFieldId: string = '';
                        if (modo === 'edicion') {
                          if (isLast) {
                            // Si es el último Guaraní, ir al primer Real
                            nextFieldId = denominacionesBRL.length > 0 
                              ? getDenominacionFieldId('BRL', denominacionesBRL[0].valor) 
                              : '';
                          } else {
                            // Ir al siguiente Guaraní
                            nextFieldId = getDenominacionFieldId('PYG', arr[index + 1].valor);
                          }
                        }
                        
                        const thisFieldId = getDenominacionFieldId('PYG', denom.valor);
                        
                        return (
                          <TableRow key={`PYG-${denom.valor}`}>
                            <TableCell>
                              {formatearMontoConSeparadores(denom.valor)} Gs
                            </TableCell>
                            <TableCell>
                              {modo === 'visualizacion' ? (
                                denom.cantidad
                              ) : (
                                <TextField
                                  size="small"
                                  type="number"
                                  value={denom.cantidad}
                                  onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                  InputProps={{ 
                                    inputProps: { min: 0 },
                                    inputRef: (ref) => registerInputRef(thisFieldId, ref)
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, nextFieldId)}
                                  onClick={handleInputClick}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {formatearMontoConSeparadores(denom.valor * denom.cantidad)} Gs
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={2} align="right"><strong>Total Gs:</strong></TableCell>
                        <TableCell>
                          <strong>
                            {formatearMontoConSeparadores(
                              modo === 'visualizacion' 
                                ? (saldoInicialValido ? cajaSeleccionada.saldoInicial.total.PYG : 0)
                                : datosEditados.saldoInicial.total.PYG
                            )} Gs
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Reales Inicial */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Reales
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Denominación</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {denominacionesBRL.map((denom, index, arr) => {
                        const originalIndex = datosEditados.saldoInicial.denominaciones.indexOf(denom);
                        const isLast = index === arr.length - 1;
                        
                        // Determinar el ID del siguiente campo para modo edición
                        let nextFieldId: string = '';
                        if (modo === 'edicion') {
                          if (isLast) {
                            // Si es el último Real, ir al primer Dólar
                            nextFieldId = denominacionesUSD.length > 0 
                              ? getDenominacionFieldId('USD', denominacionesUSD[0].valor) 
                              : '';
                          } else {
                            // Ir al siguiente Real
                            nextFieldId = getDenominacionFieldId('BRL', arr[index + 1].valor);
                          }
                        }
                        
                        const thisFieldId = getDenominacionFieldId('BRL', denom.valor);
                        
                        return (
                          <TableRow key={`BRL-${denom.valor}`}>
                            <TableCell>
                              R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(denom.valor)}
                            </TableCell>
                            <TableCell>
                              {modo === 'visualizacion' ? (
                                denom.cantidad
                              ) : (
                                <TextField
                                  size="small"
                                  type="number"
                                  value={denom.cantidad}
                                  onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                  InputProps={{ 
                                    inputProps: { min: 0 },
                                    inputRef: (ref) => registerInputRef(thisFieldId, ref)
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, nextFieldId)}
                                  onClick={handleInputClick}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(denom.valor * denom.cantidad)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={2} align="right"><strong>Total R$:</strong></TableCell>
                        <TableCell>
                          <strong>
                            R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
                              modo === 'visualizacion' 
                                ? (saldoInicialValido ? cajaSeleccionada.saldoInicial.total.BRL : 0)
                                : datosEditados.saldoInicial.total.BRL
                            )}
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Dólares Inicial */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Dólares
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Denominación</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {denominacionesUSD.map((denom, index, arr) => {
                        const originalIndex = datosEditados.saldoInicial.denominaciones.indexOf(denom);
                        const isLast = index === arr.length - 1;
                        
                        // Determinar el ID del siguiente campo para modo edición
                        let nextFieldId: string = '';
                        if (modo === 'edicion') {
                          if (isLast && datosEditados.saldosServiciosInicial.length > 0) {
                            // Si es el último Dólar, ir al primer servicio
                            nextFieldId = `servicio-${0}`;
                          } else if (!isLast) {
                            // Ir al siguiente Dólar
                            nextFieldId = getDenominacionFieldId('USD', arr[index + 1].valor);
                          }
                        }
                        
                        const thisFieldId = getDenominacionFieldId('USD', denom.valor);
                        
                        return (
                          <TableRow key={`USD-${denom.valor}`}>
                            <TableCell>
                              $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(denom.valor)}
                            </TableCell>
                            <TableCell>
                              {modo === 'visualizacion' ? (
                                denom.cantidad
                              ) : (
                                <TextField
                                  size="small"
                                  type="number"
                                  value={denom.cantidad}
                                  onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                  InputProps={{ 
                                    inputProps: { min: 0 },
                                    inputRef: (ref) => registerInputRef(thisFieldId, ref)
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, nextFieldId)}
                                  onClick={handleInputClick}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(denom.valor * denom.cantidad)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={2} align="right"><strong>Total $:</strong></TableCell>
                        <TableCell>
                          <strong>
                            $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
                              modo === 'visualizacion' 
                                ? (saldoInicialValido ? cajaSeleccionada.saldoInicial.total.USD : 0)
                                : datosEditados.saldoInicial.total.USD
                            )}
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Grid>

          {/* Servicios Iniciales */}
          {datosEditados.saldosServiciosInicial.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Saldos Iniciales de Servicios
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell>Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosEditados.saldosServiciosInicial.map((servicio, index) => {
                      const nextIndex = index < datosEditados.saldosServiciosInicial.length - 1 
                        ? index + 1 
                        : -1;
                      
                      const nextFieldId = nextIndex >= 0 && modo === 'edicion'
                        ? `servicio-${nextIndex}` 
                        : '';
                      
                      const thisFieldId = `servicio-${index}`;
                      
                      return (
                        <TableRow key={`servicio-inicial-${index}`}>
                          <TableCell>{servicio.servicio}</TableCell>
                          <TableCell>
                            {modo === 'visualizacion' ? (
                              `${formatearMontoConSeparadores(servicio.monto)} Gs`
                            ) : (
                              <TextField
                                size="small"
                                value={formatearMontoConSeparadores(servicio.monto)}
                                onChange={(e) => {
                                  // Eliminar todos los caracteres no numéricos
                                  const numericValue = e.target.value.replace(/\D/g, '');
                                  const montoNumerico = parseInt(numericValue) || 0;
                                  handleServicioChange(index, montoNumerico);
                                }}
                                InputProps={{ 
                                  endAdornment: <Typography variant="caption">&nbsp;Gs</Typography>,
                                  inputProps: { 
                                    min: 0,
                                    style: { textAlign: 'right' }
                                  },
                                  inputRef: (ref) => registerInputRef(thisFieldId, ref)
                                }}
                                onKeyDown={(e) => handleKeyDown(e, nextFieldId)}
                                onClick={handleInputClick}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        {modo === 'visualizacion' ? (
          <>
            <Button onClick={onClose} color="inherit">
              Cerrar
            </Button>
            <Button onClick={habilitarEdicion} color="primary" variant="contained">
              Editar Datos
            </Button>
          </>
        ) : (
          <>
            <Button onClick={cancelarEdicion} color="inherit" disabled={loading}>
              Cancelar
            </Button>
            <Button 
              onClick={guardarCambios} 
              color="primary" 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VerAperturaDialog; 