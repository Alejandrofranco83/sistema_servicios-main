import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import { useCotizacion } from '../../contexts/CotizacionContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatUtils';
import axios from 'axios';

// Interfaz para representar un retiro
interface Retiro {
  id: string;
  cajaId: string;
  cajaNombre: string;
  sucursalId: string;
  sucursalNombre: string;
  personaId: string;
  personaNombre: string;
  fecha: string;
  montoPYG: number;
  montoBRL: number;
  montoUSD: number;
  observacion: string;
  estadoRecepcion: 'PENDIENTE' | 'RECIBIDO' | 'RECHAZADO';
  fechaRecepcion?: string;
  usuarioRecepcion?: string;
  observacionRecepcion?: string;
}

// Añadir interfaz para representar un Movimiento de Caja Mayor
interface MovimientoCajaMayor {
  id: string | number;
  fechaHora?: string;
  tipo: string;
  concepto: string;
  monto?: string;
  moneda?: 'guaranies' | 'reales' | 'dolares' | string;
  esIngreso?: boolean;
  saldo?: number;
  referenciaId?: string;
  operacionId?: string;
  observaciones?: string | null;
  estado?: 'PENDIENTE' | 'RECIBIDO' | 'RECHAZADO';
  fechaRecepcion?: string;
  usuarioRecepcion?: string;
  observacionRecepcion?: string;
  cajaId?: string | number;
  caja?: string;
  sucursalId?: string | number;
  sucursal?: string;
  personaId?: string | number;
  nombrePersona?: string;
  usuario?: {
    username?: string;
    nombre?: string;
  };
  usuarioId?: string | number;
  movimientoId?: string;
  numero?: string | number;
  idNumerico?: string | number; 
  [key: string]: any;
}

// Interfaz para el Movimiento Original (potencialmente de otra tabla/endpoint)
interface MovimientoOriginal {
  id: string | number;
  caja?: string;
  cajaNombre?: string;
  sucursal?: string;
  sucursalNombre?: string;
  observacion?: string | null;
  // ... otros campos que podría tener
  [key: string]: any;
}

interface DevolverRetiroProps {
  open: boolean;
  onClose: () => void;
  onGuardarExito: () => void;
  retiroId: string;
}

