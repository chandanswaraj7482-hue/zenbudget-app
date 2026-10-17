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
  Rent: /\b(rent|kiraya|house\s*rent|room\s*rent|flat\s*rent|pg\s*rent|nobroker|magicbricks|landlord|housing|maintenance)\b/i,
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

const prompt = `You are an expert financial OCR assistant analyzing a mobile payment receipt, netbanking confirmation, bank transfer slip, or UPI screenshot.
Analyze the image carefully to extract transaction details.
Supported sources: Any Netbanking receipt (SBI, HDFC, ICICI, Axis, PNB, etc.), NEFT, RTGS, IMPS, UPI (GPay, PhonePe, Paytm, CRED), Credit/Debit Card payment confirmation, or bank debit/credit advice.

Extract the following information in strict valid JSON format:
{
  "isReceipt": true,
  "amount": number (extract the exact numeric transaction amount paid or transferred. Remove commas or currency symbols like ₹, Rs, INR. E.g. 1500.50),
  "merchantName": string (extract the beneficiary name, merchant, payee, account holder or receiver name. If net banking or bank transfer, extract the beneficiary name or bank name),
  "type": "expense" | "income" (return "income" ONLY if money was credited/received/refunded. Otherwise return "expense"),
  "category": string (choose best from: "Food", "Groceries", "Transport", "Shopping", "Bills", "Salary", "Investment", "Entertainment", "Health", "General"),
  "upiRef": string (extract UTR, Transaction ID, Reference Number, or IMPS/NEFT ref number if visible, else ""),
  "appSource": string ("bank" | "netbanking" | "gpay" | "phonepe" | "paytm" | "cred" | "general")
}

If amount is visible anywhere (e.g. ₹ 500, Rs. 1,200, Amount Transferred: 5000), set "isReceipt": true and extract it. Return ONLY pure JSON without markdown code blocks.`;

      onProgress?.('extracting', 80, 'Auto-detecting Income vs Expense, Merchant & Category...');

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
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
      } catch (modelErr) {
        console.warn('Gemini 3.5 flash lite retry with 3.8 flash:', modelErr);
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
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
      }

      const rawText = response.text || '';
      const cleanJson = rawText.replace(/```json|```/gi, '').trim();
      
      // Try parsing JSON or extract JSON block using regex if there's any surrounding text
      let parsed: any = null;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (_) {
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch (e) {}
        }
      }

      if (parsed) {
        let parsedAmt = 0;
        if (typeof parsed.amount === 'number') {
          parsedAmt = parsed.amount;
        } else if (typeof parsed.amount === 'string') {
          parsedAmt = parseFloat(parsed.amount.replace(/[^0-9.]/g, ''));
        }

        // If amount was not in JSON, try regex on the raw response text
        if (isNaN(parsedAmt) || parsedAmt <= 0) {
          const amtMatch = rawText.match(/(?:amount|total|rs\.?|₹|inr)[\s:]*([0-9,]+(?:\.[0-9]{1,2})?)/i);
          if (amtMatch) {
            parsedAmt = parseFloat(amtMatch[1].replace(/,/g, ''));
          }
        }

        if (parsedAmt > 0) {
          onProgress?.('ready', 100, 'Payment verified & categorized successfully!');
          
          const isIncome = parsed.type === 'income' || parsed.category === 'Salary' || parsed.category === 'Cashback';
          const src = String(parsed.appSource || 'netbanking').toUpperCase();

          return {
            amount: String(Math.abs(parsedAmt)),
            merchantName: parsed.merchantName ? parsed.merchantName.trim() : (isIncome ? 'Payment Inflow' : 'Net Banking Payee'),
            category: parsed.category || (isIncome ? 'Income' : 'Bills'),
            type: isIncome ? 'income' : 'expense',
            note: `Auto-scanned from ${src} Receipt`,
            date: today,
            upiRef: parsed.upiRef || '',
            appSource: (parsed.appSource as any) || 'bank',
            rawImagePreview: base64DataUrl
          };
        }
      }
      
      // Fallback: If AI returned something without clear amount or parsing failed
      console.warn('ZenBudget Vision parse returned without amount, using graceful fallback');
      return {
        amount: '',
        merchantName: 'Net Banking / UPI Transfer',
        category: 'General',
        type: 'expense',
        note: 'Payment screenshot attached (enter amount to save)',
        date: today,
        upiRef: '',
        appSource: 'bank',
        rawImagePreview: base64DataUrl
      };
    } catch (err: any) {
      console.warn('ZenBudget Vision parse error (fallback active):', err);
      return {
        amount: '',
        merchantName: 'Net Banking / UPI Transfer',
        category: 'General',
        type: 'expense',
        note: 'Payment screenshot attached (enter amount to save)',
        date: today,
        upiRef: '',
        appSource: 'bank',
        rawImagePreview: base64DataUrl
      };
    }
  }

  // Fallback when offline or no API key available
  return {
    amount: '',
    merchantName: 'Payment Receipt',
    category: 'General',
    type: 'expense',
    note: 'Payment screenshot attached',
    date: today,
    upiRef: '',
    appSource: 'bank',
    rawImagePreview: base64DataUrl
  };
};
