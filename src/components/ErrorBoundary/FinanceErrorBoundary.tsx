import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class FinanceErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro no módulo financeiro:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
          <h1>Ocorreu um erro no módulo financeiro.</h1>
          <p>Por favor, tente recarregar a página ou contate o suporte.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FinanceErrorBoundary;