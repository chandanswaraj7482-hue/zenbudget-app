import { GoogleGenAI } from '@google/genai';

export interface ParsedPaymentResult {
  amount: string;
  merchantName: string;
  category: string;
  type: 'expense' | 'income';
  note: string;
  date: string;
  upiRef?: string;
  appSource: 'gpay' | 'phonepe' | 'paytm' | 'bank' | 'screenshot' | 'general';
  rawImagePreview?: string;
}

const CATEGORY_KEYWORDS: Record<string, RegExp> = {
  Salary: /\b(salary|stipend|wages|payroll|credited by employer)\b/i,
  Cashback: /\b(cashback|reward|refund|reversal|scratch card|bonus)\b/i,
  Investment: /\b(dividend|interest|groww|zerodha|upstox|mutual fund|sip return|fd interest)\b/i,
  Food: /\b(swiggy|zomato|mcdonalds|kfc|starbucks|pizza|burger|chai|tea|coffee|restaurant|hotel|dhaba|bakery|cafe|food|snack|canteen|bhojanalay)\b/i,
  Groceries: /\b(blinkit|zepto|instamart|bigbasket|dmart|grocery|supermarket|kirana|vegetables|sabzi|fruits|milk|doodh|ration)\b/i,
  Transport: /\b(uber|ola|rapido|metro|petrol|diesel|fuel|indian\s*oil|hpcl|bpcl|shell|auto|fastag|toll|parking|bus|train|irctc|flight|indigo)\b/i,
  Shopping: /\b(amazon|flipkart|myntra|meesho|zara|h&m|ajio|nykaa|reliancedigital|croma|shopping|clothing|fashion|retail|store|mart)\b/i,
  Bills: /\b(bescom|electricity|water|wifi|airtel|jio|vi|broadband|cylinder|indane|bharatgas|dth|tata\s*play|recharge|bill)\b/i,
  Entertainment: /\b(bookmyshow|pvr|inox|cinema|movie|netflix|spotify|prime|hotstar|youtube|gaming|steam|playstation)\b/i,
  Health: /\b(apollo|pharmeasy|1mg|medical|pharmacy|chemist|hospital|clinic|doctor|lab|medplus)\b/i
};

export const detectCategoryAndType = (text: string): { category: string; type: 'expense' | 'income' } => {
  const isIncome = /\b(received|credited|refund|cashback|salary|credit to a\/c|deposited|inflow|\bcr\b|\+rs|\+₹)\b/i.test(text);
  
  for (const [cat, regex] of Object.entries(CATEGORY_KEYWORDS)) {
    if (regex.test(text)) {
      return {
        category: cat,
        type: isIncome || cat === 'Salary' || cat === 'Cashback' || cat === 'Investment' ? 'income' : 'expense'
      };
    }
  }

  return {
    category: isIncome ? 'Income' : 'General',
    type: isIncome ? 'income' : 'expense'
  };
};

export const detectCategory = (text: string): string => detectCategoryAndType(text).category;

/**
 * Parses shared raw text from GPay, PhonePe, Paytm, or Bank SMS
 */
