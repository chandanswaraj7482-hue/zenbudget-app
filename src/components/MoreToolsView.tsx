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
  Share2,
  Shield,
  FileText,
  KeyRound,
  X
} from 'lucide-react';
import { t } from '../utils/i18n';
import { supabase } from '../supabaseClient';
import { ZenActivitiesHub } from './ZenActivitiesHub';

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
  currencySymbol?: string;
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
  onNavigateToBankImporter,
  currencySymbol = '₹'
}) => {
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; icon: string; url: string; color: string; is_active: boolean }>>([]);
  const [viewingDoc, setViewingDoc] = useState<'privacy' | 'terms' | 'security' | null>(null);

  useEffect(() => {
    // Fetch dynamic social links from Supabase
    supabase.from('social_links').select('*').eq('is_active', true).then(({ data }) => {
      if (data && data.length > 0) {
        setSocialLinks(data);
      } else {
        // Fallback to default links
        setSocialLinks([
          { platform: 'Instagram', icon: '📸', url: 'https://www.instagram.com/somethinglabs.in/', color: '#e1306c', is_active: true },
          { platform: 'Facebook', icon: '👥', url: 'https://www.facebook.com/somethinglabs.in', color: '#1877f2', is_active: true },
          { platform: 'YouTube', icon: '▶️', url: 'https://www.youtube.com/channel/UCa2ewl3C6Q3qGTXjbAMeAtA', color: '#ff0000', is_active: true },
        ]);
      }
    }).catch(() => {
      setSocialLinks([
        { platform: 'Instagram', icon: '📸', url: 'https://www.instagram.com/somethinglabs.in/', color: '#e1306c', is_active: true },
        { platform: 'Facebook', icon: '👥', url: 'https://www.facebook.com/somethinglabs.in', color: '#1877f2', is_active: true },
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

        <div className="fintech-card" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Loans & Udhaar Tracker */}
          {onNavigateToLoans && (
            <button
              onClick={onNavigateToLoans}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                textAlign: 'left',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(245, 158, 11, 0.16)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)' }}>
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
              padding: '12px 14px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(255, 255, 255, 0.03)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(245, 158, 11, 0.16)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)' }}>
                <Hourglass size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('impulse_blocker')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('impulse_blocker_sub')}</span>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>

          {/* Wealth & Financial Calculators */}
          <button
            onClick={onNavigateToSimulator}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(255, 255, 255, 0.03)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(16, 185, 129, 0.16)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('compound_simulator')}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SIP, FD/RD & Tax Calculator</span>
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
              padding: '12px 14px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(255, 255, 255, 0.03)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(139, 92, 246, 0.16)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)' }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{t('shared_budget')}</p>
                  <span className="fintech-badge" style={{
                    background: 'rgba(139, 92, 246, 0.18)',
                    borderColor: 'rgba(139, 92, 246, 0.35)',
                    color: '#c084fc',
                    fontSize: '9.5px',
                    padding: '2px 7px'
                  }}>
                    👑 PRO
                  </span>
                </div>
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

        </div>

        {/* 2-in-1 Zen Arcade & Brain Hub: Coin Game & Money IQ Quiz */}
        <ZenActivitiesHub currencySymbol={currencySymbol} userReferralCode={_userReferralCode} />
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

      {/* LEGAL & DATA PRIVACY (TERMS & CONDITIONS) SECTION DIRECTLY IN MORE TAB */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Legal &amp; Data Privacy 🛡️
        </span>
        <div className="glass-panel" style={{
          padding: '6px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Terms & Conditions */}
          <button
            type="button"
            onClick={() => setViewingDoc('terms')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border-divider)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Terms &amp; Conditions</p>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Usage agreement &amp; policies</span>
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-secondary)" />
          </button>

          {/* Privacy Policy */}
          <button
            type="button"
            onClick={() => setViewingDoc('privacy')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border-divider)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Privacy Policy &amp; Security</p>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>100% confidential &amp; local-first</span>
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-secondary)" />
          </button>

          {/* Security Standards */}
          <button
            type="button"
            onClick={() => setViewingDoc('security')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={16} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Bank-Grade Encryption</p>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Cryptographic storage standards</span>
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* FULL LEGAL DOCUMENT VIEW MODAL */}
      {viewingDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setViewingDoc(null)}>
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              maxHeight: '85vh',
              borderRadius: '28px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-card)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-divider)',
              background: 'var(--bg-input)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>
                  {viewingDoc === 'privacy' ? '🛡️' : viewingDoc === 'terms' ? '📜' : '🔒'}
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {viewingDoc === 'privacy' ? 'Privacy Policy' : viewingDoc === 'terms' ? 'Terms & Conditions' : 'Security Standards'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              textAlign: 'left'
            }}>
              {viewingDoc === 'privacy' && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginTop: 0 }}>Privacy &amp; Data Protection at ZenBudget</h4>
                  <p><strong>Last Updated: October 2026</strong></p>
                  <p>ZenBudget takes privacy seriously. We follow a strict <em>local-first, privacy-by-design</em> architecture to ensure your personal finances remain 100% confidential and secure.</p>
                  
                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>1. Information We Store</h5>
                  <p>Your transactions, budgets, account balances, and categories are encrypted and stored on your device. When cloud sync or partner sync is enabled, data is synced through end-to-end secured channels using Supabase with Row Level Security (RLS).</p>
                  
                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>2. Financial &amp; SMS Privacy</h5>
                  <p>ZenBudget does NOT sell, rent, or trade your financial records, transaction history, or banking information to any third parties or advertising networks. Screenshot and bill scans are parsed strictly for extraction and are never permanently retained on external image servers.</p>
                  
                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>3. Your Rights &amp; Deletion</h5>
                  <p>You maintain full ownership of your data. You can export your data to CSV or request full instant deletion of your account and records anytime from the profile settings.</p>

                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>4. Contact Us</h5>
                  <p>For any privacy concerns, reach out to our grievance team at <strong>privacy@zenbudget.app</strong>.</p>
                </div>
              )}

              {viewingDoc === 'terms' && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginTop: 0 }}>Terms and Conditions of Use</h4>
                  <p><strong>Effective Date: October 2026</strong></p>
                  <p>By downloading, accessing, or using ZenBudget, you agree to comply with and be bound by these Terms and Conditions.</p>

                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>1. Personal Finance Tool</h5>
                  <p>ZenBudget is a self-hosted expense tracking and financial mindfulness application. ZenBudget is not a certified bank or financial advisory firm. Tips and budget suggestions provided by the AI Coach are informational and not financial advice.</p>

                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>2. Account Security &amp; Passcode</h5>
                  <p>You are responsible for safeguarding your 4-digit PIN, biometric security, and device access. ZenBudget cannot recover funds or reverse transactions executed on external banking or UPI apps.</p>

                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>3. Subscriptions &amp; Ads</h5>
                  <p>Free tier users may watch voluntary short rewarded ads to unlock additional budget slots. Premium subscriptions provide ad-free access, unlimited categories, and multi-member family sync.</p>

                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>4. Changes to Terms</h5>
                  <p>We may update these terms periodically. Continued use of ZenBudget represents acceptance of any revised terms.</p>
                </div>
              )}

              {viewingDoc === 'security' && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginTop: 0 }}>ZenBudget Security Architecture</h4>
                  <p>We protect your personal financial records with industry-standard cryptographic techniques.</p>

                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>1. Local-First Sandboxing</h5>
                  <p>All sensitive authentication credentials, 4-digit PINs, and active ledger balances remain encrypted in local secure device storage.</p>

                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>2. TLS 1.3 End-to-End Transport</h5>
                  <p>Any sync with remote family group budgets takes place exclusively over TLS 1.3 secured protocols with strict Row-Level Security policies.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
