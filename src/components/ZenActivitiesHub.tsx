import React, { useState } from 'react';
import { 
  Gamepad2, 
  Brain, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  Zap,
  ChevronRight,
  Check
} from 'lucide-react';
import { CoinCatcherGame } from './CoinCatcherGame';
import { playCelebrationSound, playNotificationSound } from '../utils/audio';

interface ZenActivitiesHubProps {
  currencySymbol?: string;
  userReferralCode?: string;
  defaultTab?: 'game' | 'quiz' | 'challenge';
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

// 7 Daily Rotating Habit Challenges
const DAILY_CHALLENGES = [
  {
    day: 1,
    title: "Zero Food Delivery Day 🥗",
    sub: "Cook meals at home today. Zero orders on Swiggy or Zomato.",
    savingsEst: "₹450",
    difficulty: "Medium",
    category: "Dining",
    tip: "Meal prep a simple dinner. Drink water instead of ordering sugar drinks."
  },
  {
    day: 2,
    title: "Subscription Audit & Cancel ✂️",
    sub: "Open your play store or card auto-debits and cancel 1 unused app.",
    savingsEst: "₹299/mo",
    difficulty: "Easy",
    category: "Subscriptions",
    tip: "Check gym memberships, OTT apps, or cloud storage you rarely touch."
  },
  {
    day: 3,
    title: "₹100 Micro-Gullak Transfer 🪙",
    sub: "Send ₹100 right now to your savings pot, gold, or liquid fund.",
    savingsEst: "₹100",
    difficulty: "Easy",
    category: "Savings",
    tip: "Even ₹100 compounding at 12% over 15 years becomes ₹50,000+!"
  },
  {
    day: 4,
    title: "24-Hour Impulse Freeze 🧊",
    sub: "Add that Amazon/Myntra item to your wishlist and wait full 24h.",
    savingsEst: "₹1,500",
    difficulty: "Hard",
    category: "Shopping",
    tip: "72% of impulse urges disappear completely after sleeping on them."
  },
  {
    day: 5,
    title: "Coffee / Chai Cash Only ☕",
    sub: "Limit daily chai/snack spend to ₹30 maximum in exact change.",
    savingsEst: "₹120",
    difficulty: "Easy",
    category: "Daily Habits",
    tip: "Small everyday micro-leaks quietly drain ₹3,000+ every month."
  },
  {
    day: 6,
    title: "Log All Expenses Before Bed 📝",
    sub: "Use Zen AI Quick Capture to log every rupee spent today.",
    savingsEst: "Financial Clarity",
    difficulty: "Easy",
    category: "Discipline",
    tip: "Awareness alone reduces careless spending by 21% without feeling deprived."
  },
  {
    day: 7,
    title: "Weekly Review & Victory Lap 🏆",
    sub: "Check your 7-day spending chart and reward your discipline.",
    savingsEst: "Habit Formed",
    difficulty: "Rewarding",
    category: "Mindset",
    tip: "Give yourself a high five! You're in the top 5% of money-conscious people."
  }
];

export const ZenActivitiesHub: React.FC<ZenActivitiesHubProps> = ({
  currencySymbol = '₹',
  userReferralCode = '',
  defaultTab = 'game'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'quiz' | 'challenge'>(defaultTab);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

  // Daily Challenge State (Synced to localStorage)
  const todayKey = new Date().toISOString().slice(0, 10);
  const dayOfWeek = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const currentChallenge = DAILY_CHALLENGES[dayOfWeek] || DAILY_CHALLENGES[0];

  const [challengeCompleted, setChallengeCompleted] = useState(() => {
    return localStorage.getItem(`zen_challenge_${todayKey}`) === 'completed';
  });

  const [streakCount, setStreakCount] = useState(() => {
    const saved = localStorage.getItem('zen_activity_streak');
    return saved ? parseInt(saved, 10) : 4; // Default pleasant streak
  });

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
  };

  const handleCompleteChallenge = () => {
    if (challengeCompleted) return;
    playCelebrationSound();
    setChallengeCompleted(true);
    const newStreak = streakCount + 1;
    setStreakCount(newStreak);
    localStorage.setItem(`zen_challenge_${todayKey}`, 'completed');
    localStorage.setItem('zen_activity_streak', String(newStreak));
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

  // Collapsed Card Preview
  if (!isExpanded) {
    return (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
              flexShrink: 0
            }}>
              ✨
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                  Zen Arcade &amp; Brain Hub
                </p>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#10b981',
                  color: '#ffffff'
                }}>
                  3-in-1
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                🎮 Coin Catcher • 🧠 Money IQ Quiz • 🔥 Daily Habit Streak ({streakCount}d)
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '999px',
            background: '#10b981',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
            flexShrink: 0
          }}>
            <span>Open Hub</span>
            <ChevronRight size={15} />
          </div>
        </button>
      </div>
    );
  }

  // Expanded Hub View with 3 Activities
  return (
    <div style={{
      marginTop: '16px',
      marginBottom: '20px',
      borderRadius: '28px',
      border: '1.5px solid rgba(16, 185, 129, 0.35)',
      background: 'var(--bg-card)',
      overflow: 'hidden',
      boxShadow: '0 16px 40px rgba(0,0,0,0.18)'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-input, rgba(255,255,255,0.08))',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} color="#10b981" />
          <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>
            Zen Zone: Activities &amp; Habits
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '10px',
            padding: '5px 12px',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Close Hub
        </button>
      </div>

      {/* 3 Activity Tabs Selector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        padding: '8px',
        gap: '6px',
        background: 'rgba(0,0,0,0.03)',
        borderBottom: '1px solid var(--border-input, rgba(255,255,255,0.06))'
      }}>
        {/* Tab 1: Arcade Game */}
        <button
          onClick={() => setActiveTab('game')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '10px 6px',
            borderRadius: '16px',
            border: 'none',
            background: activeTab === 'game' ? '#10b981' : 'transparent',
            color: activeTab === 'game' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '11.5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'game' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
          }}
        >
          <Gamepad2 size={16} />
          <span>1. Coin Game</span>
        </button>

        {/* Tab 2: Money IQ Quiz */}
        <button
          onClick={() => setActiveTab('quiz')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '10px 6px',
            borderRadius: '16px',
            border: 'none',
            background: activeTab === 'quiz' ? '#10b981' : 'transparent',
            color: activeTab === 'quiz' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '11.5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'quiz' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
          }}
        >
          <Brain size={16} />
          <span>2. Money Quiz</span>
        </button>

        {/* Tab 3: Habit Streak */}
        <button
          onClick={() => setActiveTab('challenge')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '10px 6px',
            borderRadius: '16px',
            border: 'none',
            background: activeTab === 'challenge' ? '#10b981' : 'transparent',
            color: activeTab === 'challenge' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '11.5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'challenge' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
          }}
        >
          <Flame size={16} color={activeTab === 'challenge' ? '#ffffff' : '#f59e0b'} />
          <span>3. Habit Streak</span>
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
      {/* ACTIVITY 3: 24-HOUR NO-SPEND DAILY HABIT CHALLENGE                  */}
      {/* =================================================================== */}
      {activeTab === 'challenge' && (
        <div style={{ padding: '20px 18px' }}>
          {/* Streak Flame Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(239, 68, 68, 0.12) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                fontSize: '28px',
                animation: 'bounce 1.5s infinite'
              }}>
                🔥
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#f59e0b' }}>
                  {streakCount} Day Streak!
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Complete today's challenge to keep flame alive
                </div>
              </div>
            </div>

            <div style={{
              background: '#f59e0b',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800
            }}>
              Day {currentChallenge.day} / 7
            </div>
          </div>

          {/* Today's Active Challenge Card */}
          <div style={{
            background: challengeCompleted 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
              : 'rgba(255,255,255,0.02)',
            border: challengeCompleted 
              ? '1.5px solid rgba(16, 185, 129, 0.4)' 
              : '1.5px solid var(--border-input, rgba(255,255,255,0.08))',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '4px 10px',
                borderRadius: '999px'
              }}>
                🎯 Today's Mission
              </span>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: 700
              }}>
                Est. Savings: <strong style={{ color: '#10b981' }}>{currentChallenge.savingsEst}</strong>
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              {currentChallenge.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              {currentChallenge.sub}
            </p>

            <div style={{
              padding: '10px 14px',
              borderRadius: '14px',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid var(--border-input, rgba(255,255,255,0.06))',
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              marginBottom: '18px'
            }}>
              💡 <strong>Pro Tip:</strong> {currentChallenge.tip}
            </div>

            {challengeCompleted ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px',
                borderRadius: '16px',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '14px',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
              }}>
                <CheckCircle2 size={18} />
                <span>Mission Completed for Today! 🎉</span>
              </div>
            ) : (
              <button
                onClick={handleCompleteChallenge}
                className="hover-lift"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Check size={18} />
                <span>Mark as Done &amp; Boost Streak</span>
              </button>
            )}
          </div>

          {/* 7-Day Habit Track Grid */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '6px'
          }}>
            {DAILY_CHALLENGES.map((ch, idx) => {
              const isPast = idx < dayOfWeek;
              const isCurrent = idx === dayOfWeek;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px 4px',
                    borderRadius: '12px',
                    background: isCurrent 
                      ? (challengeCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)')
                      : (isPast ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)'),
                    border: isCurrent 
                      ? '1px solid #10b981' 
                      : '1px solid transparent'
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    Day {ch.day}
                  </div>
                  <div style={{ fontSize: '14px', marginTop: '2px' }}>
                    {isPast || (isCurrent && challengeCompleted) ? '✅' : (isCurrent ? '⏳' : '🔒')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
