import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Typography,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Home as HomeIcon,
  AccountBalance as CajaIcon,
  QrCodeScanner as QRIcon,
  Notifications as NotifIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useMobileSucursal } from '../../contexts/MobileSucursalContext';
import { scrollbarStyles } from '../../../utils/scrollbarStyles';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  currentTab: number;
  onTabChange: (tab: number) => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
  open, 
  onClose, 
  currentTab, 
  onTabChange 
}) => {
  const theme = useTheme();
  const { logout, user } = useAuth();
  const { sucursalMovil, limpiarSucursalMovil } = useMobileSucursal();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [cambiarSucursalDialogOpen, setCambiarSucursalDialogOpen] = React.useState(false);

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, value: 0 },
    { text: 'Cajas', icon: <CajaIcon />, value: 1 },
    { text: 'Escanear QR', icon: <QRIcon />, value: 2 },
    { text: 'Notificaciones', icon: <NotifIcon />, value: 3 },
  ];

  const handleMenuItemClick = (value: number) => {
    onTabChange(value);
    onClose();
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleCambiarSucursalClick = () => {
    setCambiarSucursalDialogOpen(true);
  };

  const handleCambiarSucursalConfirm = () => {
    limpiarSucursalMovil();
    setCambiarSucursalDialogOpen(false);
    onClose(); // Cerrar el sidebar
    // Navegar a la pantalla de QR para escanear nueva sucursal
    onTabChange(2);
  };

  const handleCambiarSucursalCancel = () => {
    setCambiarSucursalDialogOpen(false);
  };

  return (
    <>
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Mejor performance en móvil
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            paddingTop: '64px', // Espacio para el AppBar
          },
        }}
      >
        <Box
          sx={{
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            ...scrollbarStyles,
          }}
        >
                    {/* Información del Usuario */}
          {user && (
            <Box sx={{ p: 2 }}>
              <Paper 
                sx={{ 
                  p: 2, 
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: theme.palette.primary.main, 
                      mr: 2,
                      width: 36,
                      height: 36
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.username}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}

          <Divider />

          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                button
                selected={currentTab === item.value}
                onClick={() => handleMenuItemClick(item.value)}
                sx={{
                  minHeight: 48,
                  px: 2,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    '&:hover': {
                      backgroundColor: theme.palette.action.selected,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: currentTab === item.value 
                      ? theme.palette.primary.main 
                      : theme.palette.text.secondary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    color: currentTab === item.value 
                      ? theme.palette.primary.main 
                      : theme.palette.text.primary,
                  }}
                />
              </ListItem>
            ))}
          </List>

          {/* Espaciador para empujar el logout al final */}
          <Box sx={{ flexGrow: 1 }} />
          
          <Divider />
          
          {/* Información de la Versión */}
          <Box sx={{ p: 2 }}>
            <Paper 
              sx={{ 
                p: 1.5, 
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                textAlign: 'center'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                v1.0.0
              </Typography>
            </Paper>
          </Box>
          
          <Divider />
          
          {/* Botón Cambiar Sucursal - Solo mostrar si hay sucursal seleccionada */}
          {sucursalMovil && (
            <List>
              <ListItem
                button
                onClick={handleCambiarSucursalClick}
                sx={{
                  minHeight: 48,
                  px: 2,
                  color: theme.palette.warning.main,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: theme.palette.warning.main }}>
                  <SwapIcon />
                </ListItemIcon>
                <ListItemText primary="Cambiar Sucursal" />
              </ListItem>
            </List>
          )}
          
          {sucursalMovil && <Divider />}
          
          {/* Botón de Logout */}
          <List>
            <ListItem
              button
              onClick={handleLogoutClick}
              sx={{
                minHeight: 48,
                px: 2,
                color: theme.palette.error.main,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: theme.palette.error.main }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Dialog de confirmación de logout */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">
          Cerrar Sesión
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            ¿Estás seguro de que deseas cerrar sesión?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleLogoutConfirm} color="error" variant="contained">
            Cerrar Sesión
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de cambio de sucursal */}
      <Dialog
        open={cambiarSucursalDialogOpen}
        onClose={handleCambiarSucursalCancel}
        aria-labelledby="cambiar-sucursal-dialog-title"
        aria-describedby="cambiar-sucursal-dialog-description"
      >
        <DialogTitle id="cambiar-sucursal-dialog-title">
          Cambiar Sucursal
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cambiar-sucursal-dialog-description">
            ¿Estás seguro de que deseas cambiar de sucursal? 
            <br /><br />
            Sucursal actual: <strong>{sucursalMovil?.nombre}</strong>
            <br /><br />
            Serás redirigido a la pantalla de escaneo QR para seleccionar una nueva sucursal.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCambiarSucursalCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleCambiarSucursalConfirm} color="warning" variant="contained">
            Cambiar Sucursal
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MobileSidebar; 