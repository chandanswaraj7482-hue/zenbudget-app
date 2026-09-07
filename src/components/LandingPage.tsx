import React from 'react';

interface LandingPageProps {
  onOpenWebApp: () => void;
}

export default function LandingPage({ onOpenWebApp }: LandingPageProps) {
  return (
    <div className="landing-container">
      {/* Ambient background orbs */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      <div className="ambient-orb orb-3"></div>

      <div className="landing-content">
        <div className="glass-hero-card">
          <div className="hero-icon">
            <img src="/favicon.png" alt="ZenBudget Logo" className="hero-logo" />
          </div>
          
          <h1 className="hero-title">ZenBudget</h1>
          <h2 className="hero-subtitle">Master Your Money</h2>
          
          <p className="hero-description">
            Track expenses, block impulse buys, and save faster with your personal AI financial coach. The ultimate tracker.
          </p>

          <div className="hero-actions">
            <a 
              href="/zenbudget.apk" 
              download 
              className="btn-download"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download App
            </a>
            
            <button 
              onClick={onOpenWebApp}
              className="btn-webapp"
            >
              Open Web App
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <span>AI Coach</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <span>Secure</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💸</span>
              <span>Smart Limits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
