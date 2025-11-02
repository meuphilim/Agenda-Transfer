// src/services/agencyApi.ts
import { supabase } from '../lib/supabase';
import { Agency } from '../types/database.types'; // Supondo que o tipo Agency esteja definido

interface CreateAgencyData {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  address?: string;
}

/**
 * Chama a função RPC para criar uma nova agência com um perfil de empresa dedicado e vinculá-la a um usuário.
 * @param agencyData Os dados da nova agência.
 * @param userId O ID do usuário a ser vinculado como administrador.
 * @returns O ID da agência criada.
 */
export const createAgencyProfile = async (agencyData: CreateAgencyData, userId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('create_agency_with_company_profile', {
    p_agency_name: agencyData.name,
    p_agency_cnpj: agencyData.cnpj,
    p_agency_address: agencyData.address,
    p_agency_phone: agencyData.phone,
    p_agency_email: agencyData.email,
    p_user_id: userId,
  });

  if (error) {
    console.error('Erro ao chamar RPC create_agency_with_company_profile:', error);
    throw new Error('Não foi possível criar o perfil da agência.');
  }

  return data;
};
