import { useState } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Vehicle {
  id: string;
  license_plate: string;
  model: string;
  brand: string | null;
  capacity: number;
  status: 'available' | 'in_use' | 'maintenance';
  active: boolean;
  created_at: string;
}

interface VehicleFormData {
  license_plate: string;
  model: string;
  brand: string;
  capacity: number;
  status: 'available' | 'in_use' | 'maintenance';
}

export const Vehicles: React.FC = () => {
  const { 
    data: vehicles, 
    loading, 
    create, 
    update, 
    delete: deleteVehicle 
  } = useSupabaseData<Vehicle>({
    table: 'vehicles',
    orderBy: { column: 'license_plate' },
    realtime: true
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>({
    license_plate: '',
    model: '',
    brand: '',
    capacity: 1,
    status: 'available',
  });

  // ✅ FUNÇÃO CORRIGIDA - Sem duplicação de chamadas
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Previne múltiplos submits
    if (submitting) return;

    try {
      setSubmitting(true);
      let success = false;

      if (editingVehicle) {
        // Modo de edição
        const result = await update(editingVehicle.id, formData);
        if (result) {
          toast.success('Veículo atualizado com sucesso!');
          success = true;
        } else {
          toast.error('Erro ao atualizar veículo');
        }
      } else {
        // Modo de criação
        const result = await create(formData);
        if (result) {
          toast.success('Veículo cadastrado com sucesso!');
          success = true;
        } else {
          toast.error('Erro ao cadastrar veículo');
        }
      }

      // Fecha modal e reseta form apenas se foi bem-sucedido
      if (success) {
        setShowModal(false);
        setEditingVehicle(null);
        resetForm();
      }
    } catch (error: any) {
      console.error('Erro ao salvar veículo:', error);
      toast.error('Erro ao salvar veículo: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSubmitting(false);
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
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, licensePlate: string) => {
    if (!confirm(`Tem certeza que deseja excluir o veículo "${licensePlate}"?`)) return;

    try {
      const success = await deleteVehicle(id);
      if (success) {
        toast.success('Veículo excluído com sucesso!');
      } else {
        toast.error('Erro ao excluir veículo');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir veículo');
    }
  };

  const resetForm = () => {
    setFormData({
      license_plate: '',
      model: '',
      brand: '',
      capacity: 1,
      status: 'available',
    });
  };

  const handleModalClose = () => {
    if (submitting) return; // Previne fechar durante submit
    setShowModal(false);
    setEditingVehicle(null);
    resetForm();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusText = {
      available: 'Disponível',
      in_use: 'Em Uso',
      maintenance: 'Manutenção',
    };
    return statusText[status as keyof typeof statusText] || status;
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
          <h1 className="text-3xl font-bold text-gray-900">Veículos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie a frota de veículos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {vehicles.length === 0 ? (
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum veículo cadastrado</h3>
            <p className="mt-1 text-sm text-gray-500">Comece cadastrando um novo veículo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Veículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacidade
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
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {vehicle.license_plate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vehicle.brand && `${vehicle.brand} `}{vehicle.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.capacity} passageiro{vehicle.capacity !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                        {getStatusText(vehicle.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="text-blue-600 hover:text-blue-900 mr-3 transition-colors duration-200"
                        title="Editar veículo"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id, vehicle.license_plate)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        title="Excluir veículo"
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
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa *
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="ABC-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value.toUpperCase()})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  disabled={submitting}
                  placeholder="Ex: Toyota, Ford, Volkswagen"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="Ex: Corolla, Fiesta, Gol"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  disabled={submitting}
                  placeholder="Número de passageiros"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="available">Disponível</option>
                  <option value="in_use">Em Uso</option>
                  <option value="maintenance">Manutenção</option>
                </select>
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
                    editingVehicle ? 'Atualizar' : 'Cadastrar'
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
