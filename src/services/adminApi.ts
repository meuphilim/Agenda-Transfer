import { supabase } from '../lib/supabase';
import { Agency } from '../types/database.types';

const ADMIN_USERS_ENDPOINT = '/api/admin';

interface UserProfile {
  id: string;
  full_name: string;
  email?: string | null;
  phone: string | null;
  is_admin: boolean;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const getAuthHeaders = async (): Promise<HeadersInit> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No active session');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
};

export const adminApi = {
  listUsers: async (): Promise<ApiResponse<UserProfile[]>> => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(ADMIN_USERS_ENDPOINT, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error ?? 'Falha ao buscar usuários' };
      }

      const data = await response.json();
      return { data: data.users };
    } catch (error) {
      console.error('Error listing users:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  updateUser: async (userId: string, updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(ADMIN_USERS_ENDPOINT, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ userId, updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error ?? 'Falha ao atualizar usuário' };
      }

      const data = await response.json();
      return { data: data.user };
    } catch (error) {
      console.error('Error updating user:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  deleteUser: async (userId: string): Promise<ApiResponse<{ success: boolean }>> => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(ADMIN_USERS_ENDPOINT, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error ?? 'Falha ao excluir usuário' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getAllAgencies(): Promise<Pick<Agency, 'id' | 'name'>[]> {
    const { data, error } = await supabase
      .from('agencies')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error("Erro ao buscar agências:", error);
      throw error;
    }

    return data || [];
  },
};
