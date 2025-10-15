import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Interface para tipagem do Profile
interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export default async (req: Request) => {
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

    const userToken = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(userToken);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin, status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin || profile.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    if (req.method === 'GET') {
      const { data: users, error } = await adminClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Validação: garantir que users existe e é array
      if (!users || !Array.isArray(users)) {
        return new Response(
          JSON.stringify({ users: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { data: authUsers } = await adminClient.auth.admin.listUsers();

      // Tipagem explícita: users como Profile[]
      const usersWithEmail = (users as Profile[]).map((user) => {
        const authUser = authUsers?.users.find((au) => au.id === user.id);
        return {
          ...user,
          email: authUser?.email || null,
        };
      });

      return new Response(
        JSON.stringify({ users: usersWithEmail }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const { userId, updates } = body;

      if (!userId || !updates) {
        return new Response(
          JSON.stringify({ error: 'Missing userId or updates' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await adminClient
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ user: data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const body = await req.json();
      const { userId } = body;

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteAuthError) throw deleteAuthError;

      const { error: deleteProfileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteProfileError) throw deleteProfileError;

      return new Response(
        JSON.stringify({ success: true, message: 'User deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};