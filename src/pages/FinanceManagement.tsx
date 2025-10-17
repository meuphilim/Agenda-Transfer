import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Landmark, Download } from 'lucide-react';

import { financeApi, PackageWithRelations } from '../services/financeApi';
import { FinanceFilters, FinanceFiltersState } from '../components/finance/FinanceFilters';
import { FinanceSummary } from '../components/finance/FinanceSummary';
import { FinanceTable } from '../components/finance/FinanceTable';
import { FinancePackageModal } from '../components/finance/FinancePackageModal';
import { exportToPdf, Column } from '../utils/pdfExporter';
import { Agency, Driver } from '../types/finance';
import { FloatingActionButton } from '../components/Common';

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
  const [packages, setPackages] = useState<PackageWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FinanceFiltersState>(getInitialFilters());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageWithRelations | null>(null);

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await financeApi.list(filters);
      if (error) throw new Error(error.message);
      setPackages(data);
    } catch (error: any) {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchFinancialData();
  }, [fetchFinancialData]);

  const filteredPackages = useMemo(() => {
    // A API já filtra, mas podemos ter um filtro client-side adicional se necessário
    return packages;
  }, [packages]);

  const handleEditPackage = (pkg: PackageWithRelations) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const handleSavePackage = async () => {
    // ... (lógica de salvar)
    await fetchFinancialData();
  };

  const handleDeletePackage = (packageId: string) => {
    // ... (lógica de deletar)
    setPackages(prev => prev.filter(p => p.id !== packageId));
  };

  const handleExportPdf = () => {
    if (filteredPackages.length === 0) {
      toast.warn('Não há dados para exportar.');
      return;
    }
    const columns: Column<PackageWithRelations>[] = [
      { header: 'Agência', accessor: (row) => row.agencies?.name ?? 'N/A' },
      { header: 'Pacote', accessor: 'title' },
      { header: 'Valor', accessor: (row) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_total) },
      { header: 'Status', accessor: 'status_pagamento' },
      { header: 'Data', accessor: (row) => new Date(row.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
    ];
    exportToPdf(filteredPackages, columns, 'Relatorio_Financeiro');
    toast.success('Relatório PDF gerado!');
  };

  const uniqueAgencies = useMemo(() => Array.from(new Map(packages.map(p => [p.agencies?.id, p.agencies])).values()).filter(Boolean) as Agency[], [packages]);
  const uniqueDrivers = useMemo(() => Array.from(new Map(packages.map(p => [p.drivers?.id, p.drivers])).values()).filter(Boolean) as Driver[], [packages]);

  return (
    <>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <Landmark className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Relatórios Financeiros</h1>
              <p className="mt-1 text-sm text-gray-500">Acompanhe as finanças dos pacotes.</p>
            </div>
          </div>
        </div>

        <FinanceFilters filters={filters} onFilterChange={setFilters} onExport={handleExportPdf} />
        <FinanceSummary packages={filteredPackages} expenses={750.50} />
        <FinanceTable packages={filteredPackages} onEdit={handleEditPackage} loading={loading} />
      </div>

      {isModalOpen && (
        <FinancePackageModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSavePackage}
            onDelete={handleDeletePackage}
            pkg={selectedPackage}
            agencies={uniqueAgencies}
            drivers={uniqueDrivers}
        />
      )}

      <FloatingActionButton icon={Download} onClick={handleExportPdf} color="green" />
    </>
  );
};