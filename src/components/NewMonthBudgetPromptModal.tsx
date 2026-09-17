import React from 'react';
import { Calendar, TrendingUp, Edit3, Clock, CheckCircle2, DollarSign, Sparkles } from 'lucide-react';

interface NewMonthBudgetPromptModalProps {
  isOpen: boolean;
  onUpdateSalary: () => void;
  onKeepSame: () => void;
  currencySymbol?: string;
  currentSalary?: number;
  userName?: string;
}

export const NewMonthBudgetPromptModal: React.FC<NewMonthBudgetPromptModalProps> = ({
  isOpen,
  onUpdateSalary,
  onKeepSame,
  currencySymbol = '₹',
  currentSalary = 0,
  userName = 'Friend'
}) => {
  if (!isOpen) return null;

  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={onKeepSame}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(165deg, rgba(17, 24, 39, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%)',
          borderRadius: '26px',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 40px rgba(16, 185, 129, 0.2)',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '160px',
            height: '160px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Top Month Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Calendar size={24} />
          </div>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#34d399',
                marginBottom: '2px'
              }}
            >
              <Sparkles size={12} /> New Month Alert ({monthName})
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Salary & Budget Check 💸
            </h3>
          </div>
        </div>

        {/* Description Body */}
        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55, margin: '0 0 16px 0' }}>
          Hey <strong style={{ color: '#f1f5f9' }}>{userName}</strong>! A new month has started. Did your monthly salary or budget increase or change for <strong style={{ color: '#34d399' }}>{monthName}</strong>?
        </p>

        {/* Current Salary Preview Card */}
        {currentSalary > 0 && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                {currencySymbol}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Current Recorded Salary</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>
                  {currencySymbol}{currentSalary.toLocaleString()} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>/ month</span>
                </div>
              </div>
            </div>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={onUpdateSalary}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <Edit3 size={16} />
            <span>Update Salary / Budget</span>
          </button>

          <button
            type="button"
            onClick={onKeepSame}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Clock size={15} />
            <span>Not Now (Keep Same)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
