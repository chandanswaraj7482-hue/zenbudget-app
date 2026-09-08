import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Search, Sun, Moon, Target, Shield, Users, Clock, Star, Smartphone, Brain, TrendingUp, Heart, Activity, ChevronDown, MessageCircleHeart, ChartLine, BookHeart, Lock, ArrowUpRight, Wallet, PiggyBank, Receipt, BarChart3, Banknote, CircleCheck, Circle, Flame, Play, BookOpen, MessageCircle, X, Download, Menu, CheckCircle2, ChevronRight, Zap, RefreshCw, HelpCircle, Award, Check } from 'lucide-react';

interface LandingPageProps {
  onOpenWebApp: () => void;
}

const AnimatedCounter = ({ end, duration = 2000, suffix = '', prefix = '', decimals = 0 }: { end: number, duration?: number, suffix?: string, prefix?: string, decimals?: number }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        let startTime: number;
        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setCount(easeProgress * end);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            setCount(end);
          }
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.1 });

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <span ref={ref}>{prefix}{count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{suffix}</span>;
};

// 15 Comprehensive Dynamic Quiz Question Pool Data
const QUIZ_QUESTIONS_POOL = [
  {
    id: 1,
    question: "How regularly do you track your monthly expenses & subscriptions?",
    options: [
      { text: "Every single day — I log every transaction precisely", points: 10, tag: "Disciplined" },
      { text: "Once or twice a week when I remember", points: 7, tag: "Moderate" },
      { text: "Only when I receive low balance or salary alerts", points: 4, tag: "Reactive" },
      { text: "Rarely / Never — I just guess how much is left", points: 1, tag: "High Risk" }
    ]
  },
  {
    id: 2,
    question: "When tempted by an unplanned impulse purchase (₹1,000+), what usually happens?",
    options: [
      { text: "I pause 24-48 hours before deciding to purchase", points: 10, tag: "Self-Controlled" },
      { text: "I think for a few minutes then usually buy it anyway", points: 6, tag: "Moderate Impulse" },
      { text: "I buy immediately and feel guilty or stressed later", points: 3, tag: "High Impulse" },
      { text: "I frequently rely on credit cards or BNPL pay-later options", points: 1, tag: "Debt Trigger" }
    ]
  },
  {
    id: 3,
    question: "Do you currently have a dedicated emergency savings fund?",
    options: [
      { text: "Yes, 3 to 6+ months of living expenses safely saved", points: 10, tag: "Fully Protected" },
      { text: "Yes, about 1 month of expenses saved", points: 7, tag: "Partial Buffer" },
      { text: "Very small emergency buffer (under ₹5,000)", points: 4, tag: "Vulnerable" },
      { text: "No emergency savings fund yet", points: 1, tag: "High Risk" }
    ]
  },
  {
    id: 4,
    question: "How do you manage monthly budgeting & income allocation?",
    options: [
      { text: "Zero-based budgeting — every rupee has a designated job", points: 10, tag: "Optimal" },
      { text: "Rough mental estimates for rent and major bills", points: 7, tag: "Basic Plan" },
      { text: "No budget — I spend whatever balance is in my bank", points: 3, tag: "Unstructured" },
      { text: "Living paycheck to paycheck with monthly shortfalls", points: 1, tag: "Stressed" }
    ]
  },
  {
    id: 5,
    question: "How confident do you feel about achieving long-term wealth goals?",
    options: [
      { text: "100% confident — clear automated savings & investment roadmap", points: 10, tag: "On Track" },
      { text: "Somewhat confident — saving occasionally but no clear plan", points: 7, tag: "Developing" },
      { text: "Uncertain — unexpected bills regularly ruin my monthly plan", points: 4, tag: "Anxious" },
      { text: "Constantly stressed & overwhelmed by money decisions", points: 1, tag: "Overwhelmed" }
    ]
  },
  {
    id: 6,
    question: "How do you handle credit cards and short-term debt balances?",
    options: [
      { text: "I pay full credit card balance every month without interest", points: 10, tag: "Debt Free" },
      { text: "I pay more than minimum due, slowly clearing debt", points: 7, tag: "Managing" },
      { text: "I pay only minimum balance due each month", points: 4, tag: "High Interest" },
      { text: "Struggling with overdue debt or multiple loan EMIs", points: 1, tag: "Critical" }
    ]
  },
  {
    id: 7,
    question: "How often do unexpected expenses (repairs, medical, gifts) ruin your monthly plan?",
    options: [
      { text: "Rarely — I set aside a monthly contingency fund", points: 10, tag: "Resilient" },
      { text: "Occasionally — I adjust other categories to cover it", points: 7, tag: "Flexible" },
      { text: "Frequently — it forces me to borrow or dip into savings", points: 4, tag: "Unstable" },
      { text: "Constantly — any small surprise causes financial disruption", points: 1, tag: "Vulnerable" }
    ]
  },
  {
    id: 8,
    question: "Do you audit recurring subscriptions & hidden monthly fees?",
    options: [
      { text: "Yes, I audit and cancel unused services every month", points: 10, tag: "Optimized" },
      { text: "I review them every few months", points: 7, tag: "Aware" },
      { text: "I suspect I have wasted subscriptions but haven't checked", points: 4, tag: "Leaking" },
      { text: "I have no idea how many active subscriptions charge me", points: 1, tag: "Unaware" }
    ]
  },
  {
    id: 9,
    question: "Do you track your overall net worth (Assets vs Liabilities)?",
    options: [
      { text: "Yes, I track net worth monthly across all accounts", points: 10, tag: "Wealth Builder" },
      { text: "I check my bank accounts and mutual funds occasionally", points: 7, tag: "Basic Track" },
      { text: "I only check my primary checking account balance", points: 4, tag: "Narrow View" },
      { text: "I don't know my total assets or debts", points: 1, tag: "Blindspot" }
    ]
  },
  {
    id: 10,
    question: "How openly do you communicate about money with your family or partner?",
    options: [
      { text: "Openly & regularly — we share budget goals and aligned plans", points: 10, tag: "Aligned" },
      { text: "We discuss major purchases, but keep routine spending separate", points: 7, tag: "Partial" },
      { text: "Money topics frequently cause tension or stress", points: 4, tag: "Strained" },
      { text: "We never talk about finances or hide spending from each other", points: 1, tag: "Isolated" }
    ]
  },
  {
    id: 11,
    question: "What percentage of your monthly income do you save or invest?",
    options: [
      { text: "25%+ of my income goes straight into savings & investments", points: 10, tag: "Super Saver" },
      { text: "10% to 20% saved regularly", points: 8, tag: "Solid Saver" },
      { text: "Less than 10% saved when possible", points: 4, tag: "Low Savings" },
      { text: "0% — everything gets spent before month end", points: 1, tag: "Zero Buffer" }
    ]
  },
  {
    id: 12,
    question: "How do you handle food delivery and dining out expenses?",
    options: [
      { text: "Strict monthly limit — cooked meals primary, delivery rare", points: 10, tag: "Frugal" },
      { text: "Moderate delivery — order 2-3 times a week within budget", points: 7, tag: "Balanced" },
      { text: "Frequent ordering — food delivery takes up a large chunk of salary", points: 4, tag: "High Leakage" },
      { text: "Uncontrolled food delivery — ordering almost every day", points: 1, tag: "Extreme Leakage" }
    ]
  },
  {
    id: 13,
    question: "When you receive a bonus or unexpected cash windfall, what is your first action?",
    options: [
      { text: "Allocate 80%+ to emergency fund, investments, or debt payoff", points: 10, tag: "Prudent" },
      { text: "Save half and treat myself with the rest", points: 7, tag: "Balanced" },
      { text: "Spend most of it on gadgets, travel, or shopping immediately", points: 3, tag: "Impulsive" },
      { text: "Spend it all right away to cover past pending debts", points: 1, tag: "Stressed" }
    ]
  },
  {
    id: 14,
    question: "Do you have clear financial goals set for the next 1 to 5 years?",
    options: [
      { text: "Yes, clear target milestones with monthly automated SIPs", points: 10, tag: "Goal Oriented" },
      { text: "Mental goals, but no automated savings plan", points: 7, tag: "Informal" },
      { text: "Vague ideas without any timeline or action plan", points: 4, tag: "Unfocused" },
      { text: "No goals — taking finances one week at a time", points: 1, tag: "Short Term" }
    ]
  },
  {
    id: 15,
    question: "How do you feel when checking your bank account balance at the end of the month?",
    options: [
      { text: "Peaceful & satisfied — my expected buffer is intact", points: 10, tag: "Serene" },
      { text: "Relieved — survived the month with a small surplus", points: 7, tag: "Stable" },
      { text: "Anxious — balance is lower than expected", points: 4, tag: "Anxious" },
      { text: "Panicked — overdrafted or near zero balance", points: 1, tag: "Alarmed" }
    ]
  }
];

const getRandom10Questions = () => {
  const shuffledPool = [...QUIZ_QUESTIONS_POOL].sort(() => 0.5 - Math.random());
  return shuffledPool.slice(0, 10).map(q => ({
    ...q,
    options: [...q.options].sort(() => 0.5 - Math.random())
  }));
};


