import React, { useState, useEffect } from 'react';
import { t } from '../utils/i18n';
import { 
  Utensils, 
  ShoppingBag, 
  Film, 
  CreditCard, 
  Compass, 
  HeartPulse, 
  MoreHorizontal, 
  Check, 
  Lock,
  Crown,
  Play,
  X,
  Sparkles,
  CheckCircle2,
  Tv
} from 'lucide-react';
import type { CategoryBudget, CategoryType, Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { playCelebrationSound, playNotificationSound } from '../utils/audio';
import { Capacitor } from '@capacitor/core';
import { admobService } from '../services/admobService';

interface BudgetsProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  currencySymbol: string;
  onSaveBudget: (category: CategoryType, limit: number) => void;
  isPremiumUser?: boolean;
  onOpenSubscriptionModal?: () => void;
}

const FREE_BASE_LIMIT = 2; // Free accounts get 2 category limits

const CATEGORIES: { id: CategoryType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'food', label: 'Food & Dining', icon: <Utensils size={18} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { id: 'shopping', label: 'Shopping', icon: <ShoppingBag size={18} />, color: 'var(--secondary)', bg: 'rgba(20, 184, 166, 0.1)' },
  { id: 'entertainment', label: 'Entertainment', icon: <Film size={18} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { id: 'bills', label: 'Bills & Utilities', icon: <CreditCard size={18} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { id: 'travel', label: 'Travel & Transport', icon: <Compass size={18} />, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
  { id: 'health', label: 'Health & Fitness', icon: <HeartPulse size={18} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { id: 'other', label: 'Others', icon: <MoreHorizontal size={18} />, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
];

export const Budgets: React.FC<BudgetsProps> = ({
  budgets = [],
  transactions = [],
  currencySymbol,
  onSaveBudget,
  isPremiumUser = false,
  onOpenSubscriptionModal
}) => {
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [limitInput, setLimitInput] = useState<string>('');
  const [hiddenCategories, setHiddenCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('zb_hidden_categories') || '[]'); } catch { return []; }
  });
  const [isManageOpen, setIsManageOpen] = useState(false);

  // Bonus limit slots unlocked by watching rewarded ads
  const [bonusSlots, setBonusSlots] = useState<number>(() => {
    const saved = localStorage.getItem('zb_bonus_budget_slots');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Rewarded Ad Modal State
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<CategoryType | null>(null);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  const [adRewarded, setAdRewarded] = useState(false);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Active limits currently set
  const activeLimitCount = budgets.filter(b => b.limit > 0).length;
  const maxAllowedSlots = isPremiumUser ? 999 : (FREE_BASE_LIMIT + bonusSlots);
  const isLimitCapped = !isPremiumUser && activeLimitCount >= maxAllowedSlots;

  const getSpentAmount = (cat: CategoryType) => {
    return transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return t.type === 'expense' && 
               t.category === cat && 
               txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBudgetLimit = (cat: CategoryType) => {
    const b = budgets.find(b => b.category === cat);
    return b ? b.limit : 0;
  };

  const handleEditClick = (cat: CategoryType, currentLimit: number) => {
    // If category already has a limit, allow editing freely
    if (currentLimit > 0) {
      setEditingCategory(cat);
      setLimitInput(currentLimit.toString());
      return;
    }

    // If setting a NEW limit and cap is reached for free user, prompt ad / pro
    if (isLimitCapped) {
      playNotificationSound();
      setPendingCategory(cat);
      if (Capacitor.isNativePlatform()) {
        admobService.showRewardedAd(() => {
          playCelebrationSound();
          const newBonus = bonusSlots + 1;
          setBonusSlots(newBonus);
          localStorage.setItem('zb_bonus_budget_slots', String(newBonus));
          setEditingCategory(cat);
          setLimitInput('');
        });
      } else {
        setAdModalOpen(true);
      }
      return;
    }

    setEditingCategory(cat);
    setLimitInput('');
  };

  const handleSave = (cat: CategoryType) => {
    const val = parseFloat(limitInput);
    if (isNaN(val) || val < 0) {
      return;
    }
    onSaveBudget(cat, val);
    setEditingCategory(null);
  };

  // Rewarded Ad Simulation Timer
  useEffect(() => {
    let timer: any = null;
    if (adPlaying && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown(prev => prev - 1);
      }, 1000);
    } else if (adPlaying && adCountdown === 0) {
      setAdPlaying(false);
      setAdRewarded(true);
      playCelebrationSound();
      const newBonus = bonusSlots + 1;
      setBonusSlots(newBonus);
      localStorage.setItem('zb_bonus_budget_slots', String(newBonus));

      // Auto-unlock pending category
      if (pendingCategory) {
        setEditingCategory(pendingCategory);
        setLimitInput('');
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [adPlaying, adCountdown, pendingCategory, bonusSlots]);

  const startWatchingAd = () => {
    if (Capacitor.isNativePlatform()) {
      admobService.showRewardedAd(() => {
        setAdPlaying(false);
        setAdRewarded(true);
        playCelebrationSound();
        const newBonus = bonusSlots + 1;
        setBonusSlots(newBonus);
        localStorage.setItem('zb_bonus_budget_slots', String(newBonus));
        if (pendingCategory) {
          setEditingCategory(pendingCategory);
          setLimitInput('');
        }
      });
      return;
    }
    setAdPlaying(true);
    setAdCountdown(10);
    setAdRewarded(false);
  };

  const closeAdModal = () => {
    setAdModalOpen(false);
    setAdPlaying(false);
    setAdRewarded(false);
    setPendingCategory(null);
  };

  // Total stats
  const totalAllocated = budgets.reduce((sum, b) => sum + b.limit, 0);
  
  const totalExpenseThisMonth = transactions
    .filter(t => {
      const txDate = new Date(t.date);
      return t.type === 'expense' && 
             txDate.getMonth() === currentMonth && 
             txDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px', maxWidth: '100%', overflowX: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🎯</span> {t('my_budgets', { defaultValue: 'My Budgets' })}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('budget_desc', { defaultValue: 'Set category monthly spending caps' })}</span>
        </div>
        <button
          onClick={() => setIsManageOpen(!isManageOpen)}
          style={{
            background: isManageOpen ? 'var(--primary)' : 'rgba(16, 185, 129, 0.1)',
            color: isManageOpen ? '#fff' : 'var(--primary)',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isManageOpen ? 'Done' : 'Manage Categories'}
        </button>
      </div>

      {/* Free Tier Limits vs Pro Status Banner */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '16px',
        background: isPremiumUser 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)',
        border: isPremiumUser 
          ? '1px solid rgba(16, 185, 129, 0.3)'
          : '1px solid rgba(245, 158, 11, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isPremiumUser ? (
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={16} />
            </div>
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} />
            </div>
          )}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isPremiumUser ? '⭐ ZenBudget Pro Active' : `Free Tier: ${activeLimitCount}/${maxAllowedSlots} Limits Used`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {isPremiumUser 
                ? 'Unlimited category limits & 100% Ad-Free experience' 
                : (isLimitCapped ? 'Limit cap reached! Watch ad for +1 slot or go Pro' : `Free tier allows 2 limits. ${maxAllowedSlots - activeLimitCount} left.`)}
            </div>
          </div>
        </div>

        {!isPremiumUser && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setPendingCategory(null); setAdModalOpen(true); }}
              className="hover-lift"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Tv size={12} />
              <span>+1 Slot (Watch Ad)</span>
            </button>
            {onOpenSubscriptionModal && (
              <button
                onClick={onOpenSubscriptionModal}
                className="hover-lift"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Crown size={12} />
                <span>Go Pro</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isManageOpen && (
        <div className="glass-panel animate-fade-in" style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-input)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Select Visible Categories</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map(cat => {
              const isHidden = hiddenCategories.includes(cat.id);
              return (
                <button
                  key={`manage-${cat.id}`}
                  onClick={() => {
                    const nextHidden = isHidden ? hiddenCategories.filter(id => id !== cat.id) : [...hiddenCategories, cat.id];
                    setHiddenCategories(nextHidden);
                    localStorage.setItem('zb_hidden_categories', JSON.stringify(nextHidden));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: `1px solid ${isHidden ? 'var(--border-input)' : cat.color}`,
                    background: isHidden ? 'var(--bg-input)' : cat.bg,
                    color: isHidden ? 'var(--text-secondary)' : cat.color,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isHidden ? 0.6 : 1
                  }}
                >
                  {cat.icon} {cat.label} {!isHidden && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Progress Summary Card */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '16px 18px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>🎯</span>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('total_allocated')}
            </span>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700 }}>
              {t('spent_this_month')}: <strong style={{ color: '#34d399' }}>{currencySymbol}{totalExpenseThisMonth.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
            </span>
          </div>
        </div>

        <div style={{ margin: '6px 0 2px 0' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {currencySymbol}{totalAllocated.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Categories Budget List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {CATEGORIES.filter(cat => !hiddenCategories.includes(cat.id) || getBudgetLimit(cat.id) > 0 || getSpentAmount(cat.id) > 0).map((cat) => {
          const limit = getBudgetLimit(cat.id);
          const spent = getSpentAmount(cat.id);
          const isEditing = editingCategory === cat.id;
          const isOver = limit > 0 && spent > limit;

          return (
            <div 
              key={cat.id} 
              className="glass-panel" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                background: 'var(--bg-card)',
                border: isOver ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '14px 16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', width: '100%' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: '1 1 0%', minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '12px', 
                    backgroundColor: cat.bg, 
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{ minWidth: 0, flex: '1 1 0%', overflow: 'hidden' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</h4>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Spent: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(spent, currencySymbol)}</strong> {limit > 0 ? `of ${formatCurrency(limit, currencySymbol)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Limit Editor */}
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{currencySymbol}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Limit"
                      style={{
                        width: '78px',
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--primary)',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(cat.id)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Check size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditClick(cat.id, limit)}
                    style={{
                      background: limit > 0 ? 'var(--bg-dark)' : 'rgba(16, 185, 129, 0.1)',
                      border: limit > 0 ? '1px solid var(--border-card)' : '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      color: limit > 0 ? 'var(--text-primary)' : 'var(--primary)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      marginLeft: 'auto'
                    }}
                  >
                    {limit > 0 ? formatCurrency(limit, currencySymbol) : `+ ${t('set_limit')}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* REWARDED AD / PRO UPGRADE MODAL                                    */}
      {/* =================================================================== */}
      {adModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card, #0f172a)',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '26px',
            maxWidth: '380px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-input, rgba(255,255,255,0.08))'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tv size={18} color="#f59e0b" />
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Category Limits Unlock
                </span>
              </div>
              {!adPlaying && (
                <button
                  onClick={closeAdModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              
              {!adPlaying && !adRewarded && (
                <div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '20px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '26px'
                  }}>
                    🔒
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                    Free Limit Cap Reached (2/2 Used)
                  </h3>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                    Free users can set monthly caps on up to <strong>2 categories</strong>. Watch a quick 10-second sponsor ad to unlock <strong>+1 extra category limit</strong>, or upgrade to <strong>ZenBudget Pro</strong> for unlimited caps!
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Watch Ad Button */}
                    <button
                      onClick={startWatchingAd}
                      className="hover-lift"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '13px 20px',
                        borderRadius: '14px',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)'
                      }}
                    >
                      <Play size={16} fill="#ffffff" />
                      <span>Watch 10s Sponsor Ad (+1 Slot)</span>
                    </button>

                    {/* Go Pro Button */}
                    {onOpenSubscriptionModal && (
                      <button
                        onClick={() => { closeAdModal(); onOpenSubscriptionModal(); }}
                        className="hover-lift"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '13px 20px',
                          borderRadius: '14px',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)'
                        }}
                      >
                        <Crown size={16} />
                        <span>Go Pro (Unlimited &amp; Ad-Free)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Ad Playing Simulation */}
              {adPlaying && (
                <div>
                  <div style={{
                    padding: '24px 16px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                    border: '1.5px dashed rgba(16, 185, 129, 0.4)',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Sponsored Partner Ad
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>
                      🌱 ZenBudget Pro • Save ₹5,000/mo
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                      Automatic passbook scans, couples shared sync &amp; safe daily spending limits.
                    </p>
                  </div>

                  {/* Countdown Timer */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b' }}>
                      ⏱️ {adCountdown}s
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Do not close • Reward will unlock automatically
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-input, rgba(255,255,255,0.08))', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${((10 - adCountdown) / 10) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                      transition: 'width 1s linear'
                    }} />
                  </div>
                </div>
              )}

              {/* Ad Finished / Reward Unlocked */}
              {adRewarded && (
                <div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '28px'
                  }}>
                    🎉
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', margin: '0 0 6px 0' }}>
                    +1 Category Limit Unlocked!
                  </h3>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                    Thank you for supporting ZenBudget! You can now set your spending limit for this category.
                  </p>

                  <button
                    onClick={closeAdModal}
                    className="hover-lift"
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 28px',
                      borderRadius: '999px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Set My Limit Now</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
