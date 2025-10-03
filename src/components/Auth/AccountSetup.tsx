import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const AccountSetup: React.FC = () => {
  const { refreshProfile, signOut } = useAuth();
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const maxRetries = 5;

  useEffect(() => {
    const setupAccount = async () => {
      const interval = setInterval(async () => {
        // Atualiza progresso (máx 90% até completar)
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 10;
        });

        try {
          const profile = await refreshProfile();
          
          if (profile) {
            // Sucesso! Completa progresso
            setProgress(100);
            setError(null);
            clearInterval(interval);
            
            // Aguarda um momento e recarrega
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            return;
          }
          
          // Incrementa retry
          setRetryCount(prev => {
            const newCount = prev + 1;
            if (newCount >= maxRetries) {
              clearInterval(interval);
              setError('Não foi possível configurar sua conta automaticamente. Por favor, entre em contato com o suporte.');
              return newCount;
            }
            return newCount;
          });
        } catch (err) {
          console.error('Erro ao configurar conta:', err);
          setRetryCount(prev => {
            const newCount = prev + 1;
            if (newCount >= maxRetries) {
              clearInterval(interval);
              setError('Erro ao configurar conta. Tente novamente ou entre em contato com o suporte.');
              return newCount;
            }
            return newCount;
          });
        }
      }, 1500);

      return () => clearInterval(interval);
    };

    setupAccount();
  }, [refreshProfile]);

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setProgress(0);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          {!error ? (
            <>
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
                {progress}% concluído {retryCount > 0 && `(tentativa ${retryCount}/${maxRetries})`}
              </p>

              {retryCount >= maxRetries && !error && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Ainda configurando... Isso pode levar mais tempo que o esperado.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Erro na Configuração</h2>
              <p className="mt-2 text-red-600">
                {error}
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={signOut}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sair e Tentar Depois
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
