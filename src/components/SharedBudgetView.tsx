import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, LogOut, Users } from 'lucide-react';

interface SharedBudgetViewProps {
  onBack: () => void;
  currentProfileId: string;
  familyMembers?: { id: string, name: string, couple_code: string }[];
  coupleCode?: string;
  onConnectPartner?: (code: string) => Promise<boolean>;
  onDisconnectPartner?: () => void;
  transactions?: any[];
  currencySymbol?: string;
  onOpenTransferModal?: () => void;
  isPremiumUser?: boolean;
  onOpenSubscriptionModal?: () => void;
}

export const SharedBudgetView: React.FC<SharedBudgetViewProps> = ({
  onBack,
  currentProfileId,
  familyMembers = [],
  coupleCode = '',
  onConnectPartner,
  onDisconnectPartner,
  transactions = [],
  currencySymbol = '₹',
  onOpenTransferModal,
  isPremiumUser = false,
  onOpenSubscriptionModal
}) => {
  const [partnerInputCode, setPartnerInputCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const myShareCode = coupleCode || (currentProfileId ? currentProfileId.slice(0, 8).toUpperCase() : '');
  const hasFamily = familyMembers.length > 0;

  // Calculate stats
  const familyTxs = (transactions || []).filter(t => t.user_id && t.user_id !== currentProfileId);
  const myTxs = (transactions || []).filter(t => !t.user_id || t.user_id === currentProfileId);

  const familyTotalSpent = familyTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const myTotalSpent = myTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const combinedTotalSpent = familyTotalSpent + myTotalSpent;

  const handleCopyCode = () => {
    if (!myShareCode) return;
    navigator.clipboard.writeText(myShareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerInputCode.trim()) return;
    if (!onConnectPartner) return;

    setIsLinking(true);
    setErrorMsg('');
    try {
      const success = await onConnectPartner(partnerInputCode.trim().toUpperCase());
      if (!success) {
        setErrorMsg('Invalid code or family profile not found/not premium.');
      } else {
        setPartnerInputCode('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to family group.');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Manrope', sans-serif", margin: 0 }}>
            Couple & Family Sync
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Partners, families &amp; roommates real-time spending &amp; transfer sync.
          </p>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
        
        {hasFamily ? (
          /* CONNECTED STATE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '20px', background: 'rgba(139,92,246,0.12)', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff' }}>
                <Users size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Synced with {familyMembers.length} Partner/Family Member(s)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
                {familyMembers.map(m => (
                  <span key={m.id} style={{ padding: '4px 8px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                    {m.name || 'Member'}
                  </span>
                ))}
              </div>
              
              {/* Share Code Section for inviting more */}
              <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', width: '100%' }}>
                <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  INVITE MORE MEMBERS WITH YOUR COUPLE/FAMILY CODE:
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                  <code style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>{myShareCode}</code>
                  <button onClick={handleCopyCode} style={{ background: 'none', border: 'none', color: copied ? 'var(--success)' : '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Real-time Couple/Family Premium Sync Active ⚡
              </span>
            </div>

            {/* Household Spending Breakdown Flex */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: '1 1 130px', padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'left', minWidth: 0 }}>
                <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Family's Spent
                </span>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currencySymbol}{familyTotalSpent.toLocaleString()}
                </p>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{familyTxs.length} entries</span>
              </div>

              <div style={{ flex: '1 1 130px', padding: '16px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'left', minWidth: 0 }}>
                <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Your Spent
                </span>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currencySymbol}{myTotalSpent.toLocaleString()}
                </p>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{myTxs.length} entries</span>
              </div>
            </div>

            {/* Combined Household Total Banner */}
            <div style={{ padding: '14px 18px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Combined Household Spent</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>{currencySymbol}{combinedTotalSpent.toLocaleString()}</span>
            </div>

            {/* Money Transfer / Send Money to Partner Button */}
            {onOpenTransferModal && (
              <button
                type="button"
                onClick={onOpenTransferModal}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)'
                }}
              >
                💸 Send / Transfer Money to Partner/Family
              </button>
            )}

            {/* Live Spending Activity Feed — Both sides */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              
              {/* Partner's entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  👥 Partner/Family's Recent Spending
                </h4>
                {familyTxs.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    No entries logged by family yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {familyTxs.slice(0, 8).map((tx: any) => (
                      <div
                        key={tx.id || Math.random()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '11px 14px',
                          borderRadius: '13px',
                          background: 'rgba(239, 68, 68, 0.06)',
                          border: '1px solid rgba(239, 68, 68, 0.15)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                            💸
                          </div>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.title || tx.category}</p>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {tx.partnerName || 'Partner/Family'} • {tx.category} • {tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'Today'}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#f87171', flexShrink: 0, marginLeft: '8px' }}>
                          -{currencySymbol}{(Number(tx.amount) || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🙋 Your Recent Spending
                </h4>
                {myTxs.filter(t => t.type === 'expense').length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    No expense entries logged yet by you.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {myTxs.filter(t => t.type === 'expense').slice(0, 8).map((tx: any) => (
                      <div
                        key={tx.id || Math.random()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '11px 14px',
                          borderRadius: '13px',
                          background: 'rgba(34, 197, 94, 0.05)',
                          border: '1px solid rgba(34, 197, 94, 0.15)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                            🏷️
                          </div>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.title || tx.category}</p>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.category} • {tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'Today'}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#4ade80', flexShrink: 0, marginLeft: '8px' }}>
                          -{currencySymbol}{(Number(tx.amount) || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onDisconnectPartner}
              style={{
                padding: '12px',
                borderRadius: '14px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '10px'
              }}
            >
              <LogOut size={16} /> Leave Couple/Family Group
            </button>
          </div>
        ) : (
          /* UNCONNECTED STATE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Dual Premium Requirement Notice */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>👑</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', lineHeight: 1.3 }}>
                  Couple & Family Sync requires an active <strong>Premium Plan for ALL members</strong>.
                </span>
              </div>
              {!isPremiumUser && onOpenSubscriptionModal && (
                <button
                  type="button"
                  onClick={onOpenSubscriptionModal}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Upgrade ⭐
                </button>
              )}
            </div>

            {/* Step 1: Copy My Sync Code */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Unique Couple / Family Sync Code
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', minWidth: 0, padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px', fontWeight: 800, color: '#a78bfa', letterSpacing: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {myShareCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    flex: '1 1 120px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: copied ? 'var(--success)' : 'var(--primary)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Copy size={16} /> {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* Step 2: Connect Partner's Code */}
            <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Join an Existing Couple / Family Group Code
              </label>
              
              {errorMsg && <p style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{errorMsg}</p>}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  required
                  value={partnerInputCode}
                  onChange={(e) => setPartnerInputCode(e.target.value)}
                  placeholder="Paste couple / family code"
                  style={{
                    flex: '1 1 200px',
                    minWidth: 0,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isLinking || !partnerInputCode.trim()}
                  style={{
                    flex: '1 1 120px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: partnerInputCode.trim() ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isLinking ? 'Linking...' : 'Join Group'}
                </button>
              </div>
            </form>

          </div>
        )}

      </div>

      {/* Features Info */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
          What Syncs in Couple/Family Budget?
        </h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> Shared ledger transactions &amp; category expenses
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> Real-time family member tags on entries
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> Combined category budget limit tracking
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> P2P Transfers between personal &amp; family wallets
        </div>
      </div>

    </div>
  );
};
