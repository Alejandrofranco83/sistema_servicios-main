import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Paper,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Groups as GroupsIcon,
  AssignmentInd as AssignmentIndIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  AccountBalance as AccountBalanceIcon,
  PointOfSale as PointOfSaleIcon,
  Inventory2 as Inventory2Icon,
  CreditCard as CreditCardIcon,
  MonetizationOn as MonetizationOnIcon,
  Calculate as CalculateIcon,
  Image as ImageIcon,
  AttachMoney as AttachMoneyIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  Category as CategoryIcon,
  Notifications as NotificationsIcon,
  Print as PrintIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import Usuarios from '../Usuarios/Usuarios';
import Personas from '../Personas/Personas';
import Roles from '../Roles/Roles';
import Cotizaciones from '../Cotizaciones/Cotizaciones';
import Balance from '../CajaMayor/Balance';
import MovimientosCaja from '../CajaMayor/MovimientosCaja';
import Cajas from '../Cajas';
import ControlCajas from '../PDV/ControlCajas';
import Sucursales from '../Configuracion/Sucursales';
import Maletines from '../Configuracion/Maletines';
import CuentasBancarias from '../Configuracion/CuentasBancarias';
import Pos from '../Configuracion/Pos';
import Aquipago from '../Configuracion/Aquipago';
import WepaGs from '../Configuracion/WepaGs';
import WepaUsd from '../Configuracion/WepaUsd';
import DiferenciasScreen from '../PDV/Diferencias/DiferenciasScreen';
import { useAuth } from '../../contexts/AuthContext';
import ServerStatusIndicator from '../ServerStatusIndicator';
import SaldosMonetarios from '../SaldosMonetarios/SaldosMonetarios';
import BalanceFarmacia from '../SaldosMonetarios/BalanceFarmacia';
import BalancePersonas from '../SaldosMonetarios/BalancePersonas';
import BalanceAquipago from '../SaldosMonetarios/BalanceAquipago';
import BalanceWenoGs from '../SaldosMonetarios/BalanceWenoGs';
import BalanceWepaUsd from '../SaldosMonetarios/BalanceWepaUsd';
import Principal from '../Principal/Principal';
import CarruselConfig from '../Configuracion/CarruselConfig';
import SueldoMinimoComponent from '../SueldoMinimo/SueldoMinimo';
import CargaSueldos from '../RRHH/CargaSueldos';
import ResumenMensual from '../RRHH/ResumenMensual';
import IPS from '../RRHH/IPS';
import CategoriasGastos from '../Configuracion/CategoriasGastos';
import GestionGastos from '../Controles/GestionGastos';
import LucroScreen from '../SaldosMonetarios/LucroScreen';
import ActivoPasivo from '../Controles/ActivoPasivo';
import ControlOperacionBancaria from '../Controles/ControlOperacionBancaria';
import NotificacionesMenu from '../Notificaciones/NotificacionesMenu';
import NotificacionesPage from '../../pages/Notificaciones/NotificacionesPage';
import TestNotificaciones from '../../pages/Notificaciones/TestNotificaciones';
import GestionNotificaciones from '../Configuracion/GestionNotificaciones';
import ImpresorasTermicas from '../Configuracion/ImpresorasTermicas';
import { scrollbarStyles } from '../../utils/scrollbarStyles';

// Definir interfaz para elementos del menú
interface SubMenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  requiredModule?: string;
  requiredAction?: string;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  isExpandable?: boolean;
  subItems?: SubMenuItem[];
  requiredModule?: string;
  requiredAction?: string;
}

// Definir la interfaz para las props
interface DashboardProps {
  // Props de tema eliminadas ya que solo usamos modo oscuro
}

// Constante para la versión del sistema
const SYSTEM_VERSION = 'v1.2.7';

const drawerWidth = 240;

