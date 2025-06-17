import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  AlertTitle,
  Tooltip
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import api from '../../services/api';

interface Persona {
  id: number;
  nombreCompleto: string;
  documento: string;
  tipo: string;
}

// =================================================================================
// FUNCIÓN DE CÁLCULO DEFINITIVA Y AISLADA
// =================================================================================
const calcularDesgloseSueldos = (
  sueldos: { [key: number]: string }, 
  sueldoMinimo: number
) => {
  // Aseguramos que el sueldo mínimo sea un número desde el principio.
  const sueldoMinimoNum = Number(sueldoMinimo);

  const resultado = {
    funcionariosConSueldo: 0,
    totalSueldosBase: 0,
    totalComisiones: 0,
  };

  // Iteramos de forma segura sobre los valores de los sueldos.
  for (const sueldoStr of Object.values(sueldos)) {
    if (!sueldoStr || sueldoStr.trim() === '') {
      continue;
    }

    // Forzamos la conversión a número de la forma más segura posible.
    const valor = Number(String(sueldoStr).replace(/\./g, ''));

    // Verificamos que el resultado de la conversión sea un número válido.
    if (!isNaN(valor) && valor > 0) {
      resultado.funcionariosConSueldo += 1;
      
      if (valor <= sueldoMinimoNum) {
        // Forzamos la suma como NÚMEROS en cada paso.
        resultado.totalSueldosBase = Number(resultado.totalSueldosBase) + valor;
      } else {
        resultado.totalSueldosBase = Number(resultado.totalSueldosBase) + sueldoMinimoNum;
        resultado.totalComisiones = Number(resultado.totalComisiones) + (valor - sueldoMinimoNum);
      }
    }
  }

  // Calculamos el total general al final.
  const totalGeneral = Number(resultado.totalSueldosBase) + Number(resultado.totalComisiones);
  
  return {
    ...resultado,
    totalGeneral,
  };
};
// =================================================================================

