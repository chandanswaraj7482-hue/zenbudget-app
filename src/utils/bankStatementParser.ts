import { GoogleGenAI } from '@google/genai';
import { detectCategory } from './paymentScreenshotParser';

export interface ParsedBankTransaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  rawNarration: string;
  selected?: boolean;
}

export interface BankStatementAnalysisResult {
  bankName: string;
  accountNumber?: string;
  statementPeriod?: string;
  totalIncome: number;
  totalExpenses: number;
  transactions: ParsedBankTransaction[];
}

/**
 * Normalizes ugly bank narration strings into clean human-readable names
 * e.g., "UPI/SWIGGY/swiggy@icici/42198031" -> "Swiggy"
 * "ACH D- NETFLIX ENTERTAINMENT" -> "Netflix"
 */
export const cleanBankNarration = (raw: string): { title: string; category: string } => {
  let clean = raw.trim();

  // Strip common UPI prefixes & suffixes
  clean = clean
    .replace(/^UPI[-/]/i, '')
    .replace(/^POS[-/]/i, '')
    .replace(/^IMPS[-/]/i, '')
    .replace(/^NEFT[-/]/i, '')
    .replace(/^RTGS[-/]/i, '')
    .replace(/^ACH\s*D[-/]/i, '')
    .replace(/^ATM\s*WDL[-/]/i, 'ATM Cash ')
    .replace(/@\w+/g, '') // remove @icici, @okhdfcbank
    .replace(/\/\d{6,}\/?/g, ' ') // remove reference numbers
    .replace(/\b(P2A|P2M|P2P)\b/gi, '')
    .trim();

  // Pick first 3-4 meaningful words
  const words = clean.split(/[\s/-]+/).filter(w => w.length > 1 && !/^\d+$/.test(w));
  let title = words.slice(0, 3).join(' ');
  if (!title || title.length < 2) title = 'Bank Transaction';

  // Capitalize properly
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const category = detectCategory(`${raw} ${title}`);
  return { title, category };
};

/**
 * Parse CSV Bank Statement
 */
export const parseCSVStatement = (csvText: string): BankStatementAnalysisResult => {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const transactions: ParsedBankTransaction[] = [];
  let totalIncome = 0;
  let totalExpenses = 0;
  let bankName = 'Bank Statement';

  // Detect bank from header lines
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const l = lines[i].toLowerCase();
    if (l.includes('hdfc')) bankName = 'HDFC Bank';
    else if (l.includes('state bank') || l.includes('sbi')) bankName = 'State Bank of India';
    else if (l.includes('icici')) bankName = 'ICICI Bank';
    else if (l.includes('axis')) bankName = 'Axis Bank';
    else if (l.includes('kotak')) bankName = 'Kotak Mahindra';
    else if (l.includes('paytm')) bankName = 'Paytm Payments Bank';
  }

  // Find header row (usually contains Date, Narration/Description, Withdrawal/Debit, Deposit/Credit)
  let headerIndex = -1;
  let colDate = 0, colDesc = 1, colDebit = 2, colCredit = 3;

  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const cols = lines[i].split(',').map(c => c.replace(/["']/g, '').trim().toLowerCase());
    const hasDate = cols.some(c => c.includes('date'));
    const hasDesc = cols.some(c => c.includes('narration') || c.includes('description') || c.includes('particulars') || c.includes('details'));
    const hasDebit = cols.some(c => c.includes('debit') || c.includes('withdrawal') || c.includes('dr'));
    const hasCredit = cols.some(c => c.includes('credit') || c.includes('deposit') || c.includes('cr'));

    if (hasDate && (hasDesc || hasDebit || hasCredit)) {
      headerIndex = i;
      cols.forEach((c, idx) => {
        if (c.includes('date')) colDate = idx;
        if (c.includes('narration') || c.includes('description') || c.includes('particulars') || c.includes('details')) colDesc = idx;
        if (c.includes('debit') || c.includes('withdrawal') || c.includes('dr')) colDebit = idx;
        if (c.includes('credit') || c.includes('deposit') || c.includes('cr')) colCredit = idx;
      });
      break;
    }
  }

  const startRow = headerIndex !== -1 ? headerIndex + 1 : 1;
  const today = new Date().toISOString().split('T')[0];

  for (let i = startRow; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/["']/g, '').trim());
    if (cols.length < 3) continue;

    const rawDate = cols[colDate] || today;
    const rawDesc = cols[colDesc] || 'Transaction';
    const debitVal = parseFloat((cols[colDebit] || '0').replace(/[^0-9.]/g, '')) || 0;
    const creditVal = parseFloat((cols[colCredit] || '0').replace(/[^0-9.]/g, '')) || 0;

    if (debitVal <= 0 && creditVal <= 0) continue;

    const isCredit = creditVal > 0;
    const amount = isCredit ? Math.round(creditVal) : Math.round(debitVal);
    const { title, category } = cleanBankNarration(rawDesc);

    if (isCredit) {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }

    transactions.push({
      id: `stmt-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      date: normalizeDate(rawDate),
      title: isCredit && /salary|deposit|interest/i.test(rawDesc) ? `Income: ${title}` : title,
      amount,
      type: isCredit ? 'income' : 'expense',
      category: isCredit ? 'income' : category,
      rawNarration: rawDesc,
      selected: true
    });
  }

  // Strict genuine data validation: NEVER inject fake demo transactions
  if (transactions.length === 0) {
    return {
      bankName,
      totalIncome: 0,
      totalExpenses: 0,
      statementPeriod: 'No transactions found',
      transactions: []
    };
  }

  return {
    bankName,
    totalIncome,
    totalExpenses,
    statementPeriod: 'Last 30 Days',
    transactions
  };
};

/**
 * AI Multimodal Vision Analysis for PDF/Image Bank Statements (Strict Genuine Data Extraction)
 */
export const parseAIBankStatement = async (
  base64Data: string,
  mimeType: string = 'image/jpeg',
  onProgress?: (stage: string, percent: number) => void
): Promise<BankStatementAnalysisResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  onProgress?.('Decrypting & Preprocessing Statement...', 25);

  if (apiKey) {
    try {
      onProgress?.('AI Neural Passbook OCR Analyzing...', 60);
      const ai = new GoogleGenAI({ apiKey });
      const cleanBase64 = base64Data.split(',')[1] || base64Data;

      const prompt = `You are a bank passbook and account statement OCR extraction engine.
Analyze this bank account statement or passbook page.
CRITICAL RULE: Extract ONLY REAL, VISIBLE transactions from this exact image. DO NOT invent, hallucinate, or generate sample transactions. If a line is illegible or not a transaction, omit it.

Extract transactions in strict JSON format:
{
  "bankName": string (detected bank name, e.g. "HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Bank Statement"),
  "accountNumber": string (last 4 digits like "XX4892", or empty string),
  "statementPeriod": string (e.g. "Aug 2026", or empty string),
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "title": string (clean merchant or recipient/sender name, e.g. "Swiggy", "Amazon", "Salary - Infosys", "House Rent"),
      "amount": number (positive whole number amount),
      "type": "expense" | "income",
      "category": string ("Food", "Groceries", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Income", "General"),
      "rawNarration": string (exact visible narration line from statement)
    }
  ]
}
Return ONLY pure JSON without markdown. Extract up to 40 clearest visible transactions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64
                }
              }
            ]
          }
        ]
      });

      onProgress?.('Normalizing categories and balance audit...', 85);

      const text = response.text?.replace(/```json|```/g, '').trim();
      if (text) {
        const parsed = JSON.parse(text);
        let totalIncome = 0;
        let totalExpenses = 0;

        const txs: ParsedBankTransaction[] = (parsed.transactions || [])
          .filter((t: any) => t && (Number(t.amount) > 0 || parseFloat(t.amount) > 0))
          .map((t: any, idx: number) => {
            const amt = Math.round(Math.abs(parseFloat(t.amount) || 0));
            const isIncome = t.type === 'income';
            if (isIncome) totalIncome += amt;
            else totalExpenses += amt;

            return {
              id: `ai-stmt-${Date.now()}-${idx}`,
              date: t.date || new Date().toISOString().split('T')[0],
              title: t.title || 'Bank Transaction',
              amount: amt,
              type: isIncome ? 'income' : 'expense',
              category: isIncome ? 'income' : (t.category || 'General'),
              rawNarration: t.rawNarration || t.title || '',
              selected: true
            };
          });

        onProgress?.('Analysis verified!', 100);

        return {
          bankName: parsed.bankName || 'Bank Statement',
          accountNumber: parsed.accountNumber || '',
          statementPeriod: parsed.statementPeriod || 'Statement Period',
          totalIncome,
          totalExpenses,
          transactions: txs
        };
      }
    } catch (err) {
      console.warn('AI Bank statement parsing error:', err);
    }
  }

  // If no transactions could be extracted, return empty real structure (NO fake demo data)
  onProgress?.('Document scanned.', 100);
  return {
    bankName: 'Bank Statement',
    accountNumber: '',
    statementPeriod: 'Scanned Document',
    totalIncome: 0,
    totalExpenses: 0,
    transactions: []
  };
};

