import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import {
  Plus, Pencil, Trash2, X, List, Calendar, User, Truck, CalendarDays, MoreVertical, Eye, Send, Check, Play, CheckCircle
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '../types/database.types';
import { cn } from '../lib/utils';
import { FloatingActionButton, Modal } from '../components/Common';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { formatScheduleMessage } from '../utils/messageFormat';
import { PackageStatus } from '../types/enums';

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
}

const AgendaCalendarView: React.FC<{onSend: (item: ScheduleItem) => void; onNewPackage: (date: Date) => void}> = ({ onSend, onNewPackage }) => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    const fetchScheduleData = async () => {
      setLoading(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      const { data, error } = await supabase
        .from('package_attractions')
        .select(`*, packages!inner(id, title, client_name, status, agencies(name), vehicles(id, license_plate, model), drivers(id, name, phone)), attractions(name)`)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('scheduled_date').order('start_time');

      if (error) toast.error('Erro ao carregar agenda: ' + error.message);
      else setScheduleItems(data as ScheduleItem[]);
      setLoading(false);
    };
    void fetchScheduleData();
  }, [currentWeek]);

  const getWeekDays = () => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), i));
  const getItemsForDate = (date: Date) => scheduleItems.filter(item => isSameDay(parseISO(item.scheduled_date), date));
  const formatTime = (time: string | null) => time ? time.slice(0, 5) : '';
  const getItemColor = (status: string) => status === 'completed' ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500';

  if (loading) return <div className="text-center p-8">Carregando calendário...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
       <div className="flex items-center justify-center space-x-4 mb-4">
          <button onClick={() => setCurrentWeek(addDays(currentWeek, -7))} className="p-2 rounded-md hover:bg-gray-100">&lt;</button>
          <h2 className="font-bold text-lg">{format(currentWeek, "MMMM yyyy", { locale: ptBR })}</h2>
          <button onClick={() => setCurrentWeek(addDays(currentWeek, 7))} className="p-2 rounded-md hover:bg-gray-100">&gt;</button>
       </div>
       <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
          {getWeekDays().map(day => (
            <div key={day.toString()} className="border-r border-gray-200 last:border-r-0">
               <div className="text-center font-bold p-2 border-b border-gray-200 bg-gray-50 flex justify-center items-center gap-2">
                <span>{format(day, 'EEE', { locale: ptBR })}<br/>{format(day, 'd')}</span>
                <button onClick={() => onNewPackage(day)} className="text-gray-400 hover:text-blue-600"><Plus size={14} /></button>
               </div>
               <div className="p-1 space-y-1 min-h-[120px]">
                  {getItemsForDate(day).map(item => (
                     <div key={item.id} className={`p-2 rounded text-xs cursor-pointer ${getItemColor(item.packages.status)}`} onClick={() => void onSend(item)} title="Enviar para WhatsApp">
                        <p className="font-bold flex items-center justify-between">
                          <span>{formatTime(item.start_time)} - {item.packages.client_name}</span>
                          <Send size={12} className="opacity-50 group-hover:opacity-100"/>
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.packages.agencies.name}</p>
                        <p className="truncate font-medium">{item.attractions.name}</p>
                        <div className="mt-1 flex items-center gap-4 text-gray-600">
                          <div className="flex items-center gap-1.5 truncate">
                            <User size={12} />
                            <span className="truncate">{item.packages.drivers.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                             <Truck size={12} />
                             <span className="truncate">{item.packages.vehicles.model}</span>
                          </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          ))}
       </div>
    </div>
  );
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
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageWithRelations | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({ title: '', agency_id: '', vehicle_id: '', driver_id: '', start_date: '', end_date: '', total_participants: 1, notes: '', client_name: '' });
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
    setFormData({ title: '', agency_id: '', vehicle_id: '', driver_id: '', start_date: '', end_date: '', total_participants: 1, notes: '', client_name: '' });
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
      client_name: pkg.client_name ?? ''
    });

    // Carregar atividades do pacote
    const { data, error } = await supabase
      .from('package_attractions')
      .select('*')
      .eq('package_id', pkg.id);

    if (error) {
      console.error('Erro ao carregar atividades:', error);
      toast.error('Erro ao carregar atividades do pacote');
    } else {
      // Garantir que considerar_valor_net tenha valor padrão se não existir
      const activitiesWithDefaults = (data ?? []).map(act => ({
        ...act,
        considerar_valor_net: act.considerar_valor_net ?? false
      }));

      setPackageAttractions(activitiesWithDefaults as PackageActivityForm[]);
    }

    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let packageId;
      if (editingPackage) {
        const { error } = await supabase.from('packages').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', editingPackage.id);
        if (error) throw error;
        packageId = editingPackage.id;
        toast.success('Pacote atualizado!');
      } else {
        const { data, error } = await supabase.from('packages').insert([formData]).select().single();
        if (error) throw error;
        packageId = data.id;
        toast.success('Pacote cadastrado!');
      }

      // Se estiver editando, sempre apague as atividades antigas primeiro
      if (editingPackage) {
        await supabase.from('package_attractions').delete().eq('package_id', packageId);
      }

      // Insere as novas atividades se houver alguma
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

        const { error: attractionsError } = await supabase
          .from('package_attractions')
          .insert(activitiesToInsert);

        if (attractionsError) {
          console.error('Erro ao salvar atividades:', attractionsError);
          throw attractionsError;
        }
      }

      handleModalClose();
      void fetchData();
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Erro ao salvar pacote: ' + error.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    await supabase.from('package_attractions').delete().eq('package_id', id);
    await supabase.from('packages').delete().eq('id', id);
    toast.success('Excluído!');
    void fetchData();
  };

  const addAttraction = () => setPackageAttractions([...packageAttractions, {
    attraction_id: '',
    scheduled_date: formData.start_date,
    start_time: '',
    notes: '',
    considerar_valor_net: false,
  }]);
  const removeAttraction = (index: number) => setPackageAttractions(packageAttractions.filter((_, i) => i !== index));
  const updateAttraction = (index: number, field: keyof PackageActivityForm, value: string | boolean) => {
    const updated = packageAttractions.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setPackageAttractions(updated);
  };

  const getAttractionDetails = (attractionId: string) => {
    if (!attractionId) return null;

    const attraction = attractions.find(a => a.id === attractionId);
    if (!attraction) return null;

    return {
      name: attraction.name,
      duration: attraction.duration ?? '1 hora',
      valor_net: attraction.valor_net ?? 0,
      has_valor_net: (attraction.valor_net ?? 0) > 0
    };
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSendSchedule = async (item: ScheduleItem) => {
    setSelectedScheduleItem(item);
    const { data: dayActivities } = await supabase.from('package_attractions').select('*, packages!inner(client_name), attractions!inner(name)').eq('scheduled_date', item.scheduled_date).eq('packages.driver_id', item.packages.drivers.id);
    const message = formatScheduleMessage({ driverName: item.packages.drivers.name, date: item.scheduled_date, activities: (dayActivities ?? []).map(act => ({ clientName: act.packages.client_name, startTime: act.start_time ?? '', attractionName: act.attractions.name })) });
    setPreviewMessage(message);
    setShowConfirmSendModal(true);
  };

  const handleNewPackageFromCalendar = (date: Date) => {
    resetForm();
    setFormData(prev => ({ ...prev, start_date: format(date, 'yyyy-MM-dd'), end_date: format(date, 'yyyy-MM-dd') }));
    setShowModal(true);
  };

  const handleConfirmSend = () => {
    if (!selectedScheduleItem) return;
    const driverPhone = selectedScheduleItem.packages.drivers.phone;
    if (!driverPhone) { toast.error('Motorista sem telefone!'); return; }
    sendWhatsAppMessage(driverPhone, previewMessage);
    setShowConfirmSendModal(false);
    setPreviewMessage('');
  };

  const getStatusColor = (status: PackageStatus) => {
    const colors = {
      [PackageStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [PackageStatus.CONFIRMED]: 'bg-green-100 text-green-800',
      [PackageStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [PackageStatus.COMPLETED]: 'bg-gray-200 text-gray-800',
      [PackageStatus.CANCELLED]: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: PackageStatus | 'all') => {
    if (status === 'all') return 'Todos';
    const statusText = {
      [PackageStatus.PENDING]: 'Pendente',
      [PackageStatus.CONFIRMED]: 'Confirmado',
      [PackageStatus.IN_PROGRESS]: 'Em Andamento',
      [PackageStatus.COMPLETED]: 'Concluído',
      [PackageStatus.CANCELLED]: 'Cancelado',
    };
    return statusText[status];
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return duration > 1 ? `${duration} dias` : `${duration} dia`;
  };

  const handleUpdateStatus = async (packageId: string, newStatus: PackageStatus) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', packageId);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      void fetchData();
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Erro ao atualizar status: ' + error.message);
      }
    }
  };

  if (loading) return <div className="p-4 md:p-6">Carregando...</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header e Filtros */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 p-4 md:p-6">
          <div className="md:flex md:items-center md:justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Agenda</h1>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => setViewMode('list')} className={cn("px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2", viewMode === 'list' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100')}><List size={16} /> Lista</button>
                <button onClick={() => setViewMode('calendar')} className={cn("px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2", viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100')}><Calendar size={16} /> Calendário</button>
              </div>
              <button onClick={() => { resetForm(); setShowModal(true); }} className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus size={16} /> Nova Reserva
              </button>
            </div>
          </div>
          <div className="mt-4 md:hidden"><button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Filtros e Visualização</button></div>
          <div className={cn("mt-4 space-y-3 md:block", showFilters ? "block" : "hidden")}>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">{(['all', ...Object.values(PackageStatus)] as (PackageStatus | 'all')[]).map(status => <button key={status} onClick={() => setStatusFilter(status)} className={cn("flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium", statusFilter === status ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>{getStatusText(status)}</button>)}</div>
            <div className="md:hidden flex items-center gap-2 border-t pt-4"><p className="text-sm font-medium">Ver como:</p><button onClick={() => setViewMode('list')} className={cn("px-3 py-1 rounded-md text-sm", viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100')}>Lista</button><button onClick={() => setViewMode('calendar')} className={cn("px-3 py-1 rounded-md text-sm", viewMode === 'calendar' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100')}>Calendário</button></div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 md:p-6">
          {viewMode === 'list' ? (
            <div className="space-y-3">
              <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pacote / Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agência</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPackages.map(pkg => (
                      <tr key={pkg.id}>
                        <td className="px-6 py-4">
                          <div className="font-semibold">{pkg.title}</div>
                          <div className="text-sm text-gray-500">{pkg.client_name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">{pkg.agencies?.name ?? 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <div>{format(parseISO(pkg.start_date), 'dd/MM/yy')} - {format(parseISO(pkg.end_date), 'dd/MM/yy')}</div>
                          <div className="text-xs text-gray-500">{calculateDuration(pkg.start_date, pkg.end_date)} | {pkg.package_attractions[0].count} atividades</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2 items-start">
                            <span className={cn("inline-flex px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap", getStatusColor(pkg.status))}>
                              {getStatusText(pkg.status)}
                            </span>
                            <div className="flex gap-1">
                              {pkg.status === 'pending' && <button onClick={() => { void handleUpdateStatus(pkg.id, PackageStatus.CONFIRMED); }} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors flex items-center gap-1"><Check size={12} /> Confirmar</button>}
                              {pkg.status === 'confirmed' && <button onClick={() => { void handleUpdateStatus(pkg.id, PackageStatus.IN_PROGRESS); }} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"><Play size={12} /> Iniciar</button>}
                              {pkg.status === 'in_progress' && <button onClick={() => { void handleUpdateStatus(pkg.id, PackageStatus.COMPLETED); }} className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"><CheckCircle size={12} /> Concluir</button>}
                              {['pending', 'confirmed'].includes(pkg.status) && <button onClick={() => { if (confirm('Tem certeza?')) { void handleUpdateStatus(pkg.id, PackageStatus.CANCELLED); } }} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors flex items-center gap-1"><X size={12} /> Cancelar</button>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { void handleEdit(pkg); }} className="p-2 text-gray-500 hover:text-blue-600"><Eye size={16} /></button>
                          <button onClick={() => { void handleDelete(pkg.id); }} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="hidden md:block"><AgendaCalendarView onSend={handleSendSchedule} onNewPackage={handleNewPackageFromCalendar} /></div>
          )}
          {viewMode === 'calendar' && <div className="md:hidden text-center p-8 bg-white rounded-lg"><Calendar className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2">Visualização de Calendário</h3><p className="mt-1 text-sm text-gray-500">Disponível apenas em telas maiores.</p></div>}
        </div>
      </div>

      <FloatingActionButton icon={Plus} onClick={() => { resetForm(); setShowModal(true); }} />

      <Modal isOpen={showModal} onClose={handleModalClose} title={editingPackage ? 'Editar Reserva' : 'Nova Reserva'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label htmlFor="title">Título</label><input id="title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div className="md:col-span-2"><label htmlFor="client_name">Cliente</label><input id="client_name" required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div><label htmlFor="agency_id">Agência</label><select id="agency_id" required value={formData.agency_id} onChange={e => setFormData({...formData, agency_id: e.target.value})} className="w-full p-2 border rounded"><option value="">Selecione</option>{agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div><label htmlFor="total_participants">Participantes</label><input id="total_participants" type="number" required value={formData.total_participants} onChange={e => setFormData({...formData, total_participants: +e.target.value})} className="w-full p-2 border rounded" /></div>
            <div><label htmlFor="start_date">Data Início</label><input id="start_date" type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div><label htmlFor="end_date">Data Fim</label><input id="end_date" type="date" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div><label htmlFor="vehicle_id">Veículo</label><select id="vehicle_id" required value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} className="w-full p-2 border rounded"><option value="">Selecione</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.license_plate})</option>)}</select></div>
            <div><label htmlFor="driver_id">Motorista</label><select id="driver_id" required value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})} className="w-full p-2 border rounded"><option value="">Selecione</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          </div>
          <div><label htmlFor="notes">Observações</label><textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border rounded" /></div>
          <div>
            <h4 className="font-bold mt-4 mb-2">Atividades do Pacote</h4>
            {packageAttractions.map((activity, index) => {
              // Obter detalhes do atrativo selecionado
              const attractionDetails = getAttractionDetails(activity.attraction_id);

              return (
                <div key={index} className="border border-gray-300 p-4 mb-3 rounded-lg bg-gray-50 relative">

                  {/* Botão Remover */}
                  <button
                    type="button"
                    onClick={() => removeAttraction(index)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                    title="Remover atividade"
                  >
                    <X size={18} />
                  </button>

                  {/* Título da Atividade */}
                  <div className="mb-3 pr-8">
                    <h5 className="text-sm font-semibold text-gray-700">
                      Atividade {index + 1}
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

                    {/* Atrativo */}
                    <div className="md:col-span-2 lg:col-span-3">
                      <label
                        htmlFor={`attraction-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Atrativo / Passeio *
                      </label>
                      <select
                        id={`attraction-${index}`}
                        required
                        value={activity.attraction_id}
                        onChange={(e) => updateAttraction(index, 'attraction_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione um atrativo</option>
                        {attractions.map((attr) => (
                          <option key={attr.id} value={attr.id}>
                            {attr.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Data */}
                    <div>
                      <label
                        htmlFor={`date-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Data *
                      </label>
                      <input
                        id={`date-${index}`}
                        type="date"
                        required
                        value={activity.scheduled_date}
                        onChange={(e) => updateAttraction(index, 'scheduled_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Horário de Início */}
                    <div>
                      <label
                        htmlFor={`start-time-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Horário de Início *
                      </label>
                      <input
                        id={`start-time-${index}`}
                        type="time"
                        required
                        value={activity.start_time ?? ''}
                        onChange={(e) => updateAttraction(index, 'start_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Duração (Read-only, vem do cadastro do atrativo) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duração
                      </label>
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-700 text-sm">
                        {attractionDetails?.duration || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Checkbox Valor NET */}
                  {attractionDetails?.has_valor_net && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`valor-net-${index}`}
                          checked={activity.considerar_valor_net ?? false}
                          onChange={(e) => updateAttraction(index, 'considerar_valor_net', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`valor-net-${index}`}
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          Considerar valor NET no fechamento
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Desktop Button */}
            <button type="button" onClick={addAttraction} className="hidden md:flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium py-2">
              <Plus size={16} /> Adicionar Atividade
            </button>
          </div>
           {/* Mobile FAB */}
          <div className="md:hidden sticky bottom-4 flex justify-end">
             <button type="button" onClick={addAttraction} className="bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:bg-blue-700">
                <Plus size={24} />
             </button>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={handleModalClose} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button></div>
        </form>
      </Modal>

      {showConfirmSendModal && selectedScheduleItem && (
        <Modal isOpen={showConfirmSendModal} onClose={() => setShowConfirmSendModal(false)} title="Confirmar Envio">
            <p className="mb-4">Enviar a seguinte programação para o WhatsApp de <strong>{selectedScheduleItem.packages.drivers.name}</strong>?</p>
            <textarea
              readOnly
              className="w-full h-40 p-2 border rounded-md bg-gray-50 text-sm"
              value={previewMessage}
            />
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t"><button type="button" onClick={() => setShowConfirmSendModal(false)} className="px-4 py-2 border rounded">Cancelar</button><button onClick={handleConfirmSend} className="px-4 py-2 bg-blue-600 text-white rounded">Enviar</button></div>
        </Modal>
      )}
    </>
  );
};