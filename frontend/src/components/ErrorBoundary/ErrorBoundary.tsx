import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.container}>
          <div className={styles.errorBox}>
            <AlertCircle size={48} className={styles.icon} />
            <h1 className={styles.title}>Something went wrong</h1>
            <p className={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className={styles.details}>
                <summary>Error Details</summary>
                <pre className={styles.stackTrace}>
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className={styles.actions}>
              <Button onClick={this.handleReset} variant="primary">
                <RefreshCw size={18} />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="secondary">
                Reload Page
              </Button>
              <Button onClick={() => (window.location.href = '/')} variant="secondary">
                <Home size={18} />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

