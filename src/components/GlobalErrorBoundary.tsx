'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error({
      msg: 'Global Error Boundary caught an error',
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-6">
          <div className="bg-card p-10 rounded-3xl shadow-xl border border-border max-w-lg w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tighter">Unexpected System Error</h2>
            <p className="text-zinc-500 leading-relaxed">
              The internal engine encountered a collision. Your session integrity is preserved, but this component had to be halted.
            </p>
            <div className="flex flex-col gap-3 pt-4">
                <button
                onClick={() => {
                    this.setState({ hasError: false });
                    window.location.reload();
                }}
                className="bg-primary text-primary-foreground h-12 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                Restart Session
                </button>
                <button
                onClick={() => {
                    this.setState({ hasError: false });
                    window.location.href = '/dashboard';
                }}
                className="text-zinc-500 font-bold text-sm hover:text-foreground transition-colors"
                >
                Return to Dashboard
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;




