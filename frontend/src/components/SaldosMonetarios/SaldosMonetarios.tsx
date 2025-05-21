import React from 'react';
import { Box, Typography, Paper, Grid, Button, Card, CardContent, CardActions } from '@mui/material';
import { Link } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonIcon from '@mui/icons-material/Person';
import CreditCardIcon from '@mui/icons-material/CreditCard';
// Importar los componentes de lista
import BalanceFarmaciaLista from './BalanceFarmaciaLista'; 
import BalancePersonasLista from './BalancePersonasLista'; // Importar la nueva lista

const SaldosMonetarios: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Saldos Monetarios
      </Typography>
      
      <Grid container spacing={3}>
        {/* Tarjeta para Balance con Farmacia */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <AccountBalanceIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
              <Typography variant="h5" component="div" gutterBottom>
                Balance con Farmacia
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gestione los saldos y movimientos entre la empresa y farmacia.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                component={Link} 
                to="/dashboard/saldos-monetarios/balance-farmacia"
                size="large"
              >
                Acceder
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Tarjeta para Balance con Personas */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
              <Typography variant="h5" component="div" gutterBottom>
                Balance con Personas
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gestione los saldos y movimientos de dinero entre la empresa y personas.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                component={Link} 
                to="/dashboard/saldos-monetarios/balance-personas"
                size="large"
              >
                Acceder
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Tarjeta para Aqui Pago */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <CreditCardIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
              <Typography variant="h5" component="div" gutterBottom>
                Aqui Pago
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Administre los pagos y servicios de Aqui Pago.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                component={Link} 
                to="/dashboard/saldos-monetarios/aqui-pago"
                size="large"
              >
                Acceder
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* Aquí se pueden añadir más secciones o componentes si es necesario */}
    </Box>
  );
};

export default SaldosMonetarios; 