// src/hooks/useSessionMonitor.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSessionMonitor() {
  const [sessionState, setSessionState] = useState({
    isAuthenticated: false,
    expiresAt: null as number | null,
    timeUntilExpiry: null as number | null,
    isExpired: false
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.expires_at) {
        const expiresAt = session.expires_at * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        
        setSessionState({
          isAuthenticated: true,
          expiresAt,
          timeUntilExpiry,
          isExpired: timeUntilExpiry <= 0
        });
      } else {
        setSessionState({
          isAuthenticated: false,
          expiresAt: null,
          timeUntilExpiry: null,
          isExpired: true
        });
      }
    };

    // Verificar imediatamente e depois a cada 30 segundos
    checkSession();
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, []);

  return sessionState;
}
