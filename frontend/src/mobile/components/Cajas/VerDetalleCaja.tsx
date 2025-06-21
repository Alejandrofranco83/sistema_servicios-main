import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  TextField,
  CircularProgress,
  IconButton,
  Collapse,
  Chip,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  denominacionesGuaranies, 
  denominacionesReales, 
  denominacionesDolares,
  serviciosIniciales as serviciosDefault 
} from '../../../components/Cajas/constants';
import { formatearMontoServicio } from '../../../components/Cajas/helpers';
import { Denominacion } from '../../../components/Cajas/interfaces';
import api from '../../../services/api';

export interface Caja {
  id: string;
  cajaEnteroId?: number;
  sucursalId: string;
  sucursal?: {
    id: string;
    nombre: string;
    codigo: string;
  };
  usuarioId: string;
  usuario: string;
  maletinId: string;
  maletin?: {
    id: string;
    codigo: string;
    sucursal?: {
      nombre: string;
    };
  };
  fechaApertura: string;
  fechaCierre?: string;
  estado: 'abierta' | 'cerrada';
  saldoInicial: {
    denominaciones: Denominacion[];
    total: {
      PYG: number;
      BRL: number;
      USD: number;
    };
  };
  saldosServiciosInicial: Array<{
    servicio: string;
    monto: number;
  }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  caja: Caja | null;
  onSuccess?: () => void;
}

