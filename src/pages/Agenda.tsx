import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { Plus, Send, List, Calendar as CalendarIcon } from 'lucide-react';

import { Database } from '../types/database.types';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { formatScheduleMessage } from '../utils/messageFormat';

import { Button, FloatingActionButton } from '../components/Common';
import { PackageModal, CalendarView, AgendaListViewMobile, GoogleCalendarViewMobile } from '../components/Agenda';

// Tipos
type Agency = Database['public']['Tables']['agencies']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Driver = Database['public']['Tables']['drivers']['Row'];
type Attraction = Database['public']['Tables']['attractions']['Row'];
type PackageActivity = Database['public']['Tables']['package_attractions']['Row'] & { attractions: Pick<Attraction, 'name' | 'location'> };
type Package = Database['public']['Tables']['packages']['Row'] & {
  agencies: Pick<Agency, 'id' | 'name'> | null;
  vehicles: Pick<Vehicle, 'id' | 'model' | 'license_plate'> | null;
  drivers: Pick<Driver, 'id' | 'name' | 'phone'> | null;
  package_attractions: PackageActivity[];
};
type PackageStatus = Database['public']['Tables']['packages']['Row']['status'];

export const Agenda: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter] = useState<PackageStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('packages')
      .select(`
        *,
        agencies (id, name),
        vehicles (id, model, license_plate),
        drivers (id, name, phone),
        package_attractions ( *, attractions (name, location) )
      `)
      .order('start_date', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar agenda: ' + error.message);
    } else {
      setPackages(data as Package[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filteredPackages = useMemo(() => {
    return packages
      .filter(p => statusFilter === 'all' || p.status === statusFilter);
  }, [packages, statusFilter]);

  const handleOpenModal = (pkg: Package, mode: 'view' | 'edit') => {
    setSelectedPackage(pkg);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleNewPackage = () => {
    // Implementar lógica de novo pacote
  };

  const handleSendToDriver = (date: Date) => {
    const packagesOfTheDay = packages.filter(p => new Date(p.start_date).toDateString() === date.toDateString());
    const driver = packagesOfTheDay[0]?.drivers;
    if (!driver?.phone) {
      toast.error('Motorista ou telefone não encontrado para este dia.');
      return;
    }
    const schedule = packagesOfTheDay.map(p => ({
      pacote: p.title,
      agencia: p.agencies?.name ?? 'N/A',
      veiculo: `${p.vehicles?.model} - ${p.vehicles?.license_plate}`,
      atividades: p.package_attractions.map(pa => ({
        horario: format(parseISO(pa.start_time ?? ''), 'HH:mm'),
        local: pa.attractions.name,
        endereco: pa.attractions.location,
      }))
    }));
    const message = formatScheduleMessage({ driverName: driver.name, date: format(date, 'yyyy-MM-dd'), activities: schedule.flatMap(s => s.atividades.map(a => ({ clientName: s.pacote, startTime: a.horario, attractionName: a.local }))) });
    sendWhatsAppMessage(driver.phone, message);
    toast.success('Programação enviada!');
  };

  return (
    <>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Agenda</h1>
          <div className="hidden md:flex items-center gap-2 mt-2 md:mt-0">
            <Button variant={viewMode === 'list' ? 'primary' : 'secondary'} icon={List} onClick={() => setViewMode('list')}>Lista</Button>
            <Button variant={viewMode === 'calendar' ? 'primary' : 'secondary'} icon={CalendarIcon} onClick={() => setViewMode('calendar')}>Calendário</Button>
          </div>
        </div>

        {/* --- Mobile View --- */}
        <div className="md:hidden">
           <div className="sticky top-0 z-10 bg-gray-50 py-2">
              <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                 <div className="flex items-center gap-2">
                    <input type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(new Date(e.target.value))} className="flex-1 p-2 border rounded-lg"/>
                    <Button variant="success" size="sm" icon={Send} onClick={() => handleSendToDriver(selectedDate)} disabled={!filteredPackages.some(p => new Date(p.start_date).toDateString() === selectedDate.toDateString())}>Enviar</Button>
                 </div>
                 <div className="flex gap-2">
                    <Button fullWidth variant={viewMode === 'list' ? 'primary' : 'secondary'} onClick={() => setViewMode('list')}>Lista</Button>
                    <Button fullWidth variant={viewMode === 'calendar' ? 'primary' : 'secondary'} onClick={() => setViewMode('calendar')}>Calendário</Button>
                 </div>
              </div>
           </div>
           <div className="mt-4">
              {viewMode === 'list' ? (
                <AgendaListViewMobile date={selectedDate} packages={filteredPackages.filter(p => new Date(p.start_date).toDateString() === selectedDate.toDateString())} onView={(id) => handleOpenModal(packages.find(p => p.id === id)!, 'view')} onEdit={(id) => handleOpenModal(packages.find(p => p.id === id)!, 'edit')} onAddActivity={() => {}} />
              ) : (
                <GoogleCalendarViewMobile selectedDate={selectedDate} onDateChange={setSelectedDate} events={packages.map(p => ({id: p.id, date: p.start_date, title: p.title}))} onViewPackage={(id) => handleOpenModal(packages.find(p => p.id === id)!, 'view')} />
              )}
           </div>
           <FloatingActionButton icon={Plus} onClick={handleNewPackage} />
        </div>

        {/* --- Desktop View --- */}
        <div className="hidden md:block">
          {viewMode === 'list' ? (
             <p>List view para Desktop a ser implementada com tabela</p>
          ) : (
            <CalendarView selectedDate={selectedDate} onDateChange={setSelectedDate} events={packages.map(p=> ({ id: p.id, title: p.title, date: p.start_date, time: format(parseISO(p.start_date), 'HH:mm'), agency: p.agencies?.name ?? '', driver: p.drivers?.name ?? '', color: 'bg-blue-200' }))} onViewPackage={(id) => handleOpenModal(packages.find(p => p.id === id)!, 'view')} onEditPackage={(id) => handleOpenModal(packages.find(p => p.id === id)!, 'edit')} onAddActivity={() => {}} onNewPackage={handleNewPackage} />
          )}
        </div>
      </div>

      <PackageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} packageData={selectedPackage} mode={modalMode} onSave={() => {}} onDelete={() => {}} />
    </>
  );
};