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

// Logger condicional
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
  const [accountSetup, setAccountSetup] = useState(false);
  const fetchProfileRef = useRef<NodeJS.Timeout | null>(null);

  // Função para buscar/criar profile SEM dependência de estado externo
  const fetchProfile = async (userId: string, userData: User | null) => {
    logger.log(`Fetching profile for user: ${userId}`);
    
    try {
      // Primeiro: tenta buscar o profile existente
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        logger.log('Profile found:', data);
        return data;
      }

      // Profile não existe - precisa criar
      if (error?.code === 'PGRST116' || !data) {
        logger.log('Profile not found, creating new profile');
        
        // Prepara dados para criação
        const userMetadata = userData?.user_metadata || {};
        const email = userData?.email || '';
        
        // Dados padrão para novo profile
        const profileData = {
          id: userId,
          full_name: userMetadata.full_name || email.split('@')[0] || 'Usuário',
          phone: userMetadata.phone || null,
          is_admin: false,
          status: 'pending' as UserStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        logger.log('Creating profile with data:', profileData);

        // Tenta criar o profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single();

        if (createError) {
          logger.error('Error creating profile:', createError);
          
          // Se já existe (concorrente), busca novamente
          if (createError.code === '23505') {
            logger.log('Profile already exists, fetching again');
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            
            return existingProfile;
          }
          
          return null;
        }

        logger.log('Profile created successfully:', newProfile);
        return newProfile;
      }

      // Outro erro qualquer
      logger.error('Error fetching profile:', error);
      return null;
    } catch (error) {
      logger.error('Exception in fetchProfile:', error);
      return null;
    }
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      logger.log('Refreshing profile for user:', user.id);
      const profile = await fetchProfile(user.id, user);
      setProfile(profile);
      return profile;
    }
    return null;
  }, [user]);

  // Estado de configuração de conta
  const checkAccountSetup = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        logger.log('Getting session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        logger.log('Session loaded:', session);

        if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Verifica se a conta está configurada
          const isSetup = await checkAccountSetup(session.user.id);
          
          if (!isSetup) {
            logger.log('Account not setup, configuring...');
            setAccountSetup(false);
            
            // Tenta configurar o profile
            const profile = await fetchProfile(session.user.id, session.user);
            
            if (profile) {
              setProfile(profile);
              setAccountSetup(true);
              logger.log('Account setup completed');
            } else {
              logger.error('Failed to setup account');
              // Não fica em loop - permite continuar mesmo sem profile
              setAccountSetup(true);
            }
          } else {
            logger.log('Account already setup, loading profile...');
            setAccountSetup(true);
            
            // Busca o profile existente
            const profile = await fetchProfile(session.user.id, session.user);
            setProfile(profile);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAccountSetup(false);
        }
      } catch (error) {
        logger.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log('Auth state changed:', event, session);

      if (session?.user) {
        setSession(session);
        setUser(session.user);

        // Verifica configuração da conta
        const isSetup = await checkAccountSetup(session.user.id);
        
        if (!isSetup) {
          setAccountSetup(false);
          const profile = await fetchProfile(session.user.id, session.user);
          
          if (profile) {
            setProfile(profile);
            setAccountSetup(true);
          } else {
            setAccountSetup(true); // Evita loop
          }
        } else {
          setAccountSetup(true);
          const profile = await fetchProfile(session.user.id, session.user);
          setProfile(profile);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setAccountSetup(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (fetchProfileRef.current) {
        clearTimeout(fetchProfileRef.current);
      }
    };
  }, [checkAccountSetup]);

  const signOut = useCallback(async () => {
    try {
      logger.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setAccountSetup(false);
      logger.log('Sign out successful');
    } catch (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      logger.log('Attempting sign in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      logger.log('Sign in successful:', data.user?.id);

      if (data.user) {
        // Aguarda configuração do profile
        const profile = await fetchProfile(data.user.id, data.user);
        setProfile(profile);
      }

      return data;
    } catch (error) {
      logger.error('Error in signIn:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      logger.log('Attempting sign up...');
      
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
      
      logger.log('Sign up successful:', data.user?.id);
      
      return data;
    } catch (error) {
      logger.error('Error in signUp:', error);
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
