import { useState, useEffect, useCallback } from 'react';

export interface ZoomControls {
  zoomLevel: number;
  zoomPercentage: number;
  isElectron: boolean;
  zoomIn: () => Promise<void>;
  zoomOut: () => Promise<void>;
  resetZoom: () => Promise<void>;
  setZoomLevel: (level: number) => Promise<void>;
}

/**
 * Hook personalizado para manejar el zoom en aplicaciones Electron
 * Proporciona controles de zoom que persisten entre sesiones
 */
export const useElectronZoom = (): ZoomControls => {
  const [zoomLevel, setZoomLevelState] = useState<number>(0);
  const [isElectron] = useState<boolean>(
    () => typeof window !== 'undefined' && window.zoomAPI !== undefined
  );

  // Calcular porcentaje de zoom basado en el nivel
  // Nivel 0 = 100%, cada 0.5 niveles = ~12% más/menos
  const zoomPercentage = Math.round(Math.pow(1.2, zoomLevel) * 100);

  // Cargar el nivel de zoom inicial
  useEffect(() => {
    if (isElectron && window.zoomAPI) {
      window.zoomAPI.getZoomLevel()
        .then(level => {
          setZoomLevelState(level);
        })
        .catch(err => {
          console.warn('Error al obtener nivel de zoom:', err);
        });
    }
  }, [isElectron]);

  // Función para aumentar zoom
  const zoomIn = useCallback(async () => {
    if (isElectron && window.zoomAPI) {
      try {
        const newLevel = await window.zoomAPI.zoomIn();
        setZoomLevelState(newLevel);
      } catch (err) {
        console.error('Error al aumentar zoom:', err);
      }
    }
  }, [isElectron]);

  // Función para disminuir zoom
  const zoomOut = useCallback(async () => {
    if (isElectron && window.zoomAPI) {
      try {
        const newLevel = await window.zoomAPI.zoomOut();
        setZoomLevelState(newLevel);
      } catch (err) {
        console.error('Error al disminuir zoom:', err);
      }
    }
  }, [isElectron]);

  // Función para resetear zoom
  const resetZoom = useCallback(async () => {
    if (isElectron && window.zoomAPI) {
      try {
        const newLevel = await window.zoomAPI.resetZoom();
        setZoomLevelState(newLevel);
      } catch (err) {
        console.error('Error al resetear zoom:', err);
      }
    }
  }, [isElectron]);

  // Función para establecer un nivel específico
  const setZoomLevel = useCallback(async (level: number) => {
    if (isElectron && window.zoomAPI) {
      try {
        // Limitar el rango de zoom
        const clampedLevel = Math.max(-3, Math.min(3, level));
        const newLevel = await window.zoomAPI.setZoomLevel(clampedLevel);
        setZoomLevelState(newLevel);
      } catch (err) {
        console.error('Error al establecer nivel de zoom:', err);
      }
    }
  }, [isElectron]);

  return {
    zoomLevel,
    zoomPercentage,
    isElectron,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel
  };
}; 