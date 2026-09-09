import React, { useState, useEffect } from 'react';
import App from './App';
import LandingPage from './components/LandingPage';

export default function Root() {
  const [showLanding, setShowLanding] = useState(() => {
    // Only skip landing if URL hash is explicitly '#app'
    return window.location.hash !== '#app';
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

