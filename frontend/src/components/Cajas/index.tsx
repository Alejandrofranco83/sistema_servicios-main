import React from 'react';
import { CajasProvider } from './CajasContext';
import Cajas from './Cajas';

// Componente que envuelve Cajas con su Provider
const CajasWithProvider: React.FC = () => {
  return (
    <CajasProvider>
      <Cajas />
    </CajasProvider>
  );
};

export default CajasWithProvider; 