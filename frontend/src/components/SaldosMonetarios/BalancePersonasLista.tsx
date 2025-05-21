import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Paper,
  TablePagination,
  Button,
  ButtonGroup,
  Grid,
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import {
  SaldoPersona,
  UsoDevolucion,
  obtenerPersonasConSaldo,
  obtenerMovimientosPersona
} from '../../services/usoDevolucionService';

// Interfaz extendida para asegurar que documento esté disponible si es necesario
interface SaldoPersonaExtendido extends SaldoPersona {
  documento?: string;
}

// Tipos para ordenamiento
type Order = 'asc' | 'desc';

// Formateador de moneda actualizado
const formatCurrency = (amount: number, currency: string) => {
  const absAmount = Math.abs(amount);

  if (currency === 'PYG' || currency === 'guaranies') {
    return new Intl.NumberFormat('es-PY', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(absAmount) + ' Gs';
  } else if (currency === 'USD' || currency === 'dolares') {
    return '$ ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(absAmount);
  } else if (currency === 'BRL' || currency === 'reales') {
    return 'R$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(absAmount);
  } else {
    return absAmount.toString();
  }
};

// Función de comparación robusta para ordenamiento
function descendingComparator(a: SaldoPersonaExtendido, b: SaldoPersonaExtendido): number {
  // Prioridad: Mayor deuda (más negativo) a menor deuda, luego mayor crédito (más positivo) a menor crédito
  // Se prioriza Guaraníes, luego Dólares, luego Reales

  // Comparar Guaraníes
  if (a.guaranies !== b.guaranies) return a.guaranies < b.guaranies ? 1 : -1;
  // Comparar Dólares si Guaraníes son iguales
  if (a.dolares !== b.dolares) return a.dolares < b.dolares ? 1 : -1;
  // Comparar Reales si Dólares son iguales
  if (a.reales !== b.reales) return a.reales < b.reales ? 1 : -1;
  
  // Si todos los saldos son iguales, mantener orden original (o comparar por nombre)
  const nameA = a.nombre_completo || a.persona_nombre || '';
  const nameB = b.nombre_completo || b.persona_nombre || '';
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;

  return 0;
}

function getComparator(order: Order): (a: SaldoPersonaExtendido, b: SaldoPersonaExtendido) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b)
    : (a, b) => -descendingComparator(a, b);
}

// Función de ordenamiento estable
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number): T[] {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1]; // Mantener orden original si son iguales
  });
  return stabilizedThis.map((el) => el[0]);
}

