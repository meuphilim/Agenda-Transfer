import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPublicAvailability } from '../../services/availabilityService';

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

export const ReservationCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    void loadAvailability();
  }, []);

  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const handleDateClick = (day: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (day < startDate) {
      setEndDate(startDate);
      setStartDate(day);
    } else {
      setEndDate(day);
    }
  };

  const renderHeader = () => {
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 capitalize text-center flex-grow">
          {`${monthName} ${year}`}
        </h2>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarDays = [];

    // Dias do mês anterior
    for (let i = firstDayOfMonth; i > 0; i--) {
      calendarDays.push(
        <div key={`prev-${i}`} className="text-center w-10 h-10 flex items-center justify-center text-gray-400 text-sm">
          {daysInPrevMonth - i + 1}
        </div>
      );
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      const dayTime = day.getTime();
      const dateString = day.toISOString().split('T')[0];
      const isAvailable = availability[dateString];
      const isPast = day < today;
      const isClickable = isAvailable && !isPast;

      const isToday = day.toDateString() === new Date().toDateString();
      const isStartDate = startDate && dayTime === startDate.getTime();
      const isEndDate = endDate && dayTime === endDate.getTime();
      const isInRange = startDate && endDate && dayTime > startDate.getTime() && dayTime < endDate.getTime();
      const isSingleDaySelection = startDate && !endDate && isStartDate;

      let dayClasses = 'text-center w-10 h-10 flex items-center justify-center transition-colors text-sm';

      if (isPast || !isAvailable) {
        dayClasses += ' text-gray-400 bg-gray-100 cursor-not-allowed rounded-full';
      } else {
        dayClasses += ' cursor-pointer';
        if (isSingleDaySelection) {
          dayClasses += ' bg-lime-500 text-gray-900 rounded-full font-bold';
        } else if (isStartDate) {
          dayClasses += ' bg-lime-500 text-gray-900 rounded-l-full font-bold';
        } else if (isEndDate) {
          dayClasses += ' bg-lime-500 text-gray-900 rounded-r-full font-bold';
        } else if (isInRange) {
          dayClasses += ' bg-lime-100 text-gray-900';
        } else {
          dayClasses += ' text-gray-700 rounded-full hover:bg-lime-50';
        }
      }

      calendarDays.push(
        <button
          key={i}
          onClick={() => isClickable && handleDateClick(day)}
          className={dayClasses}
          disabled={!isClickable}
        >
          <span className={isToday && !isPast ? 'font-bold border-b-2 border-lime-500' : ''}>
            {i}
          </span>
        </button>
      );
    }

    // Dias do próximo mês
    const totalDays = calendarDays.length;
    const remainingDays = (7 - (totalDays % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push(
        <div key={`next-${i}`} className="text-center w-10 h-10 flex items-center justify-center text-gray-400 text-sm">
          {i}
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-y-1 place-items-center">{calendarDays}</div>;
  };

  return (
    <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-lg">
      {/* Título */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Disponibilidades
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Solicite sua Reserva
        </p>
      </div>

      {/* Header do calendário */}
      {renderHeader()}

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-y-2 text-center text-sm font-bold text-lime-600 mb-2">
        {daysOfWeek.map((day, index) => (
          <div key={index}>{day}</div>
        ))}
      </div>

      {/* Grid de dias */}
      {loading ? (
        <div className="text-center p-8 text-gray-500">
          Verificando disponibilidade...
        </div>
      ) : (
        renderDays()
      )}

      {/* Botão de ação */}
      <button
        disabled={!startDate}
        className="w-full mt-6 bg-lime-500 text-gray-900 text-sm font-bold py-3 px-4 rounded-xl hover:bg-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        Solicitar Reserva
      </button>

      {/* Mensagem informativa */}
      <p className="text-xs text-center mt-4 text-gray-500">
        Este é um calendário apenas para visualização. Para reservar, entre com sua conta de agência.
      </p>
    </div>
  );
};
