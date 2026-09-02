import React, { useState } from 'react';
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
  AlertTriangle,
  Info
} from 'lucide-react';
import type { CategoryBudget, CategoryType, Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface BudgetsProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  currencySymbol: string;
  onSaveBudget: (category: CategoryType, limit: number) => void;
}

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
  onSaveBudget
}) => {
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [limitInput, setLimitInput] = useState<string>('');

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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
    setEditingCategory(cat);
    setLimitInput(currentLimit > 0 ? currentLimit.toString() : '');
  };

  const handleSave = (cat: CategoryType) => {
    const val = parseFloat(limitInput);
    if (isNaN(val) || val < 0) {
      return;
    }
    onSaveBudget(cat, val);
    setEditingCategory(null);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '140px' }} className="animate-fade-in">
      <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
        {t('category_budgets')}
      </h2>

      {/* Budget Summary Card */}
      <div className="glass-panel" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--glow-shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Info size={18} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('total_allocated')}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '34px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {currencySymbol}{totalAllocated.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div style={{ background: 'var(--bg-dark)', padding: '6px 14px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              {t('spent_this_month')}: <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}{totalExpenseThisMonth.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Categories Budget List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {CATEGORIES.map((cat) => {
          const limit = getBudgetLimit(cat.id);
          const spent = getSpentAmount(cat.id);
          const isEditing = editingCategory === cat.id;
          const isOver = limit > 0 && spent > limit;
          const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

          return (
            <div 
              key={cat.id} 
              className="glass-panel" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '14px',
                background: 'var(--bg-card)',
                border: isOver ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-card)',
                borderRadius: '22px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '42px', 
                    height: '42px', 
                    borderRadius: '14px', 
                    backgroundColor: cat.bg, 
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</h4>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Spent: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(spent, currencySymbol)}</strong> {limit > 0 ? `of ${formatCurrency(limit, currencySymbol)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Limit Editor */}
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{currencySymbol}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Limit"
                      style={{
                        width: '90px',
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--primary)',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontSize: '14px',
                        fontWeight: 700
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(cat.id)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditClick(cat.id, limit)}
                    style={{
                      background: limit > 0 ? 'var(--bg-dark)' : 'rgba(16, 185, 129, 0.1)',
                      border: limit > 0 ? '1px solid var(--border-card)' : '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      color: limit > 0 ? 'var(--text-primary)' : 'var(--primary)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {limit > 0 ? formatCurrency(limit, currencySymbol) : `+ ${t('set_limit')}`}
                  </button>
                )}
              </div>

              {/* Progress Indicator */}
              {limit > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                  <div style={{ width: '100%', height: '8px', borderRadius: '99px', backgroundColor: 'rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percent}%`, 
                      height: '100%', 
                      background: isOver ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' : percent > 80 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                      borderRadius: '99px',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {percent}{t('of_limit_spent')}
                    </span>
                    {isOver ? (
                      <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                        <AlertTriangle size={13} /> {t('over_limit')} {formatCurrency(spent - limit, currencySymbol)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                        {t('remaining')}: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(limit - spent, currencySymbol)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
