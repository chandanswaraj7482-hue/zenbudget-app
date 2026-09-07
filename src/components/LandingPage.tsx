import React from 'react';

interface LandingPageProps {
  onOpenWebApp: () => void;
}

export default function LandingPage({ onOpenWebApp }: LandingPageProps) {
  return (
    <div className="landing-container" style={{ overflowY: 'auto', display: 'block', height: '100vh', scrollBehavior: 'smooth' }}>
      
      {/* Background Orbs */}
      <div className="ambient-orb orb-1" style={{ position: 'fixed' }}></div>
      <div className="ambient-orb orb-2" style={{ position: 'fixed' }}></div>
      <div className="ambient-orb orb-3" style={{ position: 'fixed' }}></div>

      <div className="landing-content" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', paddingTop: '80px' }}>
        
        {/* HERO SECTION */}
        <div className="glass-hero-card" style={{ marginBottom: '60px' }}>
          <div className="hero-icon">
            <img src="/favicon.png" alt="ZenBudget Logo" className="hero-logo" style={{ width: '80px', height: '80px' }} />
          </div>
          
          <h1 className="hero-title" style={{ fontSize: '48px', marginBottom: '12px' }}>ZenBudget</h1>
          <h2 className="hero-subtitle" style={{ fontSize: '22px' }}>Master Your Money</h2>
          
          <p className="hero-description" style={{ fontSize: '16px', maxWidth: '400px', margin: '0 auto 32px auto' }}>
            Track expenses, block impulse buys, and save faster with your personal AI financial coach. The ultimate Apple-inspired tracker.
          </p>

          <div className="hero-actions" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a href="/zenbudget.apk" download className="btn-download" style={{ maxWidth: '200px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download App
            </a>
            <button onClick={onOpenWebApp} className="btn-webapp" style={{ maxWidth: '200px' }}>
              Open Web App
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* FEATURES SECTION */}
        <section style={{ marginBottom: '80px', textAlign: 'center', zIndex: 10, position: 'relative' }}>
          <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '32px' }}>Why Choose ZenBudget?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            
            <div className="glass-hero-card" style={{ padding: '24px', animation: 'none', transform: 'none' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
              <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>AI Financial Coach</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Ask Zen questions about your spending, get tailored advice, and build smart savings habits instantly.</p>
            </div>

            <div className="glass-hero-card" style={{ padding: '24px', animation: 'none', transform: 'none' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛡️</div>
              <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>Impulse Blocker</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Stop emotional spending with our 48-hour psychological cooling-off period for non-essential purchases.</p>
            </div>

            <div className="glass-hero-card" style={{ padding: '24px', animation: 'none', transform: 'none' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
              <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>Smart Budgets</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Set intelligent limits for different categories. We'll warn you if an upcoming transaction might break your limit.</p>
            </div>

          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section style={{ marginBottom: '80px', zIndex: 10, position: 'relative' }}>
          <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '32px', textAlign: 'center' }}>How It Works</h2>
          <div className="glass-hero-card" style={{ padding: '32px', textAlign: 'left', animation: 'none', transform: 'none' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#10b981', color: '#000', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '16px', margin: '0 0 4px 0' }}>Add Your Accounts</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Input your current cash or bank balances securely without giving actual bank credentials.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#3b82f6', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '16px', margin: '0 0 4px 0' }}>Log Expenses & Income</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Quickly log transactions on-the-go with smart tags and categories to keep your money organized.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ background: '#8b5cf6', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '16px', margin: '0 0 4px 0' }}>Grow Your Wealth</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Use the AI coach to analyze your data and follow your custom Savings Goals to build your future.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={{ marginBottom: '80px', textAlign: 'center', zIndex: 10, position: 'relative' }}>
          <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '32px' }}>Loved by Thousands</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="glass-hero-card" style={{ padding: '20px', animation: 'none', transform: 'none' }}>
              <p style={{ color: '#fff', fontSize: '14px', fontStyle: 'italic', marginBottom: '12px' }}>"This app literally saved my marriage. My partner and I can finally track shared expenses without fighting."</p>
              <h5 style={{ color: '#10b981', margin: 0 }}>— Rahul S.</h5>
            </div>
            <div className="glass-hero-card" style={{ padding: '20px', animation: 'none', transform: 'none' }}>
              <p style={{ color: '#fff', fontSize: '14px', fontStyle: 'italic', marginBottom: '12px' }}>"The AI Coach told me I was spending 40% on Swiggy! I cut back and saved ₹5000 this month."</p>
              <h5 style={{ color: '#3b82f6', margin: 0 }}>— Priya M.</h5>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ textAlign: 'center', zIndex: 10, position: 'relative', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '16px' }}>Ready to Take Control?</h2>
          <button onClick={onOpenWebApp} className="btn-download" style={{ maxWidth: '240px', margin: '0 auto 32px auto' }}>
            Start Your Journey Now
          </button>
          <p style={{ color: '#64748b', fontSize: '12px' }}>© {new Date().getFullYear()} ZenBudget Financial. All Rights Reserved.</p>
        </footer>

      </div>
    </div>
  );
}
