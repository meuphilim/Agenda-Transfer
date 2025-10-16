import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Landmark } from 'lucide-react';

import { financeApi, FinanceData } from '../services/financeApi';
import { FinanceFilters, FinanceFiltersState } from '../components/finance/FinanceFilters';
import { FinanceSummary } from '../components/finance/FinanceSummary';
import { FinanceTable } from '../components/finance/FinanceTable';
import { FinancePackageModal } from '../components/finance/FinancePackageModal';
import { Booking } from '../types/finance';
import { exportToPdf } from '../utils/pdfExporter';

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
  const [financeData, setFinanceData] = useState<FinanceData>({ agencies: [], drivers: [], packages: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FinanceFiltersState>(getInitialFilters());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await financeApi.list(filters);
      if (error) throw new Error(String(error));
      setFinanceData(data);
    } catch (error: any) {
      toast.error('Erro ao carregar dados financeiros: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const filteredBookings = useMemo(() => {
    const { bookings, agencies } = financeData;
    return bookings.filter(booking => {
      const agencyName = agencies.find(a => a.id === booking.agency_id)?.name ?? '';
      const reportDate = new Date(booking.data_venda);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate && reportDate < startDate) return false;
      if (endDate && reportDate > endDate) return false;
      if (filters.status !== 'all' && booking.status_pagamento !== filters.status) return false;
      if (filters.searchTerm && !agencyName.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [financeData, filters]);

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleSaveBooking = async (updatedBooking: Booking) => {
    const { error } = await financeApi.updateBooking(updatedBooking.id, updatedBooking);
    if (error) {
      throw new Error(error);
    }
    setFinanceData(prevData => ({
      ...prevData,
      bookings: prevData.bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b),
    }));
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const { error } = await financeApi.deleteBooking(bookingId);
     if (error) {
      throw new Error(error);
    }
    setFinanceData(prevData => ({
      ...prevData,
      bookings: prevData.bookings.filter(b => b.id !== bookingId),
    }));
  };

  const handleExportPdf = () => {
    if (filteredBookings.length === 0) {
      toast.warn('Não há dados para exportar.');
      return;
    }

    const { agencies, packages, drivers } = financeData;
    const getName = (id: string | null, items: {id: string, name: string}[]) => items.find(i => i.id === id)?.name ?? 'N/A';

    const columns = [
      { header: 'Agência', accessor: (row: Booking) => getName(row.agency_id, agencies) },
      { header: 'Pacote', accessor: (row: Booking) => getName(row.package_id, packages) },
      { header: 'Motorista', accessor: (row: Booking) => getName(row.driver_id, drivers) },
      { header: 'Valor', accessor: (row: Booking) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_total) },
      { header: 'Status', accessor: 'status_pagamento' },
      { header: 'Data Venda', accessor: (row: Booking) => new Date(row.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
    ];

    exportToPdf(filteredBookings, columns);
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

      <FinanceSummary bookings={filteredBookings} expenses={750.50} /* Valor mockado para despesas */ />

      <FinanceTable
        bookings={filteredBookings}
        agencies={financeData.agencies}
        drivers={financeData.drivers}
        packages={financeData.packages}
        loading={loading}
        onEdit={handleEditBooking}
      />

      {isModalOpen && (
        <FinancePackageModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveBooking}
            onDelete={handleDeleteBooking}
            booking={selectedBooking}
            agencies={financeData.agencies}
            drivers={financeData.drivers}
            packages={financeData.packages}
        />
      )}
    </div>
  );
};