import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          cnpj: string | null;
          address: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          cnpj?: string;
          address?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          cnpj?: string;
          address?: string;
          active?: boolean;
          updated_at?: string;
        };
      };
      attractions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          estimated_duration: number;
          location: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          estimated_duration?: number;
          location?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          estimated_duration?: number;
          location?: string;
          active?: boolean;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          license_plate: string;
          model: string;
          brand: string | null;
          capacity: number;
          status: 'available' | 'in_use' | 'maintenance';
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          license_plate: string;
          model: string;
          brand?: string;
          capacity?: number;
          status?: 'available' | 'in_use' | 'maintenance';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          license_plate?: string;
          model?: string;
          brand?: string;
          capacity?: number;
          status?: 'available' | 'in_use' | 'maintenance';
          active?: boolean;
          updated_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          license_number: string;
          license_expiry: string | null;
          status: 'available' | 'busy' | 'unavailable';
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string;
          email?: string;
          license_number: string;
          license_expiry?: string;
          status?: 'available' | 'busy' | 'unavailable';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string;
          license_number?: string;
          license_expiry?: string;
          status?: 'available' | 'busy' | 'unavailable';
          active?: boolean;
          updated_at?: string;
        };
      };
      packages: {
        Row: {
          id: string;
          title: string;
          agency_id: string;
          vehicle_id: string;
          driver_id: string;
          start_date: string;
          end_date: string;
          total_participants: number;
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          agency_id: string;
          vehicle_id: string;
          driver_id: string;
          start_date: string;
          end_date: string;
          total_participants?: number;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          agency_id?: string;
          vehicle_id?: string;
          driver_id?: string;
          start_date?: string;
          end_date?: string;
          total_participants?: number;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string;
          updated_at?: string;
        };
      };
      package_attractions: {
        Row: {
          id: string;
          package_id: string;
          attraction_id: string;
          scheduled_date: string;
          start_time: string | null;
          end_time: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          package_id: string;
          attraction_id: string;
          scheduled_date: string;
          start_time?: string;
          end_time?: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          package_id?: string;
          attraction_id?: string;
          scheduled_date?: string;
          start_time?: string;
          end_time?: string;
          notes?: string;
        };
      };
    };
  };
};