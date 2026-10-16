import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, ChevronDown, ChevronUp, Bell, Tag, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<any>(null);
  const isHoveredRef = useRef(false);

  // Play sound and set auto-dismiss timer on appear
  useEffect(() => {
    if (!announcement) {
      setExpanded(false);
      setIsClosing(false);
      return;
    }

    try {
      playNotificationSound('info');
    } catch (_) {}

    const startTimer = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!isHoveredRef.current && !expanded) {
          handleDismiss();
        }
      }, 8500); // 8.5 seconds auto-dismiss
    };

    startTimer();

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [announcement?.id, expanded]);

  if (!announcement) return null;

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };

  const isLight = typeof document !== 'undefined' && document.body.classList.contains('light-theme');

  const getTypeStyle = () => {
    switch (announcement.type) {
      case 'coupon':
        return {
          icon: <Tag size={16} />,
          badgeColor: '#eab308',
          badgeBg: 'rgba(234, 179, 8, 0.15)',
          badgeBorder: 'rgba(234, 179, 8, 0.35)',
          glow: 'rgba(234, 179, 8, 0.25)',
          border: 'rgba(234, 179, 8, 0.45)',
          tagText: 'Special Offer'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={16} />,
          badgeColor: '#ef4444',
          badgeBg: 'rgba(239, 68, 68, 0.15)',
          badgeBorder: 'rgba(239, 68, 68, 0.35)',
          glow: 'rgba(239, 68, 68, 0.25)',
          border: 'rgba(239, 68, 68, 0.45)',
          tagText: 'Notice'
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={16} />,
          badgeColor: '#10b981',
          badgeBg: 'rgba(16, 185, 129, 0.15)',
          badgeBorder: 'rgba(16, 185, 129, 0.35)',
          glow: 'rgba(16, 185, 129, 0.25)',
          border: 'rgba(16, 185, 129, 0.45)',
          tagText: 'Update'
        };
      default:
        return {
          icon: <Bell size={16} />,
          badgeColor: '#6366f1',
          badgeBg: 'rgba(99, 102, 241, 0.15)',
          badgeBorder: 'rgba(99, 102, 241, 0.35)',
          glow: 'rgba(99, 102, 241, 0.25)',
          border: 'rgba(99, 102, 241, 0.4)',
          tagText: 'Announcement'
        };
    }
  };

  const styleConfig = getTypeStyle();
  const isLongMessage = announcement.message && announcement.message.length > 120;

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(calc(100% - 24px), 460px)',
        zIndex: 100005,
        pointerEvents: 'auto',
        background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${styleConfig.border}`,
        borderRadius: '20px',
        padding: '14px 16px',
        boxShadow: isLight
          ? `0 14px 34px -6px rgba(0, 0, 0, 0.14), 0 0 20px ${styleConfig.glow}`
          : `0 16px 40px -8px rgba(0, 0, 0, 0.65), 0 0 24px ${styleConfig.glow}`,
        animation: isClosing
          ? 'slideUpDismiss 0.28s cubic-bezier(0.4, 0, 1, 1) forwards'
          : 'slideDownNotification 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {/* Top Meta Row: Icon + Badge + ZenBudget label + Close button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {/* Circular Type Icon */}
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: styleConfig.badgeBg,
            border: `1px solid ${styleConfig.badgeBorder}`,
            color: styleConfig.badgeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {styleConfig.icon}
          </div>

          {/* App & Tag Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: isLight ? '#0f172a' : '#f8fafc',
              whiteSpace: 'nowrap'
            }}>
              ZenBudget
            </span>
            <span style={{ color: isLight ? '#94a3b8' : '#64748b', fontSize: '10px' }}>•</span>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: styleConfig.badgeColor,
              whiteSpace: 'nowrap'
            }}>
              {styleConfig.tagText}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          style={{
            background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isLight ? '#64748b' : '#94a3b8',
            padding: 0,
            flexShrink: 0,
            outline: 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ paddingLeft: '34px' }}>
        {/* Title */}
        <h4 style={{
          margin: '0 0 4px 0',
          fontSize: '13.5px',
          fontWeight: 800,
          color: isLight ? '#0f172a' : '#f8fafc',
          lineHeight: '1.35',
          wordBreak: 'break-word'
        }}>
          {announcement.title}
        </h4>

        {/* Message body */}
        <p style={{
          margin: 0,
          fontSize: '12.5px',
          color: isLight ? '#475569' : '#cbd5e1',
          lineHeight: '1.5',
          wordBreak: 'break-word',
          whiteSpace: 'pre-line',
          maxHeight: expanded ? 'none' : '58px',
          overflow: 'hidden',
          display: expanded ? 'block' : '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical'
        }}>
          {announcement.message}
        </p>

        {/* Expand toggle for long messages */}
        {isLongMessage && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              color: styleConfig.badgeColor,
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '4px 0 0 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            {expanded ? (
              <>Show Less <ChevronUp size={12} /></>
            ) : (
              <>Read More <ChevronDown size={12} /></>
            )}
          </button>
        )}

        {/* Bottom Actions Row: Link CTA / Timestamp */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Timestamp */}
          <span style={{
            fontSize: '10.5px',
            color: isLight ? '#94a3b8' : '#64748b',
            fontWeight: 500
          }}>
            {announcement.createdAt
              ? new Date(announcement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* CTA Link Button if URL provided */}
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
                  background: styleConfig.badgeBg,
                  border: `1px solid ${styleConfig.badgeBorder}`,
                  borderRadius: '12px',
                  color: styleConfig.badgeColor,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '5px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{announcement.buttonText || 'Open Link'}</span>
                <ExternalLink size={11} />
              </button>
            )}

            {/* Quick Dismiss Pill */}
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '12px',
                color: isLight ? '#475569' : '#cbd5e1',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '5px 10px',
                transition: 'all 0.15s ease'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideDownNotification {
          0% {
            opacity: 0;
            transform: translate(-50%, -36px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        @keyframes slideUpDismiss {
          0% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -36px) scale(0.96);
          }
        }
      `}</style>
    </div>
  );
};
