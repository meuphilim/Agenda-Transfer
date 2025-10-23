// src/components/agency/ReservationCalendar.tsx
import { useState, useEffect } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { availabilityService } from '../../services/availability.service';
import { AvailabilityDay } from '../../types/agency-portal';

interface Props {
  onSelectPeriod: (start: string, end: string) => void;
}

export const ReservationCalendar = ({ onSelectPeriod }: Props) => {
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const data = await availabilityService.getNext60Days();
      setAvailability(data);
    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: string, isAvailable: boolean) => {
    if (!isAvailable) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      // Iniciar nova seleção
      setSelectedStart(date);
      setSelectedEnd(null);
    } else {
      // Completar seleção
      if (date >= selectedStart) {
        setSelectedEnd(date);
        onSelectPeriod(selectedStart, date);
      } else {
        // Se clicar em data anterior, reiniciar
        setSelectedStart(date);
        setSelectedEnd(null);
      }
    }
  };

  const getDayClass = (day: AvailabilityDay) => {
    const isSelected =
      (selectedStart === day.date) ||
      (selectedEnd === day.date) ||
      (selectedStart && selectedEnd && day.date > selectedStart && day.date < selectedEnd);

    return `
      relative p-3 text-center cursor-pointer rounded-lg transition-all
      ${day.is_available
        ? 'bg-green-50 hover:bg-green-100 border border-green-200'
        : 'bg-gray-100 cursor-not-allowed opacity-50'
      }
      ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
    `;
  };

  if (loading) {
    return <div className="animate-pulse">Carregando disponibilidade...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Selecione o Período
        </h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-600" />
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="w-4 h-4 text-gray-400" />
            <span>Indisponível</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
            {day}
          </div>
        ))}

        {availability.map(day => (
          <div
            key={day.date}
            onClick={() => handleDateClick(day.date, day.is_available)}
            className={getDayClass(day)}
          >
            <div className="text-sm font-medium">
              {new Date(day.date).getDate()}
            </div>
            <div className="text-xs text-gray-500">
              {day.available_vehicles} veíc.
            </div>
          </div>
        ))}
      </div>

      {selectedStart && !selectedEnd && (
        <p className="text-sm text-blue-600">
          Data inicial: {new Date(selectedStart).toLocaleDateString('pt-BR')}.
          Selecione a data final.
        </p>
      )}

      {selectedStart && selectedEnd && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium">
            Período selecionado: {new Date(selectedStart).toLocaleDateString('pt-BR')} até {new Date(selectedEnd).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
};
