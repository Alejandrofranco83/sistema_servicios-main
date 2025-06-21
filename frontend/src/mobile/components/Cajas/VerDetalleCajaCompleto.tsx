import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Collapse,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../../services/api';

interface CajaDetalle {
  id: string;
  cajaEnteroId: number;
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
  };
  fechaApertura: string;
  fechaCierre?: string;
  estado: 'abierta' | 'cerrada';
  saldoInicial: {
    denominaciones: any[];
    total: {
      PYG: number;
      BRL: number;
      USD: number;
    };
  };
  saldoFinal?: {
    denominaciones: any[];
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
  saldosServiciosFinal?: Array<{
    servicio: string;
    monto: number;
  }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  caja: CajaDetalle | null;
}

const VerDetalleCajaCompleto: React.FC<Props> = ({ open, onClose, caja }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de expansión para móvil
  const [expandedSections, setExpandedSections] = useState({
    apertura: true,
    cierre: true,
    diferencias: true
  });

  const cargarDatosCierre = useCallback(async () => {
    if (!caja) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/cajas/${caja.id}/datos-cierre`);
      
      if (response.data) {
        // Actualizar los datos de la caja con los datos de cierre
        Object.assign(caja, {
          saldoFinal: response.data.saldoFinal,
          saldosServiciosFinal: response.data.saldosServiciosFinal
        });
      }
      
    } catch (err: any) {
      console.error('Error al cargar datos de cierre:', err);
      setError('Error al cargar datos de cierre');
    } finally {
      setLoading(false);
    }
  }, [caja]);

  // Cargar datos de cierre si la caja está cerrada
  useEffect(() => {
    if (caja && open && caja.estado === 'cerrada' && !caja.saldoFinal) {
      cargarDatosCierre();
    }
  }, [caja, open, cargarDatosCierre]);

  // Toggle de secciones
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  // Calcular diferencias entre apertura y cierre
  const calcularDiferencias = () => {
    if (!caja?.saldoFinal || !caja?.saldoInicial) {
      return { PYG: 0, BRL: 0, USD: 0 };
    }

    return {
      PYG: (caja.saldoFinal.total.PYG || 0) - (caja.saldoInicial.total.PYG || 0),
      BRL: (caja.saldoFinal.total.BRL || 0) - (caja.saldoInicial.total.BRL || 0),
      USD: (caja.saldoFinal.total.USD || 0) - (caja.saldoInicial.total.USD || 0)
    };
  };

  // Calcular diferencias en servicios
  const calcularDiferenciasServicios = () => {
    if (!caja?.saldosServiciosFinal || !caja?.saldosServiciosInicial) {
      return [];
    }

    const diferencias: Array<{
      servicio: string;
      inicial: number;
      final: number;
      diferencia: number;
    }> = [];

    // Crear un mapa de servicios iniciales
    const serviciosIniciales = new Map();
    caja.saldosServiciosInicial.forEach(servicio => {
      serviciosIniciales.set(servicio.servicio, servicio.monto);
    });

    // Crear un mapa de servicios finales
    const serviciosFinales = new Map();
    caja.saldosServiciosFinal.forEach(servicio => {
      serviciosFinales.set(servicio.servicio, servicio.monto);
    });

    // Obtener todos los servicios únicos
    const todosServicios = new Set([
      ...Array.from(serviciosIniciales.keys()),
      ...Array.from(serviciosFinales.keys())
    ]);

    todosServicios.forEach(servicio => {
      const inicial = serviciosIniciales.get(servicio) || 0;
      const final = serviciosFinales.get(servicio) || 0;
      const diferencia = final - inicial;

      diferencias.push({
        servicio,
        inicial,
        final,
        diferencia
      });
    });

    return diferencias;
  };

  const formatearIdCaja = (id: string | number): string => {
    return `Caja #${id}`;
  };

  if (!caja) {
    return null;
  }

  const estaAbierta = caja.estado === 'abierta';
  const diferenciasEfectivo = calcularDiferencias();
  const diferenciasServicios = calcularDiferenciasServicios();

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
              <VisibilityIcon />
              Detalle de Caja
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatearIdCaja(caja.cajaEnteroId)} • {caja.sucursal?.nombre}
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

        {/* Información General */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 2 }}>
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
              
              {caja.fechaCierre && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Fecha de Cierre
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {format(new Date(caja.fechaCierre), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Typography>
                </Box>
              )}
              
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

        {/* Datos de Apertura */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleSection('apertura')}
              endIcon={expandedSections.apertura ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                🏪 Datos de Apertura
              </Typography>
            </Button>

            <Collapse in={expandedSections.apertura}>
              {/* Efectivo de Apertura */}
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                Efectivo
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Moneda</strong></TableCell>
                    <TableCell align="right"><strong>Monto</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Guaraníes</TableCell>
                    <TableCell align="right">
                      {formatearMoneda(caja.saldoInicial.total.PYG || 0, 'PYG')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Reales</TableCell>
                    <TableCell align="right">
                      {formatearMoneda(caja.saldoInicial.total.BRL || 0, 'BRL')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Dólares</TableCell>
                    <TableCell align="right">
                      {formatearMoneda(caja.saldoInicial.total.USD || 0, 'USD')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Servicios de Apertura */}
              {caja.saldosServiciosInicial.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                    Servicios
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Servicio</strong></TableCell>
                        <TableCell align="right"><strong>Monto</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {caja.saldosServiciosInicial.map((servicio, index) => (
                        <TableRow key={index}>
                          <TableCell>{servicio.servicio}</TableCell>
                          <TableCell align="right">
                            {formatearMoneda(servicio.monto, 'PYG')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </Collapse>
          </CardContent>
        </Card>

        {/* Datos de Cierre - Solo para cajas cerradas */}
        {!estaAbierta && (
          <Card sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent sx={{ pb: 1 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => toggleSection('cierre')}
                endIcon={expandedSections.cierre ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  🔒 Datos de Cierre
                </Typography>
              </Button>

              <Collapse in={expandedSections.cierre}>
                {loading ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography color="text.secondary">
                      Cargando datos de cierre...
                    </Typography>
                  </Box>
                ) : caja.saldoFinal ? (
                  <>
                    {/* Efectivo de Cierre */}
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'error.main' }}>
                      Efectivo
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Moneda</strong></TableCell>
                          <TableCell align="right"><strong>Monto</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Guaraníes</TableCell>
                          <TableCell align="right">
                            {formatearMoneda(caja.saldoFinal.total.PYG || 0, 'PYG')}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Reales</TableCell>
                          <TableCell align="right">
                            {formatearMoneda(caja.saldoFinal.total.BRL || 0, 'BRL')}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Dólares</TableCell>
                          <TableCell align="right">
                            {formatearMoneda(caja.saldoFinal.total.USD || 0, 'USD')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {/* Servicios de Cierre */}
                    {caja.saldosServiciosFinal && caja.saldosServiciosFinal.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'error.main' }}>
                          Servicios
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Servicio</strong></TableCell>
                              <TableCell align="right"><strong>Monto</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {caja.saldosServiciosFinal.map((servicio, index) => (
                              <TableRow key={index}>
                                <TableCell>{servicio.servicio}</TableCell>
                                <TableCell align="right">
                                  {formatearMoneda(servicio.monto, 'PYG')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </>
                ) : (
                  <Alert severity="warning">
                    No se encontraron datos de cierre para esta caja
                  </Alert>
                )}
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* Diferencias - Solo para cajas cerradas */}
        {!estaAbierta && caja.saldoFinal && (
          <Card sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent sx={{ pb: 1 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => toggleSection('diferencias')}
                endIcon={expandedSections.diferencias ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  📊 Diferencias
                </Typography>
              </Button>

              <Collapse in={expandedSections.diferencias}>
                {/* Diferencias de Efectivo */}
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'warning.main' }}>
                  Efectivo
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Moneda</strong></TableCell>
                      <TableCell align="right"><strong>Diferencia</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Guaraníes</TableCell>
                      <TableCell align="right" sx={{ 
                        color: diferenciasEfectivo.PYG === 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                      }}>
                        {diferenciasEfectivo.PYG > 0 ? '+' : ''}{formatearMoneda(diferenciasEfectivo.PYG, 'PYG')}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Reales</TableCell>
                      <TableCell align="right" sx={{ 
                        color: diferenciasEfectivo.BRL === 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                      }}>
                        {diferenciasEfectivo.BRL > 0 ? '+' : ''}{formatearMoneda(diferenciasEfectivo.BRL, 'BRL')}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Dólares</TableCell>
                      <TableCell align="right" sx={{ 
                        color: diferenciasEfectivo.USD === 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                      }}>
                        {diferenciasEfectivo.USD > 0 ? '+' : ''}{formatearMoneda(diferenciasEfectivo.USD, 'USD')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Diferencias de Servicios */}
                {diferenciasServicios.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'warning.main' }}>
                      Servicios
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Servicio</strong></TableCell>
                          <TableCell align="right"><strong>Diferencia</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {diferenciasServicios.map((servicio, index) => (
                          <TableRow key={index}>
                            <TableCell>{servicio.servicio}</TableCell>
                            <TableCell align="right" sx={{ 
                              color: servicio.diferencia === 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}>
                              {servicio.diferencia > 0 ? '+' : ''}{formatearMoneda(servicio.diferencia, 'PYG')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </Collapse>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 2, minWidth: 100 }}
          variant="contained"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerDetalleCajaCompleto; 