import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  List,
  Calendar,
  ChevronDown,
  User,
  Truck,
  CalendarDays,
  MoreVertical,
  Eye
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '../types/database.types';
import { cn } from '../lib/utils';
import { FloatingActionButton, MobileModal } from '../components/Common';

type PackageWithRelations = Database['public']['Tables']['packages']['Row'] & {
  agencies?: { name: string };
  vehicles?: { license_plate: string; model: string };
  drivers?: { name: string };
};
type PackageStatus = Database['public']['Tables']['packages']['Row']['status'];

// Componente para a visualização em Calendário (similar ao antigo Schedule.tsx)
const AgendaCalendarView = () => {
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    fetchScheduleData();
  }, [currentWeek]);

  const fetchScheduleData = async () => {
    setLoading(true);
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const { data, error } = await supabase
      .from('package_attractions')
      .select(`*, packages!inner(title, status, agencies(name), vehicles(license_plate), drivers(name)), attractions(name)`)
      .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
      .order('scheduled_date')
      .order('start_time');

    if (error) {
      toast.error('Erro ao carregar agenda: ' + error.message);
    } else {
      setScheduleItems(data);
    }
    setLoading(false);
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getItemsForDate = (date: Date) => scheduleItems.filter(item => isSameDay(parseISO(item.scheduled_date), date));

  const formatTime = (time: string | null) => time ? time.slice(0, 5) : '';

  const getItemColor = (status: string) => status === 'completed' ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500';

  if (loading) return <div className="text-center p-8">Carregando calendário...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
       <div className="flex items-center justify-center space-x-4 mb-4">
          <button onClick={() => setCurrentWeek(addDays(currentWeek, -7))}>Anterior</button>
          <h2 className="font-bold">{format(currentWeek, "MMMM yyyy", { locale: ptBR })}</h2>
          <button onClick={() => setCurrentWeek(addDays(currentWeek, 7))}>Próxima</button>
       </div>
       <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
          {getWeekDays().map(day => (
            <div key={day.toString()} className="border-r border-gray-200 last:border-r-0">
               <div className="text-center font-bold p-2 border-b border-gray-200 bg-gray-50">{format(day, 'EEE', { locale: ptBR })}<br/>{format(day, 'd')}</div>
               <div className="p-1 space-y-1 min-h-[100px]">
                  {getItemsForDate(day).map(item => (
                     <div key={item.id} className={`p-1 rounded text-xs ${getItemColor(item.packages.status)}`}>
                        <p className="font-bold">{formatTime(item.start_time)} - {item.packages.title}</p>
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

// Componente principal da página Agenda (antigo Packages.tsx)
export const Agenda: React.FC = () => {
  const [packages, setPackages] = useState<PackageWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all');

  // Estados para o modal
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageWithRelations | null>(null);

  // ... (outros estados do formulário e dados relacionados)

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`*, agencies(name), vehicles(license_plate, model), drivers(name)`)
        .order('start_date', { ascending: false });
      if (error) throw error;
      setPackages(data as PackageWithRelations[] ?? []);
    } catch (error: any) {
      toast.error('Erro ao carregar pacotes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = useMemo(() => {
    return packages
      .filter(pkg => statusFilter === 'all' || pkg.status === statusFilter)
      .filter(pkg => {
        const search = searchTerm.toLowerCase();
        return (
          pkg.title.toLowerCase().includes(search) ||
          pkg.client_name?.toLowerCase().includes(search) ||
          pkg.agencies?.name.toLowerCase().includes(search)
        );
      });
  }, [packages, statusFilter, searchTerm]);

  const handleEdit = (pkg: PackageWithRelations) => {
    setEditingPackage(pkg);
    // ... (lógica para preencher o formulário)
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      // ... (lógica de exclusão)
      toast.success('Excluído com sucesso!');
      await fetchPackages();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const getStatusColor = (status: PackageStatus) => ({
    'pending': 'bg-yellow-100 text-yellow-800',
    'confirmed': 'bg-green-100 text-green-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-gray-200 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800',
  }[status]);

  const getStatusText = (status: PackageStatus) => ({
    'pending': 'Pendente',
    'confirmed': 'Confirmado',
    'in_progress': 'Em Andamento',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
  }[status]);

  if (loading) return <div className="p-4 md:p-6">Carregando...</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="p-4 md:p-6">
            <div className="md:flex md:items-center md:justify-between">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Agenda</h1>
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn("px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2", viewMode === 'list' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100')}
                >
                  <List size={16} /> Lista
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={cn("px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2", viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100')}
                >
                  <Calendar size={16} /> Calendário
                </button>
              </div>
            </div>

            <div className="mt-4 md:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
              >
                <span className="text-sm font-medium">Filtros e Visualização</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className={cn("mt-4 space-y-3 md:block", showFilters ? "block" : "hidden")}>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      statusFilter === status ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {getStatusText(status as PackageStatus) || 'Todos'}
                  </button>
                ))}
              </div>
               <div className="md:hidden flex items-center gap-2 border-t pt-4">
                <p className="text-sm font-medium">Ver como:</p>
                <button onClick={() => setViewMode('list')} className={cn("px-3 py-1 rounded-md text-sm", viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100')}>Lista</button>
                <button onClick={() => setViewMode('calendar')} className={cn("px-3 py-1 rounded-md text-sm", viewMode === 'calendar' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100')}>Calendário</button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredPackages.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{pkg.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{pkg.agencies?.name}</p>
                      </div>
                      <span className={cn("flex-shrink-0 ml-3 px-3 py-1 rounded-full text-xs font-medium", getStatusColor(pkg.status))}>
                        {getStatusText(pkg.status)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{format(parseISO(pkg.start_date), 'dd/MM/yy')} a {format(parseISO(pkg.end_date), 'dd/MM/yy')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{pkg.drivers?.name ?? 'Não definido'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{pkg.vehicles?.model ?? 'Não definido'} - {pkg.vehicles?.license_plate}</span>
                    </div>
                  </div>
                   <div className="border-t border-gray-100 px-2 py-2 flex gap-2">
                      <button className="flex-1 text-sm flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md">
                        <Eye size={14} /> Ver
                      </button>
                      <button onClick={() => handleEdit(pkg)} className="flex-1 text-sm flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md">
                        <Pencil size={14} /> Editar
                      </button>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hidden md:block">
              <AgendaCalendarView />
            </div>
          )}
           {viewMode === 'calendar' && (
              <div className="md:hidden text-center p-8 bg-white rounded-lg shadow-sm">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Visualização de Calendário</h3>
                <p className="mt-1 text-sm text-gray-500">A visualização de calendário é melhor em telas maiores. Por favor, use um tablet ou desktop.</p>
              </div>
           )}
        </div>
      </div>

      <FloatingActionButton icon={Plus} onClick={() => setShowModal(true)} />

      <MobileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPackage ? 'Editar Reserva' : 'Nova Reserva'}
      >
        <p>Formulário de edição/criação de reserva vai aqui.</p>
        {/* O formulário completo do modal antigo seria inserido aqui, adaptado para o novo layout */}
      </MobileModal>
    </>
  );
};