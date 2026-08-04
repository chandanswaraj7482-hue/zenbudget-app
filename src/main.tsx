import { StrictMode, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { bootstrapSession } from './supabaseClient';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '30px 20px',
          color: '#fff',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0b0f19',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>🛡️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Display Sync Issue</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '320px', marginBottom: '16px', lineHeight: 1.5 }}>
            A session or cached data error occurred. Tap below to reload or reset session.
          </p>

          {this.state.error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              maxWidth: '340px',
              width: '100%',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#f87171',
              textAlign: 'left',
              marginBottom: '20px',
              maxHeight: '100px',
              overflowY: 'auto',
              wordBreak: 'break-all'
            }}>
              ⚠️ {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '280px' }}>
            <button
              onClick={() => {
                localStorage.removeItem('zb_local_session_profile');
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)'
              }}
            >
              Reload ZenBudget 🔄
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear Storage & Reset Session 🧹
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Start bootstrap in background without blocking initial React render
bootstrapSession().catch(e => console.warn('Bootstrap session background warning:', e));

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
