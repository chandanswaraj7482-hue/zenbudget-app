import React from 'react';
import App from './App';
import LandingPage from './components/LandingPage';
import { BlogView } from './components/BlogView';
import { BlogPostView } from './components/BlogPostView';
import AdminApp from './AdminApp';
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

  // Dedicated Domain Identification:
  // 1. https://admin-portal-zenbudget.vercel.app/ -> Dedicated Admin Portal
  const isAdminDomain = typeof window !== 'undefined' && (
    hostname.includes('admin-portal') ||
    currentPath === '/admin' ||
    currentPath === '/admin.html'
  );

  // 2. https://zenbudget-tracker-app.vercel.app/ -> Dedicated Landing Page
  const isDedicatedLandingDomain = typeof window !== 'undefined' && (
    hostname.includes('zenbudget-tracker-app')
  );

  // 3. https://zenbudget-tracker.vercel.app/ -> Dedicated Web App (Web APK)
  const isDedicatedWebAppDomain = typeof window !== 'undefined' && (
    hostname.includes('zenbudget-tracker.vercel.app') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    isNative ||
    isInstalledPwa
  );

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

  // Determine initial mode based on domain:
  const getInitialMode = (): 'landing' | 'app' | 'admin' => {
    if (isAdminDomain) return 'admin';
    if (isDedicatedWebAppDomain) return 'app'; // zenbudget-tracker.vercel.app opens Web App directly!
    if (isDedicatedLandingDomain) return hasAppHashOrParam ? 'app' : 'landing'; // zenbudget-tracker-app.vercel.app opens Landing Page!
    return (isNative || isInstalledPwa || hasAppHashOrParam) ? 'app' : 'landing';
  };

  const [activeMode, setActiveMode] = React.useState<'landing' | 'app' | 'admin'>(getInitialMode);

  // Synchronize browser hash changes (Back/Forward navigation, explicit #app links)
  React.useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      if (isAdminDomain) {
        setActiveMode('admin');
      } else if (hash.startsWith('#app')) {
        setActiveMode('app');
      } else if (hash.startsWith('#landing')) {
        setActiveMode('landing');
      } else if (hash === '' || hash === '#') {
        if (isDedicatedWebAppDomain) {
          setActiveMode('app');
        } else if (isDedicatedLandingDomain) {
          setActiveMode('landing');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isNative, isInstalledPwa, isAdminDomain, isDedicatedWebAppDomain, isDedicatedLandingDomain]);

  const handleOpenWebApp = () => {
    if (typeof window !== 'undefined') {
      // If user is on landing domain, navigate to the main Web App domain!
      if (hostname.includes('zenbudget-tracker-app')) {
        window.location.href = 'https://zenbudget-tracker.vercel.app/';
        return;
      }
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
      if (hostname.includes('zenbudget-tracker.vercel.app')) {
        window.location.href = 'https://zenbudget-tracker-app.vercel.app/';
        return;
      }
      if (window.location.pathname.startsWith('/blog')) {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      } else {
        window.location.hash = 'landing';
      }
    }
    setActiveMode('landing');
  };

  // 1. Dedicated Admin Portal
  if (activeMode === 'admin' || isAdminDomain) {
    return <AdminApp />;
  }

  // 2. Dedicated Blog routing
  const normalizedPath = currentPath.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/blog') {
    return <BlogView onBackToLanding={handleBackToLanding} onOpenWebApp={handleOpenWebApp} />;
  }
  if (normalizedPath.startsWith('/blog/')) {
    const slug = normalizedPath.replace('/blog/', '');
    return <BlogPostView slug={slug} onBackToLanding={handleBackToLanding} onOpenWebApp={handleOpenWebApp} />;
  }

  // 3. If mode is landing, show LandingPage
  if (activeMode === 'landing') {
    return <LandingPage onOpenWebApp={handleOpenWebApp} />;
  }

  // 4. Otherwise, render full App directly (Web APK / Web App)
  return <App onBackToLanding={handleBackToLanding} />;
}
