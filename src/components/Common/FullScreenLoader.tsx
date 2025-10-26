// src/components/common/FullScreenLoader.tsx
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface FullScreenLoaderProps {
  message?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ message = 'Carregando...' }) => {
  return (
    <div className="fixed inset-0 bg-eco-white bg-opacity-90 flex flex-col items-center justify-center z-50">
      <LoadingSpinner size={48} />
      <p className="mt-4 text-lg font-semibold text-eco-dark-700">{message}</p>
    </div>
  );
};
