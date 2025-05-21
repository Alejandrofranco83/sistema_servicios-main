import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Box,
  CircularProgress
} from '@mui/material';
import OperadorView from './OperadorView';
import AdminView from './AdminView';

const Principal: React.FC = () => {
  const { user, loading, hasPermission } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Determinar si el usuario es administrador o no
    if (user && user.rol) {
      const rolName = user.rol.nombre.toUpperCase();
      setIsAdmin(rolName === 'ADMINISTRADOR' || user.rol.permisos.some(p => 
        p.modulo === 'CONFIGURACION' && ['USUARIOS', 'ROLES', 'SUCURSALES'].includes(p.pantalla)
      ));
    }
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {isAdmin 
        ? <AdminView hasPermission={hasPermission} /> 
        : <OperadorView username={user?.username || 'Usuario'} />
      }
    </Box>
  );
};

export default Principal; 