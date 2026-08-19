import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Flame, 
  Music, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  MessageCircle
} from 'lucide-react';
import type { Transaction, CategoryBudget } from '../types';
import confetti from 'canvas-confetti';
import { t } from '../utils/i18n';

interface PremiumHubProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  currencySymbol: string;
  userName: string;
  todaysLimit?: number;
}

export const PremiumHub: React.FC<PremiumHubProps> = ({
  transactions,
  budgets,
  currencySymbol,
  userName,
  todaysLimit: todaysLimitProp
}) => {
  // 1. STATE & DERIVATIONS
  const [showWrappedModal, setShowWrappedModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [activeStorySlide, setActiveStorySlide] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [audio] = useState(() => {
    const a = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    a.loop = true;
    return a;
  });

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      audio.pause();
    };
  }, [audio]);

  const toggleMusic = () => {
    if (isPlayingMusic) {
      audio.pause();
      setIsPlayingMusic(false);
    } else {
      audio.play().catch(() => {});
      setIsPlayingMusic(true);
    }
  };

  // 2. DYNAMIC CALCULATION FOR MONEY STREAKS (Under Budget Days)
  const calculateMoneyStreak = () => {
    // Let's check budget limits vs daily expenses for the last 30 days
    const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0) || 500;
    const dailyLimit = Math.ceil(totalLimit / 30);
    
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dStr = checkDate.toISOString().split('T')[0];
      const dayExpenses = transactions
        .filter(t => t.date === dStr && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (dayExpenses <= dailyLimit) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
    return streak;
  };
  const streakCount = calculateMoneyStreak();

  // 3. AI FUTURE PREDICTIONS (VELOCITY WARNINGS)
  const getVelocityDetails = () => {
    const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0) || 15000;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get month's expenses
    const monthlyExpenses = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    if (monthlyExpenses <= 500 || totalLimit === 0) {
      return { status: 'safe', msg: 'Budget speed is normal. Keep it up! 👍' };
    }
    
    const dailyVelocity = monthlyExpenses / dayOfMonth;
    const predictedTotal = dailyVelocity * daysInMonth;
    
    if (predictedTotal > totalLimit && monthlyExpenses > totalLimit * 0.3) {
      const runOutDays = Math.max(1, Math.floor((totalLimit - monthlyExpenses) / dailyVelocity));
      const runOutDate = new Date();
      runOutDate.setDate(now.getDate() + runOutDays);
      const formattedDate = runOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { 
        status: 'danger', 
        msg: `Warning: Spending velocity is high! Your budget will run out by ${formattedDate}. 🚨` 
      };
    } else if (predictedTotal > totalLimit * 0.8) {
      return { status: 'warning', msg: 'Caution: Spending speed is close to exceeding your budget limit.' };
    }
    
    return { status: 'safe', msg: 'Budget velocity is optimal. Safe zone.' };
  };
  const velocity = getVelocityDetails();

  // 4. WEEKLY "MY MONEY WRAPPED" CALCULATOR
  const getWeeklyWrapped = () => {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= oneWeekAgo && d <= today;
    });

    const spent = weeklyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const saved = Math.max(0, (budgets.reduce((s, b) => s + b.limit, 0) / 4.3) - spent);
    
    // Top category
    const catMap: Record<string, number> = {};
    weeklyTx.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCatEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCatEntry ? topCatEntry[0] : 'None';
    
    // Best day (lowest spending)
    const dayMap: Record<string, number> = {};
    weeklyTx.filter(t => t.type === 'expense').forEach(t => {
      const dayName = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayMap[dayName] = (dayMap[dayName] || 0) + t.amount;
    });
    const bestDayEntry = Object.entries(dayMap).sort((a, b) => a[1] - b[1])[0];
    const bestDay = bestDayEntry ? bestDayEntry[0] : 'Sunday';

    const score = Math.max(10, Math.min(100, Math.round(100 - (spent / (spent + saved || 1)) * 40)));

    return { spent, saved, score, topCategory, bestDay };
  };
  const wrapped = getWeeklyWrapped();

  const generateWrappedCardBlob = async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Premium Dark Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 900);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#09090f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 900);

    // Decorative Glow Orbs
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 200, 180, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(450, 700, 200, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
    ctx.fill();
    ctx.restore();

    // Brand Header
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'center';
    ctx.fillText('ZenBudget 🌿', 300, 75);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText('WEEKLY MONEY WRAPPED 🎁', 300, 105);

    // Zen Money Score Ring
    ctx.beginPath();
    ctx.arc(300, 260, 85, 0, Math.PI * 2);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ZEN MONEY SCORE', 300, 230);

    ctx.font = 'bold 60px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${wrapped.score}`, 300, 282);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText(wrapped.score >= 80 ? 'Master Saver 🏆' : (wrapped.score >= 50 ? 'Balanced Saver 🌱' : 'On The Way 🚀'), 300, 380);

    // Main Card Container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(60, 420, 480, 360, 24);
    ctx.fill();
    ctx.stroke();

    // Card Stats
    ctx.textAlign = 'left';
    
    // Total Spent
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TOTAL SPENT THIS WEEK', 90, 470);
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${currencySymbol}${wrapped.spent.toLocaleString()}`, 90, 508);

    // Saved This Week
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SAVED THIS WEEK', 90, 560);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`${currencySymbol}${Math.round(wrapped.saved).toLocaleString()}`, 90, 595);

    // Top Category & Best Day Row
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TOP SPEND CATEGORY', 90, 650);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${wrapped.topCategory}`, 90, 680);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('BEST DAY', 330, 650);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`${wrapped.bestDay}`, 330, 680);

    // Watermark
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('POWERED BY ZENBUDGET • BEST EXPENSE TRACKER APP', 300, 750);

    // Footer links
    ctx.font = '500 12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('zenbudget-tracker.vercel.app', 300, 840);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const handleShare = async (platform: 'whatsapp' | 'x' | 'instagram') => {
    const text = `📊 My Weekly Money Wrapped on ZenBudget:\n\n• Spent: ${currencySymbol}${wrapped.spent}\n• Saved: ${currencySymbol}${Math.round(wrapped.saved)}\n• Money Score: ${wrapped.score}/100\n• Top Category: ${wrapped.topCategory}\n• Best Day: ${wrapped.bestDay}\n\nPowered by ZenBudget ✨\n🔗 Join Web App: https://zenbudget-tracker.vercel.app/\n📦 Download Android App (.apk): https://zenbudget-tracker.vercel.app/zenbudget.apk`;
    
    // 1. Generate Canvas Story Card Image
    const blob = await generateWrappedCardBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ZenBudget_Weekly_Wrapped.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // 2. Try Native Web Share API with image file if supported
    if (navigator.share && blob) {
      try {
        const file = new File([blob], 'ZenBudget_Weekly_Wrapped.png', { type: 'image/png' });
        await navigator.share({ title: 'My Weekly ZenBudget Wrapped', text: text, files: [file] });
        return;
      } catch (_) {}
    }

    // 3. Fallback clipboard & direct platform app launch
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {}

    const targetName = platform === 'whatsapp' ? 'WhatsApp' : platform === 'instagram' ? 'Instagram' : 'X (Twitter)';
    const notice = document.createElement('div');
    notice.innerHTML = `🖼️ <b>Story Card Image downloaded & stats copied!</b> Opening ${targetName}...`;
    notice.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#ec4899;color:#fff;padding:12px 20px;border-radius:99px;font-size:13px;font-weight:700;z-index:99999;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
    document.body.appendChild(notice);
    setTimeout(() => { try { document.body.removeChild(notice); } catch(_) {} }, 3500);

    const encodedText = encodeURIComponent(text);
    if (platform === 'whatsapp') {
      const nativeUrl = `whatsapp://send?text=${encodedText}`;
      const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.location.href = nativeUrl;
      setTimeout(() => { window.open(webUrl, '_blank'); }, 1200);
    } else if (platform === 'x') {
      const nativeUrl = `twitter://post?message=${encodedText}`;
      const webUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
      window.location.href = nativeUrl;
      setTimeout(() => { window.open(webUrl, '_blank'); }, 1200);
    } else if (platform === 'instagram') {
      window.location.href = 'instagram://camera';
      setTimeout(() => { window.open('https://instagram.com', '_blank'); }, 1200);
    }
  };

  // 5. EMOTIONAL SPENDING MOOD MATRIX — moved to Analytics.tsx (Stats tab)

  // 6. DAILY AI MONEY COACH INSIGHT
  const getCoachInsightDetails = () => {
    const currentHour = new Date().getHours();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpenses = transactions.filter(t => t.date === todayStr && t.type === 'expense');
    const todaySpent = todayExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Calculate smart limit
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthlyTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyExpenses = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const effectiveMonthlyBudget = budgets.reduce((s, b) => s + b.limit, 0);
    const remainingBudget = Math.max(0, effectiveMonthlyBudget - (monthlyExpenses - todaySpent));
    const remainingDays = Math.max(1, daysInMonth - dayOfMonth + 1);
    const savedCentralLimit = parseInt(localStorage.getItem('zb_today_smart_limit') || '0', 10);
    const todaysLimit = todaysLimitProp || savedCentralLimit || Math.round(remainingBudget / remainingDays) || 500;

    let title = 'AI Money Coach (Nightly Brief)';
    let text = '';

    if (currentHour >= 5 && currentHour < 12) {
      title = 'AI Money Coach (Morning Brief)';
      text = `Good morning, ${userName}! Today's smart spending limit is ${currencySymbol}${todaysLimit.toLocaleString()}. Let's spend mindfully and track all transactions! ☀️`;
    } else if (currentHour >= 12 && currentHour < 17) {
      title = 'AI Money Coach (Mid-day Update)';
      if (todaySpent === 0) {
        text = `Good afternoon, ${userName}! You've spent ${currencySymbol}0 so far. Excellent discipline! Keep it up. 🌤️`;
      } else {
        text = `Good afternoon, ${userName}! You've spent ${currencySymbol}${Math.round(todaySpent).toLocaleString()} so far. You have ${currencySymbol}${Math.max(0, todaysLimit - todaySpent).toLocaleString()} remaining for today. 🌤️`;
      }
    } else {
      title = 'AI Money Coach (Nightly Brief)';
      if (todayExpenses.length === 0) {
        text = `Good evening, ${userName}! You spent ${currencySymbol}0 today. Avoid daily impulse buys to stay aligned with your monthly goals. 🌙`;
      } else {
        const topExp = [...todayExpenses].sort((a, b) => b.amount - a.amount)[0];
        const savingsPotential = topExp.amount * 30;
        text = `You spent ${currencySymbol}${Math.round(topExp.amount).toLocaleString()} on ${topExp.category} today. Avoid this tomorrow to save ${currencySymbol}${Math.round(savingsPotential).toLocaleString()} by month-end. 💡`;
      }
    }

    return { title, text };
  };
  const coachInsight = getCoachInsightDetails();

  // renderMoodHeatmap — moved to Analytics.tsx (Stats tab)



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* AI Velocity Alert Banner */}
      {velocity.status !== 'safe' && (
        <div style={{ 
          background: velocity.status === 'danger' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', 
          border: `1px solid ${velocity.status === 'danger' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`, 
          borderRadius: '16px', 
          padding: '12px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          textAlign: 'left'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: velocity.status === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle color={velocity.status === 'danger' ? '#ef4444' : '#f59e0b'} size={18} />
          </div>
          <span style={{ 
            fontSize: '13px', 
            color: velocity.status === 'danger' ? '#ef4444' : '#d97706', 
            fontWeight: 700,
            lineHeight: 1.4
          }}>
            {velocity.msg}
          </span>
        </div>
      )}

      {/* Gamified Streaks Card */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={22} color="#f59e0b" className="animate-pulse" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {t('days_under_budget').replace('{{days}}', String(streakCount))}
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
              {t('streak_sub')}
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          fontSize: '11px',
          fontWeight: 800,
          background: 'rgba(245,158,11,0.15)',
          color: '#f59e0b',
          padding: '8px 14px',
          borderRadius: '20px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          lineHeight: '1'
        }}>
          {t('streak_active')}
        </div>
      </div>

      {/* AI Money Coach Daily Box */}
      <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-card)', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>
            {coachInsight.title}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
          "{coachInsight.text}"
        </p>
      </div>

      {/* Action Buttons: Wrapped & Spotify Story */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button 
          onClick={() => { setShowWrappedModal(true); confetti({ particleCount: 80, spread: 60 }); }}
          style={{ padding: '16px', borderRadius: '18px', border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#ffffff', fontSize: '12px', fontWeight: 800, cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
        >
          <span>🎁</span>
          <span style={{ color: '#ffffff' }}>{t('weekly_money_wrapped')}</span>
        </button>

        <button 
          onClick={() => { setShowStoryModal(true); setActiveStorySlide(0); }}
          style={{ padding: '16px', borderRadius: '18px', border: 'none', background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)', color: '#ffffff', fontSize: '12px', fontWeight: 800, cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(236,72,153,0.3)' }}
        >
          <span>🎵</span>
          <span style={{ color: '#ffffff' }}>{t('monthly_story_spotify')}</span>
        </button>
      </div>

      {/* Emotional Spending Tracker moved to Stats tab */}

      {/* ── WEEKLY WRAPPED MODAL ── */}
      {showWrappedModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowWrappedModal(false)}>
          <div style={{ width: '100%', maxWidth: '360px', background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '32px', padding: '24px', textAlign: 'center', position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '17px', color: 'var(--primary)', fontWeight: 900, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly Wrapped 🎁</h3>
            
            {/* Watermark Shareable Card */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: '24px', padding: '20px', position: 'relative', marginBottom: '20px', textAlign: 'left', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
              
              {/* Watermark Logo */}
              <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                POWERED BY ZENBUDGET
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-input)', paddingBottom: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Weekly Summary</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Past 7 Days</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>TOTAL SPENT</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>{currencySymbol}{wrapped.spent}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>SAVED THIS WEEK</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--success)' }}>{currencySymbol}{Math.round(wrapped.saved)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>ZEN MONEY SCORE</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>{wrapped.score}/100</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>TOP CATEGORY</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{wrapped.topCategory}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>BEST DAY</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{wrapped.bestDay}</span>
                </div>
              </div>
            </div>

            {/* Sharing Platform Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => handleShare('whatsapp')} style={{ padding: '13px', borderRadius: '14px', border: 'none', background: '#25D366', color: '#ffffff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)' }}>
                <MessageCircle size={16} /> Share to WhatsApp
              </button>
              <button onClick={() => handleShare('x')} style={{ padding: '13px', borderRadius: '14px', border: 'none', background: '#14171a', color: '#ffffff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff' }}>𝕏</span> <span style={{ color: '#ffffff' }}>Share to X (Twitter)</span>
              </button>
              <button onClick={() => handleShare('instagram')} style={{ padding: '13px', borderRadius: '14px', border: 'none', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: '#ffffff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 39, 67, 0.3)' }}>
                <span style={{ fontSize: '14px' }}>📸</span> <span style={{ color: '#ffffff' }}>Share to Instagram</span>
              </button>
              <button onClick={() => setShowWrappedModal(false)} style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── SPOTIFY STYLE STORY MODAL ── */}
      {showStoryModal && createPortal(
        <div 
          className="story-modal-overlay"
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: activeStorySlide === 0 
              ? 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)'
              : activeStorySlide === 1
                ? 'linear-gradient(180deg, #14532d 0%, #064e3b 100%)'
                : 'linear-gradient(180deg, #701a75 0%, #3b0764 100%)',
            zIndex: 9999999, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            padding: '24px 20px 32px',
            transition: 'background 0.5s ease',
            color: '#ffffff'
          }}
        >
          {/* Audio music controller & close button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <button onClick={toggleMusic} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '30px', padding: '8px 16px', color: '#ffffff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 800 }}>
              <Music size={14} className={isPlayingMusic ? 'animate-spin' : ''} />
              {isPlayingMusic ? 'Music: ON 🎵' : 'Music: OFF'}
            </button>
            <button onClick={() => { setShowStoryModal(false); audio.pause(); setIsPlayingMusic(false); }} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#ffffff', cursor: 'pointer', fontWeight: 900, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>

          {/* Progress Indicators */}
          <div style={{ display: 'flex', gap: '6px', margin: '14px 0' }}>
            {[0, 1, 2].map(idx => (
              <div key={idx} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: idx <= activeStorySlide ? '#22c55e' : 'rgba(255,255,255,0.25)', transition: 'background-color 0.3s ease' }} />
            ))}
          </div>

          {/* Slide Content Area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
            {activeStorySlide === 0 && (
              <div className="animate-fade-in" style={{ color: '#ffffff' }}>
                <span style={{ fontSize: '72px', display: 'block', marginBottom: '20px' }}>📊</span>
                <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#ffffff', marginBottom: '12px', letterSpacing: '-0.02em' }}>Your Month in Review</h2>
                <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, maxWidth: '320px', margin: '0 auto', lineHeight: 1.5 }}>Let's see where your hard-earned money went this month...</p>
              </div>
            )}

            {activeStorySlide === 1 && (
              <div className="animate-fade-in" style={{ color: '#ffffff' }}>
                <span style={{ fontSize: '72px', display: 'block', marginBottom: '20px' }}>🛍️</span>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>Top Spending Category</h2>
                <p style={{ fontSize: '36px', fontWeight: 900, color: '#4ade80', marginBottom: '12px', letterSpacing: '-0.01em' }}>
                  {wrapped.topCategory}
                </p>
                <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, maxWidth: '320px', margin: '0 auto', lineHeight: 1.5 }}>You spent a significant portion on this category. Balance it next month!</p>
              </div>
            )}

            {activeStorySlide === 2 && (
              <div className="animate-fade-in" style={{ color: '#ffffff' }}>
                <span style={{ fontSize: '72px', display: 'block', marginBottom: '20px' }}>🌱</span>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>Zen Money Score</h2>
                <p style={{ fontSize: '64px', fontWeight: 900, color: '#4ade80', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  {wrapped.score}/100
                </p>
                <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, maxWidth: '320px', margin: '0 auto', lineHeight: 1.5 }}>Excellent! You have maintained a stable spending control. Keep it up!</p>
              </div>
            )}
          </div>

          {/* Story Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 10px', zIndex: 10 }}>
            <button 
              disabled={activeStorySlide === 0}
              onClick={() => setActiveStorySlide(prev => prev - 1)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', color: '#ffffff', opacity: activeStorySlide === 0 ? 0.3 : 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={28} />
            </button>

            {activeStorySlide === 2 ? (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`My Zen Money Score is ${wrapped.score}/100! Calculated by ZenBudget.`);
                  window.open('https://instagram.com', '_blank');
                }}
                style={{ padding: '14px 28px', borderRadius: '30px', border: 'none', background: 'linear-gradient(to right, #10b981, #14b8a6)', color: '#ffffff', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)' }}
              >
                Share to Instagram Stories 📸
              </button>
            ) : (
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 800 }}>Slide {activeStorySlide + 1} of 3</span>
            )}

            <button 
              disabled={activeStorySlide === 2}
              onClick={() => setActiveStorySlide(prev => prev + 1)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', color: '#ffffff', opacity: activeStorySlide === 2 ? 0.3 : 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
