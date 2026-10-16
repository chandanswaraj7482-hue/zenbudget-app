import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3800); // Auto close after 3.8s
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isLight = typeof document !== 'undefined' && document.body.classList.contains('light-theme');

  const getDetails = () => {
    switch (toast.type) {
      case 'success':
        return {
          color: '#10b981',
          bgLight: 'rgba(255, 255, 255, 0.96)',
          bgDark: 'rgba(15, 23, 42, 0.94)',
          borderLight: 'rgba(16, 185, 129, 0.35)',
          borderDark: 'rgba(16, 185, 129, 0.3)',
          icon: <CheckCircle size={18} />
        };
      case 'warning':
        return {
          color: '#ef4444',
          bgLight: 'rgba(255, 255, 255, 0.96)',
          bgDark: 'rgba(15, 23, 42, 0.94)',
          borderLight: 'rgba(239, 68, 68, 0.35)',
          borderDark: 'rgba(239, 68, 68, 0.3)',
          icon: <AlertTriangle size={18} />
        };
      default:
        return {
          color: '#3b82f6',
          bgLight: 'rgba(255, 255, 255, 0.96)',
          bgDark: 'rgba(15, 23, 42, 0.94)',
          borderLight: 'rgba(59, 130, 246, 0.35)',
          borderDark: 'rgba(59, 130, 246, 0.3)',
          icon: <Info size={18} />
        };
    }
  };

  const details = getDetails();

  return (
    <div 
      className="zen-toast-capsule"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'max-content',
        minWidth: '280px',
        maxWidth: 'calc(100% - 32px)',
        height: 'auto !important' as any,
        zIndex: 100010,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '11px 16px',
        borderRadius: '20px',
        background: isLight ? details.bgLight : details.bgDark,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isLight ? details.borderLight : details.borderDark}`,
        boxShadow: isLight
          ? `0 12px 30px -6px rgba(0, 0, 0, 0.12), 0 0 16px ${details.color}25`
          : `0 12px 32px 0 rgba(0, 0, 0, 0.5), 0 0 16px ${details.color}30`,
        animation: 'slideDownToast 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        color: details.color,
        background: `${details.color}18`,
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {details.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span style={{
          fontSize: '13.5px',
          fontWeight: 700,
          color: isLight ? '#0f172a' : '#f8fafc',
          display: 'block',
          wordBreak: 'break-word',
          lineHeight: '1.4'
        }}>
          {toast.message}
        </span>
      </div>
      <button 
        onClick={onClose}
        style={{
          background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
          border: 'none',
          color: isLight ? '#64748b' : '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          padding: 0,
          flexShrink: 0,
          outline: 'none',
          transition: 'all 0.15s ease'
        }}
        aria-label="Close"
      >
        <X size={13} />
      </button>

      {/* Slide down keyframe styles */}
      <style>{`
        .zen-toast-capsule {
          aspect-ratio: auto !important;
          height: auto !important;
          max-height: 90px !important;
        }
        @keyframes slideDownToast {
          from {
            opacity: 0;
            transform: translate(-50%, -24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
