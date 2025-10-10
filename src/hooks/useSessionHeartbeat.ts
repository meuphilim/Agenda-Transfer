// src/hooks/useSessionHeartbeat.ts - VERSÃO COM EXPORTAÇÃO CORRETA
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface UseSessionHeartbeatOptions {
  heartbeatInterval?: number; // ms (padrão: 30s)
  inactivityTimeout?: number; // ms (padrão: 30min)
  onSessionExpired?: () => void;
  enabled?: boolean; // Controle para habilitar/desabilitar
  debugMode?: boolean; // Modo debug para desenvolvimento
}

interface SessionHeartbeatState {
  lastActivity: Date;
  resetInactivityTimer: () => void;
  isEnabled: boolean;
  heartbeatCount: number;
  lastHeartbeat: Date | null;
  isRunning: boolean;
}

export function useSessionHeartbeat({
  heartbeatInterval = Number(import.meta.env.VITE_HEARTBEAT_INTERVAL) || 30000, // 30 segundos
  inactivityTimeout = Number(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000, // 30 minutos
  onSessionExpired,
  enabled = true,
  debugMode = import.meta.env.DEV || false
}: UseSessionHeartbeatOptions = {}): SessionHeartbeatState {
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const sessionCheckInProgress = useRef<boolean>(false);
  
  // Estado para tracking
  const [heartbeatCount, setHeartbeatCount] = useState<number>(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Logger para debug
  const logger = {
    log: (...args: any[]) => {
      if (debugMode) {
        console.log('[SessionHeartbeat]', ...args);
      }
    },
    error: (...args: any[]) => {
      if (debugMode) {
        console.error('[SessionHeartbeat]', ...args);
      }
    }
  };

  // Reset do timer de inatividade
  const resetInactivityTimer = useCallback(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    logger.log('Resetando timer de inatividade');

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      if (inactiveTime >= inactivityTimeout) {
        logger.log('Sessão expirou por inatividade');
        toast.warning('Sessão expirada por inatividade');
        onSessionExpired?.();
      }
    }, inactivityTimeout);
  }, [enabled, inactivityTimeout, onSessionExpired, logger]);

  // Heartbeat principal com tratamento robusto de erros
  const sendHeartbeat = useCallback(async () => {
    if (!enabled || sessionCheckInProgress.current) {
      logger.log('Heartbeat pulado - desabilitado ou em progresso');
      return;
    }

    sessionCheckInProgress.current = true;
    logger.log('Enviando heartbeat...');

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Erro ao verificar sessão:', error);
        
        // Erros críticos que devem parar o heartbeat
        if (error.message?.includes('JWT expired') || 
            error.message?.includes('invalid refresh token')) {
          onSessionExpired?.();
          return;
        }
        
        // Erros de rede não devem parar o heartbeat
        if (error.message?.includes('network') || 
            error.message?.includes('timeout') ||
            error.message?.includes('Failed to fetch')) {
          logger.log('Erro de rede - heartbeat continua');
          return;
        }
        
        return;
      }

      if (!session) {
        logger.log('Sessão não encontrada');
        onSessionExpired?.();
        return;
      }

      // Calcular tempo até expiração
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      logger.log('Status da sessão:', {
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + 's',
        hasSession: !!session
      });

      // Renovar token se necessário
      if (timeUntilExpiry < 300000) { // 5 minutos
        logger.log('Renovando sessão - tempo até expiração:', timeUntilExpiry + 'ms');
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          logger.error('Erro ao renovar sessão:', refreshError);
          
          // Erros críticos de refresh
          if (refreshError.message?.includes('invalid refresh token') ||
              refreshError.message?.includes('JWT expired')) {
            onSessionExpired?.();
            return;
          }
        } else {
          logger.log('Sessão renovada com sucesso');
        }
      }

      // Atualizar métricas
      setHeartbeatCount(prev => prev + 1);
      setLastHeartbeat(new Date());
      setIsRunning(true);

    } catch (error: any) {
      logger.error('Erro crítico no heartbeat:', error);
      
      // Apenas erros críticos devem parar o heartbeat
      if (error.message?.includes('invalid refresh token') ||
          error.message?.includes('JWT expired')) {
        onSessionExpired?.();
      }
    } finally {
      sessionCheckInProgress.current = false;
    }
  }, [enabled, onSessionExpired, logger]);

  // Monitorar atividade do usuário
  const trackActivity = useCallback((event?: Event) => {
    if (!enabled) return;
    
    logger.log('Atividade detectada:', event?.type);
    resetInactivityTimer();
  }, [enabled, resetInactivityTimer, logger]);

  // Configurar listeners de atividade
  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const options = { capture: true, passive: true };

    events.forEach(event => {
      window.addEventListener(event, trackActivity, options);
    });

    // Atividade inicial
    trackActivity();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, trackActivity, options);
      });
    };
  }, [enabled, trackActivity]);

  // Monitorar visibilidade da página
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = async () => {
      const isHidden = document.hidden;
      logger.log('Visibilidade mudou:', isHidden ? 'background' : 'foreground');

      if (isHidden) {
        // Em background - reduzir frequência
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
        heartbeatTimerRef.current = setInterval(sendHeartbeat, 120000); // 2 minutos
        logger.log('Heartbeat em background: 120s');
      } else {
        // Voltou ao foco - restaurar frequência normal
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
        heartbeatTimerRef.current = setInterval(sendHeartbeat, heartbeatInterval);
        
        // Verificar se sessão ainda é válida ao voltar
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            logger.log('Sessão expirou em background');
            toast.error('Sessão expirou enquanto o aplicativo estava em segundo plano');
            onSessionExpired?.();
          }
        } catch (error) {
          logger.error('Erro ao verificar sessão ao voltar:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, heartbeatInterval, sendHeartbeat, onSessionExpired, logger]);

  // Configurar heartbeat
  useEffect(() => {
    if (!enabled) {
      logger.log('Heartbeat desabilitado');
      setIsRunning(false);
      return;
    }

    logger.log('Iniciando heartbeat com intervalo:', heartbeatInterval + 'ms');

    // Heartbeat inicial
    sendHeartbeat();

    // Configurar intervalo
    heartbeatTimerRef.current = setInterval(sendHeartbeat, heartbeatInterval);
    setIsRunning(true);

    return () => {
      logger.log('Parando heartbeat');
      setIsRunning(false);
      
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [enabled, heartbeatInterval, sendHeartbeat, resetInactivityTimer, logger]);

  return {
    lastActivity: new Date(lastActivityRef.current),
    resetInactivityTimer, // ✅ FUNÇÃO EXPORTADA CORRETAMENTE
    isEnabled: enabled,
    heartbeatCount,
    lastHeartbeat,
    isRunning
  };
}

// Helper function para formatar tempo
export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
