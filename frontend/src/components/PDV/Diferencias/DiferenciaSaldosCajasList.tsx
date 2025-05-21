import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  Chip,
  Collapse,
  TablePagination
} from '@mui/material';
import axios from 'axios';
import { formatearMontoConSeparadores } from '../../Cajas/helpers';
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import {
  ComparacionSaldosServicios,
  SaldoServicio,
  CajaInfoServicios
} from '../../../interfaces/diferencias';

// Helper para calcular diferencias por servicio
const calcularDiferenciasPorServicio = (anterior: SaldoServicio[], siguiente: SaldoServicio[]): { [key: string]: number } => {
  const diferencias: { [key: string]: number } = {};
  const mapaAnterior = new Map(anterior.map(s => [s.servicio, Number(s.monto) || 0]));
  const mapaSiguiente = new Map(siguiente.map(s => [s.servicio, Number(s.monto) || 0]));

  // Corrección para compatibilidad: Crear array y luego Set
  const keysAnterior = Array.from(mapaAnterior.keys());
  const keysSiguiente = Array.from(mapaSiguiente.keys());
  const todosServicios = new Set([...keysAnterior, ...keysSiguiente]);

  todosServicios.forEach(servicio => {
    const montoAnt = mapaAnterior.get(servicio) || 0;
    const montoSgte = mapaSiguiente.get(servicio) || 0;
    diferencias[servicio] = montoSgte - montoAnt;
  });

  return diferencias;
};

// Helper para obtener la lista unificada de servicios
const getServiciosUnificados = (anterior: SaldoServicio[], siguiente: SaldoServicio[]): string[] => {
  // Corrección para compatibilidad
  const keysAnterior = anterior.map(s => s.servicio);
  const keysSiguiente = siguiente.map(s => s.servicio);
  const todosServicios = new Set([...keysAnterior, ...keysSiguiente]);
  return Array.from(todosServicios).sort(); // Ordenar alfabéticamente
};

// Definir Props
interface DiferenciaSaldosCajasListProps {
  propGlobalCajaFilter?: string;
}

