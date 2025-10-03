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
  needsProfileCompletion: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session } | void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ user: User | null; session: Session | null; }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
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
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Função para buscar perfil existente (não cria automaticamente)
  const fetchProfile = async (userId: string, userData?: User | null) => {
    try {
      logger.log(`Buscando profile para usuário: ${userId}`);
      
      // Verifica se userId é válido
      if (!userId) {
        logger.error('userId é null ou undefined');
        return null;
      }
      
      // Busca profile existente
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Profile encontrado
      if (data) {
        logger.log('Profile encontrado:', data);
        return data;
      }
      // Se não encontrou, indica que precisa completar perfil
      // Profile não existe - tenta criar
      if (error?.code === 'PGRST116' || !data) {
        logger.log('Profile não encontrado, criando novo...');
        
        // Usa userData passado como parâmetro
        const userMetadata = userData?.user_metadata || {};
        const email = userData?.email || '';
        
        const profileData = {
          id: userId,
          full_name: userMetadata.full_name || email.split('@')[0] || 'Usuário',
          phone: userMetadata.phone || null,
          is_admin: false,
          status: 'pending' as UserStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        logger.log('Criando profile com dados:', profileData);

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single();

        if (createError) {
          logger.error('Erro ao criar profile:', createError);
          
          // Se já existe (concorrência), busca novamente
          if (createError.code === '23505') {
            logger.log('Profile já existe, buscando novamente...');
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            return existingProfile;
          }
          
          // Erro de RLS ou outro problema
          if (createError.code === '42501') {
            logger.error('Erro de permissão/RLS:', createError);
            return null;
          }
          
          return null;
        }

        logger.log('Profile criado com sucesso:', newProfile);
        logger.log('Profile não encontrado - usuário precisa completar perfil');
      }

      // Outros erros
      logger.error('Erro ao buscar profile:', error);
      return null;
    } catch (error) {
      logger.error('Exceção em fetchProfile:', error);
      return null;
    }
  };

  // Função para completar perfil do usuário
  const completeProfile = useCallback(async (fullName: string, phone: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      logger.log('Completando perfil do usuário:', user.id);

      const profileData = {
        id: user.id,
        full_name: fullName,
        phone: phone,
        is_admin: false,
        status: 'pending' as UserStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        logger.error('Erro ao criar profile:', error);
        throw new Error('Erro ao completar perfil: ' + error.message);
      }

      logger.log('Profile criado com sucesso:', newProfile);
      setProfile(newProfile);
      setNeedsProfileCompletion(false);
    } catch (error) {
      logger.error('Erro em completeProfile:', error);
      throw error;
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await fetchProfile(user.id, user);
      setProfile(profile);
      setNeedsProfileCompletion(!profile);
      return profile;
    }
    return null;
  }, [user]);

  // Controle de retry inteligente
  const setupAccountWithRetry = async (userId: string, userData: User | null) => {
    retryCountRef.current = 0;
    
    while (retryCountRef.current < maxRetries) {
      try {
        const profile = await fetchProfile(userId, userData);
        
        if (profile) {
          logger.log('Account setup completed successfully');
          return profile;
        }
        
        // Incrementa retry e aguarda
        retryCountRef.current++;
        logger.log(`Retry attempt ${retryCountRef.current}/${maxRetries}`);
        
        if (retryCountRef.current < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
        }
          // Busca perfil existente
        logger.error('Error in setupAccountWithRetry:', error);
        retryCountRef.current++;
        if (retryCountRef.current < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
        }
      }
    }
    
    logger.error('Max retries reached, returning null');
    return null;
  };

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

          // Tenta configurar account com retry controlado
          const profile = await setupAccountWithRetry(session.user.id, session.user);
          
          if (!profile) {
            setNeedsProfileCompletion(true);
            logger.log('Profile não encontrado - redirecionando para completar perfil');
            logger.log('Account setup failed, will show setup screen');
          } else {
            setProfile(profile);
            setNeedsProfileCompletion(false);
            logger.log('Account setup completed');
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setNeedsProfileCompletion(false);
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

        const profile = await setupAccountWithRetry(session.user.id, session.user);
        
        if (!profile) {
          setNeedsProfileCompletion(true);
        } else {
          setProfile(profile);
          setNeedsProfileCompletion(false);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setNeedsProfileCompletion(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    try {
      logger.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setNeedsProfileCompletion(false);
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
        const profile = await setupAccountWithRetry(data.user.id, data.user);
        setProfile(profile);
        
        setNeedsProfileCompletion(!profile);
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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          }
        }
      });
      
      if (error) throw error;

      logger.log('Sign up successful:', data.user?.id);
      
      // Após cadastro, usuário precisa completar perfil
      if (data.user) {
        setNeedsProfileCompletion(true);
      }
      
      return data;
    }
    needsProfileCompletion,
    completeProfile,
  }
}