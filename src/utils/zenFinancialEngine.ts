import type { Transaction, CategoryBudget, SavingsGoal, Account, LoanRecord, CategoryType } from '../types';

export interface SpendingPattern {
  weekendVsWeekdayRatio: number; // e.g. 1.8 means weekends are 1.8x higher daily avg
  weekendExpenseTotal: number;
  weekdayExpenseTotal: number;
  weekendDailyAvg: number;
  weekdayDailyAvg: number;
  topMerchants: Array<{ name: string; count: number; total: number }>;
  smallRepeatedCount: number; // transactions under 300 rs
  smallRepeatedTotal: number;
  categorySpikes: Array<{ category: string; thisMonth: number; lastMonth: number; growthPct: number }>;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  pctOfTotal: number;
  transactionCount: number;
  lastMonthAmount: number;
  changeVsLastMonthPct: number | null;
}

export interface StructuredFinancialContext {
  periodName: string;
  daysInMonth: number;
  currentDayOfMonth: number;
  daysRemaining: number;
  
  totalAccBal: number;
  accountsBreakdown: Array<{ name: string; type: string; balance: number }>;
  
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  
  budgetTotal: number;
  budgetSpent: number;
  budgetRemaining: number;
  
  upcomingRecurring: number; // EMIs & loans due
  flexibleRemaining: number; // Total liquid - upcoming fixed
  safeDailySpend: number;
  
  topCategories: CategoryBreakdownItem[];
  previousMonth: {
    totalIncome: number;
    totalExpense: number;
    topCategory: string;
    topCatAmount: number;
    savingsRate: number;
  };

  forecastMonthEnd: number;
  spendingPace: 'frugal' | 'normal' | 'elevated' | 'critical';
  financialRisk: 'low' | 'moderate' | 'high';
  
  patterns: SpendingPattern;
  goalsProgress: Array<{ name: string; current: number; target: number; pct: number }>;
  loanStatus: { totalBorrowed: number; totalLent: number; pendingEmisMonth: number };
  
  recentTransactionsCount: number;
  hasEnoughData: boolean;
}

export interface AffordabilityResult {
  status: 'comfortable' | 'possible_but_tight' | 'risky' | 'not_recommended';
  amount: number;
  itemName?: string;
  availableBalance: number;
  flexibleRemaining: number;
  upcomingRecurring: number;
  daysRemaining: number;
  newDailySpendPace: number;
  postPurchaseBuffer: number;
  verdictTitle: string;
  verdictExplanation: string;
  recommendation: string;
}

export interface ConversationMemoryState {
  lastCategory: string | null;
  lastPeriod: 'this_month' | 'last_month' | 'today' | 'custom' | null;
  lastSubject: 'category' | 'budget' | 'affordability' | 'overall' | 'loan' | 'goal' | 'pattern' | null;
  lastAmount: number | null;
  lastMerchants: string[] | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// 1. ENGINE IMPLEMENTATION: DETERMINISTIC CALCULATIONS & ANALYTICS
// ════════════════════════════════════════════════════════════════════════════════

export class ZenFinancialIntelligenceEngine {
  private transactions: Transaction[];
  private budgets: CategoryBudget[];
  private goals: SavingsGoal[];
  private accounts: Account[];
  private loans: LoanRecord[];
  private currentDate: Date;

  constructor(
    transactions: Transaction[] = [],
    budgets: CategoryBudget[] = [],
    goals: SavingsGoal[] = [],
    accounts: Account[] = [],
    loans: LoanRecord[] = [],
    currentDate: Date = new Date()
  ) {
    this.transactions = Array.isArray(transactions) ? transactions : [];
    this.budgets = Array.isArray(budgets) ? budgets : [];
    this.goals = Array.isArray(goals) ? goals : [];
    this.accounts = Array.isArray(accounts) ? accounts : [];
    this.loans = Array.isArray(loans) ? loans : [];
    this.currentDate = currentDate;
  }

  // Helper to extract date range transactions
  public getTransactionsInRange(startDate: Date, endDate: Date): Transaction[] {
    return this.transactions.filter(t => {
      if (!t || !t.date) return false;
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d >= startDate && d <= endDate;
    });
  }

