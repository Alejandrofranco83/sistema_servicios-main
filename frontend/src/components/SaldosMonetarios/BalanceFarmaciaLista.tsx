import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Paper,
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  useTheme,
  GlobalStyles
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  CurrencyExchange as CurrencyExchangeIcon
} from '@mui/icons-material';
import api from '../../services/api';

// Interfaz actualizada para los items (coincide con backend, monto es string)
interface MovimientoFarmacia {
  id: number;
  fechaHora: string; // ISO String desde backend
  tipoMovimiento: 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA' | 'AJUSTE' | string; // Permitir string por si acaso
  concepto: string;
  monto: string; // ¡Viene como string del backend!
  monedaCodigo: string;
  detalleAdicional?: string;
  movimientoOrigenId?: number;
  movimientoOrigenTipo?: string;
  estado: string;
  usuario?: { // Usuario opcional (si se incluye en backend)
    id: number;
    username: string;
    nombre: string;
  } | null;
  // Nueva información de operación bancaria con datos de caja
  operacionBancaria?: {
    id: string;
    tipo: string;
    caja: {
      id: string;
      cajaEnteroId: number; // Número de caja
      sucursal: {
        id: string;
        nombre: string;
        codigo: string;
      };
      usuario: {
        id: number;
        nombre: string;
        username: string;
      };
    };
  } | null;
  // ... otros campos que devuelva el backend
}

// Formateador de moneda (ajustado para aceptar string o number)
const formatCurrency = (amount: string | number | null | undefined, currency: string) => {
  if (amount == null || amount === '') return '-'; 
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '-';

  const absAmount = Math.abs(numericAmount);
  if (currency === 'PYG') {
    return new Intl.NumberFormat('de-DE').format(absAmount); // Punto como separador de miles
  } else if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(absAmount);
  }
  return absAmount.toString();
};

const getCurrencySymbol = (currency: string) => {
  if (currency === 'PYG') return 'Gs';
  if (currency === 'USD') return '$';
  if (currency === 'BRL') return 'R$'; // Añadir Real si es necesario
  return '';
}

