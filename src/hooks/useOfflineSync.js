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
      await syncOutbox({ supabase });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    runSync();
    const onOnline = () => runSync();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [runSync]);

  return { isSyncing, runSync };
};

