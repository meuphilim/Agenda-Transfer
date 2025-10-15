import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

/**
 * Interface para tipagem do perfil de usuário
 */
interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

/**
 * Interface para o perfil com email (resultado da combinação)
 */
interface ProfileWithEmail extends Profile {
  email: string | null;
}

/**
 * Type para atualizações permitidas no perfil
 */
type ProfileUpdate = {
  full_name?: string | null;
  phone?: string | null;
  is_admin?: boolean;
  status?: 'pending' | 'active' | 'inactive';
};

export default async (req: Request) => {
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Validar header de autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obter variáveis de ambiente
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com token do usuário
    const userToken = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validar token e obter usuário autenticado
    const { data: { user: authenticatedUser }, error: userError } = await supabaseClient.auth.getUser(userToken);

    if (userError || !authenticatedUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário autenticado é admin
    const { data: adminProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin, status')
      .eq('id', authenticatedUser.id)
      .single();

    if (profileError || !adminProfile?.is_admin || adminProfile.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente admin com service key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // GET: Listar todos os usuários
    if (req.method === 'GET') {
      const { data: profiles, error: fetchError } = await adminClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch profiles: ${fetchError.message}`);
      }

      // Validação crítica: verificar se profiles existe e é um array
      if (!profiles || !Array.isArray(profiles)) {
        return new Response(
          JSON.stringify({ users: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Buscar dados de autenticação dos usuários
      const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();

      if (authError) {
        console.error('Error fetching auth users:', authError);
        // Continuar sem emails se houver erro
      }

      // CORREÇÃO DO ERRO 1: Tipar explicitamente os profiles
      const typedProfiles: Profile[] = profiles as Profile[];

      // Combinar perfis com emails (com tipagem explícita)
      const usersWithEmail: ProfileWithEmail[] = typedProfiles.map((profile: Profile) => {
        const authUser = authData?.users.find((au) => au.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || null,
        };
      });

      return new Response(
        JSON.stringify({ users: usersWithEmail }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // PUT: Atualizar usuário
    if (req.method === 'PUT') {
      const body = await req.json();
      const { userId, updates } = body;

      if (!userId || !updates) {
        return new Response(
          JSON.stringify({ error: 'Missing userId or updates' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // CORREÇÃO DO ERRO 2: Usar type específico para updates
      const allowedFields: (keyof ProfileUpdate)[] = ['full_name', 'phone', 'is_admin', 'status'];
      const updateData: ProfileUpdate = {};

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key as keyof ProfileUpdate)) {
          const typedKey = key as keyof ProfileUpdate;
          // Validação de tipo por campo
          if (typedKey === 'full_name' || typedKey === 'phone') {
            updateData[typedKey] = typeof value === 'string' ? value : null;
          } else if (typedKey === 'is_admin') {
            updateData[typedKey] = Boolean(value);
          } else if (typedKey === 'status') {
            const validStatuses = ['pending', 'active', 'inactive'];
            if (typeof value === 'string' && validStatuses.includes(value)) {
              updateData[typedKey] = value as 'pending' | 'active' | 'inactive';
            }
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid fields to update' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { data: updatedProfile, error: updateError } = await adminClient
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ user: updatedProfile }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DELETE: Remover usuário
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { userId } = body;

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Não permitir que admin delete a si mesmo
      if (userId === authenticatedUser.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Deletar usuário da autenticação
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);

      if (deleteAuthError) {
        throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`);
      }

      // Deletar perfil do banco (cascade deve limpar automaticamente, mas garantimos)
      const { error: deleteProfileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteProfileError) {
        // Log do erro mas não falhar, pois auth já foi deletado
        console.error('Error deleting profile:', deleteProfileError);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Método não permitido
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin API error:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Internal server error';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};