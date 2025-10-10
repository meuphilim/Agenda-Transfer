// src/components/Error/ErrorState.tsx
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title, 
  message, 
  onRetry, 
  className = "" 
}) => {
  return (
    <div className={`p-6 ${className}`}>
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{title}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{message}</p>
            </div>
            {onRetry && (
              <div className="mt-4">
                <button
                  onClick={onRetry}
                  className="text-sm font-medium text-red-600 hover:text-red-500 transition-colors duration-200"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
