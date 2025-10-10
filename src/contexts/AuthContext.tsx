// src/contexts/AuthContext.tsx - VERSÃO INTEGRADA COM HEARTBEAT
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { useSessionHeartbeat } from '../hooks/useSessionHeartbeat';

export type UserStatus = 'pending' | 'active' | 'inactive';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  is_admin: boolean;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  accountSetup: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session } | void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ user: User | null; session: Session | null; }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  needsProfileCompletion: boolean;
  completeProfile: (fullName: string, phone: string) => Promise<void>;
  sessionMetrics?: {
    lastActivity: Date;
    resetInactivityTimer: () => void;
    isEnabled: boolean;
    heartbeatCount: number;
    lastHeartbeat: Date | null;
    isRunning: boolean;
  };
  resetSessionTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Logger condicional para desenvolvimento
const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[AuthContext]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error('[AuthContext]', ...args);
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountSetup, setAccountSetup] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  // Controle de requisições em andamento
  const fetchInProgressRef = useRef<Set<string>>(new Set());
  const retryCountRef = useRef<Map<string, number>>(new Map());
  const maxRetries = 3;

  // Integrar heartbeat - SÓ ATIVA QUANDO HÁ USUÁRIO AUTENTICADO
  const { 
    lastActivity, 
    resetInactivityTimer: resetSessionTimer, 
    isEnabled: heartbeatEnabled,
    heartbeatCount,
    lastHeartbeat,
    isRunning: heartbeatRunning
  } = useSessionHeartbeat({
    heartbeatInterval: Number(import.meta.env.VITE_HEARTBEAT_INTERVAL) || 30000,
    inactivityTimeout: Number(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000,
    enabled: !!user && !loading && !!session, // Só ativa quando há usuário logado e sessão válida
    onSessionExpired: async () => {
      logger.log('Sessão expirada detectada pelo heartbeat');
      await signOut();
      toast.error('Sessão expirada por inatividade');
      // Forçar reload para limpar estados
      setTimeout(() => window.location.reload(), 1000);
    },
    debugMode: import.meta.env.DEV
  });

  // Expor métricas do heartbeat no contexto
  const sessionMetrics = user && !loading ? {
    lastActivity,
    resetInactivityTimer,
    isEnabled: heartbeatEnabled,
    heartbeatCount,
    lastHeartbeat,
    isRunning: heartbeatRunning
  } : undefined;

  // FUNÇÃO OTIMIZADA: Cache e debounce de requisições
  const fetchProfile = useCallback(async (userId: string, userData?: User | null): Promise<UserProfile | null> => {
    try {
      // Validação de entrada
      if (!userId || typeof userId !== 'string') {
        logger.error('ERRO: userId é inválido:', userId);
        return null;
      }

      // Prevenir requisições duplicadas
      if (fetchInProgressRef.current.has(userId)) {
        logger.log('⏸️ Fetch já em andamento para:', userId);
        return null;
      }

      fetchInProgressRef.current.add(userId);
      logger.log(`Buscando profile para usuário: ${userId}`);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.message?.includes('infinite recursion')) {
          logger.error('🚨 RECURSÃO INFINITA DETECTADA!');
          return null;
        }
        logger.error('❌ Erro ao buscar profile:', error);
        return null;
      }

      if (data) {
        logger.log('✅ Profile encontrado:', data);
        retryCountRef.current.delete(userId); // Reset contador de retries
        return data;
      }

      logger.log('⏳ Profile ainda não existe');
      return null;

    } catch (error) {
      logger.error('🚨 Exceção em fetchProfile:', error);
      if (error instanceof Error && error.message?.includes('infinite recursion')) {
        logger.error('🚨 RECURSÃO INFINITA NO CATCH!');
      }
      return null;
    } finally {
      fetchInProgressRef.current.delete(userId);
    }
  }, []); // ✅ Sem dependências externas

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) {
      logger.log('⚠️ Cannot refresh profile - no user');
      return null;
    }

    try {
      setLoading(true);
      const profile = await fetchProfile(user.id, user);
      setProfile(profile);
      return profile;
    } catch (error) {
      logger.error('❌ Error refreshing profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfile]); // ✅ Dependências corretas

  const completeProfile = useCallback(async (fullName: string, phone: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          full_name: fullName,
          phone: phone,
          is_admin: false,
          status: 'pending'
        }]);

      if (error) throw error;

      const profile = await fetchProfile(user.id, user);
      if (profile) {
        setProfile(profile);
        setNeedsProfileCompletion(false);
        setAccountSetup(true);
      }
    } catch (error) {
      logger.error('Erro ao completar perfil:', error);
      throw error;
    }
  }, [user, fetchProfile]);

  // OTIMIZADO: Retry com backoff exponencial e limite por usuário
  const setupAccountWithRetry = useCallback(async (userId: string, userData: User | null): Promise<UserProfile | null> => {
    if (!userId || !userData) {
      logger.error('Parâmetros inválidos');
      return null;
    }

    const currentRetries = retryCountRef.current.get(userId) || 0;

    if (currentRetries >= maxRetries) {
      logger.error(`❌ Max retries alcançado para ${userId}`);
      setNeedsProfileCompletion(true);
      return null;
    }

    try {
      const profile = await fetchProfile(userId, userData);

      if (profile) {
        logger.log('✅ Account setup completed successfully');
        setNeedsProfileCompletion(false);
        retryCountRef.current.delete(userId);
        return profile;
      }

      // Incrementa contador de retry
      retryCountRef.current.set(userId, currentRetries + 1);
      logger.log(`🔄 Retry ${currentRetries + 1}/${maxRetries}`);

      // Backoff exponencial: 1s, 2s, 4s
      if (currentRetries < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetries)));
        return await setupAccountWithRetry(userId, userData);
      }

    } catch (error) {
      if (error instanceof Error && error.message?.includes('infinite recursion')) {
        logger.error('🚨 RECURSÃO DETECTADA - Parando tentativas');
        retryCountRef.current.delete(userId);
        return null;
      }

      logger.error('❌ Error in setupAccountWithRetry:', error);
      retryCountRef.current.set(userId, currentRetries + 1);
    }

    setNeedsProfileCompletion(true);
    return null;
  }, [fetchProfile]);

  // OTIMIZADO: Prevenir múltiplas inicializações
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const getSession = async () => {
      try {
        setLoading(true);
        logger.log('🔄 Getting session...');

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('❌ Error getting session:', error);
          return;
        }

        logger.log('✅ Session loaded:', !!session);

        if (session?.user) {
          const userId = session.user.id;

          if (!userId) {
            logger.error('❌ Session user ID is null/undefined');
            return;
          }

          setSession(session);
          setUser(session.user);

          const profile = await setupAccountWithRetry(userId, session.user);

          if (!profile) {
            logger.log('⚠️ Account setup failed');
            setNeedsProfileCompletion(true);
          } else {
            setProfile(profile);
            setNeedsProfileCompletion(false);
          }

          setAccountSetup(true);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setNeedsProfileCompletion(false);
          setAccountSetup(true);
        }
      } catch (error) {
        logger.error('🚨 Error in getSession:', error);

        if (error instanceof Error && error.message?.includes('infinite recursion')) {
          logger.error('🚨 RECURSÃO INFINITA!');
          setAccountSetup(false);
          setNeedsProfileCompletion(false);
        }
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // ✅ Listener de auth state separado do fetch inicial
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log('🔄 Auth state changed:', event);

      // Ignora INITIAL_SESSION para evitar fetch duplicado
      if (event === 'INITIAL_SESSION') {
        logger.log('⏭️ Ignorando INITIAL_SESSION');
        return;
      }

      if (event === 'SIGNED_OUT') {
        logger.log('🚪 User signed out');
        setSession(null);
        setUser(null);
        setProfile(null);
        setNeedsProfileCompletion(false);
        setAccountSetup(true);
        return;
      }

      if (session?.user) {
        const userId = session.user.id;

        if (!userId) {
          logger.error('❌ Auth state change - user ID is null');
          return;
        }

        setSession(session);
        setUser(session.user);

        const profile = await setupAccountWithRetry(userId, session.user);

        if (!profile) {
          setNeedsProfileCompletion(true);
        } else {
          setProfile(profile);
          setNeedsProfileCompletion(false);
        }

        setAccountSetup(true);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setNeedsProfileCompletion(false);
        setAccountSetup(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      isInitialized.current = false;
    };
  }, [setupAccountWithRetry]); // ✅ Dependência correta

  const signOut = useCallback(async () => {
    try {
      logger.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);
      setNeedsProfileCompletion(false);
      setAccountSetup(true);
      retryCountRef.current.clear();
      logger.log('✅ Sign out successful');
    } catch (error) {
      logger.error('❌ Error signing out:', error);
      throw error;
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      logger.log('🔑 Attempting sign in...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      logger.log('✅ Sign in successful:', data.user?.id);

      if (data.user) {
        const userId = data.user.id;

        if (!userId) {
          logger.error('❌ Sign in - user ID is null');
          throw new Error('AUTHENTICATION_FAILED');
        }

        // Resetar contadores de retry no login bem-sucedido
        retryCountRef.current.clear();

        const profile = await setupAccountWithRetry(userId, data.user);
        setProfile(profile);

        if (!profile) {
          setNeedsProfileCompletion(true);
        } else {
          setNeedsProfileCompletion(false);
        }

        setAccountSetup(true);
      }

      return data;
    } catch (error) {
      logger.error('❌ Error in signIn:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      logger.log('📝 Attempting sign up...');

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (error) throw error;

      logger.log('✅ Sign up successful:', data.user?.id);

      return data;
    } catch (error) {
      logger.error('❌ Error in signUp:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    accountSetup,
    needsProfileCompletion,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.is_admin ?? false,
    refreshProfile,
    completeProfile,
    sessionMetrics, // Adicionar métricas do heartbeat
    resetSessionTimer // Adicionar função para resetar timer manualmente
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
