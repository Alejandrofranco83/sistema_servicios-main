import React, { useState } from 'react';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
  Alert,
  Typography,
  Paper
} from '@mui/material';
import {
  Home as HomeIcon,
  AccountBalance as CajaIcon,
  QrCodeScanner as QRIcon,
  Notifications as NotifIcon
} from '@mui/icons-material';

// Mobile components
import MobileQRScanner from '../components/QR/MobileQRScanner';
import MobileCajas from '../components/Cajas/MobileCajas';
import { MobileAppBar, MobileSidebar } from '../components/Layout';
import { MobileSucursalProvider, useMobileSucursal } from '../contexts/MobileSucursalContext';

// Placeholder components (TODO: Create these)
const MobileNotificaciones: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <NotifIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Notificaciones
      </Typography>
      <Typography color="text.secondary">
        Sistema de notificaciones móviles en desarrollo.
      </Typography>
    </Paper>
  </Box>
);

const MobileHome: React.FC = () => {
  const { sucursalMovil, qrEscaneado } = useMobileSucursal();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ¡Bienvenido!
      </Typography>
      
      {qrEscaneado && sucursalMovil ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🏪 {sucursalMovil.nombre}
          </Typography>
          <Typography>
            Sucursal seleccionada correctamente.<br/>
            Puedes acceder a las funciones de cajas.
          </Typography>
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📱 Inicio Rápido
          </Typography>
          <Typography>
            1. Escanea el QR de la sucursal<br/>
            2. Accede a las cajas móviles<br/>
            3. Gestiona tus operaciones
          </Typography>
        </Alert>
      )}
      
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <HomeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Sistema Móvil
        </Typography>
        <Typography color="text.secondary">
          Gestión de cajas desde tu dispositivo móvil
        </Typography>
      </Paper>
    </Box>
  );
};

// Componente interno que usa el contexto
const MobileAppContent: React.FC = () => {
  const theme = useTheme();
  const [tabActual, setTabActual] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleTabChange = (newTab: number) => {
    setTabActual(newTab);
  };

  const renderContent = () => {
    switch (tabActual) {
      case 0:
        return <MobileHome />;
      case 1:
        return <MobileCajas />;
      case 2:
        return <MobileQRScanner />;
      case 3:
        return <MobileNotificaciones />;
      default:
        return <MobileHome />;
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* AppBar */}
      <MobileAppBar onMenuToggle={handleMenuToggle} />

      {/* Sidebar */}
      <MobileSidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        currentTab={tabActual}
        onTabChange={handleTabChange}
      />

      {/* Contenido principal */}
      <Box sx={{ flex: 1, overflow: 'auto', marginTop: '64px' }}>
        {renderContent()}
      </Box>

      {/* Bottom Navigation */}
      <BottomNavigation
        value={tabActual}
        onChange={(event, newValue) => setTabActual(newValue)}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          '& .MuiBottomNavigationAction-root': {
            color: theme.palette.text.secondary,
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Inicio"
          icon={<HomeIcon />}
        />
        <BottomNavigationAction
          label="Cajas"
          icon={<CajaIcon />}
        />
        <BottomNavigationAction
          label="QR"
          icon={<QRIcon />}
        />
        <BottomNavigationAction
          label="Notificaciones"
          icon={<NotifIcon />}
        />
      </BottomNavigation>
    </Box>
  );
};

// Componente principal con provider
const MobileApp: React.FC = () => {
  return (
    <MobileSucursalProvider>
      <MobileAppContent />
    </MobileSucursalProvider>
  );
};

export default MobileApp; 