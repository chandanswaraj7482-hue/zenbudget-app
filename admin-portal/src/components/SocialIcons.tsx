import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const YouTubeIcon: React.FC<IconProps> = ({ size = 20, color = '#FF0000', style, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    className={className}
  >
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
      fill={color}
    />
    <polygon points="9.6,15.6 15.8,12 9.6,8.4" fill="#ffffff" />
  </svg>
);

export const TikTokIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff', style, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
  </svg>
);

export const InstagramIcon: React.FC<IconProps> = ({ size = 20, style, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    className={className}
  >
    <defs>
      <linearGradient id="zen-ig-gradient-admin" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#zen-ig-gradient-admin)" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="4.2" stroke="url(#zen-ig-gradient-admin)" strokeWidth="2.2" />
    <circle cx="17.6" cy="6.4" r="1.3" fill="url(#zen-ig-gradient-admin)" />
  </svg>
);

export const FacebookIcon: React.FC<IconProps> = ({ size = 20, color = '#1877F2', style, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    className={className}
  >
    <circle cx="12" cy="12" r="11" fill={color} />
    <path
      d="M15.5 12h-2.3v8h-3.3v-8H8.3V9.2h1.6V7.3c0-2.2 1.3-3.4 3.3-3.4.96 0 1.98.17 1.98.17v2.2h-1.12c-1.1 0-1.44.68-1.44 1.38V9.2h2.55l-.47 2.8z"
      fill="#ffffff"
    />
  </svg>
);

export const LinkedInIcon: React.FC<IconProps> = ({ size = 20, color = '#0a66c2', style, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    className={className}
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

export const XIcon: React.FC<IconProps> = ({ size = 18, color = '#ffffff', style, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const renderSocialIcon = (platform: string, size = 20, overrideColor?: string): React.ReactNode => {
  const p = (platform || '').toLowerCase().trim();
  if (p.includes('youtube')) {
    return <YouTubeIcon size={size} color={overrideColor || '#FF0000'} />;
  }
  if (p.includes('tiktok')) {
    return <TikTokIcon size={size} color={overrideColor || '#00f2fe'} />;
  }
  if (p.includes('insta')) {
    return <InstagramIcon size={size} />;
  }
  if (p.includes('facebook')) {
    return <FacebookIcon size={size} color={overrideColor || '#1877F2'} />;
  }
  if (p.includes('linkedin')) {
    return <LinkedInIcon size={size} color={overrideColor || '#0A66C2'} />;
  }
  if (p === 'x' || p.includes('twitter')) {
    return <XIcon size={size} color={overrideColor || '#ffffff'} />;
  }
  return <span style={{ fontSize: `${size}px` }}>🌐</span>;
};
