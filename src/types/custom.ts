// src/types/custom.ts

// Representa uma reserva feita por uma agência, usando a tabela 'packages'
export interface PackageReservation {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  observation: string;
  agency_id: string;
  created_by_agency: boolean;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  vehicle_id: string | null;
  driver_id: string | null;
  created_at: string;
}
