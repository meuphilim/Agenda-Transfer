// src/components/common/LoadingSpinner.tsx
import React from 'react';
import { Loader } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 24, className }) => {
  return (
    <Loader
      role="status"
      aria-label="Carregando..."
      style={{ width: size, height: size }}
      className={cn('animate-spin text-eco-primary-500', className)}
    />
  );
};
