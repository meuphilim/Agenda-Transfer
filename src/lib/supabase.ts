// src/lib/supabase.ts - CONFIGURAÇÃO AVANÇADA
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';

// ============================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '🚨 Variáveis de ambiente do Supabase não configuradas!\n' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local\n' +
    'Exemplo: cp .env.example .env.local'
  );
}

// Validação de formato da URL
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('VITE_SUPABASE_URL deve começar com https://');
}

// ============================================
// CONFIGURAÇÕES AVANÇADAS
// ============================================
const supabaseOptions: SupabaseClientOptions<'public'> = {
  auth: {
    // Auto-refresh de token antes de expirar
    autoRefreshToken: true,
    
    // Persiste sessão no localStorage
    persistSession: true,
    
    // Detecta mudanças de sessão (login/logout em outras abas)
    detectSessionInUrl: true,
    
    // Nome da chave no localStorage
    storageKey: 'agenda-transfer-auth',
    
    // Configurações de storage customizadas
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('[Supabase] Erro ao ler storage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('[Supabase] Erro ao salvar no storage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('[Supabase] Erro ao remover do storage:', error);
        }
      },
    },
    
    // Configurações de timeout e retry
    flowType: 'pkce', // Mais seguro que 'implicit'
  },
  
  // Configurações globais de requisições
  global: {
    headers: {
      'x-application-name': 'Agenda Transfer',
      'x-application-version': '1.0.0',
    },
  },
  
  // Configurações de fetch
  db: {
    schema: 'public',
  },
  
  // Configurações de realtime
  realtime: {
    params: {
      eventsPerSecond: 10, // Limita eventos por segundo
    },
  },
};

// ============================================
// CRIAÇÃO DO CLIENTE
// ============================================
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verifica se há sessão ativa
 */
export async function hasActiveSession(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('[Supabase] Erro ao verificar sessão:', error);
    return false;
  }
}

/**
 * Obtém usuário atual com tratamento de erro
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('[Supabase] Erro ao obter usuário:', error);
    return null;
  }
}

/**
 * Força refresh do token de autenticação
 */
export async function refreshAuthToken() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    
    console.log('[Supabase] ✅ Token atualizado com sucesso');
    return data.session;
  } catch (error) {
    console.error('[Supabase] ❌ Erro ao atualizar token:', error);
    return null;
  }
}

/**
 * Limpa toda a sessão e storage
 */
export async function clearSession() {
  try {
    // Remove do Supabase
    await supabase.auth.signOut();
    
    // Limpa storage local
    const storageKey = supabaseOptions.auth?.storageKey || 'supabase.auth.token';
    localStorage.removeItem(storageKey);
    sessionStorage.clear();
    
    console.log('[Supabase] ✅ Sessão limpa com sucesso');
  } catch (error) {
    console.error('[Supabase] ❌ Erro ao limpar sessão:', error);
    
    // Força limpeza mesmo com erro
    localStorage.clear();
    sessionStorage.clear();
  }
}

/**
 * Verifica saúde da conexão com Supabase
 */
export async function checkSupabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Tenta fazer uma query simples
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();
    
    const latency = Date.now() - startTime;
    
    // Erro 406 (PGRST116) significa "nenhuma linha encontrada" - isso é OK
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error.message || 'Erro desconhecido',
    };
  }
}

// ============================================
// MONITORAMENTO DE CONEXÃO
// ============================================
if (import.meta.env.DEV) {
  // Monitora mudanças de auth em desenvolvimento
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Supabase] Auth event:', event, session?.user?.email);
  });

  // Verifica saúde ao iniciar (apenas em dev)
  checkSupabaseHealth().then(health => {
    if (health.status === 'healthy') {
      console.log(`[Supabase] ✅ Conexão saudável (latência: ${health.latency}ms)`);
    } else {
      console.error(`[Supabase] ❌ Conexão com problemas: ${health.error}`);
    }
  });
}

// ============================================
// TIPOS AUXILIARES
// ============================================
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          is_admin: boolean;
          status: 'pending' | 'active' | 'inactive';
          last_activity: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      // Adicione outras tabelas conforme necessário
    };
  };
};
