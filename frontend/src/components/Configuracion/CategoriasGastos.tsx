import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  Tab,
  Tabs,
  FormControlLabel,
  Switch,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import api from '../../services/api'; // Usar instancia api global
import { useAuth } from '../../contexts/AuthContext';

// Interfaces
interface Categoria {
  id: number;
  nombre: string;
  activo: boolean;
}

interface Subcategoria {
  id: number;
  nombre: string;
  categoriaId: number;
  categoriaNombre?: string;
  activo: boolean;
}

// ELIMINAMOS: const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Componente principal
const CategoriasGastos: React.FC = () => {
  // Estados para categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [activoCategoria, setActivoCategoria] = useState(true);

  // Estados para subcategorías
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [subcategoriaEditando, setSubcategoriaEditando] = useState<Subcategoria | null>(null);
  const [modalSubcategoria, setModalSubcategoria] = useState(false);
  const [nombreSubcategoria, setNombreSubcategoria] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [activoSubcategoria, setActivoSubcategoria] = useState(true);

  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Estado para pestañas
  const [tabValue, setTabValue] = useState(0);

  // Agregar estados para los diálogos de confirmación
  const [confirmarEliminarCategoria, setConfirmarEliminarCategoria] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<number | null>(null);
  const [confirmarEliminarSubcategoria, setConfirmarEliminarSubcategoria] = useState(false);
  const [subcategoriaAEliminar, setSubcategoriaAEliminar] = useState<number | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarCategorias();
    cargarSubcategorias();
  }, []);

  // Función para cargar categorías
  const cargarCategorias = async () => {
    try {
      // Usamos ruta relativa con /api/
      const response = await api.get(`/categorias-gastos`);
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      mostrarSnackbar('Error al cargar las categorías', 'error');
    }
  };

  // Función para cargar subcategorías
  const cargarSubcategorias = async () => {
    try {
      // Usamos ruta relativa con /api/
      const response = await api.get(`/subcategorias-gastos`);
      setSubcategorias(response.data);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
      mostrarSnackbar('Error al cargar las subcategorías', 'error');
    }
  };

  // Función para mostrar mensajes de notificación
  const mostrarSnackbar = (mensaje: string, severidad: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message: mensaje,
      severity: severidad
    });
  };

  // Funciones para el manejo de categorías
  const abrirModalCategoria = (categoria?: Categoria) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setNombreCategoria(categoria.nombre);
      setActivoCategoria(categoria.activo);
    } else {
      setCategoriaEditando(null);
      setNombreCategoria('');
      setActivoCategoria(true);
    }
    setModalCategoria(true);
  };

  const cerrarModalCategoria = () => {
    setModalCategoria(false);
    setCategoriaEditando(null);
    setNombreCategoria('');
    setActivoCategoria(true);
  };

  const guardarCategoria = async () => {
    if (!nombreCategoria.trim()) {
      mostrarSnackbar('El nombre de la categoría es obligatorio', 'error');
      return;
    }

    try {
      let response;
      if (categoriaEditando) {
        // Actualizar categoría existente
        // Usamos ruta relativa con /api/
        response = await api.put(`/categorias-gastos/${categoriaEditando.id}`, {
          nombre: nombreCategoria,
          activo: activoCategoria
        });
        mostrarSnackbar('Categoría actualizada correctamente', 'success');
      } else {
        // Crear nueva categoría
        // Usamos ruta relativa con /api/
        response = await api.post(`/categorias-gastos`, {
          nombre: nombreCategoria,
          activo: activoCategoria
        });
        mostrarSnackbar('Categoría creada correctamente', 'success');
      }

      cerrarModalCategoria();
      cargarCategorias();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      mostrarSnackbar('Error al guardar la categoría', 'error');
    }
  };

  const eliminarCategoria = async (id: number) => {
    setCategoriaAEliminar(id);
    setConfirmarEliminarCategoria(true);
  };

  const confirmarEliminarCategoriaHandler = async () => {
    if (categoriaAEliminar !== null) {
      try {
        // Usamos ruta relativa con /api/
        await api.delete(`/categorias-gastos/${categoriaAEliminar}`);
        mostrarSnackbar('Categoría eliminada correctamente', 'success');
        cargarCategorias();
        cargarSubcategorias(); // También recargar subcategorías ya que pueden haberse eliminado
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        mostrarSnackbar('Error al eliminar la categoría', 'error');
      }
    }
    setConfirmarEliminarCategoria(false);
    setCategoriaAEliminar(null);
  };

  // Funciones para el manejo de subcategorías
  const abrirModalSubcategoria = (subcategoria?: Subcategoria) => {
    if (subcategoria) {
      setSubcategoriaEditando(subcategoria);
      setNombreSubcategoria(subcategoria.nombre);
      setCategoriaSeleccionada(subcategoria.categoriaId);
      setActivoSubcategoria(subcategoria.activo);
    } else {
      setSubcategoriaEditando(null);
      setNombreSubcategoria('');
      setCategoriaSeleccionada(null);
      setActivoSubcategoria(true);
    }
    setModalSubcategoria(true);
  };

  const cerrarModalSubcategoria = () => {
    setModalSubcategoria(false);
    setSubcategoriaEditando(null);
    setNombreSubcategoria('');
    setCategoriaSeleccionada(null);
    setActivoSubcategoria(true);
  };

  const guardarSubcategoria = async () => {
    if (!nombreSubcategoria.trim()) {
      mostrarSnackbar('El nombre de la subcategoría es obligatorio', 'error');
      return;
    }

    if (categoriaSeleccionada === null) {
      mostrarSnackbar('Debe seleccionar una categoría', 'error');
      return;
    }

    try {
      let response;
      if (subcategoriaEditando) {
        // Actualizar subcategoría existente
        // Usamos ruta relativa con /api/
        response = await api.put(`/subcategorias-gastos/${subcategoriaEditando.id}`, {
          nombre: nombreSubcategoria,
          categoriaId: categoriaSeleccionada,
          activo: activoSubcategoria
        });
        mostrarSnackbar('Subcategoría actualizada correctamente', 'success');
      } else {
        // Crear nueva subcategoría
        // Usamos ruta relativa con /api/
        response = await api.post(`/subcategorias-gastos`, {
          nombre: nombreSubcategoria,
          categoriaId: categoriaSeleccionada,
          activo: activoSubcategoria
        });
        mostrarSnackbar('Subcategoría creada correctamente', 'success');
      }

      cerrarModalSubcategoria();
      cargarSubcategorias();
    } catch (error) {
      console.error('Error al guardar subcategoría:', error);
      mostrarSnackbar('Error al guardar la subcategoría', 'error');
    }
  };

  const eliminarSubcategoria = async (id: number) => {
    setSubcategoriaAEliminar(id);
    setConfirmarEliminarSubcategoria(true);
  };

  const confirmarEliminarSubcategoriaHandler = async () => {
    if (subcategoriaAEliminar !== null) {
      try {
        // Usamos ruta relativa con /api/
        await api.delete(`/subcategorias-gastos/${subcategoriaAEliminar}`);
        mostrarSnackbar('Subcategoría eliminada correctamente', 'success');
        cargarSubcategorias();
      } catch (error) {
        console.error('Error al eliminar subcategoría:', error);
        mostrarSnackbar('Error al eliminar la subcategoría', 'error');
      }
    }
    setConfirmarEliminarSubcategoria(false);
    setSubcategoriaAEliminar(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CategoryIcon sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h5" component="h1" gutterBottom sx={{ flex: 1 }}>
            Categorías y Subcategorías de Gastos
          </Typography>
          <Tooltip title="Actualizar datos">
            <IconButton onClick={() => { cargarCategorias(); cargarSubcategorias(); }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="pestañas categorías gastos">
            <Tab label="Categorías" />
            <Tab label="Subcategorías" />
          </Tabs>
        </Box>

        <Box hidden={tabValue !== 0} sx={{ mt: 2 }}>
          {/* Panel de Categorías */}
          <Box sx={{ display: 'flex', justifyContent: 'end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => abrirModalCategoria()}
            >
              Nueva Categoría
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categorias.length > 0 ? (
                  categorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell>{categoria.id}</TableCell>
                      <TableCell>{categoria.nombre}</TableCell>
                      <TableCell>
                        {categoria.activo ? 'Activo' : 'Inactivo'}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => abrirModalCategoria(categoria)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => eliminarCategoria(categoria.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No hay categorías registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box hidden={tabValue !== 1} sx={{ mt: 2 }}>
          {/* Panel de Subcategorías */}
          <Box sx={{ display: 'flex', justifyContent: 'end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => abrirModalSubcategoria()}
              disabled={categorias.length === 0}
            >
              Nueva Subcategoría
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subcategorias.length > 0 ? (
                  subcategorias.map((subcategoria) => (
                    <TableRow key={subcategoria.id}>
                      <TableCell>{subcategoria.id}</TableCell>
                      <TableCell>{subcategoria.nombre}</TableCell>
                      <TableCell>
                        {categorias.find(c => c.id === subcategoria.categoriaId)?.nombre || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {subcategoria.activo ? 'Activo' : 'Inactivo'}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => abrirModalSubcategoria(subcategoria)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => eliminarSubcategoria(subcategoria.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay subcategorías registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Modal de Categoría */}
      <Dialog open={modalCategoria} onClose={cerrarModalCategoria}>
        <DialogTitle>{categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nombre de la Categoría"
                value={nombreCategoria}
                onChange={(e) => setNombreCategoria(e.target.value)}
                fullWidth
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={activoCategoria} 
                    onChange={(e) => setActivoCategoria(e.target.checked)} 
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModalCategoria}>Cancelar</Button>
          <Button onClick={guardarCategoria} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Subcategoría */}
      <Dialog open={modalSubcategoria} onClose={cerrarModalSubcategoria}>
        <DialogTitle>{subcategoriaEditando ? 'Editar Subcategoría' : 'Nueva Subcategoría'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nombre de la Subcategoría"
                value={nombreSubcategoria}
                onChange={(e) => setNombreSubcategoria(e.target.value)}
                fullWidth
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Categoría"
                value={categoriaSeleccionada || ''}
                onChange={(e) => setCategoriaSeleccionada(Number(e.target.value))}
                fullWidth
              >
                <MenuItem value="" disabled>
                  Seleccione una categoría
                </MenuItem>
                {categorias.map((categoria) => (
                  <MenuItem key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={activoSubcategoria} 
                    onChange={(e) => setActivoSubcategoria(e.target.checked)} 
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModalSubcategoria}>Cancelar</Button>
          <Button onClick={guardarSubcategoria} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar categoría */}
      <Dialog
        open={confirmarEliminarCategoria}
        onClose={() => setConfirmarEliminarCategoria(false)}
      >
        <DialogTitle>Eliminar Categoría</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar esta categoría? Esta acción también eliminará todas las subcategorías asociadas.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmarEliminarCategoria(false)}>Cancelar</Button>
          <Button onClick={confirmarEliminarCategoriaHandler} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar subcategoría */}
      <Dialog
        open={confirmarEliminarSubcategoria}
        onClose={() => setConfirmarEliminarSubcategoria(false)}
      >
        <DialogTitle>Eliminar Subcategoría</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar esta subcategoría?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmarEliminarSubcategoria(false)}>Cancelar</Button>
          <Button onClick={confirmarEliminarSubcategoriaHandler} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoriasGastos; 