const Dashboard: React.FC<DashboardProps> = () => {
  const [open, setOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Configurar el token para todas las solicitudes
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [navigate]);

  // Expandir el menú Operaciones para el rol OPERADOR
  useEffect(() => {
    if (user && user.rol && user.rol.nombre.toUpperCase() === 'OPERADOR') {
      setExpandedItems(prev => ({
        ...prev,
        'Operaciones': true
      }));
    }
  }, [user]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleToggleSubMenu = (itemText: string) => {
    // Si el sidebar está cerrado, primero lo abrimos
    if (!open) {
      setOpen(true);
      // Programar la expansión del submenú después de abrir el sidebar
      setTimeout(() => {
        // Expandir el elemento seleccionado y contraer todos los demás
        const newExpandedState: { [key: string]: boolean } = {};
        // Establecer todos los elementos como contraídos
        menuItems.forEach(item => {
          if (item.isExpandable) {
            newExpandedState[item.text] = false;
          }
        });
        // Expandir solo el elemento seleccionado (toggle)
        newExpandedState[itemText] = !expandedItems[itemText];
        setExpandedItems(newExpandedState);
      }, 200); // pequeño delay para permitir la animación del sidebar
    } else {
      // Comportamiento cuando el sidebar está abierto
      // Expandir el elemento seleccionado y contraer todos los demás
      const newExpandedState: { [key: string]: boolean } = {};
      // Establecer todos los elementos como contraídos
      menuItems.forEach(item => {
        if (item.isExpandable) {
          newExpandedState[item.text] = false;
        }
      });
      // Expandir solo el elemento seleccionado (toggle)
      newExpandedState[itemText] = !expandedItems[itemText];
      setExpandedItems(newExpandedState);
    }
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  const handleMenuItemClick = (path: string) => {
    if (!open) {
      // Si el sidebar está cerrado, lo abrimos primero
      setOpen(true);
    } else if (path) {
      // Solo navegamos si el sidebar está abierto y hay una ruta
      navigate(path);
      // Contraer el sidebar después de seleccionar una página
      setOpen(false);
    }
  };

  // Definir todos los elementos del menú con sus permisos requeridos
  const allMenuItems: MenuItem[] = [
    { 
      text: 'Principal', 
      icon: <HomeIcon />, 
      path: '/',
      requiredModule: 'PRINCIPAL',
      requiredAction: 'VER'
    },
    { 
      text: 'Caja Mayor', 
      icon: <AccountBalanceIcon />, 
      path: '', 
      isExpandable: true,
      requiredModule: 'CAJA_MAYOR',
      requiredAction: 'BALANCE',
      subItems: [
        { 
          text: 'Balance', 
          icon: <AccountBalanceIcon />, 
          path: 'caja-mayor/balance',
          requiredModule: 'CAJA_MAYOR',
          requiredAction: 'BALANCE'
        }
      ]
    },
    { 
      text: 'Saldos Monetarios', 
      icon: <InventoryIcon />, 
      path: 'saldos-monetarios',
      isExpandable: true,
      requiredModule: 'SALDOS_MONETARIOS',
      requiredAction: 'VER',
      subItems: [
        { 
          text: 'Balance con Farmacia', 
          icon: <AccountBalanceIcon />, 
          path: 'saldos-monetarios/balance-farmacia',
          requiredModule: 'SALDOS_MONETARIOS',
          requiredAction: 'VER'
        },
        { 
          text: 'Balance con Personas', 
          icon: <PersonIcon />, 
          path: 'saldos-monetarios/balance-personas',
          requiredModule: 'SALDOS_MONETARIOS',
          requiredAction: 'VER'
        },
        { 
          text: 'Aqui Pago', 
          icon: <MonetizationOnIcon />, 
          path: 'saldos-monetarios/aqui-pago',
          requiredModule: 'SALDOS_MONETARIOS',
          requiredAction: 'VER'
        },
        { 
          text: 'Wepa Gs', 
          icon: <MonetizationOnIcon />, 
          path: 'saldos-monetarios/weno-gs',
          requiredModule: 'SALDOS_MONETARIOS',
          requiredAction: 'VER'
        },
        { 
          text: 'Wepa USD', 
          icon: <MonetizationOnIcon />, 
          path: 'saldos-monetarios/wepa-usd',
          requiredModule: 'SALDOS_MONETARIOS',
          requiredAction: 'VER'
        },
        { 
          text: 'Lucro', 
          icon: <MonetizationOnIcon />, 
          path: 'saldos-monetarios/lucro',
          requiredModule: 'SALDOS_MONETARIOS',
          requiredAction: 'VER'
        }
      ]
    },
    { 
      text: 'Operaciones', 
      icon: <PointOfSaleIcon />, 
      path: '', 
      isExpandable: true,
      requiredModule: 'OPERACIONES',
      requiredAction: 'CAJAS',
      subItems: [
        { 
          text: 'Cajas', 
          icon: <PointOfSaleIcon />, 
          path: 'cajas',
          requiredModule: 'OPERACIONES',
          requiredAction: 'CAJAS'
        }
      ]
    },
    { 
      text: 'Controles', 
      icon: <AssessmentIcon />, 
      path: '', 
      isExpandable: true,
      requiredModule: 'PDV',
      requiredAction: 'CAJAS',
      subItems: [
        { 
          text: 'Diferencias', 
          icon: <CalculateIcon />,
          path: 'diferencias',
          requiredModule: 'PDV',
          requiredAction: 'CONTROL_CAJAS'
        },
        { 
          text: 'Gastos', 
          icon: <AttachMoneyIcon />,
          path: 'controles/gastos',
          requiredModule: 'PDV',
          requiredAction: 'CONTROL_CAJAS'
        },
        { 
          text: 'Activo/Pasivo', 
          icon: <AccountBalanceIcon />,
          path: 'controles/activo-pasivo',
          requiredModule: 'PDV',
          requiredAction: 'CONTROL_CAJAS'
        },
        { 
          text: 'Control Operación Bancaria', 
          icon: <AccountBalanceIcon />,
          path: 'controles/control-operacion-bancaria',
          requiredModule: 'PDV',
          requiredAction: 'CONTROL_CAJAS'
        }
      ]
    },
    { 
      text: 'RRHH', 
      icon: <GroupsIcon />, 
      path: '', 
      isExpandable: true,
      requiredModule: 'RECURSOS_HUMANOS',
      requiredAction: 'PERSONAS',
      subItems: [
        { 
          text: 'Personas', 
          icon: <PersonIcon />, 
          path: 'recursos-humanos',
          requiredModule: 'RECURSOS_HUMANOS',
          requiredAction: 'PERSONAS'
        },
        { 
          text: 'Carga de Sueldos', 
          icon: <AttachMoneyIcon />, 
          path: 'carga-sueldos',
          requiredModule: 'RECURSOS_HUMANOS',
          requiredAction: 'SUELDOS'
        },
        { 
          text: 'Resumen Mensual', 
          icon: <CalculateIcon />,
          path: 'resumen-mensual',
          requiredModule: 'RECURSOS_HUMANOS',
          requiredAction: 'RESUMEN_MENSUAL'
        },
        { 
          text: 'IPS', 
          icon: <HealthAndSafetyIcon />,
          path: 'ips',
          requiredModule: 'RECURSOS_HUMANOS',
          requiredAction: 'PERSONAS'
        }
      ]
    },
    { 
      text: 'Configuración', 
      icon: <SettingsIcon />, 
      path: '', 
      isExpandable: true,
      requiredModule: 'CONFIGURACION',
      requiredAction: 'USUARIOS',
      subItems: [
        { 
          text: 'Usuarios', 
          icon: <PersonIcon />, 
          path: 'usuarios',
          requiredModule: 'CONFIGURACION',
          requiredAction: 'USUARIOS'
        },
        { 
          text: 'Roles', 
          icon: <AssignmentIndIcon />, 
          path: 'roles',
          requiredModule: 'CONFIGURACION',
          requiredAction: 'ROLES'
        },
        { 
          text: 'Cotizaciones', 
          icon: <CurrencyExchangeIcon />, 
          path: 'cotizaciones',
          requiredModule: 'CONFIGURACION',
          requiredAction: 'COTIZACIONES'
        },
        { 
          text: 'Sucursales', 
          icon: <HomeIcon />, 
          path: 'sucursales',
          requiredModule: 'CONFIGURACION',
          requiredAction: 'SUCURSALES'
        },
        { 
          text: 'Maletines', 
          icon: <Inventory2Icon />, 
          path: 'maletines',
          requiredModule: 'CONFIGURACION',
          requiredAction: 'MALETINES'
        },
        { 
          text: 'Cuentas Bancarias', 
          icon: <AccountBalanceIcon />, 
          path: 'cuentas-bancarias',
          requiredModule: 'CONFIGURACION',
          requiredAction: 'SUCURSALES'
        },
        { 
          text: 'Dispositivos POS', 
          icon: <CreditCardIcon />, 
          path: 'pos',
          requiredModule: 'CONFIGURACION',
          requiredAction: 'SUCURSALES'
        },
        { 
          text: 'Aquipago', 
          icon: <CreditCardIcon />,
          path: 'aquipago',
          requiredModule: 'CONFIGURACION', 
          requiredAction: 'AQUIPAGO'
        },
        { 
          text: 'WEPA GS', 
          icon: <CreditCardIcon />,
          path: 'wepa-gs',
          requiredModule: 'CONFIGURACION', 
          requiredAction: 'AQUIPAGO'
        },
        { 
          text: 'WEPA USD', 
          icon: <CreditCardIcon />,
          path: 'wepa-usd',
          requiredModule: 'CONFIGURACION', 
          requiredAction: 'AQUIPAGO'
        },
        { 
          text: 'Carrusel', 
          icon: <ImageIcon />,
          path: 'carrusel',
          requiredModule: 'CONFIGURACION', 
          requiredAction: 'USUARIOS'
        },
        { 
          text: 'Sueldo Mínimo', 
          icon: <MonetizationOnIcon />, 
          path: 'sueldo-minimo',
          requiredModule: 'CONFIGURACION', 
          requiredAction: 'SUELDO_MINIMO'
        },
        { 
          text: 'Categorías de Gastos', 
          icon: <CategoryIcon />,
          path: 'categorias-gastos',
          requiredModule: 'CONFIGURACION', 
          requiredAction: 'USUARIOS'
        },
        { 
          text: 'Notificaciones', 
          icon: <NotificationsIcon />,
          path: 'gestion-notificaciones',
          requiredModule: 'CONFIGURACION', 
          requiredAction: 'USUARIOS'
        },
        { 
          text: 'Impresoras Térmicas', 
          icon: <PrintIcon />,
          path: 'impresoras-termicas',
          requiredModule: 'CONFIGURACION', 
          requiredAction: 'USUARIOS'
        }
      ]
    },
  ];

  // Filtrar los elementos del menú según los permisos del usuario
  const menuItems = allMenuItems.filter(item => {
    // Siempre mostrar el menú Principal/Home
    if (item.text === 'Principal') {
      return true;
    }

    // Si el usuario tiene rol Operador, mostrar siempre el módulo Operaciones y sus ítems
    if (user && user.rol && user.rol.nombre.toUpperCase() === 'OPERADOR' && item.text === 'Operaciones') {
      // Asegurarnos de mostrar todos los subitems para Operador sin verificar permisos
      if (item.subItems) {
        item.subItems = item.subItems.map(subItem => {
          return subItem;
        });
      }
      return true;
    }

    // Si no requiere permisos específicos, mostrar siempre
    if (!item.requiredModule || !item.requiredAction) {
      return true;
    }

    // Verificar si el usuario tiene permiso para acceder al módulo
    const hasModuleAccess = hasPermission(item.requiredModule, item.requiredAction);
    
    // Si es un elemento expandible, filtrar también sus subelementos
    if (item.isExpandable && item.subItems) {
      // Filtrar subelementos según permisos
      const filteredSubItems = item.subItems.filter(subItem => 
        subItem.requiredModule && subItem.requiredAction 
          ? hasPermission(subItem.requiredModule, subItem.requiredAction)
          : true
      );
      
      // Si después de filtrar no hay subelementos, no mostrar el elemento principal
      if (filteredSubItems.length === 0) {
        return false;
      }
      
      // Actualizar los subelementos con los filtrados
      item.subItems = filteredSubItems;
    }
    
    return hasModuleAccess;
  });

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          width: '100%', // Ocupar todo el ancho siempre
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ marginRight: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src="./logo-farmacia.png"
            alt="Farmacia Franco Logo"
            sx={{
              height: '40px',
              width: 'auto',
              marginRight: 2,
            }}
          />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Sistema de Servicios <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>{SYSTEM_VERSION}</Typography>
          </Typography>
          
          {user && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.username}
            </Typography>
          )}

          {/* Componente de Notificaciones */}
          <NotificacionesMenu />

          {/* Indicador de estado del servidor */}
          <ServerStatusIndicator />
          
          <IconButton color="inherit" onClick={handleLogoutClick}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : theme.spacing(7),
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : theme.spacing(7),
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            position: 'fixed',
            height: 'calc(100% - 64px)', // Altura total menos el AppBar
            top: '64px', // Colocar debajo del AppBar
          },
        }}
      >
        <Box sx={{ 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          ...scrollbarStyles,
        }}>
          <List>
            {menuItems.map((item) => (
              <React.Fragment key={item.text}>
                <ListItem
                  button
                  onClick={() => item.isExpandable 
                    ? handleToggleSubMenu(item.text) 
                    : handleMenuItemClick(item.path)
                  }
                  sx={{
                    minHeight: 40,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      whiteSpace: 'nowrap'
                    }} 
                  />
                  {item.isExpandable && open && (
                    expandedItems[item.text] ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItem>

                {item.isExpandable && item.subItems && (
                  <Collapse in={open && expandedItems[item.text]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <ListItem
                          button
                          key={subItem.text}
                          onClick={() => handleMenuItemClick(subItem.path)}
                          sx={{
                            pl: 3,
                            minHeight: 36,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.03)',
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(0, 0, 0, 0.06)',
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            ))}
          </List>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Divider />
          <List>
            <ListItem
              button
              onClick={handleLogoutClick}
              sx={{
                minHeight: 40,
                justifyContent: open ? 'initial' : 'center',
                px: 2,
                mb: 1,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: theme.palette.error.main,
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Cerrar Sesión" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  color: theme.palette.error.main
                }} 
              />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Contenido Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${theme.spacing(7)}px` },
          mt: '64px', // Espacio para el AppBar
        }}
      >
        {/* Rutas para las diferentes secciones */}
        <Routes>
          <Route path="/" element={<Principal />} />
          <Route path="usuarios" element={
            hasPermission('CONFIGURACION', 'USUARIOS') ? <Usuarios /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="recursos-humanos" element={
            hasPermission('RECURSOS_HUMANOS', 'PERSONAS') ? <Personas /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="carga-sueldos" element={
            hasPermission('RECURSOS_HUMANOS', 'SUELDOS') ? <CargaSueldos /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="ips" element={
            hasPermission('RECURSOS_HUMANOS', 'PERSONAS') ? <IPS /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="roles" element={
            hasPermission('CONFIGURACION', 'ROLES') ? <Roles /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="cotizaciones" element={
            hasPermission('CONFIGURACION', 'COTIZACIONES') ? <Cotizaciones /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="resumen-mensual" element={
            hasPermission('RECURSOS_HUMANOS', 'RESUMEN_MENSUAL') ? <ResumenMensual /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="caja-mayor/balance" element={
            hasPermission('CAJA_MAYOR', 'BALANCE') ? <Balance /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="caja-mayor/movimientos" element={
            hasPermission('CAJA_MAYOR', 'BALANCE') ? <MovimientosCaja /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="pdv/cajas" element={
            hasPermission('PDV', 'CAJAS') ? <Cajas /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="pdv/control-cajas" element={
            hasPermission('PDV', 'CONTROL_CAJAS') ? <ControlCajas /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="diferencias" element={
            hasPermission('PDV', 'CONTROL_CAJAS') ? <DiferenciasScreen /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="saldos-monetarios" element={
            hasPermission('SALDOS_MONETARIOS', 'VER') ? <SaldosMonetarios /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="saldos-monetarios/balance-farmacia" element={
            hasPermission('SALDOS_MONETARIOS', 'VER') ? <BalanceFarmacia /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="saldos-monetarios/balance-personas" element={
            hasPermission('SALDOS_MONETARIOS', 'VER') ? <BalancePersonas /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="saldos-monetarios/aqui-pago" element={
            hasPermission('SALDOS_MONETARIOS', 'VER') ? <BalanceAquipago /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="saldos-monetarios/weno-gs" element={
            hasPermission('SALDOS_MONETARIOS', 'VER') ? <BalanceWenoGs /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="saldos-monetarios/wepa-usd" element={
            hasPermission('SALDOS_MONETARIOS', 'VER') ? <BalanceWepaUsd /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="saldos-monetarios/lucro" element={
            hasPermission('SALDOS_MONETARIOS', 'VER') ? <LucroScreen /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="sucursales" element={
            hasPermission('CONFIGURACION', 'SUCURSALES') ? <Sucursales /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="maletines" element={
            hasPermission('CONFIGURACION', 'MALETINES') ? <Maletines /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="cajas" element={
            (user && user.rol && user.rol.nombre.toUpperCase() === 'OPERADOR') || 
            hasPermission('OPERACIONES', 'CAJAS') ? 
            <Cajas /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="cuentas-bancarias" element={
            hasPermission('CONFIGURACION', 'SUCURSALES') ? <CuentasBancarias /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="pos" element={
            hasPermission('CONFIGURACION', 'SUCURSALES') ? <Pos /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="aquipago" element={
            hasPermission('CONFIGURACION', 'AQUIPAGO') ? <Aquipago /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="wepa-gs" element={
            hasPermission('CONFIGURACION', 'AQUIPAGO') ? <WepaGs /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="wepa-usd" element={
            hasPermission('CONFIGURACION', 'AQUIPAGO') ? <WepaUsd /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="carrusel" element={
            hasPermission('CONFIGURACION', 'USUARIOS') ? <CarruselConfig /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="sueldo-minimo" element={
            hasPermission('SUELDO_MINIMO', 'VER') ? <SueldoMinimoComponent /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="categorias-gastos" element={
            hasPermission('CONFIGURACION', 'USUARIOS') ? <CategoriasGastos /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="gestion-notificaciones" element={
            hasPermission('CONFIGURACION', 'USUARIOS') ? <GestionNotificaciones /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="impresoras-termicas" element={
            hasPermission('CONFIGURACION', 'USUARIOS') ? <ImpresorasTermicas /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="controles/gastos" element={
            hasPermission('PDV', 'CONTROL_CAJAS') ? <GestionGastos /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="controles/activo-pasivo" element={
            hasPermission('PDV', 'CONTROL_CAJAS') ? <ActivoPasivo /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="controles/control-operacion-bancaria" element={
            hasPermission('PDV', 'CONTROL_CAJAS') ? <ControlOperacionBancaria /> : <Navigate to="acceso-denegado" />
          } />
          <Route path="notificaciones" element={<NotificacionesPage />} />
          <Route path="notificaciones/test" element={<TestNotificaciones />} />
          <Route path="acceso-denegado" element={
            <Paper 
              elevation={2}
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: theme.shadows[3],
                backgroundImage: 'linear-gradient(to bottom right, rgba(255,55,55,0.05), rgba(255,55,55,0))'
              }}
            >
              <Typography variant="h4" gutterBottom color="error">
                Acceso Denegado
              </Typography>
              <Typography variant="body1">
                No tienes permisos para acceder a esta sección.
              </Typography>
            </Paper>
          } />
        </Routes>
      </Box>

      {/* Diálogo de confirmación para cerrar sesión */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
      >
        <DialogTitle>{"¿Cerrar sesión?"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas cerrar la sesión?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleLogoutConfirm} color="error" autoFocus>
            Cerrar Sesión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 