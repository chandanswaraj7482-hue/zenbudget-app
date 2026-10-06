import React from 'react';
import { DISTRIBUTION_CONFIG } from '../config/buildConfig';
import { ShieldCheck, Star } from 'lucide-react';

interface GooglePlayBadgeProps {
  variant?: 'badge' | 'button' | 'outline' | 'compact';
  style?: React.CSSProperties;
  className?: string;
  showRating?: boolean;
  showProtect?: boolean;
}

export const GooglePlayIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 20, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    {/* Google Play Cyan/Blue triangle */}
    <path d="M3.609 1.814L13.793 12 3.609 22.186c-.394-.374-.609-.912-.609-1.503V3.317c0-.591.215-1.129.609-1.503z" fill="#00e5ff" />
    {/* Yellow/Amber right triangle */}
    <path d="M17.182 8.611l-3.389 3.389 3.389 3.389 4.168-2.383c.968-.553.968-1.463 0-2.016l-4.168-2.379z" fill="#ffc400" />
    {/* Green top diagonal */}
    <path d="M13.793 12L3.609 1.814C4.195 1.258 5.111 1.2 5.922 1.663l11.26 6.948-3.389 3.389z" fill="#00e676" />
    {/* Red bottom diagonal */}
    <path d="M17.182 15.389L5.922 22.337c-.811.463-1.727.405-2.313-.151L13.793 12l3.389 3.389z" fill="#ff3d00" />
  </svg>
);

export const GooglePlayBadge: React.FC<GooglePlayBadgeProps> = ({
  variant = 'badge',
  style,
  className = '',
  showRating = false,
  showProtect = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Open Play Store listing
    window.open(DISTRIBUTION_CONFIG.PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'compact') {
    return (
      <a
        href={DISTRIBUTION_CONFIG.PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '100px',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          ...style
        }}
        className={`hover-lift ${className}`}
      >
        <GooglePlayIcon size={16} />
        <span>Google Play</span>
      </a>
    );
  }

  if (variant === 'outline') {
    return (
      <a
        href={DISTRIBUTION_CONFIG.PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 22px',
          borderRadius: '100px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          ...style
        }}
        className={`hover-lift ${className}`}
      >
        <GooglePlayIcon size={22} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
          <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>GET IT ON</span>
          <span style={{ fontSize: '15px', fontWeight: 800 }}>Google Play</span>
        </div>
      </a>
    );
  }

  // Default 'badge' style - ultra-premium official Google Play badge style
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
      <a
        href={DISTRIBUTION_CONFIG.PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          borderRadius: '100px',
          background: '#0a0a0a',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: '#ffffff',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          ...style
        }}
        className={`hover-lift ${className}`}
      >
        <GooglePlayIcon size={24} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
            GET IT ON
          </span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Google Play
          </span>
        </div>
      </a>

      {(showRating || showProtect) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#64748b', paddingLeft: '6px' }}>
          {showRating && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#f59e0b' }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              4.9 (Play Store)
            </span>
          )}
          {showProtect && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#10b981', fontWeight: 600 }}>
              <ShieldCheck size={13} color="#10b981" />
              Play Protect Verified
            </span>
          )}
        </div>
      )}
    </div>
  );
};
