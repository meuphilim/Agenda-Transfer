// src/types/agency-portal.ts

// Representa os dados de disponibilidade retornados pela RPC
export interface AvailabilityDay {
  date: string;
  available_vehicles: number;
  is_available: boolean;
}

// Representa os dados de uma reserva, tanto para criação quanto para listagem.
// Os campos são majoritariamente opcionais para acomodar ambos os cenários.
export interface PackageReservation {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  observation: string;
  agency_id: string;

  // Campos controlados pelo sistema
  created_by_agency?: boolean;
  status?: string; // 'pending', 'confirmed', etc.
  vehicle_id?: string | null;
  driver_id?: string | null;
  reservation_notes?: string;
  created_at?: string;
}

// A interface para Agency permanece a mesma
export interface Agency {
  id: string;
  name: string;
  user_id: string | null;
  is_active: boolean;
  contact_email: string;
  contact_phone: string;
  created_at: string;
}
