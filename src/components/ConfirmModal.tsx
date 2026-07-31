import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const getThemeColor = () => {
    if (type === 'danger') return 'var(--danger)';
    if (type === 'warning') return 'var(--warning)';
    return 'var(--primary)';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onCancel}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '360px',
          padding: '24px',
          borderRadius: '24px',
          textAlign: 'center',
          border: `1px solid ${getThemeColor()}80`, // 50% opacity
          boxShadow: `0 0 30px ${getThemeColor()}20`,
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emblem Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: `${getThemeColor()}15`,
          color: getThemeColor(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: `0 0 15px ${getThemeColor()}15`
        }}>
          {type === 'danger' || type === 'warning' ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'var(--transition-smooth)'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: getThemeColor(),
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#fff',
              boxShadow: `0 4px 15px ${getThemeColor()}40`,
              transition: 'var(--transition-smooth)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
