import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface ScheduleItem {
  id: string;
  package_id: string;
  attraction_id: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  packages: {
    id: string;
    title: string;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    agencies: { name: string };
    vehicles: { id: string; license_plate: string; model: string };
    drivers: { id: string; name: string };
  };
  attractions: { name: string };
}

export const Schedule: React.FC = () => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [filters, setFilters] = useState({
    vehicle: '',
    agency: '',
    driver: '',
  });
  const [filterOptions, setFilterOptions] = useState({
    vehicles: [] as any[],
    agencies: [] as any[],
    drivers: [] as any[],
  });

  useEffect(() => {
    fetchScheduleData();
    fetchFilterOptions();
  }, [currentWeek, filters]);

  const updateResourceStatus = async (items: ScheduleItem[]) => {
    const now = new Date();
    const busyDrivers = new Set<string>();
    const busyVehicles = new Set<string>();
    const completedPackageResources = new Set<string>();

    items.forEach(item => {
      const startTime = item.start_time ? new Date(`${item.scheduled_date}T${item.start_time}`) : null;
      const endTime = item.end_time ? new Date(`${item.scheduled_date}T${item.end_time}`) : null;
      const scheduleDate = new Date(item.scheduled_date);
      
      // Verifica se o pacote está em andamento ou agendado para hoje
      const isActiveToday = (
        item.packages.status === 'in_progress' || 
        (item.packages.status === 'confirmed' && isSameDay(scheduleDate, now))
      );

      // Se o pacote está ativo e tem duração >= 1 hora
      if (startTime && endTime && isActiveToday) {
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        if (duration >= 1) {
          busyDrivers.add(item.packages.drivers.id);
          busyVehicles.add(item.packages.vehicles.id);
        }
      }

      // Se o pacote está concluído ou cancelado, registra os recursos para liberar
      if (item.packages.status === 'completed' || item.packages.status === 'cancelled') {
        completedPackageResources.add(item.packages.drivers.id);
        completedPackageResources.add(item.packages.vehicles.id);
      }
    });

    // Remove recursos de pacotes concluídos/cancelados das listas de ocupados
    completedPackageResources.forEach(id => {
      busyDrivers.delete(id);
      busyVehicles.delete(id);
    });

    // Atualiza status dos motoristas
    const driverUpdates = [];
    if (busyDrivers.size > 0) {
      driverUpdates.push(
        supabase
          .from('drivers')
          .update({ status: 'busy' })
          .in('id', Array.from(busyDrivers))
      );
    }
    
    // Libera motoristas que não estão mais ocupados
    driverUpdates.push(
      supabase
        .from('drivers')
        .update({ status: 'available' })
        .not('id', 'in', busyDrivers.size > 0 ? `(${Array.from(busyDrivers).join(',')})` : '(null)')
    );

    // Atualiza status dos veículos
    const vehicleUpdates = [];
    if (busyVehicles.size > 0) {
      vehicleUpdates.push(
        supabase
          .from('vehicles')
          .update({ status: 'in_use' })
          .in('id', Array.from(busyVehicles))
      );
    }

    // Libera veículos que não estão mais em uso
    vehicleUpdates.push(
      supabase
        .from('vehicles')
        .update({ status: 'available' })
        .not('id', 'in', busyVehicles.size > 0 ? `(${Array.from(busyVehicles).join(',')})` : '(null)')
    );

    // Executa todas as atualizações em paralelo
    await Promise.all([...driverUpdates, ...vehicleUpdates]);
  };

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Segunda-feira
      const weekEnd = addDays(weekStart, 6);

      let query = supabase
        .from('package_attractions')
        .select(`
          *,
          packages!inner(
            id, title, status,
            agencies!inner(name),
            vehicles!inner(id, license_plate, model),
            drivers!inner(id, name)
          ),
          attractions(name)
        `)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'));

      // Aplicar filtros
      if (filters.vehicle) {
        query = query.eq('packages.vehicle_id', filters.vehicle);
      }
      if (filters.agency) {
        query = query.eq('packages.agency_id', filters.agency);
      }
      if (filters.driver) {
        query = query.eq('packages.driver_id', filters.driver);
      }

      const { data, error } = await query.order('scheduled_date').order('start_time');

      if (error) throw error;
      const items = data || [];
      setScheduleItems(items);
      await updateResourceStatus(items);
    } catch (error: any) {
      toast.error('Erro ao carregar agenda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [vehiclesResult, agenciesResult, driversResult] = await Promise.all([
        supabase.from('vehicles').select('id, license_plate, model').eq('active', true).order('license_plate'),
        supabase.from('agencies').select('id, name').eq('active', true).order('name'),
        supabase.from('drivers').select('id, name').eq('active', true).order('name'),
      ]);

      setFilterOptions({
        vehicles: vehiclesResult.data || [],
        agencies: agenciesResult.data || [],
        drivers: driversResult.data || [],
      });
    } catch (error) {
      console.error('Erro ao carregar opções de filtro:', error);
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getItemsForDate = (date: Date) => {
    return scheduleItems.filter(item => 
      isSameDay(parseISO(item.scheduled_date), date)
    );
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time.slice(0, 5); // Remove segundos
  };

  const getItemColors = (status: string) => {
    switch(status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          title: 'text-green-900',
          text: 'text-green-800',
          subtext: 'text-green-700',
          details: 'text-green-600'
        };
      case 'cancelled':
        return {
          bg: 'bg-red-100',
          border: 'border-red-500',
          title: 'text-red-900',
          text: 'text-red-800',
          subtext: 'text-red-700',
          details: 'text-red-600'
        };
      default: // pending, confirmed, in_progress
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          title: 'text-blue-900',
          text: 'text-blue-800',
          subtext: 'text-blue-700',
          details: 'text-blue-600'
        };
    }
  };

  const previousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const nextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const clearFilters = () => {
    setFilters({ vehicle: '', agency: '', driver: '' });
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Agenda Semanal</h1>
        
        {/* Controles de Navegação */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={previousWeek}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            <div className="text-lg font-medium">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "d 'de' MMMM", { locale: ptBR })} - {' '}
              {format(addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            
            <button
              onClick={nextWeek}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Hoje
            </button>
          </div>

          {/* Filtros */}
          <div className="flex items-center space-x-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.agency}
              onChange={(e) => setFilters({...filters, agency: e.target.value})}
            >
              <option value="">Todas as Agências</option>
              {filterOptions.agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.vehicle}
              onChange={(e) => setFilters({...filters, vehicle: e.target.value})}
            >
              <option value="">Todos os Veículos</option>
              {filterOptions.vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} - {vehicle.model}
                </option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.driver}
              onChange={(e) => setFilters({...filters, driver: e.target.value})}
            >
              <option value="">Todos os Motoristas</option>
              {filterOptions.drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Calendário Semanal */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {getWeekDays().map((day, index) => {
            const dayItems = getItemsForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`min-h-[400px] border-r border-b border-gray-200 ${
                  index === 6 ? 'border-r-0' : ''
                } ${isToday ? 'bg-blue-50' : 'bg-white'}`}
              >
                {/* Cabeçalho do Dia */}
                <div className={`p-3 border-b border-gray-200 ${
                  isToday ? 'bg-blue-100' : 'bg-gray-50'
                }`}>
                  <div className="text-sm font-medium text-gray-900">
                    {format(day, 'EEEE', { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-bold ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Items do Dia */}
                <div className="p-2 space-y-2">
                  {dayItems.map((item) => {
                    const colors = getItemColors(item.packages.status);
                    return (
                      <div
                        key={item.id}
                        className={`${colors.bg} border-l-4 ${colors.border} p-2 rounded-r-md text-sm hover:opacity-80 transition-colors duration-200 cursor-pointer`}
                        title={`${item.packages.title} - ${item.attractions.name}`}
                      >
                        <div className={`font-medium ${colors.title}`}>
                          {formatTime(item.start_time)}
                          {item.end_time && ` - ${formatTime(item.end_time)}`}
                        </div>
                        <div className={`${colors.text} truncate`}>
                          {item.attractions.name}
                        </div>
                        <div className={`${colors.subtext} text-xs truncate`}>
                          {item.packages.agencies.name}
                        </div>
                        <div className={`${colors.details} text-xs truncate`}>
                          {item.packages.vehicles.license_plate} • {item.packages.drivers.name}
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayItems.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-8">
                      Nenhuma atividade
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-100 border-l-4 border-blue-500 mr-2"></div>
          Em Andamento/Agendado
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-100 border-l-4 border-green-500 mr-2"></div>
          Concluído
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-100 border-l-4 border-red-500 mr-2"></div>
          Cancelado
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-50 border mr-2"></div>
          Hoje
        </div>
      </div>
    </div>
  );
};