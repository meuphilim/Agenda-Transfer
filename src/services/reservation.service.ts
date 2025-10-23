// src/services/reservation.service.ts
import { supabase } from '../lib/supabase';
import { PackageReservation } from '../types/custom';

export const reservationService = {
  /**
   * Cria uma nova reserva de pacote para uma agência.
   * @param reservation - Os dados da reserva a ser criada.
   * @returns O ID do pacote criado.
   */
  async createAgencyReservation(
    reservation: Omit<PackageReservation, 'id' | 'created_by_agency' | 'status' | 'vehicle_id' | 'driver_id'>
  ): Promise<string> {

    const { data, error } = await supabase
      .from('packages')
      .insert({
        ...reservation,
        // Valores fixos para reservas criadas por agências
        created_by_agency: true,
        status: 'pending',
        vehicle_id: null,
        driver_id: null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar reserva de agência:', error);
      throw error;
    }

    if (!data) {
      throw new Error('A criação da reserva não retornou um ID.');
    }

    return data.id;
  },

  /**
   * Busca todas as reservas (pacotes) criadas por uma agência específica.
   * @param agencyId - O ID da agência.
   * @returns Uma lista de pacotes.
   */
  async getReservationsByAgency(agencyId: string): Promise<PackageReservation[]> {
    if (!agencyId) return [];

    const { data, error } = await supabase
      .from('packages')
      .select(`
        id,
        title,
        start_date,
        end_date,
        observation,
        status,
        created_at
      `)
      .eq('agency_id', agencyId)
      .eq('created_by_agency', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar reservas da agência:', error);
      throw error;
    }

    return data || [];
  },
};
