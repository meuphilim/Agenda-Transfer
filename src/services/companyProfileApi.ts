import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export type CompanyProfile = Database['public']['Tables']['company_profile']['Row'];

export const getCompanyProfile = async (supabase: SupabaseClient<Database>): Promise<CompanyProfile | null> => {
  const { data, error } = await supabase
    .from('company_profile')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching company profile:', error);
    throw new Error(error.message);
  }

  return data;
};

export const updateCompanyProfile = async (
  supabase: SupabaseClient<Database>,
  profile: Partial<CompanyProfile>
): Promise<CompanyProfile | null> => {
    // Se não houver ID, tentamos criar um novo perfil.
    if (!profile.id) {
        const { data: existingProfiles, error: fetchError } = await supabase
            .from('company_profile')
            .select('id')
            .limit(1);

        if (fetchError) {
            console.error('Error checking for existing profile:', fetchError);
            throw new Error(fetchError.message);
        }

        if (existingProfiles && existingProfiles.length > 0) {
            profile.id = existingProfiles[0].id;
        } else {
            // Nenhum perfil existe, então inserimos um novo
            const { data, error } = await supabase
                .from('company_profile')
                .insert(profile)
                .select()
                .single();

            if (error) {
                console.error('Error creating company profile:', error);
                throw new Error(error.message);
            }
            return data;
        }
    }

    // Se houver um ID, atualizamos o perfil existente.
    const { data, error } = await supabase
        .from('company_profile')
        .update(profile)
        .eq('id', profile.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating company profile:', error);
        throw new Error(error.message);
    }

    return data;
};
