import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as OpenIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountBalance as CajaIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../../services/api';

interface Caja {
  id: number;
  cajaEnteroId: number;
  usuarioId: string;
  usuario: {
    username: string;
  };
  fechaApertura: string;
  fechaCierre?: string;
  estado: 'abierta' | 'cerrada';
  montoApertura: number;
  montoCierre?: number;
  sucursalId: string;
  sucursal?: {
    nombre: string;
  };
  maletin?: {
    codigo: string;
    sucursal?: {
      nombre: string;
    };
  };
  maletinId?: string;
  saldoInicial?: {
    total: {
      PYG: number;
      BRL: number;
      USD: number;
    };
    denominaciones: any[];
  };
  saldoFinal?: {
    total: {
      PYG: number;
      BRL: number;
      USD: number;
    };
    denominaciones: any[];
  };
  saldosServiciosInicial?: any[];
  saldosServiciosFinal?: any[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  caja: Caja | null;
}

const VerDetalleCaja: React.FC<Props> = ({ open, onClose, caja }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cajaCompleta, setCajaCompleta] = useState<Caja | null>(null);
  const [mostrarSaldos, setMostrarSaldos] = useState(false);
  const [mostrarServicios, setMostrarServicios] = useState(false);

  // Cargar datos completos de la caja al abrir el diálogo
  useEffect(() => {
    if (open && caja) {
      cargarDatosCompletos();
    }
  }, [open, caja]);

