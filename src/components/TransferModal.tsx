import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Send, Wallet } from 'lucide-react';
import type { Account } from '../types';

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
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const myAccountsList = accounts.filter(a => !(a as any).isFamilyAccount);
  const familyAccountsList = accounts.filter(a => (a as any).isFamilyAccount);

  const recipientMap = new Map<string, { name: string; accounts: Account[] }>();
  familyAccountsList.forEach(acc => {
    const ownerName = (acc as any).ownerName || 'Partner';
    const ownerId = (acc as any).ownerId || ownerName;
    if (!recipientMap.has(ownerId)) {
      recipientMap.set(ownerId, { name: ownerName, accounts: [] });
    }
    recipientMap.get(ownerId)!.accounts.push(acc);
  });
  const recipients = Array.from(recipientMap.entries()).map(([id, data]) => ({ id, ...data }));

  const selfAsRecipient = myAccountsList.length >= 2
    ? [{ id: '__self__', name: 'Self Transfer', accounts: myAccountsList }]
    : [];

  const allRecipients = [...recipients, ...selfAsRecipient];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedRecipientId('');
      setFromAccountId(myAccountsList[0]?.id || '');
      setToAccountId('');
      setAmount('');
      setNotes('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedRecipient = allRecipients.find(r => r.id === selectedRecipientId);
  const toAccounts = selectedRecipientId === '__self__' ? myAccountsList : (selectedRecipient?.accounts || []);

  const handleSelectRecipient = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
    const recip = allRecipients.find(r => r.id === recipientId);
    if (recip && recip.accounts.length > 0) {
      setToAccountId(recip.accounts[0].id);
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const amtNum = Math.round(parseFloat(amount));
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
      setErrorMsg(`Insufficient balance in ${fromAcc.name} (${currencySymbol}${Math.round(fromAcc.balance).toLocaleString()})!`);
      return;
    }
    onTransfer(fromAccountId, toAccountId, amtNum, notes.trim());
    setAmount('');
    setNotes('');
    onClose();
  };

  const avatarGradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #14b8a6, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #f97316)',
    'linear-gradient(135deg, #22c55e, #10b981)',
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 10000
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '390px',
        maxHeight: 'calc(100vh - 32px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '24px',
        padding: 0
      }}>

        {/* ─── Header ─── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 22px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {step === 2 && (
              <button
                type="button"
                onClick={() => { setStep(1); setErrorMsg(''); }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center'
                }}
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(34,197,94,0.35)'
            }}>
              <Send size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {step === 1 ? '💸 Send Money' : `To: ${selectedRecipient?.name || ''}`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                {step === 1 ? 'Step 1 — Select recipient' : 'Step 2 — Enter amount'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '6px 10px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Step bar ─── */}
        <div style={{ display: 'flex', gap: '6px', padding: '14px 22px 0' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: '4px', borderRadius: '4px',
              background: step >= s ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s ease'
            }} />
          ))}
        </div>

        {/* ─── Content ─── */}
        <div style={{ overflowY: 'auto', padding: '18px 22px 22px', flex: 1 }}>

          {/* ══ STEP 1: Recipient picker ══ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 600 }}>
                Choose who to send money to:
              </p>

              {allRecipients.length === 0 ? (
                <div style={{
                  padding: '28px 18px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.07)'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔗</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    No partners synced yet
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Connect a partner in Family Sync to transfer money between accounts.
                  </div>
                </div>
              ) : (
                allRecipients.map((recipient, idx) => {
                  const totalBal = recipient.accounts.reduce((s, a) => s + (a.balance || 0), 0);
                  const isSelf = recipient.id === '__self__';
                  return (
                    <button
                      key={recipient.id}
                      type="button"
                      onClick={() => handleSelectRecipient(recipient.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        padding: '16px 18px',
                        borderRadius: '18px',
                        border: '1.5px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = 'rgba(34,197,94,0.08)';
                        el.style.borderColor = 'rgba(34,197,94,0.4)';
                        el.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = 'rgba(255,255,255,0.04)';
                        el.style.borderColor = 'rgba(255,255,255,0.1)';
                        el.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Avatar + info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: '52px', height: '52px', borderRadius: '14px',
                          background: isSelf ? 'rgba(56,189,248,0.15)' : avatarGradients[idx % avatarGradients.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: isSelf ? '22px' : '24px',
                          flexShrink: 0,
                          fontWeight: 900, color: '#fff',
                          border: isSelf ? '1.5px solid rgba(56,189,248,0.3)' : 'none',
                          boxShadow: isSelf ? 'none' : '0 6px 20px rgba(0,0,0,0.3)'
                        }}>
                          {isSelf ? '🔄' : recipient.name.charAt(0).toUpperCase()}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>
                            {isSelf ? 'My Own Accounts' : recipient.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                            {recipient.accounts.length} wallet{recipient.accounts.length !== 1 ? 's' : ''} · {currencySymbol}{Math.round(totalBal).toLocaleString()} total
                          </div>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {recipient.accounts.slice(0, 3).map(a => (
                              <span key={a.id} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                                fontSize: '10px', fontWeight: 700,
                                padding: '2px 8px', borderRadius: '6px',
                                background: isSelf ? 'rgba(56,189,248,0.1)' : 'rgba(34,197,94,0.1)',
                                color: isSelf ? '#38bdf8' : '#4ade80',
                                border: `1px solid ${isSelf ? 'rgba(56,189,248,0.2)' : 'rgba(34,197,94,0.2)'}`
                              }}>
                                <Wallet size={9} />
                                {a.name}
                              </span>
                            ))}
                            {recipient.accounts.length > 3 && (
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', padding: '2px 4px', fontWeight: 600 }}>
                                +{recipient.accounts.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'rgba(34,197,94,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <ChevronRight size={16} color="#4ade80" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* ══ STEP 2: Amount + details ══ */}
          {step === 2 && selectedRecipient && (
            <>
              {/* Recipient banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '16px',
                background: 'rgba(34,197,94,0.08)',
                border: '1.5px solid rgba(34,197,94,0.25)',
                marginBottom: '18px'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: selectedRecipient.id === '__self__' ? 'rgba(56,189,248,0.15)' : avatarGradients[0],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', flexShrink: 0, fontWeight: 900, color: '#fff'
                }}>
                  {selectedRecipient.id === '__self__' ? '🔄' : selectedRecipient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Sending to</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#4ade80' }}>
                    {selectedRecipient.id === '__self__' ? 'My Own Accounts' : selectedRecipient.name}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div style={{
                  background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                  padding: '10px 14px', borderRadius: '10px',
                  fontSize: '12px', marginBottom: '14px',
                  border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* From account */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📤 From (Your Account)
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={e => setFromAccountId(e.target.value)}
                    className="glass-input"
                    style={{ marginTop: '6px', width: '100%', background: 'var(--bg-input)', fontWeight: 700 }}
                  >
                    {myAccountsList.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        👤 {acc.name} — {currencySymbol}{Math.round(acc.balance).toLocaleString()} balance
                      </option>
                    ))}
                  </select>
                </div>

                {/* To wallet (show only if multiple) */}
                {toAccounts.length > 1 && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📥 To Wallet
                    </label>
                    <select
                      value={toAccountId}
                      onChange={e => setToAccountId(e.target.value)}
                      className="glass-input"
                      style={{ marginTop: '6px', width: '100%', background: 'var(--bg-input)', fontWeight: 700 }}
                    >
                      {toAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          💳 {acc.name} — {currencySymbol}{Math.round(acc.balance).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    💰 Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="glass-input"
                    autoFocus
                    style={{ marginTop: '6px', width: '100%', fontWeight: 800, fontSize: '20px' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[100, 500, 1000, 2000, 5000].map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setAmount(String(q))}
                        style={{
                          padding: '5px 11px', borderRadius: '8px',
                          border: `1px solid ${amount === String(q) ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.12)'}`,
                          background: amount === String(q) ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)',
                          color: amount === String(q) ? '#4ade80' : 'var(--text-secondary)',
                          fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {currencySymbol}{q.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📝 Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Groceries split, EMI share, Rent..."
                    className="glass-input"
                    style={{ marginTop: '6px', width: '100%' }}
                  />
                </div>

                {/* Live preview */}
                {amount && parseFloat(amount) > 0 && fromAccountId && toAccountId && (
                  <div style={{
                    padding: '14px 16px', borderRadius: '14px',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1.5px solid rgba(99,102,241,0.25)'
                  }}>
                    <div style={{ fontSize: '10px', color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                      Transfer Preview
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>From</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {myAccountsList.find(a => a.id === fromAccountId)?.name || 'Wallet'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                          -{currencySymbol}{Math.round(parseFloat(amount) || 0).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontSize: '20px', color: '#22c55e', fontWeight: 900 }}>→</div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>To</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#4ade80' }}>
                          {selectedRecipient.id === '__self__'
                            ? accounts.find(a => a.id === toAccountId)?.name
                            : selectedRecipient.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: 700, marginTop: '2px' }}>
                          +{currencySymbol}{Math.round(parseFloat(amount) || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    padding: '14px', borderRadius: '14px', border: 'none',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#fff', fontSize: '15px', fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
                    marginTop: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Send size={17} />
                  Confirm Transfer
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
