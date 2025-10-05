// src/contexts/AuthContext.tsx - VERSÃO CORRIGIDA
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

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
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
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
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // FUNÇÃO SIMPLIFICADA: Apenas busca o perfil, o trigger cria automaticamente
  const fetchProfile = async (userId: string, userData?: User | null) => {
    try {
      logger.log(`Buscando profile para usuário: ${userId}`);

      // VALIDAÇÃO: Verifica se userId é válido
      if (!userId || typeof userId !== 'string') {
        logger.error('ERRO: userId é inválido:', userId);
        return null;
      }

      // Busca o profile (que deve ter sido criado pelo trigger)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Tratamento de erro de recursão
      if (error) {
        if (error.message?.includes('infinite recursion')) {
          logger.error('🚨 RECURSÃO INFINITA DETECTADA!');
          return null;
        }
        logger.error('❌ Erro ao buscar profile:', error);
        return null;
      }

      // Profile encontrado
      if (data) {
        logger.log('✅ Profile encontrado:', data);
        return data;
      }

      // Profile não existe ainda (trigger pode estar processando)
      logger.log('⏳ Profile ainda não existe, pode estar sendo criado pelo trigger');
      return null;

    } catch (error) {
      logger.error('🚨 Exceção em fetchProfile:', error);

      // Tratamento específico para recursão
      if (error instanceof Error && error.message?.includes('infinite recursion')) {
        logger.error('🚨 RECURSÃO INFINITA DETECTADA NO CATCH!');
        return null;
      }

      return null;
    }
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await fetchProfile(user.id, user);
      setProfile(profile);
      return profile;
    }
    return null;
  }, [user]);

  // Controle de retry inteligente com proteção contra recursão
  const setupAccountWithRetry = async (userId: string, userData: User | null) => {
    retryCountRef.current = 0;

    while (retryCountRef.current < maxRetries) {
      try {
        if (!userId || !userData) {
          logger.error('Parâmetros inválidos');
          return null;
        }

        const profile = await fetchProfile(userId, userData);

        if (profile) {
          logger.log('✅ Account setup completed successfully');
          return profile;
        }

        // Incrementa retry e aguarda
        retryCountRef.current++;
        logger.log(`🔄 Retry attempt ${retryCountRef.current}/${maxRetries}`);

        if (retryCountRef.current < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
        }

      } catch (error) {
        // Detecta recursão especificamente
        if (error instanceof Error && error.message?.includes('infinite recursion')) {
          logger.error('🚨 RECURSÃO DETECTADA - Parando tentativas');
          break; // Para as tentativas imediatamente
        }
        
        logger.error('❌ Error in setupAccountWithRetry:', error);
        retryCountRef.current++;
        if (retryCountRef.current < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
        }
      }
    }

    logger.error('❌ Max retries reached');
    return null;
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        logger.log('🔄 Getting session...');

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }

        logger.log('✅ Session loaded:', session);

        if (session?.user) {
          const userId = session.user.id;

          if (!userId) {
            logger.error('❌ Session user ID is null/undefined');
            setLoading(false);
            return;
          }

          setSession(session);
          setUser(session.user);

          // Tenta configurar account com proteção contra recursão
          const profile = await setupAccountWithRetry(userId, session.user);

          if (!profile) {
            logger.log('⚠️ Account setup failed, will show setup screen');
            setAccountSetup(false);
          } else {
            setProfile(profile);
            setAccountSetup(true);
            logger.log('✅ Account setup completed');
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAccountSetup(true);
        }
      } catch (error) {
        logger.error('🚨 Error in getSession:', error);
        
        // Tratamento específico para recursão
        if (error instanceof Error && error.message?.includes('infinite recursion')) {
          logger.error('🚨 RECURSÃO INFINITA DETECTADA!');
          setAccountSetup(false); // Mostra tela de erro
        }
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      logger.log('🔄 Auth state changed:', _event, session);

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
          setAccountSetup(false);
        } else {
          setProfile(profile);
          setAccountSetup(true);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setAccountSetup(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    try {
      logger.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);
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
        const userId = data.user.id;

        if (!userId) {
          logger.error('❌ Sign in - user ID is null');
          throw new Error('AUTHENTICATION_FAILED');
        }

        const profile = await setupAccountWithRetry(userId, data.user);
        setProfile(profile);

        if (!profile) {
          setAccountSetup(false);
        } else {
          setAccountSetup(true);
        }
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
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.is_admin ?? false,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
