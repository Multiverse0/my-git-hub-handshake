import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
            <div className="bg-red-500/10 text-red-400 p-4 rounded-full inline-flex mb-6">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Noe gikk galt
            </h1>
            <p className="text-gray-300 mb-6">
              Det oppstod en uventet feil. Prøv å laste siden på nytt.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-medium text-red-400 mb-2">Feildetaljer (kun i utvikling):</h3>
                <pre className="text-xs text-gray-300 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Last siden på nytt
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn-secondary flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Gå til forsiden
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}