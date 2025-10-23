// src/services/reservation.service.ts
import { supabase } from '../lib/supabase';
import { PackageReservation } from '../types/agency-portal';

export const reservationService = {
  async create(reservation: Omit<PackageReservation, 'id'>): Promise<string> {
    const { data, error } = await supabase
      .from('packages')
      .insert({
        ...reservation,
        created_by_agency: true,
        status: 'pending',
        vehicle_id: null,
        driver_id: null
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async getAgencyReservations(agencyId: string): Promise<PackageReservation[]> {
    if (!agencyId) {
      console.error("ID da agência não fornecido para getAgencyReservations");
      return [];
    }

    // Consulta simplificada para evitar problemas de RLS com tabelas relacionadas
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
        console.error("Erro ao buscar reservas da agência:", error);
        throw error;
    }

    return data || [];
  }
};
