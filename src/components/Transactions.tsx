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
  MoreHorizontal
} from 'lucide-react';
import type { Transaction, CategoryType } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface TransactionsProps {
  transactions: Transaction[];
  currencySymbol: string;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
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

export const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  currencySymbol,
  onEditTransaction,
  onDeleteTransaction
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px' }} className="animate-fade-in">
      <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{t('transactions_title')}</h2>

      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search_placeholder')}
          className="glass-input"
          style={{ paddingLeft: '48px' }}
        />
      </div>

      {/* Filters Drawer/Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Type selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{id:'all',label:t('all')},{id:'income',label:t('income')},{id:'expense',label:t('expenses')}].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id as any)}
              className={`glass-button ${selectedType === item.id ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '12px',
                fontSize: '13px'
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
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '12px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
                backgroundColor: selectedCategory === cat.id ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                borderColor: selectedCategory === cat.id ? 'transparent' : 'rgba(255,255,255,0.08)',
                color: selectedCategory === cat.id ? '#fff' : 'var(--text-secondary)'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('showing_items').replace('{{count}}', String(filteredTransactions.length))}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600 }}>
            <ArrowUpDown size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                fontFamily: 'inherit',
                fontWeight: 'inherit',
                fontSize: 'inherit',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="date-desc">{t('newest_first')}</option>
              <option value="date-asc">{t('oldest_first')}</option>
              <option value="amount-desc">{t('newest_first')}</option>
              <option value="amount-asc">{t('oldest_first')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List Grouped by Date */}
      {sortedDates.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {t('empty_ledger')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sortedDates.map((dateStr) => (
            <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Date Header */}
              <h3 style={{ 
                fontSize: '12px', 
                fontWeight: 700, 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                paddingLeft: '4px' 
              }}>
                {getFriendlyDate(dateStr)}
              </h3>

              {/* Transactions in Date Group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {grouped[dateStr].map((t) => {
                  const meta = categoryMeta[t.category] || categoryMeta.other;
                  const isMenuOpen = activeTxMenu === t.id;

                  return (
                    <div 
                      key={t.id} 
                      className="glass-panel"
                      style={{ 
                        padding: '14px 16px', 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: isMenuOpen ? '12px' : '0',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div 
                          style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', flex: 1 }}
                          onClick={() => onEditTransaction(t)}
                        >
                          <div style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '12px', 
                            backgroundColor: t.type === 'income' ? 'var(--success-glow)' : meta.bg, 
                            color: t.type === 'income' ? 'var(--success)' : meta.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {getCategoryIcon(t.category, t.type)}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {t.title}
                              {t.paidBy && (
                                <span style={{ 
                                  fontSize: '9px', 
                                  fontWeight: 800, 
                                  padding: '2px 6px', 
                                  borderRadius: '8px', 
                                  background: t.paidBy === 'You' ? 'rgba(34,197,94,0.1)' : 'rgba(236,72,153,0.1)', 
                                  color: t.paidBy === 'You' ? 'var(--primary)' : '#ec4899',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  {t.paidBy}
                                </span>
                              )}
                              {t.partnerName && (
                                <span style={{
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  background: 'rgba(139,92,246,0.15)',
                                  color: '#a78bfa',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  👫 {t.partnerName}
                                </span>
                              )}
                            </h4>
                            {t.notes && (
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                {t.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            fontSize: '15px', 
                            fontWeight: 700, 
                            color: t.type === 'income' ? 'var(--success)' : 'var(--text-primary)' 
                          }}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currencySymbol)}
                          </span>
                          
                          <button
                            onClick={() => setActiveTxMenu(isMenuOpen ? null : t.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Options */}
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
                              // We will handle confirm modal via parent/App callbacks later or keep standard browser confirm wrapper if needed
                              // Actually, to fully respect user request of no ugly alerts, let's pass a confirmation modal triggers!
                              // We can just confirm with normal confirm wrapper for a second, or call onDeleteTransaction direct if we trust user,
                              // but let's keep it clean: we will trigger confirmation via props!
                              onDeleteTransaction(t.id);
                              setActiveTxMenu(null);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'var(--danger-glow)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              color: 'var(--danger)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
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
