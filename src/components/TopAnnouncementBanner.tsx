import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Bell, Tag, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { playNotificationSound } from '../utils/audio';

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt?: string;
  linkUrl?: string;
  buttonText?: string;
}

interface TopAnnouncementBannerProps {
  announcement: AnnouncementItem | null;
  onClose: () => void;
}

export const TopAnnouncementBanner: React.FC<TopAnnouncementBannerProps> = ({
  announcement,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Play sound on appear
  useEffect(() => {
    if (!announcement) {
      setIsClosing(false);
      return;
    }

    try {
      playNotificationSound('info');
    } catch (_) {}

    // Handle Escape key to dismiss
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [announcement?.id]);

  if (!announcement) return null;

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 240);
  };

  const isLight = typeof document !== 'undefined' && document.body.classList.contains('light-theme');

  const getTypeStyle = () => {
    switch (announcement.type) {
      case 'coupon':
        return {
          icon: <Tag size={22} />,
          badgeColor: '#f59e0b',
          badgeBg: 'rgba(245, 158, 11, 0.16)',
          badgeBorder: 'rgba(245, 158, 11, 0.35)',
          glow: 'rgba(245, 158, 11, 0.28)',
          border: 'rgba(245, 158, 11, 0.45)',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          tagText: 'Special Offer'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={22} />,
          badgeColor: '#ef4444',
          badgeBg: 'rgba(239, 68, 68, 0.16)',
          badgeBorder: 'rgba(239, 68, 68, 0.35)',
          glow: 'rgba(239, 68, 68, 0.28)',
          border: 'rgba(239, 68, 68, 0.45)',
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          tagText: 'Important Notice'
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={22} />,
          badgeColor: '#10b981',
          badgeBg: 'rgba(16, 185, 129, 0.16)',
          badgeBorder: 'rgba(16, 185, 129, 0.35)',
          glow: 'rgba(16, 185, 129, 0.28)',
          border: 'rgba(16, 185, 129, 0.45)',
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          tagText: 'Zen Update'
        };
      default:
        return {
          icon: <Bell size={22} />,
          badgeColor: '#6366f1',
          badgeBg: 'rgba(99, 102, 241, 0.16)',
          badgeBorder: 'rgba(99, 102, 241, 0.35)',
          glow: 'rgba(99, 102, 241, 0.28)',
          border: 'rgba(99, 102, 241, 0.45)',
          gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          tagText: 'Admin Announcement'
        };
    }
  };

  const styleConfig = getTypeStyle();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="center-announcement-title"
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100005,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: isClosing ? 'backdropFadeOut 0.22s ease-out forwards' : 'backdropFadeIn 0.25s ease-out forwards'
      }}
    >
      {/* Central Announcement Card Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(100%, 460px)',
          background: isLight 
            ? '#ffffff' 
            : 'linear-gradient(165deg, #131b2e 0%, #0b1120 100%)',
          border: `1px solid ${styleConfig.border}`,
          borderRadius: '26px',
          padding: '24px 22px 20px',
          boxShadow: isLight
            ? `0 24px 50px -10px rgba(0, 0, 0, 0.2), 0 0 35px ${styleConfig.glow}`
            : `0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 45px ${styleConfig.glow}`,
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          animation: isClosing 
            ? 'zoomOutModal 0.22s cubic-bezier(0.4, 0, 1, 1) forwards' 
            : 'zoomInModal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Ambient Top Glow Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: styleConfig.gradient
        }} />

        {/* Top Header Row: Icon + Badge + Close 'X' */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Glowing Icon Orb */}
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              background: styleConfig.badgeBg,
              border: `1px solid ${styleConfig.badgeBorder}`,
              color: styleConfig.badgeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 16px ${styleConfig.glow}`
            }}>
              {styleConfig.icon}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: styleConfig.badgeColor,
                  background: styleConfig.badgeBg,
                  border: `1px solid ${styleConfig.badgeBorder}`,
                  padding: '2px 8px',
                  borderRadius: '100px'
                }}>
                  {styleConfig.tagText}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: isLight ? '#64748b' : '#94a3b8',
                  fontWeight: 600
                }}>
                  • ZenBudget Official
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: isLight ? '#94a3b8' : '#64748b',
                fontWeight: 500
              }}>
                {announcement.createdAt 
                  ? new Date(announcement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                  : 'Just now'}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close Announcement"
            style={{
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.14)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isLight ? '#0f172a' : '#ffffff',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Announcement Title */}
        <h3
          id="center-announcement-title"
          style={{
            margin: '4px 0 0',
            fontSize: '19px',
            fontWeight: 800,
            color: isLight ? '#0f172a' : '#ffffff',
            lineHeight: 1.35,
            wordBreak: 'break-word',
            letterSpacing: '-0.02em'
          }}
        >
          {announcement.title}
        </h3>

        {/* Announcement Message Body */}
        <div style={{
          background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
          border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '14px 16px',
          maxHeight: '260px',
          overflowY: 'auto'
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: isLight ? '#334155' : '#e2e8f0',
            lineHeight: 1.65,
            wordBreak: 'break-word',
            whiteSpace: 'pre-line',
            fontWeight: 500
          }}>
            {announcement.message}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '6px'
        }}>
          {/* Custom CTA link if provided */}
          {announcement.linkUrl && (
            <button
              type="button"
              onClick={() => {
                if (announcement.linkUrl) {
                  window.open(announcement.linkUrl, '_blank');
                }
                handleDismiss();
              }}
              style={{
                flex: 1,
                background: styleConfig.gradient,
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '13px 18px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: `0 8px 20px ${styleConfig.glow}`,
                transition: 'transform 0.15s ease'
              }}
            >
              <span>{announcement.buttonText || 'Open Link'}</span>
              <ExternalLink size={15} />
            </button>
          )}

          {/* Got it / Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              flex: announcement.linkUrl ? undefined : 1,
              minWidth: announcement.linkUrl ? '100px' : undefined,
              background: announcement.linkUrl
                ? (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)')
                : styleConfig.gradient,
              color: announcement.linkUrl
                ? (isLight ? '#334155' : '#e2e8f0')
                : '#ffffff',
              border: announcement.linkUrl
                ? (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.12)')
                : 'none',
              borderRadius: '14px',
              padding: '13px 18px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: !announcement.linkUrl ? `0 8px 20px ${styleConfig.glow}` : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {!announcement.linkUrl && <Sparkles size={16} />}
            <span>Got it, Thanks!</span>
          </button>
        </div>
      </div>

      {/* Center Modal Animations */}
      <style>{`
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes backdropFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes zoomInModal {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes zoomOutModal {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
        }
      `}</style>
    </div>
  );
};
