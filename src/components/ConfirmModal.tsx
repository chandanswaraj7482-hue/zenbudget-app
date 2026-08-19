import React from 'react';
import { AlertTriangle, HelpCircle, Trash2, AlertCircle, Sparkles } from 'lucide-react';

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

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  const badgeBg = isDanger 
    ? 'rgba(239, 68, 68, 0.14)' 
    : isWarning 
    ? 'rgba(245, 158, 11, 0.14)' 
    : 'rgba(34, 197, 94, 0.14)';

  const badgeBorder = isDanger 
    ? '1px solid rgba(239, 68, 68, 0.3)' 
    : isWarning 
    ? '1px solid rgba(245, 158, 11, 0.3)' 
    : '1px solid rgba(34, 197, 94, 0.3)';

  const badgeColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';

  const confirmBtnBg = isDanger
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : isWarning
    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';

  const confirmBtnShadow = isDanger
    ? '0 8px 24px rgba(239, 68, 68, 0.4)'
    : isWarning
    ? '0 8px 24px rgba(245, 158, 11, 0.4)'
    : '0 8px 24px rgba(34, 197, 94, 0.4)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '28px 24px 24px',
          borderRadius: '24px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emblem Icon Badge */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            backgroundColor: badgeBg,
            border: badgeBorder,
            color: badgeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: `0 8px 20px ${badgeColor}25`
          }}
        >
          {isDanger ? (
            <Trash2 size={26} strokeWidth={2.4} />
          ) : isWarning ? (
            <AlertTriangle size={26} strokeWidth={2.4} />
          ) : (
            <AlertCircle size={26} strokeWidth={2.4} />
          )}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.55', margin: '0 0 24px' }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              borderRadius: '16px',
              padding: '13px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.15s ease'
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              background: confirmBtnBg,
              border: 'none',
              borderRadius: '16px',
              padding: '13px 16px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              color: '#ffffff',
              boxShadow: confirmBtnShadow,
              transition: 'all 0.15s ease'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

