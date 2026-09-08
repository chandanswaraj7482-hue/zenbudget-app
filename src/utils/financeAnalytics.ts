import type { Transaction, CategoryBudget, SavingsGoal } from '../types';

export interface FinanceContext {
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  topCategory: string;
  topCategoryAmount: number;
  remainingFlexible: number;
  dailySafeSpend: number;
  daysRemaining: number;
  budgetStatus: Array<{
    category: string;
    spent: number;
    limit: number;
    percentage: number;
  }>;
  savingsProgress: Array<{
    name: string;
    current: number;
    target: number;
    percentage: number;
  }>;
}

export const generateFinanceContext = (
  transactions: Transaction[],
  budgets: CategoryBudget[],
  goals: SavingsGoal[],
  currentDate: Date = new Date()
): FinanceContext => {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDate.getDate());

  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const totalSaved = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0;

  // Category analysis
  const catMap: Record<string, number> = {};
  monthTxs.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
  });

  let topCategory = 'None';
  let topCategoryAmount = 0;
  Object.entries(catMap).forEach(([cat, amt]) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategory = cat;
    }
  });

  // Budgets
  const budgetStatus = budgets.map(b => {
    const spent = catMap[b.category] || 0;
    const percentage = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
    return {
      category: b.category,
      spent,
      limit: b.limit,
      percentage
    };
  });

  // Goals
  const savingsProgress = goals.map(g => {
    const percentage = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
    return {
      name: g.name,
      current: g.currentAmount,
      target: g.targetAmount,
      percentage
    };
  });

  // Safe daily spend (Assuming income covers all budgets + some flex)
  const budgetedTotal = budgets.reduce((sum, b) => sum + b.limit, 0);
  // Flexible money = Income - Budgeted Amount
  const flexMoney = Math.max(0, totalIncome - budgetedTotal);
  // Unbudgeted spending
  const unbudgetedSpending = monthTxs
    .filter(t => t.type === 'expense' && !budgets.some(b => b.category === t.category))
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const remainingFlexible = Math.max(0, flexMoney - unbudgetedSpending);
  const dailySafeSpend = Math.round(remainingFlexible / daysRemaining);

  return {
    totalIncome,
    totalExpense,
    savingsRate,
    topCategory,
    topCategoryAmount,
    remainingFlexible,
    dailySafeSpend,
    daysRemaining,
    budgetStatus,
    savingsProgress
  };
};
