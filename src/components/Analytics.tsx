import React, { useState } from 'react';
import { t } from '../utils/i18n';
import type { Transaction, CategoryType, Account } from '../types';

type MoodTimeframe = '7d' | '15d' | '1m' | '2m' | '5m' | '1y' | 'custom';

interface AnalyticsProps {
  transactions: Transaction[];
  currencySymbol: string;
  accounts?: Account[];
  currentProfileId: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ transactions = [], currencySymbol, accounts = [], currentProfileId }) => {
  const [timeframe, setTimeframe] = useState<'month' | 'all'>('month');
  const [userFilter, setUserFilter] = useState<'me' | 'partner' | 'couple'>('me');
  const [moodTimeframe, setMoodTimeframe] = useState<MoodTimeframe>('7d');
  const [moodStartDate, setMoodStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [moodEndDate, setMoodEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [todayMood, setTodayMood] = useState<string>(() => {
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    const moodLogs = JSON.parse(localStorage.getItem('zb_mood_logs') || '{}');
    return moodLogs[todayStr] || '';
  });

  const handleSelectMood = (mood: string) => {
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    const moodLogs = JSON.parse(localStorage.getItem('zb_mood_logs') || '{}');
    moodLogs[todayStr] = mood;
    localStorage.setItem('zb_mood_logs', JSON.stringify(moodLogs));
    setTodayMood(mood);

    if (typeof (window as any).confetti === 'function') {
      (window as any).confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const filteredTx = transactions.filter(t => {
    // 1. User Filter Check
    if (userFilter === 'me') {
      if (t.user_id && t.user_id !== currentProfileId) return false;
    } else if (userFilter === 'partner') {
      if (!t.user_id || t.user_id === currentProfileId) return false;
    }
    // if 'couple', we include all

    // 2. Timeframe Check
    if (timeframe === 'month') {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    }
    return true; // 'all'
  });

  const expenses = filteredTx.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryMeta: Record<CategoryType, { label: string; color: string; bg: string }> = {
    food: { label: 'Food', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    shopping: { label: 'Shopping', color: 'var(--secondary)', bg: 'rgba(20, 184, 166, 0.1)' },
    entertainment: { label: 'Entertainment', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    bills: { label: 'Bills', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    travel: { label: 'Travel', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
    health: { label: 'Health', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    other: { label: 'Other', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
  };

  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<CategoryType, number>);

  const breakdownData = Object.entries(categoryTotals)
    .map(([cat, total]) => ({
      category: cat as CategoryType,
      total,
      percentage: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
      meta: categoryMeta[cat as CategoryType] || categoryMeta.other
    }))
    .sort((a, b) => b.total - a.total);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const getWeeklyData = () => {
    const dailyExpenses: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const amt = transactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      dailyExpenses.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: amt
      });
    }
    return dailyExpenses;
  };

  const trendData = getWeeklyData();
  const maxTrendVal = Math.max(...trendData.map(d => d.amount), 50);

  const svgWidth = 340;
  const svgHeight = 120;
  const points = trendData.map((d, index) => {
    const x = (index / (trendData.length - 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - 20 - (d.amount / maxTrendVal) * (svgHeight - 40);
    return { x, y, label: d.date, value: d.amount };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - 15} L ${points[0].x} ${svgHeight - 15} Z`
    : '';

  // --- Money Streak ---
  const calculateStreak = () => {
    if (transactions.length === 0) return 0;
    // Average daily budget = total expenses / days with expenses, compare to daily
    const allExpenseDates = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.date))].sort().reverse();
    if (allExpenseDates.length === 0) return 0;
    const avgDailySpend = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) / Math.max(allExpenseDates.length, 1);
    const dailyLimit = avgDailySpend * 1.1; // 10% buffer as "budget"
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const daySpend = transactions.filter(t => t.date === dStr && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      if (daySpend <= dailyLimit) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };
  const streak = calculateStreak();



  const renderMoodTrend = () => {
    const moodLogs = JSON.parse(localStorage.getItem('zb_mood_logs') || '{}');
    let daysCount = 7;
    if (moodTimeframe === '15d') daysCount = 15;
    else if (moodTimeframe === '1m') daysCount = 30;
    else if (moodTimeframe === '2m') daysCount = 60;
    else if (moodTimeframe === '5m') daysCount = 150;
    else if (moodTimeframe === '1y') daysCount = 365;
    else if (moodTimeframe === 'custom') {
      if (moodStartDate && moodEndDate) {
        const start = new Date(moodStartDate);
        const end = new Date(moodEndDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } else {
        daysCount = 7;
      }
    }

    const days: { label: string; dStr: string; mood: string }[] = [];
    const today = new Date();

    if (moodTimeframe === 'custom' && moodStartDate && moodEndDate) {
      const start = new Date(moodStartDate);
      const end = new Date(moodEndDate);
      const current = new Date(start);
      // Limit to 365 days max to prevent memory crashes
      const safetyLimit = Math.min(365, daysCount);
      for (let i = 0; i < safetyLimit; i++) {
        if (current > end) break;
        const dStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const label = daysCount <= 15
          ? current.toLocaleDateString('en-US', { weekday: 'short' })
          : String(current.getDate());
        const mood = moodLogs[dStr] || '';
        days.push({ label, dStr, mood });
        current.setDate(current.getDate() + 1);
      }
    } else {
      for (let i = daysCount - 1; i >= 0; i--) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        const label = daysCount <= 15
          ? checkDate.toLocaleDateString('en-US', { weekday: 'short' })
          : String(checkDate.getDate());
        const mood = moodLogs[dStr] || '';
        days.push({ label, dStr, mood });
      }
    }

    const moodScoreMap: Record<string, number> = {
      '😀': 6, '😊': 6, '🤩': 6,
      '😍': 5,
      '😅': 4, '😌': 4, '😐': 4,
      '😔': 3, '😰': 3,
      '😡': 2,
      '😭': 1, '😢': 1
    };

    // SVG dimensions
    const svgW = 300;
    const svgH = 170;
    const padLeft = 28;
    const padRight = 12;
    const padTop = 30; // space for emoji labels above dots
    const padBottom = 22;
    const chartW = svgW - padLeft - padRight;
    const chartH = svgH - padTop - padBottom;

    const moodPoints = days.map((d, i) => {
      const x = padLeft + (days.length > 1 ? (i / (days.length - 1)) * chartW : chartW / 2);
      const score = moodScoreMap[d.mood] ?? (d.mood ? 4 : -1);
      // score = -1 means no data — draw at middle with low opacity
      const effectiveScore = score === -1 ? 4 : score;
      const y = padTop + chartH - ((effectiveScore - 1) / 5) * chartH;
      return { x, y, score, mood: d.mood, label: d.label, hasData: d.mood !== '' };
    });

    // Smooth cubic bezier path generator for trading graph appearance
    const getBezierPath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
      let dStr = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const curr = pts[i];
        const next = pts[i + 1];
        const cpX1 = curr.x + (next.x - curr.x) / 3;
        const cpY1 = curr.y;
        const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
        const cpY2 = next.y;
        dStr += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
      }
      return dStr;
    };

    // Only connect points that have real data
    const connectedPoints = moodPoints.filter(p => p.hasData);
    const pathD = getBezierPath(connectedPoints);

    // Insight: happiest + saddest day
    const scoredDays = moodPoints.filter(p => p.hasData);
    let happiestDay = '';
    let saddestDay = '';
    if (scoredDays.length > 0) {
      const sorted = [...scoredDays].sort((a, b) => b.score - a.score);
      happiestDay = sorted[0].label;
      saddestDay = sorted[sorted.length - 1].label;
    }

    const insightText = scoredDays.length === 0
      ? 'Log your mood daily to see your emotional trends!'
      : scoredDays.length === 1
      ? `You logged your mood today as ${scoredDays[0].mood}. Keep tracking daily for trends!`
      : happiestDay === saddestDay
      ? `You felt most ${scoredDays[0].mood} this period. Consistent emotional state!`
      : `You felt happiest on ${happiestDay} ${connectedPoints[0]?.mood ?? '😊'} and most stressed on ${saddestDay} ${connectedPoints[connectedPoints.length-1]?.mood ?? ''}. Try to plan self-care on tough days!`;

    const yAxisMoods = ['😀', '😍', '😅', '😔', '😡', '😭'];
    const yAxisScores = [6, 5, 4, 3, 2, 1];

    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-card)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border-card)' }}>

        {/* EMOTIONAL SPENDING TRACKER mood log */}
        <div style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-input)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>EMOTIONAL SPENDING TRACKER</span>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>How did spending make you feel today? Select mood to log:</p>
            </div>
            {todayMood && (
              <span style={{ fontSize: '18px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '4px 10px' }}>
                {todayMood}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
            {[
              { emoji: '😀', label: 'Happy' },
              { emoji: '😭', label: 'Sad' },
              { emoji: '😡', label: 'Angry' },
              { emoji: '😍', label: 'Excited' },
              { emoji: '😅', label: 'Relieved' },
              { emoji: '😔', label: 'Regretful' }
            ].map((item) => {
              const isSelected = todayMood === item.emoji;
              return (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => handleSelectMood(item.emoji)}
                  title={item.label}
                  style={{
                    flex: 1,
                    background: isSelected ? 'rgba(34,197,94,0.15)' : 'var(--bg-input)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                    borderRadius: '12px',
                    padding: '10px 4px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                  }}
                >
                  {item.emoji}
                </button>
              );
            })}
          </div>
          {todayMood && (
            <p style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600, margin: '8px 0 0', textAlign: 'center' }}>
              ✓ Mood logged: {todayMood} — Keep tracking daily!
            </p>
          )}
        </div>

        {/* Header + timeframe dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Mood Trend</h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Your emotional highs and lows</span>
          </div>
          <select
            value={moodTimeframe}
            onChange={e => setMoodTimeframe(e.target.value as MoodTimeframe)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              color: 'var(--text-primary)',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '8px 12px',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'auto'
            }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="15d">Last 15 Days</option>
            <option value="1m">Last 1 Month</option>
            <option value="2m">Last 2 Months</option>
            <option value="5m">Last 5 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom date range inputs */}
        {moodTimeframe === 'custom' && (
          <div style={{ display: 'flex', gap: '10px', background: 'var(--bg-input)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border-input)' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Start Date</span>
              <input
                type="date"
                value={moodStartDate}
                onChange={e => setMoodStartDate(e.target.value)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: '8px', fontSize: '11px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>End Date</span>
              <input
                type="date"
                value={moodEndDate}
                onChange={e => setMoodEndDate(e.target.value)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: '8px', fontSize: '11px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}

        {/* SVG Mood Chart */}
        <div style={{ position: 'relative', width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: '16px', padding: '8px 4px 4px', boxSizing: 'border-box', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH} style={{ overflow: 'visible' }}>
            <defs>
              <filter id="mood-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="mood-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines + emoji labels */}
            {yAxisScores.map((score, i) => {
              const gridY = padTop + chartH - ((score - 1) / 4) * chartH;
              return (
                <g key={score}>
                  <line x1={padLeft} y1={gridY} x2={svgW - padRight} y2={gridY} stroke="var(--border-input)" strokeDasharray="3 3" />
                  <text x={padLeft - 4} y={gridY + 5} textAnchor="end" style={{ fontSize: '14px' }}>{yAxisMoods[i]}</text>
                </g>
              );
            })}

            {/* Area fill */}
            {connectedPoints.length > 1 && (
              <path
                d={`${pathD} L ${connectedPoints[connectedPoints.length - 1].x} ${padTop + chartH} L ${connectedPoints[0].x} ${padTop + chartH} Z`}
                fill="url(#mood-area-grad)"
              />
            )}

            {/* Line */}
            {connectedPoints.length > 1 && (
              <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#mood-glow)" />
            )}

            {/* Dots + emoji labels above each dot */}
            {moodPoints.map((p, idx) => {
              const shouldShowLabel = daysCount <= 30 && p.hasData;
              const dotRadius = daysCount <= 30 ? (p.hasData ? 5 : 3) : (p.hasData ? 3 : 0);
              return (
                <g key={idx}>
                  {/* X axis label */}
                  {(daysCount <= 15 || idx % Math.ceil(daysCount / 10) === 0) && (
                    <text x={p.x} y={svgH - 4} textAnchor="middle" style={{ fontSize: daysCount <= 15 ? '10px' : '9px', fill: 'var(--text-secondary)', fontWeight: 600 }}>
                      {p.label}
                    </text>
                  )}
                  {p.hasData && (
                    <>
                      {/* Glow dot */}
                      {daysCount <= 30 && <circle cx={p.x} cy={p.y} r="8" fill="#22c55e" opacity="0.25" />}
                      <circle cx={p.x} cy={p.y} r={dotRadius} fill="#22c55e" filter="url(#mood-glow)" />
                      {daysCount <= 30 && <circle cx={p.x} cy={p.y} r="2.5" fill="#ffffff" />}
                      {/* Emoji above dot */}
                      {shouldShowLabel && (
                        <text x={p.x} y={p.y - 12} textAnchor="middle" style={{ fontSize: daysCount <= 15 ? '13px' : '10px' }}>
                          {p.mood}
                        </text>
                      )}
                    </>
                  )}
                  {!p.hasData && dotRadius > 0 && (
                    <circle cx={p.x} cy={p.y} r={dotRadius} fill="var(--border-input)" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Insight Card */}
        <div style={{
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '16px' }}>💡</span>
          </div>
          <div>
            <h5 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Insights</h5>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>{insightText}</p>
          </div>
        </div>
      </div>
    );
  };

  // Account Balance Distribution Donut Chart
  const renderAccountBalanceChart = () => {
    if (!accounts || accounts.length === 0) return null;

    const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    if (totalBalance <= 0) return null;

    const accountColors = [
      '#14b8a6', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899',
      '#22c55e', '#ef4444', '#06b6d4', '#f97316', '#a855f7'
    ];

    const accountData = accounts
      .filter(a => (a.balance || 0) > 0)
      .map((a, i) => {
        const isFamilyAcc = (a as any).isFamilyAccount;
        const ownerLabel = isFamilyAcc
          ? ((a as any).ownerName || 'Partner')
          : null;
        const displayName = a.name && a.name.trim() ? a.name.trim() : (isFamilyAcc ? 'Account' : 'Wallet');
        return {
          id: a.id,
          name: displayName,
          ownerLabel,
          isFamilyAcc,
          balance: a.balance || 0,
          percentage: Math.round(((a.balance || 0) / totalBalance) * 100),
          color: a.color || accountColors[i % accountColors.length]
        };
      })
      .sort((a, b) => b.balance - a.balance);

    if (accountData.length === 0) return null;

    // Build SVG donut segments
    const radius = 80;
    const cx = 100;
    const cy = 100;
    const strokeWidth = 22;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercent = 0;

    return (
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.02em' }}>
          💰 Account Balance Distribution
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          {/* Donut Chart */}
          <div style={{ position: 'relative', width: '180px', height: '180px', margin: '4px 0' }}>
            <svg width="100%" height="100%" viewBox="0 0 200 200">
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="var(--bg-input)"
                strokeWidth={strokeWidth}
              />
              {accountData.map((d) => {
                const dashArray = (d.percentage / 100) * circumference;
                const dashOffset = -(cumulativePercent / 100) * circumference;
                cumulativePercent += d.percentage;
                return (
                  <circle
                    key={d.id}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ transition: 'all 0.6s ease' }}
                  />
                );
              })}
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '124px',
              height: '124px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px'
            }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Total Balance</span>
              <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', letterSpacing: '-0.02em' }}>
                {currencySymbol}{totalBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Account Breakdown List */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {accountData.map(d => (
              <div 
                key={d.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-input)',
                  borderRadius: '14px',
                  transition: 'all 0.15s ease'
                }}
              >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: d.color,
                    boxShadow: `0 0 8px ${d.color}60`,
                    flexShrink: 0
                  }} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</span>
                      {d.ownerLabel ? (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: 'rgba(244, 114, 182, 0.15)',
                          color: '#f472b6',
                          border: '1px solid rgba(244,114,182,0.3)',
                          letterSpacing: '0.02em'
                        }}>
                          👫 {d.ownerLabel}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56,189,248,0.2)',
                          letterSpacing: '0.02em'
                        }}>
                          👤 You
                        </span>
                      )}
                    </div>
                    {/* Mini Progress Bar */}
                    <div style={{ width: '60px', height: '3px', borderRadius: '2px', background: 'var(--border-card)', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${d.percentage}%`, height: '100%', background: d.color, borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currencySymbol}{d.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    padding: '3px 8px',
                    borderRadius: '8px',
                    background: `${d.color}15`,
                    color: d.color,
                    border: `1px solid ${d.color}30`
                  }}>
                    {d.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px' }} className="animate-fade-in">

      {/* Header + Timeframe Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          {t('analytics_title')}
        </h2>
        <div style={{ display: 'flex', background: 'var(--bg-dark)', border: '1px solid var(--border-card)', padding: '3px', borderRadius: '12px' }}>
          <button 
            onClick={() => setTimeframe('month')}
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: timeframe === 'month' ? 'var(--primary)' : 'transparent',
              color: timeframe === 'month' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: timeframe === 'month' ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            This Month
          </button>
          <button 
            onClick={() => setTimeframe('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: timeframe === 'all' ? 'var(--primary)' : 'transparent',
              color: timeframe === 'all' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: timeframe === 'all' ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Money Streak */}
      <div className="glass-panel" style={{
        background: 'var(--bg-card)',
        borderRadius: '24px',
        padding: '22px 24px',
        border: '1px solid var(--border-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--glow-shadow)'
      }}>
        <div>
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Money Streak 🔥
          </span>
          <p style={{ fontSize: '34px', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 2px', fontFamily: "'Manrope', sans-serif", letterSpacing: '-0.02em' }}>
            {streak} Days
          </p>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Consecutive days under budget
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end', marginBottom: '4px' }}>
            {['🔥','🔥','🔥'].map((f, i) => (
              <span key={i} style={{ fontSize: '24px', opacity: streak >= (i + 1) * 3 ? 1 : 0.25 }}>{f}</span>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 800 }}>
            {streak >= 7 ? '7 Day Goal Hit! 🏆' : streak >= 3 ? 'Keep it up! ⚡' : 'Build your streak! 🌱'}
          </span>
        </div>
      </div>

      {/* Account Balance Distribution */}
      {renderAccountBalanceChart()}

      {/* SVG Daily Expense Trend */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: '24px',
        padding: '22px',
        boxShadow: 'var(--glow-shadow)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>
              {t('trend_analysis')}
            </span>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
              {t('last_7_days')}
            </h4>
          </div>
          <span style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--primary)',
            background: 'rgba(16, 185, 129, 0.12)',
            padding: '4px 10px',
            borderRadius: '10px'
          }}>
            Avg: {currencySymbol}{(trendData.reduce((sum, d) => sum + d.amount, 0) / 7).toFixed(0)}/day
          </span>
        </div>

        {/* Clean SVG Line Chart */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="20" y1="20" x2={svgWidth - 20} y2="20" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
            <line x1="20" y1="60" x2={svgWidth - 20} y2="60" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
            <line x1="20" y1="100" x2={svgWidth - 20} y2="100" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />

            {/* Area under line */}
            {points.length > 0 && (
              <path d={areaPath} fill="url(#chart-glow)" />
            )}

            {/* Line Path */}
            {points.length > 0 && (
              <path 
                d={linePath} 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}

            {/* Glowing Points & Dynamic Amount Badges Above Dots */}
            {points.map((p, i) => (
              <g key={i}>
                <text
                  x={p.x}
                  y={Math.max(12, p.y - 9)}
                  fill="var(--text-primary)"
                  fontSize="9.5"
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {currencySymbol}{Math.round(p.value).toLocaleString()}
                </text>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="5" 
                  fill="#ffffff" 
                  stroke="var(--primary)" 
                  strokeWidth="3" 
                />
              </g>
            ))}

            {/* Labels */}
            {points.map((p, i) => (
              <text 
                key={i} 
                x={p.x} 
                y={svgHeight - 2} 
                fill="var(--text-secondary)" 
                fontSize="10" 
                fontWeight="700"
                textAnchor="middle"
              >
                {p.label}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Donut Chart and List */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--glow-shadow)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', alignSelf: 'flex-start', margin: 0 }}>
          {t('category_breakdown')}
        </h3>

        {totalExpense === 0 ? (
          <div style={{ padding: '30px 0', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>
            No expense data available for this range.
          </div>
        ) : (
          <>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '170px', height: '170px', margin: '4px auto 10px', display: 'flex', justifyContent: 'center' }}>
              <svg width="170" height="170" viewBox="0 0 170 170" style={{ display: 'block' }}>
                <circle 
                  cx="85" 
                  cy="85" 
                  r="64" 
                  fill="none" 
                  stroke="var(--bg-input)" 
                  strokeWidth="16" 
                />
                
                {breakdownData.map((d) => {
                  const catRadius = 64;
                  const catCircumference = 2 * Math.PI * catRadius;
                  const percent = (d.total / totalExpense) * 100;
                  const strokeDashoffset = catCircumference - (catCircumference * percent) / 100;
                  const rotation = (accumulatedPercent / 100) * 360 - 90;
                  accumulatedPercent += percent;

                  return (
                    <circle 
                      key={d.category}
                      cx="85" 
                      cy="85" 
                      r={catRadius} 
                      fill="none" 
                      stroke={d.meta.color} 
                      strokeWidth="16" 
                      strokeDasharray={catCircumference}
                      strokeDashoffset={strokeDashoffset}
                      transform={`rotate(${rotation} 85 85)`}
                      style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />
                  );
                })}
              </svg>
              
              {/* Inner Label Card */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '102px',
                height: '102px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                border: '1px solid var(--border-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}>
                <span style={{ fontSize: '9px', letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Total Spent</span>
                <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', letterSpacing: '-0.02em' }}>
                  {currencySymbol}{totalExpense.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Breakdown List Cards */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {breakdownData.map((d) => (
                <div 
                  key={d.category} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '14px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      backgroundColor: d.meta.color,
                      boxShadow: `0 0 8px ${d.meta.color}60`
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{d.meta.label}</span>
                      {/* Mini Progress Bar */}
                      <div style={{ width: '60px', height: '3px', borderRadius: '2px', background: 'var(--border-card)', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${d.percentage}%`, height: '100%', background: d.meta.color, borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {currencySymbol}{d.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      padding: '3px 8px',
                      borderRadius: '8px',
                      background: `${d.meta.color}15`,
                      color: d.meta.color,
                      border: `1px solid ${d.meta.color}30`
                    }}>
                      {d.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Emotional Spending Mood Trend */}
      {renderMoodTrend()}

    </div>
  );
};
