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
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSucursal } from '../../contexts/SucursalContext';
import { apiService } from '../../config/api';

// Definir interfaces
interface Sucursal {
  id: string;
  nombre: string;
  codigo: string;
  direccion: string;
  telefono: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Maletin {
  id: string;
  codigo: string;
  sucursalId: string;
  sucursal?: Sucursal;
  createdAt?: string;
  updatedAt?: string;
}

interface MaletinFormData {
  codigo: string;
  sucursalId: string;
}

// Datos iniciales para el formulario
const initialFormData: MaletinFormData = {
  codigo: '',
  sucursalId: ''
};

// Datos de fallback para sucursales y maletines (en caso de error de API)
const sucursalesFallback: Sucursal[] = [
  {
    id: "1",
    nombre: "Central",
    codigo: "CEN",
    direccion: "Av. Principal 123",
    telefono: "021-123-4567",
    email: "central@example.com"
  },
  {
    id: "2",
    nombre: "Sucursal Este",
    codigo: "ESTE",
    direccion: "Calle Este 456",
    telefono: "021-456-7890",
    email: "este@example.com"
  }
];

const maletinesFallback = [
  {
    id: "1",
    codigo: "1001",
    sucursalId: "1",
    sucursal: sucursalesFallback[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const Maletines: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<MaletinFormData>(initialFormData);
  const [maletines, setMaletines] = useState<Maletin[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { sucursalActual } = useSucursal();
  const codigoMaletinRef = useRef<HTMLInputElement>(null); // Ref for Codigo Maletin input

  // Cargar maletines y sucursales al iniciar
  useEffect(() => {
    loadMaletines();
    loadSucursales();
  }, []);

  const loadMaletines = async () => {
    try {
      setLoading(true);
      const response = await apiService.maletines.getAll();
      const data = response.data;
      // Si la API devolvió datos, usarlos. Si no, usar datos de fallback
      if (data && data.length > 0) {
        setMaletines(data);
      } else {
        console.log('Usando datos de fallback para maletines');
        setMaletines(maletinesFallback);
      }
      setError(null);
    } catch (err) {
      setError('Error al cargar los maletines');
      console.error('Error al cargar los maletines:', err);
      // En caso de error, usar datos de fallback
      setMaletines(maletinesFallback);
    } finally {
      setLoading(false);
    }
  };

  const loadSucursales = async () => {
    try {
      console.log('Cargando sucursales...');
      const response = await apiService.sucursales.getAll();
      const data = response.data;
      console.log('Datos de sucursales recibidos:', data);
      
      // Si la API devolvió datos, usarlos. Si no, usar datos de fallback
      if (data && data.length > 0) {
        console.log('Usando datos de API para sucursales:', data);
        setSucursales(data);
      } else {
        console.log('Usando datos de fallback para sucursales:', sucursalesFallback);
        setSucursales(sucursalesFallback);
      }
    } catch (err) {
      console.error('Error al cargar las sucursales:', err);
      // En caso de error, usar datos de fallback
      console.log('Error al cargar sucursales, usando fallback:', sucursalesFallback);
      setSucursales(sucursalesFallback);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenDialog = () => {
    // Si hay una sucursal seleccionada, usarla por defecto
    const defaultSucursalId = sucursalActual ? sucursalActual.id : '';
    
    setFormData({
      ...initialFormData,
      sucursalId: defaultSucursalId
    });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para seleccionar todo el texto al hacer clic en un campo
  const handleInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
    if (event.currentTarget && typeof event.currentTarget.select === 'function') {
      event.currentTarget.select();
    }
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const name = event.target.name as string;
    const value = event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    // Validar que el código tenga exactamente 4 dígitos
    if (!/^\d{4}$/.test(formData.codigo)) {
      setError('El código debe contener exactamente 4 dígitos');
      return false;
    }

    // Validar que se haya seleccionado una sucursal
    if (!formData.sucursalId) {
      setError('Debe seleccionar una sucursal');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (validateForm()) {
      try {
        setLoading(true);
        
        // Datos a enviar a la API
        const maletinData = {
          codigo: formData.codigo,
          sucursalId: formData.sucursalId
        };
        
        console.log('Datos a enviar:', maletinData);
        
        let result;
        
        if (editingId) {
          // Actualizar maletín existente
          const response = await apiService.maletines.update(editingId, maletinData);
          result = response.data;
          setSuccessMessage('Maletín actualizado correctamente');
        } else {
          // Crear nuevo maletín
          try {
            const response = await apiService.maletines.create(maletinData);
            result = response.data;
            setSuccessMessage('Maletín creado correctamente');
          } catch (error: any) {
            console.error('Error completo al guardar:', error);
            if (error.response) {
              console.error('Detalles del error:', error.response.data);
            }
            throw error;
          }
        }
        
        // Recargar la lista de maletines
        loadMaletines();
        
        // Cerrar el diálogo y resetear el formulario
        handleCloseDialog();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al guardar el maletín');
        console.error('Error al guardar el maletín:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (maletin: Maletin) => {
    setFormData({
      codigo: maletin.codigo,
      sucursalId: maletin.sucursalId
    });
    setEditingId(maletin.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este maletín?')) {
      try {
        setLoading(true);
        await apiService.maletines.delete(id);
        await loadMaletines();
        setSuccessMessage('Maletín eliminado exitosamente');
      } catch (err: any) {
        setError('Error al eliminar el maletín');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filtrar maletines según término de búsqueda
  const filteredMaletines = maletines.filter(maletin =>
    maletin.codigo.includes(searchTerm) ||
    maletin.sucursal?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Maletines
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          AGREGAR MALETÍN
        </Button>
      </Box>

      {/* Buscador */}
      <Box sx={{ px: 2, pt: 2 }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="BUSCAR MALETINES..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: '100%', maxWidth: 500 }}
        />
      </Box>

      {/* Tabla de Maletines */}
      <Box sx={{ px: 2, pt: 2 }}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#1976d2' }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>CÓDIGO</TableCell>
                <TableCell sx={{ color: 'white' }}>SUCURSAL</TableCell>
                <TableCell sx={{ color: 'white' }}>FECHA CREACIÓN</TableCell>
                <TableCell sx={{ color: 'white' }} align="center">ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && maletines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filteredMaletines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No se encontraron maletines</TableCell>
                </TableRow>
              ) : (
                filteredMaletines.map(maletin => (
                  <TableRow key={maletin.id}>
                    <TableCell>{maletin.codigo}</TableCell>
                    <TableCell>{maletin.sucursal?.nombre || 'Sin asignar'}</TableCell>
                    <TableCell>{maletin.createdAt ? format(new Date(maletin.createdAt), 'dd MMMM yyyy', { locale: es }) : 'N/A'}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(maletin)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(maletin.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Diálogo para agregar/editar maletín */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        TransitionProps={{
          onEntered: () => {
            if (!editingId && codigoMaletinRef.current) {
              codigoMaletinRef.current.focus();
            }
          }
        }}
      >
        <DialogTitle>
          {editingId ? 'EDITAR MALETÍN' : 'AGREGAR NUEVO MALETÍN'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, pb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Código de Maletín (4 dígitos)"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  onClick={handleInputClick}
                  required
                  inputProps={{ 
                    maxLength: 4,
                    pattern: '[0-9]*',
                    inputMode: 'numeric' 
                  }}
                  autoComplete="off"
                  error={formData.codigo.length > 0 && formData.codigo.length !== 4}
                  helperText={formData.codigo.length > 0 && formData.codigo.length !== 4 ? "El código debe tener exactamente 4 dígitos" : ""}
                  inputRef={codigoMaletinRef}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>SUCURSAL</InputLabel>
                  <Select
                    name="sucursalId"
                    value={formData.sucursalId}
                    onChange={handleSelectChange}
                    label="SUCURSAL"
                    inputProps={{
                      autoComplete: 'new-password',
                    }}
                  >
                    <MenuItem value="" disabled>Seleccione una sucursal</MenuItem>
                    {sucursales && sucursales.length > 0 ? (
                      sucursales.map(sucursal => (
                        <MenuItem key={sucursal.id} value={sucursal.id}>
                          {sucursal.nombre}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>No hay sucursales disponibles</MenuItem>
                    )}
                  </Select>
                  {sucursales.length === 0 && (
                    <Typography color="error" variant="caption">
                      No se pudieron cargar las sucursales. Intente nuevamente.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>CANCELAR</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'GUARDAR'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mensajes de éxito y error */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Maletines; 