import React, { useState } from 'react';
import { Box, Typography, Grid, TextField, Button, Stack, GlobalStyles } from '@mui/material';
import DiferenciaMaletinesList from './DiferenciaMaletinesList';
import DiferenciaSaldosCajasList from './DiferenciaSaldosCajasList';
import DiferenciaEnCajaList from './DiferenciaEnCajaList';
import { globalScrollbarStyles } from '../../../utils/scrollbarStyles';

const DiferenciasScreen: React.FC = () => {
  const [globalCajaNroInput, setGlobalCajaNroInput] = useState<string>('');
  const [globalCajaNroFilter, setGlobalCajaNroFilter] = useState<string>('');

  const handleFiltrarClick = () => {
    setGlobalCajaNroFilter(globalCajaNroInput);
  };

  const handleLimpiarClick = () => {
    setGlobalCajaNroInput('');
    setGlobalCajaNroFilter('');
  };

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      {/* Aplicar estilos globales de scrollbar */}
      <GlobalStyles styles={globalScrollbarStyles} />
      
      <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
        Análisis de Diferencias
      </Typography>

      <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Caja Nro (Global)"
            variant="outlined"
            size="small"
            type="number"
            value={globalCajaNroInput}
            onChange={(e) => setGlobalCajaNroInput(e.target.value)}
            sx={{ maxWidth: 150 }}
          />
          <Button variant="contained" onClick={handleFiltrarClick}>
            Filtrar
          </Button>
          <Button variant="outlined" onClick={handleLimpiarClick}>
            Limpiar
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={4}>
          <DiferenciaMaletinesList propGlobalCajaFilter={globalCajaNroFilter} />
        </Grid>
        <Grid item xs={12} md={4}>
          <DiferenciaSaldosCajasList propGlobalCajaFilter={globalCajaNroFilter} />
        </Grid>
        <Grid item xs={12} md={4}>
          <DiferenciaEnCajaList propGlobalCajaFilter={globalCajaNroFilter} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DiferenciasScreen;