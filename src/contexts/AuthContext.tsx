// src/contexts/AuthContext.tsx - VERSÃO COM HEARTBEAT
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Logger condicional
const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) console.log('[AuthContext]', ...args);
  },
  error: (...args: any[]) => {
    if (import.meta.env.DEV) console.error('[AuthContext]', ...args);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountSetup, setAccountSetup] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  // ✅ INTEGRAÇÃO DO HEARTBEAT
  const heartbeatEnabled = import.meta.env.VITE_HEARTBEAT_ENABLED === 'true';
  const heartbeatInterval = Number(import.meta.env.VITE_HEARTBEAT_INTERVAL) || 60000;

  const { lastHeartbeat, failedAttempts } = useSessionHeartbeat({
    enabled: heartbeatEnabled && !!user && !loading,
    interval: heartbeatInterval,
    onSessionExpired: async () => {
      logger.log('🚨 Sessão expirada detectada pelo heartbeat');
      await signOut();
      toast.error('Sua sessão expirou. Faça login novamente.');
    },
    onHeartbeatError: (error) => {
      logger.error('❌ Erro no heartbeat:', error.message);
      if (failedAttempts >= 2) {
        toast.warning('Problemas de conexão detectados');
      }
    },
  });

  // Log de heartbeat em desenvolvimento
  useEffect(() => {
    if (import.meta.env.DEV && lastHeartbeat) {
      logger.log('💓 Último heartbeat:', lastHeartbeat.toLocaleTimeString());
    }
  }, [lastHeartbeat]);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!userId || typeof userId !== 'string') {
        logger.error('ERRO: userId é inválido:', userId);
        return null;
      }

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
        return data;
      }

      logger.log('⏳ Profile ainda não existe');
      return null;

    } catch (error) {
      logger.error('🚨 Exceção em fetchProfile:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) {
      logger.log('⚠️ Cannot refresh profile - no user');
      return null;
    }
    
    try {
      setLoading(true);
      const profile = await fetchProfile(user.id);
      setProfile(profile);
      return profile;
    } catch (error) {
      logger.error('❌ Error refreshing profile:', error);
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
      logger.error('Erro ao completar perfil:', error);
      throw error;
    }
  }, [user, fetchProfile]);

  // Inicialização da sessão
  useEffect(() => {
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
          setSession(session);
          setUser(session.user);

          const profile = await fetchProfile(session.user.id);

          if (!profile) {
            logger.log('⚠️ Profile não encontrado');
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
        setAccountSetup(false);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log('🔄 Auth state changed:', event);

      // Ignora INITIAL_SESSION para evitar dupla inicialização
      if (event === 'INITIAL_SESSION') {
        logger.log('⏭️ Ignorando INITIAL_SESSION');
        return;
      }

      if (session?.user) {
        setSession(session);
        setUser(session.user);

        const profile = await fetchProfile(session.user.id);

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

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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
        const profile = await fetchProfile(data.user.id);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
