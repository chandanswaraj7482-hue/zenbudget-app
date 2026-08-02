import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Account } from '../types';
import { t } from '../utils/i18n';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  currencySymbol: string;
}

const ACCOUNT_COLORS = [
  '#0284c7', // Sky Blue (Cash in screenshot 1)
  '#ea580c', // Orange (PhonePe BOI in screenshot 1)
  '#7c3aed', // Purple (SBI UPI in screenshot 1)
  '#22c55e', // Emerald Green
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f59e0b'  // Amber
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
  currencySymbol
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('bank');
  const [customTypeName, setCustomTypeName] = useState('');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balNum = parseFloat(balance) || 0;
    if (!name.trim()) return;

    onAddAccount({
      name: name.trim(),
      type,
      customTypeName: type === 'custom' ? (customTypeName.trim() || 'Custom') : undefined,
      balance: balNum,
      color
    });

    setName('');
    setCustomTypeName('');
    setBalance('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{t('add_account')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Account Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., SBI - UPI, PhonePe (BOI), Cash"
              className="glass-input"
              style={{ marginTop: '4px', width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('account_type')}</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="glass-input"
              style={{ marginTop: '4px', width: '100%', background: 'var(--bg-input)' }}
            >
              <option value="bank">🏦 Bank Account</option>
              <option value="upi">📱 PhonePe / GPay / Paytm / UPI</option>
              <option value="cash">💵 Cash</option>
              <option value="credit">💳 Credit Card</option>
              <option value="wallet">👛 Wallet / Digital</option>
              <option value="custom">✨ Custom Account Type...</option>
            </select>
          </div>

          {type === 'custom' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Custom Type Name</label>
              <input
                type="text"
                required
                value={customTypeName}
                onChange={e => setCustomTypeName(e.target.value)}
                placeholder="e.g. Crypto, Fixed Deposit, Stocks, Gold"
                className="glass-input"
                style={{ marginTop: '4px', width: '100%' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Initial Balance ({currencySymbol})</label>
            <input
              type="number"
              required
              step="any"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              placeholder="1000"
              className="glass-input"
              style={{ marginTop: '4px', width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Theme Color</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {ACCOUNT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid #ffffff' : 'none',
                    cursor: 'pointer',
                    boxShadow: color === c ? `0 0 12px ${c}` : 'none'
                  }}
                />
              ))}

              {/* Custom Color Wheel Picker */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    opacity: 0,
                    position: 'absolute',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                />
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: !ACCOUNT_COLORS.includes(color) ? color : 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                    border: !ACCOUNT_COLORS.includes(color) ? '3px solid #ffffff' : '1px solid var(--border-input)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    boxShadow: !ACCOUNT_COLORS.includes(color) ? `0 0 12px ${color}` : 'none'
                  }}
                  title="Pick Custom Color"
                >
                  🎨
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="glass-button active"
            style={{ padding: '12px', borderRadius: '12px', marginTop: '10px', fontSize: '14px', fontWeight: 800 }}
          >
            Save Account
          </button>
        </form>
      </div>
    </div>
  );
};
