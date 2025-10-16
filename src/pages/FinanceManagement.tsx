import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Landmark } from 'lucide-react';

import { financeApi, PackageWithRelations } from '../services/financeApi';
import { FinanceFilters, FinanceFiltersState } from '../components/finance/FinanceFilters';
import { FinanceSummary } from '../components/finance/FinanceSummary';
import { FinanceTable } from '../components/finance/FinanceTable';
import { FinancePackageModal } from '../components/finance/FinancePackageModal';
import { exportToPdf } from '../utils/pdfExporter';
import { Agency, Driver } from '../types/finance';

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
    try {
      setLoading(true);
      const { data, error } = await financeApi.list(filters);
      if (error) throw new Error(error.message);
      setPackages(data);
    } catch (error: any) {
      toast.error('Erro ao carregar dados financeiros: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const agencyName = pkg.agencies?.name ?? '';
      const reportDate = new Date(pkg.start_date);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate && reportDate < startDate) return false;
      if (endDate && reportDate > endDate) return false;
      if (filters.status !== 'all' && pkg.status_pagamento !== filters.status) return false;
      if (filters.searchTerm && !agencyName.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [packages, filters]);

  const handleEditPackage = (pkg: PackageWithRelations) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPackage(null);
  };

  const handleSavePackage = async (updatedPackage: PackageWithRelations) => {
    const { error } = await financeApi.updatePackage(updatedPackage.id, {
        agency_id: updatedPackage.agency_id,
        driver_id: updatedPackage.driver_id,
        status: updatedPackage.status_pagamento === 'pago' ? 'completed' : updatedPackage.status_pagamento === 'pendente' ? 'confirmed' : 'cancelled',
        start_date: updatedPackage.start_date,
        // Os campos financeiros mockados não são salvos
    });
    if (error) {
      toast.error(error.message);
      throw new Error(error.message);
    }
    await fetchFinancialData(); // Refetch para buscar os dados atualizados
  };

  const handleDeletePackage = async (packageId: string) => {
    const { error } = await financeApi.deletePackage(packageId);
     if (error) {
      toast.error(error.message);
      throw new Error(error.message);
    }
    setPackages(prev => prev.filter(p => p.id !== packageId));
  };

  const handleExportPdf = () => {
    if (filteredPackages.length === 0) {
      toast.warn('Não há dados para exportar.');
      return;
    }

    const columns = [
      { header: 'Agência', accessor: (row: PackageWithRelations) => row.agencies?.name ?? 'N/A' },
      { header: 'Pacote', accessor: 'title' },
      { header: 'Motorista', accessor: (row: PackageWithRelations) => row.drivers?.name ?? 'N/A' },
      { header: 'Valor', accessor: (row: PackageWithRelations) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_total) },
      { header: 'Status', accessor: 'status_pagamento' },
      { header: 'Data Início', accessor: (row: PackageWithRelations) => new Date(row.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
    ];

    exportToPdf(filteredPackages, columns);
    toast.success('Relatório PDF gerado com sucesso!');
  };

  // Extrai listas únicas para os selects do modal
  const uniqueAgencies = useMemo(() => Array.from(new Map(packages.map(p => [p.agencies?.id, p.agencies])).values()).filter(Boolean) as Agency[], [packages]);
  const uniqueDrivers = useMemo(() => Array.from(new Map(packages.map(p => [p.drivers?.id, p.drivers])).values()).filter(Boolean) as Driver[], [packages]);

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
              Gerencie e acompanhe as reservas e o financeiro dos pacotes.
            </p>
          </div>
        </div>
      </div>

      <FinanceFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExportPdf}
      />

      <FinanceSummary packages={filteredPackages} expenses={750.50} />

      <FinanceTable
        packages={filteredPackages}
        onEdit={handleEditPackage}
        loading={loading}
      />

      {isModalOpen && (
        <FinancePackageModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSavePackage}
            onDelete={handleDeletePackage}
            pkg={selectedPackage}
            agencies={uniqueAgencies}
            drivers={uniqueDrivers}
        />
      )}
    </div>
  );
};