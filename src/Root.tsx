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

  // Skip landing if running as Native Android/iOS App or PWA Standalone
  const isAppMode = Capacitor.isNativePlatform() || 
                    (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
                    currentHash === '#app' ||
                    (typeof window !== 'undefined' && (window.location.search.includes('shared_receipt=') || window.location.search.includes('pay_vpa=')));

  if (isAppMode) {
    return <App onBackToLanding={handleBackToLanding} />;
  }

  // Handle SEO-friendly paths
  if (currentPath.startsWith('/blog/')) {
    const slug = currentPath.replace('/blog/', '');
    return <BlogPostView slug={slug} onBackToLanding={handleBackToLanding} />;
  }

  if (currentPath === '/blog') {
    return <BlogView onBackToLanding={handleBackToLanding} /> ;
  }

  return <LandingPage onOpenWebApp={handleOpenWebApp} />;
}

