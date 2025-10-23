export type PaymentStatus = 'pago' | 'pendente' | 'cancelado';

export interface Agency {
  id: string;
  name: string;
}

export interface Driver {
  id: string;
  name: string;
}

export interface Package {
  id: string;
  name: string;
}

export interface Booking {
  id: string;
  agency_id: string;
  package_id: string;
  driver_id: string | null;
  status_pagamento: PaymentStatus;
  valor_total: number;
  valor_diaria: number;
  valor_net: number;
  translado_aeroporto: boolean;
  data_venda: string;
}