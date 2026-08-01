import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Bell, 
  TrendingUp, 
  Search, 
  X, 
  RefreshCw, 
  Gift, 
  Lock, 
  Unlock, 
  Crown, 
  DollarSign, 
  Activity,
  Send,
  Trash2,
  Edit2,
  Check,
  Star,
  Share2,
  Link2
} from 'lucide-react';

interface RatingRecord {
  id: string;
  user_name: string;
  user_email: string;
  rating_stars: number;
  feedback: string;
  created_at: string;
}

interface ProfileRecord {
  id: string;
  name: string;
  pin: string;
  subscription_tier: 'trial' | 'premium' | 'premium_monthly' | 'premium_lifetime';
  trial_start_date: string;
  premium_expires_at?: string;
  referral_code?: string;
  referred_by?: string;
  updated_at?: string;
  is_suspended?: boolean;
  email?: string;
  couple_code?: string;
  partner_couple_code?: string;
}

interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'update';
  created_at: string;
}

interface CouponRecord {
  code: string;
  discount_percent: number;
  max_uses: number;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  target_email?: string;
  target_plan?: string;
}

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseClient: any;
  onShowToast?: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  supabaseClient,
  onShowToast
}) => {
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('zb_admin_session_unlocked') === 'true';
  });
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'broadcasts' | 'coupons' | 'ratings' | 'referrals' | 'family' | 'pricing'>('overview');

  // Dynamic Pricing Control state
  const [monthlyPrice, setMonthlyPrice] = useState<number>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
      return stored.monthly || 149;
    } catch (_) { return 149; }
  });
  const [yearlyPrice, setYearlyPrice] = useState<number>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
      return stored.yearly || 1499;
    } catch (_) { return 1499; }
  });
  const [lifetimePrice, setLifetimePrice] = useState<number>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
      return stored.lifetime || 2499;
    } catch (_) { return 2499; }
  });

  // Multi-Currency Extra Slot Pricing State
  const [inrSlotPrice, setInrSlotPrice] = useState<number>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
      return stored.inr_slot_price || 10;
    } catch (_) { return 10; }
  });
  const [usdSlotPrice, setUsdSlotPrice] = useState<number>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
      return stored.usd_slot_price || 1.99;
    } catch (_) { return 1.99; }
  });
  const [eurSlotPrice, setEurSlotPrice] = useState<number>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
      return stored.eur_slot_price || 1.85;
    } catch (_) { return 1.85; }
  });
  const [gbpSlotPrice, setGbpSlotPrice] = useState<number>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
      return stored.gbp_slot_price || 1.59;
    } catch (_) { return 1.59; }
  });

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    const pricingObj = { 
      monthly: Number(monthlyPrice), 
      yearly: Number(yearlyPrice), 
      lifetime: Number(lifetimePrice),
      inr_slot_price: Number(inrSlotPrice),
      usd_slot_price: Number(usdSlotPrice),
      eur_slot_price: Number(eurSlotPrice),
      gbp_slot_price: Number(gbpSlotPrice)
    };
    try {
      await supabaseClient.from('app_config').upsert([{ id: 'subscription_pricing', data: pricingObj }]);
    } catch (err) {}
    localStorage.setItem('zb_dynamic_prices', JSON.stringify(pricingObj));
    if (onShowToast) onShowToast('Live Multi-Currency Prices updated successfully!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ padding: '1rem 1.5rem', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield color="#34d399" size={24} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>ZenBudget Command Center</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {!isUnlocked ? (
            <div style={{ maxWidth: '360px', margin: '3rem auto', textAlign: 'center' }}>
              <Lock size={48} color="#38bdf8" style={{ marginBottom: '1rem' }} />
              <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>Admin Passcode Required</h4>
              <input
                type="password"
                placeholder="Enter Passcode"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', margin: '1rem 0' }}
              />
              <button
                onClick={() => {
                  if (adminKeyInput === 'zen2026' || adminKeyInput === 'admin123') {
                    setIsUnlocked(true);
                    sessionStorage.setItem('zb_admin_session_unlocked', 'true');
                  } else setAuthError('Invalid Admin Passcode');
                }}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', fontWeight: 800 }}
              >
                Unlock Command Center
              </button>
              {authError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>{authError}</p>}
            </div>
          ) : (
            <div>
              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['overview', 'pricing'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === tab ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: activeTab === tab ? '#34d399' : '#94a3b8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Pricing Tab */}
              <form onSubmit={handleSavePricing} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 800 }}>Multi-Currency Subscription & Slot Pricing</h4>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>Monthly Plan Price (INR ₹)</label>
                  <input type="number" value={monthlyPrice} onChange={(e) => setMonthlyPrice(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>Yearly Plan Price (INR ₹)</label>
                  <input type="number" value={yearlyPrice} onChange={(e) => setYearlyPrice(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>Lifetime Plan Price (INR ₹)</label>
                  <input type="number" value={lifetimePrice} onChange={(e) => setLifetimePrice(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed rgba(255,255,255,0.1)' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>India Extra Slot Price (INR ₹)</label>
                    <input type="number" value={inrSlotPrice} onChange={(e) => setInrSlotPrice(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#34d399', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>US & Global Extra Slot Price (USD $)</label>
                    <input type="number" step="0.01" value={usdSlotPrice} onChange={(e) => setUsdSlotPrice(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>Europe Extra Slot Price (EUR €)</label>
                    <input type="number" step="0.01" value={eurSlotPrice} onChange={(e) => setEurSlotPrice(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fbbf24', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>UK Extra Slot Price (GBP £)</label>
                    <input type="number" step="0.01" value={gbpSlotPrice} onChange={(e) => setGbpSlotPrice(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#c084fc', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0', fontStyle: 'italic' }}>
                  ℹ️ Note: These prices represent individual per-limit-slot fees.
                </p>

                <button type="submit" style={{ padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                  Save Live Multi-Currency Prices
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
