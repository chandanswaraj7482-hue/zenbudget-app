import React, { useState } from 'react';

interface ZenBudgetLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ZenBudgetLogo: React.FC<ZenBudgetLogoProps> = ({
  size = 64,
  className = '',
  style = {}
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const borderRadius = Math.round(size * 0.31);

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
        background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.12) 100%)',
        border: '1.5px solid rgba(52, 211, 153, 0.45)',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        ...style
      }}
    >
      {/* Fallback Vector SVG Logo — always instantly visible */}
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          pointerEvents: 'none'
        }}
      >
        <defs>
          <linearGradient id="zbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="zbGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>
        {/* Modern Geometric Z / Calm Path */}
        <path
          d="M9 11.5H27L13 24.5H27"
          stroke="url(#zbGrad)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#zbGlow)"
        />
        <circle cx="27" cy="11.5" r="2.2" fill="#34d399" />
        <circle cx="9" cy="24.5" r="2.2" fill="#10b981" />
      </svg>

      {/* Official PNG Icon layered on top */}
      {!imgFailed && (
        <img
          src="/icon.png"
          alt="ZenBudget"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: `${borderRadius}px`,
            position: 'relative',
            zIndex: 1
          }}
          onError={() => setImgFailed(true)}
        />
      )}
    </div>
  );
};
