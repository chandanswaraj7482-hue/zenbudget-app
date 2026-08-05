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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px' }} className="animate-fade-in">
      <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{t('category_budgets')}</h2>

      {/* Budget Summary Card */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(20,20,33,0.7) 0%, rgba(6,182,212,0.06) 100%)',
        border: '1px solid rgba(6,182,212,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'var(--info-glow)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Info size={16} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('total_allocated')}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '28px', fontWeight: 800 }}>
            {currencySymbol}{totalAllocated.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {t('spent_this_month')}: {currencySymbol}{totalExpenseThisMonth.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Categories Budget List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                gap: '12px',
                borderColor: isOver ? 'rgba(244, 63, 94, 0.3)' : undefined
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '12px', 
                    backgroundColor: cat.bg, 
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{cat.label}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Spent: {formatCurrency(spent, currencySymbol)} {limit > 0 ? `of ${formatCurrency(limit, currencySymbol)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Limit Editor */}
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{currencySymbol}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Limit"
                      style={{
                        width: '80px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-input)',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontSize: '13px'
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(cat.id)}
                      style={{
                        background: 'var(--primary)',
                        border: 'none',
                        borderRadius: '8px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditClick(cat.id, limit)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {limit > 0 ? formatCurrency(limit, currencySymbol) : t('set_limit')}
                  </button>
                )}
              </div>

              {/* Progress Indicator */}
              {limit > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percent}%`, 
                      height: '100%', 
                      backgroundColor: isOver ? 'var(--danger)' : percent > 80 ? 'var(--warning)' : 'var(--primary)',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {percent}{t('of_limit_spent')}
                    </span>
                    {isOver ? (
                      <span style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                        <AlertTriangle size={12} /> {t('over_limit')} {formatCurrency(spent - limit, currencySymbol)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {t('remaining')}: {formatCurrency(limit - spent, currencySymbol)}
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