export const FEATURE_PAGES_DATA: Record<string, {

  'quiz': {
    slug: 'quiz',
    category: 'feature',
    categoryLabel: 'Free Diagnostic',
    badge: 'FINANCIAL QUIZ',
    indexNumber: '00',
    title: 'Evaluate Your Financial Wellness Score',
    subtitle: 'Free 60-Second Science-Backed Assessment',
    description: "Discover your financial health score, uncover hidden subscription leaks, and receive a customized 1-on-1 step-by-step roadmap to build lasting financial peace of mind.",
    highlights: ['10 quick diagnostic questions', 'Instant score gauge & analysis', 'Impulse risk evaluation', 'Personalized savings roadmap'],
    stats: [
      { label: 'Completed Quizzes', value: '142,000+' },
      { label: 'Avg Financial Score', value: '72/100' },
      { label: 'Time Required', value: '60 sec' }
    ],
    benefits: [
      { iconName: 'HelpCircle', title: 'Uncover Spending Leaks', desc: 'Identify recurring subscription drain and impulse shopping triggers.' },
      { iconName: 'Award', title: 'Get Your Health Score', desc: 'Receive your 100-point Financial Wellness Score with category breakdowns.' },
      { iconName: 'Target', title: 'Actionable Roadmap', desc: 'Get step-by-step guidance on building emergency reserves & debt payoff.' }
    ],
    howItWorks: [
      { step: '01', title: 'Answer 10 Questions', desc: 'Select options reflecting your current budgeting, debt, and saving habits.' },
      { step: '02', title: 'Get Instant Score', desc: 'View your Financial Health Gauge and 3-pillar breakdown in real time.' },
      { step: '03', title: 'Execute Recommendations', desc: 'Launch ZenBudget Web App to start your personalized wealth roadmap.' }
    ],
    testimonial: {
      quote: "The 60-second quiz showed me I had an impulse spending risk level of 78%. Setting up the 24h timer in ZenBudget saved me ₹30,000 in two months!",
      author: 'Kriti Malhotra',
      role: 'Product Lead',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'goals'
  },
  slug: string;
  category: 'feature' | 'condition';
  categoryLabel: string;
  badge: string;
  indexNumber: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  stats: { label: string; value: string }[];
  benefits: { iconName: string; title: string; desc: string }[];
  howItWorks: { step: string; title: string; desc: string }[];
  testimonial: { quote: string; author: string; role: string; avatar: string };
  mockupType: string;
}> = {
  'ai-coach': {
    slug: 'ai-coach',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'AI ASSISTANT',
    indexNumber: '01',
    title: 'Your private space to ask money questions & reflect',
    subtitle: '24/7 Compassionate Financial AI Companion',
    description: "ZenBudget's AI Chat Companion helps you make sense of complex financial decisions, offers non-judgmental spending reflection, and provides instant personalized advice based on your budget patterns.",
    highlights: ['24/7 instant financial guidance', 'Zero judgment spending breakdown', 'Personalized tax & savings tips', '100% private & encrypted chat'],
    stats: [
      { label: 'Avg Monthly Savings', value: '₹4,850' },
      { label: 'Response Time', value: '< 1s' },
      { label: 'User Satisfaction', value: '99.4%' }
    ],
    benefits: [
      { iconName: 'MessageCircleHeart', title: 'Emotional & Practical Balance', desc: 'Discuss financial anxiety or impulsive purchases without feeling judged.' },
      { iconName: 'Zap', title: 'Instant Spending Audits', desc: 'Ask "Can I afford this ₹4,000 purchase?" and get a real-time risk score.' },
      { iconName: 'Shield', title: 'Private & Local Data', desc: 'Your financial conversations are processed privately with zero data selling.' }
    ],
    howItWorks: [
      { step: '01', title: 'Connect Your Goals', desc: 'Tell the AI your monthly target or ask a direct spending question.' },
      { step: '02', title: 'Get Smart Recommendations', desc: 'Receive instant category adjustments and actionable money hacks.' },
      { step: '03', title: 'Watch Your Wealth Grow', desc: 'Follow weekly micro-habits to build long-term financial resilience.' }
    ],
    testimonial: {
      quote: "Talking to the AI Coach stopped me from making ₹15,000 worth of panic impulse buys last month. It feels like having a financial advisor in my pocket.",
      author: 'Aarav Sharma',
      role: 'Software Engineer',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'chat'
  },
  'budget-planner': {
    slug: 'budget-planner',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'ZERO-BASED BUDGETING',
    indexNumber: '02',
    title: 'Give every single rupee a purpose before the month begins',
    subtitle: 'Envelope Budgeting System',
    description: "Eliminate monthly cash shortfalls. Allocate your entire paycheck into structured envelopes for rent, groceries, investments, and guilt-free fun spending.",
    highlights: ['Automated 50/30/20 rule allocation', 'Real-time category balance meters', 'Custom envelope rollover rules', 'Monthly budget health score'],
    stats: [
      { label: 'Overspending Reduction', value: '-38%' },
      { label: 'Setup Time', value: '2 mins' },
      { label: 'Active Budgeters', value: '45,000+' }
    ],
    benefits: [
      { iconName: 'Activity', title: 'Zero Cash Leaks', desc: 'No more wondering where your salary went at the end of the month.' },
      { iconName: 'Target', title: 'Guilt-Free Spending', desc: 'Spend freely on entertainment knowing your bills and savings are locked in.' },
      { iconName: 'RefreshCw', title: 'Smart Rollover', desc: 'Unspent money in envelopes automatically rolls over into savings goals.' }
    ],
    howItWorks: [
      { step: '01', title: 'Enter Monthly Income', desc: 'Input your salary or total expected cash flow for the upcoming month.' },
      { step: '02', title: 'Assign Envelopes', desc: 'Distribute funds across fixed expenses, investments, and discretionary buckets.' },
      { step: '03', title: 'Track Live Balance', desc: 'Log expenses on the go and see your remaining daily allowance instantly.' }
    ],
    testimonial: {
      quote: "Zero-based budgeting completely changed my financial life. I went from paycheck-to-paycheck stress to saving 30% of my income.",
      author: 'Priya Patel',
      role: 'Product Designer',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'budget'
  },
  'analytics': {
    slug: 'analytics',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'EXPENSE ANALYTICS',
    indexNumber: '03',
    title: 'Visual insights into where every rupee flows',
    subtitle: 'Deep Financial Intelligence',
    description: "Beautiful interactive charts, cash flow breakdowns, and automated vendor analysis that reveal your hidden money leaks effortlessly.",
    highlights: ['Interactive donut & trend charts', 'Recurring subscription tracking', 'Category breakdown comparison', 'Exportable PDF & CSV reports'],
    stats: [
      { label: 'Subscriptions Found', value: '3.2 avg' },
      { label: 'Chart Clarity', value: '100%' },
      { label: 'Insights Generated', value: '1.2M+' }
    ],
    benefits: [
      { iconName: 'ChartLine', title: 'Spot Hidden Leaks', desc: 'Identify forgotten subscriptions and daily small expenses that add up fast.' },
      { iconName: 'TrendingUp', title: 'Monthly Trends', desc: 'Compare spending month-over-month to ensure continuous progress.' },
      { iconName: 'BarChart3', title: 'Vendor Analytics', desc: 'See how much you spend per merchant like Swiggy, Amazon, or Zomato.' }
    ],
    howItWorks: [
      { step: '01', title: 'Automatic Categorization', desc: 'Transactions are grouped into Dining, Utilities, Shopping, and Income.' },
      { step: '02', title: 'Inspect Visual Trends', desc: 'Tap any chart slice to drill down into exact purchase history.' },
      { step: '03', title: 'Optimize Your Spending', desc: 'Apply recommended spending caps to high-leak categories.' }
    ],
    testimonial: {
      quote: "The analytics chart showed me I was spending ₹8,500/month on food delivery! Cutting that in half paid for my vacation.",
      author: 'Vikram Mehta',
      role: 'Marketing Lead',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'analytics'
  },
  'money-forest': {
    slug: 'money-forest',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'GAMIFIED SAVINGS',
    indexNumber: '04',
    title: 'Grow a lush digital forest as you hit your budget goals',
    subtitle: 'Behavioral Habit Builder',
    description: "Turn financial discipline into an addictive, rewarding game. Every day you stay under budget or save money, your digital trees flourish.",
    highlights: ['Daily budget streak trees', 'Unlock rare species as savings grow', 'Friend & community leaderboards', 'Visual impulse reduction'],
    stats: [
      { label: 'Forests Grown', value: '120,000+' },
      { label: 'Streak Completion', value: '89%' },
      { label: 'Trees Planted', value: '450K+' }
    ],
    benefits: [
      { iconName: 'Flame', title: 'Dopamine For Saving', desc: 'Get rewarded with visual tree growth instead of spending money for quick hits.' },
      { iconName: 'Award', title: 'Streak Badges', desc: 'Maintain 7-day, 30-day, and 100-day budget discipline streaks.' },
      { iconName: 'Users', title: 'Community Forests', desc: 'Grow shared forests with friends and hold each other accountable.' }
    ],
    howItWorks: [
      { step: '01', title: 'Plant a Seed', desc: 'Set a daily or weekly spending limit target.' },
      { step: '02', title: 'Maintain Your Streak', desc: 'Log transactions accurately. Staying under budget waters your tree.' },
      { step: '03', title: 'Build Your Oasis', desc: 'Turn your savings habit into a thriving, beautiful virtual ecosystem.' }
    ],
    testimonial: {
      quote: "I haven't broken my 45-day spending streak because I refuse to let my golden Oak tree wither! Gamification really works.",
      author: 'Sneha Roy',
      role: 'Content Creator',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'goals'
  },
  'receipt-scanner': {
    slug: 'receipt-scanner',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'AI RECEIPT SCANNER',
    indexNumber: '05',
    title: 'Snap physical paper bills & extract line items instantly',
    subtitle: 'Zero Manual Typing',
    description: "Scan restaurant bills, grocery receipts, or fuel invoices using your phone camera. Our AI parses amount, date, vendor, and line items in under 2 seconds.",
    highlights: ['Camera OCR & AI parsing', 'Automated category matching', 'Tax invoice storage', 'Multi-currency receipt support'],
    stats: [
      { label: 'Scan Speed', value: '1.4s' },
      { label: 'Accuracy', value: '99.8%' },
      { label: 'Bills Scanned', value: '850,000+' }
    ],
    benefits: [
      { iconName: 'Receipt', title: 'Instant Logging', desc: 'No manual data entry required — just point your camera and confirm.' },
      { iconName: 'Shield', title: 'Digital Invoice Backup', desc: 'Never lose a tax-deductible receipt or warranty document again.' },
      { iconName: 'Zap', title: 'Splitting Bills Made Easy', desc: 'Extract individual item totals to split expenses with friends accurately.' }
    ],
    howItWorks: [
      { step: '01', title: 'Snap or Upload', desc: 'Take a quick photo of any paper receipt or upload an image.' },
      { step: '02', title: 'AI Extraction', desc: 'Our vision AI reads merchant name, total price, tax, and date.' },
      { step: '03', title: 'Instant Save', desc: 'Transaction is auto-logged into your expense log with receipt attached.' }
    ],
    testimonial: {
      quote: "Scanning grocery bills after shopping takes 2 seconds now. It extracted all 14 items perfectly on the first try!",
      author: 'Rohan Verma',
      role: 'Accountant',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'analytics'
  },
  'private-vault': {
    slug: 'private-vault',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'ENCRYPTED VAULT',
    indexNumber: '06',
    title: 'Your financial data belongs exclusively to you',
    subtitle: '100% Zero-Knowledge Client Storage',
    description: "We believe privacy is a fundamental right. ZenBudget stores your transactions offline or in zero-knowledge encrypted vaults so no third parties can track your money.",
    highlights: ['Client-side AES-256 encryption', 'Zero ad tracking or data brokers', 'Biometric / PIN lock screen', 'Local storage backup & export'],
    stats: [
      { label: 'Encryption Level', value: 'AES-256' },
      { label: 'Data Shared', value: '0%' },
      { label: 'Offline First', value: '100%' }
    ],
    benefits: [
      { iconName: 'Lock', title: 'Zero Data Harvesting', desc: 'Your personal spending habits are never monetized, sold, or shared.' },
      { iconName: 'Shield', title: 'Biometric Security', desc: 'Protect your financial app with FaceID, TouchID, or custom PIN codes.' },
      { iconName: 'RefreshCw', title: 'Offline Access', desc: 'Access your full financial dashboard anytime, even without an internet connection.' }
    ],
    howItWorks: [
      { step: '01', title: 'Set Private Key', desc: 'Create a local passcode or enable device biometrics upon setup.' },
      { step: '02', title: 'Local Encryption', desc: 'All financial entries are encrypted directly on your local device.' },
      { step: '03', title: 'Complete Peace of Mind', desc: 'Rest easy knowing your financial history remains 100% confidential.' }
    ],
    testimonial: {
      quote: "Finally a budget app that doesn't sell my financial data to advertisers! The offline encrypted storage gives me total privacy.",
      author: 'Ananya Deshmukh',
      role: 'Cybersecurity Analyst',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'analytics'
  },
  'savings-goals': {
    slug: 'savings-goals',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'SAVINGS GOALS',
    indexNumber: '07',
    title: 'Turn your biggest financial dreams into achievable steps',
    subtitle: 'Target Progress & Milestone Tracking',
    description: "Whether saving for a new laptop, emergency cushion, or dream vacation, set automated target dates and watch your progress bar fill up.",
    highlights: ['Automated monthly target math', 'Visual milestone celebrations', 'Multiple goal buckets', 'Deposit interest forecasting'],
    stats: [
      { label: 'Goals Completed', value: '68,000+' },
      { label: 'Avg Time to Goal', value: '4.2 mos' },
      { label: 'Total Saved', value: '₹14.2 Cr' }
    ],
    benefits: [
      { iconName: 'Target', title: 'Clear Timelines', desc: 'Know exact monthly deposits required to hit your target by your deadline.' },
      { iconName: 'PiggyBank', title: 'Micro-Savings', desc: 'Auto-allocate spare change or daily savings toward your active goal.' },
      { iconName: 'Award', title: 'Celebration Moments', desc: 'Enjoy confetti animations & milestone rewards when completing goals.' }
    ],
    howItWorks: [
      { step: '01', title: 'Define Your Goal', desc: 'Enter goal name (e.g., "Emergency Fund"), target amount, and target date.' },
      { step: '02', title: 'Set Deposit Plan', desc: 'ZenBudget calculates your required weekly or monthly saving contribution.' },
      { step: '03', title: 'Reach Milestone', desc: 'Log deposits and track your visual percentage completion in real-time.' }
    ],
    testimonial: {
      quote: "I saved ₹1,20,000 for my trip to Japan in just 8 months! The visual goal progress bar kept me motivated every single week.",
      author: 'Karan Joshi',
      role: 'Architect',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'goals'
  },
  'community': {
    slug: 'community',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'TOGETHER COMMUNITY',
    indexNumber: '08',
    title: 'Achieve financial freedom together with a supportive community',
    subtitle: 'Anonymous Peer Challenges & Money Hacks',
    description: "Join over 50,000+ members sharing real money-saving tips, debt elimination victory stories, and monthly low-spend challenges.",
    highlights: ['Anonymous money Q&A', 'Monthly No-Spend challenges', 'Debt payoff victory feeds', 'Expert-curated habit workshops'],
    stats: [
      { label: 'Active Members', value: '52,400+' },
      { label: 'Daily Money Hacks', value: '450+' },
      { label: 'Community Rating', value: '4.9 ★' }
    ],
    benefits: [
      { iconName: 'Users', title: 'Zero Stigma', desc: 'Ask sensitive money questions anonymously and get supportive advice.' },
      { iconName: 'Flame', title: 'Peer Challenges', desc: 'Participate in 30-day challenges like "No Swiggy November" with thousands.' },
      { iconName: 'Heart', title: 'Real Stories', desc: 'Read inspiring debt-free journeys from people who started where you are now.' }
    ],
    howItWorks: [
      { step: '01', title: 'Join a Group', desc: 'Select channels matching your goals: Debt Payoff, F.I.R.E, or Budgeting 101.' },
      { step: '02', title: 'Share & Learn', desc: 'Post your daily victories or ask for advice on reducing household expenses.' },
      { step: '03', title: 'Stay Motivated', desc: 'Get cheers, high-fives, and badges from fellow community members.' }
    ],
    testimonial: {
      quote: "Being part of the 'No-Spend Challenge' group gave me the exact motivation I needed. I saved ₹18,000 in one month!",
      author: 'Meera Nambiar',
      role: 'UX Writer',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'community'
  },
  'paycheck-to-paycheck': {
    slug: 'paycheck-to-paycheck',
    category: 'condition',
    categoryLabel: 'Solution for You',
    badge: 'LIVING PAYCHECK TO PAYCHECK',
    indexNumber: '09',
    title: 'Stop running out of money 10 days before your next salary',
    subtitle: 'Cash Flow Cushion & Buffer System',
    description: "If your bank balance drops near zero before month-end, ZenBudget helps you restructure bill dates, smooth out fixed expenses, and create a 15-day salary cushion.",
    highlights: ['Salary distribution map', 'Bill timing optimization', 'Early warning balance alerts', 'First ₹10,000 buffer plan'],
    stats: [
      { label: 'Buffer Created', value: '18 days' },
      { label: 'Stress Reduction', value: '94%' },
      { label: 'Users Helped', value: '28,000+' }
    ],
    benefits: [
      { iconName: 'Activity', title: 'Smooth Out Bills', desc: 'Align your due dates so rent, utilities, and EMIs don’t drain your balance all at once.' },
      { iconName: 'Shield', title: 'Prevent Overdrafts', desc: 'Get real-time safe-to-spend limits for each remaining day of the month.' },
      { iconName: 'Target', title: 'Build Your Cushion', desc: 'Gradually build a 1-month salary buffer so you are always paying this month’s bills with last month’s income.' }
    ],
    howItWorks: [
      { step: '01', title: 'Map Salary Cycle', desc: 'Enter salary date and mandatory bill due dates.' },
      { step: '02', title: 'Set Daily Allowance', desc: 'ZenBudget divides remaining funds into manageable daily spending limits.' },
      { step: '03', title: 'Break the Cycle', desc: 'Accumulate your first 15-day financial buffer in 90 days.' }
    ],
    testimonial: {
      quote: "I used to panic around the 20th of every month. ZenBudget showed me how to space out my expenses, and now I always have cash left over!",
      author: 'Rajesh Kumar',
      role: 'Sales Manager',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'budget'
  },
  'impulse-spending': {
    slug: 'impulse-spending',
    category: 'condition',
    categoryLabel: 'Solution for You',
    badge: 'IMPULSE BUYING & EMOTIONAL SPENDING',
    indexNumber: '10',
    title: 'Break the cycle of retail therapy & impulse purchases',
    subtitle: '24-Hour Cooling Off Timer & Mindful Blocker',
    description: "Feel tempted by online sales or late-night shopping? ZenBudget provides a 24-hour impulse wish-list timer and emotional spending reflections to protect your hard-earned cash.",
    highlights: ['Wishlist 24-hour pause timer', 'Emotional trigger journal', 'Opportunity cost calculator', 'Regret-free spending score'],
    stats: [
      { label: 'Impulse Money Saved', value: '₹6,400/mo' },
      { label: 'Purchases Paused', value: '76%' },
      { label: 'Mindful Users', value: '34,000+' }
    ],
    benefits: [
      { iconName: 'Clock', title: '24-Hour Rule', desc: 'Add items to your wish-list. 76% of items lose their appeal after 24 hours.' },
      { iconName: 'Brain', title: 'Opportunity Cost View', desc: 'See that a ₹5,000 shoe purchase equals 12 days of retirement funding.' },
      { iconName: 'Heart', title: 'Identify Triggers', desc: 'Track whether stress, boredom, or social media caused the urge.' }
    ],
    howItWorks: [
      { step: '01', title: 'Pause Before Buying', desc: 'When you feel an urge to buy, enter it into the Impulse Blocker.' },
      { step: '02', title: 'Let It Cool', desc: 'Wait 24 hours while the app shows your long-term goal alternative.' },
      { step: '03', title: 'Decide Mindfully', desc: 'Either buy with full peace of mind or watch your savings increase!' }
    ],
    testimonial: {
      quote: "The 24-hour cooling timer saved me over ₹40,000 in gadget impulse purchases this year alone. It's a game-changer.",
      author: 'Tanya Sengupta',
      role: 'Digital Marketer',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'goals'
  },
  'credit-debt': {
    slug: 'credit-debt',
    category: 'condition',
    categoryLabel: 'Solution for You',
    badge: 'CREDIT CARD DEBT & EMIs',
    indexNumber: '11',
    title: 'Eliminate high-interest loans & credit card balances fast',
    subtitle: 'Snowball & Avalanche Payoff Strategist',
    description: "Stop bleeding interest money to banks. Compare Debt Snowball vs Debt Avalanche methods to pay off credit cards and personal loans months ahead of schedule.",
    highlights: ['Snowball & Avalanche calculator', 'Interest saved tracker', 'Automated EMI payoff schedule', 'Debt-free countdown timer'],
    stats: [
      { label: 'Months Saved', value: '14 months' },
      { label: 'Avg Interest Saved', value: '₹32,000' },
      { label: 'Debt Cleared', value: '₹8.4 Cr+' }
    ],
    benefits: [
      { iconName: 'Shield', title: 'Save Thousands on Interest', desc: 'Target highest interest cards first to minimize interest payouts.' },
      { iconName: 'Flame', title: 'Quick Psychological Wins', desc: 'Use Debt Snowball to knock out small balances first for fast momentum.' },
      { iconName: 'Target', title: 'Exact Payoff Date', desc: 'Know the exact month and year you will become 100% debt-free.' }
    ],
    howItWorks: [
      { step: '01', title: 'Add Debt Balances', desc: 'Enter card balances, APR interest rates, and minimum monthly payments.' },
      { step: '02', title: 'Select Strategy', desc: 'Choose Snowball (smallest balance first) or Avalanche (highest APR first).' },
      { step: '03', title: 'Execute & Celebrate', desc: 'Follow your custom monthly extra-payment plan until debt is zero.' }
    ],
    testimonial: {
      quote: "I paid off 3 credit cards in 11 months using the Avalanche strategy in ZenBudget. Saving ₹28,000 in interest feels incredible!",
      author: 'Amitabh Joshi',
      role: 'Operations Lead',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'analytics'
  },
  'no-emergency-fund': {
    slug: 'no-emergency-fund',
    category: 'condition',
    categoryLabel: 'Solution for You',
    badge: 'NO EMERGENCY SAVINGS',
    indexNumber: '12',
    title: 'Build your first 3 to 6-month financial safety cushion',
    subtitle: 'Emergency Reserve Builder',
    description: "Unexpected medical bills, car repairs, or job transitions shouldn't cause financial ruin. Build your fortress of financial security step-by-step.",
    highlights: ['Essential living cost calculator', 'Automated micro-savings', 'High-yield liquid fund tips', 'Peace of mind rating'],
    stats: [
      { label: 'Safety Net Built', value: '3.5 mos' },
      { label: 'Anxiety Drop', value: '-88%' },
      { label: 'Funds Protected', value: '₹18 Cr+' }
    ],
    benefits: [
      { iconName: 'Shield', title: 'Total Financial Protection', desc: 'Never rely on high-interest loans or emergency borrowing again.' },
      { iconName: 'PiggyBank', title: 'Micro-Deposits', desc: 'Build your reserve automatically with manageable daily ₹100-₹500 deposits.' },
      { iconName: 'Sun', title: 'Sleep Better at Night', desc: 'Know that whatever surprise happens, your family is 100% covered.' }
    ],
    howItWorks: [
      { step: '01', title: 'Calculate Baseline Need', desc: 'Determine your exact monthly essential expenses (rent, food, bills).' },
      { step: '02', title: 'Set Starter Target', desc: 'Aim for ₹25,000 starter buffer first, then scale to 3 full months.' },
      { step: '03', title: 'Automate Deposits', desc: 'Lock away emergency funds into a separate liquid high-yield bucket.' }
    ],
    testimonial: {
      quote: "When my car engine failed last month, having a ₹75,000 emergency fund saved me from taking a high-interest loan. Total relief!",
      author: 'Kavita Nair',
      role: 'HR Manager',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'goals'
  },
  'freelancer-money': {
    slug: 'freelancer-money',
    category: 'condition',
    categoryLabel: 'Solution for You',
    badge: 'IRREGULAR / FREELANCE INCOME',
    indexNumber: '13',
    title: 'Smooth out volatile income dips & unpredictable client payments',
    subtitle: 'Variable Income Management System',
    description: "Designed specifically for freelancers, creators, and business owners. Manage high-earning months and lean months effortlessly.",
    highlights: ['Hill-and-Valley income smoother', 'Tax reserve automation', 'Lean month baseline budget', 'Invoice payment tracker'],
    stats: [
      { label: 'Income Stability', value: '100%' },
      { label: 'Tax Surprise Saved', value: '₹0' },
      { label: 'Freelancers Empowered', value: '19,000+' }
    ],
    benefits: [
      { iconName: 'RefreshCw', title: 'Income Smoothing', desc: 'Pay yourself a steady monthly salary from a holding bucket during lean seasons.' },
      { iconName: 'Receipt', title: 'Automated Tax Reserve', desc: 'Automatically hold 20-30% of incoming client payments for quarterly taxes.' },
      { iconName: 'Activity', title: 'Lean Month Mode', desc: 'Switch to a bare-bones baseline budget during slow business periods.' }
    ],
    howItWorks: [
      { step: '01', title: 'Define Salary Target', desc: 'Set a realistic monthly personal payout needed for living costs.' },
      { step: '02', title: 'High Month Surplus', desc: 'During big client payout months, channel excess funds into your Income Buffer.' },
      { step: '03', title: 'Lean Month Drawdown', desc: 'Draw your regular salary from the buffer when invoice payments are delayed.' }
    ],
    testimonial: {
      quote: "As a freelance designer, my income jumps between ₹40,000 and ₹1.5L. ZenBudget's smoothing system gave me steady monthly peace of mind.",
      author: 'Siddharth Sen',
      role: 'Freelance UI Designer',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'budget'
  },
  'hidden-subscriptions': {
    slug: 'hidden-subscriptions',
    category: 'condition',
    categoryLabel: 'Solution for You',
    badge: 'HIDDEN SUBSCRIPTIONS & LEAKS',
    indexNumber: '14',
    title: 'Uncover & cancel streaming, SaaS, and forgotten monthly charges',
    subtitle: 'Subscription Audit & Leak Blocker',
    description: "Streaming apps, gym memberships, cloud storage, and trial recurring charges eat away hundreds of rupees without your knowledge. Detect and prune them instantly.",
    highlights: ['Automated subscription radar', 'Renewal date calendar alerts', 'Annual cost multiplier', '1-click cancellation guide'],
    stats: [
      { label: 'Avg Leaks Found', value: '₹2,800/yr' },
      { label: 'Unused Apps Cancelled', value: '3.4 per user' },
      { label: 'Total Money Reclaimed', value: '₹4.1 Cr' }
    ],
    benefits: [
      { iconName: 'Search', title: 'Automatic Radar', desc: 'Scans recurring merchant transactions and flags hidden monthly fees.' },
      { iconName: 'Clock', title: 'Renewal Reminders', desc: 'Get alerted 3 days before any free trial or yearly subscription renews.' },
      { iconName: 'Zap', title: 'Annual Multiplier', desc: 'See that a "tiny" ₹499/month app costs you ₹6,000 every single year.' }
    ],
    howItWorks: [
      { step: '01', title: 'Run Audit', desc: 'ZenBudget identifies all recurring payment patterns in your log.' },
      { step: '02', title: 'Review Active List', desc: 'Check your active subscriptions alongside their annual financial impact.' },
      { step: '03', title: 'Prune Unused Services', desc: 'Cancel non-essential subscriptions and redirect that cash straight into savings.' }
    ],
    testimonial: {
      quote: "I found 4 subscriptions I completely forgot about! Cancelling them instantly freed up ₹2,400 every month.",
      author: 'Neha Roy',
      role: 'Product Manager',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'analytics'
  },
  'couple-finances': {
    slug: 'couple-finances',
    category: 'condition',
    categoryLabel: 'Solution for You',
    badge: 'COUPLE & SHARED FINANCES',
    indexNumber: '15',
    title: 'Synchronize household expenses without awkward money fights',
    subtitle: 'Transparent Dual-Budget System',
    description: "Manage joint household rent, groceries, and kids' expenses while keeping individual personal spending accounts private and independent.",
    highlights: ['Joint household ledger', 'Fair proportional bill splitting', 'Shared goal progress', 'Privacy-first personal envelopes'],
    stats: [
      { label: 'Couples Using App', value: '16,500+' },
      { label: 'Conflict Reduction', value: '92%' },
      { label: 'Joint Goals Met', value: '32,000+' }
    ],
    benefits: [
      { iconName: 'Users', title: 'Proportional Splitting', desc: 'Split bills fairly based on income ratio or 50/50 equality.' },
      { iconName: 'Heart', title: 'Zero Arguments', desc: 'Complete transparency on shared bills means no more financial friction.' },
      { iconName: 'Lock', title: 'Personal Autonomy', desc: 'Enjoy private personal fun buckets with zero oversight or guilt.' }
    ],
    howItWorks: [
      { step: '01', title: 'Create Shared Ledger', desc: 'Invite your partner to a shared ZenBudget household space.' },
      { step: '02', title: 'Add Joint Expenses', desc: 'Log groceries, rent, and household bills into the shared bucket.' },
      { step: '03', title: 'Track Joint Goals', desc: 'Save together for a home down payment or annual family vacation.' }
    ],
    testimonial: {
      quote: "Money talks used to be stressful for us. Now we log joint expenses in seconds and keep our personal spending separate. Perfect harmony!",
      author: 'Divya & Vikram',
      role: 'Architect & Consultant',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'community'
  },
  'students-pros': {
    slug: 'students-pros',
    category: 'condition',
    categoryLabel: 'Solution for You',
    badge: 'STUDENTS & YOUNG PROFESSIONALS',
    indexNumber: '16',
    title: 'Build solid financial discipline from your very first paycheck',
    subtitle: 'Early Wealth Building & Student Automation',
    description: "Start early and let compound interest work its magic. Master budgeting basics, manage pocket money, and start investing before age 25.",
    highlights: ['Pocket money & stipend tracker', 'Student loan repayment plan', 'Compound wealth simulator', 'Gen-Z money habits guide'],
    stats: [
      { label: 'Early Investors', value: '22,000+' },
      { label: 'Avg Monthly Savings', value: '₹3,500' },
      { label: 'Wealth Multiplier', value: '10x' }
    ],
    benefits: [
      { iconName: 'Sparkles', title: 'Master Money Early', desc: 'Avoid common debt traps and impulse pitfalls before they start.' },
      { iconName: 'TrendingUp', title: 'Compound Simulator', desc: 'See how investing ₹2,000/month in your 20s turns into ₹1 Crore+.' },
      { iconName: 'Target', title: 'First Salary Guide', desc: 'Structure your first salary wisely with automated investment rules.' }
    ],
    howItWorks: [
      { step: '01', title: 'Input Stipend / Salary', desc: 'Enter your monthly stipend or initial entry-level salary.' },
      { step: '02', title: 'Automate Savings First', desc: 'Auto-divert 20% into SIP or high-yield savings before spending.' },
      { step: '03', title: 'Track Freedom Score', desc: 'Watch your financial independence score climb every single month.' }
    ],
    testimonial: {
      quote: "Starting with ZenBudget at 21 helped me save ₹1.5 Lakhs during my internship year! I feel so ahead of my peers.",
      author: 'Ishaan Verma',
      role: 'Junior Developer',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'goals'
  },
  'quick-capture': {
    slug: 'quick-capture',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'QUICK CAPTURE & WALLETS',
    indexNumber: '17',
    title: 'Natural language expense entry & multi-account wallet management',
    subtitle: 'AI Natural Language & Voice Input',
    description: "Say or type 'Paid 220 for petrol in cash' or 'Salary 45000 in SBI Bank'. ZenBudget auto-extracts amount, vendor, category, and wallet account in under 1 second.",
    highlights: ['Natural language AI parsing', 'Voice microphone 🎤 input support', 'Expense, Income & Transfer tabs', 'Multi-account bank & wallet manager'],
    stats: [
      { label: 'Logging Time Saved', value: '85%' },
      { label: 'AI Accuracy', value: '99.6%' },
      { label: 'Entries Logged', value: '1.4M+' }
    ],
    benefits: [
      { iconName: 'Zap', title: 'Zero Form Typing', desc: 'Type naturally or speak to log transactions on the fly.' },
      { iconName: 'Wallet', title: 'Multi-Account Sync', desc: 'Manage Cash, Bank accounts, Cards, and UPI wallets in one place.' },
      { iconName: 'RefreshCw', title: 'Smart Transfers', desc: 'Move money between wallets with automated balance updates.' }
    ],
    howItWorks: [
      { step: '01', title: 'Type or Speak', desc: 'Enter any expense naturally e.g. "Swiggy 350"' },
      { step: '02', title: 'AI Categorization', desc: 'ZenBudget auto-detects amount, category, and account.' },
      { step: '03', title: 'Instant Save', desc: 'Transaction updates your live wallet balances immediately.' }
    ],
    testimonial: {
      quote: "Voice input made logging expenses so effortless. I just say 'Paid 500 for groceries in cash' while walking out of the supermarket!",
      author: 'Sameer Sen',
      role: 'Product Designer',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'quick-capture'
  },
  'stories': {
    slug: 'stories',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'WEEKLY & MONTHLY STORIES',
    indexNumber: '18',
    title: 'Spotify-Style shareable money stories & weekly wrapped',
    subtitle: 'Dynamic Visual Financial Stories',
    description: "Celebrate your weekly and monthly financial wins with vibrant Spotify-style stories, personalized Money Scores (1-100), and 1-tap social media cards.",
    highlights: ['🎁 Weekly Money Wrapped summary', '🎵 Monthly Story (Spotify style)', 'Real-time Zen Money Score (1-100)', '1-Tap shareable social cards'],
    stats: [
      { label: 'Stories Shared', value: '140,000+' },
      { label: 'Money Score Accuracy', value: '98.5%' },
      { label: 'User Engagement', value: '94%' }
    ],
    benefits: [
      { iconName: 'Sparkles', title: 'Fun Financial Reflection', desc: 'Transform boring numbers into beautiful animated story cards.' },
      { iconName: 'Award', title: 'Money Score', desc: 'Track your weekly discipline score out of 100.' },
      { iconName: 'Users', title: 'Social Sharing', desc: 'Share your savings milestones with friends and family.' }
    ],
    howItWorks: [
      { step: '01', title: 'Track Weekly Habits', desc: 'Log daily transactions throughout the week.' },
      { step: '02', title: 'Generate Story', desc: 'ZenBudget compiles your spending story every Sunday.' },
      { step: '03', title: 'Celebrate & Share', desc: 'Review your personalized money score and share victory cards.' }
    ],
    testimonial: {
      quote: "The Spotify-style Monthly Story is hilarious and super motivating. Seeing my 94/100 money score felt so rewarding!",
      author: 'Neelam Gupta',
      role: 'Content Creator',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'stories'
  },
  'companion': {
    slug: 'companion',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'ZEN COMPANION',
    indexNumber: '19',
    title: 'Gamified pet companion that levels up with your savings',
    subtitle: 'Behavioral Savings Companion',
    description: "Meet Zen Piggy and Golden Dragon Draco! Your virtual pet companion reflects your financial mood in real-time. Stay under budget to increase companion happiness and unlock shop accessories.",
    highlights: ['Dynamic mood badges (Regretful 😡, Thrilled 👑)', 'Companion Item Shop & accessory equips', 'COMPANION HAPPINESS progress bar', 'Level progression (Lvl 1 Piggy ➔ Lvl 2 Dragon)'],
    stats: [
      { label: 'Companions Adopted', value: '48,000+' },
      { label: 'Happiness Rate', value: '88%' },
      { label: 'Shop Items Equipped', value: '210,000+' }
    ],
    benefits: [
      { iconName: 'Heart', title: 'Emotional Bond', desc: 'Your pet gets sad when you overspend and thrilled when you save!' },
      { iconName: 'Award', title: 'Item Shop', desc: 'Equip sunglasses, crowns, and golden capes using earned savings points.' },
      { iconName: 'Flame', title: 'Level Evolution', desc: 'Evolve from Level 1 Zen Piggy into a Level 2 Golden Dragon.' }
    ],
    howItWorks: [
      { step: '01', title: 'Adopt Companion', desc: 'Choose Zen Piggy as your starter financial pet.' },
      { step: '02', title: 'Log Daily Discipline', desc: 'Staying under budget fills your pet’s Happiness meter.' },
      { step: '03', title: 'Equip & Evolve', desc: 'Earn points to buy shop items and level up your companion.' }
    ],
    testimonial: {
      quote: "I literally stopped myself from buying a ₹4,000 jacket because I didn't want Zen Piggy to feel regretful! It actually works.",
      author: 'Pooja Hegde',
      role: 'Marketing Lead',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'companion'
  },
  'badges': {
    slug: 'badges',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'ACHIEVEMENT BADGES',
    indexNumber: '20',
    title: 'Complete spending challenges & unlock 1 Month FREE Premium',
    subtitle: 'Streak Rewards & Invite Unlocks',
    description: "Earn real financial rewards! Invite 10 subscribed friends to claim 1 Month Free Premium, or hit a 90-day daily budget streak to unlock Pro features forever.",
    highlights: ['🎁 10 Invites: Earn 1 Month Free Premium', '👑 90d Pro Saver: Unlock 1 Month Free Premium', 'Interactive achievement detail popups', 'Real-time daily streak counters'],
    stats: [
      { label: 'Free Months Unlocked', value: '12,400+' },
      { label: '90-Day Streaks Hit', value: '6,200+' },
      { label: 'Rewards Claimed', value: '₹24.8 Lakhs' }
    ],
    benefits: [
      { iconName: 'Award', title: 'Real Monetary Value', desc: 'Earn actual free premium subscription access by staying disciplined.' },
      { iconName: 'Users', title: 'Invite Rewards', desc: 'Invite friends to unlock Pro Saver perks automatically.' },
      { iconName: 'Flame', title: 'Streak Discipline', desc: 'Maintain daily logging streaks to level up your user rank.' }
    ],
    howItWorks: [
      { step: '01', title: 'Check Badges', desc: 'Open Achievement Badges in your dashboard.' },
      { step: '02', title: 'Complete Goal', desc: 'Maintain a 90-day streak or invite 10 friends.' },
      { step: '03', title: 'Claim Premium', desc: 'Unlock 1 Month FREE Pro Subscription instantly!' }
    ],
    testimonial: {
      quote: "I unlocked 1 Month Free Premium after hitting my 90-day streak! Getting rewarded for saving money is incredible.",
      author: 'Varun Malhotra',
      role: 'Software Architect',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'badges'
  },
  'monthly-letter': {
    slug: 'monthly-letter',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'MONTHLY LETTER FROM ZEN',
    indexNumber: '21',
    title: 'Personalized 30-day compiled money story report & letter',
    subtitle: '30-Day Milestone Financial Report',
    description: "Log daily transactions for 30 days to unlock your private Monthly Letter from Zen — a beautifully written, personalized financial reflection detailing your progress, savings rate, and top category wins.",
    highlights: ['30-day compiled personal money story', 'Monthly Report lock countdown timer', 'Personalized savings & expenditure highlights', 'Downloadable PDF monthly summary'],
    stats: [
      { label: 'Letters Unlocked', value: '35,000+' },
      { label: '30-Day Retention', value: '91%' },
      { label: 'Avg Rating', value: '4.95 ★' }
    ],
    benefits: [
      { iconName: 'BookOpen', title: 'Personal Reflection', desc: 'Read a warm, insightful summary letter compiled by AI from your 30-day history.' },
      { iconName: 'Lock', title: '30-Day Lock Timer', desc: 'Encourages consistent daily logging to unlock your end-of-month report.' },
      { iconName: 'FileText', title: 'Downloadable PDF', desc: 'Export your monthly story for personal financial archives.' }
    ],
    howItWorks: [
      { step: '01', title: 'Log Daily Entries', desc: 'Track your expenses and income for 30 consecutive days.' },
      { step: '02', title: 'Unlock Letter', desc: 'Watch your countdown timer hit zero on day 30.' },
      { step: '03', title: 'Read & Reflect', desc: 'Enjoy your personalized financial story and action milestones.' }
    ],
    testimonial: {
      quote: "Reading my Monthly Letter from Zen felt like reading a personal journal written by a supportive financial mentor. Highly recommend!",
      author: 'Sunita Rao',
      role: 'Writer',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'monthly-letter'
  },
  'category-limits': {
    slug: 'category-limits',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'CATEGORY SPENDING LIMITS',
    indexNumber: '22',
    title: 'Set explicit monthly spending limits on food, shopping & bills',
    subtitle: 'Category Spending Cap & Velocity Controls',
    description: "Stop cash leaks before they start. Set monthly spending limits per category (Food & Dining, Shopping, Entertainment, Bills & Utilities, Transport) with real-time warning indicators.",
    highlights: ['Custom per-category monthly budget caps', 'Live spent vs limit progress meters', 'High velocity spending warning alerts', '1-Tap "+ Set Limit" adjustment modal'],
    stats: [
      { label: 'Leaks Stopped', value: '₹4,500/mo' },
      { label: 'Categories Tracked', value: '12 per user' },
      { label: 'Overspend Drop', value: '-72%' }
    ],
    benefits: [
      { iconName: 'Target', title: 'Clear Boundaries', desc: 'Know exactly how much you can spend on Swiggy or Zomato each month.' },
      { iconName: 'AlertTriangle', title: 'Early Warning', desc: 'Get alerted when you hit 80% of your category spending limit.' },
      { iconName: 'BarChart3', title: 'Live Progress', desc: 'Monitor spent meters on your dashboard in real-time.' }
    ],
    howItWorks: [
      { step: '01', title: 'Select Category', desc: 'Pick Food, Shopping, or Bills from Category Budgets.' },
      { step: '02', title: 'Set Limit Amount', desc: 'Enter your target monthly cap e.g. ₹5,000.' },
      { step: '03', title: 'Stay On Track', desc: 'Log entries and watch your live spent meter stay in the green zone.' }
    ],
    testimonial: {
      quote: "Setting a ₹4,000 monthly limit on Food & Dining saved me ₹3,500 in the first month alone!",
      author: 'Karthik Raja',
      role: 'Software Engineer',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'category-limits'
  },
  'mood-tracker': {
    slug: 'mood-tracker',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'MOOD SPENDING TRACKER',
    indexNumber: '23',
    title: 'Track how emotional states impact your daily wallet',
    subtitle: 'Emotional Spending Analytics & Mood Logger',
    description: "Understand the emotional triggers behind your spending. Log daily mood icons (😀 😭 😡 🤩 😌 😔) alongside transactions and analyze 7-day emotional spending trends.",
    highlights: ['Daily emotional mood logger (6 mood states)', '7-Day Mood Trend graph & emotional highs/lows', 'AI emotional spending insights & roast mode', 'Mindful spending reflection prompts'],
    stats: [
      { label: 'Triggers Identified', value: '84%' },
      { label: 'Impulse Drop', value: '-65%' },
      { label: 'Mindful Users', value: '29,000+' }
    ],
    benefits: [
      { iconName: 'Brain', title: 'Emotional Self-Awareness', desc: 'Recognize whether stress, boredom, or happiness caused you to buy.' },
      { iconName: 'Activity', title: '7-Day Mood Graph', desc: 'Visualize emotional spending patterns over time.' },
      { iconName: 'Sparkles', title: 'AI Roast & Insights', desc: 'Get gentle AI feedback when stress-spending spikes.' }
    ],
    howItWorks: [
      { step: '01', title: 'Log Mood', desc: 'Tap one of 6 mood icons when logging a transaction.' },
      { step: '02', title: 'Analyze Trends', desc: 'Inspect your 7-day emotional spending graph.' },
      { step: '03', title: 'Curb Triggers', desc: 'Use 24-hour cooling timers when feeling stressed or impulsive.' }
    ],
    testimonial: {
      quote: "I realized I spent ₹8,000 on retail therapy whenever I felt stressed on Friday nights. Tracking mood completely opened my eyes!",
      author: 'Shalini Kapoor',
      role: 'UI Designer',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'mood-tracker'
  },
  'family-sync': {
    slug: 'family-sync',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'COUPLE & FAMILY SYNC',
    indexNumber: '24',
    title: 'Real-time partner, family & roommate spending sync',
    subtitle: 'Shared Household Ledger & Code Sync',
    description: "Manage household expenses, rent, groceries, and transfers together in real time. Generate a unique group sync code (`CP-S02G-2ARG`) to connect with partners or roommates instantly.",
    highlights: ['Unique Couple/Family Sync Code generation', 'Shared ledger transactions & category expenses', 'Real-time family member tags on entries', 'P2P Transfers between personal & family wallets'],
    stats: [
      { label: 'Groups Connected', value: '18,500+' },
      { label: 'Money Disputes Saved', value: '100%' },
      { label: 'Sync Speed', value: '< 1s' }
    ],
    benefits: [
      { iconName: 'Users', title: 'Instant Code Join', desc: 'Share your 8-digit sync code to connect instantly.' },
      { iconName: 'Heart', title: 'Shared Transparency', desc: 'View household expenses while keeping personal fun money private.' },
      { iconName: 'RefreshCw', title: 'P2P Wallet Transfers', desc: 'Settle household balances with 1-tap transfers.' }
    ],
    howItWorks: [
      { step: '01', title: 'Generate Code', desc: 'Create a unique Sync Code e.g. CP-S02G-2ARG.' },
      { step: '02', title: 'Partner Connects', desc: 'Your partner or roommate inputs the code in their app.' },
      { step: '03', title: 'Sync Ledger', desc: 'All joint household entries update in real-time across devices.' }
    ],
    testimonial: {
      quote: "My husband and I sync our household groceries and rent on ZenBudget. No more awkward bills spreadsheets!",
      author: 'Tanuja & Rahul',
      role: 'Product Lead & Consultant',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'family-sync'
  },
  'loans-tracker': {
    slug: 'loans-tracker',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'LOANS & BORROWINGS',
    indexNumber: '25',
    title: 'Track money borrowed & lent with direct PhonePe / UPI payback',
    subtitle: 'Loans Taken vs Loans Given Dashboard',
    description: "Never forget money owed or lent! Track loans taken and given with due dates, monthly interest rates (+3%/mo), cash repayments, and direct PhonePe/UPI quick pay.",
    highlights: ['Loans Taken vs Loans Given dashboard', 'Due date & interest rate (+3%/mo) calculations', 'Direct "Pay via PhonePe / UPI" button integration', 'Record Cash repayments with 1 tap'],
    stats: [
      { label: 'Loans Tracked', value: '95,000+' },
      { label: 'On-Time Paybacks', value: '94%' },
      { label: 'Interest Saved', value: '₹18.5 Cr' }
    ],
    benefits: [
      { iconName: 'Wallet', title: 'Total Clarity', desc: 'See exact amounts you owe or are owed by friends and family.' },
      { iconName: 'Clock', title: 'Due Date Reminders', desc: 'Get alerts before loan due dates expire.' },
      { iconName: 'Zap', title: 'PhonePe & UPI Pay', desc: 'Settle loans directly via PhonePe, Paytm, or Google Pay.' }
    ],
    howItWorks: [
      { step: '01', title: 'Add Loan', desc: 'Enter loan name, amount, due date, and interest rate.' },
      { step: '02', title: 'Track Balance', desc: 'ZenBudget auto-calculates accrued monthly interest.' },
      { step: '03', title: 'Settle via UPI', desc: 'Tap "Pay via PhonePe" to settle balances instantly.' }
    ],
    testimonial: {
      quote: "Tracking money lent to friends used to be awkward. Now ZenBudget records the due dates and interest, and lets them pay back via PhonePe with 1 tap!",
      author: 'Aniket Deshmukh',
      role: 'Business Owner',
      avatar: '/profile-sarah.jpg'
    },
    mockupType: 'loans-tracker'
  },
  'wealth-compound': {
    slug: 'wealth-compound',
    category: 'feature',
    categoryLabel: 'Platform Feature',
    badge: 'WEALTH COMPOUND SIMULATOR',
    indexNumber: '26',
    title: 'Project your compound wealth growth over 1 to 10+ years',
    subtitle: '10-Year Compound Wealth Growth Calculator',
    description: "Simulate how your monthly savings compound over 1 to 10+ years. Adjust monthly investment sliders and compare Fixed Deposits (7%), Gold (9%), and Mutual Funds (12%) scenarios.",
    highlights: ['10-Year projected total wealth calculator', 'Interactive Monthly Investment & Time Horizon sliders', 'Scenario comparison (FD 7%, Gold 9%, Mutual Funds 12%)', 'Simulated wealth gain vs total deposited breakdown'],
    stats: [
      { label: 'Simulations Run', value: '250,000+' },
      { label: '10-Yr Wealth Multiplier', value: '2.8x' },
      { label: 'Projections Created', value: '₹140 Cr+' }
    ],
    benefits: [
      { iconName: 'TrendingUp', title: 'Compound Magic', desc: 'See how ₹10,000/month turns into ₹23 Lakhs+ in 10 years.' },
      { iconName: 'Target', title: 'Interactive Sliders', desc: 'Adjust monthly deposits and time horizons in real-time.' },
      { iconName: 'BarChart3', title: 'Scenario Comparison', desc: 'Compare savings accounts vs SIP mutual fund returns.' }
    ],
    howItWorks: [
      { step: '01', title: 'Set Monthly Deposit', desc: 'Drag the monthly investment slider e.g. ₹15,000/mo.' },
      { step: '02', title: 'Choose Time Horizon', desc: 'Select investment duration from 1 to 10+ years.' },
      { step: '03', title: 'View Compound Growth', desc: 'Inspect projected total wealth and compound gains.' }
    ],
    testimonial: {
      quote: "The 10-year wealth simulator convinced me to start a ₹10,000/month SIP. Watching the compound gain bar rise is super inspiring!",
      author: 'Rishi Kapoor',
      role: 'Analyst',
      avatar: '/profile-daniel.jpg'
    },
    mockupType: 'wealth-compound'
  }
};

export default function LandingPage({ onOpenWebApp }: LandingPageProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activePage, setActivePage] = useState<string>('home');

  const navigateToPage = (slug: string) => {
    setActivePage(slug);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    if (slug === 'home') {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    } else {
      window.location.hash = slug;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activePage]);

  useEffect(() => {
    const syncPageFromHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash && (hash === 'quiz' || hash === 'toolkit' || hash === 'stories' || FEATURE_PAGES_DATA[hash])) {
        setActivePage(hash);
      } else if (!hash) {
        setActivePage('home');
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    syncPageFromHash();
    window.addEventListener('hashchange', syncPageFromHash);
    return () => window.removeEventListener('hashchange', syncPageFromHash);
  }, []);
  const [activeToolkit, setActiveToolkit] = useState(0);
  const [activeInsideTab, setActiveInsideTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showIosGuideModal, setShowIosGuideModal] = useState(false);
  const [deviceOS, setDeviceOS] = useState<'ios' | 'android' | 'mac' | 'web'>('web');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDropdownMouseEnter = (key: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(key);
  };

  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 250);
  };

  // Quiz State & Randomization
  const [activeQuizQuestions, setActiveQuizQuestions] = useState(() => getRandom10Questions());
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const startFreshQuiz = () => {
    const fresh10 = getRandom10Questions();
    setActiveQuizQuestions(fresh10);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setActivePage('quiz');
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };
  // Feature Card Popup Modal State
  const [featureModalData, setFeatureModalData] = useState<{
    title: string;
    badge: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    bullets: string[];
    actionLabel: string;
    mockupType: 'chat' | 'community' | 'analytics' | 'budget' | 'goals';
  } | null>(null);

  const openFeatureModal = (index: number) => {
    const tab = insideTabs[index] || insideTabs[0];
    setFeatureModalData({
      title: tab.title,
      badge: tab.label,
      icon: tab.contentIcon,
      color: '#10b981',
      description: tab.description,
      bullets: tab.features,
      actionLabel: `Try ${tab.label} Free`,
      mockupType: tab.mockupType as any
    });
  };

  // Typewriter Animation State
  const typewriterWords = ["Savings", "Financial Freedom", "Smart Budgets", "Wealth Building", "Debt Elimination"];
  const [typedText, setTypedText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = typewriterWords[wordIndex % typewriterWords.length];
    let typingSpeed = isDeleting ? 45 : 90;

    if (!isDeleting && typedText === currentWord) {
      typingSpeed = 2200; // Pause on full word
    } else if (isDeleting && typedText === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % typewriterWords.length);
      typingSpeed = 300;
    }

    const timer = setTimeout(() => {
      if (!isDeleting && typedText === currentWord) {
        setIsDeleting(true);
      } else if (isDeleting) {
        setTypedText(currentWord.substring(0, typedText.length - 1));
      } else {
        setTypedText(currentWord.substring(0, typedText.length + 1));
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, wordIndex]);

  const [userCurrency, setUserCurrency] = useState<{ symbol: string; code: string; rate: number; country: string }>({
    symbol: '₹',
    code: 'INR',
    rate: 1,
    country: 'India'
  });

  useEffect(() => {
    const fetchGeoLocation = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const country = data.country_name || data.country || 'India';
          const curr = data.currency || 'INR';
          if (curr === 'USD' || data.country_code === 'US') {
            setUserCurrency({ symbol: '$', code: 'USD', rate: 0.012, country });
          } else if (curr === 'EUR' || ['DE','FR','IT','ES','NL','BE'].includes(data.country_code)) {
            setUserCurrency({ symbol: '€', code: 'EUR', rate: 0.011, country });
          } else if (curr === 'GBP' || data.country_code === 'GB') {
            setUserCurrency({ symbol: '£', code: 'GBP', rate: 0.0094, country });
          } else if (curr === 'AED' || data.country_code === 'AE') {
            setUserCurrency({ symbol: 'AED ', code: 'AED', rate: 0.044, country });
          } else if (curr === 'CAD' || data.country_code === 'CA') {
            setUserCurrency({ symbol: 'C$', code: 'CAD', rate: 0.016, country });
          } else {
            setUserCurrency({ symbol: '₹', code: 'INR', rate: 1, country });
          }
          return;
        }
      } catch (err) {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          if (!tz.includes('Asia/Kolkata') && !tz.includes('Asia/Calcutta')) {
            if (tz.includes('America')) {
              setUserCurrency({ symbol: '$', code: 'USD', rate: 0.012, country: 'United States' });
            } else if (tz.includes('Europe')) {
              setUserCurrency({ symbol: '€', code: 'EUR', rate: 0.011, country: 'Europe' });
            }
          }
        } catch (e) {}
      }
    };
    fetchGeoLocation();
  }, []);

  const fmtCurr = (inrVal: number) => {
    if (userCurrency.code === 'INR') {
      return `₹${inrVal.toLocaleString('en-IN')}`;
    }
    const val = Math.round(inrVal * userCurrency.rate);
    return `${userCurrency.symbol}${val.toLocaleString('en-US')}`;
  };

  const renderMockupContent = (frameIdx: number) => {
    const isAiCoach = activePage === 'ai-coach';
    const isAnalytics = activePage === 'analytics';
    const isPaycheck = activePage === 'paycheck-to-paycheck';
    const isImpulse = activePage === 'impulse-buying' || activePage === 'impulse-spending';
    const isDebt = activePage === 'credit-card-debt' || activePage === 'credit-debt';
    const isEmergency = activePage === 'no-emergency-savings' || activePage === 'no-emergency-fund';
    const isFreelance = activePage === 'irregular-income' || activePage === 'freelancer-money';
    const isSubs = activePage === 'hidden-subscriptions';
    const isCouple = activePage === 'couples-budget' || activePage === 'couple-finances';
    const isStudents = activePage === 'students-pros';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', height: '100%', overflow: 'hidden' }}>
        {/* Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', fontWeight: 800, color: t.text, opacity: 0.85, padding: '0 4px 2px' }}>
          <span>9:41</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '8.5px' }}>5G</span>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        {/* App Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc', padding: '6px 9px', borderRadius: '12px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img src="/favicon.png" style={{ width: '22px', height: '22px', borderRadius: '6px' }} alt="ZenBudget" />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: t.text, lineHeight: 1.1 }}>ZenBudget</div>
              <div style={{ fontSize: '8.5px', color: t.textMuted }}>{userCurrency.country} ({userCurrency.code})</div>
            </div>
          </div>
          <span style={{ fontSize: '8.5px', background: '#10b981', color: '#ffffff', padding: '2px 6px', borderRadius: '100px', fontWeight: 900 }}>ACTIVE</span>
        </div>

        {/* Total Net Worth Card */}
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderRadius: '16px', padding: '12px 14px', color: '#ffffff', boxShadow: '0 8px 20px rgba(16,185,129,0.25)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '9px', opacity: 0.88, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {isCouple ? 'COUPLE NET WORTH' : isFreelance ? 'FREELANCE VAULT' : 'TOTAL NET WORTH'}
          </div>
          <div style={{ fontSize: '19px', fontWeight: 900, letterSpacing: '-0.02em' }}>{fmtCurr(348500)}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '8.5px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: '100px', fontWeight: 800, marginTop: '3px' }}>
            <span>📈 +{fmtCurr(45000)} Saved</span>
            <span>⚡ 94% Healthy</span>
          </div>
        </div>

        {/* Feature & Condition Tailored Dynamic UI */}
        {isAiCoach ? (
          <div style={{ background: isDark ? 'rgba(139,92,246,0.12)' : '#f3e8ff', border: `1px solid ${isDark ? 'rgba(139,92,246,0.3)' : '#ddd6fe'}`, borderRadius: '14px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9.5px', fontWeight: 800, color: isDark ? '#c084fc' : '#6b21a8' }}>
              <Brain size={13} color="#8b5cf6" />
              <span>24/7 AI Money Coach</span>
            </div>
            <div style={{ fontSize: '9px', background: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff', padding: '5px 7px', borderRadius: '7px', color: t.text, fontStyle: 'italic' }}>
              "How to cut expenses by 15%?"
            </div>
            <div style={{ fontSize: '9px', color: isDark ? '#e9d5ff' : '#4c1d95', lineHeight: 1.3, fontWeight: 700 }}>
              💡 Found 2 unused services! Cancel to save {fmtCurr(1450)}/mo.
            </div>
          </div>
        ) : isAnalytics ? (
          <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '14px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontWeight: 800, color: t.text }}>
              <span>Category Breakdown</span>
              <span style={{ color: '#10b981' }}>Monthly</span>
            </div>
            {[
              { cat: 'Groceries', amt: 12400, pct: 55, color: '#10b981' },
              { cat: 'Dining Out', amt: 4800, pct: 30, color: '#f59e0b' }
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', fontWeight: 700, color: t.textSub }}>
                  <span>{c.cat}</span>
                  <span>{fmtCurr(c.amt)}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', borderRadius: '100px' }}>
                  <div style={{ width: `${c.pct}%`, height: '100%', background: c.color, borderRadius: '100px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : isPaycheck ? (
          <div style={{ background: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#10b981' }}>🛡️ 15-Day Salary Buffer Active</div>
            <div style={{ fontSize: '8.5px', color: t.textSub }}>Next Paycheck in 12 Days. Buffer reserve: {fmtCurr(25000)}.</div>
          </div>
        ) : isImpulse ? (
          <div style={{ background: isDark ? 'rgba(245,158,11,0.12)' : '#fef3c7', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '14px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#d97706' }}>⏱️ 24h Impulse Cooling Timer</div>
            <div style={{ fontSize: '8.5px', color: t.textSub }}>{fmtCurr(4500)} Wireless Headphones — 18h 40m remaining.</div>
          </div>
        ) : isDebt ? (
          <div style={{ background: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#ef4444' }}>⚡ Debt Avalanche Tracker</div>
            <div style={{ fontSize: '8.5px', color: t.textSub }}>Highest Interest Card: Paid off 80%! Saved {fmtCurr(18000)} in interest.</div>
          </div>
        ) : isEmergency ? (
          <div style={{ background: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '14px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#2563eb' }}>🏦 Emergency Fund Cushion</div>
            <div style={{ fontSize: '8.5px', color: t.textSub }}>Starter target: {fmtCurr(25000)} (Fully Funded 100%).</div>
          </div>
        ) : isFreelance ? (
          <div style={{ background: isDark ? 'rgba(168,85,247,0.12)' : '#faf5ff', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '14px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#9333ea' }}>📊 Income Smoothing System</div>
            <div style={{ fontSize: '8.5px', color: t.textSub }}>Monthly floor locked: {fmtCurr(45000)}. Excess stored for low months.</div>
          </div>
        ) : isSubs ? (
          <div style={{ background: isDark ? 'rgba(236,72,153,0.12)' : '#fdf2f8', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '14px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#db2777' }}>🔍 Subscription Audit Radar</div>
            <div style={{ fontSize: '8.5px', color: t.textSub }}>Found 3 forgotten apps costing {fmtCurr(2800)}/year!</div>
          </div>
        ) : isCouple ? (
          <div style={{ background: isDark ? 'rgba(20,184,166,0.12)' : '#ccfbf1', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '14px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0d9488', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={12} color="#0d9488" />
              <span>👩‍❤️‍👨 Couple Shared Ledger</span>
            </div>
            <div style={{ fontSize: '8px', color: t.textSub, lineHeight: 1.2 }}>
              Synced Code <strong>#ZB-8821</strong>. Joint groceries & rent split 50/50.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', padding: '4px 6px', borderRadius: '6px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '8.5px', fontWeight: 800, color: t.text }}>Rent & Bills</div>
                  <div style={{ fontSize: '7px', color: t.textMuted }}>Shared • 50/50</div>
                </div>
                <span style={{ fontSize: '8.5px', fontWeight: 900, color: '#ef4444' }}>-{fmtCurr(22000)}</span>
              </div>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', padding: '4px 6px', borderRadius: '6px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '8.5px', fontWeight: 800, color: t.text }}>Supermarket</div>
                  <div style={{ fontSize: '7px', color: t.textMuted }}>Shared • 60/40</div>
                </div>
                <span style={{ fontSize: '8.5px', fontWeight: 900, color: '#ef4444' }}>-{fmtCurr(4500)}</span>
              </div>
            </div>
          </div>
        ) : isStudents ? (
          <div style={{ background: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '14px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#2563eb' }}>🎓 SIP & Student Automation</div>
            <div style={{ fontSize: '8.5px', color: t.textSub }}>Monthly SIP: {fmtCurr(2000)}. Compound target: {fmtCurr(1000000)}.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '7px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px' }}>🍔</span>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 800, color: t.text, lineHeight: 1.1 }}>Swiggy Gourmet</div>
                  <div style={{ fontSize: '8px', color: t.textMuted }}>Dining Out</div>
                </div>
              </div>
              <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#ef4444' }}>-{fmtCurr(420)}</span>
            </div>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '7px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px' }}>💼</span>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 800, color: t.text, lineHeight: 1.1 }}>Freelance Payout</div>
                  <div style={{ fontSize: '8px', color: t.textMuted }}>Salary Credit</div>
                </div>
              </div>
              <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#10b981' }}>+{fmtCurr(25000)}</span>
            </div>
          </div>
        )}

        {/* AI Insight Pill */}
        <div style={{ background: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: 'auto' }}>
          <Sparkles size={11} color="#10b981" />
          <span style={{ fontSize: '8px', fontWeight: 700, color: isDark ? '#a7f3d0' : '#047857', lineHeight: 1.2 }}>
            AI: Saved {fmtCurr(4200)} this week in {userCurrency.country}!
          </span>
        </div>

        {/* iOS Drag Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1px' }}>
          <div style={{ width: '80px', height: '3px', background: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)', borderRadius: '100px' }}></div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const userAgent = window.navigator.userAgent || window.navigator.vendor;
    const isIos = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(userAgent);
    const isMac = /Macintosh|Mac OS X/i.test(userAgent) && !isIos;
    const isWindows = /Windows|Win32|Win64/i.test(userAgent);

    if (isIos) {
      setDeviceOS('ios');
    } else if (isAndroid) {
      setDeviceOS('android');
    } else if (isMac) {
      setDeviceOS('mac');
    } else if (isWindows) {
      setDeviceOS('windows');
    } else {
      setDeviceOS('web');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const hiddenElements = document.querySelectorAll('.scroll-fade-up, .hero-animate');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      hiddenElements.forEach((el) => observer.unobserve(el));
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(null);
    if (activePage !== 'home') {
      setActivePage('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const selectFeatureTab = (tabIndex: number) => {
    setActiveInsideTab(tabIndex);
    scrollTo('inside-app');
  };

  const handleDownloadAction = () => {
    setShowModal(false);
    if (deviceOS === 'ios') {
      setShowIosGuideModal(true);
    } else if (deviceOS === 'android') {
      const link = document.createElement('a');
      link.href = '/zenbudget.apk';
      link.download = 'ZenBudget.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (deferredPrompt) {
        deferredPrompt.prompt();
      } else {
        const link = document.createElement('a');
        link.href = '/zenbudget.apk';
        link.download = 'ZenBudget.apk';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleDownloadApk = () => {
    handleDownloadAction();
  };

  // Quiz Handling
  const handleSelectQuizOption = (points: number) => {
    const nextAnswers = [...quizAnswers, points];
    setQuizAnswers(nextAnswers);

    if (currentQuestionIndex + 1 < activeQuizQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizSubmitted(true);
    }
  };

  const resetQuiz = () => {
    startFreshQuiz();
  };

  // Calculate Quiz Score & Insight Categories
  const totalScore = quizAnswers.reduce((sum, p) => sum + p, 0);
  const maxScore = 100;
  const scorePercentage = Math.round((totalScore / maxScore) * 100);

  const getScoreDetails = (score: number) => {
    if (score >= 80) {
      return {
        badge: "OPTIMAL FINANCIAL HEALTH",
        badgeBg: "#dcfce7",
        badgeColor: "#166534",
        gaugeColor: "#10b981",
        description: "You demonstrate strong financial discipline, structured zero-based tracking, and an emergency savings buffer.",
        budgetControl: { level: "Optimal", pct: 90, color: "#10b981" },
        impulseControl: { level: "High", pct: 85, color: "#10b981" },
        savingsRate: { level: "Strong", pct: 88, color: "#10b981" },
        debtRisk: { level: "Low Risk", pct: 95, color: "#10b981" }
      };
    } else if (score >= 50) {
      return {
        badge: "MODERATE BUDGET STRESS",
        badgeBg: "#fef3c7",
        badgeColor: "#92400e",
        gaugeColor: "#f59e0b",
        description: "You have notable budgeting triggers and impulse spending gaps that would benefit from structured AI coaching.",
        budgetControl: { level: "Moderate", pct: 60, color: "#f59e0b" },
        impulseControl: { level: "Moderate", pct: 55, color: "#f59e0b" },
        savingsRate: { level: "Developing", pct: 50, color: "#f59e0b" },
        debtRisk: { level: "Moderate Risk", pct: 65, color: "#f59e0b" }
      };
    } else {
      return {
        badge: "HIGH IMPULSE & BUDGET RISK",
        badgeBg: "#fee2e2",
        badgeColor: "#991b1b",
        gaugeColor: "#ef4444",
        description: "Your financial health indicates high impulse spending stress and an absence of emergency buffers.",
        budgetControl: { level: "Needs Attention", pct: 30, color: "#ef4444" },
        impulseControl: { level: "High Risk", pct: 25, color: "#ef4444" },
        savingsRate: { level: "Low", pct: 20, color: "#ef4444" },
        debtRisk: { level: "High Vulnerability", pct: 35, color: "#ef4444" }
      };
    }
  };

  const scoreInfo = getScoreDetails(scorePercentage);

  const t = {
    bg: isDark ? '#0d110e' : '#FAFAF8',
    text: isDark ? '#ffffff' : '#1f2937',
    textMuted: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(31,41,55,0.6)',
    textSub: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(31,41,55,0.75)',
    headerBg: isDark ? 'rgba(13,17,14,0.92)' : 'rgba(255,255,255,0.92)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    cardBg: isDark ? '#161d18' : '#ffffff',
    inputBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  };

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      scroll-behavior: smooth !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      height: auto !important;
      min-height: 100vh !important;
      width: 100% !important;
      max-width: 100vw !important;
      -webkit-overflow-scrolling: touch !important;
    }
    body {
      font-family: 'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      background: ${t.bg} !important;
      color: ${t.text};
      transition: background 0.3s, color 0.3s;
      position: relative !important;
    }
    #root {
      overflow-x: hidden !important;
      overflow-y: visible !important;
      height: auto !important;
      min-height: 100vh !important;
      width: 100% !important;
      max-width: 100vw !important;
    }
    .glass-header {
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
    }
    .hero-animate { animation: heroUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
    @keyframes heroUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
    
    .scroll-fade-up { opacity: 0; transform: translateY(32px); transition: all 0.8s cubic-bezier(0.16,1,0.3,1); }
    .scroll-fade-up.is-visible { opacity: 1; transform: translateY(0); }
    
    .hover-lift { transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
    .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(0,0,0,0.12); }
    
    @keyframes floatParticle {
      0% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
      50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
      100% { transform: translateY(-40px) rotate(360deg); opacity: 0; }
    }
    
    @keyframes innerhealRotate {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.15); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes innerhealGlow {
      0% { opacity: 0.5; transform: translate(0, 0) scale(1); }
      50% { opacity: 0.85; transform: translate(40px, -30px) scale(1.2); }
      100% { opacity: 0.5; transform: translate(0, 0) scale(1); }
    }
    .innerheal-rotate {
      animation: innerhealRotate 22s linear infinite;
      transform-origin: center center;
    }
    .innerheal-glow {
      animation: innerhealGlow 14s ease-in-out infinite alternate;
    }

    @keyframes blinkCursor {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    .typewriter-cursor {
      display: inline-block;
      width: 3px;
      height: 0.9em;
      background-color: #10b981;
      margin-left: 6px;
      vertical-align: middle;
      animation: blinkCursor 0.8s infinite;
      border-radius: 2px;
    }

    @media (max-width: 1024px) {
      .desktop-only { display: none !important; }
      .mobile-show { display: flex !important; }
      .grid-hero { grid-template-columns: 1fr !important; gap: 32px !important; }
      .bento-grid { grid-template-columns: 1fr !important; }
      .bento-span2 { grid-column: span 1 !important; }
      .toolkit-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
      .inside-row { flex-direction: column !important; gap: 32px !important; }
      .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }

    @media (max-width: 768px) {
      .quiz-container { padding: 20px 16px !important; }
      .scorecard-summary-grid { grid-template-columns: 1fr !important; }
      .scorecard-categories-grid { grid-template-columns: 1fr !important; }
    }

    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
      .hero-title { font-size: 2.1rem !important; line-height: 1.15 !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
      .hero-buttons-row { flex-direction: column !important; width: 100% !important; align-items: stretch !important; }
      .hero-button { width: 100% !important; justify-content: center !important; }
      .inside-tabs-bar { justify-content: flex-start !important; overflow-x: auto !important; width: 100% !important; padding-bottom: 8px !important; -webkit-overflow-scrolling: touch !important; }
      .inside-tab-btn { flex-shrink: 0 !important; font-size: 13px !important; padding: 10px 16px !important; }
    }
  `;

  const insideTabs = [
    { 
      label: 'AI Coach', icon: <MessageCircleHeart size={16} />, contentIcon: <MessageCircleHeart size={28} />,
      title: '24/7 Compassionate AI Financial Coach',
      description: 'Talk to your intelligent financial companion any time. It analyzes spending patterns, identifies impulse buying triggers, and provides science-backed financial guidance.',
      features: ['Evidence-based financial frameworks', 'Instant spending trigger detection', '100% private, judgment-free advice'],
      mockupType: 'chat'
    },
    { 
      label: 'Quick Capture & Wallet', icon: <Zap size={16} />, contentIcon: <Zap size={28} />,
      title: 'Quick Capture & Multi-Wallet Manager',
      description: 'Log expense, income, or transfer entries using natural language or voice speech-to-text. Manage bank accounts, cash, UPI, and card wallets seamlessly.',
      features: ['AI natural language auto-detection', 'Segmented Expense, Income & Transfer tabs', 'Voice microphone 🎤 input support', 'Dashed "+ Add Account" wallet container'],
      mockupType: 'quick-capture'
    },
    { 
      label: 'Weekly & Monthly Story', icon: <Sparkles size={16} />, contentIcon: <Sparkles size={28} />,
      title: 'Weekly Wrapped & Spotify-Style Monthly Story',
      description: 'Relive your financial journey with dynamic, shareable Weekly Wrapped cards and Spotify-style Monthly Stories featuring personalized money scores.',
      features: ['🎁 Weekly Money Wrapped summary', '🎵 Monthly Story (Spotify style)', 'Real-time Zen Money Score (1-100)', '1-Tap instant social share cards'],
      mockupType: 'stories'
    },
    { 
      label: 'Zen Companion', icon: <Heart size={16} />, contentIcon: <Heart size={28} />,
      title: 'Zen Companion (Zen Piggy & Golden Dragon)',
      description: 'Adopt a gamified companion pet that reflects your financial discipline. Watch Zen Piggy or Draco cheer up, wear accessories from the shop, and level up!',
      features: ['Dynamic mood badges (Regretful 😡, Thrilled 👑)', 'Companion Item Shop & Accessory Equip System', 'COMPANION HAPPINESS progress tracker', 'XP & level-up progression (Lvl 1 Piggy ➔ Lvl 2 Dragon)'],
      mockupType: 'companion'
    },
    { 
      label: 'Badges & Free Premium', icon: <Award size={16} />, contentIcon: <Award size={28} />,
      title: 'Achievement Badges & Free Premium Unlocks',
      description: 'Complete spending challenges and unlock real rewards! Maintain a 90-day streak or invite subscribed friends to claim 1 Month FREE Premium Subscription.',
      features: ['🎁 10 Invites: Earn 1 Month Free Premium', '👑 90d Pro Saver: Unlock 1 Month Free Premium', 'Interactive achievement badge modal popups', 'Real-time daily streak counters'],
      mockupType: 'badges'
    },
    { 
      label: 'Monthly Letter', icon: <BookOpen size={16} />, contentIcon: <BookOpen size={28} />,
      title: 'Personal Monthly Letter from Zen',
      description: 'Receive your personalized 30-day compiled money report letter. Track your daily habits for 30 days to unlock your private monthly financial story.',
      features: ['30-day compiled personal money story', 'Monthly Report lock countdown timer', 'Personalized savings & expenditure highlights', 'Downloadable PDF monthly summary'],
      mockupType: 'monthly-letter'
    },
    { 
      label: 'Category Limits', icon: <Target size={16} />, contentIcon: <Target size={28} />,
      title: 'Category Spending Limits & Controls',
      description: 'Set explicit monthly spending limits on Food & Dining, Shopping, Entertainment, Bills & Utilities, and Transport to stop budget leaks instantly.',
      features: ['Custom per-category monthly budget caps', 'Live spent vs limit progress meters', 'Color-coded warning indicators when spending velocity is high', '1-Tap "+ Set Limit" adjustment modal'],
      mockupType: 'category-limits'
    },
    { 
      label: 'Mood Spending Tracker', icon: <Activity size={16} />, contentIcon: <Activity size={28} />,
      title: 'Emotional Spending & Mood Tracker',
      description: 'Understand how your emotional state impacts your wallet. Select daily mood icons (😊 😭 😡 🤩 😌 😔) and analyze 7-day emotional spending trends.',
      features: ['Daily emotional mood logger (6 mood states)', '7-Day Mood Trend graph & emotional highs/lows', 'AI emotional spending insights & roast mode', 'Mindful spending reflection prompts'],
      mockupType: 'mood-tracker'
    },
    { 
      label: 'Couple & Family Sync', icon: <Users size={16} />, contentIcon: <Users size={28} />,
      title: 'Couple & Family Real-Time Sync',
      description: 'Sync shared household expenses, rent, groceries, and transfers with partners, families, or roommates in real time using unique group join codes.',
      features: ['Unique Couple/Family Sync Code generation', 'Shared ledger transactions & category expenses', 'Real-time family member tags on entries', 'P2P Transfers between personal & family wallets'],
      mockupType: 'family-sync'
    },
    { 
      label: 'Loans & Borrowings', icon: <Wallet size={16} />, contentIcon: <Wallet size={28} />,
      title: 'Loans & Borrowings Tracker with UPI Payback',
      description: 'Keep track of money borrowed and lent to friends or banks with due dates, monthly interest rates, cash recording, and instant PhonePe/UPI payback.',
      features: ['Loans Taken vs Loans Given dashboard', 'Due date & interest rate (+3%/mo) calculations', 'Direct "Pay via PhonePe / UPI" button integration', 'Record Cash repayments with 1 tap'],
      mockupType: 'loans-tracker'
    },
    { 
      label: 'Wealth Simulator', icon: <TrendingUp size={16} />, contentIcon: <TrendingUp size={28} />,
      title: '10-Year Wealth Compound Simulator',
      description: 'Simulate your future financial growth over 1 to 10+ years. Adjust monthly investment sliders and compare Fixed Deposits, Gold, Mutual Funds, and Equity scenarios.',
      features: ['10-Year projected total wealth calculator', 'Interactive Monthly Investment & Time Horizon sliders', 'Scenario comparison (Fixed Deposit 7%, Gold 9%, Mutual Funds 12%)', 'Simulated wealth gain vs total deposited breakdown'],
      mockupType: 'wealth-compound'
    },
    { 
      label: 'Expense Analytics', icon: <ChartLine size={16} />, contentIcon: <ChartLine size={28} />,
      title: 'Deep Expense Analytics & Insights',
      description: 'Go beyond simple charts. Our analytics engine categorizes every transaction automatically, revealing hidden trends and recurring subscriptions draining your wallet.',
      features: ['Auto-categorization with high precision', 'Month-over-month trend analysis', 'Subscription & hidden fee alerts'],
      mockupType: 'analytics'
    },
    { 
      label: 'Savings Goals', icon: <Target size={16} />, contentIcon: <Target size={28} />,
      title: 'Goal-Oriented Wealth Tracking',
      description: 'Whether it’s an emergency fund, a vacation, or paying off debt, visualize progress with dedicated goal tracking. See exactly when you’ll reach your financial milestones.',
      features: ['Visual progress milestones', 'Automated savings rules & triggers', 'Debt payoff & wealth projection calculators'],
      mockupType: 'goals'
    },
    { 
      label: 'Private Vault', icon: <Lock size={16} />, contentIcon: <Lock size={28} />,
      title: 'Biometric Lock & Encrypted Local Vault',
      description: 'Your financial data is 100% yours. Protected by device biometric FaceID/Fingerprint lock and end-to-end local encryption — completely offline-capable.',
      features: ['Biometric & PIN lock security', 'Offline PWA & APK data persistence', 'Zero tracking — client-side encrypted vault'],
      mockupType: 'vault'
    }
  ];

  const toolkitItems = [
    { 
      title: 'Smart Budget Templates', 
      desc: 'Access pre-built budgets tailored for students, freelancers, couples, and families — rooted in proven financial frameworks. Customize at your own pace.',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200&auto=format&fit=crop',
      badge: 'Budget Framework'
    },
    { 
      title: 'Community Savings Challenges', 
      desc: 'You are not alone. Join collaborative savings challenges and community sessions designed to build healthy money habits alongside supportive peers.',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
      badge: 'Together Challenges'
    },
    { 
      title: 'Personalized Financial Planning', 
      desc: 'Receive customized plans structured around your unique goals, focusing on daily routines that support long-term wealth creation and debt elimination.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
      badge: 'AI Roadmap'
    },
  ];

  return (
    <div style={{ backgroundColor: t.bg, minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      <style>{css}</style>

      {/* ═══════════════ HEADER ═══════════════ */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
        <div style={{ 
          pointerEvents: 'auto', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '0 24px', transition: 'all 0.3s', 
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.75)', 
          borderRadius: '3rem', 
          background: isDark ? 'rgba(15, 22, 17, 0.55)' : 'rgba(255, 255, 255, 0.55)', 
          backdropFilter: 'blur(24px) saturate(190%)', WebkitBackdropFilter: 'blur(24px) saturate(190%)', 
          boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 16px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)', 
          width: 'min(1440px, calc(100vw - 1.5rem))', height: '72px' 
        }}>
          {/* Logo */}
          <a onClick={e => { e.preventDefault(); navigateToPage('home'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textDecoration: 'none' }}>
            <img src="/favicon.png" alt="ZenBudget Logo" style={{ width: '34px', height: '34px', borderRadius: '12px' }} />
            <span style={{ fontSize: '18px', fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>ZenBudget</span>
          </a>

          {/* Desktop Nav Links */}
          <ul style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none' }} className="desktop-only">
            {[
              { label: 'Features', id: 'features', key: 'features', hasDropdown: true },
              { label: 'Conditions', id: 'conditions', key: 'conditions', hasDropdown: true },
              { label: 'Inside App', id: 'inside-app', key: 'inside app', hasDropdown: true },
              { label: 'Financial Quiz', id: 'quiz', key: 'quiz', hasDropdown: false },
              { label: 'Toolkit', id: 'toolkit', key: 'toolkit', hasDropdown: false },
              { label: 'Stories', id: 'community', key: 'stories', hasDropdown: false }
            ].map(link => (
              <li 
                key={link.id} 
                onMouseEnter={() => link.hasDropdown && handleDropdownMouseEnter(link.key)} 
                onMouseLeave={() => link.hasDropdown && handleDropdownMouseLeave()}
              >
                <button 
                  onClick={() => {
                    if (link.key === 'quiz') {
                      navigateToPage('quiz');
                    } else if (link.key === 'toolkit') {
                      navigateToPage('toolkit');
                    } else if (link.key === 'stories') {
                      navigateToPage('community');
                    } else if (link.hasDropdown) {
                      if (activeDropdown === link.key) {
                        setActiveDropdown(null);
                      } else {
                        handleDropdownMouseEnter(link.key);
                      }
                    } else {
                      scrollTo(link.id);
                    }
                  }} 
                  style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: (activeDropdown === link.key || activePage === link.key) ? t.text : t.textMuted, background: (activeDropdown === link.key || activePage === link.key) ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent', cursor: 'pointer', border: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown size={14} style={{ opacity: 0.6, transform: activeDropdown === link.key ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                </button>
              </li>
            ))}
            <li>
              <button onClick={() => navigateToPage('quiz')} style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#10b981', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Quiz <span style={{ background: '#10b981', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '100px', textTransform: 'uppercase' }}>FREE</span>
              </button>
            </li>
          </ul>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={toggleTheme} aria-label="Toggle dark mode" style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `1px solid ${t.border}`, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)', cursor: 'pointer', color: t.text }}>
              {isDark ? <Sun size={16} color="#facc15" /> : <Moon size={16} />}
            </button>

            {deviceOS === 'ios' ? (
              <button onClick={() => setShowIosGuideModal(true)} title="Add to Home Screen" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: t.text, padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Smartphone size={14} color="#10b981" />
                <span>Add to Home</span>
              </button>
            ) : (
              <button onClick={handleDownloadApk} title="Download Android App APK" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: t.text, padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'all 0.2s' }} className="desktop-only">
                <Download size={14} color="#10b981" />
                <span>APK</span>
              </button>
            )}

            <button onClick={onOpenWebApp} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff', paddingLeft: '18px', paddingRight: '6px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
              <Wallet size={16} />
              <span>Open Web App</span>
              <span style={{ background: 'rgba(255,255,255,0.25)', padding: '6px', borderRadius: '50%', display: 'flex' }}><ArrowRight size={14} /></span>
            </button>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none', background: 'transparent', border: 'none', color: t.text, cursor: 'pointer', padding: '6px' }} className="mobile-show">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* ═══════════════ HEADER MEGA DROPDOWNS ═══════════════ */}
        {activeDropdown === 'features' && (
          <div 
            onMouseEnter={() => handleDropdownMouseEnter('features')}
            onMouseLeave={handleDropdownMouseLeave}
            style={{ pointerEvents: 'auto', position: 'absolute', top: '78px', left: '50%', transform: 'translateX(-50%)', width: 'min(1100px, calc(100vw - 48px))', background: isDark ? 'rgba(18,25,20,0.75)' : 'rgba(255,255,255,0.75)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.8)', borderRadius: '24px', padding: '24px', boxShadow: isDark ? '0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 30px 70px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#10b981' }}>Platform Features</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {[
                { icon: <MessageCircleHeart size={20} color="#10b981" />, title: 'AI Coach Assistant', sub: '24/7 compassionate support', slug: 'ai-coach' },
                { icon: <Activity size={20} color="#3b82f6" />, title: 'Zero-Based Budget', sub: 'Purposeful money envelopes', slug: 'budget-planner' },
                { icon: <ChartLine size={20} color="#f59e0b" />, title: 'Expense Analytics', sub: 'Visual spending trends & leaks', slug: 'analytics' },
                { icon: <Flame size={20} color="#ec4899" />, title: 'Money Forest', sub: 'Gamified tree habit builder', slug: 'money-forest' },
                { icon: <Receipt size={20} color="#8b5cf6" />, title: 'AI Receipt Scanner', sub: 'Camera OCR invoice extraction', slug: 'receipt-scanner' },
                { icon: <Lock size={20} color="#64748b" />, title: '100% Private Vault', sub: 'Encrypted zero-knowledge storage', slug: 'private-vault' },
                { icon: <Target size={20} color="#10b981" />, title: 'Savings Goals', sub: 'Milestone & streak tracker', slug: 'savings-goals' },
                { icon: <Users size={20} color="#eab308" />, title: 'Together Community', sub: 'Peer debt challenges & tips', slug: 'community' }
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => navigateToPage(item.slug)}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', padding: '12px', borderRadius: '16px', transition: 'all 0.2s', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)', border: `1px solid ${t.border}`, backdropFilter: 'blur(10px)' }} 
                  className="hover-lift"
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: t.text, marginBottom: '2px' }}>{item.title}</div>
                    <div style={{ fontSize: '11.5px', color: t.textMuted, lineHeight: 1.3 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${t.border}`, fontSize: '12.5px', color: t.textMuted }}>
              <span>Everything ZenBudget offers in one powerful privacy-first app</span>
              <button onClick={() => navigateToPage('ai-coach')} style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View all features <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeDropdown === 'conditions' && (
          <div 
            onMouseEnter={() => handleDropdownMouseEnter('conditions')}
            onMouseLeave={handleDropdownMouseLeave}
            style={{ pointerEvents: 'auto', position: 'absolute', top: '78px', left: '50%', transform: 'translateX(-50%)', width: 'min(1100px, calc(100vw - 48px))', background: isDark ? 'rgba(18,25,20,0.75)' : 'rgba(255,255,255,0.75)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.8)', borderRadius: '24px', padding: '24px', boxShadow: isDark ? '0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 30px 70px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#10b981' }}>Conditions & Use Cases We Support</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {[
                { icon: <Clock size={20} color="#ef4444" />, title: 'Paycheck to Paycheck', sub: 'Create a 15-day salary cushion', slug: 'paycheck-to-paycheck' },
                { icon: <Brain size={20} color="#f59e0b" />, title: 'Impulse Buying', sub: '24-hour wish-list cooling timer', slug: 'impulse-spending' },
                { icon: <Shield size={20} color="#8b5cf6" />, title: 'Credit Card Debt', sub: 'Snowball & avalanche payoff plans', slug: 'credit-debt' },
                { icon: <PiggyBank size={20} color="#10b981" />, title: 'No Emergency Savings', sub: '3 to 6-month safety net builder', slug: 'no-emergency-fund' },
                { icon: <RefreshCw size={20} color="#3b82f6" />, title: 'Irregular / Freelance', sub: 'Smooth volatile monthly income', slug: 'freelancer-money' },
                { icon: <Search size={20} color="#ec4899" />, title: 'Hidden Subscriptions', sub: 'Detect & cancel unused fees', slug: 'hidden-subscriptions' },
                { icon: <Users size={20} color="#14b8a6" />, title: 'Couple / Shared', sub: 'Transparent joint household budgets', slug: 'couple-finances' },
                { icon: <Sparkles size={20} color="#eab308" />, title: 'Students & Young Pros', sub: 'Early wealth building & SIP automation', slug: 'students-pros' }
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => navigateToPage(item.slug)}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', padding: '12px', borderRadius: '16px', transition: 'all 0.2s', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)', border: `1px solid ${t.border}`, backdropFilter: 'blur(10px)' }} 
                  className="hover-lift"
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: t.text, marginBottom: '2px' }}>{item.title}</div>
                    <div style={{ fontSize: '11.5px', color: t.textMuted, lineHeight: 1.3 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${t.border}`, fontSize: '12.5px', color: t.textMuted }}>
              <span>Personalised tools tailored for every financial stage and situation</span>
              <button onClick={() => navigateToPage('paycheck-to-paycheck')} style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View all conditions <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeDropdown === 'inside app' && (
          <div 
            onMouseEnter={() => handleDropdownMouseEnter('inside app')}
            onMouseLeave={handleDropdownMouseLeave}
            style={{ pointerEvents: 'auto', position: 'absolute', top: '78px', left: '50%', transform: 'translateX(-50%)', width: 'min(900px, calc(100vw - 48px))', background: isDark ? 'rgba(18,25,20,0.75)' : 'rgba(255,255,255,0.75)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.8)', borderRadius: '24px', padding: '24px', boxShadow: isDark ? '0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 30px 70px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#10b981', marginBottom: '16px' }}>Interactive App Screens</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {insideTabs.map((tab, i) => (
                <button 
                  key={i} 
                  onClick={() => selectFeatureTab(i)} 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 10px', borderRadius: '16px', background: activeInsideTab === i ? '#10b981' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), color: activeInsideTab === i ? '#ffffff' : t.text, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {tab.icon}
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Nav Menu Drawer */}
        {mobileMenuOpen && (
          <div style={{ pointerEvents: 'auto', width: 'min(1440px, calc(100vw - 1.5rem))', marginTop: '8px', background: isDark ? 'rgba(18,25,20,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px) saturate(190%)', WebkitBackdropFilter: 'blur(24px) saturate(190%)', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.8)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <button onClick={() => scrollTo('features')} style={{ textAlign: 'left', padding: '10px', background: 'transparent', border: 'none', color: t.text, fontSize: '15px', fontWeight: 700 }}>Features</button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button onClick={() => scrollTo('inside-app')} style={{ textAlign: 'left', padding: '10px', background: 'transparent', border: 'none', color: t.text, fontSize: '15px', fontWeight: 700 }}>Inside App Screens</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px' }}>
                {insideTabs.map((tab, i) => (
                  <button 
                    key={i} 
                    onClick={() => selectFeatureTab(i)} 
                    style={{ textAlign: 'left', padding: '8px 12px', background: activeInsideTab === i ? 'rgba(16,185,129,0.15)' : 'transparent', border: 'none', borderRadius: '10px', color: activeInsideTab === i ? '#10b981' : t.textSub, fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => startFreshQuiz()} style={{ textAlign: 'left', padding: '10px', background: 'transparent', border: 'none', color: t.text, fontSize: '15px', fontWeight: 700 }}>Financial Assessment Quiz</button>
            <button onClick={() => scrollTo('toolkit')} style={{ textAlign: 'left', padding: '10px', background: 'transparent', border: 'none', color: t.text, fontSize: '15px', fontWeight: 700 }}>Toolkit</button>
            <button onClick={() => scrollTo('community')} style={{ textAlign: 'left', padding: '10px', background: 'transparent', border: 'none', color: t.text, fontSize: '15px', fontWeight: 700 }}>Member Stories</button>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleDownloadApk} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', color: t.text, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none' }}>
                <Download size={16} color="#10b981" /> Download APK
              </button>
              <button onClick={onOpenWebApp} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#10b981', color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none' }}>
                <Wallet size={16} /> Open Web App
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════ DEDICATED FEATURE SUBPAGE VIEW ═══════════════ */}
      
      {/* ═══════════════ STANDALONE DEDICATED QUIZ PAGE VIEW ═══════════════ */}
      {activePage === 'quiz' ? (
        <main style={{ paddingTop: '108px', paddingBottom: '80px', width: '100%', maxWidth: '1280px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
          {/* Breadcrumb & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigateToPage('home')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', border: `1px solid ${t.border}`, borderRadius: '100px', padding: '8px 18px', fontSize: '13.5px', fontWeight: 700, color: t.text, cursor: 'pointer', transition: 'all 0.2s' }}
              className="hover-lift"
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: t.textMuted, fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigateToPage('home')}>Home</span>
              <span>/</span>
              <span>Financial Assessment</span>
              <span>/</span>
              <span style={{ color: '#10b981', fontWeight: 800 }}>Free Quiz</span>
            </div>
          </div>

          {/* Quiz Page Hero Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: 900, padding: '6px 16px', borderRadius: '100px', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'inline-block', marginBottom: '16px' }}>
              FREE 60-SECOND FINANCIAL DIAGNOSTIC
            </span>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: t.text, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
              Evaluate Your Financial Health Score
            </h1>
            <p style={{ color: t.textSub, fontSize: '18px', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
              Answer 10 quick diagnostic questions to discover your financial stress score, impulse risks, and personalized action roadmap.
            </p>
          </div>

          {/* Standalone Quiz Card Focus */}
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            {!quizStarted && !quizSubmitted && (
              <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '2.5rem', padding: '48px 36px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <HelpCircle size={40} />
                </div>
                <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: t.text }}>Ready to check your financial score?</h3>
                <p style={{ color: t.textSub, fontSize: '16.5px', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 36px' }}>
                  10 short questions. Receive your instant Score Ring, key financial insights, and personalized step-by-step action plan.
                </p>
                <button onClick={startFreshQuiz} style={{ background: '#10b981', color: '#ffffff', padding: '18px 40px', borderRadius: '100px', fontSize: '17px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 24px rgba(16,185,129,0.35)', transition: 'all 0.2s' }} className="hover-lift">
                  Start Free 10-Question Quiz <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                </button>
              </div>
            )}

            {quizStarted && !quizSubmitted && (
              <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '2.5rem', padding: '44px 36px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Question {currentQuestionIndex + 1} of {activeQuizQuestions.length}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: t.textMuted }}>
                    {Math.round(((currentQuestionIndex + 1) / activeQuizQuestions.length) * 100)}% Completed
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: '100px', overflow: 'hidden', marginBottom: '32px' }}>
                  <div style={{ width: `${((currentQuestionIndex + 1) / activeQuizQuestions.length) * 100}%`, height: '100%', background: '#10b981', borderRadius: '100px', transition: 'width 0.4s' }}></div>
                </div>

                <h3 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.35, marginBottom: '28px', color: t.text }}>
                  {activeQuizQuestions[currentQuestionIndex]?.question}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activeQuizQuestions[currentQuestionIndex]?.options.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSelectQuizOption(opt.points)}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderRadius: '18px', textAlign: 'left', border: `1px solid ${t.border}`, background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', color: t.text, cursor: 'pointer', transition: 'all 0.2s'
                      }} 
                      className="hover-lift"
                    >
                      <span style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.4 }}>{opt.text}</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', color: t.textMuted, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {opt.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizSubmitted && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', animation: 'heroUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
                <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '2.5rem', padding: '48px 32px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', position: 'relative' }}>
                  <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="90" cy="90" r="76" stroke={isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"} strokeWidth="14" fill="none" />
                      <circle 
                        cx="90" 
                        cy="90" 
                        r="76" 
                        stroke={scoreInfo.gaugeColor} 
                        strokeWidth="14" 
                        fill="none" 
                        strokeDasharray="477.5"
                        strokeDashoffset={477.5 - (477.5 * scorePercentage) / 100}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1 }}>{scorePercentage}%</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: t.textMuted, letterSpacing: '0.1em', marginTop: '4px' }}>SCORE</span>
                    </div>
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '100px', background: scoreInfo.badgeBg, color: scoreInfo.badgeColor, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                    <Award size={16} />
                    {scoreInfo.badge}
                  </div>

                  <p style={{ color: t.textSub, fontSize: '16px', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 24px' }}>
                    {scoreInfo.description}
                  </p>

                  <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={onOpenWebApp} style={{ background: '#10b981', color: '#ffffff', padding: '14px 28px', borderRadius: '100px', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 24px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }} className="hover-lift">
                      <Wallet size={18} /> Launch Web App Roadmap
                    </button>
                    <button onClick={resetQuiz} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: t.text, padding: '14px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={14} /> Retake Assessment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      ) : activePage !== 'home' && FEATURE_PAGES_DATA[activePage] ? (
        <main style={{ paddingTop: '108px', paddingBottom: '80px', width: '100%', maxWidth: '1280px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
          {/* Breadcrumb & Back Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigateToPage('home')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', border: `1px solid ${t.border}`, borderRadius: '100px', padding: '8px 18px', fontSize: '13.5px', fontWeight: 700, color: t.text, cursor: 'pointer', transition: 'all 0.2s' }}
              className="hover-lift"
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: t.textMuted, fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigateToPage('home')}>Home</span>
              <span>/</span>
              <span>{FEATURE_PAGES_DATA[activePage].categoryLabel}</span>
              <span>/</span>
              <span style={{ color: '#10b981', fontWeight: 800 }}>{FEATURE_PAGES_DATA[activePage].badge}</span>
            </div>
          </div>

          {/* Feature Hero Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 440px)', gap: '48px', alignItems: 'center', marginBottom: '64px' }} className="mobile-stack">
            {/* Left Column: Title & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: 900, padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  • {FEATURE_PAGES_DATA[activePage].indexNumber} {FEATURE_PAGES_DATA[activePage].categoryLabel}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted }}>{FEATURE_PAGES_DATA[activePage].badge}</span>
              </div>

              <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: t.text, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>
                {FEATURE_PAGES_DATA[activePage].title}
              </h1>

              <p style={{ fontSize: '18px', fontWeight: 600, color: '#10b981', margin: 0 }}>
                {FEATURE_PAGES_DATA[activePage].subtitle}
              </p>

              <p style={{ fontSize: '16px', color: t.textSub, lineHeight: 1.7, margin: 0 }}>
                {FEATURE_PAGES_DATA[activePage].description}
              </p>

              {/* Feature Highlights Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', margin: '8px 0 16px' }}>
                {FEATURE_PAGES_DATA[activePage].highlights.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 700, color: t.text }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button 
                  onClick={onOpenWebApp}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#10b981', color: '#ffffff', padding: '14px 28px', borderRadius: '100px', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 24px rgba(16,185,129,0.35)', transition: 'all 0.2s' }}
                  className="hover-lift"
                >
                  <Wallet size={18} />
                  <span>Try {FEATURE_PAGES_DATA[activePage].badge} Free</span>
                  <ArrowRight size={16} />
                </button>

                {deviceOS === 'ios' ? (
                  <button 
                    onClick={() => setShowIosGuideModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: t.text, padding: '14px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'all 0.2s' }}
                    className="hover-lift"
                  >
                    <Smartphone size={16} color="#10b981" />
                    <span>Add to iPhone (Safari)</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleDownloadApk}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: t.text, padding: '14px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'all 0.2s' }}
                    className="hover-lift"
                  >
                    <Download size={16} color="#10b981" />
                    <span>Download Android APK</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Phone Mockup with Bottom Overflow & Floating Badges */}
            <div className="desktop-only" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '440px', padding: '20px 0' }}>
              {/* Subtle Ambient Glow Behind Phone */}
              <div style={{ position: 'absolute', width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }}></div>

              {/* Floating Pill Top Left */}
              <div className="floating-pill-reverse" style={{ position: 'absolute', top: '0px', left: '-15px', zIndex: 38, display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '100px', background: isDark ? '#1e2922' : '#ffffff', border: `1px solid ${t.border}`, boxShadow: '0 12px 30px rgba(0,0,0,0.3)', padding: '8px 14px', color: t.text }}>
                <Sparkles size={14} color="#10b981" />
                <span style={{ fontSize: '12px', fontWeight: 800 }}>Live Interactive Preview</span>
              </div>

              {/* Floating Pill Bottom Right */}
              <div className="badge-floating" style={{ position: 'absolute', bottom: '10px', right: '-15px', zIndex: 38, display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '100px', background: '#dcfce7', boxShadow: '0 12px 30px rgba(0,0,0,0.22)', border: '1px solid #86efac', padding: '8px 14px' }}>
                <Shield size={14} color="#166534" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>100% Private & Encrypted</span>
              </div>

              {/* Ultra-Sleek iPhone 16 Pro Mockup Frame */}
              <div style={{ 
                position: 'relative', 
                width: '260px', 
                height: '470px', 
                borderRadius: '40px', 
                background: isDark ? '#0f1712' : '#ffffff', 
                border: `8px solid ${isDark ? '#27342b' : '#1e293b'}`, 
                boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)', 
                padding: '16px 12px 12px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Dynamic Island Notch */}
                <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '18px', background: '#000000', borderRadius: '100px', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }}></div>
                </div>
                <div style={{ marginTop: '10px', height: 'calc(100% - 10px)' }}>
                  {renderMockupContent(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Key Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', border: `1px solid ${t.border}`, borderRadius: '24px', padding: '32px', marginBottom: '64px' }} className="mobile-stack">
            {FEATURE_PAGES_DATA[activePage].stats.map((st, sIdx) => (
              <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#10b981', letterSpacing: '-0.02em' }}>{st.value}</span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: t.textMuted }}>{st.label}</span>
              </div>
            ))}
          </div>

          {/* Feature Benefits Grid */}
          <div style={{ marginBottom: '64px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: t.text, marginBottom: '24px', textAlign: 'center' }}>Why You'll Love This Feature</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }} className="mobile-stack">
              {FEATURE_PAGES_DATA[activePage].benefits.map((b, bIdx) => (
                <div key={bIdx} style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="hover-lift">
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <Zap size={24} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: t.text, margin: 0 }}>{b.title}</h3>
                  <p style={{ fontSize: '14px', color: t.textSub, lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Step How It Works Timeline */}
          <div style={{ marginBottom: '64px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: t.text, marginBottom: '24px', textAlign: 'center' }}>How It Works in 3 Simple Steps</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }} className="mobile-stack">
              {FEATURE_PAGES_DATA[activePage].howItWorks.map((hw, hIdx) => (
                <div key={hIdx} style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', border: `1px solid ${t.border}`, borderRadius: '24px', padding: '28px', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '36px', fontWeight: 900, color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>{hw.step}</span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>STEP {hw.step}</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: t.text, margin: '0 0 10px' }}>{hw.title}</h3>
                  <p style={{ fontSize: '14px', color: t.textSub, lineHeight: 1.6, margin: 0 }}>{hw.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial Card */}
          <div style={{ background: isDark ? 'linear-gradient(135deg, #16241b 0%, #161d18 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', border: `1px solid ${t.border}`, borderRadius: '32px', padding: '40px', marginBottom: '64px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', color: '#facc15' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="#facc15" />)}
            </div>
            <p style={{ fontSize: '20px', fontWeight: 700, color: t.text, maxWidth: '780px', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
              "{FEATURE_PAGES_DATA[activePage].testimonial.quote}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={FEATURE_PAGES_DATA[activePage].testimonial.avatar} alt={FEATURE_PAGES_DATA[activePage].testimonial.author} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: t.text }}>{FEATURE_PAGES_DATA[activePage].testimonial.author}</div>
                <div style={{ fontSize: '12.5px', color: t.textMuted }}>{FEATURE_PAGES_DATA[activePage].testimonial.role}</div>
              </div>
            </div>
          </div>

          {/* Explore Other Features Grid */}
          <div style={{ marginBottom: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: t.text, margin: 0 }}>Explore More Features</h2>
              <button onClick={() => navigateToPage('ai-coach')} style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View all <ChevronRight size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="mobile-stack">
              {Object.values(FEATURE_PAGES_DATA).filter(p => p.slug !== activePage).slice(0, 4).map((pItem, pIdx) => (
                <div key={pIdx} onClick={() => navigateToPage(pItem.slug)} style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '20px', padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }} className="hover-lift">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', letterSpacing: '0.08em' }}>{pItem.badge}</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: t.text }}>{pItem.title}</div>
                  <div style={{ fontSize: '12.5px', color: t.textMuted, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto', paddingTop: '8px' }}>
                    <span>Learn more</span> <ArrowRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Download CTA Banner */}
          <div style={{ background: '#10b981', borderRadius: '32px', padding: '48px 32px', textAlign: 'center', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', boxShadow: '0 20px 40px rgba(16,185,129,0.3)' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, margin: 0 }}>Start your financial transformation today</h2>
            <p style={{ fontSize: '16px', opacity: 0.9, maxWidth: '600px', margin: 0, lineHeight: 1.6 }}>
              Join 50,000+ individuals using ZenBudget's zero-knowledge private budget tools to master their money.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={onOpenWebApp} style={{ background: '#ffffff', color: '#10b981', padding: '14px 28px', borderRadius: '100px', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }} className="hover-lift">
                Open Web App Now
              </button>
              {deviceOS === 'ios' ? (
                <button onClick={() => setShowIosGuideModal(true)} style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '14px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer' }} className="hover-lift">
                  Add to iPhone (Safari PWA)
                </button>
              ) : (
                <button onClick={handleDownloadApk} style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '14px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer' }} className="hover-lift">
                  Download Android APK
                </button>
              )}
            </div>
          </div>
        </main>
      ) : (
        <main>


      {/* ═══════════════ HERO SECTION (INNERHEAL STYLE ANIMATED BACKGROUND) ═══════════════ */}
      <div style={{ paddingTop: '90px', margin: '0 auto', width: 'min(1440px, calc(100vw - 1.5rem))' }}>
        <section style={{ borderRadius: '2.5rem', overflow: 'hidden', border: `1px solid ${t.border}`, position: 'relative', paddingTop: '64px', paddingBottom: '0px', background: isDark ? '#111812' : '#f0fdf4' }}>
          
          {/* Glowing Animated Background Canvas (InnerHeal Mesh & Aura) */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            
            {/* Primary Glowing Organic Light Beam behind phone mockups */}
            <div className="innerheal-rotate" style={{ position: 'absolute', top: '-25%', right: '-10%', width: '75%', height: '120%', background: isDark ? 'radial-gradient(circle, rgba(163,230,53,0.22) 0%, rgba(16,185,129,0.28) 40%, rgba(5,150,105,0.05) 70%, transparent 85%)' : 'radial-gradient(circle, rgba(134,239,172,0.55) 0%, rgba(74,222,128,0.35) 45%, transparent 75%)', filter: 'blur(80px)', opacity: 0.9 }}></div>
            
            {/* Secondary Ambient Left Blob */}
            <div className="innerheal-glow" style={{ position: 'absolute', top: '10%', left: '-15%', width: '60%', height: '90%', background: isDark ? 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(59,130,246,0.12) 50%, transparent 80%)' : 'radial-gradient(circle, rgba(167,243,208,0.6) 0%, transparent 75%)', filter: 'blur(75px)' }}></div>
            
            {/* Third Deep Accent Aura */}
            <div style={{ position: 'absolute', bottom: '-20%', left: '30%', width: '50%', height: '60%', background: isDark ? 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(192,132,252,0.2) 0%, transparent 70%)', filter: 'blur(90px)', animation: 'mesh1 18s ease-in-out infinite alternate' }}></div>

            {/* Floating Sparkle Particles */}
            <div style={{ position: 'absolute', inset: 0 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: `${15 + i * 11}%`,
                  left: `${10 + i * 11}%`,
                  width: `${10 + (i % 3) * 6}px`,
                  height: `${10 + (i % 3) * 6}px`,
                  borderRadius: '50%',
                  background: i % 2 === 0 ? 'rgba(163, 230, 53, 0.6)' : 'rgba(16, 185, 129, 0.5)',
                  animation: `floatParticle ${7 + i * 2}s infinite ease-in-out`,
                  animationDelay: `${i * 1.2}s`,
                  filter: 'blur(2px)'
                }}></div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 10, maxWidth: '1440px', margin: '0 auto', padding: '24px 40px' }} className="mobile-padding">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }} className="grid-hero">
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                
                {/* User Avatar Stack & Ratings */}
                <div className="hero-animate" style={{ display: 'flex', alignItems: 'center', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: `1px solid ${t.border}`, padding: '6px 16px', borderRadius: '100px', marginBottom: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', marginRight: '10px' }}>
                    {[
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop',
                      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop',
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop'
                    ].map((src, i) => (
                      <img key={i} src={src} alt="User avatar" style={{ width: '26px', height: '26px', borderRadius: '50%', border: `2px solid ${t.cardBg}`, marginLeft: i > 0 ? '-8px' : 0, zIndex: 3 - i, objectFit: 'cover' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={14} fill="#84cc16" color="#84cc16" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: t.text }}>Trusted by <span style={{ color: '#84cc16' }}>10,000+</span> active users</span>
                  </div>
                </div>

                {/* Sub-badge pill */}
                <div className="hero-animate" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7', border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#86efac'}`, padding: '6px 14px', borderRadius: '100px' }}>
                  <div style={{ width: '22px', height: '22px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={12} color="white" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: isDark ? '#a7f3d0' : '#166534' }}>AI FINANCIAL WELLNESS APP · WEB & ANDROID</span>
                </div>

                {/* Main Hero Title with Typing Animation */}
                <h1 className="hero-animate hero-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: '20px', color: t.text }}>
                  Master your money<br />through{' '}
                  <span style={{ color: '#84cc16', display: 'inline-flex', alignItems: 'center', fontWeight: 900 }}>
                    <span>{typedText}</span>
                    <span className="typewriter-cursor"></span>
                  </span>
                </h1>

                <p className="hero-animate" style={{ fontSize: 'clamp(16px, 2vw, 19px)', fontWeight: 500, lineHeight: 1.6, color: t.textSub, maxWidth: '520px', marginBottom: '32px' }}>
                  Track expenses effortlessly, journal with AI insights, and build healthy financial habits — all in one private, science-backed app.
                </p>

                <div className="hero-animate" style={{ display: 'flex', gap: '14px', marginBottom: '36px', flexWrap: 'wrap' }}>
                  {deviceOS === 'ios' && (
                    <button onClick={() => setShowIosGuideModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', color: '#111827', padding: '14px 28px', borderRadius: '100px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} className="glow-btn">
                      <Smartphone size={20} color="#10b981" />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.08em' }}>Safari PWA</span>
                        <span style={{ fontSize: '16px', fontWeight: 800 }}>Add to Home Screen</span>
                      </div>
                    </button>
                  )}

                  {deviceOS === 'android' && (
                    <button onClick={handleDownloadApk} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', color: '#111827', padding: '14px 28px', borderRadius: '100px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} className="glow-btn">
                      <Download size={20} color="#10b981" />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.08em' }}>Android Package</span>
                        <span style={{ fontSize: '16px', fontWeight: 800 }}>Download APK</span>
                      </div>
                    </button>
                  )}

                  {deviceOS === 'web' && (
                    <button onClick={onOpenWebApp} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', color: '#111827', padding: '14px 28px', borderRadius: '100px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} className="glow-btn">
                      <Wallet size={20} color="#10b981" />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.08em' }}>Instant Web App</span>
                        <span style={{ fontSize: '16px', fontWeight: 800 }}>Open Web App</span>
                      </div>
                    </button>
                  )}

                  {deviceOS !== 'web' && (
                    <button onClick={onOpenWebApp} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 185, 129, 0.12)', color: isDark ? '#ffffff' : '#10b981', padding: '14px 24px', borderRadius: '100px', fontSize: '15px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'all 0.2s' }} className="hover-lift">
                      <Wallet size={18} />
                      <span>Open Web App</span>
                    </button>
                  )}

                  {deviceOS === 'web' && (
                    <button onClick={handleDownloadApk} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 185, 129, 0.12)', color: isDark ? '#ffffff' : '#10b981', padding: '14px 24px', borderRadius: '100px', fontSize: '15px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'all 0.2s' }} className="hover-lift">
                      <Download size={18} color="#10b981" />
                      <span>Download APK</span>
                    </button>
                  )}

                  <button onClick={() => startFreshQuiz()} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 185, 129, 0.12)', color: isDark ? '#ffffff' : '#10b981', padding: '14px 24px', borderRadius: '100px', fontSize: '15px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'all 0.2s' }} className="hover-lift">
                    <HelpCircle size={18} color="#84cc16" />
                    <span>Take Free Quiz</span>
                  </button>
                </div>

                {/* Bottom Highlights Bar (InnerHeal Style stats) */}
                <div className="hero-animate" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700, color: t.textSub }}>
                    <Brain size={16} color="#84cc16" /> 20+ Auto Categories
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700, color: t.textSub }}>
                    <Shield size={16} color="#10b981" /> 100% Private
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700, color: t.textSub }}>
                    <Users size={16} color="#3b82f6" /> 10,000+ Users
                  </div>
                </div>

              </div>

              {/* Hero Right Mockup Graphics - InnerHeal Inspired Dual Phones Overflowing Card Edge */}
              <div className="hero-animate desktop-only" style={{ position: 'relative', width: '100%', height: '560px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
                
                {/* Floating Pill 1 (Top Center above phone 1): Feeling Financially Secure */}
                <div className="floating-pill-reverse" style={{ position: 'absolute', top: '15px', left: '10px', zIndex: 38, display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '100px', background: '#ffffff', boxShadow: '0 16px 40px rgba(0,0,0,0.22)', padding: '10px 18px', color: '#111827' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={16} color="#ec4899" fill="#ec4899" />
                  </div>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>Feeling financially calm</span>
                </div>

                {/* Floating Pill 2 (Top Right above phone 2): Savings Up 32% */}
                <div className="floating-pill" style={{ position: 'absolute', top: '75px', right: '-10px', zIndex: 38, display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '100px', background: '#ffffff', boxShadow: '0 16px 40px rgba(0,0,0,0.22)', padding: '10px 18px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={16} color="#7c3aed" />
                  </div>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#7c3aed' }}>Savings up 32%</span>
                </div>

                {/* Floating Pill 3 (Bottom Right attached to phone 2): Financial Journey */}
                <div className="badge-floating" style={{ position: 'absolute', bottom: '60px', right: '-5px', zIndex: 38, display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '100px', background: '#dcfce7', boxShadow: '0 16px 40px rgba(0,0,0,0.22)', border: '1px solid #86efac', padding: '10px 18px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#166534' }}>✨ Zen Wealth Journey</span>
                </div>

                {/* Main Foreground Mobile Mockup (iPhone Frame 1 - Popping Out Bottom Edge) */}
                <div style={{ width: '255px', height: '495px', overflow: 'hidden', borderRadius: '2.8rem', border: '8px solid #1c1c1e', boxShadow: '0 30px 70px rgba(0,0,0,0.45)', background: isDark ? '#121613' : '#f8fafc', position: 'relative', zIndex: 25, transform: 'rotate(-3deg) translateY(32px)', marginBottom: '-30px' }}>
                  {/* Dynamic Island Notch */}
                  <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 40, height: '18px', width: '65px', borderRadius: '100px', background: '#1c1c1e' }}></div>
                  
                  <div style={{ padding: '40px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 900 }}>ZB</div>
                        <span style={{ fontSize: '14px', fontWeight: 800 }}>ZenBudget</span>
                      </div>
                      <span style={{ fontSize: '10px', background: '#84cc16', color: '#111827', padding: '3px 8px', borderRadius: '100px', fontWeight: 900 }}>PRO</span>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '18px', padding: '16px', color: '#fff', boxShadow: '0 8px 20px rgba(16,185,129,0.25)' }}>
                      <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: 700, letterSpacing: '0.05em' }}>NET WORTH SCORE</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, margin: '2px 0 8px' }}>₹1,45,800</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>
                        <span>Monthly Target</span>
                        <span>₹32,000 Left</span>
                      </div>
                    </div>

                    <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                        <span>Monthly Budget Used</span>
                        <span style={{ color: '#10b981' }}>64% Healthy</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ width: '64%', height: '100%', background: '#10b981', borderRadius: '100px' }}></div>
                      </div>
                    </div>

                    <div style={{ background: isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff', border: `1px solid ${isDark ? 'rgba(139,92,246,0.3)' : '#ddd6fe'}`, borderRadius: '14px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Brain size={18} color="#8b5cf6" />
                      <div style={{ fontSize: '11px', color: isDark ? '#ddd6fe' : '#5b21b6', fontWeight: 700, lineHeight: 1.3 }}>
                        AI Coach: Saved ₹1,200 on dining this week!
                      </div>
                    </div>

                  </div>
                </div>

                {/* Secondary Overlapping Background Mobile Mockup (iPhone Frame 2 - Popping Out Bottom Edge) */}
                <div style={{ width: '235px', height: '460px', overflow: 'hidden', borderRadius: '2.6rem', border: '8px solid #1c1c1e', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', background: isDark ? '#18201a' : '#f0fdf4', position: 'absolute', right: '15px', zIndex: 15, transform: 'rotate(6deg) scale(0.96) translateY(32px)', opacity: 0.95, marginBottom: '-30px' }}>
                  {/* Dynamic Island Notch */}
                  <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 40, height: '16px', width: '60px', borderRadius: '100px', background: '#1c1c1e' }}></div>
                  
                  <div style={{ padding: '38px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: t.text, marginBottom: '2px' }}>Together Savings Feed</div>
                    {[
                      { name: 'Rohan V.', goal: '52-Wk Challenge', streak: '🔥 14d', amount: '₹10,000' },
                      { name: 'Priya M.', goal: 'No Impulse Streak', streak: '🔥 21d', amount: '₹7,500' },
                      { name: 'Ananya S.', goal: 'Emergency Fund', streak: '🔥 8d', amount: '₹15,000' }
                    ].map((card, i) => (
                      <div key={i} style={{ background: isDark ? '#121613' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800 }}>{card.name}</div>
                          <div style={{ fontSize: '9.5px', color: t.textMuted }}>{card.goal}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b' }}>{card.streak}</div>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: '#10b981' }}>{card.amount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>
      </div>





      {/* ═══════════════ BENTO GRID FEATURES ═══════════════ */}
      <section id="features" style={{ padding: '40px 24px 80px', maxWidth: '1440px', margin: '0 auto', overflow: 'hidden' }}>
        <div className="scroll-fade-up" style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D58B6D', marginBottom: '16px', display: 'block' }}>Platform Features</span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 3.4rem)', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.02em' }}>Everything you need to master your money</h2>
          <p style={{ color: t.textSub, fontSize: '18px', marginTop: '16px', maxWidth: '580px', margin: '16px auto 0' }}>Your AI financial coach, expense tracker, zero-based budget planner, and insights hub — all in one private space.</p>
        </div>

        <div className="scroll-fade-up bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          
          <div onClick={() => selectFeatureTab(0)} className="hover-lift bento-span2" style={{ gridColumn: 'span 2', background: isDark ? 'linear-gradient(135deg, #162419, #1c2e20)' : 'linear-gradient(135deg, #e8f5e9, #f1f8e9)', border: `1px solid ${isDark ? '#2a4a2e' : '#c8e6c9'}`, borderRadius: '2.5rem', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#c8e6c9'}`, width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', color: '#10b981' }}>
              <MessageCircleHeart size={26} />
            </div>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>AI-Powered Financial Coach</h3>
              <p style={{ color: t.textSub, lineHeight: 1.6, fontSize: '16px', maxWidth: '520px' }}>Feeling overwhelmed by expenses? Chat with our compassionate AI 24/7 to reflect, plan budgets, and curb impulse purchases before they happen.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: 800, marginTop: '16px' }}>View Interactive Demo <ArrowRight size={14} /></div>
            </div>
          </div>

          <div onClick={() => selectFeatureTab(2)} className="hover-lift" style={{ background: isDark ? 'linear-gradient(135deg, #243028, #1a2420)' : 'linear-gradient(135deg, #dcfce7, #f0fdf4)', borderRadius: '2.5rem', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px', cursor: 'pointer', border: `1px solid ${t.border}` }}>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', color: '#16a34a', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#bbf7d0'}` }}>
              <ChartLine size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Expense Analytics</h3>
              <p style={{ color: t.textSub, lineHeight: 1.6, fontSize: '16px' }}>Track spending trends over time. Recognize waste, cancel unwanted subscriptions, and gain clarity.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: 800, marginTop: '16px' }}>View Analytics Screen <ArrowRight size={14} /></div>
            </div>
          </div>

          <div onClick={() => selectFeatureTab(3)} className="hover-lift" style={{ background: isDark ? 'linear-gradient(135deg, #2a1820, #2e1c26)' : 'linear-gradient(135deg, #fce4ec, #fdf2f5)', border: `1px solid ${isDark ? '#4a2a36' : '#f8bbd0'}`, borderRadius: '2.5rem', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px', cursor: 'pointer' }}>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#f8bbd0'}`, width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', color: '#D58B6D' }}>
              <BookHeart size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Smart Budget Plans</h3>
              <p style={{ color: t.textSub, lineHeight: 1.6, fontSize: '16px' }}>Build self-awareness with zero-based budget prompts designed for lasting financial peace of mind.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D58B6D', fontSize: '14px', fontWeight: 800, marginTop: '16px' }}>View Envelope Planner <ArrowRight size={14} /></div>
            </div>
          </div>

          <div onClick={() => selectFeatureTab(4)} className="hover-lift bento-span2" style={{ gridColumn: 'span 2', background: isDark ? 'linear-gradient(135deg, #1e1a2e, #251f38)' : 'linear-gradient(135deg, #ede7f6, #f3effe)', border: `1px solid ${isDark ? '#3a3060' : '#d1c4e9'}`, borderRadius: '2.5rem', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#d1c4e9'}`, width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', color: '#8680C3' }}>
              <Target size={26} />
            </div>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Goal-Oriented Wealth Tracking</h3>
              <p style={{ color: t.textSub, lineHeight: 1.6, fontSize: '16px', maxWidth: '520px' }}>Visualize emergency funds, vacations, or debt payoff milestones with automated savings rules.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8680C3', fontSize: '14px', fontWeight: 800, marginTop: '16px' }}>View Savings Goals Demo <ArrowRight size={14} /></div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════ INSIDE THE APP (INTERACTIVE IMAGE / SCREEN SHOWCASE) ═══════════════ */}
      <section id="inside-app" style={{ padding: '40px 24px 80px', maxWidth: '1440px', margin: '0 auto', overflow: 'hidden' }}>
        <div className="scroll-fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D58B6D', marginBottom: '16px', display: 'block' }}>Interactive Feature Showcase</span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 3.4rem)', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.02em' }}>See ZenBudget in Action</h2>
          <p style={{ color: t.textSub, fontSize: '18px', marginTop: '16px', maxWidth: '580px', margin: '16px auto 0' }}>Click any tab below to inspect the live interface mockups and feature details.</p>
        </div>

        <div className="scroll-fade-up inside-tabs-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '48px', flexWrap: 'wrap' }}>
          {insideTabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveInsideTab(i)} className="inside-tab-btn" style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 22px', borderRadius: '100px', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer', border: i === activeInsideTab ? 'none' : `1px solid ${t.border}`, transition: 'all 0.3s',
              background: i === activeInsideTab ? '#10b981' : (isDark ? '#161d18' : '#ffffff'),
              color: i === activeInsideTab ? '#ffffff' : t.textSub,
              transform: i === activeInsideTab ? 'scale(1.04)' : 'scale(1)',
              boxShadow: i === activeInsideTab ? '0 10px 24px rgba(16,185,129,0.3)' : 'none'
            }}>{tab.icon} {tab.label}</button>
          ))}
        </div>

        <div className="inside-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '64px', animation: 'heroUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }} key={activeInsideTab}>
          
          <div style={{ flex: 1, width: '100%' }}>
            <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '2.5rem', padding: '36px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '480px' }}>
              
              {insideTabs[activeInsideTab].mockupType === 'chat' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#f9fafb', border: `1px solid ${t.border}`, borderRadius: '2rem', overflow: 'hidden', boxShadow: '0 16px 36px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '60px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontWeight: 800, fontSize: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Brain size={22} />
                      <span>ZenBudget AI Coach</span>
                    </div>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '100px' }}>Online</span>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', padding: '14px 18px', borderRadius: '0 18px 18px 18px', fontSize: '14px', lineHeight: 1.5, alignSelf: 'flex-start', maxWidth: '85%', border: `1px solid ${t.border}` }}>
                      I've spent ₹4,200 on dining out this week. Am I exceeding my budget limit?
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '14px 18px', borderRadius: '18px 0 18px 18px', fontSize: '14px', lineHeight: 1.5, alignSelf: 'flex-end', maxWidth: '85%', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                      Yes, dining out is 30% higher than your target. Let's redirect ₹1,500 into your Emergency Fund today!
                    </div>
                    <div style={{ background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5', border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0'}`, borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <Sparkles size={18} color="#10b981" />
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: isDark ? '#a7f3d0' : '#047857' }}>AI Insight: Pausing food delivery saved you ₹3,400 this month.</span>
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'quick-capture' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  {/* Accounts in wallet preview */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>📁 My Accounts in Wallet</span>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>See All (0) &gt;</span>
                    </div>
                    <div style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px', textAlign: 'center', color: '#10b981', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>Add account</span> <span>+</span>
                    </div>
                  </div>

                  {/* Quick capture preview */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 900 }}>Quick capture</span>
                      <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '10px' }}>✨ AI AUTO-DETECT</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Add expense, income, or transfer in natural language</div>

                    <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '14px', alignItems: 'center' }}>
                      <div style={{ flex: 1, background: '#1e293b', color: '#fff', textAlign: 'center', padding: '6px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>Expense</div>
                      <div style={{ flex: 1, color: '#94a3b8', textAlign: 'center', padding: '6px', fontSize: '11px', fontWeight: 700 }}>Income</div>
                      <div style={{ flex: 1, color: '#94a3b8', textAlign: 'center', padding: '6px', fontSize: '11px', fontWeight: 700 }}>Transfer</div>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>🎤</div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 14px', fontSize: '12px', color: '#94a3b8' }}>
                      Paid 220 for petrol in cash
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'stories' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8' }}>Weekly & Monthly Story Highlights</div>
                  
                  {/* Side-by-side gradient story cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '18px', padding: '18px 14px', textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(99,102,241,0.35)' }}>
                      <span style={{ fontSize: '24px' }}>🎁</span>
                      <span>Weekly Money Wrapped</span>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)', borderRadius: '18px', padding: '18px 14px', textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(236,72,153,0.35)' }}>
                      <span style={{ fontSize: '24px' }}>🎵</span>
                      <span>Monthly Story (Spotify Style)</span>
                    </div>
                  </div>

                  {/* Story Card Result */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>ZEN MONEY SCORE</span>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>94/100</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
                      "You spent ₹5,430 this week and saved ₹99,633 — amazing discipline! 🌟"
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'companion' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🐷</span>
                      <span style={{ fontSize: '15px', fontWeight: 800 }}>Zen Companion (Lvl 1)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.2)' }}>⚡ 180 pts</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '8px' }}>🛍️ Shop</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fda4af', border: '2px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                      🐷
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800 }}>Zen Piggy</span>
                        <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '2px 6px', borderRadius: '6px' }}>Regretful 😡</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                        *Zen Piggy feels low and regretful. Equip items in shop...* <span style={{ color: '#10b981', fontWeight: 700 }}>more</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                      <span style={{ color: '#10b981' }}>COMPANION HAPPINESS</span>
                      <span style={{ color: '#f59e0b' }}>15% (Getting Happy 😐)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', borderRadius: '100px', background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ width: '15%', height: '100%', borderRadius: '100px', background: 'linear-gradient(90deg, #ef4444, #f59e0b)' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'badges' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8' }}>Achievement Badges & Rewards</div>
                  
                  {/* Badge 1: 10 Invites */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ fontSize: '32px' }}>🎁</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800 }}>10 Invites</span>
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>LOCKED 🔒</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                        Invite 10 friends to earn 1 Month Free Premium!
                      </div>
                      <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, marginTop: '4px' }}>
                        0/10 Subscribed Friends Invited
                      </div>
                    </div>
                  </div>

                  {/* Badge 2: 90d Pro Saver */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ fontSize: '32px' }}>👑</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800 }}>90d Pro Saver</span>
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>LOCKED 🔒</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                        Maintain a 90-day streak to claim 1 Month Free Premium!
                      </div>
                      <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, marginTop: '4px' }}>
                        0/90 Days Daily Streak
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'monthly-letter' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px' }}>✉️</div>
                  <div style={{ fontSize: '18px', fontWeight: 900 }}>Monthly Report locked 🔒</div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, textAlign: 'left' }}>
                    Your first <strong>Monthly Letter from Zen</strong> will unlock after <strong>30 days</strong> of tracking.<br/><br/>
                    You have tracked for <strong>6 days</strong> so far. Keep logging daily to compile your personal money story!<br/><br/>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>24 more days until unlock.</span>
                  </div>

                  <div style={{ background: '#10b981', color: '#fff', padding: '12px', borderRadius: '14px', fontWeight: 800, fontSize: '14px' }}>
                    Close Letter
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'category-limits' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900 }}>Category Budgets</div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 800, letterSpacing: '0.05em' }}>🎯 TOTAL ALLOCATED BUDGET</div>
                      <div style={{ fontSize: '22px', fontWeight: 900 }}>₹0</div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '100px' }}>
                      Spent this month: ₹5,430
                    </div>
                  </div>

                  {[
                    { name: 'Food & Dining', icon: '🍽️', spent: '₹448' },
                    { name: 'Shopping', icon: '🛍️', spent: '₹0' },
                    { name: 'Entertainment', icon: '🎬', spent: '₹0' },
                    { name: 'Bills & Utilities', icon: '💳', spent: '₹0' }
                  ].map((cat, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800 }}>{cat.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Spent: {cat.spent}</div>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
                        + Set Limit
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'mood-tracker' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', letterSpacing: '0.08em' }}>EMOTIONAL SPENDING TRACKER</div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>How did spending make you feel today? Select mood to log:</div>

                  <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '16px', fontSize: '22px' }}>
                    <span>😀</span> <span>😭</span> <span>😡</span> <span>😍</span> <span>😌</span> <span>😔</span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                      <span>Mood Trend</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Last 7 Days</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                      <span>Wed</span> <span>Thu</span> <span>Fri</span> <span>Sat</span> <span>Sun</span> <span>Mon</span> <span>Tue</span>
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'family-sync' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900 }}>Couple & Family Sync</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Partners, families & roommates real-time spending & transfer sync.</div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>YOUR UNIQUE COUPLE / FAMILY SYNC CODE</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '12px', fontFamily: 'monospace', fontWeight: 800, color: '#a855f7', fontSize: '15px', letterSpacing: '0.08em' }}>
                        CP-S02G-2ARG
                      </div>
                      <div style={{ background: '#10b981', color: '#fff', padding: '10px 14px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Copy Code
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'loans-tracker' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900 }}>Loans & Borrowings</div>
                    <div style={{ background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>+ Add Loan</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800 }}>LOANS TAKEN</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#ef4444' }}>₹5,450</div>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>LOANS GIVEN</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>₹0</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800 }}>{localStorage.getItem('zb_user_name') ? `Contact (${localStorage.getItem('zb_user_name')})` : 'Aditya Verma'}</span>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444' }}>₹5,450</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Due Date: 2026-11-27 • (+3% /mo)</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#fff', textAlign: 'center', padding: '8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>Record Cash</div>
                      <div style={{ flex: 1, background: '#10b981', color: '#fff', textAlign: 'center', padding: '8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>⚡ Pay via PhonePe</div>
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'wealth-compound' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900 }}>Wealth Compound Simulator</div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 800, letterSpacing: '0.08em' }}>PROJECTED TOTAL WEALTH (10 YEARS)</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>₹2,18,87,038</div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                      <span>Deposited: ₹1,13,04,360</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>Gain: +₹1,05,82,678</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                      <span style={{ color: '#94a3b8' }}>MONTHLY INVESTMENT</span>
                      <span style={{ color: '#10b981' }}>₹94,203/mo</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#10b981', borderRadius: '100px' }}></div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'analytics' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', letterSpacing: '0.08em' }}>MONTHLY EXPENSE BREAKDOWN</div>
                      <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '2px' }}>₹24,850 <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>+12% vs last mo</span></div>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', borderRadius: '12px', color: '#10b981', fontSize: '11px', fontWeight: 800 }}>
                      📊 Deep AI Insights
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', height: '10px', borderRadius: '100px', overflow: 'hidden', gap: '2px' }}>
                      <div style={{ width: '45%', background: '#10b981', borderRadius: '100px 0 0 100px' }} title="Food & Dining 45%"></div>
                      <div style={{ width: '25%', background: '#3b82f6' }} title="Bills & Utilities 25%"></div>
                      <div style={{ width: '18%', background: '#8b5cf6' }} title="Shopping 18%"></div>
                      <div style={{ width: '12%', background: '#f59e0b', borderRadius: '0 100px 100px 0' }} title="Entertainment 12%"></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      <span style={{ color: '#10b981' }}>● Food (45%)</span>
                      <span style={{ color: '#3b82f6' }}>● Bills (25%)</span>
                      <span style={{ color: '#8b5cf6' }}>● Shopping (18%)</span>
                      <span style={{ color: '#f59e0b' }}>● Other (12%)</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>🚨</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fca5a5' }}>Recurring Fee Warning</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Streaming service renewed: ₹499/mo (Unused in 45 days)</div>
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'goals' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900 }}>🎯 Active Savings Goals</div>
                    <div style={{ background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>+ New Goal</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>🛡️</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800 }}>6-Month Emergency Fund</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Target: ₹1,50,000</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#10b981' }}>72%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: '72%', height: '100%', background: '#10b981', borderRadius: '100px' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                      <span>Saved: ₹1,08,000</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>2 months to goal 🚀</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>✈️</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800 }}>Tokyo Vacation 2027</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Target: ₹2,00,000</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#a855f7' }}>45%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: '45%', height: '100%', background: '#a855f7', borderRadius: '100px' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {insideTabs[activeInsideTab].mockupType === 'vault' && (
                <div style={{ width: '100%', maxWidth: '420px', background: isDark ? '#0d130f' : '#111827', color: '#f8fafc', border: `1px solid ${t.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.4)', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#10b981' }}>
                    <Lock size={32} />
                  </div>

                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900 }}>Encrypted Local Vault</div>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>🔒 Protected by Device FaceID & AES-256</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700 }}>
                      <Shield size={16} color="#10b981" />
                      <span>100% Client-Side Local Storage</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700 }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Zero Third-Party Cloud Tracking</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700 }}>
                      <Sparkles size={16} color="#10b981" />
                      <span>Instant Offline PWA & APK Persistence</span>
                    </div>
                  </div>

                  <div style={{ background: '#10b981', color: '#fff', padding: '14px', borderRadius: '100px', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>Unlock Vault with Fingerprint / FaceID</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }}>
              {insideTabs[activeInsideTab].contentIcon}
            </div>
            
            <h3 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.6rem)', lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '20px' }}>
              {insideTabs[activeInsideTab].title}
            </h3>

            <p style={{ fontSize: '18px', color: t.textSub, lineHeight: 1.6, marginBottom: '32px' }}>
              {insideTabs[activeInsideTab].description}
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
              {insideTabs[activeInsideTab].features.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '16px', fontWeight: 700 }}>
                  <div style={{ background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                    <CheckCircle2 size={18} color="#10b981" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button onClick={onOpenWebApp} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#10b981', color: '#fff', padding: '14px 28px', borderRadius: '100px', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', transition: 'all 0.2s' }} className="hover-lift">
              <span>Try {insideTabs[activeInsideTab].label} Free</span>
              <ArrowRight size={16} />
            </button>

          </div>

        </div>
      </section>

      {/* ═══════════════ YOUR TOOLKIT ACCORDION ═══════════════ */}
      <section id="toolkit" style={{ padding: '40px 24px 80px', maxWidth: '1440px', margin: '0 auto', overflow: 'hidden' }}>
        <div className="scroll-fade-up toolkit-grid" style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '56px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D58B6D', marginBottom: '16px', display: 'block' }}>Your Toolkit</span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 2.8rem)', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '28px' }}>Build a Wealthier Life with Proven Tools</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {toolkitItems.map((item, i) => (
                <div key={i} onClick={() => setActiveToolkit(i)} style={{
                  borderRadius: '2rem', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer',
                  background: i === activeToolkit ? '#10b981' : (isDark ? '#161d18' : '#ffffff'),
                  color: i === activeToolkit ? '#ffffff' : t.text,
                  border: i === activeToolkit ? '1px solid #10b981' : `1px solid ${t.border}`,
                  boxShadow: i === activeToolkit ? '0 16px 36px rgba(16,185,129,0.25)' : 'none',
                  transform: i === activeToolkit ? 'scale(1.02)' : 'scale(1)',
                }}>
                  <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', background: i === activeToolkit ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6'), color: i === activeToolkit ? '#ffffff' : t.textMuted }}>{item.badge}</span>
                      <h3 style={{ fontSize: '17px', fontWeight: 800 }}>{item.title}</h3>
                    </div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '12px', background: i === activeToolkit ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'), color: i === activeToolkit ? '#ffffff' : t.text }}>
                      {i === activeToolkit ? <ArrowUpRight size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  <div style={{ padding: i === activeToolkit ? '0 28px 28px' : '0 28px', maxHeight: i === activeToolkit ? '200px' : '0', overflow: 'hidden', opacity: i === activeToolkit ? 1 : 0, transition: 'all 0.4s ease-in-out', fontSize: '15px', lineHeight: 1.6, color: i === activeToolkit ? 'rgba(255,255,255,0.9)' : 'transparent' }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: '2.5rem', overflow: 'hidden', position: 'relative', background: '#111827', minHeight: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <img 
              src={toolkitItems[activeToolkit].image} 
              alt={toolkitItems[activeToolkit].title} 
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, transition: 'opacity 0.5s' }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2), transparent)' }}></div>
            
            <div style={{ position: 'absolute', bottom: '32px', left: '32px', right: '32px', zIndex: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '20px', padding: '24px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a7f3d0', marginBottom: '6px', display: 'block' }}>{toolkitItems[activeToolkit].badge}</span>
                <h4 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{toolkitItems[activeToolkit].title}</h4>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: 0 }}>{toolkitItems[activeToolkit].desc}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════ FINANCIAL HEALTH ASSESSMENT QUIZ & SCORECARD (10 QUESTIONS) ═══════════════ */}
      <section id="assessment-quiz" style={{ padding: '80px 24px', maxWidth: '1440px', margin: '0 auto', overflow: 'hidden' }}>
        <div className="scroll-fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#10b981', marginBottom: '16px', display: 'block' }}>Free Financial Assessment</span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 3.5rem)', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.02em' }}>Evaluate Your Financial Wellness</h2>
          <p style={{ color: t.textSub, fontSize: '18px', marginTop: '16px', maxWidth: '620px', margin: '16px auto 0' }}>
            Take our science-backed 10-question assessment to discover your financial stress score, impulse risks, and personalized roadmap.
          </p>
        </div>

        {/* QUIZ CONTAINER */}
        <div className="scroll-fade-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          {!quizStarted && !quizSubmitted && (
            <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '2.5rem', padding: '48px 36px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <HelpCircle size={36} />
              </div>
              <h3 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '16px' }}>Ready to check your financial score?</h3>
              <p style={{ color: t.textSub, fontSize: '16px', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 32px' }}>
                10 quick questions. Receive your instant Score Ring, key financial insights, and personalized step-by-step action plan.
              </p>
              <button onClick={() => setQuizStarted(true)} style={{ background: '#10b981', color: '#ffffff', padding: '16px 36px', borderRadius: '100px', fontSize: '16px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 24px rgba(16,185,129,0.3)', transition: 'all 0.2s' }} className="hover-lift">
                Start Free 10-Question Quiz <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          )}

          {quizStarted && !quizSubmitted && (
            <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '2.5rem', padding: '40px 36px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Question {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: t.textMuted }}>
                  {Math.round(((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100)}% Completed
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: '100px', overflow: 'hidden', marginBottom: '32px' }}>
                <div style={{ width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`, height: '100%', background: '#10b981', borderRadius: '100px', transition: 'width 0.4s' }}></div>
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.3, marginBottom: '28px' }}>
                {QUIZ_QUESTIONS[currentQuestionIndex].question}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {QUIZ_QUESTIONS[currentQuestionIndex].options.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSelectQuizOption(opt.points)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderRadius: '18px', textAlign: 'left', border: `1px solid ${t.border}`, background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', color: t.text, cursor: 'pointer', transition: 'all 0.2s'
                    }} 
                    className="hover-lift"
                  >
                    <span style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.4 }}>{opt.text}</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', color: t.textMuted, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {opt.tag}
                    </span>
                  </button>
                ))}
              </div>

            </div>
          )}

          {quizSubmitted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', animation: 'heroUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
              
              <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '2.5rem', padding: '48px 32px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', position: 'relative' }}>
                
                <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="90" cy="90" r="76" stroke={isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"} strokeWidth="14" fill="none" />
                    <circle 
                      cx="90" 
                      cy="90" 
                      r="76" 
                      stroke={scoreInfo.gaugeColor} 
                      strokeWidth="14" 
                      fill="none" 
                      strokeDasharray="477.5"
                      strokeDashoffset={477.5 - (477.5 * scorePercentage) / 100}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1 }}>{scorePercentage}%</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: t.textMuted, letterSpacing: '0.1em', marginTop: '4px' }}>SCORE</span>
                  </div>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '100px', background: scoreInfo.badgeBg, color: scoreInfo.badgeColor, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                  <Award size={16} />
                  {scoreInfo.badge}
                </div>

                <p style={{ color: t.textSub, fontSize: '16px', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 24px' }}>
                  {scoreInfo.description}
                </p>

                <button onClick={resetQuiz} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: t.text, padding: '8px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14} /> Retake Assessment
                </button>
              </div>

              <div>
                <h4 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                  Key Financial Insights
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  
                  <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', background: scoreInfo.budgetControl.pct > 70 ? '#d1fae5' : '#fef3c7', color: scoreInfo.budgetControl.pct > 70 ? '#065f46' : '#92400e' }}>
                        {scoreInfo.budgetControl.level}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>{scoreInfo.budgetControl.pct}%</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>Budget Control</div>
                    <div style={{ width: '100%', height: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: `${scoreInfo.budgetControl.pct}%`, height: '100%', background: scoreInfo.budgetControl.color, borderRadius: '100px' }}></div>
                    </div>
                    <div style={{ fontSize: '12px', color: t.textMuted, lineHeight: 1.4 }}>Zero-based allocation discipline & tracking consistency.</div>
                  </div>

                  <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', background: scoreInfo.impulseControl.pct > 70 ? '#d1fae5' : '#fee2e2', color: scoreInfo.impulseControl.pct > 70 ? '#065f46' : '#991b1b' }}>
                        {scoreInfo.impulseControl.level}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>{scoreInfo.impulseControl.pct}%</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>Impulse Control</div>
                    <div style={{ width: '100%', height: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: `${scoreInfo.impulseControl.pct}%`, height: '100%', background: scoreInfo.impulseControl.color, borderRadius: '100px' }}></div>
                    </div>
                    <div style={{ fontSize: '12px', color: t.textMuted, lineHeight: 1.4 }}>Ability to pause 24h before making unplanned purchases.</div>
                  </div>

                  <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', background: scoreInfo.savingsRate.pct > 70 ? '#d1fae5' : '#fef3c7', color: scoreInfo.savingsRate.pct > 70 ? '#065f46' : '#92400e' }}>
                        {scoreInfo.savingsRate.level}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>{scoreInfo.savingsRate.pct}%</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>Savings Buffer</div>
                    <div style={{ width: '100%', height: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: `${scoreInfo.savingsRate.pct}%`, height: '100%', background: scoreInfo.savingsRate.color, borderRadius: '100px' }}></div>
                    </div>
                    <div style={{ fontSize: '12px', color: t.textMuted, lineHeight: 1.4 }}>Emergency fund buffer against sudden expenses.</div>
                  </div>

                  <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', background: scoreInfo.debtRisk.pct > 70 ? '#d1fae5' : '#fee2e2', color: scoreInfo.debtRisk.pct > 70 ? '#065f46' : '#991b1b' }}>
                        {scoreInfo.debtRisk.level}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>{scoreInfo.debtRisk.pct}%</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>Debt Safety</div>
                    <div style={{ width: '100%', height: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: `${scoreInfo.debtRisk.pct}%`, height: '100%', background: scoreInfo.debtRisk.color, borderRadius: '100px' }}></div>
                    </div>
                    <div style={{ fontSize: '12px', color: t.textMuted, lineHeight: 1.4 }}>Protection against high-interest credit card traps.</div>
                  </div>

                </div>
              </div>

              <div style={{ background: isDark ? '#161d18' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '2.5rem', padding: '40px 36px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }}></span>
                  Your Personalized Financial Roadmap
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', paddingLeft: '32px' }}>
                  
                  <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '3px', background: 'linear-gradient(to bottom, #10b981, #3b82f6, #8b5cf6)' }}></div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-32px', top: '4px', width: '24px', height: '24px', borderRadius: '8px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>START NOW</span>
                    <h5 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Immediate Actions</h5>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={onOpenWebApp} style={{ background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5', border: '1px solid #10b981', color: '#10b981', padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        Launch AI Financial Coach
                      </button>
                      <button onClick={onOpenWebApp} style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', border: `1px solid ${t.border}`, color: t.text, padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        Set Up Zero-Based Envelopes
                      </button>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-32px', top: '4px', width: '24px', height: '24px', borderRadius: '8px', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#3b82f6', letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>THIS WEEK</span>
                    <h5 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Short-Term Goals</h5>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={onOpenWebApp} style={{ background: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff', border: '1px solid #3b82f6', color: '#3b82f6', padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        Build 1-Month Emergency Buffer
                      </button>
                      <button onClick={onOpenWebApp} style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', border: `1px solid ${t.border}`, color: t.text, padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        Track 7-Day Spending Habits
                      </button>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-32px', top: '4px', width: '24px', height: '24px', borderRadius: '8px', background: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#8b5cf6', letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>LONG-TERM</span>
                    <h5 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Building Wealth Habits</h5>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={onOpenWebApp} style={{ background: isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff', border: '1px solid #8b5cf6', color: '#8b5cf6', padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        Automate Monthly Savings Rules
                      </button>
                      <button onClick={onOpenWebApp} style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', border: `1px solid ${t.border}`, color: t.text, padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        Zero-Debt Payoff Strategy
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button onClick={onOpenWebApp} style={{ background: '#10b981', color: '#ffffff', padding: '16px 36px', borderRadius: '100px', fontSize: '16px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 24px rgba(16,185,129,0.3)' }} className="hover-lift">
                  Open Web App & Apply Roadmap <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                </button>
                <button onClick={handleDownloadAction} style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: t.text, padding: '16px 28px', borderRadius: '100px', fontSize: '15px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer' }}>
                  Download Android APK
                </button>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* ═══════════════ MEMBER STORIES & REVIEWS ═══════════════ */}
      <section id="community" style={{ padding: '80px 24px', maxWidth: '1440px', margin: '0 auto', overflow: 'hidden' }}>
        <div className="scroll-fade-up" style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D58B6D', marginBottom: '16px', display: 'block' }}>Member Experiences</span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 3.4rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Financial Experiences<br />Shared By Our Users</h2>
        </div>

        <div className="scroll-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          <div className="hover-lift" style={{ background: isDark ? 'linear-gradient(135deg, #162419, #1c2e20)' : 'linear-gradient(135deg, #e8f5e9, #f4faf0)', border: `1px solid ${isDark ? '#2a4a2e' : '#c8e6c9'}`, borderRadius: '2.5rem', padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '24px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.6, marginBottom: '32px', color: t.text }}>
                "ZenBudget's AI categorization feels remarkably human. It helped me step back during impulse spending and <strong style={{ borderBottom: '3px solid #10b981' }}>ground my financial goals.</strong>"
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src="/profile-sarah.jpg" alt="Sarah" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: t.text }}>Sarah Mitchell</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: t.textMuted, margin: 0 }}>Working Professional</p>
              </div>
            </div>
          </div>

          <div className="hover-lift" style={{ background: isDark ? 'linear-gradient(135deg, #1e1a2e, #251f38)' : 'linear-gradient(135deg, #ede7f6, #f5f0fe)', border: `1px solid ${isDark ? '#3a3060' : '#d1c4e9'}`, borderRadius: '2.5rem', padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '24px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.6, marginBottom: '32px', color: t.text }}>
                "Seeing my spending trends tracked over weeks <strong style={{ borderBottom: '3px solid #8b5cf6' }}>opened my eyes</strong>. I finally understand my budget leaks thanks to this app."
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src="/profile-daniel.jpg" alt="Daniel" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: t.text }}>Daniel Roberts</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: t.textMuted, margin: 0 }}>University Student</p>
              </div>
            </div>
          </div>

          <div className="hover-lift" style={{ background: isDark ? 'linear-gradient(135deg, #2a1820, #2e1c26)' : 'linear-gradient(135deg, #fce4ec, #fdf5f7)', border: `1px solid ${isDark ? '#4a2a36' : '#f8bbd0'}`, borderRadius: '2.5rem', padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '24px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.6, marginBottom: '32px', color: t.text }}>
                "The collaborative family budget challenges gave me a <strong style={{ borderBottom: '3px solid #f43f5e' }}>sense of control</strong> I was missing for years."
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop" alt="Emily" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: t.text }}>Emily Chen</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: t.textMuted, margin: 0 }}>Creative Director</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════ DOWNLOAD BANNER (ULTRA-PREMIUM GLASSMOPHIC REDESIGN) ═══════════════ */}
      <section style={{ padding: '32px 20px', maxWidth: '1240px', margin: '0 auto' }} className="scroll-fade-up">
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #022c22 45%, #065f46 100%)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          borderRadius: '2.5rem',
          padding: '48px 48px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justify: 'space-between',
          gap: '36px',
          boxShadow: '0 30px 60px -15px rgba(6, 78, 59, 0.6), inset 0 1px 1px rgba(255,255,255,0.2)'
        }} className="mobile-padding">
          
          {/* Glowing Ambient Mesh Light */}
          <div style={{ position: 'absolute', top: '-30%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: '-40%', left: '10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}></div>

          {/* Left Text & Action Column */}
          <div style={{ position: 'relative', zIndex: 10, flex: '1 1 420px', minWidth: '280px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '100px', padding: '6px 14px', marginBottom: '16px' }}>
              <Sparkles size={14} color="#34d399" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#6ee7b7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                INSTANT ACCESS ANYWHERE • ZERO ADS
              </span>
            </div>

            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 40px)', fontWeight: 900, color: '#ffffff', lineHeight: 1.15, marginBottom: '14px', letterSpacing: '-0.03em' }}>
              Focus on your wealth.<br />
              <span style={{ background: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Anywhere. Anytime.
              </span>
            </h2>

            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', marginBottom: '28px', lineHeight: 1.6, maxWidth: '480px' }}>
              Join 50,000+ smart budgeters using ZenBudget's zero-knowledge private budget tools & AI insights to build lasting wealth.
            </p>
            
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                onClick={handleDownloadApk} 
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', 
                  color: '#064e3b', 
                  padding: '14px 28px', 
                  borderRadius: '100px', 
                  fontSize: '14.5px', 
                  fontWeight: 900, 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '9px', 
                  boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                  transition: 'all 0.25s' 
                }} 
                className="glow-btn"
              >
                <Download size={18} color="#059669" />
                <span>Download Android APK</span>
              </button>

              <button 
                onClick={onOpenWebApp} 
                style={{ 
                  background: 'rgba(255,255,255,0.12)', 
                  color: '#ffffff', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  padding: '14px 26px', 
                  borderRadius: '100px', 
                  fontSize: '14.5px', 
                  fontWeight: 800, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '9px', 
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.25s' 
                }} 
                className="hover-lift"
              >
                <Wallet size={18} color="#34d399" />
                <span>Open Instant Web App</span>
              </button>
            </div>

            {/* Trust Micro Indicators */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
                <Shield size={14} color="#34d399" /> 100% Encrypted
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
                <Brain size={14} color="#34d399" /> 60-Sec AI Tracking
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
                <Star size={14} color="#facc15" fill="#facc15" /> 4.9/5 Rating
              </div>
            </div>
          </div>

          {/* Right Glassmorphic Financial Health Scorecard (No phone frame clutter!) */}
          <div className="desktop-only" style={{ flex: '0 0 320px', position: 'relative', zIndex: 10 }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.07)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }} className="hover-lift">
              
              {/* Header Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/favicon.png" style={{ width: '24px', height: '24px', borderRadius: '7px' }} alt="ZenBudget" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>Financial Scorecard</span>
                </div>
                <span style={{ fontSize: '10px', background: '#34d399', color: '#064e3b', padding: '3px 8px', borderRadius: '100px', fontWeight: 900 }}>LIVE</span>
              </div>

              {/* Net Worth Vault Box */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '16px', padding: '16px', color: '#ffffff' }}>
                <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>TOTAL NET WORTH VAULT</div>
                <div style={{ fontSize: '26px', fontWeight: 900, margin: '4px 0 8px', color: '#a7f3d0' }}>{fmtCurr(348500)}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'rgba(52,211,153,0.2)', padding: '4px 10px', borderRadius: '100px', fontWeight: 800, color: '#6ee7b7' }}>
                  <TrendingUp size={13} /> +32% Saved ({fmtCurr(45000)})
                </div>
              </div>

              {/* Mini AI Coach Pill */}
              <div style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="#34d399" />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>AI Insight</div>
                  <div style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: 700 }}>Saved {fmtCurr(4200)} on dining out this week!</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      
        </main>
      )}

{/* ═══════════════ FOOTER (INNERHEAL EXACT DESIGN) ═══════════════ */}
      <footer style={{ padding: '80px 24px 40px', maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px', marginBottom: '48px' }}>
          
          {/* Brand Left Column */}
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <img src="/favicon.png" alt="ZenBudget" style={{ width: '38px', height: '38px', borderRadius: '12px' }} />
              <span style={{ fontSize: '22px', fontWeight: 900, color: t.text, letterSpacing: '-0.02em' }}>ZenBudget</span>
            </div>
            <p style={{ color: t.textSub, fontSize: '14.5px', lineHeight: 1.65, maxWidth: '340px', marginBottom: '28px' }}>
              ZenBudget uses AI to analyze your spending routines and financial patterns, providing actionable insights. Recognize waste, reduce debt, and take control of your financial health.
            </p>
            <button onClick={onOpenWebApp} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDark ? '#ffffff' : '#111827', color: isDark ? '#111827' : '#ffffff', padding: '14px 28px', borderRadius: '100px', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.12)' }} className="hover-lift">
              <span>Try ZenBudget Free</span>
              <span style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRight size={13} />
              </span>
            </button>
          </div>

          {/* Features Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.text, marginBottom: '6px' }}>Features</span>
            {[
              { label: 'AI Financial Coach Assistant', slug: 'ai-coach' },
              { label: 'Smart Expense Analytics', slug: 'analytics' },
              { label: 'Zero-Based Budget Planner', slug: 'budget-planner' },
              { label: 'Savings Goals Tracker', slug: 'savings-goals' },
              { label: 'Together Savings Community', slug: 'community' },
              { label: 'Money Forest Growth', slug: 'money-forest' },
              { label: '100% Private Encrypted Vault', slug: 'private-vault' },
              { label: 'AI Receipt Scanner', slug: 'receipt-scanner' },
            ].map((item, i) => (
              <a 
                key={i} 
                onClick={() => navigateToPage(item.slug)} 
                style={{ color: t.textSub, textDecoration: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#10b981')}
                onMouseLeave={e => (e.currentTarget.style.color = t.textSub)}
              >{item.label}</a>
            ))}
          </div>

          {/* Conditions & Solutions Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.text, marginBottom: '6px' }}>Solutions</span>
            {[
              { label: 'Living Paycheck to Paycheck', slug: 'paycheck-to-paycheck' },
              { label: 'Impulse Buying & Blocker', slug: 'impulse-spending' },
              { label: 'Credit Card Debt Snowball', slug: 'credit-debt' },
              { label: 'Emergency Fund Safety Cushion', slug: 'no-emergency-fund' },
              { label: 'Freelancer & Irregular Income', slug: 'freelancer-money' },
              { label: 'Hidden Subscriptions Audit', slug: 'hidden-subscriptions' },
              { label: 'Couples & Shared Household', slug: 'couple-finances' },
            ].map((item, i) => (
              <a 
                key={i} 
                onClick={() => navigateToPage(item.slug)} 
                style={{ color: t.textSub, textDecoration: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#10b981')}
                onMouseLeave={e => (e.currentTarget.style.color = t.textSub)}
              >{item.label}</a>
            ))}
          </div>

          {/* Company Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.text, marginBottom: '6px' }}>Company</span>
            <a onClick={onOpenWebApp} style={{ color: t.textSub, textDecoration: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>About ZenBudget</a>
            <a onClick={() => scrollTo('features')} style={{ color: t.textSub, textDecoration: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>FAQs & Help</a>
            <a onClick={onOpenWebApp} style={{ color: t.textSub, textDecoration: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Contact Support</a>
            <a onClick={onOpenWebApp} style={{ color: t.textSub, textDecoration: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Terms and Conditions</a>
            <a onClick={onOpenWebApp} style={{ color: t.textSub, textDecoration: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</a>
            <a onClick={handleDownloadApk} style={{ color: t.textSub, textDecoration: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Download Android APK</a>
          </div>

        </div>

        {/* Center Dot Divider */}
        <div style={{ position: 'relative', height: '1px', background: t.border, margin: '48px 0 36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isDark ? '#a7f3d0' : '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}></div>
        </div>

        {/* SEO Tag Cloud Row */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted, marginBottom: '16px' }}>
            POPULAR SEARCHES & FINANCIAL SOLUTIONS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 10px', maxWidth: '1100px', margin: '0 auto' }}>
            {[
              'Best Expense Tracker App', 'Best Budgeting App 2026', 'AI Financial Coach Assistant', 'Free Money Manager App', 
              'Zero-Based Budgeting Planner', 'Savings Goals Tracker', 'Debt Snowball Calculator', 'Financial Health Quiz', 
              'Budget App for Couples', 'Offline Android Expense Tracker APK', 'Impulse Buying Blocker', 'Emergency Fund Cushion',
              'Freelancer Irregular Income Manager', 'Hidden Subscriptions Audit', 'AI Receipt OCR Scanner', '52-Week Money Challenge',
              'Envelope Budgeting Method', 'Personal Net Worth Calculator', 'Daily Expense Diary App', 'Mindful Money Habits',
              'Student Budget Planner', 'Family Household Shared Finances', 'Zen Companion Budget Piggy', 'INR Currency Expense Tracker',
              'UPI Auto Expense Logger', 'Private Encrypted Vault App', 'iOS Safari PWA Installation', 'Automated Income vs Expense Graph',
              'Subscription Cancellation Tracker', 'Smart Financial Goals Planner', 'Zero-Data Leak Finance App', 'Monthly Money Wrapped Story',
              'Together Savings Challenge', 'Wealth Compound Insights', 'Financial Peace Mindset App'
            ].map((tag, i) => (
              <span 
                key={i} 
                style={{ 
                  fontSize: '11.5px', 
                  color: t.textMuted, 
                  fontWeight: 600, 
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', 
                  border: `1px solid ${t.border}`, 
                  padding: '5px 12px', 
                  borderRadius: '100px', 
                  cursor: 'pointer',
                  transition: 'all 0.2s' 
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#10b981';
                  e.currentTarget.style.borderColor = '#10b981';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = t.textMuted;
                  e.currentTarget.style.borderColor = t.border;
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Financial Disclaimer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11.5px', color: t.textMuted, lineHeight: 1.6, maxWidth: '840px', margin: '0 auto 16px' }}>
            <strong>Financial Disclaimer:</strong> ZenBudget is designed for personal financial wellness and self-tracking. It is <strong>not</strong> a substitute for professional investment advice, tax consulting, or registered banking services.
          </p>
          <span style={{ fontSize: '12.5px', color: t.textMuted, fontWeight: 700 }}>© 2026 ZenBudget. All Rights Reserved.</span>
        </div>
      </footer>

      {/* ═══════════════ APP INSTALL / DOWNLOAD MODAL (INNERHEAL CARD POPUP MATCH) ═══════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: '16px' }} onClick={() => setShowModal(false)}>
          <div className="hero-animate" style={{ width: '100%', maxWidth: '460px', background: isDark ? '#141b15' : '#ffffff', borderRadius: '28px', overflow: 'hidden', position: 'relative', boxShadow: '0 30px 70px rgba(0,0,0,0.6)', border: `1px solid ${t.border}` }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header Banner with Logo, Title, Rating, FREE Badge */}
            <div style={{ background: isDark ? 'linear-gradient(135deg, #1b261d, #141c16)' : 'linear-gradient(135deg, #f0fdf4, #e8f5e9)', padding: '24px 24px 20px', position: 'relative', borderBottom: `1px solid ${t.border}` }}>
              
              {/* Close Button */}
              <button onClick={() => setShowModal(false)} aria-label="Close" style={{ position: 'absolute', top: '16px', right: '16px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: 'none', color: t.text, cursor: 'pointer', padding: '7px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <X size={16} strokeWidth={2.5} />
              </button>
              
              {/* Top Row: App Logo + Title + Ratings + FREE Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingRight: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="/favicon.png" alt="ZenBudget" style={{ width: '42px', height: '42px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: t.text }}>ZenBudget</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: t.textMuted, marginTop: '2px' }}>
                      <div style={{ display: 'flex', color: '#facc15' }}>{[1,2,3,4,5].map(s => <Star key={s} size={10} fill="currentColor" />)}</div>
                      4.9 • 10K reviews
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: '10px', fontWeight: 800, color: '#84cc16', background: isDark ? 'rgba(132,204,22,0.15)' : '#dcfce7', border: '1px solid #84cc16', padding: '3px 8px', borderRadius: '100px', letterSpacing: '0.08em' }}>FREE</span>
              </div>

              {/* Main Card Headline */}
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: t.text, margin: '0 0 8px 0', lineHeight: 1.25 }}>
                Your money deserves <span style={{ color: '#84cc16' }}>better care.</span>
              </h2>
              <p style={{ fontSize: '13px', color: t.textSub, margin: 0, lineHeight: 1.5 }}>
                AI expense tracking, smart budgets, and zero-based goals — free in your pocket.
              </p>
            </div>

            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Avatars + Daily Active Count Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', padding: '10px 14px', borderRadius: '14px', border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex' }}>
                  {['S','M','A','R','J'].map((initial, i) => (
                    <div key={i} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#84cc16', color: '#111827', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? '-6px' : 0, border: `2px solid ${isDark ? '#141b15' : '#ffffff'}` }}>
                      {initial}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: t.text }}>
                  <strong style={{ color: '#84cc16' }}>50,000+</strong> people budgeting daily
                </span>
              </div>

              {/* Checklist Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: <Zap size={15} color="#84cc16" />, text: 'AI expense tracking — insights in 60 seconds' },
                  { icon: <Shield size={15} color="#84cc16" />, text: 'End-to-end encrypted — your data stays yours' },
                  { icon: <TrendingUp size={15} color="#84cc16" />, text: 'Science-backed zero-based budget & wealth tools' },
                  { icon: <CheckCircle2 size={15} color="#84cc16" />, text: 'Free forever — no credit card required' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isDark ? 'rgba(132,204,22,0.12)' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {f.icon}
                    </div>
                    <span style={{ fontSize: '13px', color: t.text, fontWeight: 600 }}>{f.text}</span>
                  </div>
                ))}
              </div>

              {/* Action Button & Not Now Sub-link */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <button 
                  onClick={handleDownloadAction} 
                  style={{ width: '100%', padding: '14px', borderRadius: '100px', background: '#ffffff', color: '#111827', fontSize: '15px', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
                  className="glow-btn"
                >
                  {deviceOS === 'ios' && (
                    <>
                      <Smartphone size={18} color="#10b981" />
                      <span>Add to Home Screen (Safari)</span>
                    </>
                  )}
                  {deviceOS === 'android' && (
                    <>
                      <Download size={18} color="#10b981" />
                      <span>Download Android APK</span>
                    </>
                  )}
                  {deviceOS !== 'ios' && deviceOS !== 'android' && (
                    <>
                      <Wallet size={18} color="#10b981" />
                      <span>Open Web App Now</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={() => setShowModal(false)} 
                  style={{ background: 'transparent', border: 'none', color: t.textMuted, fontSize: '12.5px', fontWeight: 600, padding: '4px', cursor: 'pointer', textAlign: 'center' }}
                >
                  Not now
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ═══════════════ INNERHEAL-STYLE AUTOMATIC ENTRY WELCOME CARD POPUP ═══════════════ */}
      {showWelcomeModal && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 9999999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(0, 0, 0, 0.78)', 
            backdropFilter: 'blur(12px)', 
            padding: '16px' 
          }} 
          onClick={() => setShowWelcomeModal(false)}
        >
          <div 
            className="hero-animate" 
            style={{ 
              width: '100%', 
              maxWidth: '460px', 
              borderRadius: '28px', 
              overflow: 'hidden', 
              position: 'relative', 
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)', 
              border: '1px solid rgba(255,255,255,0.15)',
              background: isDark ? '#111812' : '#ffffff'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Section with Dark Green Forest Gradient Canvas */}
            <div style={{ background: 'linear-gradient(135deg, #0d2818 0%, #163824 100%)', padding: '28px 24px 24px', color: '#ffffff', position: 'relative' }}>
              {/* Close Button */}
              <button 
                onClick={() => setShowWelcomeModal(false)} 
                style={{ 
                  position: 'absolute', 
                  top: '18px', 
                  right: '18px', 
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', 
                  color: '#ffffff', 
                  cursor: 'pointer', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'all 0.2s' 
                }}
              >
                <X size={18} />
              </button>

              {/* App Brand Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16,185,129,0.4)', flexShrink: 0, overflow: 'hidden' }}>
                  <img src="/favicon.png" alt="ZenBudget Logo" style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>ZenBudget</h3>
                    <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(163, 230, 53, 0.2)', border: '1px solid #a3e635', color: '#a3e635', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>FREE</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#facc15" color="#facc15" />)}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>4.9 • 15K reviews</span>
                  </div>
                </div>
              </div>

              {/* Title & Tagline */}
              <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px 0', lineHeight: 1.25, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Your money deserves <span style={{ color: '#a3e635' }}>better care.</span>
              </h2>
              <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>
                AI expense tracking, private budget vaults, and instant financial peace — free in your pocket.
              </p>
            </div>

            {/* Social Proof Strip */}
            <div style={{ background: isDark ? 'rgba(163, 230, 53, 0.12)' : '#fef3c7', borderTop: `1px solid ${isDark ? 'rgba(163, 230, 53, 0.2)' : '#fde68a'}`, borderBottom: `1px solid ${isDark ? 'rgba(163, 230, 53, 0.2)' : '#fde68a'}`, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex' }}>
                {['S', 'M', 'A', 'R', 'J'].map((char, i) => (
                  <div key={i} style={{ width: '22px', height: '22px', borderRadius: '50%', background: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][i], color: '#fff', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? '-6px' : 0, border: '2px solid #ffffff' }}>
                    {char}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: isDark ? '#a3e635' : '#92400e' }}>
                50,000+ people mastering their money daily
              </span>
            </div>

            {/* Feature Bullets */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { icon: <Brain size={16} color="#10b981" />, text: 'AI expense tracking — insights in 60 seconds' },
                { icon: <Shield size={16} color="#10b981" />, text: 'End-to-end encrypted — your data stays yours' },
                { icon: <TrendingUp size={16} color="#10b981" />, text: 'Evidence-based wealth compound & budget tools' },
                { icon: <CheckCircle2 size={16} color="#10b981" />, text: 'Free forever — no credit card required' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13.5px', fontWeight: 700, color: t.text }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}

              {/* Action Buttons (Dynamically Traced to Device OS) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={() => {
                    setShowWelcomeModal(false);
                    if (deviceOS === 'android') handleDownloadApk();
                    else if (deviceOS === 'ios') setShowIosGuideModal(true);
                    else onOpenWebApp();
                  }}
                  style={{ width: '100%', padding: '15px 24px', borderRadius: '100px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(16,185,129,0.4)', transition: 'all 0.2s' }}
                  className="glow-btn"
                >
                  {deviceOS === 'android' ? (
                    <>
                      <Download size={20} color="#ffffff" />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '9.5px', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.06em' }}>TRACED DEVICE: ANDROID</span>
                        <span style={{ fontSize: '15px', fontWeight: 900 }}>Download Android APK (Direct)</span>
                      </div>
                    </>
                  ) : deviceOS === 'ios' ? (
                    <>
                      <Smartphone size={20} color="#ffffff" />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '9.5px', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.06em' }}>TRACED DEVICE: IOS SAFARI</span>
                        <span style={{ fontSize: '15px', fontWeight: 900 }}>Add to iPhone / iPad</span>
                      </div>
                    </>
                  ) : deviceOS === 'mac' ? (
                    <>
                      <Monitor size={20} color="#ffffff" />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '9.5px', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.06em' }}>TRACED DEVICE: MACOS</span>
                        <span style={{ fontSize: '15px', fontWeight: 900 }}>Open Mac Web App</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Wallet size={20} color="#ffffff" />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '9.5px', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.06em' }}>TRACED DEVICE: WEB BROWSER</span>
                        <span style={{ fontSize: '15px', fontWeight: 900 }}>Open Web App Now</span>
                      </div>
                    </>
                  )}
                </button>

                {/* Secondary Button: Alternative Action */}
                {deviceOS === 'android' ? (
                  <button 
                    onClick={() => { setShowWelcomeModal(false); onOpenWebApp(); }}
                    style={{ width: '100%', padding: '13px 20px', borderRadius: '100px', background: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', color: t.text, fontSize: '13.5px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    className="hover-lift"
                  >
                    <Wallet size={16} color="#10b981" />
                    <span>Open Web App (Browser Mode)</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => { setShowWelcomeModal(false); handleDownloadApk(); }}
                    style={{ width: '100%', padding: '13px 20px', borderRadius: '100px', background: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', color: t.text, fontSize: '13.5px', fontWeight: 700, border: `1px solid ${t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    className="hover-lift"
                  >
                    <Download size={16} color="#10b981" />
                    <span>Download Android APK (Direct)</span>
                  </button>
                )}

                <button 
                  onClick={() => setShowWelcomeModal(false)}
                  style={{ background: 'transparent', border: 'none', color: t.textMuted, fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '6px' }}
                >
                  Not now, explore website
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════ IOS SAFARI PWA INSTALLATION GUIDE MODAL ═══════════════ */}
      {showIosGuideModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: '16px' }} onClick={() => setShowIosGuideModal(false)}>
          <div className="hero-animate" style={{ width: '100%', maxWidth: '440px', background: isDark ? '#161d18' : '#ffffff', borderRadius: '28px', padding: '28px', boxShadow: '0 -20px 40px rgba(0,0,0,0.5)', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/favicon.png" alt="ZenBudget" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: t.text }}>Install on iPhone / iPad</h3>
              </div>
              <button onClick={() => setShowIosGuideModal(false)} style={{ background: 'transparent', border: 'none', color: t.text, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', padding: '12px 16px', borderRadius: '16px', border: `1px solid ${t.border}` }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>Tap Safari's <strong>Share button</strong> [↑] at the bottom toolbar.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', padding: '12px 16px', borderRadius: '16px', border: `1px solid ${t.border}` }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>Scroll down and select <strong>"Add to Home Screen"</strong>.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', padding: '12px 16px', borderRadius: '16px', border: `1px solid ${t.border}` }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>Tap <strong>"Add"</strong> in top-right to launch like a native App!</span>
              </div>
            </div>

            <button onClick={() => { setShowIosGuideModal(false); onOpenWebApp(); }} style={{ width: '100%', padding: '14px', borderRadius: '100px', background: '#10b981', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
              Open Web App Immediately
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ FEATURE DETAILS POPUP MODAL ═══════════════ */}
      {featureModalData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', padding: '16px' }} onClick={() => setFeatureModalData(null)}>
          <div className="hero-animate" style={{ width: '100%', maxWidth: '520px', background: isDark ? '#161d18' : '#ffffff', borderRadius: '28px', overflow: 'hidden', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', border: `1px solid ${t.border}` }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setFeatureModalData(null)} style={{ position: 'absolute', top: '18px', right: '18px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: 'none', color: t.text, cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <X size={18} />
            </button>
            <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  {featureModalData.icon}
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981' }}>{featureModalData.badge}</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: '2px 0 0' }}>{featureModalData.title}</h3>
                </div>
              </div>
              <p style={{ fontSize: '14.5px', color: t.textSub, lineHeight: 1.6, margin: 0 }}>
                {featureModalData.description}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', padding: '16px', borderRadius: '16px', border: `1px solid ${t.border}` }}>
                {featureModalData.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', fontWeight: 600, color: t.text }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setFeatureModalData(null); onOpenWebApp(); }} style={{ width: '100%', padding: '16px', borderRadius: '100px', background: '#10b981', color: '#ffffff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 24px rgba(16,185,129,0.35)' }} className="hover-lift">
                <Wallet size={18} /> {featureModalData.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ CUSTOM SMOOTH CURSOR ═══════════════ */}
      <div className="desktop-only" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '12px',
        height: '12px',
        backgroundColor: isDark ? '#ffffff' : '#111827',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 999999,
        transform: `translate(${cursorPos.x - 6}px, ${cursorPos.y - 6}px)`,
        transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: cursorPos.x === 0 && cursorPos.y === 0 ? 0 : 1
      }}></div>
    </div>
  );
}
