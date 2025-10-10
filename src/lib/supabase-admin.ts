// src/lib/supabase-admin.ts - CLIENTE ADMIN PARA OPERAÇÕES PRIVILEGIADAS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Cliente ADMIN com service key (somente para operações admin)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false, // Não persistir sessão admin
        autoRefreshToken: false, // Não auto-renovar token admin
        detectSessionInUrl: false, // Não detectar sessão na URL
        storage: undefined, // Não usar storage para admin
        flowType: 'pkce',
        timeout: 30000, // 30 segundos timeout
      },
      global: {
        headers: {
          'X-Client-Info': 'agenda-transfer-admin/1.0.0',
        },
      },
    })
  : null;

// Helper para verificar se admin está disponível
export const isAdminAvailable = (): boolean => {
  return supabaseAdmin !== null;
};

// Função helper para operações admin seguras
export const safeAdminOperation = async <T>(operation: (admin: any) => Promise<T>): Promise<T | null> => {
  if (!supabaseAdmin) {
    console.error('Admin client not available');
    throw new Error('Operação admin não disponível - configure VITE_SUPABASE_SERVICE_KEY');
  }
  return operation(supabaseAdmin);
};

// Função para listar usuários com tratamento de erro
export const listUsersWithFallback = async () => {
  if (!supabaseAdmin) {
    console.warn('Admin client not available, returning empty array');
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return [];
    }
    
    return data?.users || [];
  } catch (error) {
    console.error('Exception listing users:', error);
    return [];
  }
};
