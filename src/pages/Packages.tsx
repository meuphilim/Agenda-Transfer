import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '../types/database.types';

type PackageWithRelations = Database['public']['Tables']['packages']['Row'] & {
  agencies?: { name: string };
  vehicles?: { license_plate: string; model: string };
  drivers?: { name: string; valor_diaria: number | null };
};
type Attraction = Database['public']['Tables']['attractions']['Row'];
type PackageActivity = Database['public']['Tables']['package_attractions']['Row'];
type PackageStatus = Database['public']['Tables']['packages']['Row']['status'];

interface PackageFormData {
  title: string;
  agency_id: string;
  vehicle_id: string;
  driver_id: string;
  start_date: string;
  end_date: string;
  total_participants: number;
  notes: string;
  client_name: string;
  considerar_diaria_motorista: boolean;
}

export const Packages: React.FC = () => {
  const [packages, setPackages] = useState<PackageWithRelations[]>([]);
  const [agencies, setAgencies] = useState<Database['public']['Tables']['agencies']['Row'][]>([]);
  const [vehicles, setVehicles] = useState<Database['public']['Tables']['vehicles']['Row'][]>([]);
  const [drivers, setDrivers] = useState<Database['public']['Tables']['drivers']['Row'][]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageWithRelations | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({
    title: '',
    agency_id: '',
    vehicle_id: '',
    driver_id: '',
    start_date: '',
    end_date: '',
    total_participants: 1,
    notes: '',
    client_name: '',
    considerar_diaria_motorista: false,
  });
  const [packageAttractions, setPackageAttractions] = useState<Partial<PackageActivity>[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesResult, agenciesResult, vehiclesResult, driversResult, attractionsResult] = await Promise.all([
        supabase.from('packages').select(`
          *,
          agencies(name),
          vehicles(license_plate, model),
          drivers(name, valor_diaria)
        `).order('created_at', { ascending: false }),
        supabase.from('agencies').select('*').eq('active', true).order('name'),
        supabase.from('vehicles').select('*').eq('active', true).order('license_plate'),
        supabase.from('drivers').select('*').eq('active', true).order('name'),
        supabase.from('attractions').select('*').eq('active', true).order('name')
      ]);

      setPackages(packagesResult.data as PackageWithRelations[] ?? []);
      setAgencies(agenciesResult.data ?? []);
      setVehicles(vehiclesResult.data ?? []);
      setDrivers(driversResult.data ?? []);
      setAttractions(attractionsResult.data ?? []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let packageId;

      if (editingPackage) {
        const { error } = await supabase
          .from('packages')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPackage.id);

        if (error) throw error;
        packageId = editingPackage.id;
        toast.success('Pacote atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('packages')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        packageId = data.id;
        toast.success('Pacote cadastrado com sucesso!');
      }

      // Salvar atrativos do pacote
      if (packageAttractions.length > 0) {
        // Remover atrativos existentes se editando
        if (editingPackage) {
          await supabase
            .from('package_attractions')
            .delete()
            .eq('package_id', packageId);
        }

        // Inserir novos atrativos
        const activitiesToInsert = packageAttractions.map(attr => ({
          package_id: packageId,
          attraction_id: attr.attraction_id,
          scheduled_date: attr.scheduled_date,
          start_time: attr.start_time ?? null,
          end_time: attr.end_time ?? null,
          notes: attr.notes ?? null,
          considerar_valor_net: attr.considerar_valor_net,
        }));

        const { error: attractionsError } = await supabase
          .from('package_attractions')
          .insert(activitiesToInsert);

        if (attractionsError) throw attractionsError;
      }

      setShowModal(false);
      setEditingPackage(null);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error('Erro ao salvar pacote: ' + error.message);
    }
  };

  const handleEdit = async (pkg: PackageWithRelations) => {
    setEditingPackage(pkg);
    setFormData({
      title: pkg.title,
      agency_id: pkg.agency_id,
      vehicle_id: pkg.vehicle_id,
      driver_id: pkg.driver_id,
      start_date: pkg.start_date,
      end_date: pkg.end_date,
      total_participants: pkg.total_participants,
      notes: pkg.notes ?? '',
      client_name: pkg.client_name ?? '',
      considerar_diaria_motorista: pkg.considerar_diaria_motorista ?? false,
    });

    // Carregar atrativos do pacote
    try {
      const { data } = await supabase
        .from('package_attractions')
        .select('*')
        .eq('package_id', pkg.id);
      
      setPackageAttractions(data ?? []);
    } catch (error) {
      console.error('Erro ao carregar atrativos do pacote:', error);
    }

    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) return;

    try {
      await supabase.from('package_attractions').delete().eq('package_id', id);
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
      toast.success('Pacote excluído com sucesso!');
      await fetchData();
    } catch (error: any) {
      toast.error('Erro ao excluir pacote: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      agency_id: '',
      vehicle_id: '',
      driver_id: '',
      start_date: '',
      end_date: '',
      total_participants: 1,
      notes: '',
      client_name: '',
      considerar_diaria_motorista: false,
    });
    setPackageAttractions([]);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingPackage(null);
    resetForm();
  };

  const addAttraction = () => {
    setPackageAttractions([...packageAttractions, {
      attraction_id: '',
      scheduled_date: formData.start_date,
      start_time: '',
      end_time: '',
      notes: '',
      considerar_valor_net: false,
    }]);
  };

  const removeAttraction = (index: number) => {
    setPackageAttractions(packageAttractions.filter((_, i) => i !== index));
  };

  const updateAttraction = (index: number, field: keyof PackageActivity, value: string | boolean) => {
    const updated = [...packageAttractions];
    const current = updated[index];
    if (current) {
        (current as any)[field] = value;
    }
    setPackageAttractions(updated);
  };

  const getStatusColor = (status: PackageStatus) => {
    const colors: Record<PackageStatus, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: PackageStatus) => {
    const statusText: Record<PackageStatus, string> = {
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'in_progress': 'Em Andamento',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
    };
    return statusText[status];
  };

  const handleUpdateStatus = async (packageId: string, newStatus: PackageStatus) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', packageId);

      if (error) throw error;
      
      toast.success('Status atualizado com sucesso!');
      await fetchData();
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Reservas/Pacotes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as reservas e pacotes turísticos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Reserva
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pacote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Veículo/Motorista
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
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {pkg.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      Cliente: {pkg.client_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pkg.total_participants} participante{pkg.total_participants !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.agencies?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(pkg.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    <div className="text-sm text-gray-500">
                      até {format(new Date(pkg.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {pkg.vehicles?.license_plate} - {pkg.vehicles?.model}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pkg.drivers?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pkg.status)}`}>
                        {getStatusText(pkg.status)}
                      </span>
                      <div className="flex gap-1">
                        {pkg.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(pkg.id, 'confirmed')}
                            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors duration-200"
                          >
                            Confirmar
                          </button>
                        )}
                        {pkg.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(pkg.id, 'in_progress')}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors duration-200"
                          >
                            Iniciar
                          </button>
                        )}
                        {pkg.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(pkg.id, 'completed')}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors duration-200"
                          >
                            Concluir
                          </button>
                        )}
                        {(pkg.status === 'pending' || pkg.status === 'confirmed') && (
                          <button
                            onClick={() => handleUpdateStatus(pkg.id, 'cancelled')}
                            className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors duration-200"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="text-blue-600 hover:text-blue-900 mr-3 transition-colors duration-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPackage ? 'Editar Reserva' : 'Nova Reserva'}
                </h3>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Título do Pacote *
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Cliente *
                    </label>
                    <input
                      id="client_name"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="agency_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Agência *
                    </label>
                    <select
                      id="agency_id"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.agency_id}
                      onChange={(e) => setFormData({...formData, agency_id: e.target.value})}
                    >
                      <option value="">Selecione uma agência</option>
                      {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                          {agency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="total_participants" className="block text-sm font-medium text-gray-700 mb-1">
                      Participantes *
                    </label>
                    <input
                      id="total_participants"
                      type="number"
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.total_participants}
                      onChange={(e) => setFormData({...formData, total_participants: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Data Início *
                    </label>
                    <input
                      id="start_date"
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Data Fim *
                    </label>
                    <input
                      id="end_date"
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Veículo *
                    </label>
                    <select
                      id="vehicle_id"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.vehicle_id}
                      onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                    >
                      <option value="">Selecione um veículo</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.license_plate} - {vehicle.brand} {vehicle.model} ({vehicle.capacity} lugares)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Motorista *
                    </label>
                    <select
                      id="driver_id"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.driver_id}
                      onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                    >
                      <option value="">Selecione um motorista</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.driver_id && (
                  <div className="flex items-center mt-3 p-3 bg-green-50 rounded-md">
                    <label htmlFor="considerar_diaria_motorista" className="ml-2 block text-sm text-gray-900 flex items-center">
                      <input
                        type="checkbox"
                        id="considerar_diaria_motorista"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-2"
                        checked={formData.considerar_diaria_motorista}
                        onChange={(e) => setFormData({...formData, considerar_diaria_motorista: e.target.checked})}
                      />
                      Considerar diária do motorista no fechamento
                      {(drivers.find(d => d.id === formData.driver_id)?.valor_diaria) && (
                        <span className="ml-2 text-green-600 font-medium">
                          (R$ {drivers.find(d => d.id === formData.driver_id)?.valor_diaria?.toFixed(2).replace('.', ',')})
                        </span>
                      )}
                    </label>
                  </div>
                )}

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                {/* Atrativos */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Atividades do Pacote</h4>
                    <button
                      type="button"
                      onClick={addAttraction}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </button>
                  </div>

                  {packageAttractions.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-700">Atividade {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeAttraction(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label htmlFor={`attraction_id_${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Atrativo/Passeio *
                          </label>
                          <select
                            id={`attraction_id_${index}`}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={activity.attraction_id ?? ''}
                            onChange={(e) => updateAttraction(index, 'attraction_id', e.target.value)}
                          >
                            <option value="">Selecione</option>
                            {attractions.map((attr) => (
                              <option key={attr.id} value={attr.id}>
                                {attr.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor={`scheduled_date_${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Data *
                          </label>
                          <input
                            id={`scheduled_date_${index}`}
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={activity.scheduled_date}
                            onChange={(e) => updateAttraction(index, 'scheduled_date', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`start_time_${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Hora Início
                          </label>
                          <input
                            id={`start_time_${index}`}
                            type="time"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={activity.start_time ?? ''}
                            onChange={(e) => updateAttraction(index, 'start_time', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`end_time_${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Hora Fim
                          </label>
                          <input
                            id={`end_time_${index}`}
                            type="time"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={activity.end_time ?? ''}
                            onChange={(e) => updateAttraction(index, 'end_time', e.target.value)}
                          />
                        </div>
                      </div>
                      {(attractions.find(a => a.id === activity.attraction_id)?.valor_net) && (
                        <div className="flex items-center mt-3 p-3 bg-blue-50 rounded-md">
                           <label htmlFor={`considerar_valor_net_${index}`} className="ml-2 block text-sm text-gray-900 flex items-center">
                            <input
                              type="checkbox"
                              id={`considerar_valor_net_${index}`}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                              checked={activity.considerar_valor_net}
                              onChange={(e) => updateAttraction(index, 'considerar_valor_net', e.target.checked)}
                            />
                            Considerar valor NET do atrativo
                            <span className="ml-2 text-blue-600 font-medium">
                              (R$ {attractions.find(a => a.id === activity.attraction_id)?.valor_net?.toFixed(2).replace('.', ',')})
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
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
                    {editingPackage ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};