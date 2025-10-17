import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AgendaListViewMobile } from './AgendaListViewMobile';

interface Event {
  id: string;
  date: string;
  title: string;
}

interface GoogleCalendarViewProps {
  events: Event[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onViewPackage: (id: string) => void;
  onEditPackage: (id: string) => void;
  onAddActivity: (id: string) => void;
  packages: any[];
}

export const GoogleCalendarViewMobile: React.FC<GoogleCalendarViewProps> = ({ events, selectedDate, onDateChange, onViewPackage, onEditPackage, onAddActivity, packages }) => {
  const getWeekDays = (date: Date): Date[] => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // adjust when day is sunday
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const newDate = new Date(start);
      newDate.setDate(start.getDate() + i);
      return newDate;
    });
  };

  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => new Date(event.date).toDateString() === date.toDateString());
  };

  const weekDays = getWeekDays(selectedDate);
  const selectedDayEvents = getEventsForDate(selectedDate);

  const handleWeekChange = (direction: 'next' | 'prev') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    onDateChange(newDate);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 border-b flex items-center justify-between">
        <button onClick={() => handleWeekChange('prev')} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-base font-semibold capitalize">
          {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => handleWeekChange('next')} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center py-2 text-xs font-semibold text-gray-500">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const eventsCount = getEventsForDate(day).length;
          return (
            <button
              key={index}
              onClick={() => onDateChange(day)}
              className={cn("aspect-square p-1 border-r border-b", isSelected && "bg-blue-50", !isSelected && "hover:bg-gray-50")}
            >
              <div className={cn("text-sm mx-auto", isToday && "w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center", !isToday && isSelected && "text-blue-600 font-bold")}>
                {day.getDate()}
              </div>
              {eventsCount > 0 && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {Array.from({ length: Math.min(eventsCount, 3) }).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t-2 border-blue-500">
        <AgendaListViewMobile date={selectedDate} packages={packages.filter(p => new Date(p.start_date).toDateString() === selectedDate.toDateString())} onView={onViewPackage} onEdit={onEditPackage} onAddActivity={onAddActivity} />
      </div>
    </div>
  );
};