  // 1.1 Get Spending Summary for specific period
  public get_spending_summary(period: 'this_month' | 'last_month' | 'today' | 'all' = 'this_month') {
    const curYear = this.currentDate.getFullYear();
    const curMonth = this.currentDate.getMonth();

    let filtered: Transaction[] = [];
    if (period === 'today') {
      const todayStr = this.currentDate.toISOString().split('T')[0];
      filtered = this.transactions.filter(t => t.date === todayStr);
    } else if (period === 'this_month') {
      filtered = this.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      });
    } else if (period === 'last_month') {
      const lastMonthDate = new Date(curYear, curMonth - 1, 1);
      const lmYear = lastMonthDate.getFullYear();
      const lmMonth = lastMonthDate.getMonth();
      filtered = this.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === lmYear && d.getMonth() === lmMonth;
      });
    } else {
      filtered = this.transactions;
    }

    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const saved = Math.max(0, income - expense);
    const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0;

    return {
      period,
      count: filtered.length,
      income,
      expense,
      netSaved: saved,
      savingsRate
    };
  }

  // 1.2 Category Breakdown with MoM comparison
  public get_category_breakdown(period: 'this_month' | 'last_month' = 'this_month'): CategoryBreakdownItem[] {
    const curYear = this.currentDate.getFullYear();
    const curMonth = this.currentDate.getMonth();

    const targetMonth = period === 'this_month' ? curMonth : (curMonth - 1 + 12) % 12;
    const targetYear = period === 'this_month' ? curYear : (curMonth === 0 ? curYear - 1 : curYear);

    const prevMonth = (targetMonth - 1 + 12) % 12;
    const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;

    const currentTxs = this.transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const previousTxs = this.transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const totalExpense = currentTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const currentMap: Record<string, { amt: number; count: number }> = {};
    currentTxs.forEach(t => {
      const cat = t.category || 'other';
      if (!currentMap[cat]) currentMap[cat] = { amt: 0, count: 0 };
      currentMap[cat].amt += Number(t.amount) || 0;
      currentMap[cat].count += 1;
    });

    const prevMap: Record<string, number> = {};
    previousTxs.forEach(t => {
      const cat = t.category || 'other';
      prevMap[cat] = (prevMap[cat] || 0) + (Number(t.amount) || 0);
    });

    const items: CategoryBreakdownItem[] = Object.entries(currentMap).map(([category, data]) => {
      const lastAmt = prevMap[category] || 0;
      let changePct: number | null = null;
      if (lastAmt > 0) {
        changePct = Math.round(((data.amt - lastAmt) / lastAmt) * 100);
      }
      return {
        category,
        amount: data.amt,
        pctOfTotal: totalExpense > 0 ? Math.round((data.amt / totalExpense) * 100) : 0,
        transactionCount: data.count,
        lastMonthAmount: lastAmt,
        changeVsLastMonthPct: changePct
      };
    });

    return items.sort((a, b) => b.amount - a.amount);
  }

  // 1.3 Budget Status & Remaining Budget
  public get_budget_status() {
    const breakdown = this.get_category_breakdown('this_month');
    const catExpenseMap: Record<string, number> = {};
    breakdown.forEach(b => { catExpenseMap[b.category] = b.amount; });

    const budgetItems = this.budgets.map(b => {
      const spent = catExpenseMap[b.category] || 0;
      const limit = Number(b.limit) || 0;
      const remaining = Math.max(0, limit - spent);
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        category: b.category,
        limit,
        spent,
        remaining,
        percentage: pct,
        isOverBudget: spent > limit
      };
    });

    const totalLimit = budgetItems.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
    const totalRemaining = Math.max(0, totalLimit - totalSpent);

    return {
      totalLimit,
      totalSpent,
      totalRemaining,
      items: budgetItems
    };
  }

  // 1.4 Upcoming Recurring Payments & Loans Due
  public get_upcoming_recurring_payments() {
    const activeLoans = this.loans.filter(l => l.status === 'active' && l.type === 'borrowed');
    let totalMonthlyEmi = 0;
    
    const items = activeLoans.map(l => {
      const emi = Number(l.emiInstallment) || Number(l.totalAmount - (l.paidAmount || 0));
      totalMonthlyEmi += emi;
      return {
        id: l.id,
        personName: l.personName,
        totalAmount: l.totalAmount,
        paidAmount: l.paidAmount || 0,
        emiInstallment: emi,
        dueDate: l.dueDate,
        notes: l.notes || 'Borrowed Loan'
      };
    });

    return {
      totalUpcoming: totalMonthlyEmi,
      count: items.length,
      items
    };
  }

  // 1.5 Spending Patterns (Weekend vs Weekday, Merchant Concentration, Small Repeated Leaks)
  public detect_spending_patterns(): SpendingPattern {
    const curYear = this.currentDate.getFullYear();
    const curMonth = this.currentDate.getMonth();

    const monthTxs = this.transactions.filter(t => {
      if (!t || t.type !== 'expense' || !t.date) return false;
      const d = new Date(t.date);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    });

    let weekendTotal = 0;
    let weekdayTotal = 0;
    let weekendDays = 0;
    let weekdayDays = 0;

    const daysSeen = new Set<string>();
    const merchantMap: Record<string, { count: number; total: number }> = {};
    let smallRepeatedCount = 0;
    let smallRepeatedTotal = 0;

    monthTxs.forEach(t => {
      const d = new Date(t.date);
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const amt = Number(t.amount) || 0;

      daysSeen.add(t.date);

      if (isWeekend) {
        weekendTotal += amt;
      } else {
        weekdayTotal += amt;
      }

      // Small leaks (< ₹300)
      if (amt > 0 && amt <= 300) {
        smallRepeatedCount += 1;
        smallRepeatedTotal += amt;
      }

      // Merchant tracking
      const merchantName = (t.title || 'General Store').trim();
      if (!merchantMap[merchantName]) merchantMap[merchantName] = { count: 0, total: 0 };
      merchantMap[merchantName].count += 1;
      merchantMap[merchantName].total += amt;
    });

    // Calculate daily averages
    daysSeen.forEach(dateStr => {
      const d = new Date(dateStr);
      if (d.getDay() === 0 || d.getDay() === 6) weekendDays += 1;
      else weekdayDays += 1;
    });

    const weekendDailyAvg = weekendDays > 0 ? Math.round(weekendTotal / weekendDays) : 0;
    const weekdayDailyAvg = weekdayDays > 0 ? Math.round(weekdayTotal / weekdayDays) : 0;
    const ratio = weekdayDailyAvg > 0 ? Number((weekendDailyAvg / weekdayDailyAvg).toFixed(1)) : 1;

    const topMerchants = Object.entries(merchantMap)
      .map(([name, data]) => ({ name, count: data.count, total: data.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const categoryBreakdown = this.get_category_breakdown('this_month');
    const categorySpikes = categoryBreakdown
      .filter(c => c.changeVsLastMonthPct !== null && c.changeVsLastMonthPct > 15)
      .map(c => ({
        category: c.category,
        thisMonth: c.amount,
        lastMonth: c.lastMonthAmount,
        growthPct: c.changeVsLastMonthPct || 0
      }));

    return {
      weekendVsWeekdayRatio: ratio,
      weekendExpenseTotal: weekendTotal,
      weekdayExpenseTotal: weekdayTotal,
      weekendDailyAvg,
      weekdayDailyAvg,
      topMerchants,
      smallRepeatedCount,
      smallRepeatedTotal,
      categorySpikes
    };
  }

  // 1.6 Affordability Check Engine
  public affordability_check(amount: number, itemName?: string): AffordabilityResult {
    const ctx = this.generateStructuredContext();
    const itemAmt = Math.max(0, amount);

    const availBal = ctx.totalAccBal;
    const flexRem = ctx.flexibleRemaining;
    const daysRem = ctx.daysRemaining;

    // Remaining money after purchase
    const postPurchaseFlex = flexRem - itemAmt;
    const postPurchaseBal = availBal - itemAmt;
    const newDailyPace = daysRem > 0 ? Math.round(Math.max(0, postPurchaseFlex) / daysRem) : 0;

    let status: AffordabilityResult['status'] = 'comfortable';
    let verdictTitle = '✅ CONFORTABLY AFFORDABLE';
    let verdictExplanation = '';
    let recommendation = '';

    if (itemAmt > availBal) {
      status = 'not_recommended';
      verdictTitle = '🚨 NOT RECOMMENDED (INSUFFICIENT FUNDS)';
      verdictExplanation = `Buying ${itemName ? `"${itemName}"` : 'this item'} costs ${itemAmt.toLocaleString()}, but your total wallet balance is only ${availBal.toLocaleString()}. You are short by ${(itemAmt - availBal).toLocaleString()}.`;
      recommendation = `Set up a Savings Goal in ZenBudget to save for this over the next 2-3 months instead of overdrawing your accounts.`;
    } else if (postPurchaseFlex < 0) {
      status = 'risky';
      verdictTitle = '⚠️ HIGH RISK (CONSUMES UPCOMING BILLS)';
      verdictExplanation = `You have ${availBal.toLocaleString()} in your account, but ${ctx.upcomingRecurring.toLocaleString()} in recurring EMIs/bills are due this month. This purchase would leave you with negative flexible budget (${postPurchaseFlex.toLocaleString()}).`;
      recommendation = `Postpone this purchase until next month after your next salary credit.`;
    } else if (postPurchaseFlex < 2000 || newDailyPace < 250) {
      status = 'possible_but_tight';
      verdictTitle = '⚡ POSSIBLE BUT VERY TIGHT';
      verdictExplanation = `Buying this will consume ${Math.round((itemAmt / (flexRem || 1)) * 100)}% of your remaining flexible money. Your safe daily spending limit will drop from ${ctx.safeDailySpend.toLocaleString()}/day to ${newDailyPace.toLocaleString()}/day for the next ${daysRem} days.`;
      recommendation = `Apply the 48-Hour Wait Rule. If you still desire it in 2 days and stay under budget, proceed.`;
    } else {
      status = 'comfortable';
      verdictTitle = '✅ SAFELY AFFORDABLE';
      verdictExplanation = `This purchase takes ${Math.round((itemAmt / (flexRem || 1)) * 100)}% of your flexible buffer. Your remaining safe allowance is ${newDailyPace.toLocaleString()}/day for ${daysRem} days with a post-purchase buffer of ${postPurchaseFlex.toLocaleString()}.`;
      recommendation = `Enjoy your purchase! Remember to log it under the correct category immediately.`;
    }

    return {
      status,
      amount: itemAmt,
      itemName,
      availableBalance: availBal,
      flexibleRemaining: flexRem,
      upcomingRecurring: ctx.upcomingRecurring,
      daysRemaining: daysRem,
      newDailySpendPace: newDailyPace,
      postPurchaseBuffer: postPurchaseFlex,
      verdictTitle,
      verdictExplanation,
      recommendation
    };
  }

  // 1.7 Generate Full Structured Context Object (Fact Layer)
  public generateStructuredContext(): StructuredFinancialContext {
    const curYear = this.currentDate.getFullYear();
    const curMonth = this.currentDate.getMonth();
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const currentDay = this.currentDate.getDate();
    const daysRemaining = Math.max(1, daysInMonth - currentDay);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const periodName = `${monthNames[curMonth]} ${curYear}`;

    // Account balances
    const totalAccBal = this.accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
    const accountsBreakdown = this.accounts.map(a => ({
      name: a.name || 'Account',
      type: a.type || 'bank',
      balance: Number(a.balance) || 0
    }));

    // Current month transactions summary
    const summaryThisMonth = this.get_spending_summary('this_month');
    const summaryLastMonth = this.get_spending_summary('last_month');

    // Category breakdown
    const topCategories = this.get_category_breakdown('this_month');
    const lastMonthCats = this.get_category_breakdown('last_month');
    const lastMonthTopCat = lastMonthCats.length > 0 ? lastMonthCats[0].category : 'None';
    const lastMonthTopAmt = lastMonthCats.length > 0 ? lastMonthCats[0].amount : 0;

    // Budgets
    const budgetStatus = this.get_budget_status();
    
    // Recurring / EMIs
    const recurringStatus = this.get_upcoming_recurring_payments();
    const upcomingRecurring = recurringStatus.totalUpcoming;

    // Flexible money calculation:
    // Flexible money is available wallet balance minus upcoming fixed recurring obligations
    const flexibleRemaining = Math.max(0, (totalAccBal > 0 ? totalAccBal : Math.max(0, summaryThisMonth.income - summaryThisMonth.expense)) - upcomingRecurring);
    const safeDailySpend = Math.round(flexibleRemaining / daysRemaining);

    // Month-End Forecast: Average daily expense * total days in month
    const dailyPaceSoFar = currentDay > 0 ? summaryThisMonth.expense / currentDay : 0;
    const forecastMonthEnd = Math.round(dailyPaceSoFar * daysInMonth);

    // Spending Pace & Risk evaluation
    let spendingPace: StructuredFinancialContext['spendingPace'] = 'normal';
    let financialRisk: StructuredFinancialContext['financialRisk'] = 'low';

    if (summaryThisMonth.income > 0) {
      const spentRatio = summaryThisMonth.expense / summaryThisMonth.income;
      if (spentRatio > 0.85) {
        spendingPace = 'critical';
        financialRisk = 'high';
      } else if (spentRatio > 0.65) {
        spendingPace = 'elevated';
        financialRisk = 'moderate';
      } else if (spentRatio < 0.3) {
        spendingPace = 'frugal';
      }
    } else if (summaryThisMonth.expense > totalAccBal && totalAccBal > 0) {
      financialRisk = 'high';
      spendingPace = 'critical';
    }

    // Spending Patterns
    const patterns = this.detect_spending_patterns();

    // Savings Goals
    const goalsProgress = this.goals.map(g => {
      const target = Number(g.targetAmount) || 1;
      const curr = Number(g.currentAmount) || 0;
      return {
        name: g.name,
        current: curr,
        target,
        pct: Math.min(100, Math.round((curr / target) * 100))
      };
    });

    // Loans
    const borrowedTotal = this.loans.filter(l => l.type === 'borrowed').reduce((s, l) => s + (l.totalAmount - (l.paidAmount || 0)), 0);
    const lentTotal = this.loans.filter(l => l.type === 'lent').reduce((s, l) => s + (l.totalAmount - (l.paidAmount || 0)), 0);

    const hasEnoughData = this.transactions.length >= 3;

    return {
      periodName,
      daysInMonth,
      currentDayOfMonth: currentDay,
      daysRemaining,
      totalAccBal,
      accountsBreakdown,
      totalIncome: summaryThisMonth.income,
      totalExpense: summaryThisMonth.expense,
      netSavings: summaryThisMonth.netSaved,
      savingsRate: summaryThisMonth.savingsRate,
      budgetTotal: budgetStatus.totalLimit,
      budgetSpent: budgetStatus.totalSpent,
      budgetRemaining: budgetStatus.totalRemaining,
      upcomingRecurring,
      flexibleRemaining,
      safeDailySpend,
      topCategories,
      previousMonth: {
        totalIncome: summaryLastMonth.income,
        totalExpense: summaryLastMonth.expense,
        topCategory: lastMonthTopCat,
        topCatAmount: lastMonthTopAmt,
        savingsRate: summaryLastMonth.savingsRate
      },
      forecastMonthEnd,
      spendingPace,
      financialRisk,
      patterns,
      goalsProgress,
      loanStatus: {
        totalBorrowed: borrowedTotal,
        totalLent: lentTotal,
        pendingEmisMonth: upcomingRecurring
      },
      recentTransactionsCount: this.transactions.length,
      hasEnoughData
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// 2. CONVERSATIONAL INTENT RESOLVER WITH MULTI-TURN MEMORY & TONE MATCHING
// ════════════════════════════════════════════════════════════════════════════════

export function resolveUserFinancialQuery(
  rawQuery: string,
  engine: ZenFinancialIntelligenceEngine,
  memoryState: ConversationMemoryState,
  userName: string = 'Buddy',
  currencySymbol: string = '₹'
): { responseText: string; updatedState: ConversationMemoryState } {
  const query = (rawQuery || '').trim();
  const qLower = query.toLowerCase();

  // Detect Tone
  const isHinglishSlang = /\b(bro|bhai|yaar|scene|gaya|kitna|kaise|batao|uda|set|bol|lo|lelu|kharcha|paisa|paise)\b/i.test(qLower);
  const isFormalEnglish = !/[अ-ह]/.test(rawQuery) && !isHinglishSlang;

  const ctx = engine.generateStructuredContext();
  const updatedState: ConversationMemoryState = { ...memoryState };

  // Empty State Guard - gracefully allow AI to respond to all queries
  const noTxNote = !ctx.hasEnoughData ? `\n\n*(💡 Tip: Quick Capture se 2-3 daily transactions enter karke aap exact spending pattern leaks bhi view kar sakte ho!)*` : '';

  // ─── 0. OFF-TOPIC STRICT BOUNDARY GUARD ───
  const offTopicKeywords = [
    'egg', 'anda', 'recipe', 'maggi', 'khana kaise', 'kaise banaye', 'banta hai', 'bante ha', 'cook', 'cooking', 'biryani',
    'cricket', 'ipl', 'match', 'free fire', 'bgmi', 'pubg', 'movie', 'film', 'song', 'gaana', 'actress', 'actor',
    'python', 'java', 'c++', 'coding', 'program', 'weather', 'mausam', 'rain', 'temperature', 'president', 'prime minister'
  ];

  const financialAppKeywords = [
    'paisa', 'paise', 'money', 'budget', 'save', 'saving', 'savings', 'spend', 'spending', 'expense', 'income', 'salary',
    'loan', 'emi', 'afford', 'buy', 'kharid', 'rupee', 'rs', 'inr', 'zen', 'app', 'account', 'bank', 'balance', 'audit',
    'score', 'roast', 'limit', 'goal', 'history', 'ledger', 'tag', 'transaction', 'transfer', 'sub', 'premium', 'cashfree',
    'hi', 'hello', 'hey', 'sup', 'kaise ho', 'bhai', 'bro', 'naam', 'email', 'id', 'who are you', 'help'
  ];

  const isExplicitOffTopic = offTopicKeywords.some(k => qLower.includes(k));
  const isFinancialOrAppRelated = financialAppKeywords.some(k => qLower.includes(k));

  if (isExplicitOffTopic && !isFinancialOrAppRelated) {
    const offTopicResponse = isFormalEnglish
      ? `⚠️ **Financial AI Coach Mode Active** 💸\n\nI am your personal AI Financial Coach! 🌿 I strictly handle topics related to **personal finance, budgets, savings, wallet balance, loans, and ZenBudget app features**.\n\nFor general non-financial queries, please use Google or YouTube! But if you want to plan your grocery or monthly budget, ask away! 😉✨`
      : `⚠️ **Financial AI Coach Mode Active** 💸\n\nMain aapka personal AI Financial Coach hu! 🌿 Main sirf **money management, budget limits, savings goals, wallet balance, loans, aur ZenBudget app** ke features handle karta hu.\n\nRecipe ya general queries ke liye Google/YouTube dekhein, par agar monthly spending ya grocery budget plan karna ho toh batao! 😉✨`;
    return { responseText: offTopicResponse, updatedState };
  }

  // ─── 0.5 USER INFO & CASUAL GREETINGS INTENT GUARD ───
  if (qLower.includes('email')) {
    const userEmail = typeof localStorage !== 'undefined' 
      ? (localStorage.getItem('zb_user_email') || localStorage.getItem('user_email') || 'hello.zenbudget@zohomail.in')
      : 'hello.zenbudget@zohomail.in';
    const responseText = isFormalEnglish
      ? `📧 Your registered email ID is **${userEmail}**! ✨`
      : `📧 Aapki registered email ID **${userEmail}** hai! ✨`;
    return { responseText, updatedState };
  }

  if (qLower.includes('mera naam') || qLower.includes('my name') || qLower.includes('mera name') || qLower.includes('who are you') || qLower.includes('tum kaun ho') || qLower.includes('naam kya')) {
    const responseText = isFormalEnglish
      ? `👤 Your name is **${userName || 'User'}**! I am Zen — your personal AI Financial Coach in ZenBudget. 🌿✨`
      : `👤 Aapka name **${userName || 'User'}** hai! Main Zen hu — aapka personal AI Financial Coach. 🌿✨`;
    return { responseText, updatedState };
  }

  const isCasualGreeting = /^(hi+|hello+|hey+|sup|yo|hola|namaste|bhai|bro|aur batao|kaise ho|kaisa hai|kya hal|kya haal|kya chal)/i.test(qLower) || 
    qLower.includes('aur batao') || qLower.includes('kaise ho') || qLower.includes('kaisa hai') || qLower.includes('kya hal') || qLower.includes('kya haal');
  
  if (isCasualGreeting && !qLower.includes('food') && !qLower.includes('budget') && !qLower.includes('spend') && !qLower.includes('paisa') && !qLower.includes('balance') && !qLower.includes('afford') && !qLower.includes('buy') && !qLower.includes('use') && !qLower.includes('price') && !qLower.includes('cost') && !qLower.includes('benefit') && !qLower.includes('fayda')) {
    const responseText = isFormalEnglish
      ? `Hii ${userName || 'friend'}! 🌿 I am doing great! How is your spending and budgeting going today? Ask me about your balance, monthly expense breakdown, how to use ZenBudget, pricing & premium, or if you can afford a purchase! 💬✨`
      : `Hii ${userName || 'yaar'}! 🌿 Main bilkul mast hu! Aap batao, aaj ka kharcha kaisa chal raha hai? App kaise use karein, Premium pricing details, ya koi expense detail dekhni ho toh batao! 💬✨`;
    return { responseText, updatedState };
  }

  // ─── 0.6 APP USAGE GUIDE INTENT ("app kaise use kare", "how to use", "features", "kaise chalaye") ───
  const usageKeywords = ['kaise use', 'how to use', 'kaise chalaye', 'guide', 'features', 'kaise kaam', 'how it works', 'tutorial', 'instructions', 'kaise chalana'];
  if (usageKeywords.some(k => qLower.includes(k)) || (qLower.includes('use') && (qLower.includes('app') || qLower.includes('application') || qLower.includes('zenbudget')))) {
    const responseText = isFormalEnglish
      ? `📱 **How to Use ZenBudget Effectively** 🌿\n\n` +
        `1. 📝 **Quick Capture & Log Expenses**: Tap the **"+ Add"** button on the top right or Home screen to log income/expenses in seconds.\n` +
        `2. 📊 **Set Category Budgets**: Define monthly budget caps (Food, Shopping, Bills) to follow the 50/30/20 savings rule.\n` +
        `3. 👥 **Couple & Family Sync**: Sync transactions and budgets in real-time with your partner or family members (found under More Tools).\n` +
        `4. 🛑 **Impulse Blocker**: Pause 48 hours before buying non-essentials to prevent impulse spending.\n` +
        `5. 📈 **Wealth Compound Simulator**: Simulate long-term compound growth for your savings & investments.\n` +
        `6. 🎁 **Weekly Wrapped & Monthly Story**: Experience Spotify-style visual recaps of your spending story.\n` +
        `7. 🤖 **Ask Zen AI Coach 24/7**: Ask me *"Can I afford ₹5,000?"*, *"Where is my money going?"*, *"Pricing details"*, or *"Show food expense"* anytime!`
      : `📱 **ZenBudget Application Kaise Use Karein?** 🌿\n\n` +
        `1. 📝 **Quick Expense Entry**: Main Screen par **"+ Add"** button par tap karke 2 second me apna kharcha ya income log karein.\n` +
        `2. 📊 **Category Budget Set Karein**: Food, Shopping, Bills ke monthly limits set karke 50/30/20 savings rule follow karein.\n` +
        `3. 👥 **Couple & Family Sync**: Partner ya family ke saath real-time shared budget sync karein (More Tools section me).\n` +
        `4. 🛑 **Impulse Purchase Blocker**: Koi mehenga item lene se pehle 48-hour pause timer lagayein taaki impulsive kharcha na ho.\n` +
        `5. 📈 **Wealth Compound Simulator**: Long-term investments aur wealth growth calculate karein.\n` +
        `6. 🎁 **Weekly Wrapped & Monthly Story**: Spotify style animated story me apni monthly money journey dekhein.\n` +
        `7. 🤖 **Zen AI Coach (24/7 Buddy)**: Mujhse kabhi bhi poochhein — *"5000 ka shoe le lu?"*, *"Food me kitna gaya?"*, *"Premium price kya hai?"*, ya *"Safe daily limit kya hai?"*! 🚀`;
    return { responseText, updatedState };
  }

  // ─── 0.7 PRICING & PREMIUM INTENT ("pricing", "premium cost", "kitna lagta hai", "subscription", "price") ───
  const pricingKeywords = ['price', 'pricing', 'cost', 'kitna lagta', 'kitne ka', 'premium buy', 'subscription', 'pro plan', 'buy premium', 'pay', 'charge', 'kitna hai', 'plan', 'charge kitna'];
  if (pricingKeywords.some(k => qLower.includes(k)) || (qLower.includes('premium') && (qLower.includes('cost') || qLower.includes('price') || qLower.includes('buy') || qLower.includes('plan') || qLower.includes('kitna') || qLower.includes('charge')))) {
    const responseText = isFormalEnglish
      ? `💎 **ZenBudget Premium Plans & Pricing** 👑\n\n` +
        `• 🌟 **Free Tier**: Essential daily tracking & budget basics (100% Free Forever!).\n` +
        `• 💳 **Pro Monthly Plan**: **₹99 / month** (Flexible monthly access)\n` +
        `• 🏆 **Pro Annual Plan**: **₹699 / year** *(Save >40%! Best Value)*\n` +
        `• 👑 **Lifetime VIP Pass**: **₹1,999** one-time payment for lifetime access!\n` +
        `• 🎁 **Referral Reward**: Invite 10 friends to get **1 Month Premium 100% FREE**!\n\n` +
        `✨ **What Premium Unlocks**:\n` +
        `✅ Unlimited Custom Budget Categories & Accounts\n` +
        `✅ 24/7 Unlimited Zen AI Money Coach Guidance & Deep Analytics\n` +
        `✅ Couple & Family Real-Time Multi-Device Sync\n` +
        `✅ PDF / Excel Ledger Data Export & Custom App Badges\n\n` +
        `👉 Tap the **"👑 Upgrade to Premium"** button on the header or Profile Settings to upgrade instantly via UPI, Cards, or NetBanking!`
      : `💎 **ZenBudget Premium Pricing & Plans Details** 👑\n\n` +
        `• 🌟 **Free Plan**: Free daily expense tracking & basic budgeting (Bilkul Free Forever!).\n` +
        `• 💳 **Pro Monthly Plan**: **₹99 / month**\n` +
        `• 🏆 **Pro Annual Plan**: **₹699 / year** *(40%+ savings, Subse Popular!)*\n` +
        `• 👑 **Pro Lifetime Access**: **₹1,999** (Ek baar me lifetime ke liye!)\n` +
        `• 🎁 **Free Referral Bonus**: 10 dosto ko invite karein aur **1 Month Premium FREE** paayein!\n\n` +
        `✨ **Premium Buy Karne Ke Benefits**:\n` +
        `✅ Unlimited Custom Categories & Multiple Accounts\n` +
        `✅ 24/7 Unlimited Zen AI Money Coach Advice & Deep Insights\n` +
        `✅ Couple & Family Sync (Real-time partner sync)\n` +
        `✅ PDF & Excel Monthly Report Export\n` +
        `✅ Exclusive Theme Customization & VIP Badges\n\n` +
        `👉 Header me **"👑 Upgrade to Premium"** par click karke UPI (GPay, PhonePe, Paytm) ya Card se instant buy kar sakte hain! 🚀`;
    return { responseText, updatedState };
  }

  // ─── 0.8 APPLICATION BENEFITS INTENT ("benefits", "kya fayda hai", "kyun use kare", "why use zenbudget") ───
  const benefitKeywords = ['benefit', 'benefits', 'fayda', 'faiyda', 'fayde', 'why use', 'kyun use', 'advantage', 'kya khas', 'speciality', 'kya fayda'];
  if (benefitKeywords.some(k => qLower.includes(k))) {
    const responseText = isFormalEnglish
      ? `🌟 **Key Benefits of Using ZenBudget** 💸\n\n` +
        `1. 💰 **Save Up to ₹15,000+ Monthly**: Stop micro-spending leaks and impulse purchases with AI guidance.\n` +
        `2. 🧘 **Zero Month-End Money Anxiety**: ZenBudget calculates your **Safe Daily Pace (${currencySymbol}${ctx.safeDailySpend}/day)** so you never run out of cash.\n` +
        `3. 🤖 **24/7 AI Money Coach**: Instant answers to *"Can I afford this?"* without manual math.\n` +
        `4. 👥 **Shared Partner & Family Transparency**: Sync expenses in real-time with your couple/family.\n` +
        `5. 🔒 **100% Private & Secure**: Encrypted local-first storage with PIN & Biometric App Lock.\n` +
        `6. 🎮 **Gamified Money Habit**: Build daily logging discipline with Money Forest streaks & Spotify-style Wrapped stories!`
      : `🌟 **ZenBudget Application Ke Kya Benefits Hain?** 💸\n\n` +
        `1. 💰 **Monthly ₹15,000+ Tak Ki Savings**: Impulse buying aur chhote micro-leaks stop karke har mahine badi savings hoti hai.\n` +
        `2. 🧘 **Month-End Tension Finish**: App aapko **Safe Daily Allowance (${currencySymbol}${ctx.safeDailySpend}/day)** batata hai jisse mahine ke aakhiri dino me paise ki tangi nahi hoti.\n` +
        `3. 🤖 **24/7 Personal AI Coach**: Koi bhi item lene se pehle AI se instant *"Kya main ₹5,000 afford kar sakta hu?"* check kar sakte ho.\n` +
        `4. 👥 **Partner & Family Sync**: Couple/family ke saath real-time kharcha track karke financial clarity rehti hai.\n` +
        `5. 🔒 **100% Privacy & Security**: Aapka data completely encrypted aur local-first secure rehta hai (PIN/Biometric lock ke saath).\n` +
        `6. 🎁 **Fun & Gamified Experience**: Money Forest streak, badges, aur Spotify-style Monthly Wrapped stories se budgeting fun ban jati hai! 🚀`;
    return { responseText, updatedState };
  }

  // ─── 1. AFFORDABILITY ENGINE ───
  const affordKeywords = ['afford', 'buy', 'kharid', 'le lu', 'le sakta', 'purchase', 'shoe', 'phone', 'watch'];
  const numberMatch = qLower.match(/(\d+[\d,]*)/);
  if (affordKeywords.some(k => qLower.includes(k)) || (numberMatch && (qLower.includes('le') || qLower.includes('buy')))) {
    const itemAmount = numberMatch ? parseInt(numberMatch[1].replace(/,/g, ''), 10) : 0;
    
    if (itemAmount > 0) {
      updatedState.lastSubject = 'affordability';
      updatedState.lastAmount = itemAmount;

      const res = engine.affordability_check(itemAmount);

      if (isFormalEnglish) {
        return {
          responseText: `${res.verdictTitle}\n\n• Item Cost: **${currencySymbol}${itemAmount.toLocaleString()}**\n• Available Wallet Balance: **${currencySymbol}${res.availableBalance.toLocaleString()}**\n• Pending Recurring Obligations: **${currencySymbol}${res.upcomingRecurring.toLocaleString()}**\n• Remaining Flexible Funds: **${currencySymbol}${res.flexibleRemaining.toLocaleString()}**\n\n📌 **Observation**: ${res.verdictExplanation}\n\n💡 **Practical Next Step**: ${res.recommendation}`,
          updatedState
        };
      } else {
        const tonePrefix = res.status === 'comfortable' ? 'Bro overall scene safe hai! 😎' : res.status === 'possible_but_tight' ? 'Bro tight scene hai! ⚡' : 'Bro mat lo abhi, risky hai! 🚨';
        return {
          responseText: `${tonePrefix}\n\n• Item Cost: **${currencySymbol}${itemAmount.toLocaleString()}**\n• Wallet Balance: **${currencySymbol}${res.availableBalance.toLocaleString()}**\n• Flexible Money Left: **${currencySymbol}${res.flexibleRemaining.toLocaleString()}** (Recurring Bills: ${currencySymbol}${res.upcomingRecurring.toLocaleString()})\n\n📌 **Observation**: ${res.verdictExplanation}\n\n💡 **Action Step**: ${res.recommendation}`,
          updatedState
        };
      }
    }
  }

  // ─── 2. MULTI-TURN CATEGORY FOLLOW-UP ("iss month food kitna गया?", "last month?", "difference kitna?") ───
  
  // Category detection from prompt or memory
  const categoriesList = ['food', 'shopping', 'entertainment', 'bills', 'travel', 'health', 'rent', 'groceries', 'other'];
  let matchedCat = categoriesList.find(c => qLower.includes(c));

  // If user says "last month?" or "last month ka?" without specifying category, grab from memory!
  const isFollowUpLastMonth = (qLower.includes('last month') || qLower.includes('pichla') || qLower.includes('pichle')) && !matchedCat && memoryState.lastCategory;
  const isFollowUpDiff = (qLower.includes('diff') || qLower.includes(' अंतर ') || qLower.includes('change') || qLower.includes('farak') || qLower.includes('farq')) && memoryState.lastCategory;

  if (isFollowUpDiff && memoryState.lastCategory) {
    const cat = memoryState.lastCategory;
    const thisMonthCats = engine.get_category_breakdown('this_month');
    const lastMonthCats = engine.get_category_breakdown('last_month');

    const thisAmt = thisMonthCats.find(c => c.category === cat)?.amount || 0;
    const lastAmt = lastMonthCats.find(c => c.category === cat)?.amount || 0;
    const diff = thisAmt - lastAmt;
    const diffPct = lastAmt > 0 ? Math.round((diff / lastAmt) * 100) : 0;

    const responseText = isFormalEnglish
      ? `📊 **${cat.toUpperCase()} Spending Comparison**:\n\n• Current Month: **${currencySymbol}${thisAmt.toLocaleString()}**\n• Previous Month: **${currencySymbol}${lastAmt.toLocaleString()}**\n• Difference: **${diff >= 0 ? '+' : ''}${currencySymbol}${diff.toLocaleString()}** (${diff >= 0 ? `+${diffPct}% higher` : `${diffPct}% lower`})\n\n💡 **Insight**: ${diff > 0 ? `Your ${cat} spending increased by ${diffPct}% this month. Setting a budget limit will help stabilize it.` : `Great job reducing your ${cat} expenses by ${Math.abs(diffPct)}%!`}`
      : `📊 **${cat.toUpperCase()} MoM Comparison**:\n\n• Iss Month: **${currencySymbol}${thisAmt.toLocaleString()}**\n• Last Month: **${currencySymbol}${lastAmt.toLocaleString()}**\n• Difference: **${diff >= 0 ? '+' : ''}${currencySymbol}${diff.toLocaleString()}** (${diff >= 0 ? `${diffPct}% zyada` : `${Math.abs(diffPct)}% kam`})\n\n💡 **Action**: ${diff > 0 ? `${cat.toUpperCase()} me ₹${diff.toLocaleString()} extra gaye hain. Agle 7 din control me rakho! 🎯` : `${cat.toUpperCase()} me savings hui hai, awesome job bro! 🎉`}`;

    return { responseText, updatedState };
  }

  if (isFollowUpLastMonth && memoryState.lastCategory) {
    const cat = memoryState.lastCategory;
    const lastMonthCats = engine.get_category_breakdown('last_month');
    const lastAmt = lastMonthCats.find(c => c.category === cat)?.amount || 0;

    updatedState.lastPeriod = 'last_month';

    const responseText = isFormalEnglish
      ? `Last month, your total **${cat.toUpperCase()}** spending was **${currencySymbol}${lastAmt.toLocaleString()}**.`
      : `Last month **${cat.toUpperCase()}** me total **${currencySymbol}${lastAmt.toLocaleString()}** spent hua tha.`;

    return { responseText, updatedState };
  }

  if (matchedCat) {
    updatedState.lastCategory = matchedCat;
    updatedState.lastSubject = 'category';

    const period = qLower.includes('last month') || qLower.includes('pichla') ? 'last_month' : 'this_month';
    updatedState.lastPeriod = period;

    const cats = engine.get_category_breakdown(period);
    const catItem = cats.find(c => c.category === matchedCat);
    const amt = catItem ? catItem.amount : 0;
    const pct = catItem ? catItem.pctOfTotal : 0;
    const momChange = catItem ? catItem.changeVsLastMonthPct : null;

    const responseText = isFormalEnglish
      ? `📊 **${matchedCat.toUpperCase()} Expense Analysis** (${period === 'this_month' ? 'Current Month' : 'Last Month'}):\n\n• Total Amount Spent: **${currencySymbol}${amt.toLocaleString()}** (${pct}% of total monthly expense)\n• Transactions Count: **${catItem?.transactionCount || 0}**\n${momChange !== null ? `• MoM Growth: **${momChange >= 0 ? `+${momChange}%` : `${momChange}%`}** vs previous month\n` : ''}\n💡 **Advice**: ${pct > 25 ? `Your ${matchedCat} spending is currently taking a high chunk (${pct}%) of total expenses. Try setting a monthly limit.` : `Your ${matchedCat} spending is within a healthy range.`}`
      : `📊 **${matchedCat.toUpperCase()} Expense Details** (${period === 'this_month' ? 'Iss Month' : 'Last Month'}):\n\n• Total Spent: **${currencySymbol}${amt.toLocaleString()}** (${pct}% of total budget)\n• Total Entries: **${catItem?.transactionCount || 0}**\n${momChange !== null ? `• Growth: **${momChange >= 0 ? `+${momChange}%` : `${momChange}%`}** vs last month\n` : ''}\n💡 **Action**: ${pct > 25 ? `${matchedCat.toUpperCase()} heavy lag raha hai bro (${pct}% of total). Monthly limit lagana safe hoga! 🎯` : `${matchedCat.toUpperCase()} control me hai, solid! 👍`}`;

    return { responseText, updatedState };
  }

  // ─── 3. OVERALL MONTHLY SCENE ("bro iss month kya scene hai", "overall status", "how is my month") ───
  if (qLower.includes('scene') || qLower.includes('overall') || qLower.includes('kya hal') || qLower.includes('status') || qLower.includes('month')) {
    updatedState.lastSubject = 'overall';

    const topCat = ctx.topCategories.length > 0 ? ctx.topCategories[0] : null;
    const topCatText = topCat ? `${topCat.category.toUpperCase()} (${currencySymbol}${topCat.amount.toLocaleString()})` : 'None';

    const responseText = isFormalEnglish
      ? `Bro overall monthly financial status:\n\n• Spent: **${currencySymbol}${ctx.totalExpense.toLocaleString()}** out of **${currencySymbol}${ctx.totalIncome > 0 ? ctx.totalIncome.toLocaleString() : 'budget limit'}**.\n• Technically Left: **${currencySymbol}${ctx.budgetRemaining.toLocaleString()}**, but **${currencySymbol}${ctx.upcomingRecurring.toLocaleString()}** in recurring EMIs are due.\n• Realistic Flexible Fund: **${currencySymbol}${ctx.flexibleRemaining.toLocaleString()}**.\n• Top Expense Leak: **${topCatText}**${topCat && topCat.changeVsLastMonthPct ? ` (${topCat.changeVsLastMonthPct}% higher than usual pace)` : ''}.\n\n💡 **Next Step**: Maintain a safe limit of **${currencySymbol}${ctx.safeDailySpend}/day** for the remaining ${ctx.daysRemaining} days to close the month in profit!`
      : `Bro overall scene okay hai 👀\n\nIss month **${currencySymbol}${ctx.totalExpense.toLocaleString()}** spend hua hai out of **${currencySymbol}${ctx.totalIncome > 0 ? ctx.totalIncome.toLocaleString() : ctx.budgetTotal.toLocaleString()}**.\n\n**${currencySymbol}${ctx.budgetRemaining.toLocaleString()}** technically left hai, but **${currencySymbol}${ctx.upcomingRecurring.toLocaleString()}** ke recurring payments abhi due hain, so actual flexible money around **${currencySymbol}${ctx.flexibleRemaining.toLocaleString()}** hai.\n\n${topCat ? `${topCat.category.toUpperCase()} spending usual pace se ${topCat.changeVsLastMonthPct || 15}% higher chal raha hai.\n\n` : ''}Next **${ctx.daysRemaining} days** me **${currencySymbol}${ctx.safeDailySpend}/day** ke around rakho and month safely close ho jayega. 🚀`;

    return { responseText, updatedState };
  }

  // ─── 4. PATTERN DETECTION ("weekend", "leak", "where money going") ───
  if (qLower.includes('weekend') || qLower.includes('leak') || qLower.includes('pattern') || qLower.includes('kaha ja') || qLower.includes('paise कहां')) {
    updatedState.lastSubject = 'pattern';
    const p = ctx.patterns;

    const responseText = isFormalEnglish
      ? `🔍 **Spending Pattern Analysis**:\n\n• **Weekend vs Weekday Pace**: Weekend daily average is **${currencySymbol}${p.weekendDailyAvg.toLocaleString()}/day** vs Weekday **${currencySymbol}${p.weekdayDailyAvg.toLocaleString()}/day** (${p.weekendVsWeekdayRatio}x higher on weekends).\n• **Small Micro-Leaks (<₹300)**: You logged **${p.smallRepeatedCount}** small entries totaling **${currencySymbol}${p.smallRepeatedTotal.toLocaleString()}**.\n• **Top Merchant**: ${p.topMerchants.length > 0 ? `${p.topMerchants[0].name} (${currencySymbol}${p.topMerchants[0].total.toLocaleString()} across ${p.topMerchants[0].count} visits)` : 'Various'}.\n\n💡 **Recommendation**: Cutting weekend micro-treats by 20% will save approx ${currencySymbol}${Math.round(p.weekendExpenseTotal * 0.2).toLocaleString()} monthly!`
      : `🔍 **Spending Pattern Insights**:\n\n• **Weekend vs Weekday**: Weekend pe daily spending **${p.weekendVsWeekdayRatio}x** zyada hoti hai! (${currencySymbol}${p.weekendDailyAvg}/day vs ${currencySymbol}${p.weekdayDailyAvg}/day weekdays).\n• **Chhote Leaks (<₹300)**: Tumne **${p.smallRepeatedCount}** chhote transactions kiye hain jiska total **${currencySymbol}${p.smallRepeatedTotal.toLocaleString()}** ban chuka hai!\n• **Top Merchant**: ${p.topMerchants.length > 0 ? `${p.topMerchants[0].name} (${currencySymbol}${p.topMerchants[0].total.toLocaleString()})` : 'General'}.\n\n💡 **Action**: Weekends par 1 impulse treat skip karke monthly **${currencySymbol}${Math.round(p.weekendExpenseTotal * 0.2).toLocaleString()}** save kar sakte ho bro! 🎯`;

    return { responseText, updatedState };
  }

  // ─── 5. REMAINING BUDGET & SAFE DAILY PACE ───
  if (qLower.includes('budget') || qLower.includes('bacha') || qLower.includes('daily') || qLower.includes('safe pace')) {
    updatedState.lastSubject = 'budget';

    const responseText = isFormalEnglish
      ? `📊 **Budget & Allowance Status**:\n\n• Total Budget Remaining: **${currencySymbol}${ctx.budgetRemaining.toLocaleString()}**\n• Pending Fixed Obligations: **${currencySymbol}${ctx.upcomingRecurring.toLocaleString()}**\n• Real Flexible Money: **${currencySymbol}${ctx.flexibleRemaining.toLocaleString()}**\n• Safe Daily Allowance: **${currencySymbol}${ctx.safeDailySpend}/day** for the next ${ctx.daysRemaining} days.\n\n💡 **Recommendation**: Keep non-essential daily purchases under ${currencySymbol}${ctx.safeDailySpend} to avoid month-end deficit.`
      : `📊 **Budget & Daily Pace**:\n\n• Remaining Budget: **${currencySymbol}${ctx.budgetRemaining.toLocaleString()}**\n• Recurring Bills Due: **${currencySymbol}${ctx.upcomingRecurring.toLocaleString()}**\n• Real Flexible Funds: **${currencySymbol}${ctx.flexibleRemaining.toLocaleString()}**\n• Safe Daily Pace: **${currencySymbol}${ctx.safeDailySpend}/day** for next ${ctx.daysRemaining} days.\n\n💡 **Action**: Daily spend को ₹${ctx.safeDailySpend} ke under rakho bro, budget peacefully complete hoga! 🧘`;

    return { responseText, updatedState };
  }

  // ─── 6. DEFAULT INTELLIGENT CONVERSATIONAL FALLBACK ───
  const topCat = ctx.topCategories.length > 0 ? ctx.topCategories[0] : null;
  const defaultResp = isFormalEnglish
    ? `Hii ${userName}! 🌿 I am your personal AI Financial Coach. Right now, your total wallet balance is **${currencySymbol}${ctx.totalAccBal.toLocaleString()}**, total monthly spent is **${currencySymbol}${ctx.totalExpense.toLocaleString()}**, and safe daily allowance is **${currencySymbol}${ctx.safeDailySpend}/day**.\n\nYou can ask me specific questions like:\n• *"How is my food spending?"*\n• *"Can I afford ₹5,000 for a phone?"*\n• *"What is my email?"*\n• *"Show my weekend pattern"* 💡✨`
    : `Hii ${userName}! 🌿 Main aapka personal AI Financial Coach hu. Abhi aapka total wallet balance **${currencySymbol}${ctx.totalAccBal.toLocaleString()}**, iss month total spent **${currencySymbol}${ctx.totalExpense.toLocaleString()}**, aur safe daily spend **${currencySymbol}${ctx.safeDailySpend}/day** hai.\n\nAap mujhse specific pooch sakte ho:\n• *"iss month food kitna gaya?"*\n• *"5000 ka shoe le lu?"*\n• *"mera email kya hai?"*\n• *"weekend pattern batao"* 💡✨`;

  return { responseText: defaultResp, updatedState };
}
