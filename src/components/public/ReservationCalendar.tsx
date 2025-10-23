// src/components/public/ReservationCalendar.tsx
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { getPublicAvailability } from '../../services/availabilityService';

interface Props {
  publicView: boolean;
}

const getNext60Days = () => {
  const dates: Date[] = [];
  const startDate = new Date();
  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

export const ReservationCalendar = ({ publicView }: Props) => {
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    setLoading(true);
    const dates = getNext60Days();
    try {
      const availabilityMap = await getPublicAvailability(dates[0], dates[dates.length - 1]);
      setAvailability(availabilityMap);
    } catch (error) {
      console.error("Failed to load availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0,0,0,0);

    let days = [];
    // Preenche os dias vazios no início do mês
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    // Preenche os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateString = currentDate.toISOString().split('T')[0];
      const isAvailable = availability[dateString];
      const isPast = currentDate < today;

      days.push(
        <div
          key={day}
          className={`p-2 text-center rounded-lg text-sm
            ${isPast ? 'bg-gray-200 text-gray-400' :
            isAvailable === undefined ? 'bg-gray-100' :
            isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }`}
        >
          {day}
        </div>
      );
    }
    return days;
  };

  if (loading) return <div className="animate-pulse">Verificando disponibilidade...</div>;

  return (
    <div className="w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
        <CalendarIcon size={20} />
        Disponibilidade Geral
      </h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setMonth(month - 1)}>&larr;</button>
          <span className="font-semibold">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setMonth(month + 1)}>&rarr;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-500 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>
      {publicView && (
        <p className="text-xs text-center mt-4 text-gray-500">
          Este é um calendário apenas para visualização. <a href="/login" className="text-blue-600">Faça o login</a> como agência para reservar.
        </p>
      )}
    </div>
  );
};
