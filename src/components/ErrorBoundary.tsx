import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // ✅ Log detalhado do erro
    console.error('🚨 ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // ✅ Atualiza estado com informações do erro
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // ✅ Se múltiplos erros consecutivos, limpa cache
    if (this.state.errorCount >= 3) {
      console.error('🚨 Múltiplos erros detectados - sugerindo limpeza de cache');
    }

    // ✅ TODO: Enviar para serviço de monitoramento (Sentry, LogRocket, etc)
    // if (import.meta.env.PROD) {
    //   sendErrorToMonitoring(error, errorInfo);
    // }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Cache limpo com sucesso');
      window.location.reload();
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      window.location.reload();
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      // ✅ Se há fallback customizado, usa ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // ✅ Tela de erro padrão melhorada com Heroicons
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Ops! Algo deu errado
              </h2>

              <p className="text-gray-600 mb-4">
                Ocorreu um erro inesperado na aplicação.
              </p>

              {/* ✅ Detalhes do erro (apenas em desenvolvimento) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    Detalhes do Erro (apenas em dev):
                  </p>
                  <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                        Ver stack trace
                      </summary>
                      <pre className="text-xs text-red-600 mt-2 overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* ✅ Aviso de múltiplos erros */}
              {this.state.errorCount >= 3 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Múltiplos erros detectados. Recomendamos limpar o cache.
                  </p>
                </div>
              )}
            </div>

            {/* ✅ Ações disponíveis */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🔄 Tentar Novamente
              </button>

              <button
                onClick={this.handleReload}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                ↻ Recarregar Página
              </button>

              {this.state.errorCount >= 2 && (
                <button
                  onClick={this.handleClearCache}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                >
                  🗑️ Limpar Cache e Recarregar
                </button>
              )}
            </div>

            {/* ✅ Informações de suporte */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Se o problema persistir, entre em contato com o suporte técnico.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
