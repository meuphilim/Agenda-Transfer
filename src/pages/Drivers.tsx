import { useState } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  license_number: string;
  license_expiry: string | null;
  status: 'available' | 'busy' | 'unavailable';
  active: boolean;
  created_at: string;
  category: string;
  ear: boolean;
}

interface DriverFormData {
  name: string;
  phone: string;
  email: string;
  license_number: string;
  license_expiry: string;
  status: 'available' | 'busy' | 'unavailable';
  category: string;
  ear: boolean;
}

export const Drivers: React.FC = () => {
  const { 
    data: drivers, 
    loading, 
    create, 
    update, 
    delete: deleteDriver 
  } = useSupabaseData<Driver>({
    table: 'drivers',
    orderBy: { column: 'name' },
    realtime: true
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    phone: '',
    email: '',
    license_number: '',
    license_expiry: '',
    status: 'available',
    category: 'B',
    ear: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        license_expiry: formData.license_expiry || null,
      };

      if (editingDriver) {
        const result = await update(editingDriver.id, data);
        if (result) {
          toast.success('Motorista atualizado com sucesso!');
        }
      } else {
        const result = await create(data);
        if (result) {
          toast.success('Motorista cadastrado com sucesso!');
        }
      }

      if (editingDriver || await create(data)) {
        setShowModal(false);
        setEditingDriver(null);
        resetForm();
      }
    } catch (error: any) {
      toast.error('Erro ao salvar motorista: ' + error.message);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone || '',
      email: driver.email || '',
      license_number: driver.license_number,
      license_expiry: driver.license_expiry || '',
      status: driver.status,
      category: driver.category,
      ear: driver.ear,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o motorista "${name}"?`)) return;

    const success = await deleteDriver(id);
    if (success) {
      toast.success('Motorista excluído com sucesso!');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      license_number: '',
      license_expiry: '',
      status: 'available',
      category: 'B',
      ear: false,
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingDriver(null);
    resetForm();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      busy: 'bg-blue-100 text-blue-800',
      unavailable: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusText = {
      available: 'Disponível',
      busy: 'Ocupado',
      unavailable: 'Indisponível',
    };
    return statusText[status as keyof typeof statusText] || status;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (xx) xxxxx-xxxx
    if (numbers.length <= 11) {
      return numbers.replace(
        /^(\d{0,2})(\d{0,5})(\d{0,4})/,
        (_, ddd, first, second) => {
          let formatted = '';
          if (ddd) formatted += `(${ddd}`;
          if (ddd) formatted += ') ';
          if (first) formatted += first;
          if (second) formatted += `-${second}`;
          return formatted;
        }
      );
    }
    return numbers.slice(0, 11);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({...formData, phone: formatted});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Motoristas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os motoristas disponíveis
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Novo Motorista
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNH
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {driver.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.phone ? formatPhoneNumber(driver.phone) : '-'}</div>
                    <div className="text-sm text-gray-500">{driver.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.license_number}</div>
                    <div className="text-sm text-gray-500">
                      Vence: {formatDate(driver.license_expiry)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.category}</div>
                    <div className="text-sm text-gray-500">
                      {driver.ear ? 'EAR' : 'Sem EAR'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                      {getStatusText(driver.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(driver)}
                      className="text-blue-600 hover:text-blue-900 mr-3 transition-colors duration-200"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      // onClick={() => handleDelete(driver.id)}
                      onClick={() => handleDelete(driver.id, driver.name)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingDriver ? 'Editar Motorista' : 'Novo Motorista'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da CNH *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validade da CNH
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.license_expiry}
                  onChange={(e) => setFormData({...formData, license_expiry: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="available">Disponível</option>
                  <option value="busy">Ocupado</option>
                  <option value="unavailable">Indisponível</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria da CNH *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="AB">AB</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ear"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.ear}
                  onChange={(e) => setFormData({...formData, ear: e.target.checked})}
                />
                <label htmlFor="ear" className="ml-2 block text-sm text-gray-700">
                  Possui EAR (Exerce Atividade Remunerada)
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingDriver ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};