const BalanceFarmaciaLista: React.FC = () => {
  const theme = useTheme();
  
  // Estados para datos, paginación, filtros, carga y error
  const [movimientos, setMovimientos] = useState<MovimientoFarmacia[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalBalanceDesdeAPI, setTotalBalanceDesdeAPI] = useState<string>('0'); // Almacenar como string
  const [totalBalanceUSD, setTotalBalanceUSD] = useState<string>('0'); // Balance en dólares
  const [totalBalanceBRL, setTotalBalanceBRL] = useState<string>('0'); // Balance en reales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(0); // La API espera página base 1, MUI usa base 0
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('');
  const [tiposMovimientoDisponibles, setTiposMovimientoDisponibles] = useState<string[]>([]);

  // Función para buscar movimientos desde la API
  const fetchMovimientos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Asegurarnos de que el valor del filtro no esté vacío
      const filtroTipoMovimiento = tipoMovimiento.trim() !== '' ? tipoMovimiento : undefined;
      
      console.log('Filtrando por tipo movimiento:', filtroTipoMovimiento); // Log para depuración
      
      const params = {
        page: page + 1, // Enviar página base 1 a la API
        limit: rowsPerPage,
        fechaDesde: fechaDesde || undefined, // Enviar undefined si está vacío
        fechaHasta: fechaHasta || undefined,
        tipoMovimiento: filtroTipoMovimiento,
      };

      console.log('Parámetros enviados a la API:', params); // Log para depuración

      const response = await api.get(`/api/movimientos-farmacia`, { params });
      
      const movimientosData = response.data.data || [];
      console.log('Datos recibidos:', movimientosData); // Log para depuración
      
      // Debuggear específicamente las operaciones bancarias
      movimientosData.forEach((mov: any, index: number) => {
        if (mov.movimientoOrigenTipo === 'OPERACION_BANCARIA') {
          console.log(`[DEBUG] Movimiento ${index} es OPERACION_BANCARIA:`, {
            id: mov.id,
            concepto: mov.concepto,
            movimientoOrigenId: mov.movimientoOrigenId,
            movimientoOrigenTipo: mov.movimientoOrigenTipo,
            operacionBancaria: mov.operacionBancaria,
            hasOperacionBancaria: !!mov.operacionBancaria,
            hasCaja: !!(mov.operacionBancaria?.caja)
          });
        }
      });
      
      setMovimientos(movimientosData);
      setTotalCount(response.data.totalCount || 0);
      
      // Obtener el balance en guaraníes sin conversiones
      // Para esto usamos totalBalancePYGSinConversion si está disponible, 
      // de lo contrario usamos un cálculo manual basado en solo los movimientos en guaraníes
      // Nota: Si el backend no proporciona este valor, deberá modificarse para incluirlo
      const soloGuaranies = await api.get(`/api/movimientos-farmacia`, { 
        params: {
          ...params,
          monedaCodigo: 'PYG', // Filtrar solo por guaraníes
          soloTotal: true // Para optimizar, indicamos que solo queremos el total
        } 
      });
      
      // Usar el total de guaraníes sin conversión, o el valor convertido si no está disponible
      setTotalBalanceDesdeAPI(soloGuaranies.data.totalBalancePYG || response.data.totalBalancePYG || '0');
      
      // Obtener totales de USD y BRL si están disponibles en la API
      setTotalBalanceUSD(response.data.totalBalanceUSD || '0');
      setTotalBalanceBRL(response.data.totalBalanceBRL || '0');

      // Extraer tipos de movimiento únicos para el filtro
      if (movimientosData.length > 0) {
        const tiposUnicos = Array.from(new Set(
          movimientosData.map((mov: MovimientoFarmacia) => 
            mov.movimientoOrigenTipo || mov.tipoMovimiento
          )
        )).filter(Boolean) as string[];
        
        // Ordenar alfabéticamente
        tiposUnicos.sort();
        setTiposMovimientoDisponibles(tiposUnicos);
      }

    } catch (err: any) {
      console.error('Error al buscar movimientos de farmacia:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar los datos');
      setMovimientos([]); // Limpiar datos en caso de error
      setTotalCount(0);
      setTotalBalanceDesdeAPI('0');
      setTotalBalanceUSD('0');
      setTotalBalanceBRL('0');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, fechaDesde, fechaHasta, tipoMovimiento]);

  // useEffect para llamar a fetchMovimientos cuando cambian las dependencias
  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Resetear a la primera página al cambiar el límite
  };

  return (
    <Box>
      {/* Aplicar estilos globales de scrollbar */}
      <GlobalStyles
        styles={{
          '*::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: '#121212', // Casi negro
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: '#333', // Gris muy oscuro
            borderRadius: '6px',
            '&:hover': {
              backgroundColor: '#444', // Ligeramente más claro al pasar el mouse
            },
          },
          'html': {
            scrollbarColor: '#333 #121212', // Formato: thumb track
            scrollbarWidth: 'thin',
          },
          'body': {
            scrollbarColor: '#333 #121212',
            scrollbarWidth: 'thin',
          }
        }}
      />

      {/* Sección de Totales con Cards coloridas */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Balance Guaraníes */}
        <Grid item xs={12} md={4}>
          {(() => {
            const balanceNum = parseFloat(totalBalanceDesdeAPI);
            const isPositive = !isNaN(balanceNum) && balanceNum > 0;
            const isNegative = !isNaN(balanceNum) && balanceNum < 0;
            
            let titulo = "Balance Gs";
            let color = theme.palette.grey[600];
            let icon = <AccountBalanceIcon fontSize="small" />;
            
            if (isPositive) {
              titulo = "Debemos a Farmacia";
              color = theme.palette.error.main;
              icon = <TrendingDownIcon fontSize="small" />;
            } else if (isNegative) {
              titulo = "Farmacia nos debe";
              color = theme.palette.success.main;
              icon = <TrendingUpIcon fontSize="small" />;
            }

            return (
              <Card 
                sx={{ 
                  height: '100%',
                  borderLeft: `4px solid ${color}`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <CardContent sx={{ p: 1.5, pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${color}20`,
                        color: color,
                        borderRadius: '50%',
                        p: 0.5,
                        mr: 1,
                        minWidth: 28,
                        height: 28
                      }}
                    >
                      {icon}
                    </Box>
                    <Typography variant="subtitle2" component="div" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {titulo}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', mt: 0.5 }}
                  >
                    {formatCurrency(totalBalanceDesdeAPI, 'PYG')} Gs
                  </Typography>
                </CardContent>
              </Card>
            );
          })()}
        </Grid>

        {/* Balance USD */}
        <Grid item xs={12} md={4}>
          {(() => {
            const balanceNum = parseFloat(totalBalanceUSD);
            const isPositive = !isNaN(balanceNum) && balanceNum > 0;
            const isNegative = !isNaN(balanceNum) && balanceNum < 0;
            
            let titulo = "Balance USD";
            let color = theme.palette.grey[600];
            let icon = <AttachMoneyIcon fontSize="small" />;
            
            if (isPositive) {
              titulo = "Debemos a Farmacia USD";
              color = theme.palette.error.main;
              icon = <TrendingDownIcon fontSize="small" />;
            } else if (isNegative) {
              titulo = "Farmacia nos debe USD";
              color = theme.palette.success.main;
              icon = <TrendingUpIcon fontSize="small" />;
            }

            return (
              <Card 
                sx={{ 
                  height: '100%',
                  borderLeft: `4px solid ${color}`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <CardContent sx={{ p: 1.5, pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${color}20`,
                        color: color,
                        borderRadius: '50%',
                        p: 0.5,
                        mr: 1,
                        minWidth: 28,
                        height: 28
                      }}
                    >
                      {icon}
                    </Box>
                    <Typography variant="subtitle2" component="div" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {titulo}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', mt: 0.5 }}
                  >
                    {formatCurrency(totalBalanceUSD, 'USD')} $
                  </Typography>
                </CardContent>
              </Card>
            );
          })()}
        </Grid>

        {/* Balance BRL */}
        <Grid item xs={12} md={4}>
          {(() => {
            const balanceNum = parseFloat(totalBalanceBRL);
            const isPositive = !isNaN(balanceNum) && balanceNum > 0;
            const isNegative = !isNaN(balanceNum) && balanceNum < 0;
            
            let titulo = "Balance BRL";
            let color = theme.palette.grey[600];
            let icon = <CurrencyExchangeIcon fontSize="small" />;
            
            if (isPositive) {
              titulo = "Debemos a Farmacia BRL";
              color = theme.palette.error.main;
              icon = <TrendingDownIcon fontSize="small" />;
            } else if (isNegative) {
              titulo = "Farmacia nos debe BRL";
              color = theme.palette.success.main;
              icon = <TrendingUpIcon fontSize="small" />;
            }

            return (
              <Card 
                sx={{ 
                  height: '100%',
                  borderLeft: `4px solid ${color}`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <CardContent sx={{ p: 1.5, pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${color}20`,
                        color: color,
                        borderRadius: '50%',
                        p: 0.5,
                        mr: 1,
                        minWidth: 28,
                        height: 28
                      }}
                    >
                      {icon}
                    </Box>
                    <Typography variant="subtitle2" component="div" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {titulo}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', mt: 0.5 }}
                  >
                    {formatCurrency(totalBalanceBRL, 'BRL')} R$
                  </Typography>
                </CardContent>
              </Card>
            );
          })()}
        </Grid>
      </Grid>

      {/* Sección de Filtros */}
      <Paper elevation={2} sx={{ mb: 2, p: 1.5, bgcolor: theme.palette.background.default }}>
        <Typography variant="subtitle1" gutterBottom sx={{ 
          color: theme.palette.primary.main,
          display: 'flex',
          alignItems: 'center',
          mb: 1.5,
          fontSize: '1rem',
          fontWeight: 600
        }}>
          <CurrencyExchangeIcon fontSize="small" sx={{ mr: 1 }} />
          Filtros de Búsqueda
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Fecha Desde"
              type="date"
              size="small"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(0); }} // Reset page on filter change
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Fecha Hasta"
              type="date"
              size="small"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(0); }} // Reset page on filter change
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo Movimiento</InputLabel>
              <Select
                value={tipoMovimiento}
                label="Tipo Movimiento"
                onChange={(e) => { 
                  console.log('Tipo Movimiento seleccionado:', e.target.value); // Log para depuración
                  setTipoMovimiento(e.target.value); 
                  setPage(0); // Reset page on filter change
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {tiposMovimientoDisponibles.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Mostrar error si existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabla de Movimientos con encabezado mejorado */}
      <TableContainer 
        component={Paper} 
        variant="outlined"
        sx={{
          '& .MuiTableHead-root': {
            background: 'linear-gradient(135deg, #CD853F 0%, #8B6914 50%, #5D4E0B 100%)', // Dorado oscuro con degradé e iluminación lateral
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            color: '#2C1810', // Texto marrón oscuro para contraste con el dorado
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo Movimiento</TableCell>
              <TableCell>Concepto</TableCell>
              <TableCell align="center">Detalle</TableCell>
              <TableCell align="right" sx={{ color: theme.palette.success.main + '!important' }}>
                Entrada
              </TableCell>
              <TableCell align="right" sx={{ color: theme.palette.error.main + '!important' }}>
                Salida
              </TableCell>
              <TableCell>Mon</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : movimientos.length > 0 ? (
              movimientos.map((mov) => {
                // Convertir monto string a número para la lógica de entrada/salida
                const montoNum = parseFloat(mov.monto);
                const esEntrada = !isNaN(montoNum) && montoNum > 0;
                const esSalida = !isNaN(montoNum) && montoNum < 0;
                
                return (
                  <TableRow 
                    key={mov.id}
                    sx={{
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                      '&:nth-of-type(odd)': {
                        bgcolor: '#2A2A2A', // Gris más oscuro para filas alternadas
                      }
                    }}
                  >
                    <TableCell>{new Date(mov.fechaHora).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        bgcolor: '#8B691430', // Dorado oscuro con transparencia
                        color: '#CD853F', // Dorado más claro para el texto
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                        display: 'inline-block'
                      }}>
                        {mov.movimientoOrigenTipo || mov.tipoMovimiento}
                      </Box>
                    </TableCell>
                    <TableCell>{mov.concepto}</TableCell>
                    <TableCell align="center">
                      {/* Mostrar tooltip con información de operación bancaria si está disponible */}
                      {mov.operacionBancaria?.caja ? (
                        <Tooltip 
                          title={
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Operación Bancaria
                              </Typography>
                              <Typography variant="body2">
                                <strong>Sucursal:</strong> {mov.operacionBancaria.caja.sucursal.nombre}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Usuario:</strong> {mov.operacionBancaria.caja.usuario.nombre}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Nro. Caja:</strong> {mov.operacionBancaria.caja.cajaEnteroId}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Tipo:</strong> {mov.operacionBancaria.tipo.toUpperCase()}
                              </Typography>
                            </Box>
                          } 
                          arrow
                          placement="left"
                        >
                          <IconButton 
                            size="small"
                            sx={{
                              color: theme.palette.info.main,
                              '&:hover': {
                                bgcolor: theme.palette.info.main + '20'
                              }
                            }}
                          >
                            <VisibilityIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      ) : (mov.detalleAdicional || mov.movimientoOrigenId) ? (
                        <Tooltip title={mov.detalleAdicional || `Origen: ${mov.movimientoOrigenTipo} ID: ${mov.movimientoOrigenId}`} arrow>
                          <IconButton 
                            size="small"
                            sx={{
                              color: theme.palette.grey[500],
                              '&:hover': {
                                bgcolor: theme.palette.grey[500] + '20'
                              }
                            }}
                          >
                            <VisibilityIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                    <TableCell align="right">
                      {esEntrada ? (
                        <Typography sx={{ 
                          color: theme.palette.success.main, 
                          fontWeight: 'bold' 
                        }}>
                          {formatCurrency(montoNum, mov.monedaCodigo)}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {esSalida ? (
                        <Typography sx={{ 
                          color: theme.palette.error.main, 
                          fontWeight: 'bold' 
                        }}>
                          {formatCurrency(montoNum, mov.monedaCodigo)}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        px: 1, 
                        py: 0.25, 
                        borderRadius: 1, 
                        bgcolor: theme.palette.secondary.dark + '20',
                        color: theme.palette.secondary.main,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        minWidth: '30px',
                        textAlign: 'center'
                      }}>
                        {getCurrencySymbol(mov.monedaCodigo)}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" sx={{ py: 3, color: theme.palette.text.secondary }}>
                  No hay movimientos que coincidan con los filtros.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación (usa datos de API) */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount} // Total de filas desde API
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
      />
    </Box>
  );
};

export default BalanceFarmaciaLista; 