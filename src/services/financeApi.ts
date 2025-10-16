import { Agency, Driver, Package, Booking } from '../types/finance';

// Mock Data
const agencies: Agency[] = [
  { id: 'agency-1', name: 'Bonito Way' },
  { id: 'agency-2', name: 'H2O Ecoturismo' },
  { id: 'agency-3', name: 'Ygarapé Tour' },
];

const drivers: Driver[] = [
  { id: 'driver-1', name: 'Carlos Souza' },
  { id: 'driver-2', name: 'Mariana Lima' },
  { id: 'driver-3', name: 'Ricardo Neves' },
];

const packages: Package[] = [
  { id: 'pkg-1', name: 'Gruta do Lago Azul' },
  { id: 'pkg-2', name: 'Rio da Prata' },
  { id: 'pkg-3', name: 'Abismo Anhumas' },
  { id: 'pkg-4', name: 'Estância Mimosa' },
];

const bookings: Booking[] = [
  {
    id: 'booking-1',
    agency_id: 'agency-1',
    package_id: 'pkg-1',
    driver_id: 'driver-1',
    status_pagamento: 'pago',
    valor_total: 350.00,
    valor_diaria: 100.00,
    valor_net: 250.00,
    translado_aeroporto: true,
    data_venda: '2025-10-05',
  },
  {
    id: 'booking-2',
    agency_id: 'agency-2',
    package_id: 'pkg-2',
    driver_id: 'driver-2',
    status_pagamento: 'pendente',
    valor_total: 280.00,
    valor_diaria: 80.00,
    valor_net: 200.00,
    translado_aeroporto: false,
    data_venda: '2025-10-07',
  },
  {
    id: 'booking-3',
    agency_id: 'agency-1',
    package_id: 'pkg-3',
    driver_id: 'driver-3',
    status_pagamento: 'pago',
    valor_total: 1200.00,
    valor_diaria: 300.00,
    valor_net: 900.00,
    translado_aeroporto: true,
    data_venda: '2025-10-08',
  },
  {
    id: 'booking-4',
    agency_id: 'agency-3',
    package_id: 'pkg-4',
    driver_id: null,
    status_pagamento: 'cancelado',
    valor_total: 450.00,
    valor_diaria: 120.00,
    valor_net: 330.00,
    translado_aeroporto: false,
    data_venda: '2025-10-10',
  },
];

export interface FinanceData {
  agencies: Agency[];
  drivers: Driver[];
  packages: Package[];
  bookings: Booking[];
}

// Mock API service for finance data
export const financeApi = {
  list: async (filters?: Record<string, any>): Promise<{ data: FinanceData; error: null | string }> => {
    console.log('Fetching financial data with filters:', filters);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      data: {
        agencies,
        drivers,
        packages,
        bookings
      },
      error: null
    };
  },

  updateBooking: async (bookingId: string, updates: Partial<Booking>): Promise<{ data: Booking | null, error: null | string }> => {
    console.log(`Updating booking ${bookingId} with:`, updates);
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) {
      return { data: null, error: 'Reserva não encontrada.' };
    }

    bookings[index] = { ...bookings[index], ...updates };
    return { data: bookings[index], error: null };
  },

  deleteBooking: async (bookingId: string): Promise<{ error: null | string }> => {
    console.log(`Deleting booking ${bookingId}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) {
      return { error: 'Reserva não encontrada.' };
    }

    bookings.splice(index, 1);
    return { error: null };
  }
};