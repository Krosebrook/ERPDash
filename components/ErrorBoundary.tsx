import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Standard React Error Boundary component.
 * Intercepts rendering errors in the UI execution layer and provides a fallback interface.
 */
class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Critical operational failure intercepted:', error, errorInfo);
  }

  // Bound arrow function for correct 'this' context when called from event handlers
  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[450px] w-full flex flex-col items-center justify-center p-12 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2.5rem] text-center animate-in fade-in transition-all duration-500 shadow-2xl">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] ring-4 ring-red-500/5">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-4">Neural Buffer Overrun</h2>
          <p className="text-[var(--text-secondary)] max-w-lg mb-10 text-base font-medium leading-relaxed">
            The system intercepted an unhandled exception in the UI execution layer. Your session integrity is maintained by our fail-safe protocols.
          </p>
          <div className="flex gap-6">
             <button
              onClick={this.handleRetry}
              className="px-8 py-4 bg-[var(--bg-element)] hover:bg-slate-800 text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-[var(--border-color)] active:scale-95 shadow-lg"
            >
              Reset Current View
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_15px_40px_rgba(37,99,235,0.3)] transition-all active:scale-95 ring-4 ring-blue-600/10"
            >
              Hard System Reboot
            </button>
          </div>
          {this.state.error && (
            <div className="mt-12 p-8 bg-slate-950/80 rounded-[2rem] border border-[var(--border-color)] w-full max-w-2xl overflow-hidden text-left shadow-inner group">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diagnostic Trace Buffer</span>
                </div>
                <code className="text-xs font-mono text-red-400 block break-all whitespace-pre-wrap leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                    {this.state.error.toString()}
                </code>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;