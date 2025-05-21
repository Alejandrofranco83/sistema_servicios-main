import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { SucursalProvider } from './contexts/SucursalContext';
import './config/api'; // Importar configuración de Axios

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <SucursalProvider>
          <App />
        </SucursalProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
) 