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
  AlertTitle
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';

interface Persona {
  id: number;
  nombreCompleto: string;
  documento: string;
  tipo: string;
}

const CargaSueldos: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [sueldos, setSueldos] = useState<{ [key: number]: string }>({});
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

  // Cargar personas al montar el componente
  useEffect(() => {
    cargarPersonas();
  }, []);

  // Cargar sueldos cuando cambia el mes o año seleccionado
  useEffect(() => {
    cargarSueldos();
  }, [mes, anio]);

  const cargarPersonas = async () => {
    setLoading(true);
    try {
      // Intentar obtener datos reales de la API
      const response = await axios.get('/api/personas/funcionarios');
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setPersonas(response.data);
        
        // Inicializar sueldos vacíos
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
        message: 'Error al cargar la lista de funcionarios. Usando datos de ejemplo.',
        severity: 'error'
      });
      
      // En caso de error, cargar datos de ejemplo (descomentando esto durante las pruebas)
      /*
      const DATOS_EJEMPLO = [
        { id: 1, nombreCompleto: 'Juan Pérez', documento: '1234567', tipo: 'Funcionario' },
        { id: 2, nombreCompleto: 'María González', documento: '2345678', tipo: 'Funcionario' },
        { id: 3, nombreCompleto: 'Carlos López', documento: '3456789', tipo: 'Funcionario' },
      ];
      
      setPersonas(DATOS_EJEMPLO);
      
      // Inicializar sueldos vacíos con los datos de ejemplo
      const sueldosIniciales: { [key: number]: string } = {};
      DATOS_EJEMPLO.forEach((persona) => {
        sueldosIniciales[persona.id] = '';
      });
      setSueldos(sueldosIniciales);
      */
    } finally {
      setLoading(false);
    }
  };

  const cargarSueldos = async () => {
    if (personas.length === 0) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/sueldos/${anio}/${mes}`);
      
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
      // Si no hay sueldos para este mes, simplemente mantenemos los campos vacíos
      setSnackbar({
        open: true,
        message: `No hay datos de sueldos para ${meses.find(m => m.value === mes)?.label} ${anio}`,
        severity: 'info'
      });
    } finally {
      setLoading(false);
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

      await axios.post('/api/sueldos/guardar', sueldosParaGuardar);
      
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
    // Permitir solo números y eliminar cualquier caracter que no sea número
    let valorLimpio = valor.replace(/[^\d]/g, '');
    
    // Formatear el número con puntos para los miles
    const valorFormateado = formatearNumero(parseInt(valorLimpio || '0'));
    
    setSueldos(prevSueldos => ({
      ...prevSueldos,
      [personaId]: valorFormateado
    }));
  };

  const formatearNumero = (numero: number): string => {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Buscar el siguiente índice
      const siguienteIndex = index + 1;
      if (siguienteIndex < personas.length && inputRefs.current[personas[siguienteIndex].id]) {
        const siguienteInput = inputRefs.current[personas[siguienteIndex].id];
        siguienteInput?.focus();
      } else if (siguienteIndex >= personas.length) {
        // Si es el último, enfoca el primer input
        if (personas.length > 0 && inputRefs.current[personas[0].id]) {
          const primerInput = inputRefs.current[personas[0].id];
          primerInput?.focus();
        }
      }
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select(); // Seleccionar todo el texto al hacer focus
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