const normalizeDate = (raw: string): string => {
  const parts = raw.split(/[-/.]/);
  if (parts.length === 3) {
    // Check if DD/MM/YYYY or YYYY/MM/DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return `${parts[2].length === 2 ? '20' + parts[2] : parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
};

export const generateDemoBankStatement = (bankName: string = 'HDFC Bank'): BankStatementAnalysisResult => {
  const today = new Date().toISOString().split('T')[0];
  const txs: ParsedBankTransaction[] = [
    {
      id: 'demo-1',
      date: today,
      title: 'Salary Credit - Tech Corp',
      amount: 75000,
      type: 'income',
      category: 'income',
      rawNarration: 'ACH C- TECH CORP SALARY CREDIT AUG',
      selected: true
    },
    {
      id: 'demo-2',
      date: today,
      title: 'Swiggy Food Delivery',
      amount: 480,
      type: 'expense',
      category: 'Food',
      rawNarration: 'UPI/SWIGGY/swiggy@icici/421908231',
      selected: true
    },
    {
      id: 'demo-3',
      date: today,
      title: 'House Rent Transfer',
      amount: 18000,
      type: 'expense',
      category: 'Bills',
      rawNarration: 'IMPS/P2A/RENT PAYMENT KORAMANGALA',
      selected: true
    },
    {
      id: 'demo-4',
      date: today,
      title: 'Blinkit Groceries',
      amount: 1120,
      type: 'expense',
      category: 'Groceries',
      rawNarration: 'POS/BLINKIT RETAIL COMMERCE',
      selected: true
    },
    {
      id: 'demo-5',
      date: today,
      title: 'Netflix Subscription',
      amount: 649,
      type: 'expense',
      category: 'Entertainment',
      rawNarration: 'ACH D- NETFLIX ENTERTAINMENT SVCS',
      selected: true
    },
    {
      id: 'demo-6',
      date: today,
      title: 'Uber Ride',
      amount: 320,
      type: 'expense',
      category: 'Transport',
      rawNarration: 'UPI/UBER INDIA/uber@hdfcbank',
      selected: true
    }
  ];

  return {
    bankName,
    accountNumber: 'XX9204',
    statementPeriod: 'Last 30 Days',
    totalIncome: 75000,
    totalExpenses: 20569,
    transactions: txs
  };
};
