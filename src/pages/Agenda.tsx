import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import {
  Plus, Pencil, Trash2, X, List, Calendar, User, Truck, CalendarDays, MoreVertical, Eye, Send, Check, Play, CheckCircle, Briefcase, DollarSign
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, getDay, isToday, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '../types/database.types';
import { cn } from '../lib/utils';
import { FloatingActionButton, Modal } from '../components/Common';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { formatScheduleMessage } from '../utils/messageFormat';
import { PackageStatus } from '../types/enums';
import { validatePackageAvailability } from '../services/availabilityService';

// Tipos
type Agency = Database['public']['Tables']['agencies']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Driver = Database['public']['Tables']['drivers']['Row'];
type Attraction = Database['public']['Tables']['attractions']['Row'];
type PackageActivity = Database['public']['Tables']['package_attractions']['Row'] & {
  considerar_valor_net: boolean;
};

type PackageActivityForm = Partial<PackageActivity> & {
  attraction_id: string;
  scheduled_date: string;
  start_time: string;
  considerar_valor_net: boolean;
};

type PackageWithRelations = Database['public']['Tables']['packages']['Row'] & {
  agencies?: Pick<Agency, 'name'>;
  vehicles?: Pick<Vehicle, 'license_plate' | 'model'>;
  drivers?: Pick<Driver, 'name'>;
  package_attractions: { count: number }[];
};

type ScheduleItem = PackageActivity & {
  packages: {
    id: string;
    title: string;
    client_name: string;
    status: PackageStatus;
    agencies: { name: string };
    vehicles: { id: string; license_plate: string; model: string };
    drivers: { id: string; name: string; phone: string | null };
  };
  attractions: { name: string };
};

// Formulário
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
  valor_diaria_servico: number;
  considerar_diaria_motorista: boolean;
}

const MobileCalendarView: React.FC<{
  onSend: (item: ScheduleItem) => void;
  onNewPackage: (date: Date) => void;
}> = ({ onSend, onNewPackage }) => {
  // ... (código do calendário mobile)
  return <div>Calendário Mobile</div>;
};

const AgendaCalendarView: React.FC<{onSend: (item: ScheduleItem) => void; onNewPackage: (date: Date) => void}> = ({ onSend, onNewPackage }) => {
  // ... (código do calendário desktop)
  return <div>Calendário Desktop</div>;
};

