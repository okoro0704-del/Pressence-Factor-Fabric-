'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Simple React Error Boundary so one failing component (e.g. Wallet or Presence check)
 * does not freeze the entire screen. Renders fallback and logs error.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] Caught error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-[#050505] p-4"
          style={{ color: '#6b6b70' }}
          role="alert"
        >
          <div className="max-w-md text-center">
            <p className="text-lg font-semibold text-[#D4AF37] mb-2">Something went wrong</p>
            <p className="text-sm mb-4">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded border font-medium"
              style={{ borderColor: 'rgba(212, 175, 55, 0.5)', color: '#D4AF37' }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
