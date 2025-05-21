import React from 'react';
import { Box, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

interface LayoutProps {
  children: React.ReactNode;
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, onToggleTheme, isDarkMode }) => {
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <IconButton
        onClick={onToggleTheme}
        sx={{
          position: 'fixed',
          right: 20,
          top: 20,
          backgroundColor: 'background.paper',
          boxShadow: 2,
          '&:hover': {
            backgroundColor: 'background.paper',
          }
        }}
      >
        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
      {children}
    </Box>
  );
};

export default Layout; 