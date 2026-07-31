import React, { useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import type { Account } from '../types';
import { t } from '../utils/i18n';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  currencySymbol: string;
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currencySymbol,
  onTransfer
}) => {
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg('Please enter a valid transfer amount.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setErrorMsg('From and To accounts cannot be the same!');
      return;
    }

    const fromAcc = accounts.find(a => a.id === fromAccountId);
    if (fromAcc && fromAcc.balance < amtNum) {
      setErrorMsg(`Insufficient balance in ${fromAcc.name} (${currencySymbol}${fromAcc.balance})!`);
      return;
    }

    onTransfer(fromAccountId, toAccountId, amtNum, notes.trim());
    setAmount('');
    setNotes('');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeftRight size={20} style={{ color: '#818cf8' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{t('transfer_money')}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('from_account')}</label>
            <select
              value={fromAccountId}
              onChange={e => setFromAccountId(e.target.value)}
              className="glass-input"
              style={{ marginTop: '4px', width: '100%', background: 'var(--bg-input)' }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({currencySymbol}{acc.balance})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('to_account')}</label>
            <select
              value={toAccountId}
              onChange={e => setToAccountId(e.target.value)}
              className="glass-input"
              style={{ marginTop: '4px', width: '100%', background: 'var(--bg-input)' }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({currencySymbol}{acc.balance})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transfer Amount ({currencySymbol})</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="1000"
              className="glass-input"
              style={{ marginTop: '4px', width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. ATM Cash Withdrawal, Wallet Load"
              className="glass-input"
              style={{ marginTop: '4px', width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="glass-button active"
            style={{ padding: '12px', borderRadius: '12px', marginTop: '10px', fontSize: '14px', fontWeight: 800, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
          >
            Confirm Transfer
          </button>
        </form>
      </div>
    </div>
  );
};
