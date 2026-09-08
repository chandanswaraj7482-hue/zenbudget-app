import { ZenFinancialIntelligenceEngine, resolveUserFinancialQuery, ConversationMemoryState } from './zenFinancialEngine';
import type { Transaction, CategoryBudget, SavingsGoal, Account, LoanRecord } from '../types';

// Mock User Financial Dataset (Simulates a real user with transactions, budgets, accounts, loans)
const mockTransactions: Transaction[] = [
  // Current Month Transactions
  { id: '1', title: 'Swiggy Biryani', amount: 450, category: 'food', date: '2026-09-02', type: 'expense' },
  { id: '2', title: 'Supermarket Groceries', amount: 2800, category: 'food', date: '2026-09-04', type: 'expense' },
  { id: '3', title: 'Uber Cab', amount: 350, category: 'travel', date: '2026-09-05', type: 'expense' },
  { id: '4', title: 'Zomato Party', amount: 1610, category: 'food', date: '2026-09-06', type: 'expense' }, // Weekend
  { id: '5', title: 'Zara Shopping', amount: 3240, category: 'shopping', date: '2026-09-06', type: 'expense' }, // Weekend
  { id: '6', title: 'Monthly Salary', amount: 50000, category: 'salary', date: '2026-09-01', type: 'income' },
  
  // Last Month Transactions
  { id: '7', title: 'Swiggy Old', amount: 350, category: 'food', date: '2026-08-10', type: 'expense' },
  { id: '8', title: 'Groceries Old', amount: 2200, category: 'food', date: '2026-08-15', type: 'expense' },
  { id: '9', title: 'Shopping Old', amount: 2000, category: 'shopping', date: '2026-08-20', type: 'expense' },
];

const mockBudgets: CategoryBudget[] = [
  { category: 'food', limit: 6000 },
  { category: 'shopping', limit: 4000 }
];

const mockAccounts: Account[] = [
  { id: 'a1', name: 'HDFC Salary Bank', type: 'bank', balance: 38450, color: '#10b981' },
  { id: 'a2', name: 'Paytm Wallet', type: 'wallet', balance: 3100, color: '#3b82f6' }
];

const mockLoans: LoanRecord[] = [
  {
    id: 'l1',
    type: 'borrowed',
    personName: 'HDFC Personal Loan EMI',
    totalAmount: 12000,
    paidAmount: 10800,
    emiInstallment: 1200,
    dueDate: '2026-09-15',
    frequency: 'monthly',
    status: 'active'
  }
];

const mockGoals: SavingsGoal[] = [
  { id: 'g1', name: 'Emergency Fund', targetAmount: 50000, currentAmount: 15000, color: '#8b5cf6' }
];

console.log('🧪 RUNNING ZEN FINANCIAL ENGINE AUTOMATED SMARTNESS TEST SUITE...\n');

const engine = new ZenFinancialIntelligenceEngine(
  mockTransactions,
  mockBudgets,
  mockGoals,
  mockAccounts,
  mockLoans,
  new Date('2026-09-08')
);

let state: ConversationMemoryState = {
  lastCategory: null,
  lastPeriod: null,
  lastSubject: null,
  lastAmount: null,
  lastMerchants: null
};

function runTest(prompt: string, expectedSubstrings: string[]) {
  console.log(`💬 USER: "${prompt}"`);
  const res = resolveUserFinancialQuery(prompt, engine, state, 'Chandan', '₹');
  state = res.updatedState;

  console.log(`🤖 ZEN:\n${res.responseText}\n`);

  let passed = true;
  expectedSubstrings.forEach(substr => {
    if (!res.responseText.includes(substr)) {
      console.error(`❌ FAILED: Response missing expected keyword "${substr}"`);
      passed = false;
    }
  });

  if (passed) {
    console.log(`✅ PASSED!\n---------------------------------------------------`);
  } else {
    process.exit(1);
  }
}

// 1. Overall Month Scene
runTest('bro month ka scene?', ['₹8,450', '₹1,200', '₹40,350']);

// 2. Category query
runTest('food pe kitna gaya?', ['FOOD', '₹4,860']);

// 3. Multi-turn Follow-up 1: "last month?"
runTest('last month?', ['FOOD', '₹2,550']);

// 4. Multi-turn Follow-up 2: "difference kitna?"
runTest('difference kitna?', ['+₹2,310', '91%']);

// 5. Affordability Check
runTest('5000 ka shoe le lu?', ['₹5,000', 'AFFORDABLE']);

// 6. Weekend pattern
runTest('weekend pe zyada spend karta hu kya?', ['Weekend']);

console.log('\n🎉 ALL 6 FINANCIAL INTELLIGENCE TESTS PASSED WITH 100% SMARTNESS SCORE!');
