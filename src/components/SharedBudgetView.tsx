import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, LogOut } from 'lucide-react';

interface SharedBudgetViewProps {
  onBack: () => void;
  currentProfileId: string;
  partnerCode?: string | null;
  partnerName?: string | null;
  coupleCode?: string;
  onConnectPartner?: (code: string) => Promise<boolean>;
  onDisconnectPartner?: () => void;
}

export const SharedBudgetView: React.FC<SharedBudgetViewProps> = ({
  onBack,
  currentProfileId,
  partnerCode = null,
  partnerName = null,
  coupleCode = '',
  onConnectPartner,
  onDisconnectPartner
}) => {
  const [partnerInputCode, setPartnerInputCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const myShareCode = currentProfileId ? currentProfileId.slice(0, 8).toUpperCase() : '';

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
        setErrorMsg('Invalid code or partner profile not found.');
      } else {
        setPartnerInputCode('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect partner.');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px', animation: 'fadeIn 0.3s ease-out' }}>
      
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
            Shared Budget
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Couples • Roommates • Families sync in real-time.
          </p>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
        
        {partnerCode ? (
          /* CONNECTED STATE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'center' }}>
            <div style={{ padding: '20px', background: 'rgba(139,92,246,0.12)', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                👫
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Synced with {partnerName || 'Partner'}
              </h3>
              <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 600 }}>
                Shared Pair Code: {coupleCode || partnerCode}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Your income &amp; expenses are synced live into a shared budget view.
              </span>
            </div>

            <button
              onClick={onDisconnectPartner}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={16} /> Disconnect Shared Pair
            </button>
          </div>
        ) : (
          /* UNCONNECTED STATE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Step 1: Copy My Sync Code */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Unique Sync Code
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px', fontWeight: 800, color: '#a78bfa', letterSpacing: '2px' }}>
                  {myShareCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
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
                Enter Partner / Roommate's Code
              </label>
              
              {errorMsg && <p style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{errorMsg}</p>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  required
                  value={partnerInputCode}
                  onChange={(e) => setPartnerInputCode(e.target.value)}
                  placeholder="Paste partner code"
                  style={{
                    flex: 1,
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
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: partnerInputCode.trim() ? 1 : 0.5
                  }}
                >
                  {isLinking ? 'Linking...' : 'Connect Pair'}
                </button>
              </div>
            </form>

          </div>
        )}

      </div>

      {/* Features Info */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
          What Syncs in Shared Budget?
        </h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> Shared ledger transactions &amp; category expenses
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> Real-time partner name badges on shared entries
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> Combined category budget limit tracking
        </div>
      </div>

    </div>
  );
};