  const cargarDatosCompletos = async () => {
    if (!caja) return;

    setLoading(true);
    setError(null);

    try {
      // Si la caja está cerrada pero no tiene saldos finales, cargarlos
      if (caja.estado === 'cerrada' && (!caja.saldoFinal || !caja.saldoFinal.total)) {
        console.log('📱 Cargando datos de cierre para caja:', caja.cajaEnteroId);
        const response = await api.get(`/api/cajas/${caja.id}/datos-cierre`);
        
        const cajaConDatos = {
          ...caja,
          saldoFinal: response.data.saldoFinal || { 
            denominaciones: [],
            total: { PYG: 0, BRL: 0, USD: 0 }
          },
          saldosServiciosFinal: response.data.saldosServiciosFinal || []
        };
        
        setCajaCompleta(cajaConDatos);
      } else {
        // Datos ya completos o caja abierta
        const cajaConValoresDefault = {
          ...caja,
          saldosServiciosInicial: Array.isArray(caja.saldosServiciosInicial) 
            ? caja.saldosServiciosInicial 
            : [],
          saldoFinal: caja.estado === 'cerrada' && !caja.saldoFinal 
            ? { denominaciones: [], total: { PYG: 0, BRL: 0, USD: 0 } } 
            : caja.saldoFinal,
          saldosServiciosFinal: Array.isArray(caja.saldosServiciosFinal) 
            ? caja.saldosServiciosFinal 
            : []
        };
        
        setCajaCompleta(cajaConValoresDefault);
      }
    } catch (err: any) {
      console.error('Error al cargar datos de cierre:', err);
      setError('Error al cargar los datos completos de la caja');
      
      // Aún con error, usar valores por defecto
      setCajaCompleta({
        ...caja,
        saldosServiciosInicial: [],
        saldoFinal: { denominaciones: [], total: { PYG: 0, BRL: 0, USD: 0 } },
        saldosServiciosFinal: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (monto: number | undefined | null): string => {
    if (monto === undefined || monto === null || isNaN(monto)) {
      return 'Gs. 0';
    }
    
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const formatearFecha = (fecha: string): string => {
    return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const calcularDiferencia = (inicial: number, final: number): number => {
    return final - inicial;
  };

  const obtenerColorDiferencia = (diferencia: number): string => {
    if (diferencia === 0) {
      return 'success.main'; // Verde - Sin diferencia
    } else {
      return 'error.main';   // Rojo - Cualquier diferencia (sobrante o faltante)
    }
  };

  if (!cajaCompleta) {
    return null;
  }

  const estaAbierta = cajaCompleta.estado === 'abierta';
  const saldoInicialValido = cajaCompleta.saldoInicial?.total;
  const saldoFinalValido = cajaCompleta.saldoFinal?.total;

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
          maxHeight: '90vh'
        } 
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Detalle de Caja #{cajaCompleta.cajaEnteroId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {cajaCompleta.id}
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Cargando datos...</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {/* Información general */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CajaIcon sx={{ mr: 1 }} />
                    Información General
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Estado
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          {estaAbierta ? <OpenIcon color="success" /> : <CheckCircleIcon color="disabled" />}
                          <Chip
                            label={estaAbierta ? 'ABIERTA' : 'CERRADA'}
                            color={estaAbierta ? 'success' : 'default'}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          Usuario
                        </Typography>
                        <Typography variant="body1">
                          {cajaCompleta.usuario.username}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          Sucursal
                        </Typography>
                        <Typography variant="body1">
                          {cajaCompleta.sucursal?.nombre || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          Fecha Apertura
                        </Typography>
                        <Typography variant="body1">
                          {formatearFecha(cajaCompleta.fechaApertura)}
                        </Typography>
                      </Box>

                      {cajaCompleta.fechaCierre && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            Fecha Cierre
                          </Typography>
                          <Typography variant="body1">
                            {formatearFecha(cajaCompleta.fechaCierre)}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Maletín
                        </Typography>
                        <Typography variant="body1">
                          {cajaCompleta.maletin 
                            ? `${cajaCompleta.maletin.codigo}${cajaCompleta.maletin.sucursal ? ` (${cajaCompleta.maletin.sucursal.nombre})` : ''}`
                            : cajaCompleta.maletinId || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Saldos Iniciales */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => setMostrarSaldos(!mostrarSaldos)}
                    endIcon={mostrarSaldos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{ justifyContent: 'space-between', mb: 1 }}
                  >
                    <Typography variant="h6">
                      💰 Saldos Iniciales
                    </Typography>
                  </Button>

                  <Collapse in={mostrarSaldos}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Moneda</strong></TableCell>
                          <TableCell align="right"><strong>Monto</strong></TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell>Guaraníes</TableCell>
                          <TableCell align="right">
                            {saldoInicialValido 
                              ? formatearMoneda(saldoInicialValido.PYG || 0)
                              : 'Gs. 0'}
                          </TableCell>
                        </TableRow>

                        {/* Mostrar otras monedas si tienen valores */}
                        {saldoInicialValido?.BRL && saldoInicialValido.BRL > 0 && (
                          <TableRow>
                            <TableCell>Reales</TableCell>
                            <TableCell align="right">R$ {saldoInicialValido.BRL.toLocaleString()}</TableCell>
                          </TableRow>
                        )}

                        {saldoInicialValido?.USD && saldoInicialValido.USD > 0 && (
                          <TableRow>
                            <TableCell>Dólares</TableCell>
                            <TableCell align="right">$ {saldoInicialValido.USD.toLocaleString()}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>

            {/* Saldos Finales - Solo si la caja está cerrada */}
            {!estaAbierta && (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      🏁 Saldos Finales
                    </Typography>

                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Moneda</strong></TableCell>
                          <TableCell align="right"><strong>Monto</strong></TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell>Guaraníes</TableCell>
                          <TableCell align="right">
                            {saldoFinalValido 
                              ? formatearMoneda(saldoFinalValido.PYG || 0)
                              : 'Gs. 0'}
                          </TableCell>
                        </TableRow>

                        {saldoFinalValido?.BRL && saldoFinalValido.BRL > 0 && (
                          <TableRow>
                            <TableCell>Reales</TableCell>
                            <TableCell align="right">R$ {saldoFinalValido.BRL.toLocaleString()}</TableCell>
                          </TableRow>
                        )}

                        {saldoFinalValido?.USD && saldoFinalValido.USD > 0 && (
                          <TableRow>
                            <TableCell>Dólares</TableCell>
                            <TableCell align="right">$ {saldoFinalValido.USD.toLocaleString()}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Diferencias - Solo si la caja está cerrada */}
            {!estaAbierta && saldoInicialValido && saldoFinalValido && (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2, bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      📊 Diferencias de Efectivo
                    </Typography>

                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Moneda</strong></TableCell>
                          <TableCell align="right"><strong>Diferencia</strong></TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell>Guaraníes</TableCell>
                          <TableCell align="right">
                            {(() => {
                              const diff = calcularDiferencia(saldoInicialValido.PYG || 0, saldoFinalValido.PYG || 0);
                              return (
                                <Typography 
                                  color={obtenerColorDiferencia(diff)}
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {formatearMoneda(diff)}
                                </Typography>
                              );
                            })()}
                          </TableCell>
                        </TableRow>

                        {(saldoInicialValido?.BRL || saldoFinalValido?.BRL) && (
                          <TableRow>
                            <TableCell>Reales</TableCell>
                            <TableCell align="right">
                              {(() => {
                                const diff = calcularDiferencia(saldoInicialValido?.BRL || 0, saldoFinalValido?.BRL || 0);
                                return (
                                  <Typography 
                                    color={obtenerColorDiferencia(diff)}
                                    sx={{ fontWeight: 'bold' }}
                                  >
                                    R$ {diff.toLocaleString()}
                                  </Typography>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        )}

                        {(saldoInicialValido?.USD || saldoFinalValido?.USD) && (
                          <TableRow>
                            <TableCell>Dólares</TableCell>
                            <TableCell align="right">
                              {(() => {
                                const diff = calcularDiferencia(saldoInicialValido?.USD || 0, saldoFinalValido?.USD || 0);
                                return (
                                  <Typography 
                                    color={obtenerColorDiferencia(diff)}
                                    sx={{ fontWeight: 'bold' }}
                                  >
                                    $ {diff.toLocaleString()}
                                  </Typography>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Servicios Iniciales */}
            {(cajaCompleta.saldosServiciosInicial?.length || 0) > 0 && (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => setMostrarServicios(!mostrarServicios)}
                      endIcon={mostrarServicios ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ justifyContent: 'space-between', mb: 1 }}
                    >
                      <Typography variant="h6">
                        🛠️ Servicios Iniciales
                      </Typography>
                    </Button>

                    <Collapse in={mostrarServicios}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Servicio</strong></TableCell>
                            <TableCell align="right"><strong>Monto</strong></TableCell>
                          </TableRow>
                          
                          {cajaCompleta.saldosServiciosInicial?.map((servicio: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{servicio.servicio}</TableCell>
                              <TableCell align="right">{formatearMoneda(servicio.monto || 0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Servicios Finales - Solo si la caja está cerrada */}
            {!estaAbierta && (cajaCompleta.saldosServiciosFinal?.length || 0) > 0 && (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      🏆 Servicios Finales
                    </Typography>

                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Servicio</strong></TableCell>
                          <TableCell align="right"><strong>Monto</strong></TableCell>
                        </TableRow>
                        
                        {cajaCompleta.saldosServiciosFinal?.map((servicio: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{servicio.servicio}</TableCell>
                            <TableCell align="right">{formatearMoneda(servicio.monto || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Diferencias de Servicios - Solo si la caja está cerrada */}
            {!estaAbierta && (cajaCompleta.saldosServiciosInicial?.length || 0) > 0 && (cajaCompleta.saldosServiciosFinal?.length || 0) > 0 && (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2, bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      ⚖️ Diferencias de Servicios
                    </Typography>

                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Servicio</strong></TableCell>
                          <TableCell align="right"><strong>Diferencia</strong></TableCell>
                        </TableRow>
                        
                        {cajaCompleta.saldosServiciosInicial?.map((servicio: any, index: number) => {
                          const servicioFinal = cajaCompleta.saldosServiciosFinal?.find((s: any) => s.servicio === servicio.servicio);
                          const diferencia = calcularDiferencia(servicio.monto || 0, servicioFinal?.monto || 0);
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{servicio.servicio}</TableCell>
                              <TableCell align="right">
                                <Typography 
                                  color={obtenerColorDiferencia(diferencia)}
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {formatearMoneda(diferencia)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerDetalleCaja; 