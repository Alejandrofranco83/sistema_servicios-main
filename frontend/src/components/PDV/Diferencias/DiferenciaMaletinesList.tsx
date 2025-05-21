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
import { formatearMontoConSeparadores } from '../../Cajas/helpers'; // Ajusta la ruta si es necesario
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
// --- Importar Interfaces ---
import {
  ComparacionMaletin,
  MaletinComparacionData, // Podría no usarse si el backend devuelve plano
  CajaInfoComparacion,
  SaldoMoneda
} from '../../../interfaces/diferencias'; // Ajusta la ruta si es necesario

// Definir Props
interface DiferenciaMaletinesListProps {
  propGlobalCajaFilter?: string; // Prop opcional recibida
}

const DiferenciaMaletinesList: React.FC<DiferenciaMaletinesListProps> = ({ propGlobalCajaFilter }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [datosComparaciones, setDatosComparaciones] = useState<ComparacionMaletin[]>([]);
  const [datosFiltrados, setDatosFiltrados] = useState<ComparacionMaletin[]>([]);

  // --- Estados de Filtro ---
  const [filtroFechaCierre, setFiltroFechaCierre] = useState<string>('');
  const [filtroMaletin, setFiltroMaletin] = useState<string>('');
  const [filtroCajaNro, setFiltroCajaNro] = useState<string>('');
  const [filtroDiferencia, setFiltroDiferencia] = useState<'todos' | 'con' | 'sin'>('todos');

  // --- Estado de Expansión ---
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // --- Estados de Paginación ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- Fetching de Datos --- 
  useEffect(() => {
    const fetchDiferencias = async () => {
      setLoading(true);
      setError(null);
      try {
        // Llamar al endpoint real y especificar el tipo de respuesta esperado
        const response = await axios.get<{ comparaciones: ComparacionMaletin[] }>(
          `${process.env.REACT_APP_API_URL}/diferencias/maletines/comparaciones`
        );

        // Extraer el array de la propiedad 'comparaciones'
        let comparacionesArray = response.data.comparaciones;

        // Validar que sea un array
        if (!Array.isArray(comparacionesArray)) {
          // Usar comillas dobles o template literals para el string
          console.error("La propiedad 'comparaciones' en la respuesta no es un array:", response.data);
          // O usar template literals:
          // console.error(`La propiedad 'comparaciones' en la respuesta no es un array:`, response.data);
          comparacionesArray = []; // Usar array vacío para evitar error en las siguientes operaciones
        }

        // Ordenar el array
        comparacionesArray.sort((a, b) => {
          // Asegurarse de que las fechas existen antes de parsear
          const dateA = a.cajaAnterior.fechaCierre ? parseISO(a.cajaAnterior.fechaCierre).getTime() : 0;
          const dateB = b.cajaAnterior.fechaCierre ? parseISO(b.cajaAnterior.fechaCierre).getTime() : 0;
          return dateB - dateA; // Descendente
        });

        // Establecer el estado con el array procesado
        setDatosComparaciones(comparacionesArray);

      } catch (err) {
        console.error("Error fetching diferencias maletines:", err);
        // Mostrar un error más específico si es posible
        if (axios.isAxiosError(err) && err.response?.status === 401) {
             setError("No autorizado. Por favor, inicie sesión de nuevo.");
        } else {
             setError("Error al cargar las diferencias de maletines desde el servidor.");
        }
        setDatosComparaciones([]); // Limpiar datos en caso de error
      } finally {
        setLoading(false);
      }
    };

    fetchDiferencias();
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

    // Filtro Fecha Cierre (comparar solo la parte de la fecha YYYY-MM-DD)
    if (filtroFechaCierre) {
       try {
         const fechaFiltroObj = parseISO(filtroFechaCierre); // Asegura que es una fecha válida
         const fechaFiltroStr = format(fechaFiltroObj, 'yyyy-MM-dd');
         filtered = filtered.filter(comp =>
           comp.cajaAnterior.fechaCierre && format(parseISO(comp.cajaAnterior.fechaCierre), 'yyyy-MM-dd') === fechaFiltroStr
         );
       } catch (e) {
         console.warn("Fecha inválida en filtro");
       }
    }

    // Filtro Maletín
    if (filtroMaletin) {
      filtered = filtered.filter(comp =>
        comp.cajaAnterior.maletinId?.toString().includes(filtroMaletin) // Usar cajaAnterior como referencia
      );
    }

    // Filtro Caja Nro (buscar en anterior o siguiente)
    if (filtroCajaNro) {
      const cajaNro = parseInt(filtroCajaNro, 10);
      if (!isNaN(cajaNro)) {
        filtered = filtered.filter(comp =>
          comp.cajaAnterior.cajaEnteroId === cajaNro || comp.cajaSiguiente.cajaEnteroId === cajaNro
        );
      }
    }

    // Filtro Diferencia
    if (filtroDiferencia !== 'todos') {
      const conDif = filtroDiferencia === 'con';
      filtered = filtered.filter(comp => comp.tieneDiferencia === conDif);
    }

    setDatosFiltrados(filtered);
    setPage(0); // Resetear a la primera página al aplicar filtros
  }, [datosComparaciones, filtroFechaCierre, filtroMaletin, filtroCajaNro, filtroDiferencia]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // --- Manejadores de Cambio de Filtro ---
  const handleFechaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroFechaCierre(event.target.value);
  };

  const handleMaletinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroMaletin(event.target.value);
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
    setPage(0); // Volver a la primera página al cambiar filas por página
  };

  // --- Renderizado ---
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Diferencia en Maletines
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
            label="Maletín ID"
            value={filtroMaletin}
            onChange={handleMaletinChange}
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
            <Table stickyHeader size="small" aria-label="tabla-diferencias-maletines">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha Cierre (Ant)</TableCell>
                  <TableCell>Maletín</TableCell>
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

                      return (
                        <React.Fragment key={rowId}>
                          <TableRow
                            hover
                            onClick={() => handleRowClick(rowId)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: comp.tieneDiferencia ? 'rgba(255, 0, 0, 0.05)' : 'inherit',
                              '&:hover': { 
                                  backgroundColor: comp.tieneDiferencia ? 'rgba(255, 0, 0, 0.1)' : 'action.hover',
                              }
                            }}
                          >
                            <TableCell>
                              {comp.cajaAnterior.fechaCierre
                                ? format(parseISO(comp.cajaAnterior.fechaCierre), 'dd/MM/yyyy HH:mm', { locale: es })
                                : '-'}
                            </TableCell>
                            <TableCell>{comp.cajaAnterior.maletinId}</TableCell>
                            <TableCell align="right">{comp.cajaAnterior.cajaEnteroId}</TableCell>
                            <TableCell align="right">{comp.cajaSiguiente.cajaEnteroId}</TableCell>
                            <TableCell align="center">
                              {comp.tieneDiferencia ? (
                                <Chip label="Con Diferencia" color="error" size="small" variant="outlined" />
                              ) : (
                                <Chip label="Sin Diferencia" color="success" size="small" variant="outlined"/>
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 1, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
                                  <Typography variant="h6" gutterBottom component="div">
                                    Detalle Comparación (Caja {comp.cajaAnterior.cajaEnteroId} vs {comp.cajaSiguiente.cajaEnteroId})
                                  </Typography>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Cierre Caja {comp.cajaAnterior.cajaEnteroId}</Typography>
                                       <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5, mb: 1 }}>
                                          <Table size="small" aria-label="detalle-cierre">
                                              <TableBody>
                                                  <TableRow>
                                                      <TableCell sx={{py: 0.5, px: 1}}>PYG:</TableCell>
                                                      <TableCell align="right" sx={{py: 0.5, px: 1}}>{formatearMontoConSeparadores(comp.cajaAnterior.saldoFinal?.total.PYG || 0)} Gs</TableCell>
                                                  </TableRow>
                                                  <TableRow>
                                                      <TableCell sx={{py: 0.5, px: 1}}>USD:</TableCell>
                                                      <TableCell align="right" sx={{py: 0.5, px: 1}}>$ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(comp.cajaAnterior.saldoFinal?.total.USD || 0)}</TableCell>
                                                  </TableRow>
                                                  <TableRow>
                                                      <TableCell sx={{py: 0.5, px: 1, borderBottom: 'none'}}>BRL:</TableCell>
                                                      <TableCell align="right" sx={{py: 0.5, px: 1, borderBottom: 'none'}}>R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(comp.cajaAnterior.saldoFinal?.total.BRL || 0)}</TableCell>
                                                  </TableRow>
                                              </TableBody>
                                          </Table>
                                      </TableContainer>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Apertura Caja {comp.cajaSiguiente.cajaEnteroId}</Typography>
                                      <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5, mb: 1 }}>
                                          <Table size="small" aria-label="detalle-apertura">
                                              <TableBody>
                                                  <TableRow>
                                                      <TableCell sx={{py: 0.5, px: 1}}>PYG:</TableCell>
                                                      <TableCell align="right" sx={{py: 0.5, px: 1}}>{formatearMontoConSeparadores(comp.cajaSiguiente.saldoInicial?.total.PYG || 0)} Gs</TableCell>
                                                  </TableRow>
                                                  <TableRow>
                                                      <TableCell sx={{py: 0.5, px: 1}}>USD:</TableCell>
                                                      <TableCell align="right" sx={{py: 0.5, px: 1}}>$ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(comp.cajaSiguiente.saldoInicial?.total.USD || 0)}</TableCell>
                                                  </TableRow>
                                                  <TableRow>
                                                      <TableCell sx={{py: 0.5, px: 1, borderBottom: 'none'}}>BRL:</TableCell>
                                                      <TableCell align="right" sx={{py: 0.5, px: 1, borderBottom: 'none'}}>R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(comp.cajaSiguiente.saldoInicial?.total.BRL || 0)}</TableCell>
                                                  </TableRow>
                                              </TableBody>
                                          </Table>
                                      </TableContainer>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Diferencia</Typography>
                                      <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5, mb: 1 }}>
                                          <Table size="small" aria-label="detalle-diferencia">
                                              <TableBody>
                                                  <TableRow sx={{backgroundColor: comp.diferencias.PYG !== 0 ? 'rgba(255, 0, 0, 0.05)' : 'inherit'}}>
                                                      <TableCell sx={{py: 0.5, px: 1}}>PYG:</TableCell>
                                                      <TableCell align="right" sx={{py: 0.5, px: 1, fontWeight: comp.diferencias.PYG !== 0 ? 'bold': 'normal', color: comp.diferencias.PYG !== 0 ? 'error.main': 'inherit'}}>{formatearMontoConSeparadores(comp.diferencias.PYG)} Gs</TableCell>
                                                  </TableRow>
                                                  <TableRow sx={{backgroundColor: comp.diferencias.USD !== 0 ? 'rgba(255, 0, 0, 0.05)' : 'inherit'}}>
                                                      <TableCell sx={{py: 0.5, px: 1}}>USD:</TableCell>
                                                      <TableCell align="right" sx={{py: 0.5, px: 1, fontWeight: comp.diferencias.USD !== 0 ? 'bold': 'normal', color: comp.diferencias.USD !== 0 ? 'error.main': 'inherit'}}>$ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(comp.diferencias.USD)}</TableCell>
                                                  </TableRow>
                                                  <TableRow sx={{backgroundColor: comp.diferencias.BRL !== 0 ? 'rgba(255, 0, 0, 0.05)' : 'inherit'}}>
                                                      <TableCell sx={{py: 0.5, px: 1, borderBottom: 'none'}}>BRL:</TableCell>
                                                      <TableCell align="right" sx={{py: 0.5, px: 1, borderBottom: 'none', fontWeight: comp.diferencias.BRL !== 0 ? 'bold': 'normal', color: comp.diferencias.BRL !== 0 ? 'error.main': 'inherit'}}>R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(comp.diferencias.BRL)}</TableCell>
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
            rowsPerPageOptions={[5, 10, 25]} // Opciones de filas por página
            component="div"
            count={datosFiltrados.length} // Total de filas filtradas
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

export default DiferenciaMaletinesList; 