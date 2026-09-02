import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by Chesskys ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.removeItem('chess_active_account');
      localStorage.removeItem('chess_guest_profile');
      localStorage.removeItem('chess_app_settings');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#05070a] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#0B0F19]/90 border border-amber-500/20 shadow-2xl backdrop-blur-2xl flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(245,158,11,0.25)]">
              ☀️
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-black text-amber-400 tracking-wider uppercase font-serif">
                Chesskys PRO
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                The session encountered an unexpected interface pause.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full p-3 rounded-xl bg-black/40 border border-white/5 text-left overflow-x-auto max-h-24 no-scrollbar">
                <p className="text-[10px] font-mono text-slate-400 break-words">
                  {this.state.error.message || 'Unknown runtime exception'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                Reload Game
              </button>
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Reset & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
