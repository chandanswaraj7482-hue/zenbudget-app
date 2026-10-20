import React, { useState } from 'react';
import { t } from '../utils/i18n';
import { 
  Search, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  ArrowUpDown,
  MoreVertical,
  Utensils, 
  ShoppingBag, 
  Film, 
  CreditCard, 
  Compass, 
  HeartPulse, 
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import type { Transaction, CategoryType } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface TransactionsProps {
  transactions: Transaction[];
  currencySymbol: string;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  isPremiumUser?: boolean;
}

const CATEGORIES: { id: CategoryType | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'All Categories', color: '#fff' },
  { id: 'food', label: 'Food & Dining', color: '#f59e0b' },
  { id: 'shopping', label: 'Shopping', color: 'var(--secondary)' },
  { id: 'entertainment', label: 'Entertainment', color: '#8b5cf6' },
  { id: 'bills', label: 'Bills & Utilities', color: '#3b82f6' },
  { id: 'travel', label: 'Travel & Transport', color: '#06b6d4' },
  { id: 'health', label: 'Health & Fitness', color: '#10b981' },
  { id: 'other', label: 'Others', color: '#64748b' },
];

const SwipeableTransactionItem = ({ t, meta, isMenuOpen, currencySymbol, formatCurrency, getCategoryIcon, onEditTransaction, onDeleteTransaction, setActiveTxMenu, isPremiumUser }: any) => {
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const touchStartX = React.useRef(0);
  const touchCurrentX = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = touchStartX.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    if (Math.abs(diff) < 150) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    const diff = touchCurrentX.current - touchStartX.current;
    if (diff > 80) {
      onDeleteTransaction(t.id);
    } else if (diff < -80) {
      onEditTransaction(t);
    }
    setSwipeOffset(0);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
      <div style={{ 
        position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '0 20px', 
        background: swipeOffset > 0 ? (isPremiumUser ? 'rgba(239, 68, 68, 0.2)' : 'rgba(236,72,153,0.2)') : swipeOffset < 0 ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
        zIndex: 0 
      }}>
        <div style={{ opacity: swipeOffset > 30 ? 1 : 0, color: isPremiumUser ? '#ef4444' : '#ec4899', fontWeight: 800, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trash2 size={18} /> {isPremiumUser ? 'Delete' : '🔒 (PRO)'}
        </div>
        <div style={{ opacity: swipeOffset < -30 ? 1 : 0, color: '#10b981', fontWeight: 800, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Edit <Edit3 size={18} />
        </div>
      </div>

      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="glass-panel"
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          padding: '14px 16px', 
          display: 'flex', 
          flexDirection: 'column',
          gap: isMenuOpen ? '12px' : '0',
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.88) 0%, rgba(11, 17, 31, 0.94) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
          touchAction: 'pan-y'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', width: '100%' }}>
          <div 
            style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', flex: '1 1 0%', minWidth: 0 }}
            onClick={() => onEditTransaction(t)}
          >
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '14px', 
              backgroundColor: t.type === 'income' ? 'rgba(16, 185, 129, 0.16)' : meta.bg, 
              border: `1px solid ${t.type === 'income' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
              color: t.type === 'income' ? '#10b981' : meta.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: t.type === 'income' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
            }}>
              {getCategoryIcon(t.category, t.type)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: 0, lineHeight: 1.3, color: 'var(--text-primary)' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{t.title}</span>
                {t.paidBy && (
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: 800, 
                    padding: '2px 7px', 
                    borderRadius: '999px', 
                    background: t.paidBy === 'You' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(236,72,153,0.14)', 
                    border: `1px solid ${t.paidBy === 'You' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(236,72,153,0.3)'}`,
                    color: t.paidBy === 'You' ? '#10b981' : '#ec4899',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    flexShrink: 0
                  }}>
                    {t.paidBy}
                  </span>
                )}
                {t.partnerName && (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: 'rgba(139,92,246,0.15)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    color: '#a78bfa',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    flexShrink: 0
                  }}>
                    👫 {t.partnerName}
                  </span>
                )}
              </h4>
              {t.notes && (
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, marginTop: '2px' }}>
                  {t.notes}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div style={{
              padding: '4px 10px',
              borderRadius: '12px',
              background: t.type === 'income' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${t.type === 'income' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.25)'}`,
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: '14.5px', 
                fontWeight: 800, 
                color: t.type === 'income' ? '#34d399' : '#fb7185',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em'
              }}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currencySymbol)}
              </span>
            </div>
            
            <button
              onClick={() => setActiveTxMenu(isMenuOpen ? null : t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            borderTop: '1px solid rgba(255,255,255,0.05)', 
            paddingTop: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                onEditTransaction(t);
                setActiveTxMenu(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Edit3 size={12} /> Edit
            </button>
            <button
              onClick={() => {
                onDeleteTransaction(t.id);
                setActiveTxMenu(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isPremiumUser ? 'var(--danger-glow)' : 'rgba(236,72,153,0.1)',
                border: isPremiumUser ? 'none' : '1px solid rgba(236,72,153,0.25)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: isPremiumUser ? 'var(--danger)' : '#ec4899',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={12} /> {isPremiumUser ? 'Delete' : '🔒 (PRO)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Transactions: React.FC<TransactionsProps> = ({
  transactions = [],
  currencySymbol,
  onEditTransaction,
  onDeleteTransaction,
  isPremiumUser = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [activeTxMenu, setActiveTxMenu] = useState<string | null>(null);

  // Filter & Sort logic
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                            (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchesType = selectedType === 'all' || t.type === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  // Group by date helper
  const groupTransactionsByDate = (txList: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    txList.forEach(tx => {
      const dateStr = tx.date;
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(tx);
    });
    return groups;
  };

  const grouped = groupTransactionsByDate(filteredTransactions);
  const sortedDates = Object.keys(grouped).sort((a, b) => {
    return sortBy.includes('desc') 
      ? new Date(b).getTime() - new Date(a).getTime()
      : new Date(a).getTime() - new Date(b).getTime();
  });

  const getFriendlyDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const categoryMeta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    food: { label: 'Food', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <Utensils size={18} /> },
    shopping: { label: 'Shopping', color: 'var(--secondary)', bg: 'rgba(20, 184, 166, 0.1)', icon: <ShoppingBag size={18} /> },
    entertainment: { label: 'Entertainment', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: <Film size={18} /> },
    bills: { label: 'Bills', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <CreditCard size={18} /> },
    travel: { label: 'Travel', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', icon: <Compass size={18} /> },
    health: { label: 'Health', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <HeartPulse size={18} /> },
    other: { label: 'Other', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: <MoreHorizontal size={18} /> },
  };

  const getCategoryIcon = (category: string, type: 'income' | 'expense' | 'transfer') => {
    if (type === 'income') return <TrendingUp size={18} />;
    return categoryMeta[category]?.icon || <MoreHorizontal size={18} />;
  };

  // AI Insights Calculation for current month
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthExpenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpentSoFar = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const dailyAvg = currentDay > 0 ? Math.round(totalSpentSoFar / currentDay) : 0;
  const projectedMonthEnd = Math.round(dailyAvg * daysInMonth);

  // Retrieve monthly salary / baseline budget
  const profileId = localStorage.getItem('zb_profile_id') || 'local';
  const savedSalary = Number(
    localStorage.getItem(`zb_monthly_salary_${profileId}`) || 
    localStorage.getItem('zb_monthly_salary_local') || 
    localStorage.getItem('zb_monthly_salary') || 
    localStorage.getItem('monthly_salary')
  ) || 0;

  const currentMonthIncome = transactions.filter(t => {
    if (t.type !== 'income') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, t) => sum + t.amount, 0);

  const baselineSalary = savedSalary > 0 ? savedSalary : (currentMonthIncome > 0 ? currentMonthIncome : 0);

  let pillText = '';
  if (baselineSalary > 0) {
    if (projectedMonthEnd <= baselineSalary) {
      pillText = `You're pacing under your salary — hold daily spend near ${currencySymbol}${dailyAvg.toLocaleString()}.`;
    } else {
      const overBy = Math.round(projectedMonthEnd - baselineSalary);
      const remainingDays = Math.max(1, daysInMonth - currentDay);
      const remainingBudget = Math.max(0, baselineSalary - totalSpentSoFar);
      const targetDaily = Math.round(remainingBudget / remainingDays);
      pillText = `Pacing ${currencySymbol}${overBy.toLocaleString()} over salary — hold daily spend near ${currencySymbol}${targetDaily.toLocaleString()}.`;
    }
  } else {
    if (totalSpentSoFar > 0) {
      pillText = `Hold daily spend near ${currencySymbol}${dailyAvg.toLocaleString()} to maintain a healthy budget pace.`;
    } else {
      pillText = `Zero expenses logged so far — keep up the great discipline!`;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '140px' }} className="animate-fade-in">
      {/* Page Title & Subtitle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            {t('transactions_title')}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0', fontWeight: 500 }}>
            All your entries & real-time spending insights
          </p>
        </div>
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '14px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#34d399',
          fontSize: '12px',
          fontWeight: 800
        }}>
          <span>{filteredTransactions.length}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Logs</span>
        </div>
      </div>

      {/* 🪄 AI INSIGHTS CARD - MODERN FINTECH REDESIGN */}
      <div 
        className="glass-panel"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '24px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
            }}>
              <Sparkles size={14} color="#ffffff" />
            </div>
            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: 900, 
                letterSpacing: '0.08em', 
                color: '#fbbf24', 
                textTransform: 'uppercase' 
              }}
            >
              AI CASHFLOW PULSE
            </span>
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Day {currentDay} of {daysInMonth}
          </span>
        </div>

        <p 
          style={{ 
            fontSize: '13px', 
            color: 'var(--text-primary)', 
            lineHeight: '1.55', 
            fontWeight: 500, 
            margin: 0 
          }}
        >
          {totalSpentSoFar > 0 ? (
            <>
              You've spent <strong style={{ color: '#ffffff', fontWeight: 800 }}>{currencySymbol}{totalSpentSoFar.toLocaleString()}</strong> so far — around <strong style={{ color: '#34d399', fontWeight: 800 }}>{currencySymbol}{dailyAvg.toLocaleString()}/day</strong>. Projected month-end burn: <strong style={{ color: '#fbbf24', fontWeight: 800 }}>{currencySymbol}{projectedMonthEnd.toLocaleString()}</strong>.
            </>
          ) : (
            <>
              You've spent <strong style={{ color: '#34d399', fontWeight: 800 }}>{currencySymbol}0</strong> so far this month. On this track, your projected month-end burn is minimal.
            </>
          )}
        </p>

        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.25) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '14px',
            padding: '10px 14px',
            color: '#fbbf24',
            fontSize: '12px',
            fontWeight: 700,
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>💡</span>
          <span>{pillText}</span>
        </div>
      </div>

      {/* Search Bar - Sleek Glass */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search_placeholder')}
          className="glass-input"
          style={{
            width: '100%',
            padding: '14px 44px 14px 46px',
            borderRadius: '20px',
            fontSize: '13.5px',
            fontWeight: 600,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters Drawer/Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Type selector */}
        <div className="segmented-control-bar">
          {[
            { id: 'all', label: t('all') },
            { id: 'income', label: `+ ${t('income')}` },
            { id: 'expense', label: `- ${t('expenses')}` }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id as any)}
              className={`segmented-pill-item ${selectedType === item.id ? 'active' : ''}`}
              style={{
                background: selectedType === item.id 
                  ? (item.id === 'income' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2))' : item.id === 'expense' ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.25), rgba(225, 29, 72, 0.2))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))')
                  : 'transparent',
                border: selectedType === item.id
                  ? (item.id === 'income' ? '1px solid rgba(16, 185, 129, 0.4)' : item.id === 'expense' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(16, 185, 129, 0.35)')
                  : '1px solid transparent',
                color: selectedType === item.id
                  ? (item.id === 'income' ? '#34d399' : item.id === 'expense' ? '#fb7185' : '#ffffff')
                  : 'var(--text-secondary)',
                fontWeight: 800
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Category Scroll Row */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '4px',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none'
        }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: isSelected ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#34d399' : 'var(--text-secondary)',
                  boxShadow: isSelected ? '0 2px 10px rgba(16, 185, 129, 0.25)' : 'none',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {cat.id !== 'all' && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color }} />
                )}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('showing_items').replace('{{count}}', String(filteredTransactions.length))}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            padding: '6px 12px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <ArrowUpDown size={13} color="var(--primary)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List Grouped by Date */}
      {sortedDates.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '44px 20px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--glow-shadow)'
        }}>
          <span style={{ fontSize: '34px' }}>📭</span>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {t('empty_ledger')}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '280px', lineHeight: 1.4, fontWeight: 500 }}>
            No transactions found for this filter. Start logging using Quick Capture above!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sortedDates.map((dateStr) => (
            <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Date Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '4px 6px 0 6px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.7)'
                  }} />
                  <h3 style={{ 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    color: 'var(--text-primary)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.06em',
                    margin: 0
                  }}>
                    {getFriendlyDate(dateStr)}
                  </h3>
                </div>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  {grouped[dateStr].length} {grouped[dateStr].length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Transactions in Date Group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {grouped[dateStr].map((t) => {
                  const meta = categoryMeta[t.category] || categoryMeta.other;
                  const isMenuOpen = activeTxMenu === t.id;

                  return (
                    <SwipeableTransactionItem
                      key={t.id}
                      t={t}
                      meta={meta}
                      isMenuOpen={isMenuOpen}
                      currencySymbol={currencySymbol}
                      formatCurrency={formatCurrency}
                      getCategoryIcon={getCategoryIcon}
                      onEditTransaction={onEditTransaction}
                      onDeleteTransaction={onDeleteTransaction}
                      setActiveTxMenu={setActiveTxMenu}
                      isPremiumUser={isPremiumUser}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
