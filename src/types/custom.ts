// src/types/custom.ts

export interface Agency {
  id: string;
  name: string;
  user_id: string | null;
  is_active: boolean;
  contact_email: string;
  contact_phone: string;
  created_at: string;
}

// Representa uma reserva feita por uma agência, usando a tabela 'packages'
export interface PackageReservation {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  observation: string;
  agency_id: string;
  created_by_agency: boolean;
  status: 'pending';
  vehicle_id: null;
  driver_id: null;
  reservation_notes?: string;
}

export interface AvailabilityDay {
  date: string;
  available_vehicles: number;
  is_available: boolean;
}
