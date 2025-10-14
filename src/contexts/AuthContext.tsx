// src/contexts/AuthContext.tsx - VERSÃO OTIMIZADA
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
  refreshProfile: () => Promise<UserProfile | null>;
  needsProfileCompletion: boolean;
  completeProfile: (fullName: string, phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
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

  // FUNÇÃO OTIMIZADA: Cache e debounce de requisições
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      // Validação de entrada
      if (!userId || typeof userId !== 'string') {
        console.error('ERRO: userId é inválido:', userId);
        return null;
      }

      // Prevenir requisições duplicadas
      if (fetchInProgressRef.current.has(userId)) {
        console.log('⏸️ Fetch já em andamento para:', userId);
        return null;
      }

      fetchInProgressRef.current.add(userId);
      console.log(`Buscando profile para usuário: ${userId}`);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.message.includes('infinite recursion')) {
          console.error('🚨 RECURSÃO INFINITA DETECTADA!');
          return null;
        }
        console.error('❌ Erro ao buscar profile:', error);
        return null;
      }

      if (data) {
        console.log('✅ Profile encontrado:', data);
        retryCountRef.current.delete(userId); // Reset contador de retries
        return data;
      }

      console.log('⏳ Profile ainda não existe');
      return null;

    } catch (error) {
      console.error('🚨 Exceção em fetchProfile:', error);
      if (error instanceof Error && error.message.includes('infinite recursion')) {
        console.error('🚨 RECURSÃO INFINITA NO CATCH!');
      }
      return null;
    } finally {
      fetchInProgressRef.current.delete(userId);
    }
  }, []); // ✅ Sem dependências externas

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) {
      console.log('⚠️ Cannot refresh profile - no user');
      return null;
    }
    
    try {
      setLoading(true);
      const profile = await fetchProfile(user.id);
      setProfile(profile);
      return profile;
    } catch (error) {
      console.error('❌ Error refreshing profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfile]);

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

      const profile = await fetchProfile(user.id);
      if (profile) {
        setProfile(profile);
        setNeedsProfileCompletion(false);
        setAccountSetup(true);
      }
    } catch (error) {
      console.error('Erro ao completar perfil:', error);
      throw error;
    }
  }, [user, fetchProfile]);

  // OTIMIZADO: Retry com backoff exponencial e limite por usuário
  const setupAccountWithRetry = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!userId) {
      console.error('Parâmetros inválidos');
      return null;
    }

    const currentRetries = retryCountRef.current.get(userId) ?? 0;

    if (currentRetries >= maxRetries) {
      console.error(`❌ Max retries alcançado para ${userId}`);
      setNeedsProfileCompletion(true);
      return null;
    }

    try {
      const profile = await fetchProfile(userId);

      if (profile) {
        console.log('✅ Account setup completed successfully');
        setNeedsProfileCompletion(false);
        retryCountRef.current.delete(userId);
        return profile;
      }

      // Incrementa contador de retry
      retryCountRef.current.set(userId, currentRetries + 1);
      console.log(`🔄 Retry ${currentRetries + 1}/${maxRetries}`);

      // Backoff exponencial: 1s, 2s, 4s
      if (currentRetries < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetries)));
        return await setupAccountWithRetry(userId);
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('infinite recursion')) {
        console.error('🚨 RECURSÃO DETECTADA - Parando tentativas');
        retryCountRef.current.delete(userId);
        return null;
      }
      
      console.error('❌ Error in setupAccountWithRetry:', error);
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
        console.log('🔄 Getting session...');

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error getting session:', error);
          return;
        }

        console.log('✅ Session loaded:', !!session);

        if (session?.user) {
          const userId = session.user.id;

          if (!userId) {
            console.error('❌ Session user ID is null/undefined');
            return;
          }

          setSession(session);
          setUser(session.user);

          const profile = await setupAccountWithRetry(userId);

          if (!profile) {
            console.log('⚠️ Account setup failed');
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
        console.error('🚨 Error in getSession:', error);
        
        if (error instanceof Error && error.message.includes('infinite recursion')) {
          console.error('🚨 RECURSÃO INFINITA!');
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
      console.log('🔄 Auth state changed:', event);

      // Ignora INITIAL_SESSION para evitar fetch duplicado
      if (event === 'INITIAL_SESSION') {
        console.log('⏭️ Ignorando INITIAL_SESSION');
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed successfully');
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setNeedsProfileCompletion(false);
        setAccountSetup(true);
      } else if (session?.user) {
        const userId = session.user.id;

        if (!userId) {
          console.error('❌ Auth state change - user ID is null');
          return;
        }

        setSession(session);
        setUser(session.user);

        const profile = await fetchProfile(userId);

        if (!profile) {
          setNeedsProfileCompletion(true);
        } else {
          setProfile(profile);
          setNeedsProfileCompletion(false);
        }
        
        setAccountSetup(true);
      }
    });

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.user.id !== user?.id) {
          setUser(session.user);
          setSession(session);
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isInitialized.current = false;
    };
  }, [setupAccountWithRetry, user, fetchProfile]); // ✅ Dependência correta

  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);
      setNeedsProfileCompletion(false);
      setAccountSetup(true);
      retryCountRef.current.clear();
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  }, []);

  // ✅ GESTÃO DE SESSÃO DE INATIVIDADE (30 MIN)
  useEffect(() => {
    if (!user || loading) return;

    const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '1800000'); // 30 minutos padrão
    let sessionTimer: NodeJS.Timeout | null = null;

    const handleSessionExpired = async () => {
      try {
        await signOut();
        alert('⏱️ Sua sessão expirou por inatividade. Faça login novamente.');
      } catch (error) {
        console.error('Erro ao encerrar sessão:', error);
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    const resetSessionTimer = () => {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
      sessionTimer = setTimeout(handleSessionExpired, SESSION_TIMEOUT);
    };

    const handleActivity = () => {
      resetSessionTimer();
    };

    // Eventos que resetam o timer de inatividade
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];

    // Atualiza quando a aba volta ao foco
    window.addEventListener('focus', handleActivity);
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetSessionTimer();

    return () => {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      window.removeEventListener('focus', handleActivity);
    };
  }, [user, loading, signOut]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Attempting sign in...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('✅ Sign in successful:', data.user.id);

      if (data.user) {
        const userId = data.user.id;

        if (!userId) {
          console.error('❌ Sign in - user ID is null');
          throw new Error('AUTHENTICATION_FAILED');
        }

        const profile = await setupAccountWithRetry(userId);
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
      console.error('❌ Error in signIn:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      console.log('📝 Attempting sign up...');

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
      if (!data.user) throw new Error("Cadastro falhou, usuário não foi criado.");

      console.log('✅ Sign up successful:', data.user.id);

      return data;
    } catch (error) {
      console.error('❌ Error in signUp:', error);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
