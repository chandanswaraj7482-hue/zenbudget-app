import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Mic, MicOff, ArrowRight, Sparkles, Check, RefreshCw, AlertCircle, Wallet, Plus, X, ArrowLeftRight, Clock, Lock } from 'lucide-react';
import type { Transaction, Account } from '../types';
import confetti from 'canvas-confetti';
import { t } from '../utils/i18n';
import { checkImpulseLock, type ImpulseLockCheckResult } from './WishlistBlocker';

interface QuickCaptureCardProps {
  onSaveTransaction: (tx: Omit<Transaction, 'id'>) => void;
  currencySymbol: string;
  accounts?: Account[];
  onAddAccountClick?: () => void;
}

export const QuickCaptureCard: React.FC<QuickCaptureCardProps> = ({
  onSaveTransaction,
  currencySymbol,
  accounts = [],
  onAddAccountClick
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [lastSavedSummary, setLastSavedSummary] = useState<string | null>(null);
  const [showNoAccountModal, setShowNoAccountModal] = useState(false);
  const [detectedTransferNotice, setDetectedTransferNotice] = useState<{ fromName: string; toName: string } | null>(null);
  const [impulseLockData, setImpulseLockData] = useState<ImpulseLockCheckResult | null>(null);
  const [showImpulseLockModal, setShowImpulseLockModal] = useState(false);
  const [countdownStr, setCountdownStr] = useState('');
  const [cooledPercent, setCooledPercent] = useState(0);
  const [pendingQuickTx, setPendingQuickTx] = useState<any>(null);
  const [budgetLimitWarning, setBudgetLimitWarning] = useState<{
    categoryName: string;
    limit: number;
    spentBefore: number;
    amount: number;
    type: 'category' | 'daily';
  } | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!showImpulseLockModal || !impulseLockData?.item) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - new Date(impulseLockData.item!.createdAt).getTime();
      const LOCK_PERIOD = 48 * 3600 * 1000;
      const left = Math.max(0, LOCK_PERIOD - elapsed);

      const hours = Math.floor(left / (3600 * 1000));
      const mins = Math.floor((left % (3600 * 1000)) / (60 * 1000));
      const secs = Math.floor((left % (60 * 1000)) / 1000);

      setCountdownStr(`${hours}h ${mins}m ${secs}s left`);
      const pct = Math.min(100, Math.max(0, Math.round((elapsed / LOCK_PERIOD) * 100)));
      setCooledPercent(pct);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [showImpulseLockModal, impulseLockData]);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => accounts[0]?.id || '1');
  const [selectedTransferToAccountId, setSelectedTransferToAccountId] = useState<string>(() => accounts[1]?.id || accounts[0]?.id || '1');

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      if (!selectedAccountId || !accounts.some(a => a.id === selectedAccountId)) {
        setSelectedAccountId(accounts[0].id);
      }
      if (accounts.length > 1) {
        if (!selectedTransferToAccountId || selectedTransferToAccountId === selectedAccountId) {
          const other = accounts.find(a => a.id !== selectedAccountId);
          if (other) setSelectedTransferToAccountId(other.id);
        }
      }
    }
  }, [accounts, selectedAccountId, selectedTransferToAccountId]);

  const [parseError, setParseError] = useState<string | null>(null);

  // Helper to find account matching user keyword or alias
  const findAccountByKeyword = (keyword: string, accs: Account[]): Account | undefined => {
    if (!keyword || !accs || accs.length === 0) return undefined;
    const kw = keyword.toLowerCase().trim();
    if (!kw) return undefined;

    // 1. Exact match on name
    const exact = accs.find(a => a.name.toLowerCase() === kw);
    if (exact) return exact;

    // 2. Contains match (either way)
    const partial = accs.find(a => {
      const name = a.name.toLowerCase();
      return name.includes(kw) || kw.includes(name);
    });
    if (partial) return partial;

    // 3. Match by account type or common Indian bank / payment aliases
    if (/^(bank|khata|account|savings|current|hdfc|sbi|icici|axis|kotak|pnb|bob|canara|union|indusind)$/i.test(kw)) {
      return accs.find(a => a.type === 'bank' || /bank|sbi|hdfc|icici|axis|kotak/i.test(a.name));
    }
    if (/^(cash|nakad|rokda|pocket|hath)$/i.test(kw)) {
      return accs.find(a => a.type === 'cash' || /cash/i.test(a.name));
    }
    if (/^(upi|gpay|googlepay|google pay|phonepe|phone pe|paytm|bhim|cred)$/i.test(kw)) {
      return accs.find(a => a.type === 'upi' || /upi|gpay|phonepe|paytm/i.test(a.name));
    }
    if (/^(wallet|batua|paytmwallet)$/i.test(kw)) {
      return accs.find(a => a.type === 'wallet' || /wallet/i.test(a.name));
    }
    return undefined;
  };

  // Detect transfer intent and source/destination accounts from text/speech
  const detectTransferDetails = (rawText: string, accs: Account[]) => {
    const text = rawText.toLowerCase();
    const isTransferKeyword = /\b(transfer|transferred|send|sent|move|moved|shift|shifted|bheja|bheje|bhejna|dala|dale|dalna|nikala|nikale|transferring)\b/i.test(text);
    const hasFromToPattern = /\b(from|se)\b/i.test(text) && /\b(to|me|mein|mai|ko|in|into)\b/i.test(text);

    let fromAcc: Account | undefined;
    let toAcc: Account | undefined;

    // Pattern 1: English "from <A> to <B>" or "from <A> into <B>"
    const fromToMatch = text.match(/from\s+([a-z0-9]+(?:\s+[a-z0-9]+)?)\s+(?:to|in|into)\s+([a-z0-9]+(?:\s+[a-z0-9]+)?)/i);
    if (fromToMatch) {
      fromAcc = findAccountByKeyword(fromToMatch[1], accs);
      toAcc = findAccountByKeyword(fromToMatch[2], accs);
    }

    // Pattern 2: Hinglish "<A> se <B> (me|mein|ko|mai|par|transfer|dala|bheja)"
    if (!fromAcc && !toAcc) {
      const seMeMatch = text.match(/([a-z0-9]+)\s+se\s+([a-z0-9]+)(?:\s+(?:me|mein|mai|ko|par|transfer|bheja|dala))?/i);
      if (seMeMatch) {
        fromAcc = findAccountByKeyword(seMeMatch[1], accs);
        toAcc = findAccountByKeyword(seMeMatch[2], accs);
      }
    }

    // Pattern 3: Simple "<A> to <B>" e.g., "bank to cash 500"
    if (!fromAcc && !toAcc) {
      const simpleToMatch = text.match(/([a-z0-9]+)\s+(?:to|➔|->)\s+([a-z0-9]+)/i);
      if (simpleToMatch) {
        fromAcc = findAccountByKeyword(simpleToMatch[1], accs);
        toAcc = findAccountByKeyword(simpleToMatch[2], accs);
      }
    }

    // Pattern 4: Target only e.g. "to <B>" or "<B> me"
    if (!toAcc) {
      const singleToMatch = text.match(/(?:to|in|into)\s+([a-z0-9]+)/i) || text.match(/([a-z0-9]+)\s+(?:me|mein|mai)\b/i);
      if (singleToMatch) {
        toAcc = findAccountByKeyword(singleToMatch[1], accs);
      }
    }

    // Pattern 5: Source only e.g. "from <A>" or "<A> se"
    if (!fromAcc) {
      const singleFromMatch = text.match(/from\s+([a-z0-9]+)/i) || text.match(/([a-z0-9]+)\s+se\b/i);
      if (singleFromMatch) {
        fromAcc = findAccountByKeyword(singleFromMatch[1], accs);
      }
    }

    const isTransfer = isTransferKeyword || hasFromToPattern || (Boolean(fromAcc) && Boolean(toAcc));

    return {
      isTransfer,
      fromId: fromAcc?.id || null,
      toId: toAcc?.id || null,
      fromName: fromAcc?.name || null,
      toName: toAcc?.name || null
    };
  };

  // Swap From and To accounts
  const handleSwapAccounts = () => {
    if (accounts.length < 2) return;
    const prevFrom = selectedAccountId;
    const prevTo = selectedTransferToAccountId;
    setSelectedAccountId(prevTo);
    setSelectedTransferToAccountId(prevFrom);
    if (detectedTransferNotice) {
      setDetectedTransferNotice({
        fromName: detectedTransferNotice.toName,
        toName: detectedTransferNotice.fromName
      });
    }
  };

  // Synchronized input handler for typed text and voice transcription
  const handleInputChange = (val: string) => {
    setInputQuery(val);
    if (parseError) setParseError(null);

    if (accounts && accounts.length > 0) {
      const details = detectTransferDetails(val, accounts);
      if (details.isTransfer) {
        if (activeTab !== 'transfer') {
          setActiveTab('transfer');
        }
        if (details.fromId) {
          setSelectedAccountId(details.fromId);
        }
        if (details.toId && details.toId !== details.fromId) {
          setSelectedTransferToAccountId(details.toId);
        } else if (details.fromId && selectedTransferToAccountId === details.fromId) {
          const other = accounts.find(a => a.id !== details.fromId);
          if (other) setSelectedTransferToAccountId(other.id);
        }
        if (details.fromName && details.toName && details.fromName !== details.toName) {
          setDetectedTransferNotice({ fromName: details.fromName, toName: details.toName });
        }
      } else {
        if (detectedTransferNotice) setDetectedTransferNotice(null);
      }
    }
  };

  // Convert Indic / Regional digits (Devanagari, Bengali, Arabic, etc.) to 0-9
  const normalizeDigits = (str: string): string => {
    return str
      .replace(/[०-९]/g, d => (d.charCodeAt(0) - 0x0966).toString())
      .replace(/[০-৯]/g, d => (d.charCodeAt(0) - 0x09e6).toString())
      .replace(/[੦-੯]/g, d => (d.charCodeAt(0) - 0x0a66).toString())
      .replace(/[૦-૯]/g, d => (d.charCodeAt(0) - 0x0ae6).toString())
      .replace(/[୦-୯]/g, d => (d.charCodeAt(0) - 0x0b66).toString())
      .replace(/[௦-௯]/g, d => (d.charCodeAt(0) - 0x0be6).toString())
      .replace(/[൦-൯]/g, d => (d.charCodeAt(0) - 0x0d66).toString())
      .replace(/[٠-٩]/g, d => (d.charCodeAt(0) - 0x0660).toString())
      .replace(/[۰-۹]/g, d => (d.charCodeAt(0) - 0x06f0).toString());
  };

  // Natural Language Multi-lingual Parser
  const parseNaturalLanguage = (text: string, defaultType: 'expense' | 'income' | 'transfer') => {
    const cleanText = normalizeDigits(text.trim()).toLowerCase();
    
    // 1. Amount Extraction (handles 220, २२०, 2.5k, ₹500, 5000, 300rs, and SMS like Rs.500)
    let amount = 0;
    const kMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
      amount = Math.round(parseFloat(kMatch[1]) * 1000);
    } else {
      const smsMatch = cleanText.match(/(?:rs\.?|inr|rupees?|₹)\s*(\d+(?:\.\d+)?)/i);
      if (smsMatch) {
        amount = Math.round(parseFloat(smsMatch[1]));
      } else {
        const numMatch = cleanText.match(/(?:(?:₹|\$|€|£|rs\.?|inr|rupees|ruppess|rupee)?\s*)(\d+(?:\.\d+)?)/i) || cleanText.match(/(\d+(?:\.\d+)?)\s*(?:rs|inr|rupees|ruppess|rupee)?/i);
        if (numMatch) {
          amount = Math.round(parseFloat(numMatch[1]));
        }
      }
    }

    // Number word fallback if no digits were matched (handles spoken number words like "bees", "pachas", "hundred")
    if (!amount || amount <= 0) {
      const numberWordsMap: Record<string, number> = {
        'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'chaar': 4, 'paanch': 5, 'panch': 5, 'chhe': 6, 'che': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10, 'dus': 10,
        'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14, 'pandrah': 15, 'solah': 16, 'satrah': 17, 'atharah': 18, 'unnis': 19,
        'bees': 20, 'beess': 20, 'tees': 30, 'chaalis': 40, 'chalis': 40, 'pachaas': 50, 'pachas': 50, 'saath': 60, 'sath': 60,
        'sattar': 70, 'assi': 80, 'nabbe': 90, 'sau': 100, 'so': 100, 'hazaar': 1000, 'hazar': 1000, 'lakh': 100000,
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
        'hundred': 100, 'thousand': 1000
      };
      const words = cleanText.split(/[\s,]+/);
      for (const w of words) {
        if (numberWordsMap[w]) {
          amount = numberWordsMap[w];
          break;
        }
      }
    }

    // 2. Type Extraction (expense / income / transfer)
    let type: 'expense' | 'income' | 'transfer' = defaultType;
    if (defaultType === 'income') {
      type = 'income';
      if (/\b(transfer|transferred)\b/i.test(cleanText)) {
        type = 'transfer';
      }
    } else if (defaultType === 'transfer') {
      type = 'transfer';
    } else {
      if (/\b(transfer|transferred|bheja|send|sent|remit)\b/i.test(cleanText) && !/\b(debited|credited)\b/i.test(cleanText)) {
        type = 'transfer';
      } else if (/\b(received|got|salary|freelance|earned|income|aaya|aayi|aaye|mila|mili|mile|cashback|refund|credited|cr\.)\b/i.test(cleanText)) {
        type = 'income';
      } else if (/\b(paid|spent|bought|kharcha|diya|diye|chukaaya|purchase|order|pay|debited|dr\.)\b/i.test(cleanText)) {
        type = 'expense';
      }
    }

    // 3. Category Detection
    let category = 'other';
    if (/\b(freelance|freelancing|salary|stipend|dividend|bonus|interest|profit|income|refund|cashback)\b/i.test(cleanText)) {
      category = 'salary';
    } else if (/\b(petrol|fuel|diesel|cab|uber|ola|auto|rickshaw|metro|bus|flight|train|travel|petrolcard)\b/i.test(cleanText)) {
      category = 'transport';
    } else if (/\b(food|swiggy|zomato|pizza|burger|dinner|lunch|breakfast|tea|chai|coffee|restaurant|hotel|snack|khana)\b/i.test(cleanText)) {
      category = 'food';
    } else if (/\b(grocery|groceries|sabzi|milk|doodh|ration|zepto|blinkit|instamart|bigbasket)\b/i.test(cleanText)) {
      category = 'groceries';
    } else if (/\b(rent|kiraya|house|home|pg)\b/i.test(cleanText)) {
      category = 'rent';
    } else if (/\b(bill|electricity|wifi|recharge|mobile|water|gas|cylinder|dth)\b/i.test(cleanText)) {
      category = 'bills';
    } else if (/\b(shopping|clothes|amazon|flipkart|myntra|shoes|dress)\b/i.test(cleanText)) {
      category = 'shopping';
    } else if (/\b(movie|cinema|netflix|spotify|prime|game|fun|party)\b/i.test(cleanText)) {
      category = 'entertainment';
    } else if (/\b(medicine|doctor|hospital|medical|pharma|clinic)\b/i.test(cleanText)) {
      category = 'health';
    }

    // 4. Account Mode Detection
    let detectedAccId: string | null = null;
    if (accounts && accounts.length > 0) {
      if (/\b(bank|hdfc|sbi|icici|axis|card|debit|credit|netbanking)\b/i.test(cleanText)) {
        const found = accounts.find(a => /bank|hdfc|sbi|icici|axis/i.test(a.name) || a.type === 'bank');
        if (found) detectedAccId = found.id;
      } else if (/\b(upi|gpay|phonepe|paytm|scan|qr)\b/i.test(cleanText)) {
        const found = accounts.find(a => /upi|gpay|phonepe|paytm/i.test(a.name) || a.type === 'upi');
        if (found) detectedAccId = found.id;
      } else if (/\b(cash|nakad)\b/i.test(cleanText)) {
        const found = accounts.find(a => /cash/i.test(a.name) || a.type === 'cash');
        if (found) detectedAccId = found.id;
      }
    }

    // 5. Intelligent Title & Item Extraction
    let extractedTitle = '';

    const itemMap: { regex: RegExp; label: string }[] = [
      { regex: /\bfreelance|freelancing\b/i, label: 'Freelance Work' },
      { regex: /\bsalary|stipend\b/i, label: 'Monthly Salary' },
      { regex: /\bbonus|dividend|interest|profit\b/i, label: 'Bonus & Investments' },
      { regex: /\bcashback|refund\b/i, label: 'Cashback & Refund' },
      { regex: /\bpizza\b/i, label: 'Pizza' },
      { regex: /\bburger\b/i, label: 'Burger' },
      { regex: /\bswiggy\b/i, label: 'Swiggy Food' },
      { regex: /\bzomato\b/i, label: 'Zomato Order' },
      { regex: /\bpetrol|fuel|diesel\b/i, label: 'Fuel / Petrol' },
      { regex: /\bchai|tea\b/i, label: 'Chai / Tea' },
      { regex: /\bcoffee\b/i, label: 'Coffee' },
      { regex: /\buber|ola|cab|auto|rickshaw\b/i, label: 'Cab Ride' },
      { regex: /\bdoodh|milk\b/i, label: 'Milk' },
      { regex: /\bsabzi|vegetables\b/i, label: 'Vegetables' },
      { regex: /\bgrocer(?:y|ies)|ration|blinkit|zepto|instamart\b/i, label: 'Groceries' },
      { regex: /\brent|kiraya\b/i, label: 'House Rent' },
      { regex: /\bwifi|broadband\b/i, label: 'WiFi Bill' },
      { regex: /\brecharge|mobile recharge\b/i, label: 'Mobile Recharge' },
      { regex: /\belectricity|bijli\b/i, label: 'Electricity Bill' },
      { regex: /\bnetflix|spotify|prime\b/i, label: 'Subscription' },
      { regex: /\bmovie|cinema\b/i, label: 'Movie Ticket' },
      { regex: /\bmedicine|doctor|clinic\b/i, label: 'Medical & Pharmacy' },
      { regex: /\bamazon|flipkart|myntra\b/i, label: 'Online Shopping' },
      { regex: /\bclothes|dress|shoes\b/i, label: 'Apparel & Clothes' }
    ];

    for (const item of itemMap) {
      if (item.regex.test(cleanText)) {
        extractedTitle = item.label;
        break;
      }
    }

    if (!extractedTitle) {
      const smsMerchantMatch = cleanText.match(/(?:at|to|from)\s+([a-z0-9\s]+?)(?:\s+on|\s+ref|\s+via|\.|$)/i) || cleanText.match(/(?:info[:\-]?|upi[:\-]?|vpa[:\-]?)\s*([a-z0-9\s]+?)(?:\s|$)/i);
      if (smsMerchantMatch && smsMerchantMatch[1] && smsMerchantMatch[1].trim().length > 2) {
        extractedTitle = smsMerchantMatch[1].trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }

    if (!extractedTitle) {
      let stripped = cleanText
        .replace(/(?:(?:₹|\$|€|£|rs\.?|inr|rupees|ruppess|rupee)?\s*)\d+(?:\.\d+)?\s*(?:rs|inr|rupees|ruppess|rupee|k)?/gi, '')
        .replace(/\b(mujhe|mujko|mujhko|mereko|hume|humne|humko|usko|isiko|paisa|paise|rupee|rupees|ruppess|rs|inr|roopaye|rupaye|rupya|rupye|amount|money|taka|milars|milar|mene|maine|main|i|we|my|mera|meri|mere|ne|ka|ki|ke|ko|se|par|for|from|to|in|on|at|with|and|is|was|a|an|the)\b/gi, '')
        .replace(/\b(paid|spent|bought|kharcha|diya|diye|chukaaya|purchase|order|pay|khaya|khaye|piya|piye|kharida|kharide|bheja|bheje|mila|mili|mile|aaya|aayi|aaye|gave|took|got|received|cash|bank|online|gpay|phonepe|paytm|upi)\b/gi, '')
        .replace(/[^\w\s]/gi, '')
        .trim();

      if (stripped.length > 2) {
        extractedTitle = stripped
          .split(/\s+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    if (!extractedTitle) {
      const catLabels: Record<string, string> = {
        food: 'Food & Dining',
        transport: 'Transport & Travel',
        groceries: 'Groceries',
        rent: 'House Rent',
        bills: 'Bills & Utilities',
        shopping: 'Shopping',
        entertainment: 'Entertainment',
        health: 'Health & Medical',
        salary: 'Salary / Income',
        other: defaultType === 'expense' ? 'Quick Expense' : (defaultType === 'income' ? 'Quick Income' : 'Wallet Transfer')
      };
      extractedTitle = catLabels[category] || `${type.toUpperCase()} Transaction`;
    }

    return {
      title: extractedTitle,
      amount: amount || 0,
      type: type,
      category: category,
      accountId: detectedAccId,
      date: new Date().toISOString().split('T')[0]
    };
  };

  const handleVoiceInput = async () => {
    // If already listening, stop recording
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setParseError('Voice speech-to-text is not supported in this browser. Please type directly or use Chrome.');
      window.dispatchEvent(new CustomEvent('toast-alert', { 
        detail: { message: 'Speech recognition not supported in this browser', type: 'info' } 
      }));
      return;
    }

    // Explicitly prompt for mic permission if getUserMedia is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (micErr) {
        console.warn('Microphone permission error:', micErr);
      }
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true; // Live typing as user speaks!

      setIsListening(true);
      setParseError(null);

      recognition.onstart = () => {
        setIsListening(true);
        if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
          navigator.vibrate(35);
        }
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setInputQuery(currentTranscript);
          if (parseError) setParseError(null);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setParseError('Microphone permission was denied. Please allow microphone in browser/device settings.');
          window.dispatchEvent(new CustomEvent('toast-alert', { 
            detail: { message: 'Microphone permission denied', type: 'warning' } 
          }));
        } else if (event.error === 'no-speech') {
          setParseError('No speech detected. Please tap the mic and speak clearly.');
        } else if (event.error !== 'aborted') {
          setParseError(`Voice input issue: ${event.error}. Please type directly.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      console.warn('Speech recognition start failed:', e);
      setIsListening(false);
      setParseError('Could not start microphone. Please type your transaction directly.');
    }
  };

  const [insufficientBalanceError, setInsufficientBalanceError] = useState<{
    accountName: string;
    available: number;
    required: number;
    type: 'expense' | 'transfer';
  } | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;

    if (!accounts || accounts.length === 0) {
      setShowNoAccountModal(true);
      return;
    }

    const parsed = parseNaturalLanguage(inputQuery, activeTab);
    if (!parsed.amount || parsed.amount <= 0) {
      setParseError('Please mention a valid amount in text (e.g., "Paid 220 for petrol in cash" or "received 5000 salary").');
      return;
    }

    const finalAccountId = (parsed.accountId && accounts.some(a => a.id === parsed.accountId))
      ? parsed.accountId
      : selectedAccountId || accounts[0]?.id || '1';

    const selectedAccObj = accounts.find(a => a.id === finalAccountId);
    const accBalance = selectedAccObj ? (selectedAccObj.balance || 0) : 0;

    // Strict Insufficient Balance Check
    if (parsed.type === 'expense' || parsed.type === 'transfer') {
      if (accBalance < parsed.amount) {
        setInsufficientBalanceError({
          accountName: selectedAccObj?.name || 'Wallet Account',
          available: accBalance,
          required: parsed.amount,
          type: parsed.type
        });
        return; // STOP EXECUTION! DO NOT SAVE OR FIRE CONFETTI!
      }
    }

    // Impulse Lock Check for Expenses
    if (parsed.type === 'expense') {
      const profileId = localStorage.getItem('zb_profile_id') || '';
      const lockCheck = checkImpulseLock(profileId, parsed.title.trim(), parsed.amount);
      if (lockCheck.isLocked) {
        setImpulseLockData(lockCheck);
        setPendingQuickTx({
          title: parsed.title,
          amount: Math.round(parsed.amount),
          category: parsed.category,
          date: parsed.date,
          type: parsed.type,
          accountId: finalAccountId,
          notes: `Quick captured from: "${inputQuery}"`
        });
        setShowImpulseLockModal(true);
        return;
      }

      // Category / Daily Budget Limit Warning Check
      try {
        const rawBudgets = localStorage.getItem(`zb_budgets_${profileId}`) || localStorage.getItem(`zb_budgets_cache_${profileId}`);
        const parsedBudgets: Array<{ category: string; limit: number }> = rawBudgets ? JSON.parse(rawBudgets) : [];
        const catNorm = (parsed.category || '').toLowerCase();
        const matchedBudget = parsedBudgets.find(b => (b.category || '').toLowerCase() === catNorm && b.limit > 0);

        if (matchedBudget) {
          const rawTxs = localStorage.getItem(`zb_transactions_${profileId}`);
          const txs: Transaction[] = rawTxs ? JSON.parse(rawTxs) : [];
          const curMonth = new Date().toISOString().substring(0, 7);
          const spentThisMonth = txs
            .filter(t => t.type === 'expense' && (t.category || '').toLowerCase() === catNorm && (t.date || '').startsWith(curMonth))
            .reduce((s, t) => s + (t.amount || 0), 0);

          if (spentThisMonth + parsed.amount > matchedBudget.limit) {
            setBudgetLimitWarning({
              categoryName: parsed.category,
              limit: matchedBudget.limit,
              spentBefore: spentThisMonth,
              amount: Math.round(parsed.amount),
              type: 'category'
            });
            setPendingQuickTx({
              title: parsed.title,
              amount: Math.round(parsed.amount),
              category: parsed.category,
              date: parsed.date,
              type: parsed.type,
              accountId: finalAccountId,
              notes: `Quick captured from: "${inputQuery}"`
            });
            return;
          }
        }
      } catch (e) {}
    }

    onSaveTransaction({
      title: parsed.title,
      amount: Math.round(parsed.amount),
      category: parsed.category,
      date: parsed.date,
      type: parsed.type,
      accountId: finalAccountId,
      transferToAccountId: parsed.type === 'transfer' ? selectedTransferToAccountId : undefined,
      notes: `Quick captured from: "${inputQuery}"`
    });

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}

    const accName = selectedAccObj ? selectedAccObj.name : 'Account';
    setLastSavedSummary(`Got it. Instantly ✨ Saved ${currencySymbol}${parsed.amount} for ${parsed.title}`);
    setInputQuery('');
    setTimeout(() => setLastSavedSummary(null), 4000);
  };

  const getPlaceholder = () => {
    if (activeTab === 'expense') return t('quick_capture_expense_placeholder', { defaultValue: 'Type or paste SMS (e.g. "Debited Rs.500 at Zomato")' });
    if (activeTab === 'income') return t('quick_capture_income_placeholder', { defaultValue: 'Type or paste SMS (e.g. "Credited Rs.5000 from Salary")' });
    return t('quick_capture_transfer_placeholder', { defaultValue: 'Type "Transferred Rs.500 to savings"' });
  };

  return (
    <div className="glass-panel" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card-active)',
      borderRadius: '24px',
      padding: '20px 22px',
      marginBottom: '24px',
      boxShadow: 'var(--glow-shadow)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Subtle Accent Glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header Title & Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              {t('quick_capture')}
            </h3>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              padding: '3px 8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}>
              <Sparkles size={11} /> {t('ai_auto_detect')}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
            {t('quick_capture_sub')}
          </p>
        </div>
      </div>

      {/* Type Selector Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-input)',
        padding: '4px',
        borderRadius: '16px',
        border: '1px solid var(--border-input)',
        gap: '4px',
        marginBottom: '14px'
      }}>
        {(['expense', 'income', 'transfer'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              if (parseError) setParseError(null);
            }}
            style={{
              flex: 1,
              padding: '9px 6px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === tab ? 'var(--bg-card-hover)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            {tab === 'expense' ? t('expenses') : tab === 'income' ? t('income') : t('transfer')}
          </button>
        ))}
      </div>

      {/* Transfer Accounts Selector (When Transfer tab is active) */}
      {activeTab === 'transfer' && (
        accounts.length < 2 ? (
          <div style={{
            marginBottom: '12px',
            padding: '10px 14px',
            borderRadius: '14px',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            color: '#fde047',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <span>⚠️ Wallet transfer ke liye kam se kam 2 accounts hone chahiye.</span>
            {onAddAccountClick && (
              <button
                type="button"
                onClick={onAddAccountClick}
                style={{
                  background: '#eab308',
                  color: '#000',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                + Add Account
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            padding: '8px 12px',
            borderRadius: '14px',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '12px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>From:</span>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} style={{ background: '#0f172a', color: '#fff' }}>
                  {a.name} ({currencySymbol}{a.balance ?? 0})
                </option>
              ))}
            </select>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>➔</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>To:</span>
            <select
              value={selectedTransferToAccountId}
              onChange={e => setSelectedTransferToAccountId(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} style={{ background: '#0f172a', color: '#fff' }}>
                  {a.name} ({currencySymbol}{a.balance ?? 0})
                </option>
              ))}
            </select>
          </div>
        )
      )}

      {/* Input Box with Integrated Speech Mic & Submit Button */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <div style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-input)',
          borderRadius: '18px',
          border: isListening ? '1.5px solid var(--primary)' : '1px solid var(--border-input)',
          boxShadow: isListening ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
          transition: 'all 0.2s ease',
          padding: '0 8px 0 16px'
        }}>
          <input
            type="text"
            value={inputQuery}
            onChange={e => {
              setInputQuery(e.target.value);
              if (parseError) setParseError(null);
            }}
            placeholder={isListening ? '🎙️ Listening... Speak your amount & item now...' : getPlaceholder()}
            style={{
              flex: 1,
              padding: '14px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />

          {/* Integrated Speech Mic Button */}
          <button
            type="button"
            onClick={handleVoiceInput}
            title={isListening ? 'Stop listening' : 'Voice Speech to Text'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: isListening ? '1.5px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
              background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.06)',
              color: isListening ? '#f87171' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              animation: isListening ? 'pulse 1.2s infinite' : 'none',
              flexShrink: 0,
              marginLeft: '6px'
            }}
          >
            {isListening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputQuery.trim()}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '18px',
            border: inputQuery.trim() ? 'none' : '1px solid var(--border-card)',
            background: inputQuery.trim() ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-dark)',
            color: inputQuery.trim() ? '#ffffff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputQuery.trim() ? 'pointer' : 'default',
            boxShadow: inputQuery.trim() ? '0 4px 16px rgba(16, 185, 129, 0.4)' : 'none',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          <ArrowRight size={20} />
        </button>
      </form>

      {/* Parse Error Display */}
      {parseError && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{parseError}</span>
          <button
            type="button"
            onClick={() => setParseError(null)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Feedback Summary */}
      {lastSavedSummary && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: 'var(--primary)',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Check size={14} />
          <span>{lastSavedSummary}</span>
        </div>
      )}

      {/* No Account Modal Popup rendered via portal for full-screen overlay */}
      {showNoAccountModal && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} className="animate-fade-in">
          <div className="glass-panel animate-scale-up" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card-active, var(--border-card))',
            borderRadius: '24px',
            padding: '28px 24px',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center',
            boxShadow: 'var(--glow-shadow)',
            position: 'relative'
          }}>
            <button 
              type="button"
              onClick={() => setShowNoAccountModal(false)}
              style={{ 
                position: 'absolute', top: '16px', right: '16px', 
                background: 'var(--bg-input)', border: '1px solid var(--border-input)', 
                borderRadius: '50%', width: '32px', height: '32px',
                color: 'var(--text-secondary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '20px', 
              background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 16px auto',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              boxShadow: '0 8px 20px rgba(239, 68, 68, 0.15)'
            }}>
              <Wallet size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: "'Manrope', sans-serif" }}>
              No Account Found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Please add at least 1 wallet or bank account (e.g., Cash, Bank, GPay) before logging your expenses.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowNoAccountModal(false);
                if (onAddAccountClick) onAddAccountClick();
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Plus size={18} /> Add Account Now
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Insufficient Balance Error Modal */}
      {insufficientBalanceError && ReactDOM.createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          zIndex: 999999, animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            maxWidth: '380px', width: '100%',
            background: 'var(--bg-card)',
            borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '24px', textAlign: 'center', boxShadow: 'var(--glow-shadow)',
            position: 'relative'
          }}>
            <button
              onClick={() => setInsufficientBalanceError(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(0,0,0,0.05)', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                color: 'var(--text-secondary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              boxShadow: '0 8px 20px rgba(239, 68, 68, 0.15)'
            }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#ef4444', marginBottom: '8px', fontFamily: "'Manrope', sans-serif" }}>
              {insufficientBalanceError.type === 'transfer' ? 'Insufficient Balance for Transfer!' : 'Insufficient Balance for Expense!'}
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              {insufficientBalanceError.type === 'transfer' ? (
                <>Your <strong style={{ color: 'var(--text-primary)' }}>{insufficientBalanceError.accountName}</strong> has only <strong style={{ color: '#ef4444' }}>{currencySymbol}{insufficientBalanceError.available.toLocaleString()}</strong> available balance, but this transfer requires <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}{insufficientBalanceError.required.toLocaleString()}</strong>. Please select another source wallet or add funds.</>
              ) : (
                <>Your <strong style={{ color: 'var(--text-primary)' }}>{insufficientBalanceError.accountName}</strong> has only <strong style={{ color: '#ef4444' }}>{currencySymbol}{insufficientBalanceError.available.toLocaleString()}</strong> available balance, but this expense requires <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}{insufficientBalanceError.required.toLocaleString()}</strong>. Please select another wallet or add funds.</>
              )}
            </p>

            <button
              type="button"
              onClick={() => setInsufficientBalanceError(null)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
              }}
            >
              {insufficientBalanceError.type === 'transfer' ? 'Understand & Select Source Wallet' : 'Understand & Select Different Wallet'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Impulse Lock Warning Modal Popup with 48h Countdown Timer */}
      {showImpulseLockModal && impulseLockData?.item && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '380px',
            background: 'linear-gradient(180deg, rgba(30, 20, 45, 0.98) 0%, rgba(15, 12, 25, 0.98) 100%)',
            border: '1.5px solid rgba(236, 72, 153, 0.4)',
            borderRadius: '26px',
            padding: '24px 20px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 30px rgba(236, 72, 153, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1.5px solid rgba(236, 72, 153, 0.35)',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.25)'
            }}>
              <Lock size={30} />
            </div>

            <div>
              <h3 style={{ fontSize: '18.5px', fontWeight: 900, color: '#f8fafc', margin: '0 0 6px 0' }}>
                Impulse Purchase Locked! ⏳
              </h3>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
                Yeh item aapke <strong>Impulse Blocker</strong> me 48-ghante ke cooling timer par locked hai!
              </p>
            </div>

            {/* Item Card with Live Timer */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '16px',
              padding: '14px',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>{impulseLockData.item.name}</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#ec4899' }}>{currencySymbol}{impulseLockData.item.amount.toLocaleString()}</span>
              </div>
              {impulseLockData.item.reason && (
                <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0 }}>
                  💡 <i>"{impulseLockData.item.reason}"</i>
                </p>
              )}

              {/* Countdown Progress Bar */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ec4899', fontWeight: 700, marginBottom: '6px' }}>
                  <span><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> {countdownStr}</span>
                  <span>{cooledPercent}% Cooled</span>
                </div>
                <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${cooledPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '10px', fontSize: '11.5px', color: '#f87171', textAlign: 'left', lineHeight: 1.4 }}>
              🛑 <strong>Zen Safeguard:</strong> 48 hours rukne se 84% unnecessary regret purchases bach jaati hain!
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowImpulseLockModal(false);
                  setPendingQuickTx(null);
                  setInputQuery('');
                }}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(236, 72, 153, 0.35)'
                }}
              >
                Keep Paused (Save ₹{impulseLockData.item.amount}) 🛡️
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pendingQuickTx) {
                    onSaveTransaction(pendingQuickTx);
                    try {
                      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                    } catch (_) {}
                    setLastSavedSummary(`Bypassed lock ✨ Saved ${currencySymbol}${pendingQuickTx.amount} for ${pendingQuickTx.title}`);
                    setInputQuery('');
                    setTimeout(() => setLastSavedSummary(null), 4000);
                  }
                  setShowImpulseLockModal(false);
                  setPendingQuickTx(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px',
                  textDecoration: 'underline'
                }}
              >
                I really need this now, override & log anyway
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Budget Limit Exceeded Warning Modal */}
      {budgetLimitWarning && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(12px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '380px',
            background: 'linear-gradient(180deg, rgba(35, 25, 20, 0.98) 0%, rgba(18, 14, 15, 0.98) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '26px',
            padding: '24px 20px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 30px rgba(245, 158, 11, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)'
            }}>
              <AlertCircle size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '18.5px', fontWeight: 900, color: '#f8fafc', margin: '0 0 6px 0' }}>
                Budget Limit Exceeded! ⚠️
              </h3>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
                Yeh expense aapke <strong>{budgetLimitWarning.categoryName}</strong> budget limit ko exceed kar raha hai!
              </p>
            </div>

            {/* Budget Limit Stats Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '16px',
              padding: '14px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Monthly Budget Limit:</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>{currencySymbol}{budgetLimitWarning.limit.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Already Spent:</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{currencySymbol}{budgetLimitWarning.spentBefore.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>This Expense:</span>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#ef4444' }}>+{currencySymbol}{budgetLimitWarning.amount.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '10px', fontSize: '11.5px', color: '#fbbf24', textAlign: 'left', lineHeight: 1.4 }}>
              💡 <strong>Zen Alert:</strong> Total kharcha <strong>{currencySymbol}{(budgetLimitWarning.spentBefore + budgetLimitWarning.amount).toLocaleString()}</strong> ho jayega, jo budget se <strong>{currencySymbol}{((budgetLimitWarning.spentBefore + budgetLimitWarning.amount) - budgetLimitWarning.limit).toLocaleString()}</strong> zyada hai!
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setBudgetLimitWarning(null);
                  setPendingQuickTx(null);
                  setInputQuery('');
                }}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)'
                }}
              >
                Cancel Expense (Stay within Budget) 🛡️
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pendingQuickTx) {
                    onSaveTransaction(pendingQuickTx);
                    try {
                      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                    } catch (_) {}
                    setLastSavedSummary(`Logged beyond limit ⚠️ Saved ${currencySymbol}${pendingQuickTx.amount} for ${pendingQuickTx.title}`);
                    setInputQuery('');
                    setTimeout(() => setLastSavedSummary(null), 4000);
                  }
                  setBudgetLimitWarning(null);
                  setPendingQuickTx(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px',
                  textDecoration: 'underline'
                }}
              >
                Log anyway (Exceed Limit)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
