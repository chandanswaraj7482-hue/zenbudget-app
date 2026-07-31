import React, { useState, useEffect } from 'react';
import { Sun, X, AlertTriangle, Sparkles, TrendingDown } from 'lucide-react';
import type { Transaction, CategoryBudget } from '../types';

interface MorningBriefProps {
  onClose: () => void;
  transactions: Transaction[];
  currencySymbol: string;
  userName: string;
  monthlySavingsTarget: number;
  budgets?: CategoryBudget[];
  todaysLimit?: number;
}

export const MorningBrief: React.FC<MorningBriefProps> = ({
  onClose, transactions, currencySymbol, userName, monthlySavingsTarget, budgets = [], todaysLimit: todaysLimitProp
}) => {
  const [aiMessage, setAiMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Yesterday's stats (local timezone)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  const yTx = transactions.filter(t => t.date === yStr && t.type === 'expense');
  const spentYesterday = yTx.reduce((sum, t) => sum + t.amount, 0);
  
  const cats = yTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];

  // Monthly spending this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthlyTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyExpenses = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  
  // Smart limit: based on user's REAL average daily spending (last 14 days)
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const activeDays = last14Days.filter(dateStr => transactions.some(t => t.date === dateStr && t.type === 'expense'));
  const totalLast14Spend = transactions
    .filter(t => last14Days.includes(t.date) && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const avgDailySpend = activeDays.length > 0 ? Math.round(totalLast14Spend / activeDays.length) : 0;

  // Fallback to budget-based limit if no history
  const effectiveMonthlyBudget = monthlySavingsTarget > 0 ? monthlySavingsTarget : budgets.reduce((s, b) => s + b.limit, 0);
  const remainingBudget = Math.max(0, effectiveMonthlyBudget - monthlyExpenses);
  const remainingDays = Math.max(1, daysInMonth - dayOfMonth + 1);
  const budgetBasedLimit = effectiveMonthlyBudget > 0 ? Math.round(remainingBudget / remainingDays) : 0;

  // Use average daily spend as the "smart limit" if we have data, else budget-based
  const smartLimit = avgDailySpend > 0 ? Math.round(avgDailySpend * 1.2) : budgetBasedLimit; // 20% buffer above avg
  const todaysLimit = todaysLimitProp !== undefined ? todaysLimitProp : (smartLimit > 0 ? smartLimit : 500);

  // Budget prediction
  let budgetEndDate = '';
  if (effectiveMonthlyBudget > 0 && dayOfMonth > 1 && monthlyExpenses > 0) {
    const dailyRate = monthlyExpenses / (dayOfMonth - 1);
    const remaining = effectiveMonthlyBudget - monthlyExpenses;
    if (remaining > 0 && dailyRate > 0) {
      const daysLeft = Math.floor(remaining / dailyRate);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysLeft);
      budgetEndDate = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  useEffect(() => {
    const generateMessage = async () => {
      setIsLoading(true);
      
      let prompt = '';
      if (spentYesterday === 0) {
        prompt = `Good morning ${userName.split(' ')[0]}! They had no expenses yesterday. Give a warm motivating start to the day in 2 sentences.`;
      } else if (topCat) {
        prompt = `Good morning ${userName.split(' ')[0]}! Yesterday they spent ${currencySymbol}${Math.round(spentYesterday)} total, with ${currencySymbol}${Math.round(topCat[1])} on ${topCat[0]}. Today's smart spending limit is ${currencySymbol}${todaysLimit}. Give personalized advice in 2 sentences. Be warm and direct.`;
      } else {
        prompt = `Good morning ${userName.split(' ')[0]}! Yesterday they spent ${currencySymbol}${Math.round(spentYesterday)}. Today's limit is ${currencySymbol}${todaysLimit}. Give a short morning financial motivation in 2 sentences.`;
      }

      try {
        const res = await fetch('https://zenbudget-tracker.vercel.app/api/groq-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are ZenBudget AI Coach. Give short, personal, motivating morning finance messages. No markdown, no bullet points. Max 2 sentences.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });
        const data = await res.json();
        if (data?.choices?.[0]?.message?.content) {
          setAiMessage(data.choices[0].message.content);
        } else {
          setAiMessage("ZenCoach is temporarily unavailable. Please try again later.");
        }
      } catch {
        setAiMessage("ZenCoach is temporarily unavailable. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    generateMessage();
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000, padding: '20px', animation: 'fadeIn 0.3s ease-out'
    }} onClick={onClose}>
      
      <div 
        className="glass-panel"
        style={{
          width: '100%', maxWidth: '360px', padding: '30px', borderRadius: '32px',
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.06) 0%, var(--bg-dark) 100%)',
          border: '1px solid var(--border-card)', position: 'relative',
          boxShadow: 'var(--glow-shadow)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sun size={20} color="#f59e0b" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Morning Brief</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1.1, fontFamily: "'Manrope', sans-serif", color: 'var(--text-primary)' }}>
              Good Morning,<br/>{userName.split(' ')[0]} ☀️
            </h1>
          </div>

          {/* Yesterday summary */}
          <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-card)' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Yesterday you spent</span>
              <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{currencySymbol}{Math.round(spentYesterday).toLocaleString()}</p>
            </div>

            {topCat && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontSize: '13px', fontWeight: 600 }}>
                <AlertTriangle size={16} />
                <span style={{ textTransform: 'capitalize' }}>Highest: {topCat[0]} ({currencySymbol}{Math.round(topCat[1])})</span>
              </div>
            )}
          </div>

          {/* AI Coach Message */}
          <div style={{ background: 'rgba(245, 158, 11, 0.06)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={14} color="#f59e0b" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Money Coach</span>
            </div>
            {isLoading ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Analyzing your finances...</p>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{aiMessage}</p>
            )}
          </div>

          {/* Budget prediction */}
          {budgetEndDate && (
            <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingDown size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
                At current pace, budget ends by <strong>{budgetEndDate}</strong>. Slow down to last the month!
              </p>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Today's smart limit</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)' }}>{currencySymbol}{todaysLimit.toLocaleString()}</span>
          </div>

          <button
            onClick={onClose}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '15px', fontWeight: 800, background: 'linear-gradient(to right, #f59e0b, var(--primary))', border: 'none', color: '#000', cursor: 'pointer' }}
          >
            Let's Go! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
