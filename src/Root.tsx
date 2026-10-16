import React from 'react';
import App from './App';
import LandingPage from './components/LandingPage';
import { BlogView } from './components/BlogView';
import { BlogPostView } from './components/BlogPostView';
import { Capacitor } from '@capacitor/core';

export default function Root() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isNative = Capacitor.isNativePlatform();
  const isInstalledPwa = (
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.location.search.includes('source=pwa')
    )
  );

  const [currentPath, setCurrentPath] = React.useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  // Listen to popstate for proper in-app SPA history navigation
  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isLandingDomain = (
    hostname.includes('zenbudget-tracker-app') ||
    currentPath.startsWith('/landing') ||
    (typeof window !== 'undefined' && window.location.hash.startsWith('#landing'))
  );

  // If native app or installed PWA, always default to the full Web App ('app')
  const initialMode = (isNative || isInstalledPwa)
    ? 'app'
    : (isLandingDomain ? 'landing' : 'app');

  const [activeMode, setActiveMode] = React.useState<'landing' | 'app'>(initialMode);

  const handleOpenWebApp = () => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/blog')) {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
    }
    setActiveMode('app');
  };

  const handleBackToLanding = () => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/blog')) {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      }
    }
    setActiveMode('landing');
  };

  // Dedicated Blog routing
  const normalizedPath = currentPath.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/blog') {
    return <BlogView onBackToLanding={handleBackToLanding} onOpenWebApp={handleOpenWebApp} />;
  }
  if (normalizedPath.startsWith('/blog/')) {
    const slug = normalizedPath.replace('/blog/', '');
    return <BlogPostView slug={slug} onBackToLanding={handleBackToLanding} onOpenWebApp={handleOpenWebApp} />;
  }

  // If mode is landing, show LandingPage
  if (activeMode === 'landing') {
    return <LandingPage onOpenWebApp={handleOpenWebApp} />;
  }

  // Otherwise, render full App directly
  return <App onBackToLanding={handleBackToLanding} />;
}
