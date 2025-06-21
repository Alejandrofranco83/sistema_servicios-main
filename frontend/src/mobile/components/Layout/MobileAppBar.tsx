import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Typography,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';

interface MobileAppBarProps {
  onMenuToggle: () => void;
}

const MobileAppBar: React.FC<MobileAppBarProps> = ({ onMenuToggle }) => {
  const theme = useTheme();

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        width: '100%',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuToggle}
          edge="start"
          sx={{ marginRight: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box
          component="img"
          src="/logo-farmacia.png"
          alt="Farmacia Franco Logo"
          sx={{
            height: '28px',
            width: 'auto',
            marginRight: 1,
          }}
        />
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontSize: '1.1rem',
            fontWeight: 500
          }}
        >
          Sistema Móvil
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default MobileAppBar; 