const DiferenciaSaldosCajasList: React.FC<DiferenciaSaldosCajasListProps> = ({ propGlobalCajaFilter }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [datosComparaciones, setDatosComparaciones] = useState<ComparacionSaldosServicios[]>([]);
  const [datosFiltrados, setDatosFiltrados] = useState<ComparacionSaldosServicios[]>([]);

  // --- Estados de Filtro ---
  const [filtroFechaCierre, setFiltroFechaCierre] = useState<string>('');
  const [filtroSucursal, setFiltroSucursal] = useState<string>('');
  const [filtroCajaNro, setFiltroCajaNro] = useState<string>('');
  const [filtroDiferencia, setFiltroDiferencia] = useState<'todos' | 'con' | 'sin'>('todos');

  // --- Estado de Expansión ---
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // --- Estados de Paginación ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- Fetching de Datos ---
  useEffect(() => {
    const fetchDiferenciasServicios = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<{ comparaciones: ComparacionSaldosServicios[] }>( // Espera objeto con 'comparaciones'
          `${process.env.REACT_APP_API_URL}/diferencias/saldos-servicios/comparaciones`
        );

        let comparacionesArray = response.data.comparaciones;

        if (!Array.isArray(comparacionesArray)) {
          console.error("La propiedad 'comparaciones' en la respuesta no es un array:", response.data);
          comparacionesArray = [];
        }
        
        // Recalcular tieneDiferencia basado en diferencias por item
        comparacionesArray = comparacionesArray.map(comp => {
            const diffs = calcularDiferenciasPorServicio(comp.cajaAnterior.saldosServicios, comp.cajaSiguiente.saldosServicios);
            const tieneDif = Object.values(diffs).some(d => d !== 0);
            return { ...comp, tieneDiferencia: tieneDif };
        });

        setDatosComparaciones(comparacionesArray);
      } catch (err) {
        console.error("Error fetching diferencias saldos servicios:", err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError("No autorizado. Por favor, inicie sesión de nuevo.");
        } else {
          setError("Error al cargar las diferencias de saldos de servicios.");
        }
        setDatosComparaciones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiferenciasServicios();
  }, []);

  // useEffect para reaccionar al filtro global
  useEffect(() => {
    if (propGlobalCajaFilter !== undefined) {
      setFiltroCajaNro(propGlobalCajaFilter);
    }
  }, [propGlobalCajaFilter]);

  // --- Lógica de Filtrado ---
  const applyFilters = useCallback(() => {
    let filtered = [...datosComparaciones];

    if (filtroFechaCierre) {
      try {
        const fechaFiltroObj = parseISO(filtroFechaCierre);
        const fechaFiltroStr = format(fechaFiltroObj, 'yyyy-MM-dd');
        filtered = filtered.filter(comp =>
          comp.cajaAnterior.fechaCierre && format(parseISO(comp.cajaAnterior.fechaCierre), 'yyyy-MM-dd') === fechaFiltroStr
        );
      } catch (e) {
        console.warn("Fecha inválida en filtro");
      }
    }

    if (filtroSucursal) {
      const sucursalLower = filtroSucursal.toLowerCase();
      filtered = filtered.filter(comp =>
        comp.cajaAnterior.sucursalNombre?.toLowerCase().includes(sucursalLower)
      );
    }

    if (filtroCajaNro) {
      const cajaNro = parseInt(filtroCajaNro, 10);
      if (!isNaN(cajaNro)) {
        filtered = filtered.filter(comp =>
          comp.cajaAnterior.cajaEnteroId === cajaNro || comp.cajaSiguiente.cajaEnteroId === cajaNro
        );
      }
    }

    if (filtroDiferencia !== 'todos') {
      const conDif = filtroDiferencia === 'con';
      // Usar el tieneDiferencia recalculado
      filtered = filtered.filter(comp => comp.tieneDiferencia === conDif);
    }

    setDatosFiltrados(filtered);
    setPage(0);
  }, [datosComparaciones, filtroFechaCierre, filtroSucursal, filtroCajaNro, filtroDiferencia]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // --- Manejadores de Cambio de Filtro ---
  const handleFechaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroFechaCierre(event.target.value);
  };

  const handleSucursalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroSucursal(event.target.value);
  };

  const handleCajaNroChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroCajaNro(event.target.value);
  };

  const handleDiferenciaChange = (event: SelectChangeEvent<'todos' | 'con' | 'sin'>) => {
    setFiltroDiferencia(event.target.value as 'todos' | 'con' | 'sin');
  };

  // --- Manejador de Clic en Fila ---
  const handleRowClick = (rowId: string) => {
    setExpandedRowId(prevId => (prevId === rowId ? null : rowId));
  };

  // --- Manejadores de Paginación ---
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // --- Renderizado ---
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Diferencia Saldos entre Cajas (Servicios)
      </Typography>

      {/* Sección de Filtros */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Fecha Cierre (YYYY-MM-DD)"
            type="date"
            value={filtroFechaCierre}
            onChange={handleFechaChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Sucursal"
            value={filtroSucursal}
            onChange={handleSucursalChange}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Caja Nro (Ant/Sgte)"
            type="number"
            value={filtroCajaNro}
            onChange={handleCajaNroChange}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Estado Diferencia</InputLabel>
            <Select
              value={filtroDiferencia}
              label="Estado Diferencia"
              onChange={handleDiferenciaChange}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="con">Con Diferencia</MenuItem>
              <MenuItem value="sin">Sin Diferencia</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <>
          <TableContainer>
            <Table stickyHeader size="small" aria-label="tabla-diferencias-saldos-servicios">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha Cierre (Ant)</TableCell>
                  <TableCell>Sucursal</TableCell>
                  <TableCell align="right">Cierre Caja Nro</TableCell>
                  <TableCell align="right">Apertura Caja Nro</TableCell>
                  <TableCell align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosFiltrados.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No se encontraron resultados con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  datosFiltrados
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((comp) => {
                      const rowId = `${comp.cajaAnterior.id}-${comp.cajaSiguiente.id}`;
                      const isExpanded = expandedRowId === rowId;
                      // Usar el tieneDiferencia pre-calculado en useEffect
                      const tieneDiferencia = comp.tieneDiferencia; 

                      // Calcular diferencias por servicio para esta fila
                      const diferenciasServicio = calcularDiferenciasPorServicio(
                        comp.cajaAnterior.saldosServicios,
                        comp.cajaSiguiente.saldosServicios
                      );
                      // Obtener lista unificada de servicios para mostrar en ambas tablas
                      const serviciosUnificados = getServiciosUnificados(
                        comp.cajaAnterior.saldosServicios,
                        comp.cajaSiguiente.saldosServicios
                      );
                      // Mapas para acceso rápido a montos
                      const mapaAnterior = new Map(comp.cajaAnterior.saldosServicios.map(s => [s.servicio, Number(s.monto) || 0]));
                      const mapaSiguiente = new Map(comp.cajaSiguiente.saldosServicios.map(s => [s.servicio, Number(s.monto) || 0]));

                      return (
                        <React.Fragment key={rowId}>
                          <TableRow
                            hover
                            onClick={() => handleRowClick(rowId)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: tieneDiferencia ? 'rgba(255, 0, 0, 0.05)' : 'inherit',
                              '&:hover': {
                                backgroundColor: tieneDiferencia ? 'rgba(255, 0, 0, 0.1)' : 'action.hover',
                              }
                            }}
                          >
                            <TableCell>
                              {comp.cajaAnterior.fechaCierre
                                ? format(parseISO(comp.cajaAnterior.fechaCierre), 'dd/MM/yyyy HH:mm', { locale: es })
                                : '-'}
                            </TableCell>
                            <TableCell>{comp.cajaAnterior.sucursalNombre || '-'}</TableCell>
                            <TableCell align="right">{comp.cajaAnterior.cajaEnteroId}</TableCell>
                            <TableCell align="right">{comp.cajaSiguiente.cajaEnteroId}</TableCell>
                            <TableCell align="center">
                              {tieneDiferencia ? (
                                <Chip label="Con Diferencia" color="error" size="small" variant="outlined" />
                              ) : (
                                <Chip label="Sin Diferencia" color="success" size="small" variant="outlined" />
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 1, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
                                  <Typography variant="h6" gutterBottom component="div">
                                    Detalle Saldos Servicios (Suc: {comp.cajaAnterior.sucursalNombre || 'N/A'} - Cajas {comp.cajaAnterior.cajaEnteroId} vs {comp.cajaSiguiente.cajaEnteroId})
                                  </Typography>
                                  {/* Usar un solo Grid container para las dos tablas */}
                                  <Grid container spacing={2}> 
                                    {/* Tabla Unificada */} 
                                    <Grid item xs={12}> 
                                      <TableContainer component={Paper} variant="outlined">
                                        <Table size="small" aria-label="detalle-comparacion-servicios">
                                          <TableHead>
                                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                              <TableCell sx={{ py: 0.5, px: 1, fontWeight: 'bold' }}>Servicio</TableCell>
                                              <TableCell align="right" sx={{ py: 0.5, px: 1, fontWeight: 'bold' }}>Monto Cierre (Ant)</TableCell>
                                              <TableCell align="right" sx={{ py: 0.5, px: 1, fontWeight: 'bold' }}>Monto Apertura (Sgte)</TableCell>
                                              <TableCell align="right" sx={{ py: 0.5, px: 1, fontWeight: 'bold' }}>Diferencia</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {serviciosUnificados.length > 0 ? (
                                              serviciosUnificados.map((servicio, idx) => {
                                                const montoAnt = mapaAnterior.get(servicio) || 0;
                                                const montoSgte = mapaSiguiente.get(servicio) || 0;
                                                const diferencia = diferenciasServicio[servicio] || 0;
                                                const hayDifServicio = diferencia !== 0;

                                                return (
                                                  <TableRow 
                                                    key={`comp-${idx}`}
                                                    sx={{ backgroundColor: hayDifServicio ? 'rgba(255, 0, 0, 0.05)' : 'inherit' }}
                                                  >
                                                    <TableCell sx={{ py: 0.5, px: 1 }}>{servicio}</TableCell>
                                                    <TableCell align="right" sx={{ py: 0.5, px: 1 }}>{formatearMontoConSeparadores(montoAnt)}</TableCell>
                                                    <TableCell align="right" sx={{ py: 0.5, px: 1 }}>{formatearMontoConSeparadores(montoSgte)}</TableCell>
                                                    <TableCell 
                                                      align="right" 
                                                      sx={{ 
                                                        py: 0.5, 
                                                        px: 1, 
                                                        fontWeight: hayDifServicio ? 'bold' : 'normal', 
                                                        color: hayDifServicio ? 'error.main' : 'inherit' 
                                                      }}
                                                    >
                                                      {formatearMontoConSeparadores(diferencia)}
                                                    </TableCell>
                                                  </TableRow>
                                                );
                                              })
                                            ) : (
                                              <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 1 }}>Sin datos de servicios para comparar</TableCell>
                                              </TableRow>
                                            )}
                                            {/* Fila Totales */} 
                                             <TableRow sx={{ 
                                                backgroundColor: '#424242',
                                                color: 'white'
                                              }}>
                                              <TableCell sx={{ py: 0.5, px: 1, fontWeight: 'bold', borderBottom: 'none', color: 'inherit' }}>Total General</TableCell>
                                              <TableCell align="right" sx={{ py: 0.5, px: 1, fontWeight: 'bold', borderBottom: 'none', color: 'inherit' }}>
                                                {formatearMontoConSeparadores(comp.cajaAnterior.saldosServicios.reduce((sum, s) => sum + (Number(s.monto) || 0), 0))}
                                              </TableCell>
                                              <TableCell align="right" sx={{ py: 0.5, px: 1, fontWeight: 'bold', borderBottom: 'none', color: 'inherit' }}>
                                                {formatearMontoConSeparadores(comp.cajaSiguiente.saldosServicios.reduce((sum, s) => sum + (Number(s.monto) || 0), 0))}
                                              </TableCell>
                                               <TableCell 
                                                 align="right" 
                                                 sx={{ 
                                                   py: 0.5, 
                                                   px: 1, 
                                                   fontWeight: 'bold', 
                                                   borderBottom: 'none',
                                                   color: tieneDiferencia ? 'error.light' : 'success.light' 
                                                 }}
                                                >
                                                 {formatearMontoConSeparadores(Object.values(diferenciasServicio).reduce((acc, cur) => acc + cur, 0))}
                                              </TableCell>
                                            </TableRow>
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={datosFiltrados.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
          />
        </>
      )}
    </Paper>
  );
};

export default DiferenciaSaldosCajasList;