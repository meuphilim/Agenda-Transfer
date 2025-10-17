import { User, Truck, MapPin, Eye, Edit2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../Common/Button';

// Mock de tipos, substituir pelos tipos reais
interface Package {
  id: string;
  title: string;
  agencies: { name: string } | null;
  drivers: { name: string } | null;
  vehicles: { model: string; license_plate: string } | null;
  package_attractions?: any[];
}

interface ListViewProps {
  date: Date;
  packages: Package[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onAddActivity: (id: string) => void;
}

export const AgendaListViewMobile: React.FC<ListViewProps> = ({ date, packages, onView, onEdit, onAddActivity }) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900">
          {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        <p className="text-sm text-blue-700 mt-1">
          {packages.length} {packages.length === 1 ? 'pacote agendado' : 'pacotes agendados'}
        </p>
      </div>

      {packages.length > 0 ? (
        packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b">
              <h3 className="font-semibold text-gray-900">{pkg.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{pkg.agencies?.name}</p>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center text-sm text-gray-700"><User size={14} className="mr-2" />{pkg.drivers?.name}</div>
              <div className="flex items-center text-sm text-gray-700"><Truck size={14} className="mr-2" />{pkg.vehicles?.model} - {pkg.vehicles?.license_plate}</div>
              {pkg.package_attractions && pkg.package_attractions.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Atividades</p>
                  <div className="space-y-1">
                    {pkg.package_attractions.map((act) => (
                      <div key={act.id} className="flex items-start text-sm">
                        <MapPin size={14} className="mr-2 mt-0.5 text-blue-500" />
                        <span>{act.attractions.name} <span className="text-gray-500">às {act.start_time}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-2 border-t bg-gray-50 flex gap-2">
              <Button variant="secondary" size="sm" icon={Eye} fullWidth onClick={() => onView(pkg.id)}>Ver</Button>
              <Button variant="secondary" size="sm" icon={Edit2} fullWidth onClick={() => onEdit(pkg.id)}>Editar</Button>
              <Button variant="success" size="sm" icon={Plus} fullWidth onClick={() => onAddActivity(pkg.id)}>+ Ativ.</Button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum pacote para este dia.</p>
        </div>
      )}
    </div>
  );
};