// src/components/Auth/AccountSetup.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const AccountSetup: React.FC = () => {
  const { user, accountSetup } = useAuth();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simula progresso da configuração
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Configurando sua conta</h2>
          <p className="mt-2 text-gray-600">
            Estamos finalizando a configuração do seu perfil. Isso pode levar alguns instantes.
          </p>
          
          {/* Barra de progresso */}
          <div className="mt-6 w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="mt-4 text-sm text-gray-500">
            {progress}% concluído
          </p>
        </div>
      </div>
    </div>
  );
};
