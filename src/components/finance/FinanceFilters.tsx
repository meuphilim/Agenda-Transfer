import { Agency } from '../../types/finance';
import { Download, Search, X } from 'lucide-react';

export interface FinanceFiltersState {
  startDate: string;
  endDate: string;
  status: 'all' | 'pago' | 'pendente' | 'cancelado';
  agencyId: string;
  searchTerm: string;
}

interface FinanceFiltersProps {
  filters: FinanceFiltersState;
  onFilterChange: (filters: FinanceFiltersState) => void;
  onExport?: () => void;
  agencies: Agency[];
  hideStatusFilter?: boolean;
  hideAgencyFilter?: boolean;
}

export const FinanceFilters: React.FC<FinanceFiltersProps> = ({
  filters,
  onFilterChange,
  onExport,
  agencies,
  hideStatusFilter = false,
  hideAgencyFilter = false,
}) => {
  const handleInputChange = (
    field: keyof FinanceFiltersState,
    value: string
  ) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      startDate: '',
      endDate: '',
      status: 'all',
      agencyId: 'all',
      searchTerm: '',
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Filters */}
        <div>
          <label className="block text-sm font-medium mb-1">Data Início</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data Fim</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>

        {/* Status Filter */}
        {!hideStatusFilter && (
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="all">Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        )}

        {/* Agency Filter */}
        {!hideAgencyFilter && (
          <div>
            <label className="block text-sm font-medium mb-1">Agência</label>
            <select
              value={filters.agencyId}
              onChange={(e) => handleInputChange('agencyId', e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="all">Todas</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search Term */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium mb-1">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cliente ou pacote..."
              value={filters.searchTerm}
              onChange={(e) => handleInputChange('searchTerm', e.target.value)}
              className="w-full p-2 pl-10 border rounded-lg"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
        <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <X size={14} /> Limpar
        </button>
        <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
          <Download size={14} /> Exportar PDF
        </button>
      </div>
    </div>
  );
};