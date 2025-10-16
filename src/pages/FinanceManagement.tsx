import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Landmark } from 'lucide-react';

import { financeApi } from '../services/financeApi';
import { FinanceFilters, FinanceFiltersState } from '../components/finance/FinanceFilters';
import { FinanceSummary } from '../components/finance/FinanceSummary';
import { FinanceTable } from '../components/finance/FinanceTable';
import { exportToPdf } from '../utils/pdfExporter';

type PaymentStatus = 'pago' | 'pendente' | 'cancelado';

interface PackageReport {
  id: string;
  cliente: string;
  pacote: string;
  valor_total: number;
  status_pagamento: PaymentStatus;
  data_venda: string;
}

const getInitialFilters = (): FinanceFiltersState => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    status: 'all',
    searchTerm: '',
  };
};

export const FinanceManagement: React.FC = () => {
  const [reports, setReports] = useState<PackageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FinanceFiltersState>(getInitialFilters());

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await financeApi.list(filters);
      if (error) {
        throw new Error(String(error));
      }
      setReports(data ?? []);
    } catch (error: any) {
      toast.error('Erro ao carregar relatórios: ' + error.message);
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const reportDate = new Date(report.data_venda);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate && reportDate < startDate) return false;
      if (endDate && reportDate > endDate) return false;
      if (filters.status !== 'all' && report.status_pagamento !== filters.status) return false;
      if (filters.searchTerm && !report.cliente.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [reports, filters]);

  const handleExportPdf = () => {
    if (filteredReports.length === 0) {
      toast.warn('Não há dados para exportar.');
      return;
    }

    const columns = [
      { header: 'Cliente', accessor: 'cliente' },
      { header: 'Pacote', accessor: 'pacote' },
      { header: 'Valor', accessor: (row: PackageReport) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_total) },
      { header: 'Status', accessor: 'status_pagamento' },
      { header: 'Data Venda', accessor: (row: PackageReport) => new Date(row.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
    ];

    exportToPdf(filteredReports, columns);
    toast.success('Relatório PDF gerado com sucesso!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <Landmark className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Relatórios Financeiros
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Fechamento e acompanhamento financeiro dos pacotes
            </p>
          </div>
        </div>
      </div>

      <FinanceFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExportPdf}
      />

      <FinanceSummary reports={filteredReports} />

      <FinanceTable reports={filteredReports} loading={loading} />
    </div>
  );
};

export default FinanceManagement;