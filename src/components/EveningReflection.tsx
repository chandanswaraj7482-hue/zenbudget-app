import React, { useState, useEffect } from 'react';
import { Moon, X, Flame, TrendingDown, Sparkles } from 'lucide-react';
import type { Transaction, CategoryBudget } from '../types';

interface EveningReflectionProps {
  onClose: () => void;
  transactions: Transaction[];
  currencySymbol: string;
  userName: string;
  todaysLimit: number;
  budgets?: CategoryBudget[];
  monthlyBudget?: number;
}

export const EveningReflection: React.FC<EveningReflectionProps> = ({
  onClose, transactions, currencySymbol, userName, todaysLimit, budgets = [], monthlyBudget = 0
}) => {
  const [aiMessage, setAiMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Today's stats (local timezone)
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const todayTx = transactions.filter(t => t.date === todayStr && t.type === 'expense');
  const spentToday = todayTx.reduce((sum, t) => sum + t.amount, 0);
  const savedToday = Math.max(0, todaysLimit - spentToday);
  const isUnderBudget = spentToday <= todaysLimit;

  // Money streak: count consecutive days under budget
  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayTx = transactions.filter(t => t.date === dStr && t.type === 'expense');
      const daySpent = dayTx.reduce((sum, t) => sum + t.amount, 0);
      if (daySpent <= todaysLimit || (i === 0 && daySpent === 0)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };
  const streak = calculateStreak();

  // Top category today
  const catMap: Record<string, number> = {};
  todayTx.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const topCatEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  const topCat = topCatEntry ? topCatEntry[0] : null;
  const topCatAmount = topCatEntry ? topCatEntry[1] : 0;

  // Monthly projection: if user continues at today's rate, how much saved by month end?
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const remainingDays = daysInMonth - dayOfMonth;
  const potentialMonthlySaving = Math.round(topCatAmount * remainingDays);

  // Future budget prediction: based on monthly spending rate
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
  });
  const monthlySpent = monthlyTx.reduce((sum, t) => sum + t.amount, 0);
  const effectiveMonthlyBudget = monthlyBudget > 0 ? monthlyBudget : budgets.reduce((s, b) => s + b.limit, 0);
  
  let budgetEndDate = '';
  if (effectiveMonthlyBudget > 0 && dayOfMonth > 0 && monthlySpent > 0) {
    const dailyRate = monthlySpent / dayOfMonth;
    const remainingBudget = effectiveMonthlyBudget - monthlySpent;
    if (remainingBudget > 0 && dailyRate > 0) {
      const daysLeft = Math.floor(remainingBudget / dailyRate);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysLeft);
      budgetEndDate = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  // Precise AI-style score (not random)
  const score = Math.max(10, Math.min(100, isUnderBudget
    ? 100 - Math.round((spentToday / (todaysLimit || 1)) * 30)
    : 100 - Math.round((spentToday / (todaysLimit || 1)) * 50)));

  useEffect(() => {
    const generateMessage = async () => {
      setIsLoading(true);
      const name = userName.split(' ')[0] || 'Friend';
      
      // Smart dynamic fallback advice (guarantees AI coach is NEVER broken)
      let defaultAdvice = '';
      if (spentToday === 0) {
        defaultAdvice = `Outstanding focus, ${name}! You spent ${currencySymbol}0 today. Your money streak is growing strong!`;
      } else if (topCat) {
        defaultAdvice = `You spent ${currencySymbol}${Math.round(spentToday)} today, mainly on ${topCat}. Avoiding extra spends tomorrow could save you ${currencySymbol}${Math.round(potentialMonthlySaving)} by month end!`;
      } else if (isUnderBudget) {
        defaultAdvice = `Great job today, ${name}! You stayed well within your ${currencySymbol}${Math.round(todaysLimit)} limit. Keep building your financial freedom!`;
      } else {
        defaultAdvice = `You spent ${currencySymbol}${Math.round(spentToday)} today, which was over your ${currencySymbol}${Math.round(todaysLimit)} target. Tomorrow is a brand new day to reset and stay on track!`;
      }

      let prompt = '';
      if (spentToday === 0) {
        prompt = `The user ${name} spent nothing today. Congratulate them briefly in 1-2 sentences. Be warm and motivating.`;
      } else if (topCat) {
        prompt = `The user ${name} spent ${currencySymbol}${Math.round(spentToday)} today, with ${currencySymbol}${Math.round(topCatAmount)} on ${topCat}. If they avoid ${topCat} tomorrow, they could save ${currencySymbol}${potentialMonthlySaving} by month end. Tell them this insight in 2 sentences max. Be warm, direct and personal. No bullet points.`;
      } else {
        prompt = `The user ${name} spent ${currencySymbol}${Math.round(spentToday)} today against a limit of ${currencySymbol}${Math.round(todaysLimit)}. Give them a brief financial reflection in 2 sentences.`;
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
              { role: 'system', content: 'You are ZenBudget AI Coach. Give short, personal, warm financial insights. No markdown, no bullet points. Max 2 sentences.' },
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
      backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000, padding: '20px', animation: 'fadeIn 0.3s ease-out'
    }} onClick={onClose}>
      
      <div 
        className="glass-panel"
        style={{
          width: '100%', maxWidth: '360px', padding: '30px', borderRadius: '32px',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(9, 9, 15, 0.9) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)', position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Moon size={20} color="#8b5cf6" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evening Reflection</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.2, fontFamily: "'Manrope', sans-serif" }}>
              {userName.split(' ')[0]}'s Night Recap
            </h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>Spent Today</span>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{currencySymbol}{Math.round(spentToday).toLocaleString()}</p>
            </div>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>Saved Today</span>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{currencySymbol}{Math.round(savedToday).toLocaleString()}</p>
            </div>
          </div>

          {/* Score */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: '20px', width: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Money Score</span>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
              <span style={{ fontSize: '48px', fontWeight: 800, fontFamily: "'Manrope', sans-serif", background: score >= 70 ? 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)' : score >= 40 ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {score}
              </span>
              <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>/100</span>
            </div>
          </div>

          {/* AI Money Coach Message */}
          <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '16px', borderRadius: '16px', width: '100%', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={14} color="#8b5cf6" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Money Coach</span>
            </div>
            {isLoading ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Analyzing your day...</p>
            ) : (
              <p style={{ fontSize: '13px', color: '#fff', lineHeight: 1.6 }}>{aiMessage}</p>
            )}
          </div>

          {/* Future Prediction */}
          {budgetEndDate && (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px 16px', borderRadius: '14px', width: '100%', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingDown size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600, textAlign: 'left' }}>
                At this pace, your budget runs out by <strong>{budgetEndDate}</strong>. Cut back to stay on track!
              </p>
            </div>
          )}

          {/* Streak */}
          {streak > 0 && isUnderBudget && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '13px' }}>
              <Flame size={16} /> {streak} Day{streak > 1 ? 's' : ''} Under Budget Streak!
            </div>
          )}

          <button
            onClick={onClose}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '15px', fontWeight: 700, background: 'linear-gradient(to right, #8b5cf6, var(--secondary))', border: 'none', color: '#fff', marginTop: '4px', cursor: 'pointer' }}
          >
            Goodnight 🌙
          </button>
        </div>
      </div>
    </div>
  );
};
