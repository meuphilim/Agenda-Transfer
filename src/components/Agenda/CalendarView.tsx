import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Eye, Edit2, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Common/Button';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  agency: string;
  driver: string;
  color: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onViewPackage: (packageId: string) => void;
  onEditPackage: (packageId: string) => void;
  onAddActivity: (packageId: string) => void;
  onNewPackage: () => void;
}

export const CalendarView = ({
  events,
  selectedDate,
  onDateChange,
  onViewPackage,
  onEditPackage,
  onAddActivity,
  onNewPackage
}: CalendarViewProps) => {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const previousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      new Date(event.date).toDateString() === date.toDateString()
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">

      {/* Header do Calendário */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 capitalize">
          {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={previousMonth} aria-label="Mês anterior">
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button variant="secondary" size="sm" onClick={() => onDateChange(new Date())}>
            Hoje
          </Button>

          <Button variant="ghost" size="sm" onClick={nextMonth} aria-label="Próximo mês">
            <ChevronRight className="h-5 w-5" />
          </Button>

          <Button variant="primary" size="sm" icon={Plus} onClick={onNewPackage}>
            Novo Pacote
          </Button>
        </div>
      </div>

      {/* Grid do Calendário */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth(selectedDate).map((day, index) => {
            const dayEvents = day ? getEventsForDate(day) : [];
            const isToday = day && day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[120px] border border-gray-200 rounded-lg p-2 transition-all",
                  day ? "bg-white hover:border-blue-300 cursor-pointer" : "bg-gray-50",
                  isToday && "border-blue-500 border-2"
                )}
              >
                {day && (
                  <>
                    <div className={cn("text-sm font-medium mb-2", isToday ? "text-blue-600" : "text-gray-700")}>
                      {day.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="relative group"
                          onMouseEnter={() => setHoveredEvent(event.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                        >
                          <div className={cn("text-xs p-1.5 rounded cursor-pointer transition-all", event.color)}>
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-xs opacity-75">{event.time}</div>
                          </div>

                          {hoveredEvent === event.id && (
                            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[200px]">
                              <div className="space-y-2">
                                <div>
                                  <div className="font-semibold text-gray-900">{event.title}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <div>{event.agency}</div>
                                    <div>{event.driver}</div>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                  <Button size="sm" variant="secondary" icon={Eye} onClick={(e) => { e.stopPropagation(); onViewPackage(event.id); }}>
                                    Ver
                                  </Button>
                                  <Button size="sm" variant="secondary" icon={Edit2} onClick={(e) => { e.stopPropagation(); onEditPackage(event.id); }}>
                                    Editar
                                  </Button>
                                  <Button size="sm" variant="secondary" icon={MapPin} onClick={(e) => { e.stopPropagation(); onAddActivity(event.id); }}>
                                    +Ativ.
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {dayEvents.length > 2 && (
                        <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                          +{dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};