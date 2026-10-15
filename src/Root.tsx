import React, { useState, useEffect } from 'react';
import App from './App';
import LandingPage from './components/LandingPage';
import { BlogView } from './components/BlogView';
import { BlogPostView } from './components/BlogPostView';

import { Capacitor } from '@capacitor/core';

export default function Root() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const handleOpenWebApp = () => {
    window.location.hash = 'app';
    window.history.replaceState(null, '', '/#app');
    setCurrentHash('#app');
    setCurrentPath('/');
  };

  const handleBackToLanding = () => {
    window.history.pushState(null, '', '/');
    setCurrentHash('');
    setCurrentPath('/');
  };

  // Check if running inside Native APK, AAB, WebAPK, or Installed PWA
  const isInstalledApp = (
    Capacitor.isNativePlatform() ||
    (typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.location.search.includes('utm_source=web_app_manifest') ||
      window.location.search.includes('source=pwa') ||
      window.location.search.includes('mode=standalone') ||
      localStorage.getItem('zb_is_installed_app') === 'true'
    ))
  );

  // In APK, AAB, or WebAPK: ALWAYS open App directly, NEVER show Landing Page
  if (isInstalledApp) {
    return <App />;
  }

  // Skip landing if running as Native Android/iOS App or completing OAuth login
  const isOAuthCallback = typeof window !== 'undefined' && (
    window.location.href.includes('access_token=') ||
    window.location.href.includes('refresh_token=') ||
    window.location.href.includes('code=') ||
    window.location.href.includes('error_description=') ||
    window.location.search.includes('code=') ||
    window.location.hash.includes('access_token=') ||
    localStorage.getItem('zb_oauth_in_progress') === 'true'
  );

  // Check if running on mobile device browser
  const isMobileDevice = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );

  const isExplicitLanding = currentPath === '/landing' || currentHash === '#landing';

  // Check if user has an existing account/profile or session on this browser
  const hasExistingSession = typeof window !== 'undefined' && (
    Boolean(localStorage.getItem('zb_profile_id')) ||
    Boolean(localStorage.getItem('zb_user_email')) ||
    Boolean(localStorage.getItem('zb_user_pin')) ||
    Boolean(localStorage.getItem('zb_local_session_profile'))
  );

  // Open real app if on mobile, has existing session, or accessing #app / /app
  const isAppMode = (
    currentHash === '#app' ||
    currentPath === '/app' ||
    (isMobileDevice && !isExplicitLanding) ||
    isOAuthCallback ||
    (hasExistingSession && !isExplicitLanding) ||
    (typeof window !== 'undefined' && (window.location.search.includes('shared_receipt=') || window.location.search.includes('pay_vpa=')))
  );

  if (isAppMode) {
    return <App onBackToLanding={handleBackToLanding} />;
  }

  // Handle SEO-friendly paths (normalize trailing slashes)
  const normalizedPath = currentPath.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/blog') {
    return <BlogView onBackToLanding={handleBackToLanding} onOpenWebApp={handleOpenWebApp} />;
  }

  if (normalizedPath.startsWith('/blog/')) {
    const slug = normalizedPath.replace('/blog/', '');
    return <BlogPostView slug={slug} onBackToLanding={handleBackToLanding} onOpenWebApp={handleOpenWebApp} />;
  }

  return <LandingPage onOpenWebApp={handleOpenWebApp} />;
}