export const parseSharedPaymentText = (text: string): ParsedPaymentResult => {
  const clean = text.trim();
  let amount = '';
  let merchantName = '';
  let appSource: ParsedPaymentResult['appSource'] = 'general';
  let upiRef = '';

  // Detect App Source
  if (/google\s*pay|gpay|tez/i.test(clean)) appSource = 'gpay';
  else if (/phonepe|ybl|axl|ibl/i.test(clean)) appSource = 'phonepe';
  else if (/paytm/i.test(clean)) appSource = 'paytm';
  else if (/debited|credited|bank|a\/c|inr|acct/i.test(clean)) appSource = 'bank';

  // Detect Income vs Expense
  const isIncome = /\b(received|credited|received from|money received|refund|cashback|salary|deposited|\bcr\b)\b/i.test(clean);

  // Amount Extraction (matches ₹ 500, Rs. 500, INR 500, 500.00, etc.)
  const amountMatch = clean.match(/(?:(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?))|([\d,]+(?:\.\d{1,2})?\s*(?:₹|rs\.?|inr))/i) ||
                      clean.match(/(?:paid|sent|debited|credited|received(?:\s*from)?|amount)\s*(?:of)?\s*(?:(?:₹|rs\.?|inr)\s*)?([\d,]+(?:\.\d{1,2})?)/i);

  if (amountMatch) {
    const rawAmt = (amountMatch[1] || amountMatch[2] || '').replace(/,/g, '');
    if (!isNaN(parseFloat(rawAmt))) {
      amount = parseFloat(rawAmt).toString();
    }
  }

  // Payee / Sender Name Extraction
  const partyMatch = clean.match(/(?:paid\s+to|payment\s+to|sent\s+to|transfer\s+to|received\s+from|from|to\s+vpa|to)\s+([A-Za-z0-9\s&.'_-]{2,30})/i) ||
                     clean.match(/(?:at|info:\s*)([A-Za-z0-9\s&.'_-]{3,25})/i);

  if (partyMatch) {
    merchantName = partyMatch[1].trim()
      .replace(/\s+(on|using|via|ref|upi|utr|from|txn|id).*$/i, '')
      .replace(/\b(successful|completed|paid|received|rs|inr)\b/gi, '')
      .trim();
  }

  // UTR / 12-digit UPI reference extraction
  const refMatch = clean.match(/(?:upi\s*ref|ref\s*no|utr(?:\s*no)?|txn\s*id)[\s:]*(\d{10,14})/i);
  if (refMatch) {
    upiRef = refMatch[1];
  }

  const { category, type } = detectCategoryAndType(`${clean} ${merchantName}`);
  const today = new Date().toISOString().split('T')[0];

  return {
    amount: amount || '0',
    merchantName: merchantName || (isIncome ? 'Payment Sender' : 'UPI Merchant'),
    category,
    type: isIncome ? 'income' : type,
    note: `Auto-captured from ${appSource.toUpperCase()} ${isIncome ? 'Credit' : 'Debit'}`,
    date: today,
    upiRef,
    appSource
  };
};

/**
 * Parses shared screenshot image (data:image/...) from GPay/PhonePe using Gemini Vision
 * with intelligent heuristic fallback if offline.
 */
export const parsePaymentScreenshot = async (
  base64DataUrl: string,
  onProgress?: (stage: 'receiving' | 'analyzing' | 'extracting' | 'ready', percent: number, statusText: string) => void
): Promise<ParsedPaymentResult> => {
  const today = new Date().toISOString().split('T')[0];
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  onProgress?.('receiving', 25, 'Receiving shared payment screenshot...');

  if (apiKey) {
    try {
      onProgress?.('analyzing', 50, 'AI Vision OCR scanning receipt details & flow...');
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = base64DataUrl.split(',')[1] || base64DataUrl;
      const mimeType = base64DataUrl.includes('image/png') ? 'image/png' : 'image/jpeg';

      const prompt = `Analyze this mobile payment receipt / screenshot (from Google Pay, PhonePe, Paytm, CRED, HDFC, SBI, or Netbanking app).
Extract the following information in strict valid JSON format:
{
  "amount": number (just the amount in numbers, e.g. 450),
  "merchantName": string (payee or sender name, e.g. "Swiggy", "Ramesh Kumar", "Salary"),
  "type": "expense" | "income" (CRITICAL: set to "income" if money was received, credited, cashback, or refund; set to "expense" if money was paid, debited, or sent),
  "category": string (choose best from: "Food", "Groceries", "Transport", "Shopping", "Bills", "Salary", "Cashback", "Entertainment", "Health", "Investment", "General"),
  "upiRef": string (12-digit UTR/UPI reference if visible, or empty string),
  "appSource": string ("gpay" | "phonepe" | "paytm" | "bank" | "general")
}
Return ONLY pure JSON without markdown code blocks.`;

      onProgress?.('extracting', 80, 'Auto-detecting Income vs Expense, Merchant & Category...');

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
                  data: base64Data
                }
              }
            ]
          }
        ]
      });

      const responseText = response.text?.replace(/```json|```/g, '').trim();
      if (responseText) {
        const parsed = JSON.parse(responseText);
        onProgress?.('ready', 100, 'Payment verified & categorized successfully!');
        
        const isIncome = parsed.type === 'income' || parsed.category === 'Salary' || parsed.category === 'Cashback';

        return {
          amount: parsed.amount ? String(Math.abs(parseFloat(parsed.amount) || 0)) : '',
          merchantName: parsed.merchantName ? parsed.merchantName.trim() : (isIncome ? 'Payment Inflow' : 'Payment Outflow'),
          category: parsed.category || (isIncome ? 'Income' : 'General'),
          type: isIncome ? 'income' : 'expense',
          note: `Auto-scanned from ${String(parsed.appSource || 'UPI').toUpperCase()} Receipt`,
          date: today,
          upiRef: parsed.upiRef || '',
          appSource: (parsed.appSource as any) || 'screenshot',
          rawImagePreview: base64DataUrl
        };
      }
    } catch (err) {
      console.warn('ZenBudget Vision parse error:', err);
    }
  }

  // Fallback when unreadable (never invent fake transaction amounts)
  onProgress?.('ready', 100, 'Screenshot ready for confirmation');
  return {
    amount: '',
    merchantName: '',
    category: 'General',
    type: 'expense',
    note: 'Payment Screenshot',
    date: today,
    appSource: 'screenshot',
    rawImagePreview: base64DataUrl
  };
};
