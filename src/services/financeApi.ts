type PaymentStatus = 'pago' | 'pendente' | 'cancelado';

interface PackageReport {
  id: string;
  cliente: string;
  pacote: string;
  valor_total: number;
  status_pagamento: PaymentStatus;
  data_venda: string;
  data_fechamento: string | null;
}

// Mock API service for finance data
export const financeApi = {
  list: async (filters: any): Promise<{ data: PackageReport[], error: null | string }> => {
    console.log('Fetching financial data with filters:', filters);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data
    const data: PackageReport[] = [
      { id: '1', cliente: 'João Silva', pacote: 'Barra do Sucuri', valor_total: 350.00, status_pagamento: 'pago', data_venda: '2025-10-05', data_fechamento: '2025-10-05' },
      { id: '2', cliente: 'Maria Santos', pacote: 'Gruta Azul', valor_total: 280.00, status_pagamento: 'pendente', data_venda: '2025-10-07', data_fechamento: null },
      { id: '3', cliente: 'Pedro Almeida', pacote: 'Abismo Anhumas', valor_total: 1200.00, status_pagamento: 'pago', data_venda: '2025-10-08', data_fechamento: '2025-10-09' },
      { id: '4', cliente: 'Ana Costa', pacote: 'Estância Mimosa', valor_total: 450.00, status_pagamento: 'cancelado', data_venda: '2025-10-10', data_fechamento: '2025-10-10' },
    ];

    return { data, error: null };
  }
};