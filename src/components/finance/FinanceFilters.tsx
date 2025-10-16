import React from 'react';
import { Filter, Search, Calendar, BadgeCheck, BadgeAlert, BadgeX, RotateCcw } from 'lucide-react';

export interface FinanceFiltersState {
  startDate: string;
  endDate: string;
  status: 'all' | 'pago' | 'pendente' | 'cancelado';
  searchTerm: string;
}

interface FinanceFiltersProps {
  filters: FinanceFiltersState;
  onFilterChange: (filters: FinanceFiltersState) => void;
  onExport: () => void;
}

const statusOptions = [
  { value: 'all', label: 'Todos Status', icon: <Filter className="w-4 h-4" /> },
  { value: 'pago', label: 'Pago', icon: <BadgeCheck className="w-4 h-4 text-green-600" /> },
  { value: 'pendente', label: 'Pendente', icon: <BadgeAlert className="w-4 h-4 text-yellow-600" /> },
  { value: 'cancelado', label: 'Cancelado', icon: <BadgeX className="w-4 h-4 text-red-600" /> },
];

export const FinanceFilters: React.FC<FinanceFiltersProps> = ({ filters, onFilterChange, onExport }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleResetFilters = () => {
    onFilterChange({
      startDate: '',
      endDate: '',
      status: 'all',
      searchTerm: '',
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Start */}
        <div className="relative">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
          <Calendar className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date End */}
        <div className="relative">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
          <Calendar className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status Pagamento</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Term */}
        <div className="relative lg:col-span-2">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente</label>
          <Search className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            placeholder="Nome do cliente..."
            value={filters.searchTerm}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={handleResetFilters}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar Filtros
        </button>
        <button
          onClick={onExport}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Exportar PDF
        </button>
      </div>
    </div>
  );
};

export default FinanceFilters;