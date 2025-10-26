import { useState, useMemo, useEffect } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, MoreVertical, Search } from 'lucide-react';
import { Modal, LoadingSpinner } from '../components/Common';
import { cn } from '../lib/utils';
import { Database } from '../types/database.types';
import { getDriverOccupiedDates } from '../services/availabilityService';

type Driver = Database['public']['Tables']['drivers']['Row'];

interface DriverFormData {
  name: string;
  phone: string;
  email: string;
  license_number: string;
  license_expiry: string;
  status: 'available' | 'busy' | 'unavailable';
  category: string;
  ear: boolean;
  valor_diaria_motorista: string;
  active: boolean;
}

export const Drivers: React.FC = () => {
  const { data: drivers, loading, create, update, delete: deleteDriver } = useSupabaseData<Driver>({
    table: 'drivers',
    orderBy: { column: 'name' },
  });
  const [occupiedDatesMap, setOccupiedDatesMap] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    const fetchOccupiedDates = async () => {
      const map = new Map<string, string[]>();

      for (const driver of drivers) {
        const dates = await getDriverOccupiedDates(driver.id);
        map.set(driver.id, dates);
      }

      setOccupiedDatesMap(map);
    };

    if (drivers.length > 0) {
      void fetchOccupiedDates();
    }
  }, [drivers]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<DriverFormData>({
    name: '', phone: '', email: '', license_number: '', license_expiry: '',
    status: 'available', category: 'B', ear: false, valor_diaria_motorista: '', active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredDrivers = useMemo(() => {
    if (!searchTerm) return drivers;
    return drivers.filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.license_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [drivers, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSave = {
      ...formData,
      valor_diaria_motorista: formData.valor_diaria_motorista ? parseFloat(formData.valor_diaria_motorista) : null,
      license_expiry: formData.license_expiry || null,
    };
    try {
      if (editingDriver) {
        await update(editingDriver.id, dataToSave);
        toast.success('Motorista atualizado!');
      } else {
        await create(dataToSave);
        toast.success('Motorista cadastrado!');
      }
      handleModalClose();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone ?? '',
      email: driver.email ?? '',
      license_number: driver.license_number,
      license_expiry: driver.license_expiry ?? '',
      status: driver.status,
      category: driver.category,
      ear: driver.ear,
      valor_diaria_motorista: driver.valor_diaria_motorista?.toString() ?? '',
      active: driver.active,
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id: string, name: string) => {
    setActiveMenu(null);
    if (!confirm(`Excluir motorista "${name}"?`)) return;
    await deleteDriver(id);
    toast.success('Motorista excluído!');
  };

  const resetForm = () => {
    setFormData({
      name: '', phone: '', email: '', license_number: '', license_expiry: '',
      status: 'available', category: 'B', ear: false, valor_diaria_motorista: '', active: true
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingDriver(null);
    resetForm();
  };

  const getStatusInfo = (status: Driver['status']) => ({
      available: { text: 'Disponível', color: 'bg-green-100 text-green-800' },
      busy: { text: 'Ocupado', color: 'bg-blue-100 text-blue-800' },
      unavailable: { text: 'Indisponível', color: 'bg-red-100 text-red-800' },
  }[status]);

  if (loading && !drivers.length) {
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
              placeholder="Buscar por nome ou CNH..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
          <Plus className="h-5 w-5" />
          Novo Motorista
        </button>
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNH</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrivers.map((driver) => {
              const occupiedDates = occupiedDatesMap.get(driver.id) ?? [];
              const today = new Date().toISOString().split('T')[0];
              const isBusyToday = occupiedDates.includes(today);
              const actualStatus = isBusyToday ? 'busy' : driver.status;

              return (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                    <div className="text-sm text-gray-500">{driver.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{driver.license_number} ({driver.category})</div>
                    <div className="text-sm text-gray-500">Vence: {driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(driver)} className="text-blue-600 hover:text-blue-900 mr-3"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(driver.id, driver.name)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filteredDrivers.map((driver) => (
          <div key={driver.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 truncate flex-1">{driver.name}</h3>
                <div className="relative">
                  <button onClick={() => setActiveMenu(activeMenu === driver.id ? null : driver.id)} className="ml-3 p-2 hover:bg-gray-200 rounded-full">
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>
                  {activeMenu === driver.id && (
                     <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                       <button onClick={() => handleEdit(driver)} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3"><Pencil size={14} /> Editar</button>
                       <button onClick={() => handleDelete(driver.id, driver.name)} className="w-full text-left px-4 py-2 text-sm text-red-600 flex items-center gap-3"><Trash2 size={14} /> Excluir</button>
                     </div>
                  )}
                </div>
              </div>
              <span className={cn('mt-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full', getStatusInfo(driver.status).color)}>
                {getStatusInfo(driver.status).text}
              </span>
            </div>
            <div className="p-4 space-y-2">
              <div className="text-sm"><span className="font-medium text-gray-500">Telefone:</span> {driver.phone ?? 'N/A'}</div>
              <div className="text-sm"><span className="font-medium text-gray-500">CNH:</span> {driver.license_number} ({driver.category})</div>
              <div className="text-sm"><span className="font-medium text-gray-500">Validade:</span> {driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString('pt-BR') : 'N/A'}</div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={handleModalClose} title={editingDriver ? 'Editar Motorista' : 'Novo Motorista'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium mb-1">Nome *</label>
              <input id="name" type="text" required className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">Telefone</label>
              <input id="phone" type="tel" className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input id="email" type="email" className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label htmlFor="license_number" className="block text-sm font-medium mb-1">CNH *</label>
              <input id="license_number" type="text" required className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.license_number} onChange={e => setFormData({...formData, license_number: e.target.value})} />
            </div>
            <div>
              <label htmlFor="license_expiry" className="block text-sm font-medium mb-1">Validade CNH</label>
              <input id="license_expiry" type="date" className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.license_expiry} onChange={e => setFormData({...formData, license_expiry: e.target.value})} />
            </div>
             <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">Categoria *</label>
              <select id="category" className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option>
              </select>
            </div>
             <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
              <select id="status" className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="available">Disponível</option><option value="busy">Ocupado</option><option value="unavailable">Indisponível</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="valor_diaria_motorista" className="block text-sm font-medium mb-1">Valor da Diária (R$)</label>
              <input id="valor_diaria_motorista" type="number" step="0.01" className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.valor_diaria_motorista} onChange={e => setFormData({...formData, valor_diaria_motorista: e.target.value})} />
            </div>
            <div className="flex items-center gap-3">
              <input id="ear" type="checkbox" className="h-4 w-4 rounded" checked={formData.ear} onChange={e => setFormData({...formData, ear: e.target.checked})} />
              <label htmlFor="ear" className="text-sm font-medium">Possui EAR</label>
            </div>
             <div className="flex items-center gap-3">
              <input id="active" type="checkbox" className="h-4 w-4 rounded" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
              <label htmlFor="active" className="text-sm font-medium">Motorista ativo</label>
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