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
      const name = userName.split(' ')[0] || 'Friend';
      
      // Smart dynamic fallback advice (guarantees AI coach is NEVER broken)
      let defaultAdvice = '';
      if (spentYesterday === 0) {
        defaultAdvice = `Good morning ${name}! You spent ${currencySymbol}0 yesterday. Keep this zero-spending momentum going today!`;
      } else if (topCat) {
        defaultAdvice = `Good morning ${name}! Yesterday you spent ${currencySymbol}${Math.round(spentYesterday)}, mostly on ${topCat[0]}. Stay mindful of your ${currencySymbol}${Math.round(todaysLimit)} limit today!`;
      } else {
        defaultAdvice = `Good morning ${name}! Aim to keep your spending within your daily limit of ${currencySymbol}${Math.round(todaysLimit)} today. You've got this!`;
      }

      let prompt = '';
      if (spentYesterday === 0) {
        prompt = `Good morning ${name}! They had no expenses yesterday. Give a warm motivating start to the day in 2 sentences.`;
      } else if (topCat) {
        prompt = `Good morning ${name}! Yesterday they spent ${currencySymbol}${Math.round(spentYesterday)} total, with ${currencySymbol}${Math.round(topCat[1])} on ${topCat[0]}. Today's smart spending limit is ${currencySymbol}${todaysLimit}. Give personalized advice in 2 sentences. Be warm and direct.`;
      } else {
        prompt = `Good morning ${name}! Yesterday they spent ${currencySymbol}${Math.round(spentYesterday)}. Today's limit is ${currencySymbol}${todaysLimit}. Give a short morning financial motivation in 2 sentences.`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        const apiUrl = window.location.hostname.includes('netlify')
          ? 'https://zenbudget-tracker.vercel.app/api/groq-chat'
          : '/api/groq-chat';

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are ZenBudget AI Coach. Give short, personal, motivating morning finance messages. No markdown, no bullet points. Max 2 sentences.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data?.choices?.[0]?.message?.content) {
          setAiMessage(data.choices[0].message.content);
        } else {
          setAiMessage(defaultAdvice);
        }
      } catch {
        clearTimeout(timeoutId);
        setAiMessage(defaultAdvice);
      } finally {
        setIsLoading(false);
      }
    };
    generateMessage();
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 10000, padding: '20px', animation: 'fadeIn 0.3s ease-out'
    }} onClick={onClose}>
      
      <div 
        className="glass-panel"
        style={{
          width: '100%', maxWidth: '380px', padding: '28px 24px', borderRadius: '28px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)', position: 'relative',
          boxShadow: 'var(--glow-shadow)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '18px', right: '18px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sun size={18} color="#f59e0b" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Morning Brief</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1.15, fontFamily: "'Manrope', sans-serif", color: 'var(--text-primary)', margin: 0 }}>
              Good Morning,<br/>{userName.split(' ')[0] || 'User'} ☀️
            </h1>
          </div>

          {/* Yesterday summary & Visual Progress Bar */}
          <div style={{ background: 'var(--bg-dark)', padding: '18px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-card)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>Yesterday you spent</span>
                <span style={{
                  fontSize: '11px',
                  color: spentYesterday > todaysLimit ? '#dc2626' : '#16a34a',
                  fontWeight: 800,
                  background: spentYesterday > todaysLimit ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                  padding: '3px 8px',
                  borderRadius: '8px'
                }}>
                  {spentYesterday > todaysLimit ? '⚠️ Over Limit' : '✓ Within Limit'}
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>
                {currencySymbol}{Math.round(spentYesterday).toLocaleString()}
              </p>
            </div>

            {/* Visual Progress Bar Graph */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 700 }}>
                <span>Daily Limit Progress</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{Math.min(100, Math.round((spentYesterday / (todaysLimit || 1)) * 100))}% Used</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(0, 0, 0, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (spentYesterday / (todaysLimit || 1)) * 100)}%`,
                  height: '100%',
                  background: spentYesterday > todaysLimit 
                    ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)' 
                    : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  borderRadius: '99px',
                  transition: 'width 0.8s ease-out'
                }} />
              </div>
            </div>

            {topCat && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontSize: '13px', fontWeight: 700, paddingTop: '2px' }}>
                <AlertTriangle size={15} />
                <span style={{ textTransform: 'capitalize' }}>Highest: {topCat[0]} ({currencySymbol}{Math.round(topCat[1])})</span>
              </div>
            )}
          </div>

          {/* AI Coach Message */}
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Sparkles size={15} color="#d97706" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Money Coach</span>
            </div>
            {isLoading ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>Analyzing your finances...</p>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0, fontWeight: 600 }}>{aiMessage}</p>
            )}
          </div>

          {/* Budget prediction & Visual Bar */}
          {budgetEndDate && (
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingDown size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 700, margin: 0 }}>
                  At current pace, budget ends by <strong>{budgetEndDate}</strong>. Slow down to last the month!
                </p>
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 700 }}>Today's smart limit</span>
            <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>{currencySymbol}{todaysLimit.toLocaleString()}</span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '16px',
              fontSize: '15px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Let's Go! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
