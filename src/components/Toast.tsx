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
          color: '#10b981', // Hardcoded hex for safe opacity appending
          bg: 'rgba(16, 185, 129, 0.15)',
          icon: <CheckCircle size={18} />
        };
      case 'warning':
        return {
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          icon: <AlertTriangle size={18} />
        };
      default:
        return {
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.15)',
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
      width: 'auto',
      minWidth: '300px',
      maxWidth: 'calc(100% - 40px)',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      borderRadius: '16px',
      background: 'rgba(20, 20, 33, 0.95)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${details.color}40`,
      boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 15px ${details.color}20`,
      animation: 'slideDownToast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      boxSizing: 'border-box'
    }}>
      <div style={{ color: details.color, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {details.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', display: 'block', wordBreak: 'break-word', lineHeight: '1.4' }}>
          {toast.message}
        </span>
      </div>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '4px',
          flexShrink: 0,
          outline: 'none'
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
