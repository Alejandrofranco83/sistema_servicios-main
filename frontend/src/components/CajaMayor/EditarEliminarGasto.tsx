import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import WarningIcon from '@mui/icons-material/Warning';

interface Categoria {
  id: number;
  nombre: string;
}

interface Subcategoria {
  id: number;
  nombre: string;
  categoriaId: number;
}

interface Sucursal {
  id: number;
  nombre: string;
}

interface Gasto {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number;
  moneda: string;
  categoriaId: number;
  subcategoriaId: number | null;
  sucursalId: number | null;
  observaciones: string | null;
  categoria: Categoria;
  subcategoria: Subcategoria | null;
  sucursal: Sucursal | null;
}

interface EditarEliminarGastoProps {
  open: boolean;
  onClose: () => void;
  gastoId: number | null;
  onSuccess: () => void;
}

const EditarEliminarGasto: React.FC<EditarEliminarGastoProps> = ({
  open,
  onClose,
  gastoId,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Estados para el gasto
  const [gasto, setGasto] = useState<Gasto | null>(null);
  const [gastoEditado, setGastoEditado] = useState({
    fecha: new Date(),
    descripcion: '',
    monto: '',
    moneda: 'GS',
    categoriaId: '',
    subcategoriaId: '',
    sucursalId: '',
    observaciones: ''
  });

  // Estados para las opciones
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState<Subcategoria[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    if (open && gastoId) {
      cargarDatos();
    }
  }, [open, gastoId]);

  // Filtrar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (gastoEditado.categoriaId) {
      const subcategoriasFilt = subcategorias.filter(
        s => s.categoriaId === parseInt(gastoEditado.categoriaId)
      );
      setSubcategoriasFiltradas(subcategoriasFilt);
    } else {
      setSubcategoriasFiltradas([]);
    }
  }, [gastoEditado.categoriaId, subcategorias]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar gasto, categorías, subcategorías y sucursales en paralelo
      const [gastoRes, categoriasRes, subcategoriasRes, sucursalesRes] = await Promise.all([
        api.get(`/api/gastos/${gastoId}`),
        api.get('/api/categorias-gastos'),
        api.get('/api/subcategorias-gastos'),
        api.get('/api/sucursales')
      ]);

      const gastoData = gastoRes.data;
      const categoriasData = categoriasRes.data;
      const subcategoriasData = subcategoriasRes.data;
      const sucursalesData = sucursalesRes.data;

      setGasto(gastoData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
      setSucursales(sucursalesData);
      
      // Ajustar el monto según la moneda para mostrarlo correctamente
      let montoAjustado = gastoData.monto.toString();
      if (gastoData.moneda === 'BRL' || gastoData.moneda === 'USD') {
        montoAjustado = (gastoData.monto * 100).toString();
      }

      // Validar que los IDs existan en las opciones disponibles
      const categoriaValida = categoriasData.find((c: Categoria) => c.id === gastoData.categoriaId);
      const subcategoriaValida = gastoData.subcategoriaId ? 
        subcategoriasData.find((s: Subcategoria) => s.id === gastoData.subcategoriaId) : null;
      const sucursalValida = gastoData.sucursalId ? 
        sucursalesData.find((s: Sucursal) => s.id === gastoData.sucursalId) : null;

      setGastoEditado({
        fecha: new Date(gastoData.fecha),
        descripcion: gastoData.descripcion,
        monto: montoAjustado,
        moneda: gastoData.moneda,
        categoriaId: categoriaValida ? gastoData.categoriaId.toString() : '',
        subcategoriaId: subcategoriaValida ? gastoData.subcategoriaId.toString() : '',
        sucursalId: sucursalValida ? gastoData.sucursalId.toString() : '',
        observaciones: gastoData.observaciones || ''
      });

    } catch (err: any) {
      console.error('Error cargando datos del gasto:', err);
      setError(err.response?.data?.error || 'Error al cargar los datos del gasto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo: string, valor: any) => {
    if (campo === 'categoriaId') {
      setGastoEditado({
        ...gastoEditado,
        [campo]: valor,
        subcategoriaId: '' // Reset subcategoría al cambiar categoría
      });
    } else if (typeof valor === 'string' && campo !== 'monto') {
      setGastoEditado({
        ...gastoEditado,
        [campo]: valor.toUpperCase()
      });
    } else {
      setGastoEditado({
        ...gastoEditado,
        [campo]: valor
      });
    }
  };

  const handleEliminar = async () => {
    setConfirmDialogOpen(true);
  };

  const confirmarAnulacion = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    setError(null);

    try {
      await api.delete(`/api/gastos/caja-mayor/eliminar-gasto/${gastoId}`);

      setSuccess('Gasto eliminado correctamente');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error eliminando gasto:', err);
      setError(err.response?.data?.error || 'Error al eliminar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const cancelarAnulacion = () => {
    setConfirmDialogOpen(false);
  };

  const resetForm = () => {
    setGasto(null);
    setGastoEditado({
      fecha: new Date(),
      descripcion: '',
      monto: '',
      moneda: 'GS',
      categoriaId: '',
      subcategoriaId: '',
      sucursalId: '',
      observaciones: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Eliminar Gasto de Caja Mayor
        </Typography>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {gasto && !loading && (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Nota Importante:</strong> La edición de gastos de caja mayor está deshabilitada porque 
                los saldos se manejan de manera destructiva. Modificar un gasto existente afectaría incorrectamente 
                los saldos acumulativos. Solo se permite la eliminación, que crea un movimiento contrario 
                en caja mayor para mantener la trazabilidad histórica.
              </Typography>
            </Alert>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Para modificar este gasto:</strong> Elimínalo desde aquí y crea un nuevo gasto 
                con los valores correctos desde Gestión de Gastos.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha"
                    value={gastoEditado.fecha}
                    onChange={(newValue) => newValue && handleChange('fecha', newValue)}
                    disabled={true}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined"
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled>
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={gastoEditado.moneda}
                    label="Moneda"
                    onChange={(e) => handleChange('moneda', e.target.value)}
                  >
                    <MenuItem value="GS">Guaraníes (GS)</MenuItem>
                    <MenuItem value="USD">Dólares (USD)</MenuItem>
                    <MenuItem value="BRL">Reales (BRL)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Descripción"
                  value={gastoEditado.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  fullWidth
                  disabled={true}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label={`Monto (${gastoEditado.moneda === 'GS' ? 'Guaraníes' : gastoEditado.moneda === 'USD' ? 'Centavos de Dólar' : 'Centavos de Real'})`}
                  value={gastoEditado.monto}
                  onChange={(e) => handleChange('monto', e.target.value)}
                  type="number"
                  fullWidth
                  disabled={true}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={gastoEditado.categoriaId}
                    label="Categoría"
                    onChange={(e) => handleChange('categoriaId', e.target.value)}
                  >
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled>
                  <InputLabel>Subcategoría</InputLabel>
                  <Select
                    value={gastoEditado.subcategoriaId}
                    label="Subcategoría"
                    onChange={(e) => handleChange('subcategoriaId', e.target.value)}
                  >
                    <MenuItem value="">Sin subcategoría</MenuItem>
                    {subcategoriasFiltradas.map((subcategoria) => (
                      <MenuItem key={subcategoria.id} value={subcategoria.id.toString()}>
                        {subcategoria.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={sucursales}
                  getOptionLabel={(option) => option.nombre}
                  value={sucursales.find(s => s.id.toString() === gastoEditado.sucursalId) || null}
                  onChange={(_, newValue) => {
                    handleChange('sucursalId', newValue ? newValue.id.toString() : '');
                  }}
                  disabled={true}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Sucursal"
                      fullWidth
                    />
                  )}
                  noOptionsText="No hay sucursales"
                  clearText="Borrar"
                  openText="Abrir"
                  closeText="Cerrar"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  value={gastoEditado.observaciones}
                  onChange={(e) => handleChange('observaciones', e.target.value)}
                  fullWidth
                  disabled={true}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Button
            onClick={handleEliminar}
            color="error"
            variant="contained"
            disabled={loading || !gasto}
          >
            {loading ? 'Eliminando...' : 'Eliminar Gasto'}
          </Button>
          
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
        </Box>
      </DialogActions>

      {/* Diálogo de confirmación para anular */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon sx={{ color: 'orange', mr: 1 }} />
          Confirmar Eliminación de Gasto
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar este gasto?
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialogOpen(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmarAnulacion}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default EditarEliminarGasto; 