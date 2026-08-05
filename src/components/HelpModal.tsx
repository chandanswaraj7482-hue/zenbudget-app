import type { Transaction, CategoryBudget, SavingsGoal } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[];
  budgets?: CategoryBudget[];
  goals?: SavingsGoal[];
  currencySymbol?: string;
  userName?: string;
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
  userName = 'User'
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'faq' | 'bot' | 'feedback'>('faq');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hi! I am 🌿 Zen — Your AI Financial Coach. 🧘‍♂️ I analyze your transactions, budgets, goals, and can answer any question about your money or ZenBudget features!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Analyze user spending activity for AI Coach
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalSaved = Math.max(0, totalIncome - totalExpense);
  const savingsPct = totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0;

  const catMap: Record<string, number> = {};
  monthTxs.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
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
    .map(t => `${t.title} (${t.type.toUpperCase()} ${currencySymbol}${t.amount})`)
    .join('; ');

  const budgetSummaryText = budgets.map(b => `${b.category}: ${currencySymbol}${b.spent}/${currencySymbol}${b.limit}`).join(', ');
  const goalSummaryText = goals.map(g => `${g.name}: ${currencySymbol}${g.currentAmount}/${currencySymbol}${g.targetAmount}`).join(', ');

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
    const msg = (userMessage || '').toLowerCase().trim();

    // 1. Highest Spending / Category Analysis
    if (msg.includes('kahan') || msg.includes('sabse zyada') || msg.includes('kharcha') || msg.includes('highest spending') || msg.includes('kahan ja rha')) {
      return `📊 Iss month aapka sabse zyada kharcha **${topCat.toUpperCase()}** category me hua hai (${currencySymbol}${topCatAmt.toLocaleString()})! Total monthly spending: ${currencySymbol}${totalExpense.toLocaleString()}. 💡 Tips: ${topCat.toUpperCase()} kharchon par 15% limit lagao to aap har mahine ₹2,000+ extra save kar sakte ho! 🌿`;
    }

    // 2. Extra Savings Strategy
    if (msg.includes('bachayein') || msg.includes('save') || msg.includes('saving') || msg.includes('5000') || msg.includes('paise kaise')) {
      return `🎯 Extra ${currencySymbol}5,000 bachane ke 3 simple steps: 1️⃣ Salary aate hi 20% alag savings account me transfer kar do. 2️⃣ ${topCat.toUpperCase()} category par strict monthly limit set karo. 3️⃣ Daily Quick Capture se har ₹10 ka record rakho! 💪✨`;
    }

    // 3. Spending Habits / Analysis
    if (msg.includes('habit') || msg.includes('analyze') || msg.includes('score') || msg.includes('analysis')) {
      return `🌱 Spending Habits Analysis: Aapka monthly savings rate **${savingsPct}%** hai! Total saved: ${currencySymbol}${totalSaved.toLocaleString()}. ${savingsPct >= 20 ? '🔥 Great job! Aap Pro Saver category me aate ho!' : '⚡ Aim for 20%+ savings rate to build a solid emergency fund.'} Key focus: ${topCat.toUpperCase()} spending. 📈`;
    }

    // 4. Scan & Pay / UPI Questions
    if (msg.includes('scan') || msg.includes('upi') || msg.includes('pay') || msg.includes('qr') || msg.includes('cashfree')) {
      return `⚡ ZenBudget Direct Scan & Pay: App me Top QR icon tap karo. Scanned QR, Mobile number, Bank A/c (IFSC), ya UPI ID se zero-fee Direct Deep Linking se instant pay ho jata hai! ₹79 payment se Lifetime Scan & Pay access milta hai! 📲`;
    }

    // 5. Quick Capture / AI Voice Entry
    if (msg.includes('quick capture') || msg.includes('voice') || msg.includes('mic') || msg.includes('bol kar')) {
      return `🎙️ AI Quick Capture: Dashboard par card me bol kar ya likh kar (e.g. "Paid 220 for petrol in cash") entry kar sakte ho! System auto-detect karke instant save kar deta hai! ⚡`;
    }

    // 6. Security / PIN / Biometrics
    if (msg.includes('pin') || msg.includes('lock') || msg.includes('password') || msg.includes('security') || msg.includes('biometric')) {
      return `🔒 Security & Privacy: ZenBudget aapka data aapke device sandbox me store karta hai. Login PIN & Biometrics (Fingerprint/Face ID) se aapka app 100% private & secure rehta hai! 🛡️`;
    }

    // 7. General Greetings
    if (msg === 'hi' || msg === 'hello' || msg === 'hey' || msg.includes('kaise ho')) {
      return `Hi ${userName}! 🌿 Main Zen hu — aapka AI Financial Coach. Main aapki spending analyze kar sakta hu, savings tips de sakta hu, aur ZenBudget app ke bare me kuch bhi samjha sakta hu! Ask me anything! 🤝✨`;
    }

    // 8. Universal Smart Money & App Guide Fallback
    return `💡 Great question! Based on your active monthly balance (${currencySymbol}${totalIncome.toLocaleString()} income, ${currencySymbol}${totalExpense.toLocaleString()} spent): Spending discipline and tracking daily entries via Quick Capture will boost your savings. Ask me "Mera sabse zyada kharcha kahan ho rha hai?" for deep insights! 🧘‍♂️✨`;
  }

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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are Zen 🌿 — an ultra-friendly personal finance best friend & ZenBudget App Master AI Coach.
Speak like a warm, supportive best friend using emojis. MATCH THE EXACT LANGUAGE THE USER SPEAKS IN (Hindi, Hinglish, English, etc.).

