import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText 
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import { useAuth } from '../../contexts/AuthContext';

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  return (
    <>
      {/* Operaciones */}
      {hasPermission('OPERACIONES', 'CAJAS') && (
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => navigate('/dashboard/cajas')} 
            selected={location.pathname === '/dashboard/cajas'}
          >
            <ListItemIcon>
              <PointOfSaleIcon />
            </ListItemIcon>
            <ListItemText primary="Cajas" />
          </ListItemButton>
        </ListItem>
      )}
    </>
  );
};

export default Menu; 