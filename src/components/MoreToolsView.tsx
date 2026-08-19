import React, { useState, useEffect } from 'react';
import { 
  Hourglass, 
  TrendingUp, 
  Users, 
  Sparkles, 
  TreePine, 
  Gift, 
  Settings, 
  Download, 
  RefreshCw, 
  LogOut,
  ChevronRight,
  Landmark,
  HandCoins,
  Share2
} from 'lucide-react';
import { t } from '../utils/i18n';
import { supabase } from '../supabaseClient';

interface MoreToolsViewProps {
  onNavigateToImpulseBlocker: () => void;
  onNavigateToSimulator: () => void;
  onNavigateToSharedBudget: () => void;
  onNavigateToReferral: () => void;
  onOpenAskZen: () => void;
  onNavigateToMoneyForest: () => void;
  onNavigateToSettings: () => void;
  onOpenHelp: () => void;
  onOpenSubscriptionModal: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onLogout: () => void;
  userReferralCode?: string;
  referralCount?: number;
  onNavigateToLoans?: () => void;
  onOpenBankSync?: () => void;
  onOpenWidgetModal?: () => void;
  onNavigateToFollowUs?: () => void;
  isPremiumUser?: boolean;
}

export const MoreToolsView: React.FC<MoreToolsViewProps> = ({
  onNavigateToImpulseBlocker,
  onNavigateToSimulator,
  onNavigateToSharedBudget,
  onNavigateToReferral,
  onOpenAskZen,
  onNavigateToMoneyForest,
  onNavigateToSettings,
  onOpenHelp: _onOpenHelp,
  onOpenSubscriptionModal,
  onExportCSV,
  onResetData,
  onLogout,
  userReferralCode: _userReferralCode = '',
  referralCount = 0,
  onNavigateToLoans,
  onOpenBankSync,
  onOpenWidgetModal,
  onNavigateToFollowUs,
  isPremiumUser = false
}) => {
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; icon: string; url: string; color: string; is_active: boolean }>>([]);

  useEffect(() => {
    // Fetch dynamic social links from Supabase
    supabase.from('social_links').select('*').eq('is_active', true).then(({ data }) => {
      if (data && data.length > 0) {
        setSocialLinks(data);
      } else {
        // Fallback to default links
        setSocialLinks([
          { platform: 'Instagram', icon: '📸', url: 'https://www.instagram.com/zenbudget_tracker/', color: '#e1306c', is_active: true },
          { platform: 'Facebook', icon: '👥', url: 'https://www.facebook.com/people/ZenBudget/61592667931013/', color: '#1877f2', is_active: true },
          { platform: 'YouTube', icon: '▶️', url: 'https://www.youtube.com/channel/UCa2ewl3C6Q3qGTXjbAMeAtA', color: '#ff0000', is_active: true },
        ]);
      }
    }).catch(() => {
      setSocialLinks([
        { platform: 'Instagram', icon: '📸', url: 'https://www.instagram.com/zenbudget_tracker/', color: '#e1306c', is_active: true },
        { platform: 'Facebook', icon: '👥', url: 'https://www.facebook.com/people/ZenBudget/61592667931013/', color: '#1877f2', is_active: true },
        { platform: 'YouTube', icon: '▶️', url: 'https://www.youtube.com/channel/UCa2ewl3C6Q3qGTXjbAMeAtA', color: '#ff0000', is_active: true },
      ]);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '90px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: "'Manrope', sans-serif", margin: 0 }}>{t('more_tools_title')}</h2>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('more_tools_sub')}</span>
      </div>

      {/* SECTION 1: MONEY TOOLS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          {t('money_tools')}
        </h3>

        <div className="glass-panel" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Loans & Udhaar Tracker */}
          {onNavigateToLoans && (
            <button
              onClick={onNavigateToLoans}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HandCoins size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('loans_udhaar')}</p>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('loans_sub')}</span>
                </div>
              </div>
              <ChevronRight size={18} color="#94a3b8" />
            </button>
          )}

          {/* Impulse Blocker */}
          <button
            onClick={onNavigateToImpulseBlocker}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hourglass size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('impulse_blocker')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('impulse_blocker_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>

          {/* Wealth Simulator */}
          <button
            onClick={onNavigateToSimulator}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('compound_simulator')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('compound_simulator_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>

          {/* Shared Budget */}
          <button
            onClick={onNavigateToSharedBudget}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('shared_budget')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('shared_budget_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>
        </div>
      </div>

      {/* SECTION 2: ZEN & GROWTH */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          {t('zen_growth')}
        </h3>

        <div className="glass-panel" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Ask Zen */}
          <button
            onClick={onOpenAskZen}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('zen_coach_title')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('zen_coach_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>

          {/* Money Forest */}
          <button
            onClick={onNavigateToMoneyForest}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TreePine size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('money_forest')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('money_forest_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>
        </div>
      </div>

      {/* SECTION 3: SHARE & REWARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          {t('share_rewards')}
        </h3>

        <div 
          onClick={onNavigateToReferral}
          className="glass-panel" 
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.15)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('referral_program')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('referral_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Paid Referrals Progress:</span>
            <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>{referralCount} / 10 Paid Members</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: ACCOUNT & APP SETTINGS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Account &amp; Settings
        </h3>

        <div className="glass-panel" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* General Settings */}
          <button
            onClick={onNavigateToSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Settings size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Profile &amp; Preferences</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Username, passcode, currency &amp; language settings.</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>

          {/* Follow Us */}
          {onNavigateToFollowUs && (
            <button
              onClick={onNavigateToFollowUs}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(225, 48, 108, 0.15)', color: '#e1306c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Share2 size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Follow Us</p>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Instagram, Facebook, YouTube &amp; Social Links</span>
                </div>
              </div>
              <ChevronRight size={18} color="#94a3b8" />
            </button>
          )}

          {/* Premium Subscription */}
          <button
            onClick={onOpenSubscriptionModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>ZenBudget Premium</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Monthly ₹149 | Yearly ₹1,499 | Lifetime Founding Member</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>

          {/* Export Data */}
          <button
            onClick={onExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Download size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Export CSV Report</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Download full transaction history as CSV file.</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>

          {/* Reset Database */}
          <button
            onClick={onResetData}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RefreshCw size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Reset Workspace Data</p>
                  {!isPremiumUser && (
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>
                      🔒 PRO
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {!isPremiumUser ? 'Premium feature — Upgrade to reset workspace' : 'Clear local cache or start fresh.'}
                </span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'rgba(239, 68, 68, 0.05)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left',
              marginTop: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LogOut size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--danger)' }}>Sign Out Account</p>
                <span style={{ fontSize: '11px', color: 'rgba(239, 68, 68, 0.7)' }}>Lock app session.</span>
              </div>
            </div>
            <ChevronRight size={18} color="var(--danger)" />
          </button>

        </div>
      </div>

    </div>
  );
};
