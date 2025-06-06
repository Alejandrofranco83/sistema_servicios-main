import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  GlobalStyles,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  AttachMoney as AttachMoneyIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  Close as CloseIcon,
  MonetizationOn as MonetizationOnIcon,
  Payment as PaymentIcon,
  FilterAlt as FilterAltIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCajas } from './CajasContext';
import { formatearIdCaja, formatearMontoConSeparadores } from './helpers';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Importar componentes refactorizados
import { ListaRetiros } from './CajasRetiros';
import { ListaOperaciones } from './OperacionesBancarias';
import { FormApertura } from './CajasApertura';
import { FormCierre } from './CajasCierre';
import { DetalleDialog } from './CajasDetalle';
import { VerAperturaDialog } from './CajasApertura/VerDatosApertura';
import { VerMovimientosDialog, PagosDialog, ListaPagos } from './CajasMovimientos';

const Cajas: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isOperador = user && user.rol && user.rol.nombre.toUpperCase() === 'OPERADOR';
  const isAdmin = user && user.rol && user.rol.nombre.toUpperCase() === 'ADMINISTRADOR';

  const {
    errorMessage,
    successMessage,
    setErrorMessage,
    setSuccessMessage,
    loading,
    cajas,
    tabIndex,
    setTabIndex,
    handleVerDetalle,
    handleRetiros,
    handleVerOperacionesBancarias,
    handleCerrarCaja,
    handleNuevaCaja,
    handleVerApertura,
    handleVerMovimientos,
    handlePagos,
    listaRetirosDialogOpen,
    setListaRetirosDialogOpen,
    operacionesBancariasDialogOpen,
    setOperacionesBancariasDialogOpen,
    confirmarEliminarRetiroId,
    setConfirmarEliminarRetiroId,
    confirmarEliminacionRetiro,
    cancelarEliminacionRetiro,
    dialogAperturaOpen,
    dialogCierreOpen,
    dialogDetalleOpen,
    dialogVerAperturaOpen,
    dialogVerMovimientosOpen,
    dialogPagosOpen,
    setDialogAperturaOpen,
    setDialogCierreOpen,
    setDialogDetalleOpen,
    setDialogVerAperturaOpen,
    setDialogVerMovimientosOpen,
    setDialogPagosOpen,
    listaPagosDialogOpen,
    setListaPagosDialogOpen,
    confirmarEliminarPagoId,
    setConfirmarEliminarPagoId,
    confirmarEliminacionPago,
    cancelarEliminacionPago,
    cajaSeleccionada
  } = useCajas();

  // Estado para el filtro de fechas
  const [fechaDesde, setFechaDesde] = React.useState<string>("");
  const [fechaHasta, setFechaHasta] = React.useState<string>("");
  const [filtroActivado, setFiltroActivado] = React.useState<boolean>(false);
  
  // Nuevo estado para el filtro por sucursal
  const [sucursales, setSucursales] = React.useState<{id: string, nombre: string}[]>([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = React.useState<string>("");
  const [loadingSucursales, setLoadingSucursales] = React.useState<boolean>(false);

  // Estados para la paginación
  const [page, setPage] = React.useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(50);

  // Ref para controlar si ya se procesó el parámetro openDetail
  const openDetailProcessed = React.useRef<boolean>(false);

  // Efecto para detectar parámetro openDetail en la URL
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const openDetailParam = searchParams.get('openDetail');
    
    // Solo procesar si hay parámetro, no se ha procesado antes y hay cajas cargadas
    if (openDetailParam && !openDetailProcessed.current && cajas.length > 0) {
      const cajaId = parseInt(openDetailParam, 10);
      const cajaEncontrada = cajas.find(caja => caja.cajaEnteroId === cajaId);
      
      if (cajaEncontrada) {
        // Marcar como procesado antes de abrir el detalle
        openDetailProcessed.current = true;
        
        // Abrir el detalle de la caja encontrada
        handleVerDetalle(cajaEncontrada);
        
        // Limpiar el parámetro de la URL sin recargar la página
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else {
        // Si no se encuentra la caja, mostrar mensaje de error
        setErrorMessage(`No se encontró la caja con ID ${cajaId}`);
        openDetailProcessed.current = true;
        
        // Limpiar el parámetro de la URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [location.search, cajas.length]); // Solo depender de location.search y cajas.length

  // Resetear el flag cuando cambia la URL sin parámetro openDetail
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const openDetailParam = searchParams.get('openDetail');
    
    if (!openDetailParam) {
      openDetailProcessed.current = false;
    }
  }, [location.search]);

  // Cargar sucursales al iniciar para el filtro
  React.useEffect(() => {
    const cargarSucursales = async () => {
      if (isAdmin) {
        try {
          setLoadingSucursales(true);
          const response = await api.get('/api/sucursales');
          if (response.data && Array.isArray(response.data)) {
            // Agregar opción "Todas" al inicio
            const sucursalesConTodas = [
              { id: "", nombre: "Todas las Sucursales" },
              ...response.data.map((s: any) => ({ id: s.id, nombre: s.nombre }))
            ];
            setSucursales(sucursalesConTodas);
          }
        } catch (error) {
          console.error('Error al cargar sucursales:', error);
        } finally {
          setLoadingSucursales(false);
        }
      }
    };
    
    cargarSucursales();
  }, [isAdmin]);

  // Manejador para cambio de pestaña
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    // Resetear paginación al cambiar de pestaña
    setPage(0);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setSucursalSeleccionada("");
    setFiltroActivado(false);
    // Resetear paginación al limpiar filtros
    setPage(0);
  };

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    setFiltroActivado(true);
    // Resetear paginación al aplicar filtros
    setPage(0);
  };

  // Manejadores de paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Función para filtrar cajas por fecha
  const filtrarCajasPorFecha = (cajasFiltradas: any[]) => {
    // Si hay filtro activado por el usuario, aplicarlo
    if (filtroActivado) {
      return cajasFiltradas.filter(caja => {
        const fechaAperturaCaja = new Date(caja.fechaApertura);
        let cumpleFiltro = true;

        // Aplicar filtro de sucursal solo si está activado el filtro y hay una sucursal seleccionada
        if (isAdmin && sucursalSeleccionada) {
          cumpleFiltro = cumpleFiltro && caja.sucursalId === sucursalSeleccionada;
        }

        if (fechaDesde) {
          const fechaDesdeString = fechaDesde + "T00:00:00";
          const fechaDesdeObj = new Date(fechaDesdeString);
          cumpleFiltro = cumpleFiltro && fechaAperturaCaja >= fechaDesdeObj;
        }

        if (fechaHasta) {
          const fechaHastaString = fechaHasta + "T23:59:59";
          const fechaHastaObj = new Date(fechaHastaString);
          cumpleFiltro = cumpleFiltro && fechaAperturaCaja <= fechaHastaObj;
        }

        return cumpleFiltro;
      });
    }

    // Si el usuario es operador, aplicar restricciones adicionales
    if (isOperador) {
      return cajasFiltradas.filter(caja => {
        // 1. Solo mostrar cajas del usuario logueado (comparar IDs)
        const esCajaDelUsuario = caja.usuarioId === user?.id?.toString();
        
        // 2. Solo mostrar cajas del día actual
        const fechaAperturaCaja = new Date(caja.fechaApertura);
        const fechaActual = new Date();
        
        // Comparar solo año, mes y día
        const esMismoDia = fechaAperturaCaja.getFullYear() === fechaActual.getFullYear() &&
                           fechaAperturaCaja.getMonth() === fechaActual.getMonth() &&
                           fechaAperturaCaja.getDate() === fechaActual.getDate();
        
        // Para depuración
        console.log("Caja:", caja.id, "Usuario ID:", caja.usuarioId, "Usuario actual ID:", user?.id?.toString(), "Usuario actual:", user?.username);
        console.log("Es caja del usuario:", esCajaDelUsuario, "Es mismo día:", esMismoDia);
        
        return esCajaDelUsuario && esMismoDia;
      });
    }

    // Si no es operador o no hay filtros, devolver todas las cajas
    return cajasFiltradas;
  };

  // Obtener cajas filtradas y aplicar paginación
  const cajasFiltradas = filtrarCajasPorFecha(
    cajas.filter(caja => {
      if (!isOperador) {
        // Filtros para administradores (existentes)
        if (tabIndex === 1) return caja.estado === 'abierta';
        if (tabIndex === 2) return caja.estado === 'cerrada';
        return true;
      } else {
        // Para operadores, mostrar todas sus cajas del día
        return true;
      }
    })
  );

  // Aplicar paginación
  const cajasPaginadas = cajasFiltradas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl">
      {/* Aplicar estilos globales de scrollbar a toda la aplicación */}
      <GlobalStyles
        styles={{
          '*::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: '#121212', // Casi negro
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: '#333', // Gris muy oscuro
            borderRadius: '6px',
            '&:hover': {
              backgroundColor: '#444', // Ligeramente más claro al pasar el mouse
            },
          },
          'html': {
            scrollbarColor: '#333 #121212', // Formato: thumb track
            scrollbarWidth: 'thin',
          },
          'body': {
            scrollbarColor: '#333 #121212',
            scrollbarWidth: 'thin',
          }
        }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
        <Typography variant="h4" component="h1">
          {isOperador ? "Panel de Operaciones" : (user && user.rol && user.rol.nombre.toUpperCase() === 'ADMINISTRADOR' ? "Cajas de Todas las Sucursales" : "Cajas")}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleNuevaCaja}
          >
            Nueva Caja
          </Button>
        </Box>
      </Box>

      {/* Panel de filtros - sólo visible para administradores */}
      {!isOperador && (
        <>
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={tabIndex} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Todas las Cajas" />
              <Tab label="Cajas Abiertas" />
              <Tab label="Cajas Cerradas" />
            </Tabs>
          </Paper>

          {/* Filtro por fecha y sucursal en una sola fila */}
          <Paper sx={{ mb: 3, p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Filtro de sucursal - sólo para administradores */}
              {isAdmin && (
                <Grid item xs={12} sm={4} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="sucursal-select-label">Sucursal</InputLabel>
                    <Select
                      labelId="sucursal-select-label"
                      id="sucursal-select"
                      value={sucursalSeleccionada}
                      label="Sucursal"
                      onChange={(e) => setSucursalSeleccionada(e.target.value)}
                      disabled={loadingSucursales}
                    >
                      {sucursales.map((sucursal) => (
                        <MenuItem key={sucursal.id} value={sucursal.id}>
                          {sucursal.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} sm={4} md={isAdmin ? 2 : 3}>
                <TextField
                  label="Fecha Desde"
                  type="date"
                  fullWidth
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  InputProps={{ 
                    inputProps: { 
                      max: fechaHasta || undefined 
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={isAdmin ? 2 : 3}>
                <TextField
                  label="Fecha Hasta"
                  type="date"
                  fullWidth
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  InputProps={{ 
                    inputProps: { 
                      min: fechaDesde || undefined 
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={isAdmin ? 6 : 6}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<FilterAltIcon />}
                    onClick={aplicarFiltros}
                    disabled={!fechaDesde && !fechaHasta && !sucursalSeleccionada}
                  >
                    Aplicar Filtros
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={limpiarFiltros}
                    disabled={!filtroActivado && !fechaDesde && !fechaHasta && !sucursalSeleccionada}
                  >
                    Limpiar Filtros
                  </Button>
                </Box>
              </Grid>
            </Grid>
            {filtroActivado && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box>
                    Filtro aplicado: 
                    {sucursalSeleccionada && ` Sucursal: ${sucursales.find(s => s.id === sucursalSeleccionada)?.nombre}`}
                    {fechaDesde && ` Desde ${fechaDesde.split('-').reverse().join('/')}`}
                    {fechaHasta && ` Hasta ${fechaHasta.split('-').reverse().join('/')}`}
                  </Box>
                </Alert>
              </Box>
            )}
          </Paper>
        </>
      )}

      {/* Mensaje para operadores */}
      {isOperador && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Alert severity="info" icon={<IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton>}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Información de filtrado actual:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <li>Mostrando solo las cajas del usuario: <strong>{user?.username}</strong></li>
                <li>Mostrando solo las cajas del día: <strong>{new Date().toLocaleDateString()}</strong></li>
              </Box>
            </Box>
          </Alert>
        </Paper>
      )}

      {/* Mensajes de error y éxito */}
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setErrorMessage(null)} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Progreso de carga */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Información de resultados */}
      {!loading && cajasFiltradas.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Mostrando {cajasPaginadas.length} de {cajasFiltradas.length} cajas
            {cajasFiltradas.length > rowsPerPage && ` (Página ${page + 1} de ${Math.ceil(cajasFiltradas.length / rowsPerPage)})`}
          </Typography>
        </Box>
      )}

      {/* Tabla de cajas */}
      {!loading && cajasFiltradas.length === 0 ? (
        <Alert severity="info">
          No hay cajas disponibles para mostrar.
        </Alert>
      ) : (
        !loading && (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Sucursal</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Fecha Apertura</TableCell>
                    <TableCell>Fecha Cierre</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cajasPaginadas.map((caja) => (
                    <TableRow key={caja.id}>
                      <TableCell>{caja.cajaEnteroId}</TableCell>
                      <TableCell>{caja.sucursal?.nombre || 'N/A'}</TableCell>
                      <TableCell>{caja.usuario}</TableCell>
                      <TableCell>
                        {new Date(caja.fechaApertura).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {caja.fechaCierre ? new Date(caja.fechaCierre).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: caja.estado === 'abierta' ? 'success.light' : 'error.light',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {caja.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver Detalles">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleVerDetalle(caja)}
                            sx={{ marginRight: 1 }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Ver Datos de Apertura">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleVerApertura(caja)}
                            sx={{ marginRight: 1 }}
                          >
                            <MonetizationOnIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Ver Movimientos">
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={() => handleVerMovimientos(caja)}
                            sx={{ marginRight: 1 }}
                          >
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Retiros">
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={() => handleRetiros(caja)}
                            sx={{ marginRight: 1 }}
                          >
                            <AttachMoneyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Operaciones Bancarias">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleVerOperacionesBancarias(caja)}
                            sx={{ marginRight: 1 }}
                          >
                            <AccountBalanceIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Pagos">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handlePagos(caja)}
                            sx={{ marginRight: 1 }}
                          >
                            <PaymentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={caja.estado === 'abierta' ? "Cerrar Caja" : "Editar Cierre"}>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleCerrarCaja(caja)}
                            sx={{ marginRight: 1 }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            <TablePagination
              rowsPerPageOptions={[50, 100]}
              component="div"
              count={cajasFiltradas.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              sx={{
                borderTop: 1,
                borderColor: 'divider',
                '& .MuiTablePagination-toolbar': {
                  paddingLeft: 2,
                  paddingRight: 2,
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  marginBottom: 0,
                },
              }}
            />
          </Paper>
        )
      )}

      {/* Diálogos de la aplicación */}
      {/* Diálogo de apertura de caja */}
      <FormApertura 
        open={dialogAperturaOpen} 
        onClose={() => setDialogAperturaOpen(false)} 
      />
      
      {/* Diálogo de cierre de caja */}
      <FormCierre 
        open={dialogCierreOpen} 
        onClose={() => setDialogCierreOpen(false)} 
      />
      
      {/* Diálogo de detalle de caja */}
      <DetalleDialog 
        open={dialogDetalleOpen} 
        onClose={() => setDialogDetalleOpen(false)} 
      />
      
      {/* Diálogo de apertura */}
      <VerAperturaDialog
        open={dialogVerAperturaOpen}
        onClose={() => setDialogVerAperturaOpen(false)}
      />
      
      {/* Diálogo de Ver Movimientos */}
      <VerMovimientosDialog
        open={dialogVerMovimientosOpen}
        onClose={() => setDialogVerMovimientosOpen(false)}
      />

      {/* Diálogo de Pagos */}
      <PagosDialog
        open={dialogPagosOpen}
        onClose={() => setDialogPagosOpen(false)}
      />
      
      {/* Diálogo de Lista de Pagos */}
      <ListaPagos
        open={listaPagosDialogOpen}
        onClose={() => setListaPagosDialogOpen(false)}
      />
      
      {/* Diálogo de Lista de Retiros */}
      <ListaRetiros
        open={listaRetirosDialogOpen}
        onClose={() => setListaRetirosDialogOpen(false)}
      />
      
      {/* Diálogo de Lista de Operaciones Bancarias */}
      <ListaOperaciones
        open={operacionesBancariasDialogOpen}
        onClose={() => setOperacionesBancariasDialogOpen(false)}
      />
      
      {/* Diálogo de Confirmación para eliminar retiro */}
      <Dialog
        open={!!confirmarEliminarRetiroId}
        onClose={cancelarEliminacionRetiro}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar este retiro? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelarEliminacionRetiro} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmarEliminacionRetiro} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cajas; 