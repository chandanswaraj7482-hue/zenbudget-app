import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gift, Copy, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ReferralViewProps {
  onBack: () => void;
  userReferralCode?: string;
  referralCount?: number;
  referredBy?: string | null;
  inviterName?: string | null;
  onClaimReferral?: (code: string) => Promise<boolean>;
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  onBack,
  userReferralCode = '',
  referralCount = 0,
  referredBy = '',
  inviterName = '',
  onClaimReferral
}) => {
  const [copied, setCopied] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [referralHistory, setReferralHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!userReferralCode) return;
    const fetchHistory = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, email, subscription_tier, trial_start_date, updated_at')
          .eq('referred_by', userReferralCode);
        if (data) setReferralHistory(data);
      } catch (e) {
        console.warn('Referral history fetch error:', e);
      }
    };
    fetchHistory();
  }, [userReferralCode]);

  const handleCopyCode = () => {
    if (!userReferralCode) return;
    navigator.clipboard.writeText(userReferralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCode.trim() || !onClaimReferral) return;

    setIsClaiming(true);
    setClaimMsg(null);
    try {
      const success = await onClaimReferral(claimCode.trim().toUpperCase());
      if (success) {
        setClaimMsg({ text: 'Referral code linked successfully!', success: true });
        setClaimCode('');
      } else {
        setClaimMsg({ text: 'Invalid or already claimed referral code.', success: false });
      }
    } catch (err: any) {
      setClaimMsg({ text: err.message || 'Failed to claim referral code.', success: false });
    } finally {
      setIsClaiming(false);
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
            Referral Rewards Program
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Earn 1 Month Free Premium for every 10 paid members invited.
          </p>
        </div>
      </div>

      {/* Main Reward Card */}
      <div className="glass-panel" style={{
        padding: '24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}>
        
        {(() => {
          const paidHistoryUsers = referralHistory.filter(r => r.subscription_tier && r.subscription_tier.startsWith('premium'));
          const paidCount = Math.max(referralCount, paidHistoryUsers.length);
          const currentLevel = Math.floor(paidCount / 10) + 1;
          const currentLevelProgress = paidCount % 10;
          const totalClaimedMonths = Math.floor(paidCount / 10);

          return (
            <>
              {/* Progress Display */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🏆 LEVEL {currentLevel} TASK
                    </span>
                    {totalClaimedMonths > 0 && (
                      <span style={{ fontSize: '10px', background: 'rgba(34,197,94,0.15)', color: '#34d399', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                        🎁 {totalClaimedMonths} Month(s) Earned!
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                    {currentLevelProgress} / 10 Paid Members
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                    {10 - currentLevelProgress} more paid members needed to unlock +1 Month Free Premium!
                  </span>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(34,197,94,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gift size={24} />
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '10px', borderRadius: '99px', background: 'var(--bg-input)', overflow: 'hidden', border: '1px solid var(--border-input)' }}>
                <div style={{ width: `${(currentLevelProgress / 10) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #14b8a6)', transition: 'width 0.3s ease' }} />
              </div>
            </>
          );
        })()}

        {/* Your Referral Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Your Shareable Referral Code
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', fontSize: '16px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px' }}>
              {userReferralCode || 'ZB-REF-CODE'}
            </div>
            <button
              onClick={handleCopyCode}
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                border: 'none',
                background: copied ? '#10b981' : '#14b8a6',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Link Friend's Code / Locked Status */}
        {(() => {
          const linkedCode = referredBy || localStorage.getItem('zb_referred_by') || '';
          const storedInviter = inviterName || localStorage.getItem('zb_inviter_name') || '';

          if (linkedCode) {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Linked Referral Code (Locked 🔒)
                  </label>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>
                    ✅ Permanently Claimed
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '140px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                    {linkedCode}
                  </div>
                  {storedInviter && (
                    <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c084fc', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🤝 Invited by {storedInviter}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <form onSubmit={handleClaim} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Got a Friend's Referral Code?
              </label>

              {claimMsg && (
                <p style={{ fontSize: '12px', fontWeight: 600, color: claimMsg.success ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
                  {claimMsg.text}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  required
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value)}
                  placeholder="ZB-XXXX-XXXX"
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isClaiming || !claimCode.trim()}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: claimCode.trim() ? 1 : 0.5
                  }}
                >
                  {isClaiming ? 'Linking...' : 'Link Code'}
                </button>
              </div>
            </form>
          );
        })()}

      </div>

      {/* Program Rules */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
          How 10-Paid-User Rewards &amp; Recurring Levels Work
        </h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> Share your unique code with friends &amp; family
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> When 10 distinct friends join and purchase any Premium plan
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Check size={16} color="var(--success)" /> You automatically unlock +1 Month Free Premium Reward!
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: '#fbbf24', fontWeight: 700 }}>
          <Check size={16} color="#fbbf24" /> 🔄 Task resets for Level 2: Invite 10 MORE paid members to earn another +1 Month Free Premium infinitely!
        </div>
      </div>

      {/* Referrals History List */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            👥 Your Referral History
          </h4>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
            {referralCount} Paid / {referralHistory.length} Total Invited
          </span>
        </div>

        {referralHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>No friends linked with your referral code yet.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.8 }}>Share code <strong>{userReferralCode}</strong> to start earning rewards!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {referralHistory.map((refUser, idx) => {
              const isPaid = refUser.subscription_tier && refUser.subscription_tier.startsWith('premium');
              return (
                <div key={refUser.id || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'var(--bg-input)',
                  border: isPaid ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-input)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {refUser.name || `User ${idx + 1}`}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {refUser.email || 'Registered User'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 8px',
                      borderRadius: '8px',
                      background: isPaid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: isPaid ? '#34d399' : 'var(--text-secondary)',
                      border: isPaid ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {isPaid ? '⭐ Paid Member (+1 Qualification)' : '⏳ Joined / Trial'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
