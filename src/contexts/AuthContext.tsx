// src/contexts/AuthContext.tsx - VERSÃO CORRIGIDA E OTIMIZADA
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Tipos exportados para uso em outros locais da aplicação.
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
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountSetup, setAccountSetup] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  
  const fetchInProgressRef = useRef<Map<string, Promise<UserProfile | null>>>(new Map());

  // ✅ CORREÇÃO: Função memoizada com useCallback para buscar o perfil do usuário.
  // Evita recriações em re-renderizações e estabiliza a dependência de outros hooks.
  const fetchProfile = useCallback(async (userId: string, forceRefresh = false): Promise<UserProfile | null> => {
    if (!userId || typeof userId !== 'string') {
      console.error('ERRO: ID de usuário inválido fornecido para fetchProfile:', userId);
      return null;
    }

    if (!forceRefresh && fetchInProgressRef.current.has(userId)) {
      console.log(`⏸️ Aguardando busca de perfil em andamento para: ${userId}`);
      return fetchInProgressRef.current.get(userId)!;
    }

    const fetchPromise = (async () => {
      try {
        console.log(`🔎 Buscando perfil para o usuário: ${userId}`);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('❌ Erro ao buscar perfil:', error);
          return null;
        }

        if (data) {
          console.log('✅ Perfil encontrado:', data);
          return data;
        }

        console.log('⏳ Perfil ainda não existe para o usuário, aguardando criação...');
        return null;
      } catch (error) {
        console.error('🚨 Exceção crítica em fetchProfile:', error);
        return null;
      } finally {
        fetchInProgressRef.current.delete(userId);
      }
    })();

    fetchInProgressRef.current.set(userId, fetchPromise);
    return fetchPromise;
  }, []);

  // ✅ CORREÇÃO: Função memoizada para tentar configurar a conta com retentativas.
  const setupAccountWithRetry = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!userId) {
      console.error('ERRO: ID de usuário inválido para setupAccountWithRetry.');
      return null;
    }

    for (let i = 0; i < 3; i++) {
      console.log(`⏳ Tentativa ${i + 1} de buscar perfil para ${userId}`);
      const profile = await fetchProfile(userId);

      if (profile) {
        console.log('✅ Configuração da conta finalizada com sucesso.');
        return profile;
      }

      const delay = 1000 * Math.pow(2, i);
      console.log(`🔄 Perfil não encontrado. Tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.error(`❌ Máximo de retentativas (3) alcançado para ${userId}.`);
    setNeedsProfileCompletion(true);
    return null;
  }, [fetchProfile]);

  // ✅ CORREÇÃO: useEffect principal com array de dependências vazio [].
  // Roda apenas uma vez, na montagem do componente, para configurar o listener de autenticação.
  useEffect(() => {
    console.log('AuthProvider montado. Configurando listener de autenticação...');
    setLoading(true);

    // Função para processar a sessão do usuário
    const processSession = async (session: Session | null) => {
      if (session?.user) {
        const currentUser = session.user;
        setSession(session);
        setUser(currentUser);
        
        const profile = await setupAccountWithRetry(currentUser.id);
        setProfile(profile);
        setNeedsProfileCompletion(!profile);
      } else {
        // Limpa o estado se não houver sessão
        setSession(null);
        setUser(null);
        setProfile(null);
        setNeedsProfileCompletion(false);
      }
      setAccountSetup(true);
      setLoading(false);
    };

    // Pega a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Verificando sessão inicial...');
      processSession(session);
    });

    // Configura o listener para futuras mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔄 Evento de autenticação recebido: ${event}`);
        processSession(session);
      }
    );

    // Função de limpeza para remover o listener quando o componente for desmontado
    return () => {
      console.log('AuthProvider desmontado. Removendo listener.');
      subscription.unsubscribe();
    };
  }, [setupAccountWithRetry]); // setupAccountWithRetry é estável devido ao useCallback

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) {
      console.log('⚠️ Impossível atualizar perfil - usuário não logado.');
      return null;
    }

    try {
      const refreshedProfile = await fetchProfile(user.id, true); // Força a atualização
      if (refreshedProfile) {
        setProfile(refreshedProfile);
      }
      return refreshedProfile;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      return null;
    }
  }, [user, fetchProfile]);

  const completeProfile = useCallback(async (fullName: string, phone: string) => {
    if (!user) throw new Error('Usuário não autenticado para completar o perfil.');

    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{ id: user.id, full_name: fullName, phone: phone, is_admin: false, status: 'pending' }]);

      if (error) throw error;

      const profile = await fetchProfile(user.id, true); // Força a busca do perfil recém-criado
      if (profile) {
        setProfile(profile);
        setNeedsProfileCompletion(false);
      }
    } catch (error) {
      console.error('❌ Erro ao completar perfil:', error);
      throw error;
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Desconectando usuário...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);
      setNeedsProfileCompletion(false);
      console.log('✅ Usuário desconectado com sucesso.');
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
      throw error;
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Tentando autenticar...');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // O listener onAuthStateChange cuidará de atualizar o estado.
      console.log(`✅ Autenticação bem-sucedida para: ${data.user.id}`);
      return data;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      console.log('📝 Tentando registrar novo usuário...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone: phone } },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Cadastro falhou, usuário não foi criado.");
      // O listener onAuthStateChange cuidará de atualizar o estado.
      console.log(`✅ Registro bem-sucedido para: ${data.user.id}`);
      return data;
    } catch (error) {
      console.error('❌ Erro no registro:', error);
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