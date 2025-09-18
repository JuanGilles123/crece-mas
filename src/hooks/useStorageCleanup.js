import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStorageInfo, cleanupOrphanedImages } from '../utils/storageCleanup';

/**
 * Hook personalizado para manejar la limpieza del storage
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Estado y funciones del storage
 */
export const useStorageCleanup = (options = {}) => {
  const { user } = useAuth();
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, fileCount: 0 });
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [lastCleanup, setLastCleanup] = useState(null);

  const {
    autoCleanupThreshold = 50, // MB
    autoCleanupEnabled = true,
    cleanupInterval = 24 * 60 * 60 * 1000 // 24 horas en ms
  } = options;

  // Cargar información del storage
  const loadStorageInfo = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const info = await getStorageInfo(user.id);
      setStorageInfo(info);
      return info;
    } catch (error) {
      console.error('Error cargando información del storage:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Limpiar imágenes huérfanas
  const cleanupOrphaned = async (showAlert = true) => {
    if (!user) return { deleted: 0, errors: 0 };
    
    setCleaning(true);
    try {
      const result = await cleanupOrphanedImages(user.id);
      setLastCleanup(new Date());
      
      if (showAlert && result.deleted > 0) {
        alert(`Limpieza completada: ${result.deleted} imágenes huérfanas eliminadas`);
      }
      
      // Recargar información del storage
      await loadStorageInfo();
      
      return result;
    } catch (error) {
      console.error('Error en limpieza:', error);
      if (showAlert) {
        alert('Error durante la limpieza. Revisa la consola para más detalles.');
      }
      return { deleted: 0, errors: 1 };
    } finally {
      setCleaning(false);
    }
  };

  // Verificar si necesita limpieza automática
  const checkAutoCleanup = async () => {
    if (!autoCleanupEnabled || !user) return;
    
    const info = await loadStorageInfo();
    if (!info) return;
    
    const sizeInMB = info.totalSize / (1024 * 1024);
    const needsCleanup = sizeInMB > autoCleanupThreshold;
    
    if (needsCleanup) {
      console.log(`Storage size (${sizeInMB.toFixed(2)}MB) exceeds threshold (${autoCleanupThreshold}MB). Auto-cleanup recommended.`);
      
      // Mostrar notificación al usuario
      const shouldCleanup = window.confirm(
        `Tu storage está usando ${sizeInMB.toFixed(2)}MB de espacio. ` +
        `¿Te gustaría limpiar las imágenes huérfanas para liberar espacio?`
      );
      
      if (shouldCleanup) {
        await cleanupOrphaned(true);
      }
    }
  };

  // Verificar limpieza programada
  const checkScheduledCleanup = async () => {
    if (!user) return;
    
    const lastCleanupTime = localStorage.getItem(`lastCleanup_${user.id}`);
    const now = new Date().getTime();
    
    if (!lastCleanupTime || (now - parseInt(lastCleanupTime)) > cleanupInterval) {
      console.log('Performing scheduled storage cleanup check...');
      await checkAutoCleanup();
      localStorage.setItem(`lastCleanup_${user.id}`, now.toString());
    }
  };

  // Efectos
  useEffect(() => {
    if (user) {
      loadStorageInfo();
      checkScheduledCleanup();
    }
  }, [user]);

  // Limpiar storage cuando el componente se desmonta
  useEffect(() => {
    return () => {
      // Cleanup si es necesario
    };
  }, []);

  return {
    storageInfo,
    loading,
    cleaning,
    lastCleanup,
    loadStorageInfo,
    cleanupOrphaned,
    checkAutoCleanup,
    formatBytes: (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  };
};
