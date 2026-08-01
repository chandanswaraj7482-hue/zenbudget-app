export type CategoryType = 'food' | 'shopping' | 'entertainment' | 'bills' | 'travel' | 'health' | 'other';

export interface CategoryInfo {
  id: CategoryType;
  label: string;
  icon: string; // Lucide icon name
  colorClass: string;
}

export type ExpenseMood = 'happy' | 'stressed' | 'regret' | 'excited' | 'neutral';
export type IncomeMood = 'happy' | 'proud' | 'excited' | 'grateful' | 'neutral';
export type MoodType = ExpenseMood | IncomeMood | 'sad' | 'angry' | 'calm';

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'upi' | 'wallet' | 'credit' | 'custom' | string;
  customTypeName?: string;
  balance: number;
  color: string;
  iconName?: string;
}

export interface LoanRecord {
  id: string;
  type: 'borrowed' | 'lent';
  personName: string;
  totalAmount: number;
  principalAmount?: number;
  interestRate?: number;
  paidAmount: number;
  dueDate: string;
  frequency: 'one_time' | 'weekly' | 'monthly' | 'yearly' | 'custom' | string;
  customFrequencyText?: string;
  accountId?: string;
  notes?: string;
  status: 'active' | 'completed';
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: CategoryType;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense' | 'transfer';
  notes?: string;
  mood?: MoodType;
  paidBy?: string;
  user_id?: string;
  partnerName?: string; // Name badge for partner transactions
  accountId?: string;
  transferToAccountId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
}

export interface CategoryBudget {
  category: CategoryType;
  limit: number;
}

export const normalizeMood = (mood?: string, _type: 'income' | 'expense' | 'transfer' = 'expense'): string => {
  if (!mood) return 'neutral';
  const m = mood.toLowerCase();
  if (m === 'sad') return 'regret';
  if (m === 'angry') return 'stressed';
  if (m === 'calm') return 'neutral';
  return m;
};

export const EXPENSE_MOODS: { id: ExpenseMood; label: string; emoji: string }[] = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'stressed', label: 'Stressed', emoji: '😫' },
  { id: 'regret', label: 'Regret', emoji: '😔' },
  { id: 'excited', label: 'Excited', emoji: '😍' },
  { id: 'neutral', label: 'Neutral', emoji: '😐' }
];

export const INCOME_MOODS: { id: IncomeMood; label: string; emoji: string }[] = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'proud', label: 'Proud', emoji: '💪' },
  { id: 'excited', label: 'Excited', emoji: '😍' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'neutral', label: 'Neutral', emoji: '😐' }
];
