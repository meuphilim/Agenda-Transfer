// src/hooks/useSessionHeartbeat.ts
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface UseSessionHeartbeatOptions {
  heartbeatInterval?: number; // ms (padrão: 30s)
  inactivityTimeout?: number; // ms (padrão: 10min)
  onSessionExpired?: () => void;
}

export function useSessionHeartbeat({
  heartbeatInterval = 30000, // 30 segundos
  inactivityTimeout = 600000, // 10 minutos
  onSessionExpired
}: UseSessionHeartbeatOptions = {}) {
  const heartbeatTimerRef = useRef<NodeJS.Timeout>();
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Reset do timer de inatividade
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      if (inactiveTime >= inactivityTimeout) {
        toast.warning('Sessão expirou por inatividade');
        if (onSessionExpired) {
          onSessionExpired();
        }
      }
    }, inactivityTimeout);
  }, [inactivityTimeout, onSessionExpired]);

  // Heartbeat para manter sessão ativa
  const sendHeartbeat = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro no heartbeat:', error);
        return;
      }

      if (session?.expires_at) {
        // Refresh do token se estiver próximo de expirar
        const expiresAt = session.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // Se faltar menos de 5 minutos para expirar, renova
        if (timeUntilExpiry < 300000) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Erro ao renovar sessão:', refreshError);
          } else {
            console.log('Sessão renovada via heartbeat');
          }
        }
      }
    } catch (error) {
      console.error('Erro no heartbeat:', error);
    }
  }, []);

  // Monitorar atividade do usuário
  const trackActivity = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Configurar listeners de atividade
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, trackActivity, true);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, trackActivity, true);
      });
    };
  }, [trackActivity]);

  // Configurar heartbeat
  useEffect(() => {
    resetInactivityTimer(); // Inicializar timer

    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat();
    }, heartbeatInterval);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [heartbeatInterval, sendHeartbeat, resetInactivityTimer]);

  // Monitorar visibilidade da página
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Página em segundo plano - reduzir frequência do heartbeat
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
        // Heartbeat reduzido a cada 2 minutos em segundo plano
        heartbeatTimerRef.current = setInterval(sendHeartbeat, 120000);
      } else {
        // Página voltou ao foco - restaurar heartbeat normal
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
        heartbeatTimerRef.current = setInterval(sendHeartbeat, heartbeatInterval);
        
        // Verificar se a sessão ainda é válida
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Sessão expirou enquanto o aplicativo estava em segundo plano');
          if (onSessionExpired) {
            onSessionExpired();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [heartbeatInterval, sendHeartbeat, onSessionExpired]);

  return {
    lastActivity: lastActivityRef.current,
    resetInactivityTimer
  };
}
