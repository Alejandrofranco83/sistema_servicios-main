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
  Alert
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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

      const response = await axios.get(`${API_URL}/movimientos-farmacia`, { params });
      
      const movimientosData = response.data.data || [];
      console.log('Datos recibidos:', movimientosData); // Log para depuración
      
      setMovimientos(movimientosData);
      setTotalCount(response.data.totalCount || 0);
      
      // Obtener el balance en guaraníes sin conversiones
      // Para esto usamos totalBalancePYGSinConversion si está disponible, 
      // de lo contrario usamos un cálculo manual basado en solo los movimientos en guaraníes
      // Nota: Si el backend no proporciona este valor, deberá modificarse para incluirlo
      const soloGuaranies = await axios.get(`${API_URL}/movimientos-farmacia`, { 
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
      {/* Sección de Totales (usa dato de API) */}
      <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
         <Grid container spacing={2}>
           <Grid item xs={12} md={4}>
             {(() => {
               // Convertir el balance (string) a número
               const balanceNum = parseFloat(totalBalanceDesdeAPI);
               let label = "Balance Gs"; // Etiqueta por defecto o para balance cero

               // Determinar la etiqueta según el signo del balance
               if (!isNaN(balanceNum)) {
                 if (balanceNum > 0) {
                   label = "Debemos a Farmacia Gs"; // Saldo positivo (Debemos)
                 } else if (balanceNum < 0) {
                   label = "Farmacia nos debe Gs"; // Saldo negativo (Nos debe)
                 }
               }

               return (
                 <>
                   <Typography variant="h6" gutterBottom>{label}</Typography>
                   <Typography variant="body1">
                     {/* Formatear el total (formatCurrency ya usa el absoluto) */}
                     {formatCurrency(totalBalanceDesdeAPI, 'PYG')} Gs
                   </Typography>
                 </>
               );
             })()}
           </Grid>
           <Grid item xs={12} md={4}>
             {(() => {
               // Convertir el balance (string) a número
               const balanceNum = parseFloat(totalBalanceUSD);
               let label = "Balance $"; // Etiqueta por defecto o para balance cero

               // Determinar la etiqueta según el signo del balance
               if (!isNaN(balanceNum)) {
                 if (balanceNum > 0) {
                   label = "Debemos a Farmacia $"; // Saldo positivo (Debemos)
                 } else if (balanceNum < 0) {
                   label = "Farmacia nos debe $"; // Saldo negativo (Nos debe)
                 }
               }

               return (
                 <>
                   <Typography variant="h6" gutterBottom>{label}</Typography>
                   <Typography variant="body1">
                     {/* Formatear el total (formatCurrency ya usa el absoluto) */}
                     {formatCurrency(totalBalanceUSD, 'USD')} $
                   </Typography>
                 </>
               );
             })()}
           </Grid>
           <Grid item xs={12} md={4}>
             {(() => {
               // Convertir el balance (string) a número
               const balanceNum = parseFloat(totalBalanceBRL);
               let label = "Balance R$"; // Etiqueta por defecto o para balance cero

               // Determinar la etiqueta según el signo del balance
               if (!isNaN(balanceNum)) {
                 if (balanceNum > 0) {
                   label = "Debemos a Farmacia R$"; // Saldo positivo (Debemos)
                 } else if (balanceNum < 0) {
                   label = "Farmacia nos debe R$"; // Saldo negativo (Nos debe)
                 }
               }

               return (
                 <>
                   <Typography variant="h6" gutterBottom>{label}</Typography>
                   <Typography variant="body1">
                     {/* Formatear el total (formatCurrency ya usa el absoluto) */}
                     {formatCurrency(totalBalanceBRL, 'BRL')} R$
                   </Typography>
                 </>
               );
             })()}
           </Grid>
         </Grid>
      </Box>

      {/* Sección de Filtros */}
      <Box sx={{ mb: 2 }}>
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
      </Box>

      {/* Mostrar error si existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabla de Movimientos (usa datos de API) */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo Movimiento</TableCell>
              <TableCell>Concepto</TableCell>
              <TableCell align="center">Detalle</TableCell>
              <TableCell align="right">Entrada</TableCell>
              <TableCell align="right">Salida</TableCell>
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
                  <TableRow key={mov.id}>
                    <TableCell>{new Date(mov.fechaHora).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                    <TableCell>{mov.movimientoOrigenTipo || mov.tipoMovimiento}</TableCell>
                    <TableCell>{mov.concepto}</TableCell>
                    <TableCell align="center">
                      {/* Asumiendo que el tooltip usará un campo como 'detalleAdicional' o 'movimientoOrigenTipo/Id' */}
                      {(mov.detalleAdicional || mov.movimientoOrigenId) && (
                        <Tooltip title={mov.detalleAdicional || `Origen: ${mov.movimientoOrigenTipo} ID: ${mov.movimientoOrigenId}`} arrow>
                          <IconButton size="small">
                            <VisibilityIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {esEntrada ? formatCurrency(montoNum, mov.monedaCodigo) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {esSalida ? formatCurrency(montoNum, mov.monedaCodigo) : '-'}
                    </TableCell>
                    <TableCell>{getCurrencySymbol(mov.monedaCodigo)}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay movimientos que coincidan con los filtros.
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