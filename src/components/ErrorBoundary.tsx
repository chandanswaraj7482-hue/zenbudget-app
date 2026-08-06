import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ZenBudget Uncaught ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearData = () => {
    if (window.confirm("Are you sure you want to clear local cache & session settings to fix login? Your Supabase data remains safe.")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0b0f19',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.98) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '32px 24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px auto', border: '1px solid rgba(239, 68, 68, 0.4)'
            }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f87171', marginBottom: '8px' }}>
              Application Render Error
            </h2>

            <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', lineHeight: 1.5 }}>
              Something went wrong while displaying your dashboard.
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'left',
              fontSize: '11px',
              color: '#fca5a5',
              fontFamily: 'monospace',
              marginBottom: '20px',
              maxHeight: '120px',
              overflowY: 'auto',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {this.state.error?.toString() || 'Unknown React rendering error'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                🔄 Reload App
              </button>

              <button
                type="button"
                onClick={this.handleClearData}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer'
                }}
              >
                🧹 Reset Session Cache &amp; Re-login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
