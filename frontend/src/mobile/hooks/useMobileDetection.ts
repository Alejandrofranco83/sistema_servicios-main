import { useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isForced: boolean;
  viewport: {
    width: number;
    height: number;
  };
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

export const useMobileDetection = (): DeviceInfo => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const [forceMobile, setForceMobile] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setForceMobile(localStorage.getItem('force_mobile') === 'true');
    
    // Actualizar viewport
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateViewport();
    window.addEventListener('resize', updateViewport);
    
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const isMobile = isSmallScreen || forceMobile;
  
  const deviceInfo: DeviceInfo = {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isForced: forceMobile,
    viewport,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };

  return deviceInfo;
};

// Funciones de utilidad para desarrollo
export const enableMobileForce = () => {
  localStorage.setItem('force_mobile', 'true');
  window.location.reload();
};

export const disableMobileForce = () => {
  localStorage.removeItem('force_mobile');
  window.location.reload();
};

export const toggleMobileForce = () => {
  const isForced = localStorage.getItem('force_mobile') === 'true';
  if (isForced) {
    disableMobileForce();
  } else {
    enableMobileForce();
  }
}; 