const CargaSueldos: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [sueldos, setSueldos] = useState<{ [key: number]: string }>({});
  const [totalSueldos, setTotalSueldos] = useState<number>(0);
  const [sueldoMinimo, setSueldoMinimo] = useState<number>(0);
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const inputRefs = useRef<{[key: number]: HTMLInputElement | null}>({});

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const años = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  // Calcular total de sueldos
  const calcularTotalSueldos = () => {
    const total = Object.values(sueldos).reduce((suma, sueldo) => {
      const valor = parseFloat(String(sueldo).replace(/\./g, '')) || 0;
      return suma + valor;
    }, 0);
    setTotalSueldos(total);
  };

  // Cargar personas al montar el componente
  useEffect(() => {
    cargarPersonas();
  }, []);

  // Cargar sueldos cuando cambia el mes o año seleccionado
  useEffect(() => {
    cargarSueldos();
  }, [mes, anio]);

  // Calcular total cuando cambian los sueldos
  useEffect(() => {
    calcularTotalSueldos();
  }, [sueldos]);

  // Cargar sueldo mínimo al montar el componente
  useEffect(() => {
    cargarSueldoMinimo();
  }, []);

  const cargarPersonas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/personas/funcionarios');
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setPersonas(response.data);
        
        const sueldosIniciales: { [key: number]: string } = {};
        response.data.forEach((persona: Persona) => {
          sueldosIniciales[persona.id] = '';
        });
        setSueldos(sueldosIniciales);
      } else {
        throw new Error('No se encontraron funcionarios');
      }
    } catch (error) {
      console.error('Error al cargar las personas:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar la lista de funcionarios.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarSueldos = async () => {
    if (personas.length === 0) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/sueldos/${anio}/${mes}`);
      
      if (response.data && Array.isArray(response.data)) {
        const sueldosCargados: { [key: number]: string } = {};
        
        response.data.forEach((sueldo: { personaId: number, monto: number }) => {
          sueldosCargados[sueldo.personaId] = formatearNumero(sueldo.monto);
        });
        
        setSueldos(prevSueldos => ({
          ...prevSueldos,
          ...sueldosCargados
        }));
      }
    } catch (error) {
      console.error('Error al cargar los sueldos:', error);
      setSnackbar({
        open: true,
        message: `No hay datos de sueldos para ${meses.find(m => m.value === mes)?.label} ${anio}`,
        severity: 'info'
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarSueldoMinimo = async () => {
    try {
      const response = await api.get('/api/sueldos-minimos/vigente');
      if (response.data && response.data.valor) {
        setSueldoMinimo(response.data.valor);
      }
    } catch (error) {
      console.error('Error al cargar sueldo mínimo:', error);
      setSueldoMinimo(2680373); // Valor de respaldo
    }
  };

  const guardarSueldos = async () => {
    setLoading(true);
    try {
      const sueldosParaGuardar = Object.entries(sueldos)
        .filter(([_, monto]) => monto.trim() !== '')
        .map(([personaId, monto]) => ({
          personaId: parseInt(personaId),
          monto: parseFloat(monto.replace(/\./g, '')),
          mes,
          anio
        }));
      
      if (sueldosParaGuardar.length === 0) {
        setSnackbar({
          open: true,
          message: 'No hay sueldos para guardar',
          severity: 'warning'
        });
        setLoading(false);
        return;
      }

      await api.post('/api/sueldos/guardar', sueldosParaGuardar);
      
      setSnackbar({
        open: true,
        message: 'Sueldos guardados correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al guardar los sueldos:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar los sueldos',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSueldoChange = (personaId: number, valor: string) => {
    let valorLimpio = valor.replace(/[^\d]/g, '');
    const valorFormateado = formatearNumero(parseInt(valorLimpio || '0'));
    
    setSueldos(prevSueldos => ({
      ...prevSueldos,
      [personaId]: valorFormateado
    }));
  };

  const formatearNumero = (numero: number): string => {
    if (isNaN(numero) || numero === null || numero === undefined) {
      return '0';
    }
    return Math.round(numero).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const siguienteIndex = index + 1;
      if (siguienteIndex < personas.length && inputRefs.current[personas[siguienteIndex].id]) {
        inputRefs.current[personas[siguienteIndex].id]?.focus();
      } else if (siguienteIndex >= personas.length && personas.length > 0) {
        inputRefs.current[personas[0].id]?.focus();
      }
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Carga de Sueldos
        </Typography>
        
        {personas.length === 0 && !loading && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>No hay funcionarios</AlertTitle>
            No se encontraron funcionarios registrados en el sistema.
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="mes-select-label">Mes</InputLabel>
            <Select
              labelId="mes-select-label"
              id="mes-select"
              value={mes}
              label="Mes"
              onChange={(e) => setMes(e.target.value as number)}
            >
              {meses.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="anio-select-label">Año</InputLabel>
            <Select
              labelId="anio-select-label"
              id="anio-select"
              value={anio}
              label="Año"
              onChange={(e) => setAnio(e.target.value as number)}
            >
              {años.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip
            title={(() => {
              const stats = calcularDesgloseSueldos(sueldos, sueldoMinimo);
              return (
                <Box sx={{ p: 2, minWidth: 300, color: '#fff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                    📋 Desglose de Sueldos del Mes
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    🧑‍💼 Funcionarios con sueldo: <strong>{stats.funcionariosConSueldo}</strong>
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    💰 Total sueldos base: <strong>Gs. {formatearNumero(stats.totalSueldosBase)}</strong>
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    🎯 Total comisiones: <strong>Gs. {formatearNumero(stats.totalComisiones)}</strong>
                  </Typography>
                  
                  <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.3)', pt: 1, mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      📊 Total general: <strong>Gs. {formatearNumero(stats.totalGeneral)}</strong>
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic', opacity: 0.7 }}>
                    💡 Sueldo mínimo: Gs. {formatearNumero(sueldoMinimo)}
                  </Typography>
                </Box>
              );
            })()}
            arrow
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  '& .MuiTooltip-arrow': {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              },
            }}
          >
            <TextField
              label="Total Sueldos"
              value={`Gs. ${formatearNumero(totalSueldos)}`}
              InputProps={{
                readOnly: true,
                style: { 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  textAlign: 'right',
                  cursor: 'help'
                }
              }}
              sx={{ 
                minWidth: 200,
                '& .MuiInputBase-input': {
                  textAlign: 'right'
                },
                '& .MuiInputBase-root': {
                  cursor: 'help'
                }
              }}
              variant="outlined"
              size="medium"
            />
          </Tooltip>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={cargarSueldos}
            disabled={loading || personas.length === 0}
          >
            Actualizar
          </Button>
          
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<SaveIcon />}
            onClick={guardarSueldos}
            disabled={loading || personas.length === 0}
            sx={{ ml: 'auto' }}
          >
            Guardar
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          personas.length > 0 && (
            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="5%">ID</TableCell>
                    <TableCell width="40%">Nombre</TableCell>
                    <TableCell width="30%">Documento</TableCell>
                    <TableCell width="25%">Sueldo (Gs.)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {personas.map((persona, index) => (
                    <TableRow key={persona.id}>
                      <TableCell>{persona.id}</TableCell>
                      <TableCell>{persona.nombreCompleto}</TableCell>
                      <TableCell>{persona.documento}</TableCell>
                      <TableCell>
                        <TextField
                          variant="outlined"
                          size="small"
                          fullWidth
                          value={sueldos[persona.id] || ''}
                          onChange={(e) => handleSueldoChange(persona.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onFocus={handleInputFocus}
                          inputRef={(el) => inputRefs.current[persona.id] = el}
                          InputProps={{
                            inputProps: {
                              style: { textAlign: 'right' }
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Paper>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CargaSueldos; 