const VerDetalleCaja: React.FC<Props> = ({ open, onClose, caja, onSuccess }) => {
  const [modo, setModo] = useState<'visualizacion' | 'edicion'>('visualizacion');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estados de expansión para móvil
  const [expandedSections, setExpandedSections] = useState({
    guaranies: true,
    reales: false,
    dolares: false,
    servicios: false
  });

  // Estado para los datos editados
  const [datosEditados, setDatosEditados] = useState(() => ({
    saldoInicial: caja?.saldoInicial || { denominaciones: [], total: { PYG: 0, BRL: 0, USD: 0 } },
    saldosServiciosInicial: caja?.saldosServiciosInicial || []
  }));

  // Efecto para inicializar los datos cuando cambia la caja
  useEffect(() => {
    if (caja) {
      const saldoValido = caja.saldoInicial && 
                          caja.saldoInicial.total &&
                          typeof caja.saldoInicial.total === 'object';
                           
      // Clonar las denominaciones actuales
      const denominacionesActuales = saldoValido 
        ? [...caja.saldoInicial.denominaciones] 
        : [];
      
      // Función para verificar si una denominación ya existe
      const existeDenominacion = (valor: number, moneda: 'PYG' | 'BRL' | 'USD') => {
        return denominacionesActuales.some(d => d.valor === valor && d.moneda === moneda);
      };
      
      // Agregar denominaciones faltantes
      const todasDenominaciones = [...denominacionesActuales];
      
      // Agregar denominaciones faltantes de cada moneda
      denominacionesGuaranies.forEach(denom => {
        if (!existeDenominacion(denom.valor, 'PYG')) {
          todasDenominaciones.push({...denom, cantidad: 0});
        }
      });
      
      denominacionesReales.forEach(denom => {
        if (!existeDenominacion(denom.valor, 'BRL')) {
          todasDenominaciones.push({...denom, cantidad: 0});
        }
      });
      
      denominacionesDolares.forEach(denom => {
        if (!existeDenominacion(denom.valor, 'USD')) {
          todasDenominaciones.push({...denom, cantidad: 0});
        }
      });

      // Verificar servicios iniciales
      let serviciosIniciales = [];
      if (caja.saldosServiciosInicial && Array.isArray(caja.saldosServiciosInicial)) {
        serviciosIniciales = [...caja.saldosServiciosInicial];
      } else {
        serviciosIniciales = serviciosDefault.map(s => ({...s, monto: 0}));
      }
      
      // Actualizar el estado
      setDatosEditados({
        saldoInicial: {
          denominaciones: todasDenominaciones,
          total: saldoValido 
            ? { ...caja.saldoInicial.total }
            : { PYG: 0, BRL: 0, USD: 0 }
        },
        saldosServiciosInicial: serviciosIniciales
      });
    }
  }, [caja, open]);

  // Resetear estados al abrir/cerrar
  useEffect(() => {
    if (open) {
      setModo('visualizacion');
      setError(null);
      setSuccessMessage(null);
    }
  }, [open]);

  if (!caja) {
    return null;
  }

  // Función para ordenar denominaciones de mayor a menor
  const ordenarDenominaciones = (denominaciones: Denominacion[], moneda: 'PYG' | 'BRL' | 'USD'): Denominacion[] => {
    return [...denominaciones]
      .filter(d => d.moneda === moneda)
      .sort((a, b) => b.valor - a.valor);
  };

  // Función para formatear moneda
  const formatearMoneda = (monto: number, moneda: string): string => {
    switch (moneda) {
      case 'PYG':
        return new Intl.NumberFormat('es-PY').format(monto) + ' Gs';
      case 'BRL':
        return 'R$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(monto);
      case 'USD':
        return '$ ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(monto);
      default:
        return monto.toString();
    }
  };

  // Función para seleccionar todo el texto en el input
  const handleInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement;
    setTimeout(() => {
      input.select();
    }, 0);
  };

  // Toggle de secciones
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Cambiar a modo edición
  const habilitarEdicion = () => {
    setModo('edicion');
    setError(null);
    setSuccessMessage(null);
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setModo('visualizacion');
    setError(null);
    // Reinicializar datos
    if (caja) {
      const saldoValido = caja.saldoInicial && caja.saldoInicial.total;
      setDatosEditados({
        saldoInicial: saldoValido ? { ...caja.saldoInicial } : { denominaciones: [], total: { PYG: 0, BRL: 0, USD: 0 } },
        saldosServiciosInicial: caja.saldosServiciosInicial ? [...caja.saldosServiciosInicial] : []
      });
    }
  };

  // Guardar cambios
  const guardarCambios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await api.put(
        `/api/cajas/${caja.id}/datos-apertura`, 
        datosEditados
      );
      
      setSuccessMessage('Datos de apertura actualizados correctamente');
      setModo('visualizacion');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error al actualizar datos:', error);
      setError(error.response?.data?.error || 'Error al actualizar los datos de apertura');
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
        total: { PYG: totalPYG, BRL: totalBRL, USD: totalUSD }
      }
    }));
  };

  // Función para manejar cambios en servicios
  const handleServicioChange = (index: number, monto: number) => {
    const nuevosServicios = [...datosEditados.saldosServiciosInicial];
    nuevosServicios[index].monto = monto;
    setDatosEditados(prev => ({
      ...prev,
      saldosServiciosInicial: nuevosServicios
    }));
  };

  const formatearIdCaja = (id: string): string => {
    return `Caja #${id}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: 3,
          m: 2,
          maxHeight: '95vh'
        } 
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              {modo === 'visualizacion' ? <VisibilityIcon /> : <EditIcon />}
              {modo === 'visualizacion' ? 'Datos de Apertura' : 'Editar Apertura'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatearIdCaja(caja.id)} • {caja.sucursal?.nombre}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
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

        {/* Información General */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              ℹ️ Información General
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Fecha de Apertura
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {format(new Date(caja.fechaApertura), 'dd/MM/yyyy HH:mm', { locale: es })}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={caja.estado === 'abierta' ? 'ABIERTA' : 'CERRADA'}
                    color={caja.estado === 'abierta' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Usuario
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {caja.usuario}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Maletín
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {caja.maletin?.codigo || caja.maletinId}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Denominaciones de Efectivo */}
        <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
          💰 Saldos Iniciales de Efectivo
        </Typography>

        {/* Guaraníes */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('guaranies')}
              endIcon={expandedSections.guaranies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1">
                💰 Guaraníes: {formatearMoneda(datosEditados.saldoInicial.total.PYG, 'PYG')}
              </Typography>
            </Button>

            <Collapse in={expandedSections.guaranies}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Denominación</TableCell>
                    <TableCell width="80px">Cantidad</TableCell>
                    <TableCell>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordenarDenominaciones(datosEditados.saldoInicial.denominaciones, 'PYG')
                    .map((denom, index) => {
                      const originalIndex = datosEditados.saldoInicial.denominaciones.indexOf(denom);
                      return (
                        <TableRow key={`PYG-${denom.valor}`}>
                          <TableCell>{formatearMoneda(denom.valor, 'PYG')}</TableCell>
                          <TableCell>
                            {modo === 'visualizacion' ? (
                              denom.cantidad
                            ) : (
                              <TextField
                                size="small"
                                type="number"
                                value={denom.cantidad}
                                onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                onClick={handleInputClick}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {formatearMoneda(denom.valor * denom.cantidad, 'PYG')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Collapse>
          </CardContent>
        </Card>

        {/* Reales */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('reales')}
              endIcon={expandedSections.reales ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1">
                💵 Reales: {formatearMoneda(datosEditados.saldoInicial.total.BRL, 'BRL')}
              </Typography>
            </Button>

            <Collapse in={expandedSections.reales}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Denominación</TableCell>
                    <TableCell width="80px">Cantidad</TableCell>
                    <TableCell>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordenarDenominaciones(datosEditados.saldoInicial.denominaciones, 'BRL')
                    .map((denom, index) => {
                      const originalIndex = datosEditados.saldoInicial.denominaciones.indexOf(denom);
                      return (
                        <TableRow key={`BRL-${denom.valor}`}>
                          <TableCell>{formatearMoneda(denom.valor, 'BRL')}</TableCell>
                          <TableCell>
                            {modo === 'visualizacion' ? (
                              denom.cantidad
                            ) : (
                              <TextField
                                size="small"
                                type="number"
                                value={denom.cantidad}
                                onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                onClick={handleInputClick}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {formatearMoneda(denom.valor * denom.cantidad, 'BRL')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Collapse>
          </CardContent>
        </Card>

        {/* Dólares */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('dolares')}
              endIcon={expandedSections.dolares ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1">
                💶 Dólares: {formatearMoneda(datosEditados.saldoInicial.total.USD, 'USD')}
              </Typography>
            </Button>

            <Collapse in={expandedSections.dolares}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Denominación</TableCell>
                    <TableCell width="80px">Cantidad</TableCell>
                    <TableCell>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordenarDenominaciones(datosEditados.saldoInicial.denominaciones, 'USD')
                    .map((denom, index) => {
                      const originalIndex = datosEditados.saldoInicial.denominaciones.indexOf(denom);
                      return (
                        <TableRow key={`USD-${denom.valor}`}>
                          <TableCell>{formatearMoneda(denom.valor, 'USD')}</TableCell>
                          <TableCell>
                            {modo === 'visualizacion' ? (
                              denom.cantidad
                            ) : (
                              <TextField
                                size="small"
                                type="number"
                                value={denom.cantidad}
                                onChange={(e) => handleDenominacionChange(originalIndex, parseInt(e.target.value) || 0)}
                                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                onClick={handleInputClick}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {formatearMoneda(denom.valor * denom.cantidad, 'USD')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Collapse>
          </CardContent>
        </Card>

        {/* Servicios Iniciales */}
        {datosEditados.saldosServiciosInicial.length > 0 && (
          <Card sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent sx={{ pb: 1 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => toggleSection('servicios')}
                endIcon={expandedSections.servicios ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="subtitle1">
                  🏪 Saldos de Servicios ({datosEditados.saldosServiciosInicial.length})
                </Typography>
              </Button>

              <Collapse in={expandedSections.servicios}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell>Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosEditados.saldosServiciosInicial.map((servicio, index) => (
                      <TableRow key={index}>
                        <TableCell>{servicio.servicio}</TableCell>
                        <TableCell>
                          {modo === 'visualizacion' ? (
                            formatearMontoServicio(servicio.monto) + ' Gs'
                          ) : (
                            <TextField
                              size="small"
                              value={formatearMontoServicio(servicio.monto)}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, '');
                                const montoNumerico = parseInt(numericValue) || 0;
                                handleServicioChange(index, montoNumerico);
                              }}
                              inputProps={{ 
                                min: 0, 
                                style: { textAlign: 'right' } 
                              }}
                              InputProps={{
                                endAdornment: <Typography variant="caption">&nbsp;Gs</Typography>,
                              }}
                              onClick={handleInputClick}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Collapse>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {modo === 'visualizacion' ? (
          <>
            <Button
              onClick={onClose}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Cerrar
            </Button>
            <Button
              onClick={habilitarEdicion}
              variant="contained"
              startIcon={<EditIcon />}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Editar Datos
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={cancelarEdicion}
              disabled={loading}
              startIcon={<CancelIcon />}
              sx={{ borderRadius: 2 }}
            >
              Cancelar
            </Button>
            <Button
              onClick={guardarCambios}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
              sx={{ borderRadius: 2 }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VerDetalleCaja;
