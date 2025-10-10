// src/hooks/useSessionHeartbeat.ts
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface HeartbeatConfig {
  enabled: boolean;
  interval: number; // em milissegundos
  onSessionExpired?: () => void;
  onHeartbeatError?: (error: Error) => void;
}

interface HeartbeatStats {
  lastHeartbeat: Date | null;
  failedAttempts: number;
  isActive: boolean;
}

/**
 * Hook para manter sessão ativa com heartbeat em segundo plano
 * 
 * @param config - Configurações do heartbeat
 * @returns Stats do heartbeat
 * 
 * @example
 * ```tsx
 * const { lastHeartbeat, failedAttempts } = useSessionHeartbeat({
 *   enabled: true,
 *   interval: 60000, // 1 minuto
 *   onSessionExpired: () => signOut(),
 * });
 * ```
 */
export function useSessionHeartbeat(config: HeartbeatConfig): HeartbeatStats {
  const { enabled, interval, onSessionExpired, onHeartbeatError } = config;
  
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const failedAttemptsRef = useRef(0);
  const lastHeartbeatRef = useRef<Date | null>(null);
  const isActiveRef = useRef(false);
  const maxFailedAttempts = 3;

  /**
   * Envia heartbeat para o Supabase
   * Atualiza updated_at no profile para manter sessão ativa
   */
  const sendHeartbeat = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('[Heartbeat] Usuário não autenticado');
        if (onSessionExpired) {
          onSessionExpired();
        }
        return;
      }

      // Atualiza timestamp no profile (mantém sessão ativa)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Sucesso
      lastHeartbeatRef.current = new Date();
      failedAttemptsRef.current = 0;
      
      if (import.meta.env.DEV) {
        console.log('[Heartbeat] ✅ Enviado com sucesso:', lastHeartbeatRef.current.toISOString());
      }

    } catch (error) {
      failedAttemptsRef.current++;
      console.error(`[Heartbeat] ❌ Erro (tentativa ${failedAttemptsRef.current}/${maxFailedAttempts}):`, error);

      if (onHeartbeatError && error instanceof Error) {
        onHeartbeatError(error);
      }

      // Se atingiu o máximo de falhas, considera sessão expirada
      if (failedAttemptsRef.current >= maxFailedAttempts) {
        console.error('[Heartbeat] 🚨 Máximo de falhas atingido - sessão expirada');
        if (onSessionExpired) {
          onSessionExpired();
        }
      }
    }
  }, [onSessionExpired, onHeartbeatError]);

  /**
   * Inicia o heartbeat em segundo plano
   */
  const startHeartbeat = useCallback(() => {
    if (!enabled || isActiveRef.current) return;

    isActiveRef.current = true;
    console.log(`[Heartbeat] 🟢 Iniciado (intervalo: ${interval / 1000}s)`);

    // Primeiro heartbeat imediato
    sendHeartbeat();

    // Configura heartbeat periódico
    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat();
    }, interval);
  }, [enabled, interval, sendHeartbeat]);

  /**
   * Para o heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    isActiveRef.current = false;
    console.log('[Heartbeat] 🔴 Parado');
  }, []);

  // Efeito principal - gerencia lifecycle do heartbeat
  useEffect(() => {
    if (enabled) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    // Cleanup ao desmontar
    return () => {
      stopHeartbeat();
    };
  }, [enabled, startHeartbeat, stopHeartbeat]);

  // Listener para visibilidade da página (Page Visibility API)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página em segundo plano - mantém heartbeat
        console.log('[Heartbeat] 📱 Página em background - mantendo heartbeat');
      } else {
        // Página voltou ao foco - envia heartbeat imediato
        console.log('[Heartbeat] 👀 Página em foco - enviando heartbeat');
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, sendHeartbeat]);

  // Listener para conexão de rede (Online/Offline)
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      console.log('[Heartbeat] 🌐 Conexão restaurada - enviando heartbeat');
      sendHeartbeat();
    };

    const handleOffline = () => {
      console.log('[Heartbeat] 📡 Conexão perdida - heartbeat em espera');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, sendHeartbeat]);

  return {
    lastHeartbeat: lastHeartbeatRef.current,
    failedAttempts: failedAttemptsRef.current,
    isActive: isActiveRef.current,
  };
}
