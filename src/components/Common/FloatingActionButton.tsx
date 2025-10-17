import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FABProps {
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
  color?: 'blue' | 'green' | 'red' | 'orange';
  className?: string;
}

const colorClasses = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  red: 'bg-red-600 hover:bg-red-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
};

export const FloatingActionButton = ({
  icon: Icon,
  onClick,
  label,
  color = 'blue',
  className
}: FABProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "md:hidden fixed bottom-6 right-6 text-white rounded-full shadow-lg transition-all active:scale-95",
        colorClasses[color],
        label ? "h-14 px-6 flex items-center space-x-2" : "h-14 w-14 flex items-center justify-center",
        className
      )}
      aria-label={label ?? 'Action button'}
    >
      <Icon className="h-6 w-6 flex-shrink-0" />
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
};