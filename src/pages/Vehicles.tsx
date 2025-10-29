import { useState, useMemo, useEffect } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, MoreVertical, Search } from 'lucide-react';
import { Modal, LoadingSpinner } from '../components/Common';
import { cn } from '../lib/utils';
import { getVehicleOccupiedDates } from '../services/availabilityService';

interface VehicleFormData {
  license_plate: string;
  model: string;
  brand: string;
  capacity: number;
  status: 'available' | 'in_use' | 'maintenance';
  active: boolean;
}

import { Database } from '../types/database.types';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface VehiclesProps {
  companyId?: string;
}

export const Vehicles: React.FC<VehiclesProps> = ({ companyId }) => {
  const { data: vehicles, loading, create, update, delete: deleteVehicle } = useSupabaseData<Vehicle>({
    table: 'vehicles',
    orderBy: { column: 'license_plate' },
    filters: { company_id: companyId },
  });
  const [occupiedDatesMap, setOccupiedDatesMap] = useState<Map<string, string[]>>(new Map());
  
  useEffect(() => {
    const fetchOccupiedDates = async () => {
      const map = new Map<string, string[]>();

      for (const vehicle of vehicles) {
        const dates = await getVehicleOccupiedDates(vehicle.id);
        map.set(vehicle.id, dates);
      }

      setOccupiedDatesMap(map);
    };

    if (vehicles.length > 0) {
      void fetchOccupiedDates();
    }
  }, [vehicles]);

  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    license_plate: '',
    model: '',
    brand: '',
    capacity: 1,
    status: 'available',
    active: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    return vehicles.filter(v =>
      v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dataToSave: Partial<Vehicle> = { ...formData };
    if (companyId) {
      dataToSave.company_id = companyId;
    }

    try {
      if (editingVehicle) {
        await update(editingVehicle.id, dataToSave);
        toast.success('Veículo atualizado!');
      } else {
        await create(dataToSave);
        toast.success('Veículo cadastrado!');
      }
      handleModalClose();
    } catch (error: any) {
      toast.error('Erro ao salvar veículo: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      license_plate: vehicle.license_plate,
      model: vehicle.model,
      brand: vehicle.brand ?? '',
      capacity: vehicle.capacity,
      status: vehicle.status,
      active: vehicle.active,
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id: string, plate: string) => {
    setActiveMenu(null);
    if (!confirm(`Excluir o veículo de placa "${plate}"?`)) return;
    await deleteVehicle(id);
    toast.success('Veículo excluído!');
  };

  const resetForm = () => {
    setFormData({
      license_plate: '', model: '', brand: '', capacity: 1, status: 'available', active: true,
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingVehicle(null);
    resetForm();
  };

  const getStatusInfo = (status: Vehicle['status']) => ({
      available: { text: 'Disponível', color: 'bg-green-100 text-green-800' },
      in_use: { text: 'Em Uso', color: 'bg-blue-100 text-blue-800' },
      maintenance: { text: 'Manutenção', color: 'bg-yellow-100 text-yellow-800' },
  }[status]);

  if (loading && !vehicles.length) {
    return <div className="p-4 md:p-6 flex justify-center items-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="flex-1 md:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por placa, modelo, marca..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
          <Plus className="h-5 w-5" />
          Novo Veículo
        </button>
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVehicles.map((vehicle) => {
              const occupiedDates = occupiedDatesMap.get(vehicle.id) ?? [];
              const today = new Date().toISOString().split('T')[0];
              const isBusyToday = occupiedDates.includes(today);
              const actualStatus = isBusyToday ? 'in_use' : vehicle.status;

              return (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-800">
                    {vehicle.license_plate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {vehicle.capacity} passageiros
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                        getStatusInfo(actualStatus).color
                      )}>
                        {getStatusInfo(actualStatus).text}
                      </span>
                      {occupiedDates.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {occupiedDates.length} dia(s) ocupado(s)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(vehicle)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(vehicle.id, vehicle.license_plate)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">{vehicle.brand} {vehicle.model}</h3>
                  <p className="font-mono text-sm text-gray-600">{vehicle.license_plate}</p>
                </div>
                <div className="relative">
                  <button onClick={() => setActiveMenu(activeMenu === vehicle.id ? null : vehicle.id)} className="ml-3 p-2 hover:bg-gray-200 rounded-full">
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>
                  {activeMenu === vehicle.id && (
                     <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                       <button onClick={() => handleEdit(vehicle)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"><Pencil size={14} /> Editar</button>
                       <button onClick={() => handleDelete(vehicle.id, vehicle.license_plate)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"><Trash2 size={14} /> Excluir</button>
                     </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center text-sm">
                <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', getStatusInfo(vehicle.status).color)}>{getStatusInfo(vehicle.status).text}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-500 w-24">Capacidade:</span>
                <span className="text-gray-800">{vehicle.capacity} passageiros</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={handleModalClose} title={editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700 mb-1">Placa *</label>
              <input id="license_plate" type="text" required className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg" value={formData.license_plate} onChange={(e) => setFormData({...formData, license_plate: e.target.value.toUpperCase()})} />
            </div>
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input id="brand" type="text" className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input id="model" type="text" required className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
            </div>
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">Capacidade *</label>
              <input id="capacity" type="number" min="1" required className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})} />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="status" className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
                <option value="available">Disponível</option>
                <option value="in_use">Em Uso</option>
                <option value="maintenance">Manutenção</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="active" className="h-4 w-4 rounded" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">Veículo ativo</label>
            </div>
          </div>
          <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={handleModalClose} className="w-full md:w-auto px-6 py-3 md:py-2 border rounded-lg" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="w-full md:w-auto px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};