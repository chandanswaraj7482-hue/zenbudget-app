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

  // Auto-normalize encoded %23app in URL to clean /#app
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('%23app')) {
      window.history.replaceState(null, '', '/#app');
      setCurrentPath('/');
    }
  }, []);

  const hasAppHashOrParam = typeof window !== 'undefined' && (
    window.location.hash.startsWith('#app') ||
    window.location.hash.includes('%23app') ||
    window.location.pathname.includes('%23app') ||
    window.location.search.includes('mode=app') ||
    window.location.search.includes('source=app') ||
    currentPath === '/app' ||
    currentPath.startsWith('/app/') ||
    currentPath.includes('%23app')
  );

  // If native app or installed PWA, or explicitly requested via #app/query, open 'app'.
  // For all other web visits (including search engine crawlers like Googlebot on https://zenbudget-tracker.vercel.app/),
  // default to the high-ranking, rich SEO LandingPage!
  const initialMode: 'landing' | 'app' = (isNative || isInstalledPwa || hasAppHashOrParam)
    ? 'app'
    : 'landing';

  const [activeMode, setActiveMode] = React.useState<'landing' | 'app'>(initialMode);

  // Synchronize browser hash changes (Back/Forward navigation, explicit #app links)
  React.useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      if (hash.startsWith('#app')) {
        setActiveMode('app');
      } else if (hash.startsWith('#landing') || hash === '' || hash === '#') {
        if (!isNative && !isInstalledPwa && !window.location.pathname.startsWith('/app')) {
          setActiveMode('landing');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isNative, isInstalledPwa]);

  const handleOpenWebApp = () => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/blog')) {
        window.history.pushState({}, '', '/#app');
        setCurrentPath('/');
      } else {
        window.location.hash = 'app';
      }
    }
    setActiveMode('app');
  };

  const handleBackToLanding = () => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/blog')) {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      } else {
        if (window.location.hash.startsWith('#app')) {
          window.history.pushState(null, '', window.location.pathname);
        }
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
