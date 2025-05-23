import React from 'react';
import { Box, Typography, Paper, GlobalStyles } from '@mui/material';
import BalanceFarmaciaLista from './BalanceFarmaciaLista';
import { globalScrollbarStyles } from '../../utils/scrollbarStyles';

const BalanceFarmacia: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Aplicar estilos globales de scrollbar */}
      <GlobalStyles styles={globalScrollbarStyles} />
      
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Balance con Farmacia
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        <BalanceFarmaciaLista />
      </Paper>
    </Box>
  );
};

export default BalanceFarmacia; 