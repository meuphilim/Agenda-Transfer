import { supabase } from '@/supabaseClient';

export interface CompanyProfile {
  id?: string;
  name?: string | null;
  cnpj?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  created_at?: string;
}

export const getCompanyProfile = async (): Promise<CompanyProfile | null> => {
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

export const updateCompanyProfile = async (profile: CompanyProfile): Promise<CompanyProfile | null> => {
    // Ensure there is a profile to update, and it has an ID.
    if (!profile.id) {
        // If there is no ID, we might be creating the first profile
        const { data: existingProfiles, error: fetchError } = await supabase
            .from('company_profile')
            .select('id')
            .limit(1);

        if(fetchError) {
            console.error('Error checking for existing profile:', fetchError);
            throw new Error(fetchError.message);
        }

        if(existingProfiles && existingProfiles.length > 0) {
            profile.id = existingProfiles[0].id;
        } else {
             // No profile exists, so we insert a new one
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
