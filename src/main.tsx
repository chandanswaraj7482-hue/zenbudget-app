import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapSession } from './supabaseClient'

// Strip console logs in production for security
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ZenBudget Uncaught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090d16',
          color: '#ffffff',
          fontFamily: "'Manrope', sans-serif",
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px', color: '#f87171' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '340px', marginBottom: '24px', lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              window.location.href = window.location.origin + window.location.pathname + '?refresh=' + Date.now();
            }}
            style={{
              padding: '14px 28px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}
          >
            🔄 Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Run bootstrapSession to restore auth token from SharedPreferences synchronously before mounting React App
bootstrapSession().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
});
