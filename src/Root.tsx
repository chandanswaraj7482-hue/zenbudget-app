import React, { useState, useEffect } from 'react';
import App from './App';
import LandingPage from './components/LandingPage';

import { Capacitor } from '@capacitor/core';

export default function Root() {
  const [showLanding, setShowLanding] = useState(() => {
    // Skip landing if URL hash is explicitly '#app'
    if (window.location.hash === '#app') return false;
    
    // Skip landing if running as Native Android/iOS App
    if (Capacitor.isNativePlatform()) return false;
    
    // Skip landing if running as Installed PWA (Standalone mode)
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) return false;
    
    // Skip landing if there's a PWA share receipt intent or other app-specific params
    if (typeof window !== 'undefined' && (window.location.search.includes('shared_receipt=') || window.location.search.includes('pay_vpa='))) return false;

    // Otherwise, show landing page for normal web visitors
    return true;
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#app') {
        setShowLanding(false);
      } else {
        setShowLanding(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleOpenWebApp = () => {
    window.location.hash = 'app';
    setShowLanding(false);
  };

  const handleBackToLanding = () => {
    window.location.hash = '';
    setShowLanding(true);
  };

  if (showLanding) {
    return <LandingPage onOpenWebApp={handleOpenWebApp} />;
  }

  return <App onBackToLanding={handleBackToLanding} />;
}

