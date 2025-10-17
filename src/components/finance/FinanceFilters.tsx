import React, { useState } from 'react';
import { Filter, Search, Calendar, ChevronDown, Download } from 'lucide-react';
import { BottomSheet } from '../Common/BottomSheet';
import { cn } from '../../lib/utils';

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

export const FinanceFilters: React.FC<FinanceFiltersProps> = ({ filters, onFilterChange, onExport }) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFilterChange({ ...filters, [name]: e.target.value });
  };

  const FiltersContent = () => (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
          <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
          <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
        </div>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select id="status" name="status" value={filters.status} onChange={handleInputChange} className="w-full p-2 border rounded-lg">
          <option value="all">Todos</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      <div>
        <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Buscar Agência</label>
        <input type="text" id="searchTerm" name="searchTerm" placeholder="Nome da agência..." value={filters.searchTerm} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
      </div>
       <div className="pt-4 border-t">
         <button onClick={() => { onFilterChange({ startDate: '', endDate: '', status: 'all', searchTerm: '' }); setIsMobileFiltersOpen(false); }} className="w-full text-center p-2 border rounded-lg">Limpar Filtros</button>
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      {/* Mobile */}
      <div className="md:hidden space-y-2">
        <button onClick={() => setIsMobileFiltersOpen(true)} className="w-full flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
          <span className="flex items-center gap-2 text-gray-700"><Filter size={16}/> Filtros</span>
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="startDate-desktop" className="text-sm font-medium">Data Início</label>
              <input type="date" id="startDate-desktop" name="startDate" value={filters.startDate} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-lg"/>
            </div>
            <div>
              <label htmlFor="endDate-desktop" className="text-sm font-medium">Data Fim</label>
              <input type="date" id="endDate-desktop" name="endDate" value={filters.endDate} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-lg"/>
            </div>
          </div>
          <div>
            <label htmlFor="status-desktop" className="text-sm font-medium">Status</label>
            <select id="status-desktop" name="status" value={filters.status} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-lg">
              <option value="all">Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label htmlFor="searchTerm-desktop" className="text-sm font-medium">Buscar</label>
            <input type="text" id="searchTerm-desktop" name="searchTerm" placeholder="Nome da agência..." value={filters.searchTerm} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-lg"/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onFilterChange({ startDate: '', endDate: '', status: 'all', searchTerm: '' })} className="w-full p-2 border rounded-lg">Limpar</button>
            <button onClick={onExport} className="w-full p-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"><Download size={16}/> Exportar</button>
          </div>
        </div>
      </div>

      <BottomSheet isOpen={isMobileFiltersOpen} onClose={() => setIsMobileFiltersOpen(false)} title="Filtros">
        <FiltersContent />
      </BottomSheet>
    </div>
  );
};