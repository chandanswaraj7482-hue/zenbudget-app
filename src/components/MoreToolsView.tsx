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
  Trash2,
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
  onDeleteAccount?: () => void;
  userReferralCode?: string;
  referralCount?: number;
  onNavigateToLoans?: () => void;
  onOpenBankSync?: () => void;
  onOpenWidgetModal?: () => void;
  onNavigateToFollowUs?: () => void;
  isPremiumUser?: boolean;
  onNavigateToBankImporter?: () => void;
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
  onDeleteAccount,
  userReferralCode: _userReferralCode = '',
  referralCount = 0,
  onNavigateToLoans,
  onOpenBankSync,
  onOpenWidgetModal,
  onNavigateToFollowUs,
  isPremiumUser = false,
  onNavigateToBankImporter
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '140px', animation: 'fadeIn 0.3s ease-out' }}>
      
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


      {/* SECTION: CALCULATORS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Calculators
        </h3>
        <div className="glass-panel" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => {}}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>FD / RD calculator</p>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>
          
          <button
            onClick={() => {}}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Tax estimator</p>
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

          {/* Bank Statement Importer (AI Bank Assistant - PRO) */}
          <button
            onClick={onNavigateToBankImporter}
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
                <Landmark size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>AI Bank Assistant</p>
                  <span style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    letterSpacing: '0.04em'
                  }}>
                    🔒 PRO
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Parse PDF/CSV, auto-categorize & passbook audit</span>
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

        <div className="glass-panel" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div 
            onClick={onNavigateToReferral}
            style={{
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.15)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
              padding: '10px 12px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('referral_progress', { defaultValue: 'Referral Progress' })}:</span>
              <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>{referralCount} / 10 {t('paid_members', { defaultValue: 'Paid Members' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: ACCOUNT & APP SETTINGS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          {t('account_settings')}
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
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('profile_preferences')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('profile_sub')}</span>
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
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('follow_us')}</p>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('follow_us_sub')}</span>
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
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.15) 100%)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 10px', background: '#10b981', color: '#fff', fontSize: '9px', fontWeight: 800, borderBottomLeftRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VIP</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#10b981' }}>{t('zenbudget_premium')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('premium_pricing_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#10b981" />
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
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('export_csv')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('export_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>

          {/* Reset Database */}
          <button
            onClick={() => {
              if (!isPremiumUser) {
                onOpenSubscriptionModal();
                return;
              }
              onResetData();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left',
              gap: '10px',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 0%' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RefreshCw size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '13.5px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{t('reset_data')}</p>
                  {!isPremiumUser && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background: 'rgba(236,72,153,0.15)',
                      color: '#ec4899',
                      border: '1px solid rgba(236,72,153,0.3)',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      flexShrink: 0
                    }}>
                      🔒 PRO
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                  {t('reset_sub')}
                </span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
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
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--danger)' }}>{t('logout')}</p>
                <span style={{ fontSize: '11px', color: 'rgba(239, 68, 68, 0.7)' }}>{t('logout_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#ef4444" />
          </button>

          {/* Delete Account */}
          {onDeleteAccount && (
            <button
              onClick={onDeleteAccount}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid rgba(220, 38, 38, 0.4)',
                background: 'rgba(220, 38, 38, 0.1)',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                textAlign: 'left',
                marginTop: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.2)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#dc2626' }}>Delete Account</p>
                  <span style={{ fontSize: '11px', color: 'rgba(220, 38, 38, 0.8)' }}>Permanently erase all data</span>
                </div>
              </div>
              <ChevronRight size={18} color="#dc2626" />
            </button>
          )}

        </div>
      </div>

    </div>
  );
};
