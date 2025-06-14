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
  TablePagination,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { formatearMontoConSeparadores } from '../../Cajas/helpers';
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import {
  ComparacionEnCaja,
  ComparacionDetalladaCaja,
  SaldosComparados,
  DiferenciaServicio,
  ComparacionEnCajaExtendido
} from '../../../interfaces/diferencias';
import {
  calcularDetalleDiferencias,
  ResultadoCalculoDetalle,
} from './calculosDetalleCaja';

// Componente auxiliar para mostrar saldos comparados
interface SaldosComparadosDisplayProps {
  titulo: string;
  datos: SaldosComparados;
  esMonedaExtranjera?: boolean;
}

const SaldosComparadosDisplay: React.FC<SaldosComparadosDisplayProps> = ({ titulo, datos, esMonedaExtranjera = false }) => {
  const formatFn = esMonedaExtranjera 
    ? (val: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
    : formatearMontoConSeparadores;
  const simbolo = esMonedaExtranjera ? (titulo === 'USD' ? '$' : 'R$') : 'Gs';
  const colorDiferencia = datos.diferencia !== 0 ? 'error.main' : 'success.main';

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{titulo}</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ py: 0.5, px: 1, width: '33%' }}>Declarado:</TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1 }}>{simbolo} {formatFn(datos.declarado)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ py: 0.5, px: 1 }}>Sistema:</TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1 }}>{simbolo} {formatFn(datos.sistema)}</TableCell>
            </TableRow>
            <TableRow sx={{ backgroundColor: datos.diferencia !== 0 ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 255, 0, 0.05)' }}>
              <TableCell sx={{ py: 0.5, px: 1, fontWeight: 'bold', borderBottom: 'none' }}>Diferencia:</TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1, fontWeight: 'bold', color: colorDiferencia, borderBottom: 'none' }}>
                {simbolo} {formatFn(datos.diferencia)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// --- Modificar interfaz para claridad ---
// Renombrar diferenciaTotal a initialDiferenciaTotal para evitar confusión
interface ComparacionEnCajaExtendidoTemp extends ComparacionEnCaja {
  initialDiferenciaTotal: number; 
}

// Definir Props
interface DiferenciaEnCajaListProps {
  propGlobalCajaFilter?: string;
}

const DiferenciaEnCajaList: React.FC<DiferenciaEnCajaListProps> = ({ propGlobalCajaFilter }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [datosComparaciones, setDatosComparaciones] = useState<ComparacionEnCajaExtendidoTemp[]>([]);
  const [datosFiltrados, setDatosFiltrados] = useState<ComparacionEnCajaExtendidoTemp[]>([]);

  // --- Estados de Filtro ---
  const [filtroFechaApertura, setFiltroFechaApertura] = useState<string>('');
  const [filtroSucursal, setFiltroSucursal] = useState<string>('');
  const [filtroMaletin, setFiltroMaletin] = useState<string>('');
  const [filtroCajaNro, setFiltroCajaNro] = useState<string>('');
  const [filtroDiferencia, setFiltroDiferencia] = useState<'todos' | 'con' | 'sin'>('todos');

  // --- Estado de Expansión ---
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // --- Estado para Detalles Calculados --- 
  const [detallesCalculados, setDetallesCalculados] = useState<{ 
    [cajaId: string]: { 
      cargando: boolean; 
      error: string | null; 
      detalle: ResultadoCalculoDetalle | null; 
    }
  }>({});

  // --- Estados de Paginación ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Función para navegar a la pantalla de cajas y abrir el detalle de una caja específica
  const navegarACajaDetalle = (cajaId: number) => {
    // Navegar a la ruta de cajas con el parámetro de la caja a abrir
    navigate(`/cajas?openDetail=${cajaId}`);
  };

  // --- Función para calcular diferencias automáticamente ---
  const calcularDiferenciasAutomaticamente = useCallback(async (comparaciones: ComparacionEnCajaExtendidoTemp[]) => {
    console.log(`[AUTO-CALC] Iniciando cálculo para ${comparaciones.length} cajas`);
    
    // Procesar en lotes para evitar sobrecargar
    const LOTE_SIZE = 5;
    for (let i = 0; i < comparaciones.length; i += LOTE_SIZE) {
      const lote = comparaciones.slice(i, i + LOTE_SIZE);
      
      // Procesar lote en paralelo
      const promesas = lote.map(async (comp) => {
        try {
          const resultado = await calcularDetalleDiferencias(comp);
          console.log(`[AUTO-CALC] Caja ${comp.cajaEnteroId}: ${resultado.diferenciaTotal} Gs`);
          
          setDetallesCalculados(prev => ({
            ...prev,
            [comp.id]: { cargando: false, error: null, detalle: resultado }
          }));
          
          return { id: comp.id, diferencia: resultado.diferenciaTotal };
        } catch (err: any) {
          console.error(`[AUTO-CALC] Error Caja ${comp.cajaEnteroId}:`, err.message);
          
          setDetallesCalculados(prev => ({
            ...prev,
            [comp.id]: { cargando: false, error: err.message, detalle: null }
          }));
          
          return { id: comp.id, diferencia: 0 }; // Valor por defecto en caso de error
        }
      });
      
      await Promise.all(promesas);
      
      // Pequeña pausa entre lotes para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('[AUTO-CALC] Cálculo automático completado');
  }, []);

  // --- Fetching de Datos (Ajustado) ---
  useEffect(() => {
    const fetchDiferenciasEnCaja = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<{ comparaciones: ComparacionEnCaja[] }>(
          `/api/diferencias/en-caja/comparaciones`
        );

        let comparacionesArray = response.data.comparaciones;

        if (!Array.isArray(comparacionesArray)) {
          console.error("La propiedad 'comparaciones' en la respuesta no es un array:", response.data);
          comparacionesArray = [];
        }

        // Calcular diferenciaTotal inicial para el estado visual
        const comparacionesExtendidas: ComparacionEnCajaExtendidoTemp[] = comparacionesArray.map(comp => {
          // Inicialmente ponemos 0 como placeholder, luego calcularemos todas automáticamente
          const difTotalInicial = 0; // Placeholder temporal
          
          return {
            ...comp,
            initialDiferenciaTotal: difTotalInicial,
          };
        });

        console.log(`[INICIAL] Total de comparaciones cargadas: ${comparacionesExtendidas.length}`);
        setDatosComparaciones(comparacionesExtendidas);

        // Calcular diferencias reales para todas las cajas automáticamente
        // Se ejecutará después de que se defina la función en useEffect
        
      } catch (err) {
        console.error("Error fetching diferencias en caja:", err);
        if (err instanceof Error) {
          setError(err.message || "Error al cargar las diferencias internas de cajas.");
        } else {
          setError("Error al cargar las diferencias internas de cajas.");
        }
        setDatosComparaciones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiferenciasEnCaja();
  }, []);

  // useEffect para calcular diferencias automáticamente cuando se cargan los datos
  useEffect(() => {
    if (datosComparaciones.length > 0) {
      console.log('[INICIO] Calculando diferencias para todas las cajas...');
      calcularDiferenciasAutomaticamente(datosComparaciones);
    }
  }, [datosComparaciones, calcularDiferenciasAutomaticamente]);

  // useEffect para reaccionar al filtro global
  useEffect(() => {
    if (propGlobalCajaFilter !== undefined) {
      setFiltroCajaNro(propGlobalCajaFilter);
    }
  }, [propGlobalCajaFilter]);

  // --- Lógica de Filtrado (Corregida) ---
  const applyFilters = useCallback(() => {
    let filtered = [...datosComparaciones];

    // Filtro Fecha Apertura
    if (filtroFechaApertura) {
       try {
         const fechaFiltroObj = parseISO(filtroFechaApertura);
         const fechaFiltroStr = format(fechaFiltroObj, 'yyyy-MM-dd');
         filtered = filtered.filter(comp =>
           comp.fechaApertura && format(parseISO(comp.fechaApertura), 'yyyy-MM-dd') === fechaFiltroStr
         );
       } catch (e) {
         console.warn("Fecha inválida en filtro");
       }
    }

    // Filtro Sucursal
    if (filtroSucursal) {
      const sucursalLower = filtroSucursal.toLowerCase();
      filtered = filtered.filter(comp =>
        comp.sucursalNombre?.toLowerCase().includes(sucursalLower)
      );
    }
    
    // Filtro Maletin ID
    if (filtroMaletin) {
        filtered = filtered.filter(comp => 
          comp.maletinId?.toString().includes(filtroMaletin)
        );
    }

    // Filtro Caja Nro
    if (filtroCajaNro) {
      const cajaNro = parseInt(filtroCajaNro, 10);
      if (!isNaN(cajaNro)) {
        filtered = filtered.filter(comp => comp.cajaEnteroId === cajaNro);
      }
    }

    // Filtro Diferencia (Intenta usar detalle si existe, si no, usa inicial)
    if (filtroDiferencia !== 'todos') {
      const esConDiferencia = filtroDiferencia === 'con';
      filtered = filtered.filter(comp => {
        const detalle = detallesCalculados[comp.id]?.detalle;
        const difAUsar = detalle ? detalle.diferenciaTotal : comp.initialDiferenciaTotal;
        const absDif = Math.abs(difAUsar);
        
        if (esConDiferencia) {
          // "Con diferencia" incluye desde 10,000 Gs en adelante
          return absDif >= 10000;
        } else { // 'sin' 
          // "Sin diferencia" incluye de 0 a menos de 10,000 Gs
          return absDif < 10000;
        }
      });
    }

    setDatosFiltrados(filtered);
    setPage(0);
  }, [datosComparaciones, filtroFechaApertura, filtroSucursal, filtroMaletin, filtroCajaNro, filtroDiferencia, detallesCalculados]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // --- Manejadores de Cambio de Filtro ---
  const handleFechaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroFechaApertura(event.target.value);
  };

  const handleSucursalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroSucursal(event.target.value);
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
  const handleRowClick = useCallback(async (rowId: string) => {
    const comp = datosFiltrados.find(c => c.id === rowId);
    if (!comp) return;

    const esExpansion = expandedRowId !== rowId;
    setExpandedRowId(esExpansion ? rowId : null);

    // Si estamos expandiendo y los detalles no están cargados ni cargando
    if (esExpansion && (!detallesCalculados[rowId] || (!detallesCalculados[rowId].cargando && !detallesCalculados[rowId].detalle && !detallesCalculados[rowId].error))) {
      console.log(`Iniciando cálculo detallado para caja ID: ${rowId}`);
      setDetallesCalculados(prev => ({
        ...prev,
        [rowId]: { cargando: true, error: null, detalle: null }
      }));

      try {
        const resultado = await calcularDetalleDiferencias(comp);
        console.log(`[DETALLE] Caja ${comp.cajaEnteroId} - Comparación:`, {
          rowId: rowId,
          initialDiferenciaTotal: comp.initialDiferenciaTotal,
          calculadoDiferenciaTotal: resultado.diferenciaTotal,
          diferencia: resultado.diferenciaTotal - comp.initialDiferenciaTotal,
          cotizacionUsada: resultado.cotizacionUsada,
          diferenciasServicios: resultado.diferenciasServicios
        });
        
        setDetallesCalculados(prev => ({
          ...prev,
          [rowId]: { cargando: false, error: null, detalle: resultado }
        }));
      } catch (err: any) {
        console.error(`Error en cálculo detallado para ${rowId}:`, err);
        setDetallesCalculados(prev => ({
          ...prev,
          [rowId]: { cargando: false, error: err.message || "Error desconocido al calcular detalle", detalle: null }
        }));
      }
    }
  }, [expandedRowId, datosFiltrados, detallesCalculados]);

  // --- Manejadores de Paginación ---
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // --- Renderizado (Ajustado Chip con validación de servicios) --- 
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Diferencia en Cajas
         <Tooltip title="Compara el saldo declarado al cierre con el saldo calculado por el sistema para esa misma caja.">
           <InfoOutlinedIcon sx={{ fontSize: 16, verticalAlign: 'middle', ml: 0.5, color: 'text.secondary' }} />
         </Tooltip>
      </Typography>

      {/* Sección de Filtros */} 
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="Fecha Apertura"
            type="date"
            value={filtroFechaApertura}
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
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="Maletín ID"
            value={filtroMaletin}
            onChange={handleMaletinChange}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="Caja Nro"
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
            <Table stickyHeader size="small" aria-label="tabla-diferencias-en-caja">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha Apertura</TableCell>
                  <TableCell>Sucursal</TableCell>
                  <TableCell>Maletín</TableCell>
                  <TableCell align="right">Caja Nro</TableCell>
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
                      const rowId = comp.id;
                      const isExpanded = expandedRowId === rowId;
                      const estadoDetalle = detallesCalculados[rowId];
                      const detalle = estadoDetalle?.detalle;

                      // Determinar qué diferencia usar para el estado visual
                      const difParaEstadoVisual = detalle ? detalle.diferenciaTotal : comp.initialDiferenciaTotal;

                      // LOG: Comparar diferencias para este elemento
                      console.log(`[CHIP] Caja ${comp.cajaEnteroId} (${rowId}):`, {
                        initialDiferenciaTotal: comp.initialDiferenciaTotal,
                        detalleDiferenciaTotal: detalle?.diferenciaTotal,
                        difParaEstadoVisual: difParaEstadoVisual,
                        tieneDetalle: !!detalle,
                        estadoDetalle: estadoDetalle
                      });

                      // Lógica para determinar el estado y color del Chip (basado solo en diferencia total)
                      let chipLabel: string;
                      let chipColor: "success" | "warning" | "error" | "info" | "default";
                      let chipSx: any = {}; // Para colores personalizados
                      
                      // Si no hay detalle calculado, usar el valor inicial (0 = placeholder)
                      if (!detalle && difParaEstadoVisual === 0) {
                        chipLabel = "Calcular";
                        chipColor = "info";
                      } else {
                        const absDif = Math.abs(difParaEstadoVisual);
                        
                        if (absDif === 0) {
                          // 0 - sin diferencia (verde actual)
                          chipLabel = "Sin Diferencia";
                          chipColor = "success";
                        } else if (absDif < 10000) {
                          // <10.000 - poca diferencia (verde claro/mate)
                          chipLabel = "Poca Diferencia";
                          chipColor = "success";
                          chipSx = {
                            backgroundColor: '#c8e6c9', // Verde claro
                            color: '#2e7d32', // Verde oscuro para el texto
                            '&.MuiChip-outlined': {
                              borderColor: '#81c784',
                              backgroundColor: 'transparent'
                            }
                          };
                        } else if (absDif < 20000) {
                          // <20.000 - media diferencia (amarillo actual)
                          chipLabel = "Media Diferencia";
                          chipColor = "warning";
                        } else if (absDif < 50000) {
                          // <50.000 - con diferencia (rojo tirando hacia naranja)
                          chipLabel = "Con Diferencia";
                          chipColor = "error";
                          chipSx = {
                            backgroundColor: '#ffab91', // Rojo-naranja claro
                            color: '#d84315', // Rojo-naranja oscuro para el texto
                            '&.MuiChip-outlined': {
                              borderColor: '#ff7043',
                              backgroundColor: 'transparent'
                            }
                          };
                        } else {
                          // >= 50.000 - mucha diferencia (rojo actual)
                          chipLabel = "Mucha Diferencia";
                          chipColor = "error";
                        }
                      }
                      
                      // LOG: Estado final asignado
                      console.log(`[CHIP-FINAL] Caja ${comp.cajaEnteroId}: ${chipLabel} (${chipColor}) - Dif: ${difParaEstadoVisual}`);
                      
                      // El fondo se mantiene rojo solo para diferencias >= 10,000 Gs
                      const hayDifParaFondo = Math.abs(difParaEstadoVisual) >= 10000;

                      return (
                        <React.Fragment key={rowId}>
                          <TableRow
                            hover
                            onClick={() => handleRowClick(rowId)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: hayDifParaFondo ? 'rgba(255, 0, 0, 0.05)' : 'inherit',
                              '&:hover': {
                                backgroundColor: hayDifParaFondo ? 'rgba(255, 0, 0, 0.1)' : 'action.hover',
                              }
                            }}
                          >
                            <TableCell>
                              {comp.fechaApertura
                                ? format(parseISO(comp.fechaApertura), 'dd/MM/yyyy HH:mm', { locale: es })
                                : '-'}
                            </TableCell>
                            <TableCell>{comp.sucursalNombre || '-'}</TableCell>
                            <TableCell>
                              {comp.maletinInfo 
                                ? `${comp.maletinInfo.codigo}${comp.maletinInfo.sucursalNombre ? ` (${comp.maletinInfo.sucursalNombre})` : ''}`
                                : comp.maletinId || '-'
                              }
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                {comp.cajaEnteroId}
                                <Tooltip title="Ver detalle de esta caja">
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation(); // Evitar que se active el click de la fila
                                      navegarACajaDetalle(comp.cajaEnteroId);
                                    }}
                                    sx={{ ml: 0.5 }}
                                  >
                                    <OpenInNewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={chipLabel} color={chipColor} size="small" variant="outlined" sx={chipSx} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                {/* Replicando estructura similar a DetalleDialog */}
                                <Paper 
                                  variant="outlined" 
                                  sx={{ 
                                    m: 1, // Margen como en DetalleDialog
                                    borderRadius: 2, // Bordes redondeados
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  {/* Cabecera Verde para Diferencias */}
                                  <Box sx={{ bgcolor: '#4caf50', p: 0.5, color: 'white' }}>
                                    <Typography variant="subtitle1" fontWeight="bold" align="center">
                                      Detalle de Diferencias (Caja {comp.cajaEnteroId})
                                    </Typography>
                                  </Box>
                                  
                                  {/* Tabla para Diferencia Total */}
                                  <TableContainer>
                                    <Table size="small" padding="none" sx={{ '& .MuiTableCell-root': { fontSize: '0.8rem' } }}>
                                      <TableHead>
                                        <TableRow sx={{ backgroundColor: '#333', color: 'white' }}>
                                          <TableCell sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Tipo</strong></TableCell>
                                          <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Diferencia Total (PYG)</strong></TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell sx={{ py: 0.3, px: 0.6 }}><strong>Diferencia Total</strong></TableCell>
                                          <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                                            {estadoDetalle?.cargando ? (
                                              <CircularProgress size={16} />
                                            ) : estadoDetalle?.error ? (
                                              <Tooltip title={estadoDetalle.error}>
                                                <Typography color="error" sx={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                  {estadoDetalle.error.includes('Faltan saldos iniciales o finales') 
                                                    ? "Error: Faltan datos cierre"
                                                    : "Error Cálculo" }
                                                  <ErrorOutlineIcon fontSize="inherit" sx={{ ml: 0.5 }}/>
                                                </Typography>
                                              </Tooltip>
                                            ) : estadoDetalle?.detalle ? (
                                              <Tooltip title={`Cotización usada - USD: ${formatearMontoConSeparadores(estadoDetalle.detalle.cotizacionUsada?.valorDolar || 0)} | BRL: ${formatearMontoConSeparadores(estadoDetalle.detalle.cotizacionUsada?.valorReal || 0)}`}>
                                                <Typography
                                                  color={estadoDetalle.detalle.diferenciaTotal !== 0 ? 'error.main' : 'success.main'}
                                                  fontWeight="bold"
                                                  sx={{ fontSize: '0.8rem' }}
                                                >
                                                  {formatearMontoConSeparadores(estadoDetalle.detalle.diferenciaTotal) + ' Gs'}
                                                </Typography>
                                              </Tooltip>
                                            ) : (
                                              <Typography sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                -
                                              </Typography>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </TableContainer>

                                  {/* Diferencias de Servicios */}
                                  <Box sx={{ bgcolor: '#4caf50', p: 0.3, color: 'white', mt: 0.5 }}>
                                    <Typography variant="body2" fontWeight="bold" align="center" sx={{ fontSize: '0.8rem' }}>
                                      Diferencias en Servicios (PYG)
                                    </Typography>
                                  </Box>

                                  {estadoDetalle?.cargando ? (
                                    <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                                  ) : estadoDetalle?.error ? (
                                     <Box sx={{ p: 1, textAlign: 'center' }}>
                                      <Tooltip title={estadoDetalle.error}>
                                        <Typography color="error" sx={{ fontSize: '0.8rem' }}>
                                          {estadoDetalle.error.includes('Faltan saldos iniciales o finales') 
                                            ? "Error: Faltan datos de cierre en API."
                                            : "Error al calcular detalle de servicios."}
                                        </Typography>
                                      </Tooltip>
                                    </Box>
                                  ) : (estadoDetalle?.detalle && estadoDetalle.detalle.diferenciasServicios.length > 0) ? (
                                    <TableContainer>
                                      <Table size="small" padding="none" sx={{ '& .MuiTableCell-root': { fontSize: '0.8rem' } }}>
                                        <TableHead>
                                          <TableRow sx={{ backgroundColor: '#333', color: 'white' }}>
                                            <TableCell sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Servicio</strong></TableCell>
                                            <TableCell align="right" sx={{ color: 'white', py: 0.3, px: 0.6 }}><strong>Diferencia</strong></TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {estadoDetalle.detalle.diferenciasServicios.map((difServ, index: number) => (
                                            <TableRow key={`servicio-diferencia-${index}`}>
                                              <TableCell sx={{ py: 0.3, px: 0.6 }}>
                                                {difServ.servicio}
                                              </TableCell>
                                              <TableCell align="right" sx={{ py: 0.3, px: 0.6 }}>
                                                <Typography
                                                  color={difServ.diferencia !== 0 ? 'error.main' : 'success.main'}
                                                  fontWeight="bold"
                                                  sx={{ fontSize: '0.8rem' }}
                                                >
                                                  {formatearMontoConSeparadores(difServ.diferencia) + ' Gs'}
                                                </Typography>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  ) : (
                                    <Box sx={{ p: 1, textAlign: 'center' }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        {estadoDetalle?.detalle ? 'No se encontraron diferencias en servicios.' : '-'}
                                      </Typography>
                                    </Box>
                                  )}
                                </Paper>
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

export default DiferenciaEnCajaList; 