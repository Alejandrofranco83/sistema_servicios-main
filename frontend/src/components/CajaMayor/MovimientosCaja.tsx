import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  IconButton
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  ArrowDownward as ArrowDownwardIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  SwapHoriz as SwapHorizIcon,
  CompareArrows as CompareArrowsIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatUtils';
import { useNavigate } from 'react-router-dom';
import RecibirRetiros from './RecibirRetiros';
import PagosServicios from './PagosServicios';
import DepositoBancario from './DepositoBancario';
import UsoDevolucion from './UsoDevolucion';
import CambioMoneda from './CambioMoneda';
import Vales from './Vales';
import axios from 'axios';

// Interfaz para un movimiento de caja
interface Movimiento {
  id: number;
  fecha: string;
  tipo: 'Vales' | 'Cambio' | 'Uso y devolución' | 'Depósito' | 'Pagos de servicios' | 'Retiros' | 'Conteo';
  concepto: string;
  moneda: 'guaranies' | 'dolares' | 'reales';
  ingreso: number;
  egreso: number;
  saldo: number;
}

interface DatosCaja {
  saldoActual: {
    guaranies: number;
    dolares: number;
    reales: number;
  };
  ingresosMes: {
    guaranies: number;
    dolares: number;
    reales: number;
  };
  egresosMes: {
    guaranies: number;
    dolares: number;
    reales: number;
  };
  movimientos: Movimiento[];
}

// Componentes para símbolos de moneda personalizados
const GuaraniesIcon = () => (
  <Box component="span" sx={{ 
    fontWeight: 'bold', 
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24
  }}>
    ₲
  </Box>
);

const RealesIcon = () => (
  <Box component="span" sx={{ 
    fontWeight: 'bold', 
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24
  }}>
    R$
  </Box>
);

const DolaresIcon = () => (
  <Box component="span" sx={{ 
    fontWeight: 'bold', 
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24
  }}>
    $
  </Box>
);

