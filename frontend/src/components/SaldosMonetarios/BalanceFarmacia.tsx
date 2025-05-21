import React from 'react';
import { Box, Typography, Paper, GlobalStyles } from '@mui/material';
import BalanceFarmaciaLista from './BalanceFarmaciaLista';

const BalanceFarmacia: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Aplicar estilos globales de scrollbar */}
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