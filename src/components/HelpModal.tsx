import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, Bot, Star, Mail, Send, MessageSquare, Sparkles, ThumbsUp, CheckCircle, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ZenFinancialIntelligenceEngine, resolveUserFinancialQuery } from '../utils/zenFinancialEngine';
import type { ConversationMemoryState } from '../utils/zenFinancialEngine';
import type { Transaction, CategoryBudget, SavingsGoal, LoanRecord } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[];
  budgets?: CategoryBudget[];
  goals?: SavingsGoal[];
  currencySymbol?: string;
  userName?: string;
  initialTab?: 'faq' | 'bot' | 'feedback';
  accounts?: any[];
  loans?: LoanRecord[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ 
  isOpen, 
  onClose, 
  transactions = [], 
  budgets = [],
  goals = [],
  currencySymbol = '₹',
  userName = 'User',
  initialTab = 'bot',
  accounts = [],
  loans = []
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'faq' | 'bot' | 'feedback'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRoastMode, setIsRoastMode] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Analyze user spending activity for AI Coach
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  const monthTxs = safeTxs.filter(t => {
    if (!t || !t.date) return false;
    const d = new Date(t.date);
    return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthTxs.filter(t => t && t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpense = monthTxs.filter(t => t && t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalSaved = Math.max(0, totalIncome - totalExpense);
  const flexMoney = Math.max(0, totalIncome - totalExpense);
  const savingsPct = totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0;

  const catMap: Record<string, number> = {};
  monthTxs.filter(t => t && t.type === 'expense').forEach(t => {
    const c = t.category || 'other';
    catMap[c] = (catMap[c] || 0) + (Number(t.amount) || 0);
  });
  let topCat = 'none';
  let topCatAmt = 0;
  Object.entries(catMap).forEach(([cat, amt]) => {
    if (amt > topCatAmt) {
      topCatAmt = amt;
      topCat = cat;
    }
  });

  const catBreakdownText = Object.entries(catMap)
    .map(([c, amt]) => `${c}: ${currencySymbol}${amt.toLocaleString()}`)
    .join(', ');

  const recentTxsText = monthTxs.slice(0, 5)
    .map(t => `${t.title || 'Expense'} (${(t.type || 'expense').toUpperCase()} ${currencySymbol}${t.amount || 0})`)
    .join('; ');

  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const budgetSummaryText = safeBudgets.map(b => {
    if (!b) return '';
    const spentForCat = catMap[b.category] || 0;
    return `${b.category}: ${currencySymbol}${spentForCat}/${currencySymbol}${b.limit}`;
  }).filter(Boolean).join(', ');

  const safeGoals = Array.isArray(goals) ? goals : [];
  const goalSummaryText = safeGoals.map(g => {
    if (!g) return '';
    return `${g.name}: ${currencySymbol}${g.currentAmount}/${currencySymbol}${g.targetAmount}`;
  }).filter(Boolean).join(', ');

  // Local persistent memory database
  const [learnedMemory, setLearnedMemory] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('zb_bot_memory') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (activeTab === 'bot') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const faqList = [
    {
      q: "How do I upgrade to Premium?",
      a: "Open ZenBudget Premium, choose Monthly, Yearly, or an available Lifetime Founding Member plan, then complete your payment securely through the Cashfree checkout."
    },
    {
      q: "What is a 50/30/20 budgeting rule?",
      a: "A popular rule: Spend 50% of your income on Needs (rent, bills), 30% on Wants (dining out, hobbies), and save/invest the remaining 20%."
    },
    {
      q: "Is my transaction data safe?",
      a: "Yes! ZenBudget stores all financial data in your phone's secure native sandbox. We do not run tracker cookies or upload your entries to cloud advertiser APIs."
    },
    {
      q: "Fingerprint unlock is not working?",
      a: "Ensure your phone has biometrics enabled in Android Settings and a fingerprint is registered. You can tap the Fingerprint button on the lockpad to retry."
    }
  ];

  function getSmartClientFallbackResponse(userMessage: string): string {
    const rawText = userMessage || '';
    const msg = rawText.toLowerCase().trim();
    const isEng = !/[अ-ह]/.test(rawText) && !/\b(kahan|kaise|mera|meri|mere|mujhe|btao|batao|apka|aapka|kya|kab|kaun|hai|hain|rha|rhi|rhe|hoga|hogaye|bhai|yaar|karo|do|karna)\b/i.test(msg);

    const safeAccs = Array.isArray(accounts) ? accounts : [];
    const totalAccBal = safeAccs.reduce((sum, a) => sum + (Number(a?.balance) || 0), 0);
    const accDetails = safeAccs
      .map(a => `${a.name || 'Account'}: ${currencySymbol}${(Number(a?.balance) || 0).toLocaleString()}`)
      .join('; ');

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - new Date().getDate());
    const dailySafeSpend = Math.max(100, Math.round((flexMoney > 0 ? flexMoney : (totalAccBal > 0 ? totalAccBal : 1000)) / daysRemaining));

    // Calculate Financial Health Score (0-100)
    let healthScore = 55;
    if (totalIncome > 0) {
      if (savingsPct >= 30) healthScore += 30;
      else if (savingsPct >= 20) healthScore += 20;
      else if (savingsPct >= 10) healthScore += 10;
      else healthScore -= 15;
    }
    if (totalExpense > 0 && totalExpense <= totalIncome * 0.75) healthScore += 15;
    if (totalAccBal > 5000) healthScore += 10;
    healthScore = Math.min(100, Math.max(15, healthScore));

    // 0. Roast Mode Specific Responses
    if (isRoastMode || msg.includes('roast') || msg.includes('roast me')) {
      if (topCatAmt > 0) {
        if (isEng) {
          return `🔥 ROAST ALERT: Oh ${userName}, you spent ${currencySymbol}${topCatAmt.toLocaleString()} on ${topCat.toUpperCase()} this month?! 😭 Your bank account is crying for mercy! Savings rate is sitting at a tragic ${savingsPct}%. Maybe pause the impulse buys before Zen Piggy files for bankruptcy! 🐷💔`;
        }
        return `🔥 ROAST ALERT: Oye ${userName}! Tumne ${topCat.toUpperCase()} pe ${currencySymbol}${topCatAmt.toLocaleString()} uda diye?! 😭 Tumhara bank balance rone ki taiyari me hai! Savings rate abhi sirf ${savingsPct}% hai. Please agli party cancel karo nahi to agle hafte maggi par guzarish karna padega! 🐷💔`;
      }
      return isEng 
        ? `🔥 ROAST ALERT: You haven't logged enough transactions yet, but I bet you're hiding that secret coffee subscription! Log your entries so I can roast your spending properly ☕🔥`
        : `🔥 ROAST ALERT: Abhi tak saare kharche enter nahi kiye tumne, pakka koi secret momos ya shopping छुपा rahe ho! Log karo taaki sahi se roast kar saku ☕🔥`;
    }

    // 1. "Can I afford X?" / Impulse Buy Sanity Checker (Extracts number like 5000, 15000, 250)
    const amountMatch = msg.match(/(\d+[\d,]*)/);
    if (
      msg.includes('afford') || msg.includes('buy') || msg.includes('kharid') || 
      msg.includes('kharidu') || msg.includes('le lu') || msg.includes('le sakta') ||
      msg.includes('can i get') || msg.includes('should i buy')
    ) {
      if (amountMatch) {
        const itemAmount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
        if (itemAmount > 0) {
          if (itemAmount <= dailySafeSpend * 3 && itemAmount <= totalAccBal * 0.2) {
            return `✅ YES! YOU CAN SAFELY AFFORD THIS!\n\n• Item Cost: **${currencySymbol}${itemAmount.toLocaleString()}**\n• Available Wallet Balance: **${currencySymbol}${totalAccBal.toLocaleString()}**\n• Daily Safe Spending Limit: **${currencySymbol}${dailySafeSpend}/day**\n\nThis purchase stays well within your safe allowance. Go ahead and enjoy! 🛍️✨`;
          } else if (itemAmount <= totalAccBal && itemAmount <= flexMoney) {
            return `⚠️ CAUTION: BORDERLINE PURCHASE!\n\n• Item Cost: **${currencySymbol}${itemAmount.toLocaleString()}**\n• Available Wallet Balance: **${currencySymbol}${totalAccBal.toLocaleString()}**\n• Flexible Money Left: **${currencySymbol}${flexMoney.toLocaleString()}**\n\nBuying this will consume ${Math.round((itemAmount / (flexMoney || 1)) * 100)}% of your remaining monthly savings. We suggest applying the **48-Hour Pause Rule** before tapping buy! ⏳`;
          } else {
            return `🚨 NO! DO NOT BUY THIS NOW!\n\n• Item Cost: **${currencySymbol}${itemAmount.toLocaleString()}**\n• Available Wallet Balance: **${currencySymbol}${totalAccBal.toLocaleString()}**\n• Shortfall: **${currencySymbol}${(itemAmount - totalAccBal).toLocaleString()}**\n\nThis purchase exceeds your safe liquid balance. Create a dedicated **Savings Goal** in ZenBudget to save for it over the next 2-3 months! 🎯`;
          }
        }
      }
      return isEng
        ? `🛍️ Impulse Buy Sanity Checker: Tell me the price (e.g. "Can I afford ₹8,000 for a smartwatch?") and I'll calculate if it fits your current wallet balance & monthly budget! 💡`
        : `🛍️ Impulse Buy Check: Price ke saath poochho (e.g. "Kya main ₹8,000 ka watch le sakta hu?") — main tumhare balance aur daily budget se exact check karke bataunga! 💡`;
    }

    // 2. Monthly Audit / Scorecard ("How's my month?", "Kaise hai mera month", "monthly audit")
    if (
      msg.includes('audit') || msg.includes('month') || msg.includes('scorecard') || 
      msg.includes('report') || msg.includes('kaise chal') || msg.includes('how is my') ||
      msg.includes('health') || msg.includes('how am i')
    ) {
      const statusBadge = healthScore >= 75 ? '🌟 Excellent' : healthScore >= 50 ? '⚡ Fair / Moderate' : '⚠️ Action Required';
      return `📊 ZEN FINANCIAL HEALTH SCORECARD\n\n• Health Score: **${healthScore}/100** (${statusBadge})\n• Total Wallet Balance: **${currencySymbol}${totalAccBal.toLocaleString()}**\n• Total Income This Month: **${currencySymbol}${totalIncome.toLocaleString()}**\n• Total Expenses: **${currencySymbol}${totalExpense.toLocaleString()}**\n• Net Savings Rate: **${savingsPct}%**\n• Top Spending Category: **${topCat.toUpperCase()}** (${currencySymbol}${topCatAmt.toLocaleString()})\n• Safe Daily Allowance: **${currencySymbol}${dailySafeSpend}/day** (${daysRemaining} days left)\n\n💡 **Zen Action Advice**: ${savingsPct < 20 ? `Try setting a ${currencySymbol}1,500 limit on ${topCat.toUpperCase()} to push your savings rate above 20%! 🎯` : `You are maintaining a strong savings rate! Keep allocating extra funds to your savings goals. 🚀`}`;
    }

    // 3. 50/30/20 Rule Plan
    if (msg.includes('50/30/20') || msg.includes('50-30-20') || msg.includes('rule') || msg.includes('budgeting rule')) {
      const baseIncome = totalIncome > 0 ? totalIncome : 50000;
      const needs = Math.round(baseIncome * 0.5);
      const wants = Math.round(baseIncome * 0.3);
      const savings = Math.round(baseIncome * 0.2);

      return `💡 50/30/20 BUDGETING FRAMEWORK (${totalIncome > 0 ? `Based on ${currencySymbol}${totalIncome.toLocaleString()} Income` : 'Based on ₹50,000 Benchmark'}):\n\n• **50% Needs (${currencySymbol}${needs.toLocaleString()})**: Rent, groceries, electricity, medicines & essentials.\n• **30% Wants (${currencySymbol}${wants.toLocaleString()})**: Dining out, movies, shopping & entertainment.\n• **20% Savings (${currencySymbol}${savings.toLocaleString()})**: Emergency fund, SIPs & debt repayment.\n\n📊 Your Current Spent vs Income: ${currencySymbol}${totalExpense.toLocaleString()} (${totalIncome > 0 ? Math.round((totalExpense/totalIncome)*100) : 0}% of income spent). Keep your wants under ${currencySymbol}${wants.toLocaleString()}! 🌿`;
    }

    // 4. Emergency Fund Plan
    if (msg.includes('emergency') || msg.includes('fund') || msg.includes('bipat') || msg.includes('backup')) {
      const monthlyNeed = totalExpense > 0 ? totalExpense : 20000;
      const target3Mo = monthlyNeed * 3;
      const target6Mo = monthlyNeed * 6;
      const fundedPct = Math.min(100, Math.round((totalAccBal / target3Mo) * 100));

      return `🛡️ EMERGENCY FUND ROADMAP:\n\n• Monthly Expense Velocity: **${currencySymbol}${monthlyNeed.toLocaleString()}**\n• 3-Month Minimum Target: **${currencySymbol}${target3Mo.toLocaleString()}**\n• 6-Month Gold Standard: **${currencySymbol}${target6Mo.toLocaleString()}**\n• Your Current Wallet Funded: **${currencySymbol}${totalAccBal.toLocaleString()}** (${fundedPct}% of 3-Mo target)\n\n💡 **Zen Advice**: Keep this money in a separate high-yield liquid bank account or FD. Never touch it for impulse shopping! 🌿`;
    }

    // 5. Account Balance & Wallet Questions
    if (
      msg.includes('balance') || msg.includes('account') || msg.includes('wallet') || 
      msg.includes('paisa') || msg.includes('paise') || msg.includes('kitna ha') || 
      msg.includes('kitna hai') || msg.includes('kitne hai') || msg.includes('kitna paisa') ||
      msg.includes('kitna bacha') || msg.includes('kitne bache')
    ) {
      if (isEng) {
        return `💳 Your total Wallet / Bank Account balance is **${currencySymbol}${totalAccBal.toLocaleString()}**! ${accDetails ? `\n\nAccounts Breakdown: ${accDetails}` : ''} 📊✨`;
      }
      return `💳 Aapka current Total Wallet / Bank Account balance **${currencySymbol}${totalAccBal.toLocaleString()}** hai! ${accDetails ? `\n\nAccounts Breakdown: ${accDetails}` : ''} 📊✨`;
    }

    // 6. User Details (Name, Email)
    if (msg.includes('mera email') || msg.includes('my email') || msg.includes('meri email') || msg.includes('email kya')) {
      const userEmail = localStorage.getItem('zb_user_email') || 'Not found';
      return isEng ? `📧 Your registered email is **${userEmail}**! ✨` : `📧 Aapki registered email id **${userEmail}** hai! ✨`;
    }
    
    if (msg.includes('mera name') || msg.includes('my name') || msg.includes('mera naam') || msg.includes('mera id') || msg.includes('my id') || msg.includes('naam kya')) {
      return isEng ? `👤 Your registered name is **${userName || 'User'}**! ✨` : `👤 Aapka registered naam **${userName || 'User'}** hai! ✨`;
    }

    // 7. Monthly Income / Earnings
    if (msg.includes('income') || msg.includes('salary') || msg.includes('kamai') || msg.includes('credited') || msg.includes('kitni aayi') || msg.includes('kitna kamaya') || msg.includes('aaya')) {
      if (isEng) {
        return `💵 Total Income / Credit this month is **${currencySymbol}${totalIncome.toLocaleString()}**! Keep tracking every credit entry to maintain an accurate ledger. 📈✨`;
      }
      return `💵 Iss month aapki total Income / Credit **${currencySymbol}${totalIncome.toLocaleString()}** hai! Daily entries log karke aap exact savings rate monitor kar sakte ho. 📈✨`;
    }

    // 8. Recent Transactions Logged
    if (msg.includes('transaction') || msg.includes('history') || msg.includes('recent') || msg.includes('pichla') || msg.includes('last entry') || msg.includes('kharcha list')) {
      if (recentTxsText) {
        if (isEng) {
          return `📝 Recent Transactions Logged:\n• ${recentTxsText.replace(/; /g, '\n• ')}\n\nView full detailed history under "Ledger" tab! 📊`;
        }
        return `📝 Recent Transactions Logged:\n• ${recentTxsText.replace(/; /g, '\n• ')}\n\nPoori detail ke liye "Ledger" tab dekhein! 📊`;
      }
    }

    // 9. Category Budgets
    if (msg.includes('budget') || msg.includes('limit') || msg.includes('category limit')) {
      if (budgetSummaryText) {
        if (isEng) {
          return `📊 Active Category Budgets & Spending:\n• ${budgetSummaryText.replace(/, /g, '\n• ')}\n\nManage limits under "Limits" tab! 💡`;
        }
        return `📊 Active Category Budgets & Spending:\n• ${budgetSummaryText.replace(/, /g, '\n• ')}\n\nLimits set karke aap monthly savings increase kar sakte ho! 💡`;
      }
    }

    // 10. Savings Goals
    if (msg.includes('goal') || msg.includes('target') || msg.includes('bachat target') || msg.includes('saving goal')) {
      if (goalSummaryText) {
        if (isEng) {
          return `🎯 Savings Goals Progress:\n• ${goalSummaryText.replace(/, /g, '\n• ')}\n\nKeep contributing to reach your targets faster! 🚀`;
        }
        return `🎯 Savings Goals Progress:\n• ${goalSummaryText.replace(/, /g, '\n• ')}\n\nDaily small savings se aapke saare goals jaldi complete honge! 🚀`;
      }
    }

    // 11. Customer Support / Email / Contact
    if ((msg.includes('email') && !msg.includes('mera') && !msg.includes('my') && !msg.includes('kya')) || msg.includes('support') || msg.includes('contact') || msg.includes('helpdesk') || msg.includes('customer') || msg.includes('mail')) {
      if (isEng) {
        return `📧 Official Support Email: **hello.zenbudget@zohomail.in**\n\nOur team is active 24/7 and usually responds within 2-4 hours! You can also leave direct feedback in the "Rate App" tab above. 🌿✨`;
      }
      return `📧 Official Support Email: **hello.zenbudget@zohomail.in**\n\nAap humein kisi bhi help ya query ke liye hello.zenbudget@zohomail.in par mail kar sakte ho! Aap "Rate App" tab se direct feedback bhi bhej sakte ho! 🌿✨`;
    }

    // 12. Loans & EMI Tracker Questions
    if (msg.includes('loan') || msg.includes('borrow') || msg.includes('udhaar') || msg.includes('emi') || msg.includes('lent') || msg.includes('repay')) {
      if (isEng) {
        return `💳 Loans & EMI Tracker: Track money borrowed (Loans Taken) or lent (Loans Given) with automatic due dates, late warning badges, monthly EMI breakdowns, and one-click repayments! Go to "More" -> "Loans & Borrowings". 📊`;
      }
      return `💳 Loans & Borrowings Tracker: Aap "Loans Taken" (liya hua udhaar) aur "Loans Given" (diya hua paisa) ka exact hisab rakh sakte ho! Isme automatic due date alerts, late warning badges, aur wallet deduction features included hain! 📊`;
    }

    // 13. Highest Spending / Category Analysis (Handles typos like expenstion, expence, expanse, highest, max)
    if (
      msg.includes('kahan') || msg.includes('sabse zyada') || msg.includes('kharcha') ||
      msg.includes('highest') || msg.includes('spending') || msg.includes('expense') ||
      msg.includes('expence') || msg.includes('expenstion') || msg.includes('expanse') ||
      msg.includes('maximum') || msg.includes('max') || msg.includes('bada')
    ) {
      if (isEng) {
        return `📊 Your highest expense category this month is **${topCat.toUpperCase()}** (${currencySymbol}${topCatAmt.toLocaleString()}) out of total spending of ${currencySymbol}${totalExpense.toLocaleString()}. 💡 Tip: Set a monthly budget limit on ${topCat.toUpperCase()} to save ${currencySymbol}2,000+ extra each month! 🌿`;
      }
      return `📊 Iss month aapka sabse zyada kharcha **${topCat.toUpperCase()}** category me hua hai (${currencySymbol}${topCatAmt.toLocaleString()})! Total monthly spending: ${currencySymbol}${totalExpense.toLocaleString()}. 💡 Tip: ${topCat.toUpperCase()} par 15% budget limit set karke aap har mahine ₹2,000+ save kar sakte ho! 🌿`;
    }

    // 14. Extra Savings Strategy
    if (msg.includes('bachayein') || msg.includes('save') || msg.includes('saving') || msg.includes('5000') || msg.includes('paise kaise')) {
      if (isEng) {
        return `🎯 3 Steps to Save ${currencySymbol}5,000 Extra: 1️⃣ Transfer 20% of your income to savings right after payday. 2️⃣ Set strict monthly category budget limits. 3️⃣ Use Quick Capture to log every daily expense! 💪✨`;
      }
      return `🎯 Extra ${currencySymbol}5,000 bachane ke 3 simple steps: 1️⃣ Salary aate hi 20% alag savings account me transfer kar do. 2️⃣ ${topCat.toUpperCase()} category par strict monthly limit set karo. 3️⃣ Daily Quick Capture se har entry ka record rakho! 💪✨`;
    }

    // 15. General Greetings & Casual Hinglish Callouts
    if (
      /^(hi+|hello+|hey+|yo+|sup|hola|namaste|salam|are+|oye+|bhai+|bro+|bol)\b/i.test(msg) ||
      msg.includes('bhai') || msg.includes('bro') || msg.includes('kaise ho') || msg.includes('kaisa hai') || 
      msg.includes('kaisa h') || msg.includes('aur batao') || msg.includes('who are you') || msg.includes('kaise hain') || msg.includes('kya hal')
    ) {
      if (/[अ-ह]/.test(rawText) || /\b(kahan|kaise|kaisa|mera|meri|mere|mujhe|btao|batao|apka|aapka|kya|kab|kaun|hai|hain|rha|rhi|rhe|hoga|hogaye|bhai|yaar|karo|do|karna|are|oye|bro)\b/i.test(msg)) {
        return `Hii ${userName || 'yaar'}! 🌿 Main Zen hu — aapka AI Financial Coach aur personal money buddy. Main aapki spending habits check kar sakta hu, savings tips de sakta hu, aur ZenBudget app ke details samjha sakta hu! Poocho yaar, kya help chahiye? 🤝✨`;
      }
      return `Hii ${userName || 'buddy'}! 🌿 I'm Zen — your personal AI Financial Coach & best friend. I can analyze your monthly spending habits, give you smart savings advice, and help you track every rupee in ZenBudget. Ask me anything, I'm here to help you save! 🤝✨`;
    }

    // 16. Universal Intelligent Conversational Fallback
    if (isEng) {
      return `🌿 Hii ${userName || 'friend'}! I'm Zen — your personal AI Financial Coach. Right now, your total wallet balance is **${currencySymbol}${totalAccBal.toLocaleString()}**, monthly income is **${currencySymbol}${totalIncome.toLocaleString()}**, total expenses are **${currencySymbol}${totalExpense.toLocaleString()}**, and top spending category is **${topCat.toUpperCase()}** (${currencySymbol}${topCatAmt.toLocaleString()}).\n\nAsk me about your balance, loans, category spending, impulse buy checks (e.g. "Can I afford ₹5,000?"), or any money advice! 💡✨`;
    }
    return `🌿 Hii ${userName || 'yaar'}! Main Zen hu — aapka AI Financial Coach. Abhi aapka total balance **${currencySymbol}${totalAccBal.toLocaleString()}** hai, iss month income **${currencySymbol}${totalIncome.toLocaleString()}**, total kharcha **${currencySymbol}${totalExpense.toLocaleString()}**, aur sabse zyada kharcha **${topCat.toUpperCase()}** (${currencySymbol}${topCatAmt.toLocaleString()}) me hua hai.\n\nAap mujhse balance, loans, spending habits, impulse buy checks (e.g. "Kya main ₹5,000 ka item le sakta hu?") ya kisi bhi financial topic ke baare me pooch sakte ho! 🤝✨`;
  }

  const [conversationMemory, setConversationMemory] = useState<ConversationMemoryState>({
    lastCategory: null,
    lastPeriod: null,
    lastSubject: null,
    lastAmount: null,
    lastMerchants: null
  });

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const rawText = (customPrompt || inputVal).trim();
    if (!rawText) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: rawText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    let botResponseText = '';
    
    // Initialize Deterministic Financial Intelligence Engine
    const engine = new ZenFinancialIntelligenceEngine(transactions, budgets, goals, accounts, loans);
    const structCtx = engine.generateStructuredContext();
    const resolvedResult = resolveUserFinancialQuery(rawText, engine, conversationMemory, userName, currencySymbol);

    // Update multi-turn conversational state
    setConversationMemory(resolvedResult.updatedState);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `You are Zen, an expert personal finance AI coach built into ZenBudget.
You MUST ALWAYS answer from verified, structured live user financial data provided below.

CRITICAL FINANCIAL RULES:
0. STRICT DOMAIN BOUNDARY: You are exclusively a Personal Finance & ZenBudget App AI Coach. If the user asks ANY non-financial or off-topic question (e.g. recipes like 'egg kaise bante ha', cooking, movies, coding, weather, sports, trivia), strictly decline the request in a polite, witty way and redirect them back to personal finance, budgeting, and savings. Example response: "Main aapka AI Financial Coach hu! 💸 Main sirf money, budget aur savings handle karta hu. Recipe ke liye YouTube/Google dekhein, par agar grocery budget plan karna ho toh batao! 😉🌿"
1. ALWAYS use the exact numbers from the provided structured JSON context. NEVER invent or hallucinate financial numbers.
2. Direct Answer: Answer the user's specific question immediately with verified data.
3. Personalized Observation: Point out category leaks, MoM change %, or pattern (e.g. weekend spending ratio or small repeated treats).
4. APP USAGE INQUIRIES: If asked how to use ZenBudget ("kaise use kare", "how to use"), explain: + Add quick capture, 50/30/20 category budgets, Couple & Family sync, Impulse purchase 48-hr blocker, Wealth compound simulator, Weekly & Monthly Spotify-style Wrapped stories, and 24/7 AI Coach.
5. PRICING & PREMIUM INQUIRIES: If asked about prices or premium cost ("pricing", "cost", "premium price", "kitna lagta hai"), explain: Free Forever plan available, Pro Monthly at ₹99/mo, Pro Annual at ₹699/yr (>40% discount), Pro Lifetime at ₹1,999, and Referral bonus (invite 10 friends = 1 month free). Mention Premium benefits: unlimited categories, unlimited AI coach advice, couple sync, PDF/Excel export.
6. BENEFITS INQUIRIES: If asked about benefits ("benefits", "kya fayda hai", "why use"), explain: Saves ₹15,000+ monthly, eliminates month-end money anxiety with safe daily spend (${currencySymbol}${structCtx.safeDailySpend}/day), 100% private encrypted local storage, couple sync transparency, and gamified streaks.
7. Tone Matching: Match user's language and tone naturally (Casual Hinglish vs Formal English).
8. Proactive Context: If user asks about remaining budget, ALWAYS proactively mention upcoming recurring payments (${currencySymbol}${structCtx.upcomingRecurring}) and the realistic safe daily pace.

LIVE STRUCTURED FINANCIAL CONTEXT (JSON):
${JSON.stringify(structCtx, null, 2)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: rawText,
          config: {
            systemInstruction: systemInstruction,
          }
        });

        botResponseText = response.text || resolvedResult.responseText;
      } else {
        // Try serverless API endpoint
        try {
          const sysInstr = `You are Zen, an expert personal finance AI coach built into ZenBudget. Live user context: ${JSON.stringify(structCtx)}`;
          const apiRes = await fetch('/api/groq-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: sysInstr },
                { role: 'user', content: rawText }
              ]
            })
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            const content = data?.choices?.[0]?.message?.content;
            if (content) botResponseText = content;
          }
        } catch (serverlessErr) {
          console.warn('Serverless AI call error', serverlessErr);
        }

        if (!botResponseText) {
          botResponseText = resolvedResult.responseText;
        }
      }
    } catch (err) {
      console.warn('Gemini API execution error, using deterministic Intelligence Engine response:', err);
      botResponseText = resolvedResult.responseText;
    }

    const botResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: botResponseText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false);
  };

  const handleMessageFeedback = async (messageId: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [messageId]: type }));
    // Ideally, we would insert this into the ai_message_feedback table in Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('ai_message_feedback').insert([{
          user_id: user.id,
          message_id: messageId,
          feedback: type === 'up' ? 'thumbs_up' : 'thumbs_down',
          created_at: new Date().toISOString()
        }]);
      }
    } catch (e) {
      console.warn("Could not save feedback", e);
    }
  };

  const greetingTime = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const suggestedChips = [
    "🔥 Roast my spending",
    "📊 How's my month?",
    "🛍️ Can I afford ₹5,000?",
    "💡 50/30/20 Budget Rule",
    "🛡️ Emergency Fund Plan",
    "🎯 How to save ₹5,000 extra?",
    "💳 Highest expense category?"
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '85vh',
          maxHeight: '640px',
          display: 'flex',
          flexDirection: 'column',
          padding: '18px',
          borderRadius: '26px',
          position: 'relative',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.15)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Support & AI Assistant</h3>
          </div>
          <button 
            onClick={onClose}
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
            <X size={14} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexShrink: 0 }}>
          <button 
            onClick={() => setActiveTab('faq')}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'faq' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.02)',
              color: activeTab === 'faq' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            FAQs & Info
          </button>
          <button 
            onClick={() => setActiveTab('bot')}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'bot' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.02)',
              color: activeTab === 'bot' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <Bot size={12} /> AI Coach
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'feedback' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.02)',
              color: activeTab === 'feedback' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <Star size={12} /> Rate App
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', paddingRight: '4px' }}>
          {activeTab === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-fade-in">
              {/* Contact Card */}
              <div style={{
                padding: '12px',
                borderRadius: '14px',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Mail size={16} style={{ color: 'var(--primary)' }} />
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Official Support Email</span>
                  <a href="mailto:hello.zenbudget@zohomail.in" style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}>
                    hello.zenbudget@zohomail.in
                  </a>
                </div>
              </div>

              {/* FAQs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Frequently Asked Questions
                </h4>
                {faqList.map((faq, idx) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-input)' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px' }}>❓ {faq.q}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bot' && (
            /* AI Chatbot tab */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }} className="animate-fade-in">
              {/* API key is now completely hidden - works silently in background */}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingBottom: '10px' }}>
                
                {/* AI Chat Home Screen (Always visible at top) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
                  
                  {/* Greeting & Mode Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {greetingTime}, {userName} 👋
                      </h2>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        Your spending looks mostly on track.
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsRoastMode(!isRoastMode)}
                      style={{
                        background: isRoastMode ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)',
                        border: `1px solid ${isRoastMode ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-input)'}`,
                        borderRadius: '100px',
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: isRoastMode ? '#ef4444' : 'var(--text-secondary)'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>😂</span>
                      <span style={{ fontSize: '10px', fontWeight: 700 }}>Roast Mode</span>
                    </button>
                  </div>

                  {/* Overview Cards */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, background: 'var(--bg-input)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border-input)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>SPENT</span>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{currencySymbol}{totalExpense.toLocaleString()}</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-input)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border-input)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>FLEXIBLE LEFT</span>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>{currencySymbol}{Math.max(0, flexMoney - totalExpense).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Dynamic Insight */}
                  {topCatAmt > 0 && (
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '16px', display: 'flex', gap: '10px' }}>
                      <div style={{ width: '24px', height: '24px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles size={12} color="#3b82f6" />
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>Zen Noticed</span>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                          {topCat} spending is your highest this month at {currencySymbol}{topCatAmt.toLocaleString()}. Watch out!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Prompt Chips - Only show before chat starts */}
                  {messages.length === 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {suggestedChips.map(chip => (
                        <button
                          key={chip}
                          onClick={() => handleSend(undefined, chip)}
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-input)',
                            padding: '8px 12px',
                            borderRadius: '100px',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left'
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {messages.map((m) => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div 
                      style={{
                        display: 'flex',
                        gap: '8px',
                      }}
                    >
                      {m.sender === 'bot' && (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isRoastMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Bot size={13} style={{ color: isRoastMode ? '#ef4444' : 'var(--primary)' }} />
                        </div>
                      )}
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '2px 14px 14px 14px',
                        background: m.sender === 'user' ? 'linear-gradient(to right, var(--primary), var(--secondary))' : 'var(--bg-input)',
                        border: m.sender === 'user' ? 'none' : '1px solid var(--border-input)',
                        color: m.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-line'
                      }}>
                        {m.text}
                        <span style={{ fontSize: '9px', color: m.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', display: 'block', textAlign: 'right', marginTop: '4px' }}>{m.time}</span>
                      </div>
                    </div>
                    
                    {/* Feedback Buttons for Bot Messages */}
                    {m.sender === 'bot' && m.id !== '1' && (
                      <div style={{ display: 'flex', gap: '8px', paddingLeft: '32px' }}>
                        <button 
                          onClick={() => handleMessageFeedback(m.id, 'up')}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', 
                            color: feedbackGiven[m.id] === 'up' ? 'var(--primary)' : 'var(--text-muted)'
                          }}
                        >
                          <ThumbsUp size={12} fill={feedbackGiven[m.id] === 'up' ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                          onClick={() => handleMessageFeedback(m.id, 'down')}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', transform: 'scaleY(-1)',
                            color: feedbackGiven[m.id] === 'down' ? '#ef4444' : 'var(--text-muted)'
                          }}
                        >
                          <ThumbsUp size={12} fill={feedbackGiven[m.id] === 'down' ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={13} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: '2px 14px 14px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', fontSize: '11px' }}>
                      ZenBot is typing...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={(e) => handleSend(e)} style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-input)', paddingTop: '10px', flexShrink: 0 }}>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask ZenBot..."
                  style={{
                    flex: 1,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'var(--primary)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }} className="animate-fade-in">
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monthly Feedback & Rating ⭐
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                How would you rate ZenBudget this month? Help us improve!
              </p>

              {feedbackSuccess ? (
                <div style={{
                  padding: '24px 16px',
                  borderRadius: '16px',
                  background: 'rgba(34, 197, 94, 0.05)',
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  textAlign: 'center',
                  marginTop: '10px'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Feedback Submitted!</h5>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Thank you for your rating! We review all submissions monthly.
                  </p>
                  <button
                    onClick={() => {
                      setFeedbackSuccess(false);
                      setComment('');
                    }}
                    style={{
                      marginTop: '16px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Submit Another
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  {/* Star Rating Selectors */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '10px 0' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: star <= rating ? '#f59e0b' : 'var(--text-muted)',
                          transition: 'transform 0.1s ease'
                        }}
                      >
                        <Star size={28} fill={star <= rating ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>SUGGESTIONS / FEEDBACK</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What can we improve? (Optional)"
                      style={{
                        height: '75px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-input)',
                        borderRadius: '10px',
                        padding: '10px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={async () => {
                      const curMonth = new Date().toLocaleString('default', { month: 'long' });
                      const curYear = new Date().getFullYear();

                      // Save rating locally
                      localStorage.setItem(
                        `zb_monthly_feedback_${new Date().getMonth()}_${curYear}`,
                        JSON.stringify({ rating, comment, date: new Date().toISOString() })
                      );

                      // Save rating to Supabase (Admin Panel live review sync)
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        const ratingUserName = localStorage.getItem('zb_user_name') || user?.user_metadata?.full_name || user?.user_metadata?.name || 'ZenBudget User';
                        const ratingUserEmail = (user?.email || localStorage.getItem('zb_user_email') || 'user@example.com').trim().toLowerCase();
                        const ratingUserId = user?.id || localStorage.getItem('zb_profile_id') || null;
                        const trimmedComment = comment.trim();
                        const feedbackText = trimmedComment ? trimmedComment : `${rating} Star rating submitted`;

                        const ratingPayload: any = {
                          user_name: ratingUserName,
                          user_email: ratingUserEmail,
                          rating_stars: rating,
                          feedback: feedbackText,
                          created_at: new Date().toISOString()
                        };

                        const { error: insertErr } = await supabase.from('app_ratings').insert([ratingPayload]);
                        if (insertErr) {
                          console.warn('Supabase app_ratings insert warning:', insertErr);
                          // Retry without created_at
                          const retryPayload: any = { user_name: ratingUserName, user_email: ratingUserEmail, rating_stars: rating, feedback: feedbackText };
                          const { error: retryErr } = await supabase.from('app_ratings').insert([retryPayload]);
                          if (retryErr) {
                            console.error('Supabase app_ratings insert retry error:', retryErr);
                          } else {
                            console.log('✅ Rating saved to Supabase app_ratings on retry');
                          }
                        } else {
                          console.log('✅ Rating & feedback saved to Supabase app_ratings');
                        }
                      } catch (err) {
                        console.warn('Rating save to Supabase failed:', err);
                      }

                      setFeedbackSuccess(true);

                      // Play success sound
                      try {
                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.15);
                        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                        osc.start();
                        osc.stop(audioCtx.currentTime + 0.15);
                      } catch {}
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)'
                    }}
                  >
                    Submit Rating ⭐
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
