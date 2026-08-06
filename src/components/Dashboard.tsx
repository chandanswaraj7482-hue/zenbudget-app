import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  TrendingUp,
  Target,
  ChevronRight,
  Utensils,
  ShoppingBag,
  Film,
  CreditCard,
  Compass,
  HeartPulse,
  MoreHorizontal,
  Sparkles,
  Check,
  X,
  Volume2,
  Pencil,
  Trash2,
  Clock,
  Wallet
} from 'lucide-react';
import type { Transaction, SavingsGoal, CategoryBudget, Account } from '../types';
import { t } from '../utils/i18n';
import { ZenPet } from './ZenPet';
import { PremiumHub } from './PremiumHub';
import { QuickCaptureCard } from './QuickCaptureCard';
import { formatCurrency } from '../utils/formatCurrency';
import confetti from 'canvas-confetti';

interface DashboardProps {
  currentProfileId: string;
  userName: string;
  userAvatar?: string;
  accounts?: Account[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  currencySymbol: string;
  onAddTransactionClick: () => void;
  onViewAllTransactionsClick: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onAddGoalProgress: (goalId: string, amount: number) => void;
  onOpenStory?: () => void;
  language?: string;
  onAddNewGoal: (name: string, target: number, color: string) => void;
  subscriptionTier?: string;
  trialStartDate?: string;
  premiumExpiresAt?: string | null;
  onEditGoal?: (goalId: string, name: string, target: number, color: string) => void;
  onDeleteGoal?: (goalId: string) => void;
  onForestClick?: () => void;
  referralCount?: number;
  onAddAccountClick?: () => void;
  onOpenBankSync?: () => void;
  onOpenTransfer?: () => void;
  onOpenLoans?: () => void;
  onOpenProfile?: () => void;
  onUpgradeClick?: () => void;
  onSaveTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteAccount?: (accId: string) => void;
}

const DAILY_COACH_TIPS = [
  "Analyze your wants vs needs today. Delay discretionary purchases by 24 hours.",
  "Small micro-spends (like daily snacks or coffees) can add up to ₹3,000+ a month.",
  "Unsubscribe from gym, stream, or app packages you haven't used in 30 days.",
  "Check your utility bills today. Simple electricity/water savings cut costs by 15%.",
  "Cook at home instead of ordering in. Restaurant food carries a 200% premium markup.",
  "The 50/30/20 budgeting rule works: 50% for Needs, 30% for Wants, 20% for Savings.",
  "Build an emergency fund covering 3-6 months of expenses before investing in stocks.",
  "Pay your credit card outstanding balance in full today to avoid 42% interest trap.",
  "Avoid EMIs for lifestyle shopping. If you cannot buy it twice in cash, you cannot afford it.",
  "Review your savings rate. Even a 5% increase now grows compound returns massively.",
  "Before buying any lifestyle product, calculate its cost in hours of work it took you.",
  "Create a shopping list before visiting the supermarket. It prevents impulse items.",
  "Invest in index funds or gold for steady inflation-beating long term growth.",
  "Never invest in schemes promising quick returns. True wealth builds slowly over years.",
  "Save first as soon as you receive income, then spend what is left after savings.",
  "Diversify your investments across equity, mutual funds, gold, and fixed income.",
  "Log your transactions immediately in ZenBudget. Visible numbers stop impulse buys.",
  "Maintain a no-spend day today. Zero expense builds financial resilience.",
  "Set a budget cap on your lifestyle and entertainment categories for the rest of month.",
  "Health is wealth. Spend on gym, good food, and preventative health to avoid hospital bills.",
  "Avoid sale/discount traps. Buying something you don't need just because it is 50% off is still spending.",
  "Understand the compound interest formula. Compounding is the eighth wonder of the world.",
  "Automate your savings transfer on the first day of every month.",
  "Discuss financial goals with your family or partner to align on savings targets.",
  "Negotiate recurring bills (wifi, phone, insurance) to secure better rates.",
  "Read a personal finance book or blog post today to grow your financial literacy.",
  "Track your net worth once a month. Seeing the curve rise keeps you motivated.",
  "Avoid peer pressure spending. You don't need to match the lifestyle of colleagues.",
  "Review your budget progress. Celebrate if you stayed within limits this week!",
  "Invest in your skills and education. The best investment you can make is in yourself.",
  "Start a side hustle or freelance gig to create a secondary source of income."
];

export const Dashboard: React.FC<DashboardProps> = ({
  currentProfileId,
  userName,
  userAvatar,
  accounts = [],
  transactions = [],
  budgets = [],
  goals = [],
  currencySymbol,
  onAddTransactionClick,
  onViewAllTransactionsClick,
  onEditTransaction,
  onAddGoalProgress,
  onOpenStory,
  onEditGoal,
  onDeleteGoal,
  onForestClick: _onForestClick,
  referralCount = 0,
  onAddNewGoal,
  subscriptionTier = 'trial',
  trialStartDate,
  premiumExpiresAt,
  onAddAccountClick,
  onOpenBankSync: _onOpenBankSync,
  onOpenTransfer: _onOpenTransfer,
  onOpenLoans: _onOpenLoans,
  onOpenProfile,
  onUpgradeClick,
  onDeleteAccount,
  onSaveTransaction
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAllAccountsModal, setShowAllAccountsModal] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showMonthlyLetter, setShowMonthlyLetter] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeGoalInput, setActiveGoalInput] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>('');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('#22c55e');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalName, setEditGoalName] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalColor, setEditGoalColor] = useState('#22c55e');
  const [claimedBadges, setClaimedBadges] = useState<string[]>(() => {
    const stored = currentProfileId ? localStorage.getItem(`zb_claimed_badges_${currentProfileId}`) : null;
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [];
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [challenges, setChallenges] = useState<{id: string; title: string; subtitle: string; percent: number}[]>(() => {
    const cached = localStorage.getItem(`zb_challenges`);
    if (cached) try { return JSON.parse(cached); } catch (e) {}
    return [];
  });

  const [activeBadgeModal, setActiveBadgeModal] = useState<{
    id: string;
    icon: string;
    title: string;
    isUnlocked: boolean;
    isClaimed: boolean;
    canClaim: boolean;
    requirement: string;
    progress: string;
  } | null>(null);

  const handleClaimBadge = (badgeId: string) => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const nextClaimed = [...claimedBadges, badgeId];
    setClaimedBadges(nextClaimed);
    if (currentProfileId) {
      localStorage.setItem(`zb_claimed_badges_${currentProfileId}`, JSON.stringify(nextClaimed));
    }

    setChallenges(prev => {
      const nextC = prev.map((c: {id: string; title: string; subtitle: string; percent: number}) => ({
        ...c,
        percent: Math.min(100, c.percent + 25)
      }));
      localStorage.setItem('zb_challenges', JSON.stringify(nextC));
      return nextC;
    });

    setActiveBadgeModal(null);
  };
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [editChallengeTitle, setEditChallengeTitle] = useState('');
  const [editChallengeSubtitle, setEditChallengeSubtitle] = useState('');
  const [editChallengePercent, setEditChallengePercent] = useState<number>(0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const income = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAccountBalance = accounts && accounts.length > 0
    ? accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
    : transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);

  const totalBalance = totalAccountBalance;

  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const totalSaved = Math.max(0, income - expenses);

  // Category map for styling
  const categoryMeta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    food: { label: 'Food', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <Utensils size={18} /> },
    shopping: { label: 'Shopping', color: 'var(--secondary)', bg: 'rgba(20, 184, 166, 0.1)', icon: <ShoppingBag size={18} /> },
    entertainment: { label: 'Entertainment', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: <Film size={18} /> },
    bills: { label: 'Bills', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <CreditCard size={18} /> },
    travel: { label: 'Travel', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', icon: <Compass size={18} /> },
    health: { label: 'Health', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <HeartPulse size={18} /> },
    other: { label: 'Other', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: <MoreHorizontal size={18} /> },
  };

  const getCategoryExpense = (category: string) => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const getCategoryIcon = (category: string, type: 'income' | 'expense' | 'transfer') => {
    if (type === 'income') return <TrendingUp size={18} />;
    return categoryMeta[category]?.icon || <MoreHorizontal size={18} />;
  };

  // Dynamic Zen Money Score calculation — properly penalizes heavy spending
  const getZenScoreDetails = () => {
    if (transactions.length === 0) {
      return { score: 0, status: 'Start Logging! 📝' };
    }

    let calculatedScore = 100; // start from 100

    // Factor 1: No income but has expen    // Factor 1: Income vs Expense ratio (smart scaling for small expenses)
    if (income === 0 && expenses > 0) {
      if (expenses <= 500) {
        calculatedScore -= 10; // Small expense, minimal penalty
      } else if (expenses <= 2000) {
        calculatedScore -= 25;
      } else {
        calculatedScore -= 45;
      }
    } else if (income > 0) {
      const ratio = expenses / income;
      if (ratio >= 2) calculatedScore -= 50;  // spending 2x income
      else if (ratio >= 1.5) calculatedScore -= 35;  // spending 1.5x income
      else if (ratio >= 1.2) calculatedScore -= 25;  // spending 1.2x income
      else if (ratio >= 1) calculatedScore -= 15;  // just over income
      else if (ratio >= 0.8) calculatedScore -= 5;   // 80% of income spent
      else if (ratio < 0.5) calculatedScore += 10;  // saving >50%: bonus
    }

    // Factor 2: Budget overspend penalty
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    if (totalBudget > 0 && expenses > totalBudget) {
      const overRatio = expenses / totalBudget;
      if (overRatio >= 2) calculatedScore -= 30;
      else if (overRatio >= 1.5) calculatedScore -= 20;
      else calculatedScore -= 10;
    }

    // Factor 3: Per-category overspend (-5 per busted category)
    let overspentCount = 0;
    budgets.forEach(b => {
      const spent = getCategoryExpense(b.category);
      if (spent > b.limit) overspentCount++;
    });
    calculatedScore -= overspentCount * 5;

    // Factor 4: Negative mood spending penalty
    const negativeMoodCount = currentMonthTransactions.filter(t =>
      t.notes && (t.notes.includes('Regret') || t.notes.includes('Stressed') || t.notes.includes('Regret/Sad'))
    ).length;
    calculatedScore -= negativeMoodCount * 2;

    // Factor 5: Savings rate bonus
    if (savingsRate > 30) calculatedScore += 10;
    else if (savingsRate > 20) calculatedScore += 5;

    // Clamp between 15 and 100
    const finalScore = Math.max(15, Math.min(100, calculatedScore));

    let status = 'Great Habits! 🌱';
    if (finalScore >= 85) status = 'Master Planner! 🏆';
    else if (finalScore >= 70) status = 'Good Control! 👍';
    else if (finalScore >= 50) status = 'Healthy Pace ⚖️';
    else if (finalScore >= 30) status = 'Moderate Spending 📊';
    else status = 'High Spending Alert! 🚨';

    return { score: finalScore, status };
  };

  const { score: zenScore, status: zenStatus } = getZenScoreDetails();

  const generateShareCardBlob = (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    // 1. Midnight Dark Mesh Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 900);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.35, '#0f172a');
    bgGrad.addColorStop(0.7, '#1e1b4b');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 900);

    // 2. Ambient Radial Neon Light Orbs
    ctx.save();
    // Green Radial Light top-left
    const greenGlow = ctx.createRadialGradient(150, 150, 10, 150, 150, 260);
    greenGlow.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
    greenGlow.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.fillStyle = greenGlow;
    ctx.fillRect(0, 0, 600, 450);

    // Purple Glow bottom-right
    const purpleGlow = ctx.createRadialGradient(450, 700, 10, 450, 700, 260);
    purpleGlow.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
    purpleGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = purpleGlow;
    ctx.fillRect(0, 450, 600, 450);
    ctx.restore();

    // 3. Glassmorphic Outer Card Border Frame
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(28, 28, 544, 844, 32);
    ctx.stroke();
    ctx.restore();

    // 4. Header Logo & Gold Title Badge
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'center';
    ctx.fillText('ZenBudget 🌿', 300, 92);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('🏆 OFFICIAL MONTHLY SAVINGS CARD', 300, 122);

    // 5. Hero Ring Arc Progress Gauge
    ctx.save();
    ctx.beginPath();
    ctx.arc(300, 260, 85, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Vibrant Arc
    ctx.beginPath();
    ctx.arc(300, 260, 85, -Math.PI / 2, Math.PI * 1.3);
    const arcGrad = ctx.createLinearGradient(200, 180, 400, 340);
    arcGrad.addColorStop(0, '#22c55e');
    arcGrad.addColorStop(1, '#14b8a6');
    ctx.strokeStyle = arcGrad;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center Flame Emoji
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥', 300, 275);
    ctx.restore();

    // 6. User Name & Large Total Saved Text
    ctx.font = '700 18px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText(`${userName}'s Monthly Performance`, 300, 395);

    ctx.font = '800 48px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Saved ${currencySymbol}${totalSaved.toLocaleString()}`, 300, 455);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('⚡ Top 12% Saver in ZenBudget!', 300, 495);

    // 7. Dual Stats Cards (Zen Score & Savings Rate)
    ctx.save();
    // Left Box: Zen Score
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(60, 535, 230, 95, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'left';
    ctx.fillText('MONEY HABIT SCORE', 80, 565);
    ctx.font = '800 30px sans-serif';
    ctx.fillStyle = '#22c55e';
    const scoreDetails = getZenScoreDetails();
    ctx.fillText(`${scoreDetails.score} / 100`, 80, 605);

    // Right Box: Savings Rate
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(310, 535, 230, 95, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText('SAVINGS RATE', 330, 565);
    ctx.font = '800 30px sans-serif';
    ctx.fillStyle = '#14b8a6';
    ctx.fillText(`${savingsRate}%`, 330, 605);
    ctx.restore();

    // 8. Motivational Quote Card Box
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(60, 650, 480, 90, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'italic 14px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.fillText('"Building wealth, one expense log at a time.', 300, 688);
    ctx.fillText('Track smart & stay financially calm with ZenBudget 🌿"', 300, 715);
    ctx.restore();

    // 9. Watermark Footer App Link Pill
    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.beginPath();
    ctx.roundRect(90, 775, 420, 46, 99);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('🚀 Track your money @ zenbudget-tracker.vercel.app', 300, 804);
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const handleCardShare = async (platform: 'whatsapp' | 'instagram' | 'facebook') => {
    let inviteCode = localStorage.getItem('zb_user_referral_code') || localStorage.getItem('zb_invite_code') || 'ZB-REFER';
    if (inviteCode && !inviteCode.toUpperCase().startsWith('ZB-')) {
      inviteCode = 'ZB-' + inviteCode;
    }
    const appUrl = `https://zenbudget-tracker.vercel.app/?code=${inviteCode}`;
    const text = `🔥 I saved ${currencySymbol}${totalSaved.toLocaleString()} this month on ZenBudget! Top 12% saver.\n\n🌿 Track your money with AI insights! Join using my link:\n👉 ${appUrl}\n\n📦 Download Android App (.apk):\nhttps://zenbudget-tracker.vercel.app/zenbudget.apk`;
    
    // 1. Generate High-End Canvas Story Card Image
    const blob = await generateShareCardBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ZenBudget_Savings_Card.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // 2. Try Native Web Share API with image file if supported (Direct WhatsApp / Mobile native sheet)
    if (navigator.share && blob) {
      try {
        const file = new File([blob], 'ZenBudget_Savings_Card.png', { type: 'image/png' });
        await navigator.share({ title: 'My ZenBudget Savings Card', text: text, files: [file] });
        setShowShareModal(false);
        return;
      } catch (_) {}
    }

    // 3. Fallback clipboard & direct platform app launch
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {}

    const targetName = platform === 'whatsapp' ? 'WhatsApp' : platform === 'instagram' ? 'Instagram' : 'Facebook';
    const notice = document.createElement('div');
    notice.innerHTML = `🖼️ <b>Savings Card downloaded & link copied!</b> Opening ${targetName}...`;
    notice.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;padding:12px 20px;border-radius:99px;font-size:13px;font-weight:700;z-index:99999;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
    document.body.appendChild(notice);
    setTimeout(() => { try { document.body.removeChild(notice); } catch(_) {} }, 3500);

    const encodedText = encodeURIComponent(text);
    if (platform === 'whatsapp') {
      window.location.href = `whatsapp://send?text=${encodedText}`;
      setTimeout(() => { window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank'); }, 1000);
    } else if (platform === 'instagram') {
      window.location.href = 'instagram://camera';
      setTimeout(() => { window.open('https://instagram.com', '_blank'); }, 1000);
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`, '_blank');
    }
    setShowShareModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }} className="animate-fade-in">

      {/* Premium Header with Profile Avatar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
        <div 
          onClick={onOpenProfile}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid var(--primary)',
            boxShadow: '0 2px 10px rgba(34, 197, 94, 0.25)',
            flexShrink: 0
          }}>
            <img 
              src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=22c55e&color=fff&rounded=true`}
              alt={userName} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Line 1: Dynamic Time Greeting Badge */}
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
              {(() => {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) return 'Good Morning ☀️';
                if (hour >= 12 && hour < 17) return 'Good Afternoon 🌤️';
                if (hour >= 17 && hour < 21) return 'Good Evening 🌆';
                return 'Good Night 🌙';
              })()}
            </div>

            {/* Line 2: User Name (Full Name Visible!) */}
            <h1 style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0', fontFamily: "'Manrope', sans-serif", letterSpacing: '-0.02em', lineHeight: 1.2, wordBreak: 'break-word', whiteSpace: 'normal' }}>
              {userName || 'User'}
            </h1>

            {/* Line 3: Rotating Financial Tagline (Full Tagline Wrapped & Visible!) */}
            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, marginTop: '3px', lineHeight: 1.3, wordBreak: 'break-word', whiteSpace: 'normal' }}>
              {(() => {
                const taglines = [
                  'Track smart, live mindfully 🌿',
                  'Your Daily Financial Companion 💰',
                  'Master your money, one day at a time 🎯',
                  'Every rupee saved is a step toward freedom 🚀',
                  'Plan today, prosper tomorrow ✨',
                  'Small savings today, big dreams tomorrow 🌟',
                  'Control your expenses, empower your future 🛡️',
                  'Financial peace of mind begins here 🧘‍♂️',
                  'Smart tracking, stress-free living 🍀',
                  'Build wealth quietly, enjoy life fully 💎'
                ];
                const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
                return taglines[dayOfYear % taglines.length];
              })()}
            </div>
          </div>
        </div>

        <button
          onClick={onAddTransactionClick}
          className="glass-button active"
          style={{ padding: '9px 12px', borderRadius: '14px', fontSize: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', animation: 'pulse-glow 3s infinite' }}
        >
          <Plus size={15} /> {t('add_transaction')}
        </button>
      </div>

      {/* Main Glass Balance Card */}
      <div className="glass-panel" style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-balance-card)',
        border: '1px solid var(--border-balance-card)'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, rgba(34, 197, 94, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('total_balance')}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0 16px 0', color: 'var(--text-balance)' }}>
          <span style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {formatCurrency(totalBalance, currencySymbol, 0)}
          </span>
        </div>

        {/* Income / Expense Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-divider)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'var(--success-glow)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={20} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('income')}</span>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)' }}>
                +{formatCurrency(income, currencySymbol, 0)}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownRight size={20} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('expenses')}</span>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--danger)' }}>
                -{formatCurrency(expenses, currencySymbol, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── My Accounts in Wallet Section (Screenshot 1) ─── */}
      <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} style={{ color: 'var(--primary)' }} />
            {t('my_accounts')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowAllAccountsModal(true)}
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: '20px',
                padding: '4px 12px',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              See All ({accounts.length}) <ChevronRight size={13} />
            </button>
            <button
              onClick={onAddAccountClick}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid var(--border-card)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Add account"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Accounts Grid - Renders All Accounts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          {accounts.map((acc, index) => {
            const defaultColors = ['#0284c7', '#ea580c', '#7c3aed', '#22c55e', '#06b6d4', '#ec4899', '#f59e0b'];
            const cardBg = acc.color || defaultColors[index % defaultColors.length];
            return (
              <div
                key={acc.id}
                style={{
                  background: cardBg,
                  borderRadius: '14px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '72px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '13px', flexShrink: 0 }}>
                      {acc.type === 'cash' ? '🪙' : acc.type === 'upi' ? '📱' : acc.type === 'credit' ? '💳' : acc.type === 'wallet' ? '👛' : acc.type === 'custom' ? '✨' : '🏦'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {acc.name}
                    </span>
                  </div>
                  {onDeleteAccount && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAccount(acc.id);
                      }}
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        color: 'rgba(255, 255, 255, 0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        padding: 0
                      }}
                      title="Delete account"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, marginTop: '8px' }}>
                  {formatCurrency(acc.balance, currencySymbol)}
                </span>
              </div>
            );
          })}

          {/* Add Account Tile */}
          <button
            onClick={onAddAccountClick}
            style={{
              borderRadius: '14px',
              padding: '12px 14px',
              border: '2px dashed var(--border-input)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '68px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              gridColumn: accounts.length === 0 ? '1 / -1' : undefined
            }}
          >
            <span style={{ color: 'var(--primary)' }}>Add account</span>
            <Plus size={16} style={{ color: 'var(--primary)' }} />
          </button>
        </div>
      </div>

      {/* AI Quick Capture Natural Language Card */}
      {onSaveTransaction && (
        <QuickCaptureCard
          onSaveTransaction={onSaveTransaction}
          currencySymbol={currencySymbol}
          accounts={accounts}
          onAddAccountClick={onAddAccountClick}
        />
      )}

      {/* Savings Rate Card */}
      {income > 0 && (
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('monthly_savings_rate')}</span>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                {savingsRate > 0 ? `${savingsRate}% ${t('saved_rate')}` : `0% ${t('saved_rate')}`}
              </p>
            </div>
          </div>

          <div style={{ width: '48px', height: '48px', position: 'relative' }}>
            <svg width="48" height="48" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeDasharray="100 100"
                strokeDashoffset={100 - Math.max(0, Math.min(100, savingsRate))}
                strokeLinecap="round"
                className="progress-ring-circle"
              />
            </svg>
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '9px', fontWeight: 700 }}>
              {savingsRate > 0 ? `${savingsRate}%` : '0%'}
            </span>
          </div>
        </div>
      )}

      {/* Aesthetic Money Score Card */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}>
            <span style={{ fontSize: '18px' }}>✨</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('zen_money_score')}</span>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              {zenStatus}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: "'Manrope', sans-serif", background: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {zenScore}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>/100</span>
        </div>
      </div>



      <PremiumHub
        transactions={transactions}
        budgets={budgets}
        currencySymbol={currencySymbol}
        userName={userName}
      />

      {/* Zen Mascot Coach Card - Dynamic AI Advice */}
      <div className="glass-panel animate-fade-in" style={{ display: 'flex', gap: '14px', padding: '16px', background: 'var(--bg-card)', alignItems: 'center', border: '1px solid var(--border-card)' }}>
        <span style={{ fontSize: '32px' }}>🌿</span>
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('zen_coach')}</h4>
          <p
            data-coach-text
            style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px', fontWeight: 500 }}
          >
            "{(() => {
              const dayOfMonth = new Date().getDate();
              const dailyTip = DAILY_COACH_TIPS[(dayOfMonth - 1) % DAILY_COACH_TIPS.length];

              if (expenses === 0 && income === 0) {
                return `${dailyTip} Start logging your transactions to get personalized budget coaching! 🧘`;
              }

              const savingsPct = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
              const topCat = Object.entries(
                currentMonthTransactions.filter(t => t.type === 'expense')
                  .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1])[0];

              let statsSummary = '';
              if (savingsPct >= 30) {
                statsSummary = `You saved ${savingsPct}% this month — amazing work! 🌟`;
              } else if (savingsPct >= 10) {
                statsSummary = `Savings are at ${savingsPct}% — keep pushing it higher! 🌱`;
              } else {
                statsSummary = `Savings are low this month. Try to cut down micro-spends. ⚠️`;
              }

              if (topCat) {
                statsSummary += ` Heavy spending detected in ${topCat[0]} (${currencySymbol}${Math.round(topCat[1]).toLocaleString()}).`;
              }

              return `${dailyTip} ${statsSummary}`;
            })()}"
          </p>
        </div>
        {/* TTS Speak Button */}
        <button
          onClick={() => {
            if (isSpeaking) {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            } else {
              const coachEl = document.querySelector('[data-coach-text]');
              const text = coachEl?.textContent?.replace(/"/g, '') || 'Keep building your money habits!';
              const utterance = new SpeechSynthesisUtterance(text);

              // Set rate and pitch for a natural, friendly tone
              utterance.rate = 0.95;
              utterance.pitch = 1.05;

              const activeLang = localStorage.getItem('zb_language') || 'en';
              const langCodeMap: Record<string, string> = {
                en: 'en-US',
                hi: 'hi-IN',
                es: 'es-ES',
                fr: 'fr-FR',
                de: 'de-DE'
              };
              utterance.lang = langCodeMap[activeLang] || 'en-US';

              const voices = window.speechSynthesis.getVoices();
              const langPrefix = activeLang;
              const matchingVoice = voices.find(v => v.lang.startsWith(langPrefix)) || voices.find(v => v.lang.startsWith('en'));
              if (matchingVoice) {
                utterance.voice = matchingVoice;
              }

              utterance.onend = () => setIsSpeaking(false);
              window.speechSynthesis.speak(utterance);
              setIsSpeaking(true);
            }
          }}
          style={{
            minWidth: '36px', height: '36px', borderRadius: '50%',
            background: isSpeaking ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
            border: isSpeaking ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
            color: isSpeaking ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <Volume2 size={16} />
        </button>
      </div>

      {/* Zen Pet Companion */}
      <ZenPet
        currentProfileId={currentProfileId}
        spentPercentage={budgets.reduce((sum, b) => sum + b.limit, 0) > 0 ? (expenses / budgets.reduce((sum, b) => sum + b.limit, 0)) * 100 : 0}
        transactionCount={transactions.length}
      />

      {/* Subscription / Trial Tracker */}
      {(() => {
        const now = new Date();
        if (subscriptionTier === 'premium') {
          const expiryDate = premiumExpiresAt ? new Date(premiumExpiresAt) : null;
          const daysLeft = expiryDate ? Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
          return (
            <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <Clock size={18} style={{ color: '#8b5cf6', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>Premium Active</span>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                  {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days remaining` : 'Expires today') : 'Lifetime Premium Access'}
                </p>
              </div>
              {expiryDate && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{expiryDate.toLocaleDateString()}</span>}
            </div>
          );
        } else if (trialStartDate) {
          const trialStart = new Date(trialStartDate);
          const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const trialProgress = Math.min(100, Math.round(((7 - daysLeft) / 7) * 100));
          return (
            <div 
              onClick={onUpgradeClick}
              className="glass-panel" 
              style={{ 
                padding: '14px 16px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px', 
                background: 'rgba(245,158,11,0.06)', 
                border: '1px solid rgba(245,158,11,0.25)',
                cursor: onUpgradeClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Free Trial</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textDecoration: 'underline' }}>Upgrade ⚡</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                    {daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining` : 'Trial expired'}
                  </p>
                </div>
              </div>
              <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ width: `${trialProgress}%`, height: '100%', background: daysLeft > 2 ? '#f59e0b' : '#ef4444', borderRadius: '2px', transition: 'width 0.5s' }} />
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Challenge Mode widget */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('active_challenges')}</span>
          <button
            type="button"
            onClick={() => {
              const newId = Date.now().toString();
              const newCh = { id: newId, title: 'New Challenge 🏆', subtitle: 'Not started', percent: 0 };
              const list = [...challenges, newCh];
              setChallenges(list);
              localStorage.setItem('zb_challenges', JSON.stringify(list));
              setEditingChallengeId(newId);
              setEditChallengeTitle(newCh.title);
              setEditChallengeSubtitle(newCh.subtitle);
              setEditChallengePercent(newCh.percent);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            {t('add_new')}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {challenges.length === 0 && (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '28px', marginBottom: '8px' }}>🏆</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>No challenges yet</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Tap "+ Add" to create your first challenge!</p>
            </div>
          )}
          {challenges.slice(0, 3).map((ch: any) => (
            <div
              key={ch.id}
              className="glass-panel glass-panel-hover"
              style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
              onClick={() => {
                setEditingChallengeId(ch.id);
                setEditChallengeTitle(ch.title);
                setEditChallengeSubtitle(ch.subtitle);
                setEditChallengePercent(ch.percent);
              }}
            >
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {ch.title} <span style={{ fontSize: '10px', opacity: 0.7 }}>✏️</span>
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ch.subtitle}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: ch.percent === 100 ? 'var(--success)' : 'var(--primary)' }}>{ch.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Badges grid */}
      {(() => {
        // Calculate streak: consecutive days with at least one transaction
        const streakToday = new Date();
        let currentStreakCount = 0;
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(streakToday.getTime() - i * 24 * 60 * 60 * 1000).toDateString();
          const hasActivity = transactions.some(t => new Date(t.date).toDateString() === checkDate);
          if (hasActivity) currentStreakCount++;
          else if (i > 0) break;
        }

        // Fix logic so badges are NOT unlocked by default for new users (require actual activity!)
        const hasFirstSpend = transactions.length >= 1;
        const hasStreakBadge = currentStreakCount >= 7;
        const hasSave10k = totalSaved >= 10000;
        const hasNoSwiggy = transactions.length >= 5 && !transactions.some(t => (t.title || '').toLowerCase().includes('swiggy') || (t.title || '').toLowerCase().includes('zomato'));
        const hasCoffeeCtrl = transactions.length >= 5 && !transactions.some(t => (t.title || '').toLowerCase().includes('coffee') && t.amount > 500);
        const has10Invites = referralCount >= 10;

        // Level 2 Dynamic Progression Badges (Unlock as user advances!)
        const hasSave50k = totalSaved >= 50000;
        const has30dStreak = currentStreakCount >= 30;
        const has50Logs = transactions.length >= 50;

        const allBadgesList = [
          {
            id: 'first_spend',
            icon: '🥉',
            title: 'First Spend',
            isUnlocked: hasFirstSpend,
            requirement: 'Log your first transaction (expense or income) in ZenBudget to unlock this achievement.',
            progress: `${Math.min(1, transactions.length)}/1 Transaction Logged`
          },
          {
            id: 'streak_7d',
            icon: '🥈',
            title: '7d Streak',
            isUnlocked: hasStreakBadge,
            requirement: 'Track your daily expenses for 7 consecutive days without breaking your daily streak!',
            progress: `${currentStreakCount}/7 Days Streak`
          },
          {
            id: 'save_10k',
            icon: '🥇',
            title: 'Save 10k',
            isUnlocked: hasSave10k,
            requirement: 'Accumulate at least ₹10,000 in savings across your savings goals and monthly balance.',
            progress: `${currencySymbol}${totalSaved.toLocaleString()} / ${currencySymbol}10,000 Saved`
          },
          {
            id: 'no_swiggy',
            icon: '🔥',
            title: 'No Swiggy',
            isUnlocked: hasNoSwiggy,
            requirement: 'Log at least 5 transactions without any Swiggy or Zomato food delivery entries.',
            progress: hasNoSwiggy ? 'Clean Streak Active 🔓' : `${transactions.length}/5 Logs logged (Zero Food Delivery)`
          },
          {
            id: 'coffee_ctrl',
            icon: '☕',
            title: 'Coffee Ctrl',
            isUnlocked: hasCoffeeCtrl,
            requirement: 'Keep single coffee/cafe transactions below ₹500 across at least 5 logged transactions.',
            progress: hasCoffeeCtrl ? 'Controlled 🔓' : `${transactions.length}/5 Logs (Under ₹500 Coffee)`
          },
          {
            id: 'invites_10',
            icon: '🎁',
            title: '10 Invites',
            isUnlocked: has10Invites,
            requirement: 'Invite 10 friends (who sign up & upgrade to Premium) using your referral link to earn 1 Month Free Premium!',
            progress: `${referralCount}/10 Subscribed Friends Invited`
          },
          {
            id: 'streak_90d',
            icon: '👑',
            title: '90d Pro Saver',
            isUnlocked: currentStreakCount >= 90,
            requirement: 'Maintain a 90-day (3 Months) daily transaction streak to claim 1 Month FREE Premium Subscription!',
            progress: currentStreakCount >= 90 ? 'REWARD UNLOCKED 🔓 (1 Month Free Premium)' : `${currentStreakCount}/90 Days Daily Streak`
          },
          // Dynamic Level 2 Badges (Unlocked or visible once user progresses)
          ...(hasFirstSpend ? [{
            id: 'logs_50',
            icon: '📊',
            title: '50 Logged',
            isUnlocked: has50Logs,
            requirement: 'Log 50 transactions to master complete financial awareness.',
            progress: `${transactions.length}/50 Transactions`
          }] : []),
          ...(hasSave10k || totalSaved > 5000 ? [{
            id: 'save_50k',
            icon: '💎',
            title: 'Save 50k',
            isUnlocked: hasSave50k,
            requirement: 'Reach ₹50,000 in total savings to unlock Zen Wealth Status!',
            progress: `${currencySymbol}${totalSaved.toLocaleString()} / ${currencySymbol}50,000 Saved`
          }] : []),
          ...(hasStreakBadge || currentStreakCount >= 4 ? [{
            id: 'streak_30d',
            icon: '🏆',
            title: '30d Master',
            isUnlocked: has30dStreak,
            requirement: 'Maintain an unbroken 30-day streak of daily tracking.',
            progress: `${currentStreakCount}/30 Days Streak`
          }] : [])
        ];

        const visibleBadgesList = showAllBadges ? allBadgesList : allBadgesList.slice(0, 3);
        const unlockedCount = allBadgesList.filter(b => b.isUnlocked).length;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ACHIEVEMENT BADGES 🏆
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllBadges(!showAllBadges)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    cursor: 'pointer'
                  }}
                >
                  {showAllBadges ? 'Show Less' : `See All (${allBadgesList.length})`}
                </button>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', background: 'rgba(34,197,94,0.12)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                {unlockedCount}/{allBadgesList.length} Unlocked
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              {visibleBadgesList.map(b => {
                const isClaimed = claimedBadges.includes(b.id);
                const canClaim = b.isUnlocked && !isClaimed;

                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveBadgeModal({
                      id: b.id,
                      icon: b.icon,
                      title: b.title,
                      isUnlocked: b.isUnlocked,
                      isClaimed,
                      canClaim,
                      requirement: b.requirement,
                      progress: b.progress
                    })}
                    className="glass-panel"
                    style={{
                      padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      background: canClaim 
                        ? 'rgba(234, 179, 8, 0.15)' 
                        : b.isUnlocked 
                          ? 'rgba(34, 197, 94, 0.08)' 
                          : 'var(--bg-input)',
                      border: canClaim 
                        ? '1px solid rgba(234, 179, 8, 0.8)' 
                        : b.isUnlocked 
                          ? '1px solid rgba(34, 197, 94, 0.4)' 
                          : '1px solid var(--border-input)',
                      opacity: b.isUnlocked ? 1 : 0.6,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: canClaim ? '0 0 12px rgba(234, 179, 8, 0.4)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '24px', filter: b.isUnlocked ? 'none' : 'grayscale(70%)' }}>{b.icon}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)' }}>{b.title}</span>
                    <span style={{
                      fontSize: '9px',
                      color: canClaim ? '#eab308' : b.isUnlocked ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: 800
                    }}>
                      {canClaim ? 'CLAIM 🎁' : isClaimed ? 'CLAIMED 🏆' : 'LOCKED 🔒'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Shareable Card & Monthly Letter action row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          onClick={() => setShowShareModal(true)}
          className="glass-panel glass-panel-hover"
          style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          <span>{t('share_card')}</span>
        </button>
        <button
          onClick={() => setShowMonthlyLetter(true)}
          className="glass-panel glass-panel-hover"
          style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          <span>{t('monthly_letter')}</span>
        </button>
      </div>

      {/* Referral Banner */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-card)', textAlign: 'left' }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{t('help_friend_save')}</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>{t('invite_promo')}</span>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          style={{ padding: '6px 12px', borderRadius: '10px', border: 'none', background: '#ec4899', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
        >
          {t('invite_btn')}
        </button>
      </div>

      {/* Quick Budget Alerts */}
      {budgets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget Check</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {budgets.slice(0, 2).map((b) => {
              const spent = getCategoryExpense(b.category);
              const percent = Math.min(100, Math.round((spent / b.limit) * 100));
              const meta = categoryMeta[b.category] || categoryMeta.other;
              const isOver = spent > b.limit;

              return (
                <div key={b.category} className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{meta.label}</span>
                    <span style={{ fontSize: '11px', color: isOver ? 'var(--danger)' : 'var(--text-secondary)' }}>{percent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      backgroundColor: isOver ? 'var(--danger)' : percent > 85 ? 'var(--warning)' : 'var(--primary)',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {formatCurrency(spent, currencySymbol)} of {formatCurrency(b.limit, currencySymbol)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Savings Goals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('savings_goals')}</span>
          <button
            type="button"
            onClick={() => {
              setNewGoalName('');
              setNewGoalTarget('');
              setNewGoalColor('#22c55e');
              setShowAddGoalModal(true);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Goal
          </button>
        </div>
        {goals.length > 0 ? (
          goals.slice(0, 3).map((g) => {
            const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <div key={g.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', color: g.color || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Target size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{g.name}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Target: {formatCurrency(g.targetAmount, currencySymbol)}
                      </span>
                    </div>
                  </div>
                  {activeGoalInput === g.id ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        placeholder="0.00"
                        className="glass-input animate-fade-in"
                        style={{ width: '80px', fontSize: '12px', padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', outline: 'none' }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const parsed = parseFloat(contributionAmount);
                          if (!isNaN(parsed) && parsed > 0) {
                            onAddGoalProgress(g.id, parsed);
                          }
                          setActiveGoalInput(null);
                        }}
                        style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#fff', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setActiveGoalInput(null)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: 'var(--text-secondary)', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setActiveGoalInput(g.id);
                          setContributionAmount('');
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                      >
                        + Add
                      </button>
                      <button
                        onClick={() => {
                          setEditingGoalId(g.id);
                          setEditGoalName(g.name);
                          setEditGoalTarget(g.targetAmount.toString());
                          setEditGoalColor(g.color || '#22c55e');
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      backgroundColor: g.color || 'var(--primary)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>{formatCurrency(g.currentAmount, currencySymbol)} saved</span>
                    <span>{percent}%</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '28px' }}>🎯</span>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{t('dreams_destination')}</h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('create_first_goal')}</span>
          </div>
        )}
      </div>

      {/* Empty State visual recommendations for new user */}
      {transactions.length === 0 && (
        <div className="glass-panel" style={{
          padding: '24px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(20,20,33,0.5) 0%, rgba(99,102,241,0.05) 100%)',
          border: '1px dashed rgba(99,102,241,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Your Ledger is Empty</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
              Welcome to zenbudget! Start tracking your cash flow by clicking the "Add New" button at the top.
            </p>
          </div>
        </div>
      )}

      {/* Recent Transactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity &amp; Ledger</span>
          <button
            onClick={onViewAllTransactionsClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            {t('see_all')} <ChevronRight size={14} />
          </button>
        </div>

        {recentTransactions.length === 0 ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentTransactions.map((t) => {
              const meta = categoryMeta[t.category] || categoryMeta.other;
              return (
                <div
                  key={t.id}
                  className="glass-panel glass-panel-hover"
                  onClick={() => onEditTransaction(t)}
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{t.title}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: t.type === 'income' ? 'var(--success)' : 'var(--text-primary)'
                  }}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currencySymbol)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, padding: '20px'
        }} onClick={() => setShowShareModal(false)}>
          <div
            style={{
              width: '100%', maxWidth: '340px', padding: '0', borderRadius: '28px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)', position: 'relative',
              textAlign: 'center', color: 'var(--text-primary)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ height: '4px', background: 'linear-gradient(to right, #22c55e, #14b8a6, #3b82f6)' }} />
            <div style={{ padding: '28px 24px' }}>
              <span style={{ fontSize: '36px' }}>🔥</span>
              <h3 style={{ fontSize: '26px', fontWeight: 800, marginTop: '12px', color: 'var(--text-primary)', fontFamily: "'Manrope', sans-serif" }}>
                Saved {currencySymbol}{totalSaved.toLocaleString()}
              </h3>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '6px' }}>
                Top 12% in <span style={{ color: '#22c55e' }}>Zen</span>Budget!
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '14px', lineHeight: 1.5, fontStyle: 'italic' }}>
                "My money habit streak is growing. Saving target is on track! 🌿"
              </p>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => handleCardShare('whatsapp')}
                  style={{ width: '100%', padding: '12px', borderRadius: '14px', fontWeight: 800, fontSize: '13px', background: '#25D366', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                  WhatsApp Share 💬
                </button>
                <button onClick={() => handleCardShare('instagram')}
                  style={{ width: '100%', padding: '12px', borderRadius: '14px', fontWeight: 800, fontSize: '13px', background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                  Instagram Story 📸
                </button>
                <button onClick={() => handleCardShare('facebook')}
                  style={{ width: '100%', padding: '12px', borderRadius: '14px', fontWeight: 800, fontSize: '13px', background: '#1877F2', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                  Facebook Share 👥
                </button>
                <button onClick={() => setShowShareModal(false)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: '12px', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '13px', marginTop: '4px' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(12px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, padding: '20px'
        }} onClick={() => setShowInviteModal(false)}>
          <div
            className="glass-panel animate-slide-up"
            style={{
              width: '100%', maxWidth: '345px', padding: '24px', borderRadius: '28px',
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(9, 9, 15, 0.98) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.3)', position: 'relative',
              textAlign: 'center', color: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(236,72,153,0.08)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: "'Manrope', sans-serif" }}>Invite & Earn Premium</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            {/* Content info */}
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', textAlign: 'left', marginBottom: '16px' }}>
              Get <strong>1 Month Free Premium Reward</strong> when a friend joins using your code and purchases any plan!
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(236, 72, 153, 0.4)',
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>YOUR REFERRAL CODE</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '0.05em' }}>
                {(() => {
                  let inviteCode = localStorage.getItem('zb_user_referral_code') || localStorage.getItem('zb_invite_code');
                  if (!inviteCode) {
                    const userNameClean = (userName || 'User').replace(/\s+/g, '').toUpperCase();
                    inviteCode = `ZB-${userNameClean.slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;
                    localStorage.setItem('zb_invite_code', inviteCode);
                  }
                  if (inviteCode && !inviteCode.toUpperCase().startsWith('ZB-')) {
                    inviteCode = 'ZB-' + inviteCode;
                  }
                  return inviteCode;
                })()}
              </span>
            </div>

            {/* Steps list */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(236,72,153,0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: 800, textAlign: 'center', lineHeight: '18px', paddingLeft: '5px' }}>1</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>Share your link or code with a friend.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(236,72,153,0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: 800, textAlign: 'center', lineHeight: '18px', paddingLeft: '5px' }}>2</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>Friend enters your code at signup & joins trial.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(236,72,153,0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: 800, textAlign: 'center', lineHeight: '18px', paddingLeft: '5px' }}>3</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}><strong>Friend buys/upgrades plan</strong>, and your premium is automatically extended by 30 days!</span>
              </div>
            </div>

            {/* Sharing buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={async () => {
                  let inviteCode = localStorage.getItem('zb_user_referral_code') || localStorage.getItem('zb_invite_code') || 'ZB-REFER';
                  if (inviteCode && !inviteCode.toUpperCase().startsWith('ZB-')) {
                    inviteCode = 'ZB-' + inviteCode;
                  }
                  const shareUrl = `https://zenbudget-tracker.vercel.app/?code=${inviteCode}`;
                  const shareText = `🌿 Join me on ZenBudget! Track your money habits with AI insights. Use my referral code ${inviteCode} and we both get 1 Month Premium FREE! Join here: ${shareUrl}`;

                  if (navigator.share) {
                    try {
                      await navigator.share({ title: 'ZenBudget Invite', text: shareText, url: shareUrl });
                    } catch (e) { }
                  } else {
                    try {
                      await navigator.clipboard.writeText(shareText);
                      triggerToast('Share invitation text copied to clipboard!', 'success');
                    } catch (e) {
                      prompt('Copy invitation link:', shareText);
                    }
                  }
                  setShowInviteModal(false);
                }}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.2)'
                }}
              >
                Share Invitation Link 🔗
              </button>
              <button
                onClick={async () => {
                  let inviteCode = localStorage.getItem('zb_user_referral_code') || localStorage.getItem('zb_invite_code') || 'ZB-REFER';
                  if (inviteCode && !inviteCode.toUpperCase().startsWith('ZB-')) {
                    inviteCode = 'ZB-' + inviteCode;
                  }
                  try {
                    await navigator.clipboard.writeText(inviteCode);
                    triggerToast(`Referral code "${inviteCode}" copied to clipboard!`, 'success');
                  } catch (e) {
                    prompt('Copy referral code:', inviteCode);
                  }
                }}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Copy Only Code 📋
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Monthly Letter Modal */}
      {showMonthlyLetter && (() => {
        const start = new Date(trialStartDate || new Date().toISOString()).getTime();
        const diffInDays = (Date.now() - start) / (1000 * 60 * 60 * 24);
        const isUnlocked = diffInDays >= 30;

        const now = new Date();
        const thisMonthTx = transactions.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const totalMonthExpenses = thisMonthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const totalMonthIncome = thisMonthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalSaved = Math.max(0, totalMonthIncome - totalMonthExpenses);

        const catTotals: Record<string, number> = {};
        thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
          catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
        });
        let topCategory = '';
        let topCategoryAmount = 0;
        Object.entries(catTotals).forEach(([cat, val]) => {
          if (val > topCategoryAmount) {
            topCategory = cat;
            topCategoryAmount = val;
          }
        });

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000, padding: '20px'
          }} onClick={() => setShowMonthlyLetter(false)}>
            <div
              className="glass-panel animate-slide-up"
              style={{
                width: '100%', maxWidth: '350px', padding: '30px', borderRadius: '32px',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.1)', position: 'relative',
                textAlign: 'left', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                fontFamily: "'Manrope', sans-serif"
              }}
              onClick={e => e.stopPropagation()}
            >
              {!isUnlocked ? (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Monthly Report locked 🔒</span>
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    Your first **Monthly Letter from Zen** will unlock after <strong>30 days</strong> of tracking. <br /><br />
                    You have tracked for <strong>{Math.floor(diffInDays)} days</strong> so far. Keep logging daily to compile your personal money story!<br /><br />
                    <strong>{Math.max(1, 30 - Math.floor(diffInDays))} more days</strong> until unlock.
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                    Your Monthly Letter from Zen 🌿
                  </h3>

                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.95)' }}>
                    Dear {(userName || 'User').split(' ')[0]},<br /><br />
                    This month you made <strong>{thisMonthTx.length}</strong> financial decisions.<br /><br />
                    Through conscious habits, you logged a total income of <strong>{currencySymbol}{totalMonthIncome.toLocaleString()}</strong> and spent <strong>{currencySymbol}{totalMonthExpenses.toLocaleString()}</strong>.<br /><br />
                    {totalSaved > 0 ? (
                      <span>You successfully saved <strong>{currencySymbol}{totalSaved.toLocaleString()}</strong> this month! This is a great achievement.</span>
                    ) : (
                      <span>You spent your full budget this month. Let's focus on setting limits to build savings.</span>
                    )}
                    {topCategory && (
                      <span><br /><br />Your highest spending category was <strong>{topCategory.toUpperCase()}</strong> with a total of <strong>{currencySymbol}{topCategoryAmount.toLocaleString()}</strong>. Controlling this category will help grow your wealth.</span>
                    )}
                    <br /><br />
                    Overall, I'm extremely proud of your progress. Keep building these habits.<br /><br />
                    See you next month.<br /><br />
                    — <strong>Zen 🌿</strong>
                  </p>
                </>
              )}

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => setShowMonthlyLetter(false)}
                  className="glass-button active"
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', fontWeight: 700, background: 'linear-gradient(to right, var(--primary), var(--secondary))', color: '#fff', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                >
                  Close Letter
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Edit Challenge Modal */}
      {editingChallengeId !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, padding: '20px'
        }} onClick={() => setEditingChallengeId(null)}>
          <div
            style={{
              width: '100%', maxWidth: '410px', padding: '28px', borderRadius: '28px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)', position: 'relative',
              textAlign: 'left', color: 'var(--text-primary)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              fontFamily: "'Manrope', sans-serif"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Edit Active Challenge 🏆
              </h3>
              <button
                type="button"
                onClick={() => setEditingChallengeId(null)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-input)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Input Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Challenge Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={editChallengeTitle}
                  onChange={(e) => setEditChallengeTitle(e.target.value)}
                  placeholder="Enter challenge title..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Status / Subtitle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
                  Status / Subtitle
                </label>
                <input
                  type="text"
                  value={editChallengeSubtitle}
                  onChange={(e) => setEditChallengeSubtitle(e.target.value)}
                  placeholder="Streak: 0 days..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Progress Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
                    Progress Percentage
                  </label>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#059669',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    {editChallengePercent}% Complete
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editChallengePercent}
                  onChange={(e) => setEditChallengePercent(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer', height: '6px' }}
                />

                {/* Preset Progress Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '2px' }}>
                  {[0, 25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setEditChallengePercent(pct)}
                      style={{
                        padding: '5px 0',
                        borderRadius: '8px',
                        background: editChallengePercent === pct ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-input)',
                        border: editChallengePercent === pct ? '1px solid #10b981' : '1px solid var(--border-input)',
                        color: editChallengePercent === pct ? '#059669' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const list = challenges.map((ch: any) =>
                      ch.id === editingChallengeId
                        ? { ...ch, title: editChallengeTitle, subtitle: editChallengeSubtitle, percent: editChallengePercent }
                        : ch
                    );
                    setChallenges(list);
                    localStorage.setItem('zb_challenges', JSON.stringify(list));
                    setEditingChallengeId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '13px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} /> Save Changes
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const list = challenges.filter((ch: any) => ch.id !== editingChallengeId);
                    setChallenges(list);
                    localStorage.setItem('zb_challenges', JSON.stringify(list));
                    setEditingChallengeId(null);
                  }}
                  style={{
                    padding: '13px 18px',
                    borderRadius: '14px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, padding: '20px'
        }} onClick={() => setShowAddGoalModal(false)}>
          <div
            className="glass-panel animate-slide-up"
            style={{
              width: '100%', maxWidth: '350px', padding: '24px', borderRadius: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)', position: 'relative',
              textAlign: 'left', color: 'var(--text-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              fontFamily: "'Manrope', sans-serif"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>Add Savings Goal 🎯</h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              const parsedTarget = parseFloat(newGoalTarget);
              if (newGoalName.trim() && !isNaN(parsedTarget) && parsedTarget > 0) {
                onAddNewGoal(newGoalName.trim(), parsedTarget, newGoalColor);
                setShowAddGoalModal(false);
              } else {
                triggerToast("Please enter a valid goal name and target amount.", "warning");
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>GOAL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New iPhone, Travel Fund"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', borderRadius: '10px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>TARGET AMOUNT ({currencySymbol})</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', borderRadius: '10px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>THEME COLOR</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px', alignItems: 'center' }}>
                  {['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#ec4899', '#8b5cf6'].map(col => {
                    const isSelected = newGoalColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewGoalColor(col)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: col,
                          border: isSelected ? '3px solid var(--text-primary)' : 'none', cursor: 'pointer',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s ease'
                        }}
                      />
                    );
                  })}
                  {/* Custom Color Picker */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={newGoalColor}
                      onChange={(e) => setNewGoalColor(e.target.value)}
                      style={{ opacity: 0, position: 'absolute', width: '28px', height: '28px', cursor: 'pointer', zIndex: 2 }}
                    />
                    <div
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: !['#22c55e','#3b82f6','#ef4444','#f59e0b','#ec4899','#8b5cf6'].includes(newGoalColor)
                          ? newGoalColor
                          : 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                        border: !['#22c55e','#3b82f6','#ef4444','#f59e0b','#ec4899','#8b5cf6'].includes(newGoalColor)
                          ? '3px solid var(--text-primary)' : '1px solid var(--border-input)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                      }}
                      title="Pick Custom Color"
                    >🎨</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="submit"
                  className="glass-button active"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(to right, var(--primary), var(--secondary))', color: '#fff', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                >
                  Create Goal
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  style={{ padding: '12px 18px', borderRadius: '12px', fontWeight: 700, background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-input)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Edit Goal Modal */}
      {editingGoalId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, padding: '20px'
        }} onClick={() => setEditingGoalId(null)}>
          <div
            className="glass-panel animate-slide-up"
            style={{
              width: '100%', maxWidth: '350px', padding: '24px', borderRadius: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)', position: 'relative',
              textAlign: 'left', color: 'var(--text-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              fontFamily: "'Manrope', sans-serif"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>Edit Savings Goal 🎯</h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              const parsedTarget = parseFloat(editGoalTarget);
              if (editGoalName.trim() && !isNaN(parsedTarget) && parsedTarget > 0) {
                if (onEditGoal) {
                  onEditGoal(editingGoalId, editGoalName.trim(), parsedTarget, editGoalColor);
                }
                setEditingGoalId(null);
              } else {
                triggerToast("Please enter a valid goal name and target amount.", "warning");
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>GOAL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New iPhone, Travel Fund"
                  value={editGoalName}
                  onChange={(e) => setEditGoalName(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', borderRadius: '10px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>TARGET AMOUNT ({currencySymbol})</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={editGoalTarget}
                  onChange={(e) => setEditGoalTarget(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', borderRadius: '10px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>THEME COLOR</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px', alignItems: 'center' }}>
                  {['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#ec4899', '#8b5cf6'].map(col => {
                    const isSelected = editGoalColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setEditGoalColor(col)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: col,
                          border: isSelected ? '3px solid var(--text-primary)' : 'none', cursor: 'pointer',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s ease'
                        }}
                      />
                    );
                  })}
                  {/* Custom Color Picker */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={editGoalColor}
                      onChange={(e) => setEditGoalColor(e.target.value)}
                      style={{ opacity: 0, position: 'absolute', width: '28px', height: '28px', cursor: 'pointer', zIndex: 2 }}
                    />
                    <div
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: !['#22c55e','#3b82f6','#ef4444','#f59e0b','#ec4899','#8b5cf6'].includes(editGoalColor)
                          ? editGoalColor
                          : 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                        border: !['#22c55e','#3b82f6','#ef4444','#f59e0b','#ec4899','#8b5cf6'].includes(editGoalColor)
                          ? '3px solid var(--text-primary)' : '1px solid var(--border-input)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                      }}
                      title="Pick Custom Color"
                    >🎨</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="submit"
                  className="glass-button active"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(to right, var(--primary), var(--secondary))', color: '#fff', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this goal?")) {
                      if (onDeleteGoal) onDeleteGoal(editingGoalId);
                      setEditingGoalId(null);
                    }
                  }}
                  style={{ padding: '12px', borderRadius: '12px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={16} /> Delete
                </button>
                <button
                  type="button"
                  onClick={() => setEditingGoalId(null)}
                  style={{ padding: '12px 18px', borderRadius: '12px', fontWeight: 700, background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-input)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Badge Information & How to Unlock / Claim Modal */}
      {activeBadgeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={() => setActiveBadgeModal(null)}>
          <div style={{ background: 'var(--bg-card)', border: activeBadgeModal.canClaim ? '1px solid rgba(234,179,8,0.8)' : activeBadgeModal.isUnlocked ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--border-card)', borderRadius: '24px', padding: '24px', maxWidth: '340px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '54px', marginBottom: '10px' }}>{activeBadgeModal.icon}</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>{activeBadgeModal.title}</h3>
            
            <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: activeBadgeModal.canClaim ? 'rgba(234,179,8,0.15)' : activeBadgeModal.isUnlocked ? 'rgba(34,197,94,0.15)' : 'var(--bg-input)', color: activeBadgeModal.canClaim ? '#eab308' : activeBadgeModal.isUnlocked ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: '16px', border: activeBadgeModal.canClaim ? '1px solid rgba(234,179,8,0.4)' : activeBadgeModal.isUnlocked ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border-input)' }}>
              {activeBadgeModal.canClaim ? 'READY TO CLAIM 🎁' : activeBadgeModal.isClaimed ? 'CLAIMED 🏆' : 'LOCKED 🔒'}
            </div>

            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: '14px', padding: '14px', textAlign: 'left', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>How to Unlock:</p>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '10px' }}>{activeBadgeModal.requirement}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Current Progress:</p>
              <p style={{ fontSize: '12px', color: activeBadgeModal.canClaim ? '#eab308' : 'var(--primary)', fontWeight: 700 }}>{activeBadgeModal.progress}</p>
            </div>

            {activeBadgeModal.canClaim ? (
              <button
                onClick={() => handleClaimBadge(activeBadgeModal.id)}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#ffffff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)' }}
              >
                🎁 Claim Badge Reward!
              </button>
            ) : (
              <button
                onClick={() => setActiveBadgeModal(null)}
                style={{ width: '100%', padding: '12px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: '#ffffff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
              >
                {activeBadgeModal.isClaimed ? 'Badge Collected! ✨' : 'Got it! 👍'}
              </button>
            )}
          </div>
        </div>
      )}
      {/* All Accounts & Wallets See All Modal */}
      {showAllAccountsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={() => setShowAllAccountsModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '24px', padding: '24px', maxWidth: '440px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>All Accounts & Wallets ({accounts.length})</h3>
              </div>
              <button onClick={() => setShowAllAccountsModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Total Balance Summary Header */}
            <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(6,182,212,0.1) 100%)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '16px', padding: '16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Total Wallet Balance</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {formatCurrency(accounts.reduce((sum, a) => sum + (a.balance || 0), 0), currencySymbol)}
                </div>
              </div>
              <button
                onClick={() => { setShowAllAccountsModal(false); if (onAddAccountClick) onAddAccountClick(); }}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Add Account
              </button>
            </div>

            {/* Account List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {accounts.map((acc, index) => {
                const defaultColors = ['#0284c7', '#ea580c', '#7c3aed', '#22c55e', '#06b6d4', '#ec4899', '#f59e0b'];
                const cardBg = acc.color || defaultColors[index % defaultColors.length];
                return (
                  <div
                    key={acc.id}
                    style={{
                      background: cardBg,
                      borderRadius: '16px',
                      padding: '14px 18px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '24px', width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {acc.type === 'cash' ? '🪙' : acc.type === 'upi' ? '📱' : acc.type === 'credit' ? '💳' : acc.type === 'wallet' ? '👛' : acc.type === 'custom' ? '✨' : '🏦'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800 }}>{acc.name}</div>
                        <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>{acc.type} account</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800 }}>
                        {formatCurrency(acc.balance, currencySymbol)}
                      </span>
                      {onDeleteAccount && (
                        <button
                          onClick={() => onDeleteAccount(acc.id)}
                          style={{ background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          title="Delete account"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
