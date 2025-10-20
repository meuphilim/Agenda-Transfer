import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Download, TrendingUp, DollarSign, FileText, ShieldAlert } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

import { financeApi, PackageWithRelations } from '../../../services/financeApi';
import { FinanceFilters, FinanceFiltersState } from '../FinanceFilters';
import { FinanceTable } from '../FinanceTable';
import { FinancePackageModal } from '../FinancePackageModal';
import { exportToPdf, Column } from '../../../utils/pdfExporter';
import { Agency } from '../../../types/finance';
import { FloatingActionButton } from '../../Common';

const getInitialFilters = (): FinanceFiltersState => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    status: 'all',
    agencyId: 'all',
    searchTerm: '',
  };
};

export const PackageReports: React.FC = () => {
  const [packages, setPackages] = useState<PackageWithRelations[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FinanceFiltersState>(getInitialFilters());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageWithRelations | null>(null);

  useEffect(() => {
    const fetchAgencies = async () => {
      const { data } = await supabase.from('agencies').select('id, name').eq('active', true).order('name');
      if (data) setAgencies(data as Agency[]);
    };
    void fetchAgencies();
  }, []);

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await financeApi.list(filters);
      if (error) throw new Error(error.message);
      if (data) setPackages(data);
    } catch (error: any) {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchFinancialData();
  }, [fetchFinancialData]);

  const metrics = useMemo(() => {
    const totalReceita = packages.filter(p => p.status_pagamento === 'pago').reduce((sum, p) => sum + p.valor_receita_total, 0);
    const totalReceitaPendente = packages.filter(p => p.status_pagamento === 'pendente').reduce((sum, p) => sum + p.valor_receita_total, 0);
    const totalDiariasServico = packages.reduce((sum, p) => sum + p.valor_diaria_servico_calculado, 0);
    const totalNetReceita = packages.reduce((sum, p) => sum + p.valor_net_receita, 0);
    const totalCustos = packages.reduce((sum, p) => sum + p.valor_custo_total, 0);
    const totalDiariasMotorista = packages.reduce((sum, p) => sum + p.valor_diaria_motorista_calculado, 0);
    const totalDespesasVeiculo = packages.reduce((sum, p) => sum + p.valor_despesas_veiculo, 0);
    const margemBruta = packages.reduce((sum, p) => sum + p.valor_margem_bruta, 0);
    const margemPercentual = totalReceita > 0 ? (margemBruta / totalReceita) * 100 : 0;

    return {
      totalReceita,
      totalReceitaPendente,
      totalDiariasServico,
      totalNetReceita,
      totalCustos,
      totalDiariasMotorista,
      totalDespesasVeiculo,
      margemBruta,
      margemPercentual,
      totalPacotes: packages.length,
    };
  }, [packages]);

  const handleEditPackage = (pkg: PackageWithRelations) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const handleExportPdf = () => {
    if (packages.length === 0) {
      toast.warn('Não há dados para exportar.');
      return;
    }

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const columns: Column<PackageWithRelations>[] = [
      { header: 'Agência', accessor: (row) => row.agencies?.name ?? 'N/A' },
      { header: 'Pacote', accessor: 'title' },
      { header: 'Cliente', accessor: 'client_name' },
      { header: 'Período', accessor: (row) => `${new Date(row.start_date).toLocaleDateString('pt-BR')} - ${new Date(row.end_date).toLocaleDateString('pt-BR')}` },
      { header: 'Receita Total', accessor: (row) => formatCurrency(row.valor_receita_total) },
      { header: 'Diárias Serviço', accessor: (row) => formatCurrency(row.valor_diaria_servico_calculado) },
      { header: 'Custos Totais', accessor: (row) => formatCurrency(row.valor_custo_total) },
      { header: 'Diárias Motorista', accessor: (row) => formatCurrency(row.valor_diaria_motorista_calculado) },
      { header: 'Despesas Veículo', accessor: (row) => formatCurrency(row.valor_despesas_veiculo) },
      { header: 'Margem Bruta', accessor: (row) => formatCurrency(row.valor_margem_bruta) },
      { header: 'Margem %', accessor: (row) => `${row.percentual_margem.toFixed(1)}%` },
      { header: 'Status', accessor: 'status_pagamento' },
    ];

    exportToPdf(packages, columns, `Demonstrativo_Financeiro_${filters.startDate}_${filters.endDate}`);
    toast.success('Relatório PDF gerado com sucesso!');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="p-4 md:p-6">
      <FinanceFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExportPdf}
        agencies={agencies}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Receita Total</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.totalReceita)}</p>
              <p className="text-xs text-green-600 mt-1">Diárias: {formatCurrency(metrics.totalDiariasServico)}</p>
              <p className="text-xs text-green-600">NET: {formatCurrency(metrics.totalNetReceita)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Custos Totais</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(metrics.totalCustos)}</p>
              <p className="text-xs text-red-600 mt-1">Motoristas: {formatCurrency(metrics.totalDiariasMotorista)}</p>
              <p className="text-xs text-red-600">Veículos: {formatCurrency(metrics.totalDespesasVeiculo)}</p>
            </div>
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Margem Bruta</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(metrics.margemBruta)}</p>
              <p className="text-xs text-purple-600 mt-1">{metrics.margemPercentual.toFixed(1)}% da receita</p>
              <p className="text-xs text-purple-600">{metrics.totalPacotes} pacote(s)</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">A Receber</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(metrics.totalReceitaPendente)}</p>
              <p className="text-xs text-yellow-600 mt-1">Pagamentos pendentes</p>
            </div>
            <FileText className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <FinanceTable
        packages={packages}
        onEdit={handleEditPackage}
        loading={loading}
      />

      {isModalOpen && selectedPackage && (
        <FinancePackageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pkg={selectedPackage}
        />
      )}

      <FloatingActionButton
        icon={Download}
        onClick={handleExportPdf}
        color="green"
      />
    </div>
  );
};