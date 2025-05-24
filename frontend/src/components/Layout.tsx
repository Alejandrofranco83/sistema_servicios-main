import React from 'react';
import { Box } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
  // Props de tema eliminadas ya que solo usamos modo oscuro
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {children}
    </Box>
  );
};

export default Layout; 