import React, { useState } from 'react';
import { Mic, ArrowRight, Sparkles, Check, RefreshCw } from 'lucide-react';
import type { Transaction, Account } from '../types';
import confetti from 'canvas-confetti';
import { Wallet, Plus, X } from 'lucide-react';

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

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => accounts[0]?.id || '1');
  const [selectedTransferToAccountId, setSelectedTransferToAccountId] = useState<string>(() => accounts[1]?.id || accounts[0]?.id || '2');

  React.useEffect(() => {
    if (accounts && accounts.length > 0 && (!selectedAccountId || !accounts.some(a => a.id === selectedAccountId))) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  // Natural Language Multi-lingual Parser
  const parseNaturalLanguage = (text: string, defaultType: 'expense' | 'income' | 'transfer') => {
    const cleanText = text.trim().toLowerCase();
    
    // 1. Amount Extraction (handles 220, 2.5k, ₹500, 5000, 300rs)
    let amount = 0;
    const kMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
      amount = parseFloat(kMatch[1]) * 1000;
    } else {
      const numMatch = cleanText.match(/(?:(?:₹|\$|€|£|rs\.?|inr|rupees|ruppess|rupee)?\s*)(\d+(?:\.\d+)?)/i) || cleanText.match(/(\d+(?:\.\d+)?)\s*(?:rs|inr|rupees|ruppess|rupee)?/i);
      if (numMatch) {
        amount = parseFloat(numMatch[1]);
      }
    }

    // 2. Type Extraction (expense / income / transfer)
    let type: 'expense' | 'income' | 'transfer' = defaultType;
    if (/\b(transfer|transferred|bheja|send|sent|remit)\b/i.test(cleanText)) {
      type = 'transfer';
    } else if (/\b(received|got|salary|freelance|earned|income|aaya|aayi|aaye|mila|mili|mile|cashback|refund|credited)\b/i.test(cleanText)) {
      type = 'income';
    } else if (/\b(paid|spent|bought|kharcha|diya|diye|chukaaya|purchase|order|pay|debited)\b/i.test(cleanText)) {
      type = 'expense';
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
        other: 'General Expense'
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

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type text directly.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Supports English + Indian accents & mixed phrases
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;

    if (!accounts || accounts.length === 0) {
      setShowNoAccountModal(true);
      return;
    }

    const parsed = parseNaturalLanguage(inputQuery, activeTab);
    if (!parsed.amount || parsed.amount <= 0) {
      alert('Please mention a valid amount in text (e.g., "Paid 220 for petrol in cash" or "mujhe 300rs freelance se mila").');
      return;
    }

    const finalAccountId = (parsed.accountId && accounts.some(a => a.id === parsed.accountId))
      ? parsed.accountId
      : selectedAccountId || accounts[0]?.id || '1';

    onSaveTransaction({
      title: parsed.title,
      amount: parsed.amount,
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

    const selectedAccObj = accounts.find(a => a.id === finalAccountId);
    const accName = selectedAccObj ? selectedAccObj.name : 'Account';
    setLastSavedSummary(`Saved: ${parsed.type.toUpperCase()} ${currencySymbol}${parsed.amount} (${parsed.title}) -> ${accName}`);
    setInputQuery('');
    setTimeout(() => setLastSavedSummary(null), 4000);
  };

  const getPlaceholder = () => {
    if (activeTab === 'expense') return 'e.g. Paid 220 for petrol in cash';
    if (activeTab === 'income') return 'e.g. Received 5000 salary in bank';
    return 'e.g. Transferred 1500 to savings account';
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Quick capture
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
              gap: '4px'
            }}>
              <Sparkles size={11} /> AI Auto-Detect
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Add expense, income, or transfer in natural language
          </p>
        </div>
      </div>

      {/* Type Selector Tabs & Mic */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px' }}>
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: '16px',
          border: '1px solid var(--border-input)',
          gap: '4px'
        }}>
          {(['expense', 'income', 'transfer'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === tab ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Speech Mic Button */}
        <button
          type="button"
          onClick={handleVoiceInput}
          title="Voice Speech to Text"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: isListening ? '2px solid var(--primary)' : '1px solid var(--border-input)',
            background: isListening ? 'var(--primary-glow)' : 'var(--bg-input)',
            color: isListening ? 'var(--primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            animation: isListening ? 'pulse 1.5s infinite' : 'none'
          }}
        >
          <Mic size={18} />
        </button>
      </div>

      {/* Input Box & Submit Button */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder={getPlaceholder()}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '18px',
              border: '1px solid var(--border-input)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!inputQuery.trim()}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '18px',
            border: 'none',
            background: inputQuery.trim() ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'var(--bg-input)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputQuery.trim() ? 'pointer' : 'not-allowed',
            opacity: inputQuery.trim() ? 1 : 0.4,
            boxShadow: inputQuery.trim() ? '0 4px 16px var(--primary-glow)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowRight size={20} />
        </button>
      </form>

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

      {/* No Account Modal Popup */}
      {showNoAccountModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} className="animate-fade-in">
          <div style={{
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-card-active)',
            borderRadius: '24px',
            padding: '24px',
            maxWidth: '340px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative'
          }} className="animate-scale-up">
            <button 
              onClick={() => setShowNoAccountModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Wallet size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>No Account Found</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Please add at least 1 account or wallet (e.g. Cash, Bank, GPay) before logging expenses.
            </p>
            <button
              onClick={() => {
                setShowNoAccountModal(false);
                if (onAddAccountClick) onAddAccountClick();
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px var(--primary-glow)'
              }}
            >
              <Plus size={18} /> Add Account Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
