import React, { useState, useEffect } from 'react';
import App from './App';
import LandingPage from './components/LandingPage';

export default function Root() {
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // Check if the user has previously opted to skip the landing page
    const hasSkipped = localStorage.getItem('zb_skip_landing');
    if (hasSkipped === 'true') {
      setShowLanding(false);
    }
  }, []);

  const handleOpenWebApp = () => {
    localStorage.setItem('zb_skip_landing', 'true');
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onOpenWebApp={handleOpenWebApp} />;
  }

  return <App />;
}
