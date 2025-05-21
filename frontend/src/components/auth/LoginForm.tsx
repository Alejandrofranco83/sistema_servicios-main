import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  width: '100%',
  padding: theme.spacing(2),
  margin: 'auto',
  marginTop: theme.spacing(8),
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(2),
  },
}));

const LoginForm: React.FC = () => {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.toUpperCase(),
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Error de autenticación');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Aquí puedes redirigir al usuario a la página principal
    } catch (error) {
      console.error('Error en login:', error);
      // Aquí puedes mostrar un mensaje de error al usuario
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(45deg, #1a237e 30%, #311b92 90%)'
          : 'linear-gradient(45deg, #bbdefb 30%, #e3f2fd 90%)',
      }}
    >
      <StyledCard>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Sistema de Servicios
          </Typography>
          <Typography variant="h6" gutterBottom align="center" color="textSecondary">
            Iniciar Sesión
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Usuario"
              name="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toUpperCase() })}
              variant="outlined"
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              variant="outlined"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              sx={{ mt: 3 }}
            >
              Ingresar
            </Button>
          </form>
        </CardContent>
      </StyledCard>
    </Box>
  );
};

export default LoginForm; 