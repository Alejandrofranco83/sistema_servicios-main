import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Stack
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  MonetizationOn as MonetizationOnIcon,
  PointOfSale as PointOfSaleIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cajaMayorService } from '../../services/api';
import { useCotizacion } from '../../contexts/CotizacionContext';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AdminViewProps {
  hasPermission: (modulo: string, pantalla?: string) => boolean;
}

// URL base para las llamadas a la API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Tipo para almacenar detalles de un valor por depositar
interface ValorDepositar {
  monto: number;
  porDepositar: boolean; // true si es Por Depositar, false si es En Haber
}

// Tipo para los movimientos por día de la semana
interface MovimientoDia {
  dia: string;
  montoTotal: number; // Solo mostraremos el monto total
}

const AdminView: React.FC<AdminViewProps> = ({ hasPermission }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { convertirDolaresAGuaranies, convertirRealesAGuaranies, cotizacionVigente } = useCotizacion();
  
  // Estado para el saldo de caja mayor
  const [cargandoSaldo, setCargandoSaldo] = useState<boolean>(true);
  const [saldoCajaMayor, setSaldoCajaMayor] = useState<{
    guaranies: number;
    dolares: number;
    reales: number;
  }>({ guaranies: 0, dolares: 0, reales: 0 });
  
  // Estado para los valores por depositar
  const [cargandoValoresDepositar, setCargandoValoresDepositar] = useState<boolean>(true);
  const [valoresDepositar, setValoresDepositar] = useState<{
    aquipago: ValorDepositar;
    wepaGs: ValorDepositar;
    wepaUsd: ValorDepositar;
  }>({
    aquipago: { monto: 0, porDepositar: false },
    wepaGs: { monto: 0, porDepositar: false },
    wepaUsd: { monto: 0, porDepositar: false }
  });

  // Estado para los movimientos por día de la semana
  const [cargandoMovimientosDia, setCargandoMovimientosDia] = useState<boolean>(true);
  const [movimientosPorDia, setMovimientosPorDia] = useState<MovimientoDia[]>([]);
  // Estado para controlar el offset de semanas (0 = semana actual, -1 = semana anterior, 1 = próxima semana)
  const [semanaOffset, setSemanaOffset] = useState<number>(0);
  // Estado para almacenar el rango de fechas de la semana mostrada
  const [rangoFechas, setRangoFechas] = useState<{ inicio: Date; fin: Date }>({ 
    inicio: new Date(), 
    fin: new Date() 
  });

  // Funciones auxiliares para formatear montos
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('es-PY', {
      maximumFractionDigits: 0
    });
  };

  // Datos de ejemplo para el dashboard
  const estadisticas = {
    totalCajas: 12,
    cajasActivas: 8,
    saldoTotal: 45750000,
    movimientosDiarios: 145,
    pendientesConciliacion: 3
  };

  // Calcular el saldo total en guaraníes (similar a Balance.tsx)
  const calcularSaldoTotalEnGuaranies = (): number => {
    const saldoGuaranies = saldoCajaMayor.guaranies;
    const saldoDolaresEnGuaranies = convertirDolaresAGuaranies(saldoCajaMayor.dolares);
    const saldoRealesEnGuaranies = convertirRealesAGuaranies(saldoCajaMayor.reales);
    
    return saldoGuaranies + saldoDolaresEnGuaranies + saldoRealesEnGuaranies;
  };
  
  // Calcular el total por depositar en guaraníes (solo valores por depositar)
  const calcularTotalPorDepositarGs = (): number => {
    let total = 0;
    
    // Sumar AquiPago solo si es por depositar
    if (valoresDepositar.aquipago.porDepositar) {
      total += valoresDepositar.aquipago.monto;
    }
    
    // Sumar Wepa Gs solo si es por depositar
    if (valoresDepositar.wepaGs.porDepositar) {
      total += valoresDepositar.wepaGs.monto;
    }
    
    return total;
  };

  // Función para formatear fechas en formato dd/mm/yyyy
  const formatearFecha = (fecha: Date): string => {
    return fecha.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para avanzar a la semana siguiente
  const avanzarSemana = () => {
    setSemanaOffset(prev => prev + 1);
  };

  // Función para retroceder a la semana anterior
  const retrocederSemana = () => {
    setSemanaOffset(prev => prev - 1);
  };

  // Función para cargar el balance de Aqui Pago
  const cargarBalanceAquipago = async (): Promise<ValorDepositar> => {
    try {
      // Obtener fecha actual para usar como inicio y fin
      const hoy = new Date();
      const fechaFormateada = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Hacer la llamada a la API con la misma fecha como inicio y fin
      const response = await axios.get(`${API_URL}/aquipago/movimientos`, {
        params: {
          fechaInicio: fechaFormateada,
          fechaFin: fechaFormateada
        }
      });

      // Verificar si la respuesta contiene el valor totalADepositar
      const totalADepositar = response.data.totalADepositar || 0;
      
      // Si es positivo, es por depositar; si es negativo, es en haber
      return {
        monto: Math.abs(totalADepositar),
        porDepositar: totalADepositar > 0
      };
    } catch (error) {
      console.error('Error al cargar el balance de Aqui Pago:', error);
      return { monto: 0, porDepositar: false };
    }
  };

  // Función para cargar el balance de Wepa Gs
  const cargarBalanceWepaGs = async (): Promise<ValorDepositar> => {
    try {
      // Usar el endpoint de balance global
      const response = await axios.get(`${API_URL}/weno-gs/balance-global`);

      // Verificar si la respuesta contiene el valor totalADepositar
      const totalADepositar = response.data.totalADepositar || 0;
      
      // Si es positivo, es por depositar; si es negativo, es en haber
      return {
        monto: Math.abs(totalADepositar),
        porDepositar: totalADepositar > 0
      };
    } catch (error) {
      console.error('Error al cargar el balance de Wepa Gs:', error);
      return { monto: 0, porDepositar: false };
    }
  };

  // Función para cargar el balance de Wepa USD
  const cargarBalanceWepaUsd = async (): Promise<ValorDepositar> => {
    try {
      // Usar el endpoint de balance global
      const response = await axios.get(`${API_URL}/wepa-usd/balance-global`);

      // Verificar si la respuesta contiene el valor totalADepositar
      const totalADepositar = response.data.totalADepositar || 0;
      
      // Si es positivo, es por depositar; si es negativo, es en haber
      return {
        monto: Math.abs(totalADepositar),
        porDepositar: totalADepositar > 0
      };
    } catch (error) {
      console.error('Error al cargar el balance de Wepa USD:', error);
      return { monto: 0, porDepositar: false };
    }
  };

  // Función para cargar los movimientos por día de la semana seleccionada
  const cargarMovimientosPorDiaSemanaActual = async () => {
    setCargandoMovimientosDia(true);
    try {
      // Calcular fechas de inicio y fin de la semana con el offset aplicado
      const hoy = new Date();
      const inicioDeSemana = new Date(hoy);
      inicioDeSemana.setDate(hoy.getDate() - hoy.getDay() + (semanaOffset * 7)); // Domingo de la semana correspondiente
      const finDeSemana = new Date(inicioDeSemana);
      finDeSemana.setDate(inicioDeSemana.getDate() + 6); // Sábado de la semana correspondiente
      
      // Ajustar las horas para incluir todo el día
      inicioDeSemana.setHours(0, 0, 0, 0);
      finDeSemana.setHours(23, 59, 59, 999);

      // Guardar el rango de fechas para mostrar en la interfaz
      setRangoFechas({ inicio: new Date(inicioDeSemana), fin: new Date(finDeSemana) });

      // Convertir a formato YYYY-MM-DD
      const fechaInicio = inicioDeSemana.toISOString().split('T')[0];
      const fechaFin = finDeSemana.toISOString().split('T')[0];

      console.log(`Cargando movimientos de: ${fechaInicio} a ${fechaFin}`);

      // Obtener movimientos de la API para la semana seleccionada
      const response = await axios.get(`${API_URL}/movimientos-caja/all-movimientos`, {
        params: {
          fechaDesde: fechaInicio,
          fechaHasta: fechaFin
        }
      });

      const data = response.data.data || response.data || [];
      
      // Inicializar array de días de la semana
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const diaMap = new Map<string, {montoTotal: number}>();
      
      // Inicializar todos los días de esta semana específica con fechas completas
      const fechasDiaSemana: Record<string, Date> = {};
      for (let i = 0; i < 7; i++) {
        const fecha = new Date(inicioDeSemana);
        fecha.setDate(inicioDeSemana.getDate() + i);
        const diaSemana = diasSemana[i];
        fechasDiaSemana[diaSemana] = fecha;
        diaMap.set(diaSemana, {montoTotal: 0});
      }
      
      // Procesar cada movimiento - asegurarnos que pertenezca al rango de fechas correcto
      data.forEach((mov: any) => {
        if (mov.createdAt) {
          const fechaMovimiento = new Date(mov.createdAt);
          fechaMovimiento.setHours(0, 0, 0, 0); // Normalizar la hora
          
          // Verificar que la fecha esté dentro del rango
          if (fechaMovimiento >= inicioDeSemana && fechaMovimiento <= finDeSemana) {
            // Filtrar solo movimientos en guaraníes (ignorar los de dólares)
            // Verificar si el movimiento es en dólares por la operadora o el servicio
            const esMovimientoEnDolares = 
              (mov.operadora && mov.operadora.toLowerCase().includes('dolar')) ||
              (mov.servicio && mov.servicio.toLowerCase().includes('dolar')) ||
              (mov.moneda && mov.moneda.toLowerCase() === 'usd') ||
              (mov.operadora && mov.operadora.toLowerCase() === 'wepadolares');
            
            // Solo procesar si NO es un movimiento en dólares
            if (!esMovimientoEnDolares) {
              const diaSemana = diasSemana[fechaMovimiento.getDay()];
              const actual = diaMap.get(diaSemana) || {montoTotal: 0};
              
              console.log(`Movimiento del ${fechaMovimiento.toLocaleDateString()} (${diaSemana}): ${mov.monto}`);
              
              // Sumar el monto total (solo guaraníes)
              diaMap.set(diaSemana, {
                montoTotal: actual.montoTotal + Math.abs(parseFloat(mov.monto) || 0)
              });
            }
          } else {
            console.log(`Movimiento fuera de rango: ${fechaMovimiento.toLocaleDateString()} - Rango: ${inicioDeSemana.toLocaleDateString()} a ${finDeSemana.toLocaleDateString()}`);
          }
        }
      });
      
      // Convertir a array para el gráfico
      const movimientosDia = diasSemana.map(dia => ({
        dia,
        montoTotal: diaMap.get(dia)?.montoTotal || 0
      }));
      
      setMovimientosPorDia(movimientosDia);
      console.log('Movimientos por día cargados:', movimientosDia);
    } catch (error) {
      console.error('Error al cargar movimientos por día:', error);
    } finally {
      setCargandoMovimientosDia(false);
    }
  };

  // Cargar los saldos de caja mayor al montar el componente
  useEffect(() => {
    const cargarSaldoCajaMayor = async () => {
      setCargandoSaldo(true);
      try {
        const saldos = await cajaMayorService.getSaldosActuales();
        setSaldoCajaMayor({
          guaranies: saldos.guaranies || 0,
          dolares: saldos.dolares || 0,
          reales: saldos.reales || 0,
        });
      } catch (error) {
        console.error('Error al cargar saldo de caja mayor:', error);
        // Mantener los valores en cero si hay error
      } finally {
        setCargandoSaldo(false);
      }
    };

    cargarSaldoCajaMayor();
  }, []);
   
  // Cargar los valores por depositar al montar el componente
  useEffect(() => {
    const cargarValoresDepositar = async () => {
      setCargandoValoresDepositar(true);
      try {
        // Cargar todos los valores por depositar en paralelo
        const [aquipago, wepaGs, wepaUsd] = await Promise.all([
          cargarBalanceAquipago(),
          cargarBalanceWepaGs(),
          cargarBalanceWepaUsd()
        ]);
        
        setValoresDepositar({
          aquipago,
          wepaGs,
          wepaUsd
        });
        
        console.log('Valores por depositar cargados:', { aquipago, wepaGs, wepaUsd });
      } catch (error) {
        console.error('Error al cargar valores por depositar:', error);
      } finally {
        setCargandoValoresDepositar(false);
      }
    };
    
    cargarValoresDepositar();
  }, []);

  // Recargar los datos cuando cambie el offset de semana
  useEffect(() => {
    cargarMovimientosPorDiaSemanaActual();
  }, [semanaOffset]);

  // Generar texto para mostrar detalle de valores de Wepa USD
  const generarTextoWepaUsd = (): string => {
    if (valoresDepositar.wepaUsd.porDepositar) {
      return `Wepa USD: $${formatCurrency(valoresDepositar.wepaUsd.monto)} (por depositar)`;
    } else if (valoresDepositar.wepaUsd.monto > 0) {
      return `Wepa USD: $${formatCurrency(valoresDepositar.wepaUsd.monto)} (en haber)`;
    } else {
      return 'Wepa USD: $0';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Panel de Administración
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Resumen del sistema de servicios
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'rgba(33, 150, 243, 0.12)',
              color: theme.palette.primary.main,
              borderRadius: 2,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              Valores por Depositar
            </Typography>
            {cargandoValoresDepositar ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress size={30} color="primary" />
              </Box>
            ) : (
              <>
                <Typography variant="h3" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                  Gs. {formatCurrency(calcularTotalPorDepositarGs())}
                </Typography>
                <Typography variant="body2">
                  {generarTextoWepaUsd()}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'rgba(156, 39, 176, 0.12)',
              color: theme.palette.secondary.main,
              borderRadius: 2,
              borderLeft: `4px solid ${theme.palette.secondary.main}`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              Saldo Total
            </Typography>
            {cargandoSaldo ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress size={30} color="secondary" />
              </Box>
            ) : (
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                Gs. {formatCurrency(calcularSaldoTotalEnGuaranies())}
              </Typography>
            )}
            <Typography variant="body2">
              Efectivo en caja mayor
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'rgba(76, 175, 80, 0.12)',
              color: theme.palette.success.main,
              borderRadius: 2,
              borderLeft: `4px solid ${theme.palette.success.main}`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              Cotización Vigente
            </Typography>
            {cotizacionVigente && cotizacionVigente.valorDolar ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  USD: Gs. {formatCurrency(cotizacionVigente.valorDolar)}
                </Typography>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  BRL: Gs. {formatCurrency(cotizacionVigente.valorReal)}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress size={30} color="success" />
              </Box>
            )}
            <Typography variant="body2">
              Valores actuales
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'rgba(255, 152, 0, 0.12)',
              color: theme.palette.warning.main,
              borderRadius: 2,
              borderLeft: `4px solid ${theme.palette.warning.main}`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              Pendientes
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              {estadisticas.pendientesConciliacion}
            </Typography>
            <Typography variant="body2">
              En construcción
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Módulos Principales
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {hasPermission('CAJA_MAYOR', 'BALANCE') && (
                <ListItem button onClick={() => navigate('/caja-mayor/balance')}>
                  <ListItemIcon>
                    <AccountBalanceIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Caja Mayor" secondary="Balance y movimientos" />
                </ListItem>
              )}
              {hasPermission('SALDOS_MONETARIOS', 'VER') && (
                <ListItem button onClick={() => navigate('/saldos-monetarios')}>
                  <ListItemIcon>
                    <MonetizationOnIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Saldos Monetarios" secondary="Control de pagos y servicios" />
                </ListItem>
              )}
              {hasPermission('PDV', 'CAJAS') && (
                <ListItem button onClick={() => navigate('/pdv/cajas')}>
                  <ListItemIcon>
                    <PointOfSaleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Control de Cajas" secondary="Supervisión y diferencias" />
                </ListItem>
              )}
              {hasPermission('RECURSOS_HUMANOS', 'PERSONAS') && (
                <ListItem button onClick={() => navigate('/recursos-humanos')}>
                  <ListItemIcon>
                    <PeopleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Recursos Humanos" secondary="Gestión de personas" />
                </ListItem>
              )}
              {hasPermission('CONFIGURACION', 'USUARIOS') && (
                <ListItem button onClick={() => navigate('/usuarios')}>
                  <ListItemIcon>
                    <SettingsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Configuración" secondary="Usuarios, roles y parámetros" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ 
            bgcolor: '#212121', 
            height: '100%',
            borderRadius: 2,
            boxShadow: theme.shadows[4],
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column',
              p: 2,
              '&:last-child': { pb: 2 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">
                  Movimientos por Día de la Semana
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton 
                    size="small"
                    onClick={retrocederSemana}
                    sx={{ color: theme.palette.grey[500] }}
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  {!cargandoMovimientosDia && (
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px', textAlign: 'center' }}>
                      {formatearFecha(rangoFechas.inicio)} - {formatearFecha(rangoFechas.fin)}
                    </Typography>
                  )}
                  <IconButton 
                    size="small" 
                    onClick={avanzarSemana}
                    sx={{ color: theme.palette.grey[500] }}
                  >
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {cargandoMovimientosDia ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  flexGrow: 1,
                  minHeight: 240
                }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <Box sx={{ 
                  flexGrow: 1, 
                  width: '100%', 
                  height: { xs: 240, sm: 240, md: 260 },
                  mt: 1
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={movimientosPorDia}
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                      <XAxis 
                        dataKey="dia" 
                        stroke="#9e9e9e"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.substring(0, 3)} // Abreviar nombre del día
                      />
                      <YAxis 
                        stroke="#82ca9d"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <RechartsTooltip 
                        formatter={(value: any) => formatCurrency(value) + ' Gs'}
                        contentStyle={{ backgroundColor: '#333333', border: 'none', color: '#e0e0e0' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="montoTotal" 
                        stroke="#82ca9d" 
                        name="Monto Total"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminView; 