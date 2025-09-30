import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
}

interface DriverFormData {
  name: string;
  phone: string;
  email: string;
  license_number: string;
  license_expiry: string;
  status: 'available' | 'busy' | 'unavailable';
}

export const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    phone: '',
    email: '',
    license_number: '',
    license_expiry: '',
    status: 'available',
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar motoristas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        license_expiry: formData.license_expiry || null,
      };

      if (editingDriver) {
        const { error } = await supabase
          .from('drivers')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDriver.id);

        if (error) throw error;
        toast.success('Motorista atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('drivers')
          .insert([data]);

        if (error) throw error;
        toast.success('Motorista cadastrado com sucesso!');
      }

      setShowModal(false);
      setEditingDriver(null);
      resetForm();
      fetchDrivers();
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
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este motorista?')) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Motorista excluído com sucesso!');
      fetchDrivers();
    } catch (error: any) {
      toast.error('Erro ao excluir motorista: ' + error.message);
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
                    <div className="text-sm text-gray-900">{driver.phone}</div>
                    <div className="text-sm text-gray-500">{driver.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.license_number}</div>
                    <div className="text-sm text-gray-500">
                      Vence: {formatDate(driver.license_expiry)}
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
                      onClick={() => handleDelete(driver.id)}
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
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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