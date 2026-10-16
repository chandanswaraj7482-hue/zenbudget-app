import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.tsx'
import { bootstrapSession } from './supabaseClient'
import './utils/audio'
import { initZenSecurityShield } from './utils/securityGuard'

// Initialize Multi-Layer Security Shield & Firewall
initZenSecurityShield();

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

  public static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    // Never hijack the dashboard on interaction errors - keep the UI alive and responsive
    return { hasError: false, error: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ZenBudget Handled Error:', error, errorInfo);
    if (this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  public render() {
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

import { Capacitor } from '@capacitor/core';

// Run bootstrapSession to restore auth token from SharedPreferences synchronously before mounting React App
const mountApp = () => {
  const container = document.getElementById('root');
  if (container) {
    createRoot(container).render(
      <StrictMode>
        <ErrorBoundary>
          <Root />
        </ErrorBoundary>
      </StrictMode>,
    );
  }
};

if (Capacitor.isNativePlatform()) {
  bootstrapSession()
    .catch((err) => {
      console.warn('ZenBudget bootstrapSession warning:', err);
    })
    .finally(() => {
      mountApp();
    });
} else {
  // On Web / PWA, mount immediately for 0ms render
  mountApp();
}

