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
    }, 4000); // Auto close after 4s
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const getDetails = () => {
    switch (toast.type) {
      case 'success':
        return {
          color: 'var(--success)',
          bg: 'var(--success-glow)',
          icon: <CheckCircle size={18} />
        };
      case 'warning':
        return {
          color: 'var(--danger)',
          bg: 'var(--danger-glow)',
          icon: <AlertTriangle size={18} />
        };
      default:
        return {
          color: 'var(--primary)',
          bg: 'var(--primary-glow)',
          icon: <Info size={18} />
        };
    }
  };

  const details = getDetails();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'max-content',
      minWidth: '280px',
      maxWidth: 'calc(100% - 40px)',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      borderRadius: '16px',
      background: 'rgba(20, 20, 33, 0.9)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${details.color}50`,
      boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 15px ${details.color}20`,
      animation: 'slideDownToast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
    }}>
      <div style={{ color: details.color, display: 'flex', alignItems: 'center' }}>
        {details.icon}
      </div>
      <span style={{ fontSize: '14px', fontWeight: 600, flex: 1, color: '#fff', textAlign: 'left' }}>
        {toast.message}
      </span>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '2px'
        }}
      >
        <X size={14} />
      </button>

      {/* Slide down keyframe styles */}
      <style>{`
        @keyframes slideDownToast {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
};
