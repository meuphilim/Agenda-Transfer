// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserRole } from '../types/enums';

interface AuthProfile {
  role: UserRole;
  agencyId: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async (currentUser: User | null) => {
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Tenta buscar o perfil da agência
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (agency) {
        setProfile({ role: UserRole.AGENCY, agencyId: agency.id });
      } else {
        // Se não for agência, assume-se que é staff/admin
        // Uma lógica mais robusta poderia consultar a tabela 'profiles'
        setProfile({ role: UserRole.STAFF, agencyId: null });
      }
      setLoading(false);
    };

    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      await fetchSessionAndProfile(session?.user ?? null);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        await fetchSessionAndProfile(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    loading,
    isAgency: profile?.role === UserRole.AGENCY,
    isStaff: profile?.role === UserRole.STAFF || profile?.role === UserRole.ADMIN
  };
};