You can answer ANY question about:
1. The user's account transactions, monthly spending habits, categories breakdown, budgets, and savings goals.
2. How to use ZenBudget app features (Quick Capture natural language, Direct Scan & Pay, Bank Sync, Money Wrapped, Zen Pet, Biometric Lock, Loans tracker, Category Budgets, Savings Goals, Analytics).

User Real Activity Context:
- User Name: ${userName}
- Monthly Income: ${currencySymbol}${totalIncome}
- Monthly Expenses: ${currencySymbol}${totalExpense}
- Monthly Savings Rate: ${savingsPct}%
- Top Spending Category: ${topCat} (${currencySymbol}${topCatAmt})
- Category Expenses Breakdown: ${catBreakdownText || 'None yet'}
- Recent Transaction Logs: ${recentTxsText || 'None yet'}
- Category Budgets: ${budgetSummaryText || 'None set'}
- Savings Goals: ${goalSummaryText || 'None set'}

User Question: ${rawText}`
              }
            ]
          }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (generatedText) {
          botResponseText = generatedText;
        }
      }
    } catch (err) {
      console.warn('Gemini API Error, using smart AI fallback:', err);
    }

    if (!botResponseText) {
      botResponseText = getSmartClientFallbackResponse(rawText);
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
          maxWidth: '360px',
          height: '480px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          borderRadius: '24px',
          position: 'relative',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.1)',
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
                {messages.map((m) => (
                  <div 
                    key={m.id}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}
                  >
                    {m.sender === 'bot' && (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(34, 197, 94, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Bot size={13} style={{ color: 'var(--primary)' }} />
                      </div>
                    )}
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '2px 14px 14px 14px',
                      background: m.sender === 'user' ? 'linear-gradient(to right, var(--primary), var(--secondary))' : 'var(--bg-input)',
                      border: m.sender === 'user' ? 'none' : '1px solid var(--border-input)',
                      color: m.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-line'
                    }}>
                      {m.text}
                      <span style={{ fontSize: '9px', color: m.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', display: 'block', textAlign: 'right', marginTop: '4px' }}>{m.time}</span>
                    </div>
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

              {/* Quick Prompt Chips */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none', flexShrink: 0 }}>
                {[
                  { text: '💸 Sabse zyada kharcha?', query: 'Mera sabse zyada kharcha kahan ho rha hai?' },
                  { text: '🎯 Extra ₹5,000 kaise bachayein?', query: 'Mujhe iss month extra ₹5,000 kaise bachane hain?' },
                  { text: '📊 Habits analyze karo', query: 'Mera spending habits aur score analyze karo' }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(undefined, chip.query)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-input)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {chip.text}
                  </button>
                ))}
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

                      // Save rating to Supabase (admin panel me dikhega)
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        const userName = localStorage.getItem('zb_user_name') || user?.user_metadata?.full_name || user?.user_metadata?.name || 'ZenBudget User';
                        const userEmail = user?.email || localStorage.getItem('zb_user_email') || 'user@example.com';

                        await supabase.from('app_ratings').insert([{
                          user_id: user?.id || null,
                          user_name: userName,
                          user_email: userEmail,
                          rating_stars: rating,
                          rating: rating,
                          feedback: comment || `${rating} Star rating submitted`,
                          comment: comment || null,
                          month: `${curMonth} ${curYear}`,
                          platform: navigator.userAgent.includes('Android') ? 'Android APK' : 'Web',
                          created_at: new Date().toISOString()
                        }]);
                        console.log('✅ Rating saved to Supabase admin panel');
                      } catch (err) {
                        console.warn('Rating save to Supabase failed (table may not exist yet):', err);
                        // Fallback: silently ignore, local storage already saved
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
