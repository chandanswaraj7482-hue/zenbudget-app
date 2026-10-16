import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Brain, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  X,
  RotateCcw, 
  Award, 
  Zap,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Flame,
  CheckCircle2,
  BookmarkCheck,
  Video
} from 'lucide-react';
import { CoinCatcherGame } from './CoinCatcherGame';
import { playCelebrationSound, playNotificationSound } from '../utils/audio';
import { admobService } from '../services/admobService';

interface ZenActivitiesHubProps {
  currencySymbol?: string;
  userReferralCode?: string;
  defaultTab?: 'game' | 'quiz' | 'afford';
}

// 8 Curated Rapid Money IQ Quiz Questions
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "How regularly do you check your bank balance & daily expenses?",
    options: [
      { text: "Every day — I log every single rupee precisely", points: 10, tag: "Disciplined" },
      { text: "Once or twice a week when I remember", points: 7, tag: "Moderate" },
      { text: "Only when low balance or debit alerts pop up", points: 4, tag: "Reactive" },
      { text: "Never — I just guess what's left in my account", points: 1, tag: "High Risk" }
    ]
  },
  {
    id: 2,
    question: "When tempted by an unplanned impulse buy (₹1,000+), what do you do?",
    options: [
      { text: "I pause 24-48 hours before deciding to purchase", points: 10, tag: "Zen Master" },
      { text: "I think for 5 minutes then usually buy it anyway", points: 6, tag: "Moderate Impulse" },
      { text: "I buy immediately and feel guilty/stressed later", points: 3, tag: "High Impulse" },
      { text: "I put it on Credit Card EMI or Pay Later (BNPL)", points: 1, tag: "Debt Magnet" }
    ]
  },
  {
    id: 3,
    question: "Do you have an emergency fund for unexpected crises?",
    options: [
      { text: "Yes! 3 to 6 months of living expenses safely saved", points: 10, tag: "Rock Solid" },
      { text: "About 1 month of living expenses in savings", points: 7, tag: "Developing" },
      { text: "Very small buffer (less than ₹5,000)", points: 4, tag: "Vulnerable" },
      { text: "No emergency savings at all currently", points: 1, tag: "At Risk" }
    ]
  },
  {
    id: 4,
    question: "What percentage of your monthly income do you save or invest?",
    options: [
      { text: "30% or more (SIP, PPF, Gold, Mutual Funds)", points: 10, tag: "Wealth Builder" },
      { text: "15% to 29% consistently every payday", points: 8, tag: "Disciplined" },
      { text: "Less than 10% whatever is left at month end", points: 4, tag: "Casual" },
      { text: "0% — My entire salary gets spent before month end", points: 1, tag: "Struggling" }
    ]
  },
  {
    id: 5,
    question: "How many active paid subscriptions do you currently have?",
    options: [
      { text: "Only 1-2 essential services that I use every week", points: 10, tag: "Minimalist" },
      { text: "3 to 4 entertainment/shopping subscriptions", points: 7, tag: "Standard" },
      { text: "5+ subscriptions, some I haven't watched in months", points: 3, tag: "Leaking" },
      { text: "I honestly don't know what auto-debits my account", points: 1, tag: "Blind Spot" }
    ]
  },
  {
    id: 6,
    question: "How do you pay your credit card bill every month?",
    options: [
      { text: "I pay the 100% total due before the due date always", points: 10, tag: "Debt Free" },
      { text: "I pay full most months, occasionally miss by 1 day", points: 7, tag: "Good" },
      { text: "I sometimes pay only the 'Minimum Amount Due'", points: 3, tag: "High Interest Trap" },
      { text: "I don't have credit cards / credit card maxed out", points: 2, tag: "Caution" }
    ]
  },
  {
    id: 7,
    question: "If you receive an unexpected ₹50,000 bonus tomorrow, what's step 1?",
    options: [
      { text: "Invest 70% in SIP/index fund & keep 30% for guilt-free fun", points: 10, tag: "Smart Investor" },
      { text: "Pay off any existing loans or credit card balance", points: 10, tag: "Debt Killer" },
      { text: "Keep it all in savings account without a plan", points: 5, tag: "Passive" },
      { text: "Instantly buy new gadgets, clothes or party", points: 2, tag: "Spender" }
    ]
  },
  {
    id: 8,
    question: "Do you talk openly with your partner or family about money goals?",
    options: [
      { text: "Yes, we plan joint budgets and track shared expenses", points: 10, tag: "Synchronized" },
      { text: "We discuss big expenses only, not daily kharcha", points: 7, tag: "Partial" },
      { text: "Money discussions usually lead to tension or arguments", points: 3, tag: "Strained" },
      { text: "I manage all my finances 100% privately alone", points: 6, tag: "Solo" }
    ]
  }
];

