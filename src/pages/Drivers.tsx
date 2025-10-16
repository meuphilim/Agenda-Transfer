import { useState } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Database } from '../types/database.types';

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
  valor_diaria: string;
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
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    phone: '',
    email: '',
    license_number: '',
    license_expiry: '',
    status: 'available',
    category: 'B',
    ear: false,
    valor_diaria: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      
      const data = {
        ...formData,
        license_expiry: formData.license_expiry || null,
        phone: formData.phone || null,
        email: formData.email || null,
        valor_diaria: formData.valor_diaria ? parseFloat(formData.valor_diaria) : null,
      };

      let success = false;

      if (editingDriver) {
        const result = await update(editingDriver.id, data);
        if (result) {
          toast.success('Motorista atualizado com sucesso!');
          success = true;
        } else {
          toast.error('Erro ao atualizar motorista');
        }
      } else {
        const result = await create(data);
        if (result) {
          toast.success('Motorista cadastrado com sucesso!');
          success = true;
        } else {
          toast.error('Erro ao cadastrar motorista');
        }
      }

      if (success) {
        setShowModal(false);
        setEditingDriver(null);
        resetForm();
      }
    } catch (error: any) {
      console.error('Erro ao salvar motorista:', error);
      toast.error('Erro ao salvar motorista: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSubmitting(false);
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
      valor_diaria: driver.valor_diaria?.toString() ?? '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o motorista "${name}"?`)) return;

    try {
      const success = await deleteDriver(id);
      if (success) {
        toast.success('Motorista excluído com sucesso!');
      } else {
        toast.error('Erro ao excluir motorista');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir motorista');
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
      valor_diaria: '',
    });
  };

  const handleModalClose = () => {
    if (submitting) return;
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
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      return numbers.replace(
        /^(\d{0,2})(\d{0,5})(\d{0,4})/,
        (_, ddd, first, second) => {
          let formatted = '';
          if (ddd) formatted += `(${ddd}`;
          if (ddd && first) formatted += ') ';
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

  const isLicenseExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
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
          <Plus className="h-4 w-4 mr-2" />
          Novo Motorista
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {drivers.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum motorista cadastrado</h3>
            <p className="mt-1 text-sm text-gray-500">Comece cadastrando um novo motorista.</p>
          </div>
        ) : (
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
                    Valor Diária
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
                  <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {driver.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {driver.phone ? formatPhoneNumber(driver.phone) : '-'}
                      </div>
                      <div className="text-sm text-gray-500">{driver.email ?? '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{driver.license_number}</div>
                      <div className={`text-sm ${isLicenseExpired(driver.license_expiry) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        Vence: {formatDate(driver.license_expiry)}
                        {isLicenseExpired(driver.license_expiry) && ' ⚠️'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{driver.category}</div>
                      <div className="text-sm text-gray-500">
                        {driver.ear ? (
                          <span className="text-green-600 font-medium">✓ EAR</span>
                        ) : (
                          <span>Sem EAR</span>
                        )}
                      </div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {driver.valor_diaria ? `R$ ${driver.valor_diaria.toFixed(2).replace('.', ',')}` : '-'}
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
                        title="Editar motorista"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id, driver.name)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        title="Excluir motorista"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingDriver ? 'Editar Motorista' : 'Novo Motorista'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  disabled={submitting}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  disabled={submitting}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Número da CNH *
                </label>
                <input
                  id="license_number"
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="00000000000"
                  maxLength={11}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value.replace(/\D/g, '')})}
                />
              </div>
              
              <div>
                <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 mb-1">
                  Validade da CNH
                </label>
                <input
                  id="license_expiry"
                  type="date"
                  disabled={submitting}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.license_expiry}
                  onChange={(e) => setFormData({...formData, license_expiry: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria da CNH *
                </label>
                <select
                  id="category"
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="A">A - Motocicletas</option>
                  <option value="B">B - Automóveis</option>
                  <option value="C">C - Veículos de carga</option>
                  <option value="D">D - Veículos de passageiros</option>
                  <option value="E">E - Combinações de veículos</option>
                  <option value="AB">AB - A + B</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ear"
                  disabled={submitting}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  checked={formData.ear}
                  onChange={(e) => setFormData({...formData, ear: e.target.checked})}
                />
                <label htmlFor="ear" className="ml-2 block text-sm text-gray-700">
                  Possui EAR (Exerce Atividade Remunerada)
                </label>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="available">Disponível</option>
                  <option value="busy">Ocupado</option>
                  <option value="unavailable">Indisponível</option>
                </select>
              </div>

              <div>
                <label htmlFor="valor_diaria" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da Diária
                </label>
                <input
                  id="valor_diaria"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="R$ 0,00"
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  value={formData.valor_diaria}
                  onChange={(e) => setFormData({...formData, valor_diaria: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    editingDriver ? 'Atualizar' : 'Cadastrar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};