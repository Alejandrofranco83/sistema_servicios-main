import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './components/Login';
import UpdateNotification from './components/UpdateNotification';
import api from './services/api'; // Usar instancia api global
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CotizacionProvider } from './contexts/CotizacionContext';
import { SucursalProvider } from './contexts/SucursalContext';
import { ServerStatusProvider } from './contexts/ServerStatusContext';

// Al iniciar la aplicación, verificar si hay un token guardado
const token = localStorage.getItem('token');
if (token) {
  // Configurar el token para todas las solicitudes usando la instancia api
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Interceptor para manejar respuestas de error de autenticación usando la instancia api
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error(
        `%c[Interceptor Auth Error] ${error.response.status} en ${error.config.method?.toUpperCase()} ${error.config.url}`,
        'color: red; font-weight: bold;'
      );
      console.error('[Interceptor Auth Error] Respuesta del servidor:', error.response.data);
      console.error('[Interceptor Auth Error] Configuración de la petición:', error.config);
      
      if (error.config.url && (error.config.url.includes('/api/rrhh/') || error.config.url.includes('/api/personas'))) {
        console.warn('[Interceptor] Ignorando error de autenticación en módulo RRHH/Personas para debugging');
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        // Es crucial que esta línea NO cause problemas durante el build.
        // Si lo hace, necesitará ser movida a un lugar donde solo se ejecute en el cliente.
        if (typeof window !== 'undefined') { // Asegurar que solo se ejecute en el navegador
            window.location.hash = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const App: React.FC = () => {
  const mode: 'dark' = 'dark'; // Siempre usar modo oscuro

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#1976d2' },
          secondary: { main: '#dc004e' },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <CotizacionProvider>
            <SucursalProvider>
              <ServerStatusProvider>
                <UpdateNotification />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/*" element={<Dashboard />} />
                  </Route>
                </Routes>
              </ServerStatusProvider>
            </SucursalProvider>
          </CotizacionProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;