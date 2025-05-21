import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import DevolverRetiro from './DevolverRetiro';
import { formatCurrency } from '../../utils/formatUtils';
import axios from 'axios';

// Definir interfaz para los movimientos
interface Movimiento {
  id: string;
  fecha: string;
  tipo: string;
  concepto: string;
  montoPYG: number;
  montoBRL?: number;
  montoUSD?: number;
  esIngreso: boolean;
  saldo?: number;
  retiroId?: string;
  observacion?: string;
}

const MovimientosCajaMayor = () => {
  // Estados existentes para la tabla de movimientos
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para paginación, filtros, etc. (si existen)
  // ... existing code ...
  
  // Estado para controlar el diálogo de devolución de retiro
  const [dialogoDevolverRetiroOpen, setDialogoDevolverRetiroOpen] = useState(false);
  const [retiroIdSeleccionado, setRetiroIdSeleccionado] = useState('');
  
  // Función para cargar movimientos
  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/cajas-mayor/movimientos');
      setMovimientos(response.data);
      
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setError('Error al cargar los movimientos');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar movimientos al montar el componente
  useEffect(() => {
    cargarMovimientos();
  }, []);
  
  // Función para abrir el diálogo de edición existente
  const handleEditar = (movimiento: Movimiento) => {
    // Código existente para editar un movimiento
    // ... existing code ...
  };
  
  // Función para abrir el diálogo de devolución de retiro
  const handleAbrirDialogoDevolverRetiro = (retiroId: string) => {
    setRetiroIdSeleccionado(retiroId);
    setDialogoDevolverRetiroOpen(true);
  };
  
  // Función para cerrar el diálogo de devolución de retiro
  const handleCerrarDialogoDevolverRetiro = () => {
    setDialogoDevolverRetiroOpen(false);
    setRetiroIdSeleccionado('');
  };
  
  // Renderizar acciones para cada fila de movimiento
  const renderAcciones = (movimiento: Movimiento) => {
    // Verificar si el retiro ya ha sido devuelto - hacemos la condición más simple
    const yaFueDevuelto = String(movimiento.concepto || '').includes('[DEVUELTO]');
    
    // Debug para verificar
    console.log(`Movimiento ID: ${movimiento.id}, Tipo: ${movimiento.tipo}, Concepto: ${movimiento.concepto}, Deshabilitado: ${yaFueDevuelto}`);
    
    if (yaFueDevuelto) {
      // Si ya fue devuelto, no mostramos ningún botón
      return (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Retiro ya devuelto">
            <span>
              <IconButton size="small" disabled={true}>
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      );
    }
    
    // Si no fue devuelto, mostrar los botones normales
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Botón de edición existente */}
        <IconButton 
          size="small" 
          color="primary"
          onClick={() => handleEditar(movimiento)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        
        {/* Botón para devolver retiro, visible solo si el tipo es 'Recepción Retiro' */}
        {movimiento.tipo === 'Recepción Retiro' && movimiento.retiroId && (
          <Tooltip title="Devolver Retiro">
            <IconButton
              size="small"
              color="warning"
              onClick={() => handleAbrirDialogoDevolverRetiro(movimiento.retiroId!)}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Movimientos de Caja Mayor
      </Typography>
      
      {/* Filtros, búsquedas, etc. */}
      {/* ... existing code ... */}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell align="right">Ingreso</TableCell>
                <TableCell align="right">Egreso</TableCell>
                <TableCell align="right">Saldo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.map((movimiento) => (
                <TableRow key={movimiento.id}>
                  <TableCell>{movimiento.fecha}</TableCell>
                  <TableCell>{movimiento.tipo}</TableCell>
                  <TableCell>{movimiento.concepto}</TableCell>
                  <TableCell align="right">
                    {movimiento.esIngreso ? formatCurrency.guaranies(movimiento.montoPYG) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {!movimiento.esIngreso ? formatCurrency.guaranies(movimiento.montoPYG) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {movimiento.saldo ? formatCurrency.guaranies(movimiento.saldo) : '-'}
                  </TableCell>
                  <TableCell>
                    {renderAcciones(movimiento)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Diálogos */}
      {/* ... existing code ... */}
      
      {/* Diálogo para devolver retiro */}
      <DevolverRetiro
        open={dialogoDevolverRetiroOpen}
        onClose={handleCerrarDialogoDevolverRetiro}
        onGuardarExito={cargarMovimientos}
        retiroId={retiroIdSeleccionado}
      />
    </Box>
  );
};

export default MovimientosCajaMayor;