const DevolverRetiro: React.FC<DevolverRetiroProps> = ({ open, onClose, onGuardarExito, retiroId }) => {
  const { cotizacionVigente } = useCotizacion();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para el retiro seleccionado
  const [retiro, setRetiro] = useState<Retiro | null>(null);
  
  // Estado para la observación de devolución
  const [observacionDevolucion, setObservacionDevolucion] = useState<string>('');

  // Cargar datos del retiro al abrir el diálogo
  useEffect(() => {
    if (open && retiroId) {
      cargarDatosRetiro();
    } else {
      // Resetear estados cuando se cierra
      resetearEstados();
    }
  }, [open, retiroId]);
  
  // Resetear los estados cuando se cierra el dialog
  const resetearEstados = () => {
    setRetiro(null);
    setObservacionDevolucion('');
    setError(null);
    setSuccessMessage(null);
  };
  
  // Función para cargar los datos del retiro
  const cargarDatosRetiro = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Intentando cargar datos del retiro asociado al UUID: ${retiroId}`);
      
      let movimientoRecepcion: MovimientoCajaMayor | null = null;
      let currentPage = 1;
      let totalPages = 1;
      let primerMovimientoInspeccionado: MovimientoCajaMayor | null = null; // Para logging
      
      // PASO 1: Buscar el movimiento de recepción en Caja Mayor
      do {
        console.log(`Buscando en página ${currentPage} de movimientos...`);
        const response = await axios.get('/api/caja_mayor_movimientos/movimientos', {
          params: { 
            page: currentPage, 
            pageSize: 50 
          }
        });
        
        console.log(`Respuesta de página ${currentPage}:`, response.data);
        
        if (response.data && response.data.movimientos && Array.isArray(response.data.movimientos)) {
          totalPages = response.data.totalPages || 1;
          
          // Guardar el primer movimiento para inspeccionar si no encontramos nada
          if (currentPage === 1 && response.data.movimientos.length > 0 && !primerMovimientoInspeccionado) {
            primerMovimientoInspeccionado = response.data.movimientos[0];
          }

          // Buscar el movimiento comparando el retiroId (UUID) con un campo esperado en el movimiento
          // Probamos con 'retiroId' y 'referenciaId' como posibles campos
          const foundMovimiento = response.data.movimientos.find((m: MovimientoCajaMayor) => {
            const match = 
              (m.operacionId && m.operacionId.toString() === retiroId) ||
              (m.id && m.id.toString() === retiroId);
            
            // Loguear comparación para el primer elemento de la primera página si no hay match aún
            if (!movimientoRecepcion && currentPage === 1 && m === primerMovimientoInspeccionado) {
              console.log('Inspeccionando primer movimiento (recepción):', m);
              console.log(`Comparando UUID ${retiroId} con m.operacionId=${m.operacionId}, m.id=${m.id}`);
            }

            return match;
          });
          
          if (foundMovimiento) {
            console.log(`Movimiento de recepción encontrado en página ${currentPage}:`, foundMovimiento);
            movimientoRecepcion = foundMovimiento;
            break;
          }
        }
        
        currentPage++;
      } while (currentPage <= totalPages && !movimientoRecepcion);
      
      if (movimientoRecepcion) {
        let movimientoOriginal: MovimientoOriginal | null = null;
        
        // PASO 2: Intentar obtener datos del movimiento original usando el UUID
        try {
          const uuidOriginal = movimientoRecepcion.operacionId || retiroId;
          console.log(`Intentando obtener detalles del movimiento original con UUID: ${uuidOriginal}`);
          // Probamos el endpoint que falló antes, pero quizás funcione con UUID ahora?
          const responseOriginal = await axios.get(`/api/caja_mayor_movimientos/${uuidOriginal}`); 
          if (responseOriginal.data) {
            console.log("Datos del movimiento original encontrados:", responseOriginal.data);
            movimientoOriginal = responseOriginal.data;
          } else {
            console.log("Endpoint de movimiento original no devolvió datos.");
          }
        } catch (errorOriginal: any) {
          console.warn("No se pudieron obtener detalles adicionales del movimiento original.", errorOriginal.response?.data || errorOriginal.message);
          // Si falla, continuaremos solo con los datos del movimiento de recepción
        }

        // PASO 3: Construir el objeto Retiro combinando datos
        const retiroData: Retiro = {
          id: retiroId, // UUID del retiro original
          
          // Usar datos del movimiento original si existen, sino del de recepción o por defecto
          cajaId: (movimientoOriginal?.cajaId || movimientoRecepcion.cajaId || 'desconocido').toString(),
          cajaNombre: movimientoOriginal?.cajaNombre || movimientoOriginal?.caja || 'Caja desconocida',
          sucursalId: (movimientoOriginal?.sucursalId || movimientoRecepcion.sucursalId || 'desconocido').toString(),
          sucursalNombre: movimientoOriginal?.sucursalNombre || movimientoOriginal?.sucursal || 'Sucursal desconocida',
          
          // Datos principalmente del movimiento de recepción
          personaId: (movimientoRecepcion.usuarioId || 'desconocido').toString(),
          personaNombre: movimientoRecepcion.usuario?.nombre || movimientoRecepcion.concepto || 'Responsable desconocido',
          fecha: movimientoRecepcion.fechaHora || new Date().toISOString(),
          montoPYG: movimientoRecepcion.moneda?.toLowerCase() === 'guaranies' ? parseFloat(movimientoRecepcion.monto || '0') : 0,
          montoBRL: movimientoRecepcion.moneda?.toLowerCase() === 'reales' ? parseFloat(movimientoRecepcion.monto || '0') : 0,
          montoUSD: movimientoRecepcion.moneda?.toLowerCase() === 'dolares' ? parseFloat(movimientoRecepcion.monto || '0') : 0,
          
          // Observación: Priorizar la del original, sino la de recepción
          observacion: movimientoOriginal?.observacion || movimientoRecepcion.observaciones || '-',
          
          // Datos de estado/recepción del movimiento de recepción
          estadoRecepcion: (movimientoRecepcion.estado || 'RECIBIDO') as 'PENDIENTE' | 'RECIBIDO' | 'RECHAZADO',
          fechaRecepcion: movimientoRecepcion.fechaRecepcion || movimientoRecepcion.fechaHora || '',
          usuarioRecepcion: movimientoRecepcion.usuarioRecepcion || movimientoRecepcion.usuario?.nombre || '',
          observacionRecepcion: movimientoRecepcion.observacionRecepcion || movimientoRecepcion.observaciones || ''
        };

        console.log('Datos combinados del retiro construidos:', retiroData);
        setRetiro(retiroData);

      } else {
        console.log("No se encontró el movimiento de recepción en ninguna página.");
        if (primerMovimientoInspeccionado) {
          console.log('Estructura del primer movimiento (recepción) inspeccionado:', primerMovimientoInspeccionado);
        }
        throw new Error(`No se encontró el movimiento de recepción asociado al retiro con UUID ${retiroId}`);
      }
    } catch (error: any) {
      console.error('Error final al cargar datos del retiro:', error);
      setError(`Error al cargar los datos del retiro: ${error.message || 'Intente nuevamente'}`);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return '-';
    
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleDateString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return fechaIso;
    }
  };

  // Formatear montos
  const formatearMontoPYG = (monto: number): string => {
    return monto > 0 ? formatCurrency.guaranies(monto) : '-';
  };
  
  const formatearMontoBRL = (monto: number): string => {
    return monto > 0 ? `R$ ${monto.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
  };
  
  const formatearMontoUSD = (monto: number): string => {
    return monto > 0 ? `US$ ${monto.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
  };
  
  // Manejar cambios en los inputs de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'observacionDevolucion') {
      setObservacionDevolucion(value);
    }
  };

  // Devolver el retiro
  const devolverRetiro = async () => {
    // Validar que tengamos un retiro para devolver
    if (!retiro) {
      setError('No se pudo encontrar el retiro a devolver');
      return;
    }
    
    // Validar que tengamos un usuario autenticado
    if (!user) {
      setError('Error de autenticación. No se pudo identificar al usuario.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const dataToSend = {
        retiroId: retiro.id,
        movimientoId: retiroId,
        observacion: observacionDevolucion,
        usuarioDevolucionId: user.id
      };
      
      console.log("Enviando datos para devolver retiro:", dataToSend);
      
      // Enviar solicitud a la API para devolver el retiro
      const response = await axios.post('/api/cajas-mayor/retiros/devolver', dataToSend);
      
      // Mostrar mensaje de éxito
      setSuccessMessage(response.data.message || 'Retiro devuelto correctamente.');
      
      // Limpiar observación
      setObservacionDevolucion('');
      
      // Llamar a la función de refresco del componente padre
      onGuardarExito();
      
      // Cerrar el diálogo después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      setError('Error al devolver el retiro. Intente nuevamente.');
      console.error('Error al devolver retiro:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar el diálogo
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
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
          <Typography variant="h6">Devolver Retiro</Typography>
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : retiro ? (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Información del Retiro
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      ID:
                    </Typography>
                    <Typography variant="body1">
                      {retiro.id}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha:
                    </Typography>
                    <Typography variant="body1">
                      {formatearFecha(retiro.fecha)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Sucursal:
                    </Typography>
                    <Typography variant="body1">
                      {retiro.sucursalNombre}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Caja:
                    </Typography>
                    <Typography variant="body1">
                      {retiro.cajaNombre}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Responsable:
                    </Typography>
                    <Typography variant="body1">
                      {retiro.personaNombre}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Montos y Estado
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Guaraníes:
                    </Typography>
                    <Typography variant="body1" fontWeight={retiro.montoPYG > 0 ? 'bold' : 'normal'}>
                      {formatearMontoPYG(retiro.montoPYG)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Reales:
                    </Typography>
                    <Typography variant="body1" fontWeight={retiro.montoBRL > 0 ? 'bold' : 'normal'}>
                      {formatearMontoBRL(retiro.montoBRL)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Dólares:
                    </Typography>
                    <Typography variant="body1" fontWeight={retiro.montoUSD > 0 ? 'bold' : 'normal'}>
                      {formatearMontoUSD(retiro.montoUSD)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Estado de recepción:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color={
                      retiro.estadoRecepcion === 'RECIBIDO' ? 'success.main' : 
                      retiro.estadoRecepcion === 'PENDIENTE' ? 'warning.main' : 'error.main'
                    }>
                      {retiro.estadoRecepcion === 'RECIBIDO' ? 'Recibido' : 
                       retiro.estadoRecepcion === 'PENDIENTE' ? 'Pendiente' : 'Rechazado'}
                    </Typography>
                  </Box>
                  
                  {retiro.fechaRecepcion && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de recepción:
                      </Typography>
                      <Typography variant="body1">
                        {formatearFecha(retiro.fechaRecepcion)}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Observaciones
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Observación original:
                    </Typography>
                    <Typography variant="body1">
                      {retiro.observacion || '-'}
                    </Typography>
                  </Box>
                  
                  {retiro.observacionRecepcion && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Observación de recepción:
                      </Typography>
                      <Typography variant="body1">
                        {retiro.observacionRecepcion}
                      </Typography>
                    </Box>
                  )}
                  
                  <TextField
                    fullWidth
                    label="Observación de devolución"
                    name="observacionDevolucion"
                    value={observacionDevolucion}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    placeholder="Ingrese el motivo de la devolución del retiro"
                  />
                </Paper>
              </Grid>
            </Grid>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              Al devolver este retiro, su estado cambiará a "PENDIENTE" y se registrará un egreso en Caja Mayor por el mismo valor.
            </Alert>
          </>
        ) : (
          <Alert severity="info">
            No se pudieron cargar los datos del retiro
          </Alert>
        )}
        
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
          startIcon={<CloseIcon />}
        >
          Cancelar
        </Button>
        
        {retiro && retiro.estadoRecepcion === 'RECIBIDO' && (
          <Button
            variant="contained"
            color="warning"
            startIcon={<ArrowBackIcon />}
            onClick={devolverRetiro}
            disabled={loading}
          >
            Devolver Retiro
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DevolverRetiro; 