const BalancePersonasLista: React.FC = () => {
  const [personas, setPersonas] = useState<SaldoPersonaExtendido[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [personaSeleccionadaId, setPersonaSeleccionadaId] = useState<number | null>(null);

  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estados para ordenamiento
  const [order, setOrder] = useState<Order>('desc');

  // Nuevos estados para movimientos y gráfico
  const [movimientos, setMovimientos] = useState<UsoDevolucion[]>([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState<boolean>(false);
  const [errorMovimientos, setErrorMovimientos] = useState<string | null>(null);
  const [mostrarGrafico, setMostrarGrafico] = useState<boolean>(false);
  const [personaSeleccionadaNombre, setPersonaSeleccionadaNombre] = useState<string>('');

  useEffect(() => {
    cargarPersonasConSaldo();
  }, []);

  useEffect(() => {
    const cargarMovimientos = async () => {
      if (personaSeleccionadaId !== null) {
        setCargandoMovimientos(true);
        setErrorMovimientos(null);
        setMostrarGrafico(false);
        try {
          const data = await obtenerMovimientosPersona(personaSeleccionadaId);
          setMovimientos(data);
          const personaSel = personas.find(p => p.persona_id === personaSeleccionadaId);
          setPersonaSeleccionadaNombre(personaSel?.nombre_completo || personaSel?.persona_nombre || `ID: ${personaSeleccionadaId}`);
        } catch (err) {
          setErrorMovimientos('Error al cargar los movimientos de la persona');
          console.error(err);
          setMovimientos([]);
        } finally {
          setCargandoMovimientos(false);
        }
      } else {
        setMovimientos([]);
        setPersonaSeleccionadaNombre('');
        setMostrarGrafico(false);
      }
    };

    cargarMovimientos();
  }, [personaSeleccionadaId, personas]);

  const cargarPersonasConSaldo = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerPersonasConSaldo();
      setPersonas(data);
      console.log("Personas cargadas:", data.length);
    } catch (err) {
      setError('Error al cargar las personas con saldo');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Memoizar las personas filtradas para usar en la tabla y en el count de paginación
  const personasFiltradas = useMemo(() => {
    if (!busqueda) {
      return personas;
    }
    const terminoBusqueda = busqueda.toLowerCase().trim();
    return personas.filter(persona => {
      const nombre = (persona.nombre_completo || persona.persona_nombre || '').toLowerCase();
      const documento = (persona.documento || '').toLowerCase();
      return nombre.includes(terminoBusqueda) || documento.includes(terminoBusqueda);
    });
  }, [personas, busqueda]);

  // Memoizar las personas visibles (filtradas, ordenadas y paginadas)
  const personasVisibles = useMemo(() => {
    // Ordenar las personas ya filtradas
    const personasOrdenadas = stableSort(personasFiltradas, getComparator(order));
    // Paginar
    return personasOrdenadas.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [personasFiltradas, order, page, rowsPerPage]);

  const handleBusquedaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(event.target.value);
    setPage(0); // Resetear a la primera página al buscar
  };

  const handleSeleccionarPersona = (persona: SaldoPersonaExtendido) => {
    setPersonaSeleccionadaId(prevId => prevId === persona.persona_id ? null : persona.persona_id);
    console.log("Persona seleccionada ID:", persona.persona_id);
  };

  // Manejadores de paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Resetear a la primera página al cambiar filas por página
  };

  // Manejador para cambiar orden
  const handleSort = (newOrder: Order) => {
    setOrder(newOrder);
    setPage(0); // Resetear a la primera página al cambiar orden
  };

  // Handler para el botón del gráfico
  const handleToggleGrafico = () => {
    setMostrarGrafico(prev => !prev);
  };

  // Formatear fecha (ejemplo simple)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("Error formateando fecha:", dateString, e);
      return dateString; // Devolver original si falla
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      {/* SECCIÓN 1: BÚSQUEDA Y ORDENAMIENTO */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          display: 'block', 
          width: '100%', 
          mb: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Controles Lista Principal
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          {/* Buscador */}
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre o documento..."
              variant="outlined"
              value={busqueda}
              onChange={handleBusquedaChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                onClick: (e) => {
                  const input = e.currentTarget.querySelector('input');
                  input?.select();
                }
              }}
            />
          </Grid>
          
          {/* Botones de Ordenamiento */}
          <Grid item xs={12} sm={5}>
            <ButtonGroup variant="outlined" fullWidth>
              <Button 
                onClick={() => handleSort('desc')} 
                variant={order === 'desc' ? 'contained' : 'outlined'}
                startIcon={<ArrowDownwardIcon />}
              >
                Mayor a Menor
              </Button>
              <Button 
                onClick={() => handleSort('asc')} 
                variant={order === 'asc' ? 'contained' : 'outlined'}
                startIcon={<ArrowUpwardIcon />}
              >
                Menor a Mayor
              </Button>
            </ButtonGroup>
          </Grid>

          {/* Botón para Gráfico */}
          <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
            <IconButton
              onClick={handleToggleGrafico}
              disabled={personaSeleccionadaId === null || cargandoMovimientos} // Deshabilitado si no hay persona o cargando
              color="primary"
              title={mostrarGrafico ? "Ocultar Gráfico" : "Mostrar Gráfico Histórico"}
            >
              <ShowChartIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN 2: TABLA */}
      <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>Nombre</TableCell>
                <TableCell sx={{ color: 'white' }}>Documento</TableCell>
                <TableCell sx={{ color: 'white', textAlign: 'right' }}>Le debemos</TableCell>
                <TableCell sx={{ color: 'white', textAlign: 'right' }}>Nos debe</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando && (
                <TableRow>
                  <TableCell colSpan={4} align="center"><CircularProgress size={20} /></TableCell>
                </TableRow>
              )}

              {error && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: 'error.main' }}>{error}</TableCell>
                </TableRow>
              )}

              {!cargando && !error && personasVisibles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {busqueda ? 'No hay personas que coincidan con la búsqueda' : 'No hay personas con saldo pendiente'}
                  </TableCell>
                </TableRow>
              )}

              {!cargando && !error && personasVisibles.map((persona) => (
                <TableRow
                  key={persona.id || persona.persona_id}
                  onClick={() => handleSeleccionarPersona(persona)}
                  hover
                  selected={personaSeleccionadaId === persona.persona_id}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: personaSeleccionadaId === persona.persona_id ? 'action.selected' : 'inherit',
                    '&:hover': { bgcolor: 'action.hover' },
                    ...(personaSeleccionadaId === persona.persona_id && {
                        borderLeft: `4px solid primary.main` 
                    })
                  }}
                >
                  <TableCell>{persona.nombre_completo || persona.persona_nombre || `ID: ${persona.persona_id}`}</TableCell>
                  <TableCell>{persona.documento || '---'}</TableCell>
                  <TableCell align="right">
                    {/* Saldo positivo: Le debemos */}
                    {persona.guaranies > 0 && (
                      <Typography component="div" variant="body2">
                        {formatCurrency(persona.guaranies, 'guaranies')}
                      </Typography>
                    )}
                    {persona.dolares > 0 && (
                      <Typography component="div" variant="body2">
                        {formatCurrency(persona.dolares, 'dolares')}
                      </Typography>
                    )}
                    {persona.reales > 0 && (
                      <Typography component="div" variant="body2">
                        {formatCurrency(persona.reales, 'reales')}
                      </Typography>
                    )}
                    {/* Si no hay saldos positivos */}
                    {persona.guaranies <= 0 && persona.dolares <= 0 && persona.reales <= 0 && '-'}
                  </TableCell>
                  <TableCell align="right">
                    {/* Saldo negativo: Nos debe */}
                    {persona.guaranies < 0 && (
                      <Typography component="div" variant="body2" color="error">
                        {formatCurrency(Math.abs(persona.guaranies), 'guaranies')}
                      </Typography>
                    )}
                    {persona.dolares < 0 && (
                      <Typography component="div" variant="body2" color="error">
                        {formatCurrency(Math.abs(persona.dolares), 'dolares')}
                      </Typography>
                    )}
                    {persona.reales < 0 && (
                      <Typography component="div" variant="body2" color="error">
                        {formatCurrency(Math.abs(persona.reales), 'reales')}
                      </Typography>
                    )}
                    {/* Si no hay saldos negativos */}
                    {persona.guaranies >= 0 && persona.dolares >= 0 && persona.reales >= 0 && '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* SECCIÓN 3: PAGINACIÓN */}
        <Divider />
        <Box sx={{ p: 1, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'flex-end' }}>
          <TablePagination
            component="div"
            count={personasFiltradas.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
          />
        </Box>
      </Paper>

      {/* SECCIÓN 3: DETALLES DE PERSONA SELECCIONADA (MOVIMIENTOS Y GRÁFICO) */}
      {personaSeleccionadaId !== null && (
        <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {mostrarGrafico ? `Gráfico Histórico: ${personaSeleccionadaNombre}` : `Movimientos: ${personaSeleccionadaNombre}`}
          </Typography>

          {cargandoMovimientos && <CircularProgress />}
          
          {errorMovimientos && <Typography color="error">{errorMovimientos}</Typography>}

          {!cargandoMovimientos && !errorMovimientos && (
            <>
              {mostrarGrafico ? (
                <Box sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed grey' }}>
                  <Typography variant="h5" color="textSecondary">Componente de Gráfico Aquí</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper}>
                   <Table size="small">
                      <TableHead sx={{ bgcolor: 'secondary.main' }}>
                        <TableRow>
                          <TableCell sx={{ color: 'white' }}>Fecha</TableCell>
                          <TableCell sx={{ color: 'white' }}>Tipo</TableCell>
                          <TableCell sx={{ color: 'white' }}>Motivo</TableCell>
                          <TableCell sx={{ color: 'white', textAlign: 'right' }}>Guaraníes</TableCell>
                          <TableCell sx={{ color: 'white', textAlign: 'right' }}>Dólares</TableCell>
                          <TableCell sx={{ color: 'white', textAlign: 'right' }}>Reales</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {movimientos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No hay movimientos para esta persona.</TableCell>
                            </TableRow>
                        ) : (
                            movimientos.map((mov) => (
                            <TableRow key={mov.id}>
                                <TableCell>{formatDate(mov.fecha_creacion)}</TableCell>
                                <TableCell>{mov.tipo}</TableCell>
                                <TableCell>{mov.motivo}</TableCell>
                                <TableCell align="right">{mov.guaranies !== 0 ? formatCurrency(mov.guaranies, 'guaranies') : '-'}</TableCell>
                                <TableCell align="right">{mov.dolares !== 0 ? formatCurrency(mov.dolares, 'dolares') : '-'}</TableCell>
                                <TableCell align="right">{mov.reales !== 0 ? formatCurrency(mov.reales, 'reales') : '-'}</TableCell>
                            </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default BalancePersonasLista; 