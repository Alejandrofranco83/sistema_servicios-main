import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  IconButton,
  Alert,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Info as InfoIcon, 
  Print as PrintIcon 
} from '@mui/icons-material';
import { useCajas } from '../CajasContext';
import { formatearIdCaja, formatearMontoConSeparadores } from '../helpers';
import FormRetiro from './FormRetiro';

// === DEFINICIÓN DE TIPOS ===
interface Retiro {
  id: string;
  fecha: string;
  personaNombre: string;
  montoPYG: number;
  montoBRL: number;
  montoUSD: number;
  observacion: string;
  estadoRecepcion?: 'PENDIENTE' | 'RECIBIDO' | 'RECHAZADO' | string;
  ids?: string[];
}

interface ListaRetirosProps {
  open: boolean;
  onClose: () => void;
}

// === COMPONENTE VISTA PREVIA DE TICKET ===
interface TicketPreviewProps {
  open: boolean;
  onClose: () => void;
  retiro: Retiro | null;
  cajaId: string | number;
}

const TicketPreview: React.FC<TicketPreviewProps> = ({ open, onClose, retiro, cajaId }) => {
  if (!retiro) return null;
  
  // Generar un número corto a partir del ID
  const numeroCorto = retiro.id.slice(-6);
  
  // Formatear fecha
  const fecha = new Date(retiro.fecha);
  const fechaFormateada = fecha.toLocaleDateString('es-PY');
  const horaFormateada = fecha.toLocaleTimeString('es-PY');
  
  // Función para imprimir el ticket usando la impresora térmica
  const imprimirTicket = async () => {
    try {
      // Importar dinámicamente el servicio
      const module = await import('../../../services/ElectronPrinterService');
      const electronPrinterService = module.default;
      
      // Obtener la configuración de la impresora para asegurar la impresión silenciosa
      const configResult = await electronPrinterService.getPrinterConfig();
      let printerOptions = {};
      if (configResult.success && configResult.config) {
        printerOptions = {
          ...configResult.config,
          preview: false, // Forzar que no haya vista previa
          silent: true    // Forzar impresión silenciosa
        };
      }

      // Crear contenido HTML para la impresora térmica, similar a la vista previa
      const htmlContent = [
        // Título
        {
          type: 'text',
          value: 'COMPROBANTE DE RETIRO',
          style: { 
            fontSize: '18px',
            fontWeight: '700',
            textAlign: 'center', 
            margin: '0 0 10px 0'
          }
        },
        // Datos del comprobante
        {
          type: 'text',
          value: `N°: ${numeroCorto}`,
          style: { fontSize: '12px', textAlign: 'left', margin: '0 0 2px 0' }
        },
        {
          type: 'text',
          value: `CAJA: ${cajaId}`,
          style: { fontSize: '12px', textAlign: 'left', margin: '0 0 2px 0' }
        },
        {
          type: 'text',
          value: `FECHA: ${fechaFormateada}`,
          style: { fontSize: '12px', textAlign: 'left', margin: '0 0 2px 0' }
        },
        {
          type: 'text',
          value: `HORA: ${horaFormateada}`,
          style: { fontSize: '12px', textAlign: 'left', margin: '0 0 10px 0' }
        },
        // Línea divisoria
        {
          type: 'text',
          value: '--------------------------------',
          style: { fontSize: '12px', textAlign: 'center', margin: '5px 0' }
        },
        // Entregado A
        {
          type: 'text',
          value: `ENTREGADO A: ${retiro.personaNombre}`,
          style: { 
            fontSize: '14px', 
            fontWeight: '700',
            textAlign: 'left', 
            margin: '5px 0 10px 0'
          }
        },
        // Línea divisoria
        {
          type: 'text',
          value: '--------------------------------',
          style: { fontSize: '12px', textAlign: 'center', margin: '5px 0' }
        }
      ];

      // Agregar montos si existen
      if (retiro.montoPYG > 0) {
        htmlContent.push({
          type: 'text',
          value: `GUARANIES: ${formatearMontoConSeparadores(retiro.montoPYG)} G$`,
          style: { 
            fontSize: '14px', 
            fontWeight: '700',
            textAlign: 'left', 
            margin: '5px 0 2px 0'
          }
        });
      }

      if (retiro.montoBRL > 0) {
        htmlContent.push({
          type: 'text',
          value: `REALES: R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(retiro.montoBRL)}`,
          style: { 
            fontSize: '14px', 
            fontWeight: '700',
            textAlign: 'left', 
            margin: '2px 0 2px 0'
          }
        });
      }

      if (retiro.montoUSD > 0) {
        htmlContent.push({
          type: 'text',
          value: `DOLARES: U$D ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(retiro.montoUSD)}`,
          style: { 
            fontSize: '14px', 
            fontWeight: '700',
            textAlign: 'left', 
            margin: '2px 0 10px 0'
          }
        });
      }

      // Agregar observación si existe
      if (retiro.observacion) {
        htmlContent.push({
          type: 'text',
          value: '--------------------------------',
          style: { fontSize: '12px', textAlign: 'center', margin: '5px 0' }
        });
        htmlContent.push({
          type: 'text',
          value: 'OBSERVACIÓN:',
          style: { 
            fontSize: '12px', 
            textAlign: 'left', 
            margin: '5px 0 2px 0'
          }
        });
        htmlContent.push({
          type: 'text',
          value: retiro.observacion,
          style: { fontSize: '12px', textAlign: 'left', margin: '0 0 10px 0' }
        });
      }

      // Espacio para firma
      htmlContent.push({
        type: 'text',
        value: '--------------------------------',
        style: { 
          fontSize: '12px', 
          textAlign: 'center', 
          margin: '20px 0 5px 0'
        }
      });
      htmlContent.push({
        type: 'text',
        value: '______________________________',
        style: { 
          fontSize: '12px', 
          textAlign: 'center', 
          margin: '0'
        }
      });
      htmlContent.push({
        type: 'text',
        value: 'Firma',
        style: { 
          fontSize: '12px', 
          textAlign: 'center', 
          margin: '0'
        }
      });

      // Pie de página (Impreso el)
      htmlContent.push({
        type: 'text',
        value: `Impreso: ${new Date().toLocaleString('es-PY')}`,
        style: {
          fontSize: '10px',
          textAlign: 'center',
          margin: '10px 0 0 0'
        }
      });
      
      // Preparar objeto para imprimir, pasando las opciones modificadas
      const ticketContent = {
        lines: [], 
        htmlContent: htmlContent,
        // Aquí pasamos las opciones directamente. 
        // La función printReceipt en preload.js las usará.
        options: printerOptions 
      };

      // Intentar imprimir
      // La función printTicket ahora debería usar las options que le pasamos
      // y estas a su vez deberían ser recogidas por printReceipt en preload.js
      const printResult = await electronPrinterService.printTicket(ticketContent);
      
      if (!printResult.success) {
        console.error('Error al imprimir con impresora térmica:', printResult.error);
        window.print(); 
      }
    } catch (error) {
      console.error('Error al preparar la impresión térmica:', error);
      window.print();
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          width: '58mm',
          minHeight: '350px',
          bgcolor: '#fff',
          color: '#000',
          borderRadius: 1,
          p: 1
        }
      }}
    >
      <DialogContent>
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}>
          <Typography variant="subtitle1" align="center" sx={{ width: '100%', fontWeight: 'bold', mb: 1 }}>
            COMPROBANTE DE RETIRO
          </Typography>
          
          <Box sx={{ width: '100%', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', py: 1, my: 1 }}>
            <Typography variant="body2">N°: {numeroCorto}</Typography>
            <Typography variant="body2">CAJA: {cajaId}</Typography>
            <Typography variant="body2">FECHA: {fechaFormateada}</Typography>
            <Typography variant="body2">HORA: {horaFormateada}</Typography>
          </Box>
          
          <Box sx={{ width: '100%', py: 1 }}>
            <Typography variant="body2">ENTREGADO A: {retiro.personaNombre}</Typography>
            
            {retiro.montoPYG > 0 && (
              <Typography variant="body2">
                GUARANÍES: {formatearMontoConSeparadores(retiro.montoPYG)} G$
              </Typography>
            )}
            
            {retiro.montoBRL > 0 && (
              <Typography variant="body2">
                REALES: R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(retiro.montoBRL)}
              </Typography>
            )}
            
            {retiro.montoUSD > 0 && (
              <Typography variant="body2">
                DÓLARES: U$D {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(retiro.montoUSD)}
              </Typography>
            )}
          </Box>
          
          {retiro.observacion && (
            <Box sx={{ width: '100%', py: 1 }}>
              <Typography variant="body2">OBSERVACIÓN:</Typography>
              <Typography variant="body2">{retiro.observacion}</Typography>
            </Box>
          )}
          
          <Box sx={{ width: '100%', borderTop: '1px dashed #000', mt: 2, pt: 1, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" align="center">
              ______________________________
            </Typography>
          </Box>
          <Typography variant="body2" align="center">Firma</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">
          Cerrar
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          size="small"
          onClick={imprimirTicket}
        >
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// === COMPONENTE PRINCIPAL ===
const ListaRetiros: React.FC<ListaRetirosProps> = ({ open, onClose }) => {
  const {
    cajaSeleccionada,
    retiros,
    retirosDialogOpen,
    setRetirosDialogOpen,
    handleNuevoRetiro,
    handleEliminarRetiro
  } = useCajas();
  
  const [ticketPreviewOpen, setTicketPreviewOpen] = useState(false);
  const [retiroSeleccionado, setRetiroSeleccionado] = useState<Retiro | null>(null);

  // Función para abrir la vista previa del ticket
  const handleVerTicket = (retiro: Retiro) => {
    setRetiroSeleccionado(retiro);
    setTicketPreviewOpen(true);
  };

  // Función para formatear la fecha
  const formatearFecha = (fechaIso: string) => {
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleDateString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(',', '');
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return fechaIso;
    }
  };

  // Función para formatear montos de reales y dólares
  const formatearMontoDecimal = (monto: number, moneda: 'BRL' | 'USD') => {
    if (moneda === 'BRL') {
      // Formato brasileño: punto para miles, coma para decimales
      return new Intl.NumberFormat('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(monto);
    } else {
      // Formato estadounidense: coma para miles, punto para decimales
      return new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(monto);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{ 
          '& .MuiDialog-paper': { 
            bgcolor: '#333', 
            color: 'white' 
          } 
        }}
      >
        <DialogTitle>
          Retiros de Caja
        </DialogTitle>
        <DialogContent>
          {cajaSeleccionada && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Caja ID: {cajaSeleccionada.cajaEnteroId}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNuevoRetiro}
            >
              Nuevo Retiro
            </Button>
          </Box>
          
          {retiros.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2, bgcolor: '#1e1e1e', color: 'white' }}>
              No hay retiros registrados para esta caja.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: '#444' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#ccc' }}>Fecha</TableCell>
                    <TableCell sx={{ color: '#ccc' }}>Persona</TableCell>
                    <TableCell align="right" sx={{ color: '#ccc' }}>Guaraníes</TableCell>
                    <TableCell align="right" sx={{ color: '#ccc' }}>Reales</TableCell>
                    <TableCell align="right" sx={{ color: '#ccc' }}>Dólares</TableCell>
                    <TableCell sx={{ color: '#ccc' }}>Observación</TableCell>
                    <TableCell align="center" sx={{ color: '#ccc' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {retiros.map((retiro: Retiro, index: number) => {
                    console.log(`Retiro #${index + 1}:`, retiro, "Estado Recepción:", retiro.estadoRecepcion);
                    
                    const isRecibido = retiro.estadoRecepcion === 'RECIBIDO';
                    return (
                      <TableRow key={retiro.id} sx={{ '&:hover': { bgcolor: '#555' }, opacity: isRecibido ? 0.6 : 1 }}>
                      <TableCell sx={{ color: 'white' }}>{formatearFecha(retiro.fecha)}</TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        {retiro.personaNombre}
                        {retiro.ids && retiro.ids.length > 1 && (
                          <Tooltip title={`Este registro agrupa ${retiro.ids.length} movimientos diferentes`}>
                            <InfoIcon 
                              fontSize="small" 
                              color="info" 
                              sx={{ ml: 1, verticalAlign: 'middle', fontSize: '1rem' }} 
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'white' }}>
                        {retiro.montoPYG > 0 ? `${formatearMontoConSeparadores(retiro.montoPYG)} G$` : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'white' }}>
                        {retiro.montoBRL > 0 ? `R$ ${formatearMontoDecimal(retiro.montoBRL, 'BRL')}` : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'white' }}>
                        {retiro.montoUSD > 0 ? `U$D ${formatearMontoDecimal(retiro.montoUSD, 'USD')}` : '-'}
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{retiro.observacion}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Vista previa de impresión">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleVerTicket(retiro)}
                              sx={{ mr: 1 }}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={isRecibido ? "No se puede eliminar un retiro ya recibido" : "Eliminar retiro"}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleEliminarRetiro(retiro.id)}
                                disabled={isRecibido}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#333' }}>
          <Button 
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Formulario de retiro */}
      <FormRetiro 
        open={retirosDialogOpen} 
        onClose={() => setRetirosDialogOpen(false)}
      />
      
      {/* Vista previa de ticket */}
      <TicketPreview
        open={ticketPreviewOpen}
        onClose={() => setTicketPreviewOpen(false)}
        retiro={retiroSeleccionado}
        cajaId={cajaSeleccionada?.cajaEnteroId || ''}
      />
    </>
  );
};

export default ListaRetiros; 