export const ZenActivitiesHub: React.FC<ZenActivitiesHubProps> = ({
  currencySymbol = '₹',
  userReferralCode = '',
  defaultTab = 'game'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'quiz' | 'afford'>(defaultTab);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [unlockedDeepPlan, setUnlockedDeepPlan] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  // Activity 3: "Can I Afford It?" State
  const [affordItemName, setAffordItemName] = useState('New Sneakers');
  const [affordAmount, setAffordAmount] = useState<number>(3500);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(45000);
  const [isFrozenInWishlist, setIsFrozenInWishlist] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleAnswerQuiz = (points: number) => {
    playNotificationSound();
    const newAnswers = [...selectedAnswers, points];
    setSelectedAnswers(newAnswers);
    const newScore = quizScore + points;
    setQuizScore(newScore);

    if (quizIndex + 1 < QUIZ_QUESTIONS.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      setQuizCompleted(true);
      playCelebrationSound();
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswers([]);
    setQuizCompleted(false);
    setQuizStarted(true);
    setUnlockedDeepPlan(false);
  };

  const handleUnlockDeepPlanWithAd = async () => {
    setAdLoading(true);
    try {
      await admobService.showRewardedAd(() => {
        setUnlockedDeepPlan(true);
        playCelebrationSound();
      });
    } finally {
      setAdLoading(false);
    }
  };

  // Helper for Quiz Result Profile
  const getQuizArchetype = (score: number) => {
    const maxScore = QUIZ_QUESTIONS.length * 10;
    const percentage = Math.round((score / maxScore) * 100);
    if (percentage >= 80) {
      return {
        title: "Zen Wealth Master 👑",
        color: "#10b981",
        badge: "Top 5% Financial Discipline",
        desc: "Outstanding financial awareness! You are fully in control of your cash flow, avoid impulse traps, and build wealth with automated clarity.",
        advice: "Next level: Focus on tax optimization and compounding assets."
      };
    } else if (percentage >= 55) {
      return {
        title: "Mindful Builder 🌱",
        color: "#3b82f6",
        badge: "Solid Foundation • Minor Leaks",
        desc: "You have strong financial instincts but occasional spontaneous purchases or loose subscription tracking slow down your savings momentum.",
        advice: "Use Zen 48h Impulse Blocker and safe daily limits to seal micro-leaks."
      };
    } else {
      return {
        title: "Spontaneous Spender ⚡",
        color: "#f59e0b",
        badge: "High Growth Potential",
        desc: "Money leaves your account faster than you realize. Emotional spending or living paycheck-to-paycheck is causing unnecessary stress.",
        advice: "Start with Zen Quick Capture for 7 days — awareness alone cuts 20% waste!"
      };
    }
  };

  // Activity 3 Math Helpers
  // Hourly wage based on 22 working days * 8 hours = 176 hours/month
  const hourlyRate = Math.max(1, Math.round(monthlyIncome / 176));
  const workHoursCost = (affordAmount / hourlyRate).toFixed(1);

  // SIP Compounding at 12% Annual CAGR: A = P * (1 + r)^t
  const sip5Years = Math.round(affordAmount * Math.pow(1 + 0.12, 5));
  const sip10Years = Math.round(affordAmount * Math.pow(1 + 0.12, 10));
  const sip20Years = Math.round(affordAmount * Math.pow(1 + 0.12, 20));

  // Affordability Verdict: % of Monthly Income
  const costPercentage = ((affordAmount / Math.max(1, monthlyIncome)) * 100);
  const getAffordVerdict = () => {
    if (costPercentage <= 5) {
      return {
        color: '#10b981',
        title: '🟢 Safe & Guilt-Free Buy',
        badge: 'Low Impact (< 5% income)',
        desc: 'This purchase fits cleanly within your discretionary budget. You can purchase this guilt-free without touching your savings.'
      };
    } else if (costPercentage <= 20) {
      return {
        color: '#f59e0b',
        title: '🟡 Pause 24-Hour Buffer',
        badge: 'Moderate Impact (5-20% income)',
        desc: 'Significant spending chunk. We strongly recommend sleeping on it for 24-48 hours before pulling the trigger to eliminate dopamine impulse.'
      };
    } else {
      return {
        color: '#ef4444',
        title: '🔴 Debt / High-Risk Warning',
        badge: 'High Impact (> 20% income)',
        desc: 'High financial strain! If you need Credit Card EMI or Pay Later to buy this, avoid it. It will trigger spending regret.'
      };
    }
  };

  const affordVerdict = getAffordVerdict();

  const handleFreezeWishlist = () => {
    playNotificationSound();
    setIsFrozenInWishlist(true);
    try {
      const existing = JSON.parse(localStorage.getItem('zb_wishlist_items') || '[]');
      existing.unshift({
        name: affordItemName,
        amount: affordAmount,
        addedAt: new Date().toISOString(),
        unlocksAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
      });
      localStorage.setItem('zb_wishlist_items', JSON.stringify(existing.slice(0, 10)));
    } catch (_) {}
    setTimeout(() => setIsFrozenInWishlist(false), 3000);
  };

  // Collapsed Card Preview
  return (
    <>
      {/* 1. Hub Entry Card (Always clean in More tools menu) */}
      <div style={{ marginTop: '16px', marginBottom: '16px' }}>
        <button
          onClick={() => setIsExpanded(true)}
          className="hover-lift"
          style={{
            width: '100%',
            padding: '16px 18px',
            borderRadius: '24px',
            border: '1.5px solid rgba(16, 185, 129, 0.4)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
              flexShrink: 0
            }}>
              🎮
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Zen Arcade &amp; Brain Hub
                </span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  3-in-1
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '3px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                🎮 Coin Game • 🧠 Money IQ • ⚡ Afford?
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '7px 12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            flexShrink: 0,
            marginLeft: '8px',
            whiteSpace: 'nowrap'
          }}>
            <span>Play</span>
            <ChevronRight size={14} />
          </div>
        </button>
      </div>

      {/* 2. DEDICATED FULL-SCREEN SEPARATE GAMING & BRAIN HUB PAGE */}
      {isExpanded && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          background: 'var(--bg-primary, #090d16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Dedicated Full-Screen Header with Back & Close */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary, #fff)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Back to More"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary, #fff)' }}>
                    Zen Arcade &amp; Brain Hub
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    lineHeight: 1.2
                  }}>
                    3-in-1
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', margin: '1px 0 0 0' }}>
                  🎮 Arcade • 🧠 IQ Quiz • ⚡ Can I Afford It?
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '6px 14px',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <X size={14} />
              <span>Close</span>
            </button>
          </div>

          {/* Full Screen Scrollable Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 14px 50px 14px',
            maxWidth: '560px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}>
            {/* 3 Activity Tabs Selector */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              padding: '6px',
              gap: '6px',
              background: 'var(--bg-card, rgba(30, 41, 59, 0.6))',
              borderRadius: '16px',
              border: '1px solid var(--border-input, rgba(255,255,255,0.08))',
              marginBottom: '16px'
            }}>
        {/* Tab 1: Arcade Game */}
        <button
          onClick={() => setActiveTab('game')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 6px',
            borderRadius: '14px',
            border: 'none',
            background: activeTab === 'game' ? '#10b981' : 'transparent',
            color: activeTab === 'game' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'game' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
          }}
        >
          <Gamepad2 size={16} />
          <span>1. Arcade</span>
        </button>

        {/* Tab 2: Money IQ Quiz */}
        <button
          onClick={() => setActiveTab('quiz')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 6px',
            borderRadius: '14px',
            border: 'none',
            background: activeTab === 'quiz' ? '#10b981' : 'transparent',
            color: activeTab === 'quiz' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'quiz' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
          }}
        >
          <Brain size={16} />
          <span>2. IQ Quiz</span>
        </button>

        {/* Tab 3: "Can I Afford It?" Impulse Checker */}
        <button
          onClick={() => setActiveTab('afford')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 6px',
            borderRadius: '14px',
            border: 'none',
            background: activeTab === 'afford' ? '#10b981' : 'transparent',
            color: activeTab === 'afford' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'afford' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
          }}
        >
          <Zap size={16} />
          <span>3. Afford It?</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* ACTIVITY 1: COIN CATCHER GAME                                       */}
      {/* =================================================================== */}
      {activeTab === 'game' && (
        <div style={{ padding: '4px' }}>
          <CoinCatcherGame
            currencySymbol={currencySymbol}
            userReferralCode={userReferralCode}
            defaultExpanded={true}
            title="🎮 Zen Coin Catcher Arcade"
          />
        </div>
      )}

      {/* =================================================================== */}
      {/* ACTIVITY 2: 60-SECOND MONEY IQ QUIZ                                 */}
      {/* =================================================================== */}
      {activeTab === 'quiz' && (
        <div style={{ padding: '20px 18px' }}>
          {!quizStarted && !quizCompleted && (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '30px'
              }}>
                🧠
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                60-Second Money IQ &amp; Personality Quiz
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '340px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Discover your true Wealth Archetype, uncover hidden spending leaks, and unlock your personal Financial Health Score.
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '24px'
              }}>
                <span style={{ fontSize: '11.5px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '999px', fontWeight: 700 }}>
                  ⚡ 8 Quick Questions
                </span>
                <span style={{ fontSize: '11.5px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 12px', borderRadius: '999px', fontWeight: 700 }}>
                  🎯 Instant Health Score
                </span>
                <span style={{ fontSize: '11.5px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 12px', borderRadius: '999px', fontWeight: 700 }}>
                  🛡️ 100% Private
                </span>
              </div>

              <button
                onClick={() => setQuizStarted(true)}
                className="hover-lift"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '14px 32px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
                }}
              >
                <span>Start Money IQ Quiz</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {quizStarted && !quizCompleted && (
            <div>
              {/* Question Progress Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}</span>
                  <span style={{ color: '#10b981' }}>{Math.round(((quizIndex + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-input, rgba(255,255,255,0.08))', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${((quizIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                    transition: 'width 0.3s ease-out'
                  }} />
                </div>
              </div>

              {/* Question Card */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-input, rgba(255,255,255,0.08))',
                borderRadius: '20px',
                padding: '18px',
                marginBottom: '16px'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {QUIZ_QUESTIONS[quizIndex].question}
                </h4>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {QUIZ_QUESTIONS[quizIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerQuiz(option.points)}
                    className="hover-lift"
                    style={{
                      padding: '13px 16px',
                      borderRadius: '16px',
                      border: '1.5px solid var(--border-input, rgba(255,255,255,0.08))',
                      background: 'var(--bg-input, rgba(0,0,0,0.03))',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{option.text}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      flexShrink: 0,
                      marginLeft: '10px'
                    }}>
                      {option.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {quizCompleted && (
            <div style={{ textAlign: 'center', padding: '12px 6px' }}>
              {(() => {
                const result = getQuizArchetype(quizScore);
                const scorePercent = Math.round((quizScore / (QUIZ_QUESTIONS.length * 10)) * 100);
                return (
                  <div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 14px',
                      borderRadius: '999px',
                      background: `${result.color}20`,
                      color: result.color,
                      fontSize: '11px',
                      fontWeight: 800,
                      marginBottom: '12px'
                    }}>
                      <Award size={14} />
                      {result.badge}
                    </div>

                    <h3 style={{ fontSize: '24px', fontWeight: 900, color: result.color, margin: '0 0 6px 0' }}>
                      {result.title}
                    </h3>

                    <div style={{
                      display: 'inline-block',
                      fontSize: '38px',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      margin: '10px 0'
                    }}>
                      {scorePercent}<span style={{ fontSize: '20px', color: 'var(--text-secondary)' }}>/100</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Financial Health Index
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-input, rgba(255,255,255,0.08))',
                      borderRadius: '18px',
                      padding: '16px',
                      margin: '16px 0',
                      textAlign: 'left'
                    }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                        {result.desc}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        background: `${result.color}15`,
                        padding: '10px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: result.color,
                        fontWeight: 700
                      }}>
                        <Zap size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>Zen Recommendation: {result.advice}</span>
                      </div>
                    </div>

                    {/* Rewarded Video Ad: Unlock AI Wealth Roadmap */}
                    {!unlockedDeepPlan ? (
                      <button
                        onClick={handleUnlockDeepPlanWithAd}
                        disabled={adLoading}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          cursor: adLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                          marginBottom: '12px',
                          opacity: adLoading ? 0.7 : 1
                        }}
                      >
                        <Video size={16} />
                        {adLoading ? 'Loading Sponsor Video...' : '🎬 Watch Video Ad to Unlock AI Wealth Roadmap'}
                      </button>
                    ) : (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '16px',
                        padding: '16px',
                        marginBottom: '14px',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#10b981', fontWeight: 800, fontSize: '13px' }}>
                          <Sparkles size={16} />
                          <span>Unlocked AI 5-Step Wealth Roadmap:</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          <li><strong>50/30/20 Rule:</strong> Limit non-essential wants to max 30% of take-home pay.</li>
                          <li><strong>Automated SIP Target:</strong> Invest min {currencySymbol}3,000/mo at 12% CAGR to build a {currencySymbol}10 Lakh nest egg.</li>
                          <li><strong>48-Hr Impulse Buffer:</strong> Always park impulsive buys in Zen Wishlist before swiping.</li>
                          <li><strong>Liquid Emergency Fund:</strong> Keep 3 months of basic living expenses safely parked in high-yield savings.</li>
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={handleRestartQuiz}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-input)',
                        color: 'var(--text-secondary)',
                        padding: '10px 20px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RotateCcw size={14} />
                      Retake Quiz
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* ACTIVITY 3: "CAN I AFFORD IT?" & SIP MULTIPLIER                     */}
      {/* =================================================================== */}
      {activeTab === 'afford' && (
        <div style={{ padding: '20px 18px' }}>
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              padding: '4px 12px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Zap size={13} />
              Instant Impulse Purchase Audit
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>
              Can I Really Afford This? 🤔
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Audit unplanned purchases in 10 seconds before swiping your card.
            </p>
          </div>

          {/* Quick Item Input Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1.5px solid var(--border-input, rgba(255, 255, 255, 0.08))',
            borderRadius: '20px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  What do you want to buy?
                </label>
                <input
                  type="text"
                  value={affordItemName}
                  onChange={(e) => setAffordItemName(e.target.value)}
                  placeholder="e.g. Headphones, Shoes"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-input)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Item Price ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={affordAmount || ''}
                  onChange={(e) => setAffordAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="3500"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-input)',
                    background: 'var(--bg-input)',
                    color: '#10b981',
                    fontSize: '14px',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Quick Price Pick Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: '☕ ₹150 Chai', amt: 150 },
                { label: '🍕 ₹600 Food', amt: 600 },
                { label: '👟 ₹3,500 Shoes', amt: 3500 },
                { label: '📱 ₹25,000 Gadget', amt: 25000 }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setAffordAmount(chip.amt)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: affordAmount === chip.amt ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: affordAmount === chip.amt ? '1px solid #10b981' : '1px solid var(--border-input)',
                    color: affordAmount === chip.amt ? '#10b981' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verdict Alert Card */}
          <div style={{
            background: `${affordVerdict.color}15`,
            border: `1.5px solid ${affordVerdict.color}40`,
            borderRadius: '20px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: affordVerdict.color }}>
                {affordVerdict.title}
              </span>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: affordVerdict.color,
                background: `${affordVerdict.color}20`,
                padding: '2px 8px',
                borderRadius: '999px'
              }}>
                {affordVerdict.badge}
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
              {affordVerdict.desc}
            </p>
          </div>

          {/* Key Mindful Reality Metrics (Hours of Life & SIP Multiplier) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {/* Metric 1: Life Work Hours */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-input, rgba(255,255,255,0.08))',
              borderRadius: '16px',
              padding: '14px',
              textAlign: 'center'
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <Clock size={16} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#f59e0b' }}>
                {workHoursCost} hrs
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '2px' }}>
                Of Your Life Worked
              </div>
            </div>

            {/* Metric 2: 10-Yr SIP Growth */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-input, rgba(255,255,255,0.08))',
              borderRadius: '16px',
              padding: '14px',
              textAlign: 'center'
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <TrendingUp size={16} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>
                {currencySymbol}{sip10Years.toLocaleString()}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '2px' }}>
                Wealth If Invested (10 Yrs)
              </div>
            </div>
          </div>

          {/* SIP Wealth Time Machine Breakdown */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '18px',
            padding: '14px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
              <TrendingUp size={14} />
              <span>SIP Wealth Multiplier (12% CAGR):</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <div>In 5 Years: <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}{sip5Years.toLocaleString()}</strong></div>
              <div>In 10 Years: <strong style={{ color: '#10b981' }}>{currencySymbol}{sip10Years.toLocaleString()}</strong></div>
              <div>In 20 Years: <strong style={{ color: '#06b6d4' }}>{currencySymbol}{sip20Years.toLocaleString()}</strong></div>
            </div>
          </div>

          {/* 1-Tap Action: Cool-Off in Wishlist */}
          <button
            onClick={handleFreezeWishlist}
            className="hover-lift"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              background: isFrozenInWishlist 
                ? '#10b981' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
            }}
          >
            {isFrozenInWishlist ? (
              <>
                <CheckCircle2 size={16} />
                <span>Frozen in 48-Hour Wishlist! ❄️</span>
              </>
            ) : (
              <>
                <BookmarkCheck size={16} />
                <span>Freeze &amp; Cool Off for 48 Hours 🧊</span>
              </>
            )}
          </button>
        </div>
      )}
          </div>
        </div>
      )}
    </>
  );
};
