import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/api/supabaseClient';
import { syncOutbox } from '../utils/offlineQueue';

export const useOfflineSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const runSync = useCallback(async () => {
    if (isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const result = await syncOutbox({ supabase });
      // Si no hay nada que sincronizar, no mantenemos el estado de syncing
      if (result?.nothingToSync) {
        setIsSyncing(false);
        return;
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    // Solo ejecutar sync inicial si estamos online
    if (navigator.onLine) {
      runSync();
    }
    
    const onOnline = () => runSync();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencias vacías intencionalmente: solo sincronizar al montar y al reconectar

  return { isSyncing, runSync };
};

