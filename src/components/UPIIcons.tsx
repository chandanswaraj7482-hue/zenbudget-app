import React from 'react';

export const PhonePeLogo: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ size = 26, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ borderRadius: '22%', flexShrink: 0, ...style }}>
    <rect width="100" height="100" rx="22" fill="#5F259F" />
    <path
      d="M34 22H45V44H58C65.5 44 71 49.5 71 57C71 64.5 65.5 70 58 70H45V82H34V22ZM45 59H58C59.1 59 60 58.1 60 57C60 55.9 59.1 55 58 55H45V59Z"
      fill="white"
    />
    <path
      d="M52 44H62L74 78H62L52 44Z"
      fill="white"
    />
    <path
      d="M40 30H64C66.2 30 68 31.8 68 34V35C68 37.2 66.2 39 64 39H40V30Z"
      fill="#A78BFA"
    />
    <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
  </svg>
);

export const GooglePayLogo: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ size = 26, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ borderRadius: '22%', flexShrink: 0, ...style }}>
    <rect width="100" height="100" rx="22" fill="#FFFFFF" />
    {/* GPay G-Logo */}
    <path
      d="M68.4 46.2C68.4 44.8 68.3 43.5 68.1 42.2H50V50.2H60.4C59.9 52.7 58.4 54.8 56.1 56.3V61.4H62.9C66.9 57.7 68.4 52.4 68.4 46.2Z"
      fill="#4285F4"
    />
    <path
      d="M50 69C55.1 69 59.4 67.3 62.9 61.4L56.1 56.3C54.2 57.6 51.8 58.4 50 58.4C44.8 58.4 40.5 55 38.9 50.1H32V55.5C35.5 62.4 42.2 69 50 69Z"
      fill="#34A853"
    />
    <path
      d="M38.9 50.1C38.5 48.7 38.2 47.1 38.2 45.5C38.2 43.9 38.5 42.3 38.9 40.9V35.5H32C30.6 38.3 29.8 41.8 29.8 45.5C29.8 49.2 30.6 52.7 32 55.5L38.9 50.1Z"
      fill="#FBBC04"
    />
    <path
      d="M50 32.6C52.8 32.6 55.3 33.6 57.3 35.4L63.1 29.6C59.4 26.2 55.1 24 50 24C42.2 24 35.5 30.6 32 37.5L38.9 42.9C40.5 38 44.8 32.6 50 32.6Z"
      fill="#EA4335"
    />
  </svg>
);

export const PaytmLogo: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ size = 26, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ borderRadius: '22%', flexShrink: 0, ...style }}>
    <rect width="100" height="100" rx="22" fill="#FFFFFF" />
    <path
      d="M18 34H28C33.5 34 37 37.5 37 42.5C37 47.5 33.5 51 28 51H23.5V68H18V34ZM23.5 46H28C30.5 46 32 44.5 32 42.5C32 40.5 30.5 39 28 39H23.5V46Z"
      fill="#002E6E"
    />
    <path
      d="M44 68V48H39V43H44V38C44 34.5 47 32 51 32H55V37H52C51.2 37 50.5 37.7 50.5 38.5V43H55V48H50.5V68H44Z"
      fill="#00B9F5"
    />
    <path
      d="M58 43H64L69.5 59L75 43H81L73 68H66L58 43Z"
      fill="#00B9F5"
    />
  </svg>
);
