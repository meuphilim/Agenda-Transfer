import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import {
  Plus, Pencil, Trash2, X, List, Calendar, ChevronDown, User, Truck, CalendarDays, MoreVertical, Eye, Send
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '../types/database.types';
import { cn } from '../lib/utils';
import { FloatingActionButton, MobileModal } from '../components/Common';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { formatScheduleMessage } from '../utils/messageFormat';

// Tipos
type Agency = Database['public']['Tables']['agencies']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Driver = Database['public']['Tables']['drivers']['Row'];
type Attraction = Database['public']['Tables']['attractions']['Row'];
type PackageActivity = Database['public']['Tables']['package_attractions']['Row'];
type PackageWithRelations = Database['public']['Tables']['packages']['Row'] & {
  agencies?: Pick<Agency, 'name'>;
  vehicles?: Pick<Vehicle, 'license_plate' | 'model'>;
  drivers?: Pick<Driver, 'name'>;
};
type PackageStatus = Database['public']['Tables']['packages']['Row']['status'];
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

const AgendaCalendarView: React.FC<{onSend: (item: ScheduleItem) => void}> = ({ onSend }) => {
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
    fetchScheduleData();
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
               <div className="text-center font-bold p-2 border-b border-gray-200 bg-gray-50">{format(day, 'EEE', { locale: ptBR })}<br/>{format(day, 'd')}</div>
               <div className="p-1 space-y-1 min-h-[120px]">
                  {getItemsForDate(day).map(item => (
                     <div key={item.id} className={`p-2 rounded text-xs cursor-pointer ${getItemColor(item.packages.status)}`} onClick={() => onSend(item)} title="Enviar para WhatsApp">
                        <p className="font-bold flex items-center justify-between">
                          <span>{formatTime(item.start_time)} - {item.packages.client_name}</span>
                          <Send size={12} className="opacity-50 group-hover:opacity-100"/>
                        </p>
                        <p>{item.attractions.name}</p>
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
  const [packageAttractions, setPackageAttractions] = useState<Partial<PackageActivity>[]>([]);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkgs, ags, vhs, drs, atts] = await Promise.all([
        supabase.from('packages').select(`*, agencies(name), vehicles(license_plate, model), drivers(name)`).order('start_date', { ascending: false }),
        supabase.from('agencies').select('*').eq('active', true),
        supabase.from('vehicles').select('*').eq('active', true),
        supabase.from('drivers').select('*').eq('active', true),
        supabase.from('attractions').select('*').eq('active', true),
      ]);
      if (pkgs.error) throw pkgs.error;
      setPackages(pkgs.data as PackageWithRelations[]);
      setAgencies(ags.data ?? []);
      setVehicles(vhs.data ?? []);
      setDrivers(drs.data ?? []);
      setAttractions(atts.data ?? []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
    setFormData({ title: pkg.title, agency_id: pkg.agency_id, vehicle_id: pkg.vehicle_id, driver_id: pkg.driver_id, start_date: pkg.start_date, end_date: pkg.end_date, total_participants: pkg.total_participants, notes: pkg.notes ?? '', client_name: pkg.client_name ?? '' });
    const { data } = await supabase.from('package_attractions').select('*').eq('package_id', pkg.id);
    setPackageAttractions(data ?? []);
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
      if (packageAttractions.length > 0) {
        if (editingPackage) await supabase.from('package_attractions').delete().eq('package_id', packageId);
        const activitiesToInsert = packageAttractions.map(attr => ({ ...attr, package_id: packageId, id: undefined }));
        const { error: attractionsError } = await supabase.from('package_attractions').insert(activitiesToInsert);
        if (attractionsError) throw attractionsError;
      }
      handleModalClose();
      await fetchData();
    } catch (error: any) {
      toast.error('Erro ao salvar pacote: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    await supabase.from('package_attractions').delete().eq('package_id', id);
    await supabase.from('packages').delete().eq('id', id);
    toast.success('Excluído!');
    await fetchData();
  };

  const addAttraction = () => setPackageAttractions([...packageAttractions, { attraction_id: '', scheduled_date: formData.start_date, start_time: '', end_time: '', notes: '' }]);
  const removeAttraction = (index: number) => setPackageAttractions(packageAttractions.filter((_, i) => i !== index));
  const updateAttraction = (index: number, field: keyof PackageActivity, value: any) => {
    const updated = [...packageAttractions];
    (updated[index] as any)[field] = value;
    setPackageAttractions(updated);
  };

  const handleSendSchedule = (item: ScheduleItem) => {
    setSelectedScheduleItem(item);
    setShowConfirmSendModal(true);
  };

  const handleConfirmSend = () => {
    if (!selectedScheduleItem) return;
    const driverPhone = selectedScheduleItem.packages.drivers.phone;
    if (!driverPhone) { toast.error('Motorista sem telefone!'); return; }
    const message = formatScheduleMessage({ driverName: selectedScheduleItem.packages.drivers.name, date: selectedScheduleItem.scheduled_date, activities: [{ clientName: selectedScheduleItem.packages.client_name, startTime: selectedScheduleItem.start_time ?? '', attractionName: selectedScheduleItem.attractions.name }] });
    sendWhatsAppMessage(driverPhone, message);
    setShowConfirmSendModal(false);
  };

  const getStatusColor = (status: PackageStatus) => ({ 'pending': 'bg-yellow-100 text-yellow-800', 'confirmed': 'bg-green-100 text-green-800', 'in_progress': 'bg-blue-100 text-blue-800', 'completed': 'bg-gray-200 text-gray-800', 'cancelled': 'bg-red-100 text-red-800' }[status]);
  const getStatusText = (status: PackageStatus) => ({ 'pending': 'Pendente', 'confirmed': 'Confirmado', 'in_progress': 'Em Andamento', 'completed': 'Concluído', 'cancelled': 'Cancelado' }[status]);

  if (loading) return <div className="p-4 md:p-6">Carregando...</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header e Filtros */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 p-4 md:p-6">
          <div className="md:flex md:items-center md:justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Agenda</h1>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => setViewMode('list')} className={cn("px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2", viewMode === 'list' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100')}><List size={16} /> Lista</button>
              <button onClick={() => setViewMode('calendar')} className={cn("px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2", viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100')}><Calendar size={16} /> Calendário</button>
            </div>
          </div>
          <div className="mt-4 md:hidden"><button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Filtros e Visualização <ChevronDown className={cn(showFilters && 'rotate-180')} /></button></div>
          <div className={cn("mt-4 space-y-3 md:block", showFilters ? "block" : "hidden")}>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">{['all', ...Object.keys(getStatusText({} as any))].map(status => <button key={status} onClick={() => setStatusFilter(status as any)} className={cn("flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium", statusFilter === status ? "bg-blue-600 text-white" : "bg-gray-100")}>{getStatusText(status as any) || 'Todos'}</button>)}</div>
            <div className="md:hidden flex items-center gap-2 border-t pt-4"><p>Ver como:</p><button onClick={() => setViewMode('list')} className={cn(viewMode === 'list' && 'bg-blue-100')}>Lista</button><button onClick={() => setViewMode('calendar')} className={cn(viewMode === 'calendar' && 'bg-blue-100')}>Calendário</button></div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 md:p-6">
          {viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredPackages.map(pkg => (
                <div key={pkg.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-4"><div className="flex justify-between"><h3 className="font-semibold">{pkg.title}</h3><span className={cn("px-3 py-1 rounded-full text-xs", getStatusColor(pkg.status))}>{getStatusText(pkg.status)}</span></div><p className="text-sm text-gray-500">{pkg.agencies?.name}</p></div>
                  <div className="p-4 space-y-3 border-t"><div className="flex items-center text-sm"><CalendarDays size={14} className="mr-2" /> {format(parseISO(pkg.start_date), 'dd/MM/yy')} a {format(parseISO(pkg.end_date), 'dd/MM/yy')}</div><div className="flex items-center text-sm"><User size={14} className="mr-2" /> {pkg.drivers?.name ?? 'N/D'}</div><div className="flex items-center text-sm"><Truck size={14} className="mr-2" /> {pkg.vehicles?.model ?? 'N/D'}</div></div>
                  <div className="border-t px-2 py-2 flex gap-2"><button onClick={() => handleEdit(pkg)} className="flex-1 text-sm flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md"><Pencil size={14} /> Editar</button><button onClick={() => handleDelete(pkg.id)} className="flex-1 text-sm flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md"><Trash2 size={14} /> Excluir</button></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hidden md:block"><AgendaCalendarView onSend={handleSendSchedule} /></div>
          )}
          {viewMode === 'calendar' && <div className="md:hidden text-center p-8 bg-white rounded-lg"><Calendar className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2">Visualização de Calendário</h3><p className="mt-1 text-sm text-gray-500">Disponível apenas em telas maiores.</p></div>}
        </div>
      </div>

      <FloatingActionButton icon={Plus} onClick={() => { resetForm(); setShowModal(true); }} />

      <MobileModal isOpen={showModal} onClose={handleModalClose} title={editingPackage ? 'Editar Reserva' : 'Nova Reserva'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label>Título</label><input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div className="md:col-span-2"><label>Cliente</label><input required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div><label>Agência</label><select required value={formData.agency_id} onChange={e => setFormData({...formData, agency_id: e.target.value})} className="w-full p-2 border rounded"><option value="">Selecione</option>{agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div><label>Participantes</label><input type="number" required value={formData.total_participants} onChange={e => setFormData({...formData, total_participants: +e.target.value})} className="w-full p-2 border rounded" /></div>
            <div><label>Data Início</label><input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div><label>Data Fim</label><input type="date" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div><label>Veículo</label><select required value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} className="w-full p-2 border rounded"><option value="">Selecione</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.license_plate})</option>)}</select></div>
            <div><label>Motorista</label><select required value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})} className="w-full p-2 border rounded"><option value="">Selecione</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          </div>
          <div><label>Observações</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border rounded" /></div>
          <div>
            <h4 className="font-bold mt-4 mb-2">Atividades do Pacote</h4>
            {packageAttractions.map((activity, index) => (
              <div key={index} className="border p-3 mb-2 rounded grid grid-cols-2 gap-2 relative">
                 <button type="button" onClick={() => removeAttraction(index)} className="absolute top-1 right-1 text-red-500"><X size={16} /></button>
                 <div><label>Atrativo</label><select required value={activity.attraction_id} onChange={e => updateAttraction(index, 'attraction_id', e.target.value)} className="w-full p-2 border rounded"><option value="">Selecione</option>{attractions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                 <div><label>Data</label><input type="date" required value={activity.scheduled_date} onChange={e => updateAttraction(index, 'scheduled_date', e.target.value)} className="w-full p-2 border rounded" /></div>
                 <div><label>Início</label><input type="time" value={activity.start_time ?? ''} onChange={e => updateAttraction(index, 'start_time', e.target.value)} className="w-full p-2 border rounded" /></div>
                 <div><label>Fim</label><input type="time" value={activity.end_time ?? ''} onChange={e => updateAttraction(index, 'end_time', e.target.value)} className="w-full p-2 border rounded" /></div>
              </div>
            ))}
            <button type="button" onClick={addAttraction} className="text-sm text-blue-600">+ Adicionar Atividade</button>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={handleModalClose} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button></div>
        </form>
      </MobileModal>

      {showConfirmSendModal && selectedScheduleItem && (
        <MobileModal isOpen={showConfirmSendModal} onClose={() => setShowConfirmSendModal(false)} title="Confirmar Envio">
            <p>Enviar programação para o WhatsApp de <strong>{selectedScheduleItem.packages.drivers.name}</strong>?</p>
            <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowConfirmSendModal(false)} className="px-4 py-2 border rounded">Cancelar</button><button onClick={handleConfirmSend} className="px-4 py-2 bg-blue-600 text-white rounded">Enviar</button></div>
        </MobileModal>
      )}
    </>
  );
};