export const Agenda: React.FC = () => {
  const [packages, setPackages] = useState<PackageWithRelations[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageWithRelations | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({ title: '', agency_id: '', vehicle_id: '', driver_id: '', start_date: '', end_date: '', total_participants: 1, notes: '', client_name: '', valor_diaria_servico: 0, considerar_diaria_motorista: true });
  const [packageAttractions, setPackageAttractions] = useState<PackageActivityForm[]>([]);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null);
  const [previewMessage, setPreviewMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*, agencies(name), vehicles(license_plate, model), drivers(name), package_attractions(count)')
        .order('start_date', { ascending: false });

      if (packagesError) throw packagesError;

      const { data: agenciesData, error: agenciesError } = await supabase.from('agencies').select('*');
      if (agenciesError) throw agenciesError;

      const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*');
      if (vehiclesError) throw vehiclesError;

      const { data: driversData, error: driversError } = await supabase.from('drivers').select('*');
      if (driversError) throw driversError;

      const { data: attractionsData, error: attractionsError } = await supabase.from('attractions').select('*');
      if (attractionsError) throw attractionsError;

      setPackages(packagesData as PackageWithRelations[]);
      setAgencies(agenciesData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setAttractions(attractionsData);

    } catch (error) {
      if (error instanceof Error) {
        toast.error('Erro ao carregar dados: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const filteredPackages = useMemo(() => packages
    .filter(pkg => statusFilter === 'all' || pkg.status === statusFilter)
    .filter(pkg => {
      const search = searchTerm.toLowerCase();
      return (pkg.title.toLowerCase().includes(search) || pkg.client_name?.toLowerCase().includes(search) || pkg.agencies?.name.toLowerCase().includes(search));
    }), [packages, statusFilter, searchTerm]);

  const resetForm = () => {
    setFormData({ title: '', agency_id: '', vehicle_id: '', driver_id: '', start_date: '', end_date: '', total_participants: 1, notes: '', client_name: '', valor_diaria_servico: 0, considerar_diaria_motorista: true });
    setPackageAttractions([]);
    setEditingPackage(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
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
      valor_diaria_servico: pkg.valor_diaria_servico ?? 0,
      considerar_diaria_motorista: pkg.considerar_diaria_motorista ?? true,
    });

    const { data, error } = await supabase.from('package_attractions').select('*').eq('package_id', pkg.id);
    if (error) {
      toast.error('Erro ao carregar atividades do pacote');
    } else {
      const activitiesWithDefaults = (data ?? []).map(act => ({ ...act, considerar_valor_net: act.considerar_valor_net ?? false }));
      setPackageAttractions(activitiesWithDefaults as PackageActivityForm[]);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activityDates = packageAttractions.map(a => new Date(a.scheduled_date));
    const validation = await validatePackageAvailability(formData.vehicle_id, formData.driver_id, activityDates, editingPackage?.id);
    if (!validation.isValid) {
      const errors = [...validation.vehicleConflicts.map(c => `🚗 Veículo: ${c}`), ...validation.driverConflicts.map(c => `👤 Motorista: ${c}`)];
      toast.error(<div><p className="font-bold mb-2">Conflito de disponibilidade:</p><ul className="list-disc pl-4 space-y-1">{errors.map((error, i) => <li key={i} className="text-sm">{error}</li>)}</ul></div>, { autoClose: 8000 });
      return;
    }

    try {
      const packageData = { ...formData };
      let packageId;
      if (editingPackage) {
        const { error } = await supabase.from('packages').update(packageData).eq('id', editingPackage.id);
        if (error) throw error;
        packageId = editingPackage.id;
        toast.success('Pacote atualizado!');
      } else {
        const { data, error } = await supabase.from('packages').insert([packageData]).select().single();
        if (error) throw error;
        packageId = data.id;
        toast.success('Pacote cadastrado!');
      }

      if (editingPackage) {
        await supabase.from('package_attractions').delete().eq('package_id', packageId);
      }

      if (packageAttractions.length > 0) {
        const activitiesToInsert = packageAttractions.map(attr => ({
          package_id: packageId,
          attraction_id: attr.attraction_id,
          scheduled_date: attr.scheduled_date,
          start_time: attr.start_time ?? null,
          end_time: attr.end_time ?? null,
          notes: attr.notes ?? null,
          considerar_valor_net: attr.considerar_valor_net ?? false,
        }));
        await supabase.from('package_attractions').insert(activitiesToInsert);
      }
      handleModalClose();
      void fetchData();
    } catch (error) {
      if (error instanceof Error) toast.error('Erro ao salvar pacote: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    await supabase.from('package_attractions').delete().eq('package_id', id);
    await supabase.from('packages').delete().eq('id', id);
    toast.success('Excluído!');
    void fetchData();
  };

  const addAttraction = () => setPackageAttractions([...packageAttractions, { attraction_id: '', scheduled_date: formData.start_date, start_time: '', notes: '', considerar_valor_net: false }]);
  const removeAttraction = (index: number) => setPackageAttractions(packageAttractions.filter((_, i) => i !== index));
  const updateAttraction = (index: number, field: keyof PackageActivityForm, value: string | boolean) => {
    const updated = packageAttractions.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setPackageAttractions(updated);
  };

  const getAttractionDetails = (attractionId: string) => {
    if (!attractionId) return null;
    const attraction = attractions.find(a => a.id === attractionId);
    if (!attraction) return null;
    const formatDuration = (minutes: number): string => {
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
    };
    return { name: attraction.name, duration: formatDuration(attraction.estimated_duration), valor_net: attraction.valor_net ?? 0, has_valor_net: (attraction.valor_net ?? 0) > 0 };
  };

  // ... (resto do código)

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* ... */}
      </div>

      <Modal isOpen={showModal} onClose={handleModalClose} title={editingPackage ? 'Editar Reserva' : 'Nova Reserva'}>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
          {/* ... (outros campos do formulário) */}

          <div className="md:col-span-2 border-t pt-4 mt-4">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Configuração de Diárias
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor_diaria_servico" className="block text-sm font-medium text-gray-700 mb-2">Valor da diária para o pacote</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                  <input id="valor_diaria_servico" type="number" step="0.01" min="0" value={formData.valor_diaria_servico} onChange={(e) => setFormData({ ...formData, valor_diaria_servico: parseFloat(e.target.value) || 0 })} className="w-full pl-10 pr-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0,00" />
                </div>
                <p className="mt-1 text-xs text-gray-500">💰 Valor cobrado do cliente (receita)</p>
                <p className="mt-0.5 text-xs text-gray-400">* Será considerado em dias com atividades sem valor NET</p>
              </div>
              <div className="flex flex-col justify-center">
                <label className="block text-sm font-medium text-gray-700 mb-3">Considerar diária de motorista</label>
                <div className="flex items-start space-x-3">
                  <input type="checkbox" id="considerar_diaria_motorista" checked={formData.considerar_diaria_motorista} onChange={(e) => setFormData({ ...formData, considerar_diaria_motorista: e.target.checked })} className="h-5 w-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0" />
                  <div className="flex-1">
                    <label htmlFor="considerar_diaria_motorista" className="text-sm text-gray-700 cursor-pointer hover:text-gray-900">Incluir custo da diária do motorista nos cálculos</label>
                    <p className="mt-1 text-xs text-gray-500">💸 Custo pago ao motorista (despesa)</p>
                    {formData.considerar_diaria_motorista && formData.driver_id && (<p className="mt-1 text-xs text-blue-600 font-medium">ℹ️ Valor da diária será obtido do cadastro do motorista</p>)}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800"><strong>📊 Como funciona:</strong></p>
              <ul className="mt-2 space-y-1 text-xs text-blue-700">
                <li>• <strong>Receita Total</strong> = Diárias de Serviço + Valores NET das atrações</li>
                <li>• <strong>Custos</strong> = Diárias do Motorista (se marcado) + Despesas com Veículo</li>
                <li>• <strong>Margem</strong> = Receita Total - Custos</li>
              </ul>
            </div>
          </div>

          {/* ... (resto do formulário) */}
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={handleModalClose} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button></div>
        </form>
      </Modal>
      {/* ... */}
    </>
  );
};