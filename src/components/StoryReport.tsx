import React, { useState, useEffect } from 'react';
import { X, Award, Coffee, TrendingDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Transaction, CategoryBudget } from '../types';

interface StoryReportProps {
  onClose: () => void;
  transactions: Transaction[];
  currencySymbol: string;
  trialStartDate?: string;
  budgets?: CategoryBudget[];
}

export const StoryReport: React.FC<StoryReportProps> = ({ onClose, transactions, currencySymbol, trialStartDate = '', budgets = [] }) => {
  const [slide, setSlide] = useState(0);

  // Real weekly data calculations
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Calculate week number relative to registration or earliest transaction date
  let startDate = new Date(trialStartDate || new Date().toISOString());
  if (transactions.length > 0) {
    const txDates = transactions.map(t => new Date(t.date).getTime());
    const earliestTxTime = Math.min(...txDates);
    const earliestTxDate = new Date(earliestTxTime);
    if (earliestTxDate < startDate) {
      startDate = earliestTxDate;
    }
  }
  // Normalize both dates to local midnight to avoid fractional day issues
  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = nowDateOnly.getTime() - startDateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.max(1, Math.floor(diffDays / 7) + 1);

  const weeklyTransactions = transactions.filter(t => new Date(t.date) >= weekAgo);
  const weeklyExpenses = weeklyTransactions.filter(t => t.type === 'expense');
  const weeklyIncome = weeklyTransactions.filter(t => t.type === 'income');

  const spent = weeklyExpenses.reduce((sum, t) => sum + t.amount, 0);
  const earned = weeklyIncome.reduce((sum, t) => sum + t.amount, 0);
  const saved = Math.max(0, earned - spent);

  // Best day (least spending)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daySpending: Record<number, number> = {};
  weeklyExpenses.forEach(t => {
    const day = new Date(t.date).getDay();
    daySpending[day] = (daySpending[day] || 0) + t.amount;
  });
  
  let bestDay = 'N/A';
  let minSpend = Infinity;
  for (const [day, amount] of Object.entries(daySpending)) {
    if (amount < minSpend) {
      minSpend = amount;
      bestDay = dayNames[parseInt(day)];
    }
  }
  if (Object.keys(daySpending).length === 0) bestDay = dayNames[now.getDay()];

  // Worst category (highest spending)
  const categorySpending: Record<string, number> = {};
  weeklyExpenses.forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
  });
  let worstCategory = 'None';
  let maxCatSpend = 0;
  for (const [cat, amount] of Object.entries(categorySpending)) {
    if (amount > maxCatSpend) {
      maxCatSpend = amount;
      worstCategory = cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  }

  // Potential saving = 20% of worst category spending
  const potentialSaving = Math.round(maxCatSpend * 0.2);

  // Real Weekly & Monthly Zen Money Score calculation
  const getMonthlyZenScore = () => {
    let calculatedScore = 75;
    
    // 1. Monthly budget check
    let overspentCount = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTxs = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });

    budgets.forEach(b => {
      const spentMonthly = monthlyTxs
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      if (spentMonthly > b.limit) {
        overspentCount++;
      }
    });
    calculatedScore -= overspentCount * 15;

    // 2. Monthly Savings Rate check
    const monthlyIncome = monthlyTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = monthlyTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const monthlySavingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    if (monthlySavingsRate > 20) {
      calculatedScore += 20;
    } else if (monthlySavingsRate > 0) {
      calculatedScore += 10;
    } else if (monthlySavingsRate < 0) {
      calculatedScore -= 10;
    }

    if (monthlyIncome === 0 && monthlyExpenses > 0) {
      calculatedScore -= 40;
    } else if (monthlyExpenses > monthlyIncome) {
      const overspendRatio = monthlyExpenses / monthlyIncome;
      if (overspendRatio >= 2) calculatedScore -= 60;
      else if (overspendRatio >= 1.5) calculatedScore -= 40;
      else calculatedScore -= 25;
    }
    
    const totalMonthlyBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    if (totalMonthlyBudget > 0 && monthlyExpenses > totalMonthlyBudget) {
      const budgetOverspendRatio = monthlyExpenses / totalMonthlyBudget;
      if (budgetOverspendRatio >= 2) calculatedScore -= 50;
      else if (budgetOverspendRatio >= 1.5) calculatedScore -= 30;
      else calculatedScore -= 20;
    }

    // 3. Monthly Mood adjustments
    const negativeMoodCount = monthlyTxs.filter(t => 
      t.notes && (t.notes.includes('Regret') || t.notes.includes('Stressed') || t.notes.includes('Regret/Sad'))
    ).length;
    calculatedScore -= negativeMoodCount * 3;

    return Math.max(10, Math.min(100, calculatedScore));
  };

  const generateStoryCardBlob = async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark Mobile Outer Background
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, 720, 1280);

    // Phone Frame Container (Rounded Screen)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(24, 24, 672, 1232, 40);
    ctx.clip();

    // App Dark Glass Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1280);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#090d16');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(24, 24, 672, 1232);

    // Status Bar Header (Real Dynamic Phone Look)
    const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    ctx.font = '600 15px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText(currentTimeStr, 54, 62);

    ctx.textAlign = 'right';
    ctx.fillText('5G ⚡ 92% 🔋', 666, 62);

    // Camera Punch Hole Notch
    ctx.beginPath();
    ctx.arc(360, 58, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // App Bar Header
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'center';
    ctx.fillText('ZenBudget 🌿', 360, 115);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('OFFICIAL FINANCIAL WRAPPED SCREENSHOT', 360, 138);

    // Subtle Glow Circle
    ctx.beginPath();
    ctx.arc(360, 320, 140, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
    ctx.fill();

    // Zen Score Ring
    ctx.beginPath();
    ctx.arc(360, 320, 95, 0, Math.PI * 2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ZEN SCORE', 360, 280);

    ctx.font = 'bold 72px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${score}`, 360, 345);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText(score >= 80 ? 'Master Saver 🏆' : (score >= 50 ? 'Balanced Saver 🌱' : 'On The Way 🚀'), 360, 455);

    // Main Stats Phone Card Panel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(60, 490, 600, 480, 24);
    ctx.fill();
    ctx.stroke();

    // Row 1: Total Spent & Saved
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TOTAL SPENT THIS WEEK', 90, 535);
    ctx.fillText('TOTAL SAVED THIS WEEK', 380, 535);

    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`${currencySymbol}${spent.toLocaleString()}`, 90, 575);

    ctx.fillStyle = '#22c55e';
    ctx.fillText(`${currencySymbol}${saved.toLocaleString()}`, 380, 575);

    // Visual Progress Bar on Canvas Card
    const spendRatio = earned > 0 ? Math.min(1, spent / earned) : (spent > 0 ? 1 : 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(90, 600, 540, 10, 5);
    ctx.fill();

    ctx.fillStyle = spendRatio > 0.8 ? '#ef4444' : '#22c55e';
    ctx.beginPath();
    ctx.roundRect(90, 600, Math.max(15, Math.min(540, 540 * spendRatio)), 10, 5);
    ctx.fill();

    // Divider Line
    ctx.beginPath();
    ctx.moveTo(90, 635);
    ctx.lineTo(630, 635);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Row 2: Best Day & Top Category
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('BEST DAY (LEAST SPENT)', 90, 675);
    ctx.fillText('TOP SPENDING CATEGORY', 380, 675);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(bestDay, 90, 715);

    ctx.fillStyle = '#f87171';
    ctx.fillText(worstCategory, 380, 715);

    // Divider Line 2
    ctx.beginPath();
    ctx.moveTo(90, 755);
    ctx.lineTo(630, 755);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Row 3: Potential Saving & Habit Tip
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SMART POTENTIAL SAVING', 90, 800);

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`${currencySymbol}${potentialSaving.toLocaleString()}`, 90, 840);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('💡 Tip: Cut discretionary spending by 20%', 90, 885);

    // Bottom Watermark App Badge
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ZenBudget • Smart Expense & Money Tracker', 360, 1030);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('📦 Download Official App: https://zenbudget-tracker.vercel.app/zenbudget.apk', 360, 1060);

    ctx.restore();

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/png');
    });
  };

  const getRealZenScore = () => {
    if (transactions.length === 0) return 50;
    if (weeklyTransactions.length === 0) return getMonthlyZenScore();

    let calculatedScore = 100; // start from 100

    // Factor 1: No income but spent = heavy penalty
    if (earned === 0 && spent > 0) {
      calculatedScore -= 60;
    } else if (earned > 0) {
      const ratio = spent / earned;
      if (ratio >= 2)        calculatedScore -= 70;
      else if (ratio >= 1.5) calculatedScore -= 55;
      else if (ratio >= 1.2) calculatedScore -= 40;
      else if (ratio >= 1)   calculatedScore -= 25;
      else if (ratio >= 0.8) calculatedScore -= 10;
      else if (ratio < 0.5)  calculatedScore += 5;
    }

    // Factor 2: Budget overspend
    const totalWeeklyBudget = budgets.reduce((sum, b) => sum + (b.limit / 4), 0);
    if (totalWeeklyBudget > 0 && spent > totalWeeklyBudget) {
      const overRatio = spent / totalWeeklyBudget;
      if (overRatio >= 2)       calculatedScore -= 40;
      else if (overRatio >= 1.5) calculatedScore -= 25;
      else                       calculatedScore -= 15;
    }

    // Factor 3: Per-category overspend
    let overspentCount = 0;
    budgets.forEach(b => {
      const weeklyLimit = b.limit / 4;
      const spentThisWeek = weeklyExpenses.filter(t => t.category === b.category).reduce((sum, t) => sum + t.amount, 0);
      if (spentThisWeek > weeklyLimit) overspentCount++;
    });
    calculatedScore -= overspentCount * 8;

    // Factor 4: Mood
    const negativeMoodCount = weeklyTransactions.filter(t =>
      t.notes && (t.notes.includes('Regret') || t.notes.includes('Stressed') || t.notes.includes('Regret/Sad'))
    ).length;
    calculatedScore -= negativeMoodCount * 3;

    // Factor 5: Savings bonus
    const weeklySavingsRate = earned > 0 ? ((earned - spent) / earned) * 100 : 0;
    if (weeklySavingsRate > 30) calculatedScore += 10;
    else if (weeklySavingsRate > 20) calculatedScore += 5;

    return Math.max(5, Math.min(100, calculatedScore));
  };

  const score = getRealZenScore();

  const handleNext = () => {
    if (slide < 3) setSlide(s => s + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (slide > 0) setSlide(s => s - 1);
  };

  useEffect(() => {
    if (slide === 3) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#14B8A6', '#f59e0b']
      });
    }
  }, [slide]);

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#090d16',
        zIndex: 3000, display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.3s ease-out', color: '#ffffff'
      }}
    >
      
      {/* Story Progress Bars */}
      <div style={{ display: 'flex', gap: '4px', padding: '16px 16px 0', zIndex: 3010 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: slide > i ? '100%' : slide === i ? '100%' : '0%',
              height: '100%',
              background: '#22c55e',
              transition: slide === i ? 'width 5s linear' : 'none',
              animation: slide === i ? 'fillBar 5s linear' : 'none'
            }} />
          </div>
        ))}
      </div>

      <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '50%', width: '34px', height: '34px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3010, cursor: 'pointer' }}>
        <X size={18} />
      </button>

      {/* Touch Areas for Navigation */}
      <div onClick={handlePrev} style={{ position: 'absolute', top: '50px', bottom: '0', left: '0', width: '30%', zIndex: 3005 }} />
      <div onClick={handleNext} style={{ position: 'absolute', top: '50px', bottom: '0', right: '0', width: '70%', zIndex: 3005 }} />

      {/* Slides Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px', position: 'relative' }}>
        
        {slide === 0 && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
            <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#22c55e', fontWeight: 800 }}>Weekly Story</span>
            <h1 style={{ fontSize: '48px', fontWeight: 800, fontFamily: "'Manrope', sans-serif", lineHeight: 1.1, color: '#ffffff' }}>
              Week {weekNumber}<br/>Wrapped
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.85)' }}>Let's see how you did this week.</p>
          </div>
        )}

        {slide === 1 && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: '#ffffff' }}>The Numbers</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 700 }}>Spent</span>
                <p style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', margin: 0 }}>{currencySymbol}{spent.toLocaleString()}</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: 700 }}>Saved</span>
                <p style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', margin: 0 }}>{currencySymbol}{saved.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {slide === 2 && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: '#ffffff' }}>Insights</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 700 }}>Best Day (Least Spent)</span>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{bestDay}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coffee size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 700 }}>Top Spending Category</span>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{worstCategory} ({currencySymbol}{maxCatSpend.toLocaleString()})</p>
                </div>
              </div>
              
              {potentialSaving > 0 && (
                <div style={{ background: 'rgba(20, 184, 166, 0.15)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(20, 184, 166, 0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingDown size={20} color="#22c55e" />
                  <p style={{ fontSize: '14px', color: '#22c55e', fontWeight: 700, margin: 0 }}>Potential Saving: {currencySymbol}{potentialSaving.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {slide === 3 && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '30px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: '#ffffff' }}>Final Score</h2>
            
            <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(20,184,166,0.3) 100%)', filter: 'blur(20px)' }} />
              <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', background: '#090d16', border: '2px solid #22c55e', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} />
              <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Money Score</span>
                <span style={{ fontSize: '64px', fontWeight: 800, fontFamily: "'Manrope', sans-serif", background: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                  {score}
                </span>
              </div>
            </div>
            <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '250px' }}>
              {score >= 70 ? 'Amazing week! Keep building these money habits.' : score >= 40 ? 'Good effort! Try to save a bit more next week.' : 'Tough week. Let\'s reset and do better!'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', zIndex: 3010, width: '100%', maxWidth: '300px' }}>
              {/* 📸 Canvas Story Generator */}
              <button
                onClick={async () => {
                  const blob = await generateStoryCardBlob();
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'ZenBudget_Story_Card.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);

                    const notice = document.createElement('div');
                    notice.innerHTML = '🖼️ <b>Story Image downloaded!</b> Saved to your device.';
                    notice.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#ec4899;color:#fff;padding:12px 20px;border-radius:99px;font-size:13px;font-weight:700;z-index:99999;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
                    document.body.appendChild(notice);
                    setTimeout(() => { try { document.body.removeChild(notice); } catch(_) {} }, 3500);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(to right, #ec4899, #f43f5e)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(244, 63, 94, 0.25)'
                }}
              >
                Download Story Image 📸
              </button>

              {/* WhatsApp Share */}
              <button
                onClick={() => {
                  const shareText = `💰 My Weekly Money Wrapped on ZenBudget!\n\n• Spent: ${currencySymbol}${spent.toLocaleString()}\n• Saved: ${currencySymbol}${saved.toLocaleString()}\n• Zen Score: ${score}/100\n• Best Day: ${bestDay}\n• Top Category: ${worstCategory}\n\n📦 Download Android App (.apk): https://zenbudget-tracker.vercel.app/zenbudget.apk\n🌐 Open Web App: https://zenbudget-tracker.vercel.app/`;
                  const nativeUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
                  const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                  
                  window.location.href = nativeUrl;
                  setTimeout(() => {
                    window.open(webUrl, '_blank');
                  }, 1200);
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: '#25d366', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                WhatsApp 💬
              </button>

              {/* Instagram Share Option */}
              <button
                onClick={async () => {
                  const blob = await generateStoryCardBlob();
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'ZenBudget_Story_Card.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }

                  const shareText = `💰 My Weekly Money Wrapped on ZenBudget!\nSpent: ${currencySymbol}${spent.toLocaleString()} | Saved: ${currencySymbol}${saved.toLocaleString()}\nZen Score: ${score}/100 | Best Day: ${bestDay}\n\n📦 Get App: https://zenbudget-tracker.vercel.app/zenbudget.apk`;
                  await navigator.clipboard.writeText(shareText);

                  const notice = document.createElement('div');
                  notice.innerHTML = '📸 <b>Image downloaded & stats copied!</b> Opening Instagram...';
                  notice.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#e1306c;color:#fff;padding:12px 20px;border-radius:99px;font-size:13px;font-weight:700;z-index:99999;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
                  document.body.appendChild(notice);
                  setTimeout(() => { try { document.body.removeChild(notice); } catch(_) {} }, 3500);
                  
                  window.location.href = 'instagram://camera';
                  setTimeout(() => {
                    window.open('https://instagram.com/', '_blank');
                  }, 1200);
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Instagram 📸
              </button>

              {/* X / Twitter Share */}
              <button
                onClick={() => {
                  const shareText = `My Weekly Zen Score: ${score}/100 🌱\n\nSpent: ${currencySymbol}${spent.toLocaleString()} | Saved: ${currencySymbol}${saved.toLocaleString()}\nBest Day: ${bestDay} | Top: ${worstCategory}\n\nPowered by @ZenBudgetApp\n📦 Android App (.apk): https://zenbudget-tracker.vercel.app/zenbudget.apk\n🌐 Web App: https://zenbudget-tracker.vercel.app/`;
                  const nativeUrl = `twitter://post?message=${encodeURIComponent(shareText)}`;
                  const webUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                  
                  window.location.href = nativeUrl;
                  setTimeout(() => {
                    window.open(webUrl, '_blank');
                  }, 1200);
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: '#14171a', color: '#ffffff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span style={{ color: '#ffffff' }}>Post on X 🐦</span>
              </button>

              {/* General Share / Copy */}
              <button
                onClick={async () => {
                  const blob = await generateStoryCardBlob();
                  const apkUrl = 'https://zenbudget-tracker.vercel.app/zenbudget.apk';
                  const appUrl = 'https://zenbudget-tracker.vercel.app/';
                  const shareText = `💰 My Weekly Money Wrapped!\n\nSpent: ${currencySymbol}${spent.toLocaleString()}\nSaved: ${currencySymbol}${saved.toLocaleString()}\nZen Score: ${score}/100\nBest Day: ${bestDay} | Top Spend: ${worstCategory}\n\nPowered by ZenBudget\n📦 Download Android App (.apk): ${apkUrl}\n📱 Open Web App: ${appUrl}`;
                  
                  if (navigator.share && blob) {
                    try {
                      const file = new File([blob], 'ZenBudget_Story_Card.png', { type: 'image/png' });
                      await navigator.share({ title: 'My ZenBudget Wrapped', text: shareText, files: [file] });
                      return;
                    } catch {}
                  }

                  if (navigator.share) {
                    try {
                      await navigator.share({ title: 'My ZenBudget Wrapped', text: shareText, url: appUrl });
                      return;
                    } catch {}
                  }

                  await navigator.clipboard.writeText(shareText);
                  const notice = document.createElement('div');
                  notice.innerHTML = '✨ <b>Stats & link copied to clipboard!</b>';
                  notice.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:12px 20px;border-radius:99px;font-size:13px;font-weight:700;z-index:99999;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
                  document.body.appendChild(notice);
                  setTimeout(() => { try { document.body.removeChild(notice); } catch(_) {} }, 3000);
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Share ✨
              </button>

              <button
                onClick={onClose}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', marginTop: '10px' }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
