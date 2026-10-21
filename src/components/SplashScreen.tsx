import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDurationMs = 1350
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onFinish?.();
      }, 400); // fade out duration
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#070b12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFadingOut ? 'none' : 'auto',
        overflow: 'hidden'
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(6, 182, 212, 0.12) 40%, rgba(0, 0, 0, 0) 70%)',
          animation: 'pulseGlow 2.4s ease-in-out infinite',
          pointerEvents: 'none'
        }}
      />

      {/* Animated Center Logo */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'scaleInLogo 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Glowing pulse ring */}
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            width: '108px',
            height: '108px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.45) 0%, rgba(6, 182, 212, 0.3) 100%)',
            filter: 'blur(16px)',
            zIndex: 0,
            animation: 'auraPulse 1.8s ease-in-out infinite alternate'
          }}
        />

        {/* Logo Image */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '88px',
            height: '88px',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, #0f1f1a 0%, #061510 100%)',
            border: '2px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px'
          }}
        >
          <img
            src="/icon.png"
            alt="ZenBudget"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '16px'
            }}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Brand Typography */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            animation: 'fadeInUpText 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both'
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '26px',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
          >
            <span style={{ color: '#10b981' }}>Zen</span>
            <span>Budget</span>
          </h1>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: '12px',
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            Mindful Wealth • Zero Clutter
          </p>
        </div>

        {/* Sleek Loading Bar */}
        <div
          style={{
            width: '120px',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '99px',
            marginTop: '26px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #06b6d4)',
              borderRadius: '99px',
              animation: 'loadProgress 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scaleInLogo {
          0% {
            opacity: 0;
            transform: scale(0.72) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeInUpText {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes auraPulse {
          0% {
            opacity: 0.5;
            transform: scale(0.95);
          }
          100% {
            opacity: 0.9;
            transform: scale(1.08);
          }
        }
        @keyframes loadProgress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
