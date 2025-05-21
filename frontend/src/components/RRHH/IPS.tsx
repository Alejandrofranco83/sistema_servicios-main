import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Persona {
  id: number;
  nombreCompleto: string;
  documento: string;
  tipo: string;
}

interface PersonaIPS {
  id: number;
  personaId: number;
  persona: Persona;
  fechaInicio: string;
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt?: string;
  updatedAt?: string;
}

// Función para seleccionar todo el texto al hacer clic en un input
const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
  // Verificar si el elemento tiene el método select() antes de llamarlo
  if (e.currentTarget && typeof e.currentTarget.select === 'function') {
    e.currentTarget.select();
  }
};

// Función para formatear fechas en formato dd/mm/yyyy
const formatearFecha = (fecha: string | Date): string => {
  try {
    // Para manejar los problemas de zona horaria, extraemos los componentes de la fecha
    const fechaObj = new Date(fecha);
    
    // Ajustar la fecha a la zona horaria local
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaObj.getFullYear();
    
    return `${dia}/${mes}/${anio}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error, fecha);
    return 'Fecha inválida';
  }
};

const IPS: React.FC = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personasIPS, setPersonasIPS] = useState<PersonaIPS[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Cargar lista de personas en IPS al iniciar
  useEffect(() => {
    cargarPersonasIPS();
  }, []);

  // Efecto para realizar búsqueda cuando cambia el término
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        buscarPersonas();
        setMostrarResultados(true);
      } else {
        setPersonas([]);
        setMostrarResultados(false);
      }
    }, 300); // 300ms de retraso para evitar demasiadas solicitudes

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Efecto para manejar clic fuera de los resultados
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && 
          !searchInputRef.current.contains(event.target as Node)) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const cargarPersonasIPS = async () => {
    setLoading(true);
    try {
      // Cargar los datos desde la API
      const response = await axios.get('/api/ips/personas');
      if (response.data && Array.isArray(response.data)) {
        console.log('Datos de IPS cargados:', response.data);
        setPersonasIPS(response.data);
        
        if (response.data.length === 0) {
          setSnackbar({
            open: true,
            message: 'No hay personas registradas en IPS',
            severity: 'info'
          });
        }
      } else {
        console.warn('Respuesta inesperada de la API:', response.data);
        setPersonasIPS([]);
        setSnackbar({
          open: true,
          message: 'Error al obtener datos de IPS: formato incorrecto',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error al cargar personas de IPS:', error);
      setPersonasIPS([]);
      setSnackbar({
        open: true,
        message: 'Error al cargar la lista de personas registradas en IPS',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarPersonas = async () => {
    if (!searchTerm.trim() || searchTerm.trim().length < 3) {
      setPersonas([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Usar el endpoint para buscar personas
      const response = await axios.get(`/api/personas/buscar-personas?termino=${searchTerm}`);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Resultados de búsqueda:', response.data);
        
        // Adaptar los datos al formato esperado por el componente
        const personasFormateadas = response.data.map((p: any) => ({
          id: p.id,
          nombreCompleto: p.nombre || p.nombreCompleto,
          documento: p.documento,
          tipo: p.tipo
        }));
        
        // Filtrar solo funcionarios y VIP (considerando mayúsculas y minúsculas)
        const personasFiltradas = personasFormateadas.filter(
          (persona: Persona) => 
            persona.tipo.toUpperCase() === 'FUNCIONARIO' || 
            persona.tipo.toUpperCase() === 'VIP'
        );
        
        setPersonas(personasFiltradas);
      } else {
        setPersonas([]);
      }
    } catch (error) {
      console.error('Error al buscar personas:', error);
      setPersonas([]);
      setSnackbar({
        open: true,
        message: 'Error al buscar personas',
        severity: 'error'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toUpperCase());
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !mostrarResultados) {
      buscarPersonas();
      setMostrarResultados(true);
    }
  };

  const handleOpenDialog = (persona: Persona) => {
    setSelectedPersona(persona);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPersona(null);
  };

  const seleccionarPersona = (persona: Persona) => {
    handleOpenDialog(persona);
    setMostrarResultados(false);
  };

  const handleAgregarIPS = async () => {
    if (!selectedPersona) return;
    
    try {
      setLoading(true);
      
      // Verificar si la persona ya está en la lista de IPS
      const yaExiste = personasIPS.some(p => p.personaId === selectedPersona.id);
      if (yaExiste) {
        setSnackbar({
          open: true,
          message: 'Esta persona ya está registrada en IPS',
          severity: 'warning'
        });
        handleCloseDialog();
        return;
      }
      
      // Formatear la fecha actual como YYYY-MM-DD (requerido para la API)
      const fechaHoy = new Date();
      // Usar el formato YYYY-MM-DD con la fecha local correcta
      const anio = fechaHoy.getFullYear();
      const mes = (fechaHoy.getMonth() + 1).toString().padStart(2, '0');
      const dia = fechaHoy.getDate().toString().padStart(2, '0');
      const fechaFormateada = `${anio}-${mes}-${dia}`;
      
      console.log('Fecha a enviar al backend:', fechaFormateada);
      
      // Llamar a la API para agregar a IPS
      const response = await axios.post('/api/ips/agregar', {
        personaId: selectedPersona.id,
        fechaInicio: fechaFormateada,
        estado: 'ACTIVO'
      });
      
      if (response.data) {
        console.log('Persona agregada a IPS:', response.data);
        
        // Recargar la lista completa
        await cargarPersonasIPS();
        
        setSnackbar({
          open: true,
          message: 'Persona agregada a IPS exitosamente',
          severity: 'success'
        });
      } else {
        throw new Error('No se recibió respuesta al agregar persona a IPS');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error al agregar persona a IPS:', error);
      setSnackbar({
        open: true,
        message: 'Error al agregar persona a IPS',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverIPS = async (id: number) => {
    setPersonaToDelete(id);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (personaToDelete === null) return;
    
    try {
      setLoading(true);
      
      // Llamar a la API para eliminar el registro
      await axios.delete(`/api/ips/eliminar/${personaToDelete}`);
      
      // Recargar la lista completa
      await cargarPersonasIPS();
      
      setSnackbar({
        open: true,
        message: 'Persona eliminada de IPS exitosamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al eliminar persona de IPS:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar persona de IPS',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
      setPersonaToDelete(null);
      
      setTimeout(() => {
        if (searchInputRef.current) {
          const inputElement = searchInputRef.current.querySelector('input');
          if (inputElement) {
            inputElement.focus();
          }
        }
      }, 100);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setPersonaToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Encabezado */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        py: 2,
        px: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h5" component="h1">
          Gestión de IPS
        </Typography>
      </Box>

      {/* Buscador de personas */}
      <Paper elevation={3} sx={{ p: 2, m: 2 }}>
        <Typography variant="h6" gutterBottom>
          Buscar Personas (Funcionarios y VIP)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, position: 'relative' }} ref={searchInputRef}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="BUSCAR POR NOMBRE O DOCUMENTO..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            onClick={handleInputClick}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchLoading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
          />
          
          {/* Resultados de búsqueda en tiempo real */}
          {mostrarResultados && personas.length > 0 && (
            <Paper 
              elevation={3} 
              sx={{ 
                position: 'absolute', 
                width: '100%', 
                top: '100%', 
                left: 0, 
                zIndex: 1000,
                maxHeight: 300,
                overflow: 'auto',
                mt: 0.5
              }}
            >
              <List dense sx={{ p: 0 }}>
                {personas.map((persona) => (
                  <ListItem 
                    key={persona.id}
                    button
                    onClick={() => seleccionarPersona(persona)}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">{persona.nombreCompleto}</Typography>
                          <Chip 
                            label={persona.tipo}
                            color={persona.tipo === 'Funcionario' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={`Documento: ${persona.documento}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {searchTerm.length >= 3 && !searchLoading && personas.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No se encontraron funcionarios o VIP con ese criterio de búsqueda
          </Alert>
        )}
      </Paper>

      {/* Lista de personas en IPS */}
      <Paper elevation={3} sx={{ p: 2, m: 2 }}>
        <Typography variant="h6" gutterBottom>
          Personas Registradas en IPS
        </Typography>
        
        {loading && <CircularProgress sx={{ display: 'block', m: 'auto', my: 2 }} />}
        
        {!loading && personasIPS.length === 0 ? (
          <Alert severity="info">No hay personas registradas en IPS</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>NOMBRE</TableCell>
                  <TableCell>DOCUMENTO</TableCell>
                  <TableCell>TIPO</TableCell>
                  <TableCell>FECHA DE INICIO</TableCell>
                  <TableCell>ESTADO</TableCell>
                  <TableCell align="center">ACCIONES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {personasIPS.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.persona.nombreCompleto}</TableCell>
                    <TableCell>{item.persona.documento}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.persona.tipo}
                        color={item.persona.tipo === 'Funcionario' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatearFecha(item.fechaInicio)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.estado}
                        color={item.estado === 'ACTIVO' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemoverIPS(item.id)}
                        title="Eliminar de IPS"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Diálogo para confirmar agregar a IPS */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Agregar Persona a IPS</DialogTitle>
        <DialogContent>
          {selectedPersona && (
            <Box sx={{ mt: 1 }}>
              <Typography><strong>Nombre:</strong> {selectedPersona.nombreCompleto}</Typography>
              <Typography><strong>Documento:</strong> {selectedPersona.documento}</Typography>
              <Typography><strong>Tipo:</strong> {selectedPersona.tipo}</Typography>
              <Typography sx={{ mt: 2 }}>
                ¿Desea agregar esta persona a la lista de IPS?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleAgregarIPS} color="primary" variant="contained" autoFocus>
            Agregar a IPS
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para confirmar eliminar de IPS */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography id="alert-dialog-description">
              ¿Está seguro que desea eliminar esta persona de IPS?
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de notificaciones */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IPS; 