import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Importar el servicio de depuración
import './services/debugService';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 