const MovimientosCaja: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monedaActiva, setMonedaActiva] = useState<'guaranies' | 'dolares' | 'reales'>('guaranies');
  const [datosCaja, setDatosCaja] = useState<DatosCaja | null>(null);
  
  // Estados para los diálogos
  const [recibirRetirosOpen, setRecibirRetirosOpen] = useState(false);
  const [pagosServiciosOpen, setPagosServiciosOpen] = useState(false);
  const [depositoOpen, setDepositoOpen] = useState(false);
  const [usoDevolucionOpen, setUsoDevolucionOpen] = useState(false);
  const [cambioMonedaOpen, setCambioMonedaOpen] = useState(false);
  const [valesOpen, setValesOpen] = useState(false);
  
  // Cargar datos reales desde la API - Usar useCallback
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/caja/movimientos');
      
      // Normalizar los datos recibidos de la API
      const rawData = response.data;
      if (rawData && rawData.movimientos) {
        rawData.movimientos = rawData.movimientos.map((movimiento: any) => {
          let monedaNormalizada = movimiento.moneda;
          if (movimiento.moneda === 'PYG') {
            monedaNormalizada = 'guaranies';
          } else if (movimiento.moneda === 'USD') { // Ejemplo si se usara USD
            monedaNormalizada = 'dolares';
          } else if (movimiento.moneda === 'BRL') { // Ejemplo si se usara BRL
            monedaNormalizada = 'reales';
          }
          // Asegurarse que la moneda final sea una de las esperadas por la interfaz Movimiento
          if (!['guaranies', 'dolares', 'reales'].includes(monedaNormalizada)) {
              // Opcional: Manejar caso inesperado, por ahora lo dejamos pasar o lo mapeamos a un default
              console.warn(`Moneda no reconocida recibida: ${movimiento.moneda}`);
              // monedaNormalizada = 'guaranies'; // O asignar un valor por defecto si es necesario
          }
          
          return { ...movimiento, moneda: monedaNormalizada };
        });
      }
      
      setDatosCaja(rawData); // Usar los datos normalizados
      setError(null);
    } catch (err) {
      console.error('Error al cargar los datos de caja:', err);
      setError('Error al cargar los datos de caja. Por favor, intente nuevamente.');
      // Opcional: Podrías querer limpiar los datosCaja aquí también
      // setDatosCaja(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect para la carga inicial
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]); // Añadir cargarDatos como dependencia

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Filtrar movimientos por moneda seleccionada
  const movimientosFiltrados = datosCaja?.movimientos.filter(
    (movimiento) => movimiento.moneda === monedaActiva
  ) || [];

  // Formatear valor según la moneda activa
  const formatearValor = (valor: number): string => {
    switch (monedaActiva) {
      case 'guaranies':
        return formatCurrency.guaranies(valor);
      case 'dolares':
        return formatCurrency.dollars(valor);
      case 'reales':
        return formatCurrency.reals(valor);
      default:
        return formatCurrency.guaranies(valor);
    }
  };

  // Función que retorna el ícono según la moneda
  const getMonedaIcon = (moneda: string) => {
    switch (moneda) {
      case 'guaranies':
        return <GuaraniesIcon />;
      case 'dolares':
        return <DolaresIcon />;
      case 'reales':
        return <RealesIcon />;
      default:
        return <GuaraniesIcon />;
    }
  };

  // Manejadores para los diálogos
  const handleRecibirRetiros = () => {
    setRecibirRetirosOpen(true);
  };
  
  const handleCloseRecibirRetiros = () => {
    setRecibirRetirosOpen(false);
  };
  
  const handlePagosServicios = () => {
    setPagosServiciosOpen(true);
  };
  
  const handleClosePagosServicios = () => {
    setPagosServiciosOpen(false);
  };
  
  const handleDeposito = () => {
    setDepositoOpen(true);
  };
  
  const handleCloseDeposito = () => {
    setDepositoOpen(false);
  };
  
  const handleUsoDevolucion = () => {
    setUsoDevolucionOpen(true);
  };
  
  const handleCloseUsoDevolucion = () => {
    setUsoDevolucionOpen(false);
  };
  
  const handleCambioMoneda = () => {
    setCambioMonedaOpen(true);
  };
  
  const handleCloseCambioMoneda = () => {
    setCambioMonedaOpen(false);
  };

  const handleVales = () => {
    setValesOpen(true);
  };
  
  const handleCloseVales = () => {
    setValesOpen(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Movimientos de Caja
        </Typography>
        
        {/* Botones de acciones */}
        <ButtonGroup variant="outlined" size="small">
          <Button 
            startIcon={<ArrowDownwardIcon />}
            onClick={handleRecibirRetiros}
          >
            Recibir Retiros
          </Button>
          <Button 
            startIcon={<PaymentIcon />}
            onClick={handlePagosServicios}
          >
            Pagos de Servicios
          </Button>
          <Button 
            startIcon={<BankIcon />}
            onClick={handleDeposito}
          >
            Depósito
          </Button>
          <Button 
            startIcon={<SwapHorizIcon />}
            onClick={handleUsoDevolucion}
          >
            Uso/Devolución
          </Button>
          <Button 
            startIcon={<CompareArrowsIcon />}
            onClick={handleCambioMoneda}
          >
            Cambio
          </Button>
          <Button 
            startIcon={<ReceiptIcon />}
            onClick={handleVales}
          >
            Vales
          </Button>
        </ButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : datosCaja ? (
        <>
          {/* Resumen del saldo según moneda seleccionada */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getMonedaIcon(monedaActiva)}
                    <Typography variant="subtitle1" sx={{ ml: 1 }}>
                      Saldo en {monedaActiva === 'guaranies' ? 'Guaraníes' : monedaActiva === 'dolares' ? 'Dólares' : 'Reales'}
                    </Typography>
                  </Box>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatearValor(datosCaja.saldoActual[monedaActiva])}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Ingresos del Mes</Typography>
                  </Box>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatearValor(datosCaja.ingresosMes[monedaActiva])}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Egresos del Mes</Typography>
                  </Box>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {formatearValor(datosCaja.egresosMes[monedaActiva])}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Pestañas para cambiar entre monedas */}
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={monedaActiva}
              onChange={(_event, newValue) => setMonedaActiva(newValue as 'guaranies' | 'dolares' | 'reales')}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                label="Guaraníes"
                value="guaranies"
                icon={<GuaraniesIcon />}
                iconPosition="start"
              />
              <Tab
                label="Reales"
                value="reales"
                icon={<RealesIcon />}
                iconPosition="start"
              />
              <Tab
                label="Dólares"
                value="dolares"
                icon={<DolaresIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Paper>

          {/* Tabla de movimientos según moneda seleccionada */}
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">
                Movimientos en {monedaActiva === 'guaranies' ? 'Guaraníes' : monedaActiva === 'dolares' ? 'Dólares' : 'Reales'}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                color="primary"
              >
                Nuevo Movimiento
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Concepto</TableCell>
                    <TableCell align="right">Ingreso</TableCell>
                    <TableCell align="right">Egreso</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientosFiltrados.length > 0 ? (
                    movimientosFiltrados.map((movimiento) => (
                      <TableRow key={movimiento.id}>
                        <TableCell>{formatDate(movimiento.fecha)}</TableCell>
                        <TableCell>{movimiento.tipo}</TableCell>
                        <TableCell>{movimiento.concepto}</TableCell>
                        <TableCell align="right" sx={{ color: movimiento.ingreso > 0 ? 'success.main' : 'inherit' }}>
                          {movimiento.ingreso > 0 ? formatearValor(movimiento.ingreso) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: movimiento.egreso > 0 ? 'error.main' : 'inherit' }}>
                          {movimiento.egreso > 0 ? formatearValor(movimiento.egreso) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {formatearValor(movimiento.saldo)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay movimientos registrados en esta moneda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No se pudieron cargar los datos de caja.
        </Alert>
      )}
      
      {/* Diálogos - Pasar la función cargarDatos como prop onGuardarExito */}
      <RecibirRetiros 
        open={recibirRetirosOpen} 
        onClose={handleCloseRecibirRetiros} 
        onGuardarExito={cargarDatos} // Pasar la función de recarga
      />
      
      <PagosServicios 
        open={pagosServiciosOpen} 
        onClose={handleClosePagosServicios} 
        onGuardarExito={cargarDatos} // Pasar la función de recarga
      />
      
      <DepositoBancario 
        open={depositoOpen} 
        onClose={handleCloseDeposito} 
        onGuardarExito={cargarDatos} // Pasar la función de recarga
      />
      
      <UsoDevolucion
        open={usoDevolucionOpen}
        onClose={handleCloseUsoDevolucion}
        onGuardarExito={cargarDatos} // Pasar la función de recarga
      />
      
      <CambioMoneda
        open={cambioMonedaOpen}
        onClose={handleCloseCambioMoneda}
        onGuardarExito={cargarDatos} // Pasar la función de recarga
      />
      
      <Vales
        open={valesOpen}
        onClose={handleCloseVales}
        onGuardarExito={cargarDatos} // Pasar la función de recarga
      />
    </Box>
  );
};

export default MovimientosCaja; 