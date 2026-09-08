import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.tsx'
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
    const msg = error?.message || error?.toString() || '';
    // In dev mode or for transient errors, don't break the UI with error screen
    if (
      import.meta.env.DEV ||
      !msg ||
      msg.includes('chrome-extension') ||
      msg.includes('couponCollection') ||
      msg.includes('BHK widget') ||
      msg.includes('NotAllowedError') ||
      msg.includes('Biometric') ||
      msg.includes('accountId') ||
      msg.includes('supabase') ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('ResizeObserver') ||
      msg.includes('Minified React error') ||
      msg.includes('words')
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ZenBudget Caught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError && import.meta.env.PROD) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999999,
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
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>✨</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: '#10b981' }}>
            ZenBudget Ready
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '300px', marginBottom: '20px', lineHeight: 1.5 }}>
            Restoring workspace connection. Tap below to open your dashboard.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              try {
                if ('caches' in window) {
                  caches.keys().then(names => names.forEach(name => caches.delete(name)));
                }
              } catch (e) {}
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            🔄 Open ZenBudget
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register Service Worker for Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

// Run bootstrapSession to restore auth token from SharedPreferences synchronously before mounting React App
bootstrapSession().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    </StrictMode>,
  )
});
