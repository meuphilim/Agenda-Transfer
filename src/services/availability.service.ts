// src/services/availability.service.ts
import { supabase } from '../lib/supabase';
import { AvailabilityDay } from '../types/agency-portal';

export const availabilityService = {
  async checkPeriod(
    startDate: string,
    endDate: string
  ): Promise<AvailabilityDay[]> {
    const { data, error } = await supabase.rpc('check_vehicle_availability', {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) throw error;
    return data || [];
  },

  async getNext60Days(): Promise<AvailabilityDay[]> {
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);

    return this.checkPeriod(today, endDate.toISOString().split('T')[0]);
  }
};
