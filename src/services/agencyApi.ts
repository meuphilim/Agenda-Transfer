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
 * Chama a função RPC para criar uma nova agência e vinculá-la a um usuário.
 * @param agencyData Os dados da nova agência.
 * @param userId O ID do usuário a ser vinculado.
 * @returns O ID da agência criada.
 */
export const createAgencyProfile = async (agencyData: CreateAgencyData, userId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('create_agency_and_link_user', {
    p_name: agencyData.name,
    p_contact_person: agencyData.contact_person,
    p_phone: agencyData.phone,
    p_email: agencyData.email,
    p_cnpj: agencyData.cnpj,
    p_address: agencyData.address,
    p_user_id: userId,
  });

  if (error) {
    console.error('Erro ao chamar RPC create_agency_and_link_user:', error);
    throw new Error('Não foi possível criar o perfil da agência.');
  }

  return data;
};
