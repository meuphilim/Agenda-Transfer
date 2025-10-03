import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as yup from 'yup';

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

// Schemas de validação
const signInSchema = yup.object({
  email: yup.string()
    .email('Email inválido')
    .required('Email é obrigatório')
    .transform(value => value?.toLowerCase().trim()),
  password: yup.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .required('Senha é obrigatória')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter letras maiúsculas, minúsculas e números')
});

const signUpSchema = yup.object({
  email: yup.string()
    .email('Email inválido')
    .required('Email é obrigatório')
    .transform(value => value?.toLowerCase().trim()),
  password: yup.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .required('Senha é obrigatória')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter letras maiúsculas, minúsculas e números'),
  fullName: yup.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .required('Nome completo é obrigatório')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  phone: yup.string()
    .required('Telefone é obrigatório')
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (99) 99999-9999')
});

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
  const fetchProfileRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  const fetchProfile = async (userId: string, userData?: any) => {
    // Cancela chamada anterior se existir
    if (fetchProfileRef.current) {
      clearTimeout(fetchProfileRef.current);
      fetchProfileRef.current = null;
    }

    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        logger.log(`Fetching profile for user: ${userId}, attempt: ${attempts + 1}`);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          logger.error('Error fetching profile:', error);
          
          // Profile não existe - tenta criar
          if (error.code === 'PGRST116' && attempts === 0) {
            logger.log('Profile not found, creating new profile');
            
            const metadata = userData?.user_metadata || {};
            const email = userData?.email || '';
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{
                id: userId,
                full_name: metadata.full_name || email.split('@')[0] || 'Usuário',
                phone: metadata.phone || null,
                is_admin: false,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
              .select()
              .single();

            if (createError) {
              logger.error('Error creating profile:', createError);
              
              // Se for erro de unique constraint, tenta buscar novamente
              if (createError.code === '23505') {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                continue;
              }
              
              return null;
            }

            logger.log('Profile created successfully:', newProfile);
            return newProfile;
          }
          
          // Outros erros - tenta novamente
          attempts++;
          if (attempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            continue;
          }
          
          return null;
        }

        logger.log('Profile fetched successfully:', data);
        return data;
      } catch (error) {
        logger.error('Exception in fetchProfile:', error);
        attempts++;
        
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          continue;
        }
        
        return null;
      }
    }
    
    return null;
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

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        logger.log('Getting session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Error getting session:', error);
          return;
        }

        logger.log('Session loaded:', session);

        if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Carrega o perfil
          const profile = await fetchProfile(session.user.id, session.user);
          setProfile(profile);

          // Se não conseguiu carregar o perfil, tenta novamente após um delay
          if (!profile) {
            fetchProfileRef.current = setTimeout(async () => {
              logger.log('Retrying profile fetch...');
              const retryProfile = await fetchProfile(session.user.id, session.user);
              setProfile(retryProfile);
            }, 2000);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      logger.log('Auth state changed:', _event, session);

      if (session?.user) {
        setSession(session);
        setUser(session.user);

        // Carrega o perfil quando o estado de autenticação muda
        const profile = await fetchProfile(session.user.id, session.user);
        setProfile(profile);

        // Se não conseguiu carregar o perfil, tenta novamente após um delay
        if (!profile) {
          fetchProfileRef.current = setTimeout(async () => {
            logger.log('Retrying profile fetch after auth change...');
            const retryProfile = await fetchProfile(session.user.id, session.user);
            setProfile(retryProfile);
          }, 2000);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (fetchProfileRef.current) {
        clearTimeout(fetchProfileRef.current);
      }
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      logger.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      logger.log('Sign out successful');
    } catch (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      logger.log('Attempting sign in...');
      
      // Validação de entrada
      await signInSchema.validate({ email, password });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      logger.log('Sign in successful:', data.user?.id);

      if (data.user) {
        // Carrega o perfil imediatamente após o login
        const profile = await fetchProfile(data.user.id, data.user);
        setProfile(profile);
      }

      return data;
    } catch (error: any) {
      logger.error('Error in signIn:', error);
      
      if (error.name === 'ValidationError') {
        throw new Error(error.message);
      }
      
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      logger.log('Attempting sign up...');
      
      // Validação de entrada
      await signUpSchema.validate({ email, password, fullName, phone });
      
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
    } catch (error: any) {
      logger.error('Error in signUp:', error);
      
      if (error.name === 'ValidationError') {
        throw new Error(error.message);
      }
      
      throw error;
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
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
