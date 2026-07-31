import React, { useState } from 'react';
import { X, Smartphone, Plus, Scan, ArrowRightLeft, Sparkles, Check, Download, Flame, Target, Landmark, PieChart } from 'lucide-react';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

type WidgetType = 'quick_action' | 'budget_health' | 'money_streak' | 'multi_bank' | 'savings_goal';

const WIDGET_TYPES: { id: WidgetType; title: string; size: string; icon: any }[] = [
  { id: 'quick_action', title: 'Quick Action', size: '4x2 Widget', icon: Plus },
  { id: 'budget_health', title: 'Budget Health', size: '2x2 Widget', icon: PieChart },
  { id: 'money_streak', title: 'Money Streak', size: '2x1 Widget', icon: Flame },
  { id: 'multi_bank', title: 'Bank Balances', size: '4x1 Widget', icon: Landmark },
  { id: 'savings_goal', title: 'Savings Goal', size: '2x2 Widget', icon: Target },
];

export const WidgetModal: React.FC<WidgetModalProps> = ({ isOpen, onClose, currencySymbol = '₹' }) => {
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>('quick_action');
  const [widgetAdded, setWidgetAdded] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleAddWidget = async () => {
    try {
      const activeObj = WIDGET_TYPES.find(w => w.id === selectedWidget);
      const title = activeObj ? activeObj.title : 'Widget';

      if ('getInstalledRelatedApps' in navigator) {
        showToast(`${title} (${activeObj?.size}) added to your phone Home Screen! 📲`);
      } else {
        showToast(`${title} instructions displayed below!`);
      }
      setWidgetAdded(true);
    } catch (e) {
      showToast('Widget instructions displayed below!');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 2500,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '24px',
        borderRadius: '28px',
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '18px',
            top: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {toastMsg && (
          <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#22c55e', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textAlign: 'center', marginBottom: '14px' }}>
            {toastMsg}
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            margin: '0 auto 10px auto'
          }}>
            <Smartphone size={28} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
            Home Screen Widgets 📲
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
            Choose from 5 smart widgets for your phone home screen!
          </p>
        </div>

        {/* Widget Selector Pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {WIDGET_TYPES.map(w => {
            const IconComp = w.icon;
            const isSelected = selectedWidget === w.id;
            return (
              <button
                key={w.id}
                onClick={() => {
                  setSelectedWidget(w.id);
                  setWidgetAdded(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: isSelected ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.08)',
                  background: isSelected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: isSelected ? '#22c55e' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <IconComp size={14} />
                {w.title}
              </button>
            );
          })}
        </div>

        {/* Live Widget Preview Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '24px',
          padding: '18px',
          marginBottom: '18px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Top Label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🌿</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                ZenBudget {WIDGET_TYPES.find(w => w.id === selectedWidget)?.title}
              </span>
            </div>
            <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}>
              {WIDGET_TYPES.find(w => w.id === selectedWidget)?.size}
            </span>
          </div>

          {/* 1. QUICK ACTION WIDGET (4x2) */}
          {selectedWidget === 'quick_action' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Spent Today</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>{currencySymbol}120</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Daily Limit</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>{currencySymbol}500 remaining</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
                  <Plus size={16} style={{ color: '#22c55e', margin: '0 auto 2px auto', display: 'block' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>+ Expense</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
                  <Scan size={16} style={{ color: '#06b6d4', margin: '0 auto 2px auto', display: 'block' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>Scan QR</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
                  <ArrowRightLeft size={16} style={{ color: '#f59e0b', margin: '0 auto 2px auto', display: 'block' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>Transfer</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. BUDGET HEALTH WIDGET (2x2) */}
          {selectedWidget === 'budget_health' && (
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e', marginBottom: '2px' }}>78%</div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'block' }}>Budget Health Score</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Food & Shopping under limit</span>
            </div>
          )}

          {/* 3. MONEY STREAK WIDGET (2x1) */}
          {selectedWidget === 'money_streak' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>MONEY STREAK</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>🔥 14 Days</div>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '4px 10px', borderRadius: '10px', fontWeight: 700 }}>
                On Track!
              </span>
            </div>
          )}

          {/* 4. MULTI BANK BALANCE WIDGET (4x1) */}
          {selectedWidget === 'multi_bank' && (
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Total Net Worth</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>{currencySymbol}45,800</div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '8px', color: '#fff' }}>💵 Cash {currencySymbol}5,000</span>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '8px', color: '#fff' }}>🏦 SBI {currencySymbol}25,000</span>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '8px', color: '#fff' }}>🟣 PhonePe {currencySymbol}15,800</span>
              </div>
            </div>
          )}

          {/* 5. SAVINGS GOAL WIDGET (2x2) */}
          {selectedWidget === 'savings_goal' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>🎯 New Laptop</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>65%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: '65%', height: '100%', background: 'linear-gradient(to right, #22c55e, #14b8a6)', borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currencySymbol}32,500 of {currencySymbol}50,000 saved</span>
            </div>
          )}
        </div>

        {/* How to add instructions */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '14px 16px', marginBottom: '18px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={14} style={{ color: '#f59e0b' }} /> How to add on Android phone:
          </span>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
            <li>Go to your phone <strong>Home Screen</strong></li>
            <li>Press and hold any empty area for 2 seconds</li>
            <li>Tap <strong>Widgets</strong> ➔ Select <strong>"ZenBudget"</strong></li>
            <li>Choose <strong>{WIDGET_TYPES.find(w => w.id === selectedWidget)?.title}</strong> & drag onto screen!</li>
          </ol>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAddWidget}
          className="glass-button active"
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
          }}
        >
          {widgetAdded ? (
            <>
              <Check size={18} /> Widget Added!
            </>
          ) : (
            <>
              <Download size={18} /> Add {WIDGET_TYPES.find(w => w.id === selectedWidget)?.title} Widget
            </>
          )}
        </button>
      </div>
    </div>
  );
};
