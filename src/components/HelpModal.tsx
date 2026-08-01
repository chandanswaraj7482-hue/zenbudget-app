import React, { useState, useRef, useEffect } from 'react';
import { X, HelpCircle, Send, Mail, Bot, Star } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'faq' | 'bot' | 'feedback'>('faq');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hi! I am 🌿 Zen — Your Money Coach. 🧘‍♂️ How can I help you today with your budgets, expenses, or financial goals?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

    if (msg === 'hi' || msg === 'hello' || msg === 'hey' || msg.includes('hi ') || msg.includes('hello ') || msg === 'hi!') {
      return "Hi! I am ZenBot, your AI financial coach. 🧘 How can I help you today with your budgets, expenses, or savings goals?";
    }
    if (msg.includes('support') || msg.includes('contact') || msg.includes('email') || msg.includes('receipt') || msg.includes('help')) {
      return "For official support, billing inquiries, or account help, please email our team directly at hello.zenbudget@zohomail.in. We're happy to assist you!";
    }
    if (msg.includes('payment') || msg.includes('subscribe') || msg.includes('premium') || msg.includes('unlock') || msg.includes('trial')) {
      return "You can upgrade to ZenBudget Premium anytime from the Subscription menu. Payments are processed securely via Cashfree supporting UPI, Cards, and Netbanking. If you completed a payment and need support, feel free to email hello.zenbudget@zohomail.in.";
    }
    if (msg.includes('save') || msg.includes('saving') || msg.includes('invest')) {
      return "A great starting point for savings is the 50/30/20 rule: allocate 50% of income to needs, 30% to wants, and 20% directly to savings or goals. Set up category budgets in ZenBudget to track your progress effortlessly!";
    }
    if (msg.includes('budget') || msg.includes('limit') || msg.includes('exceed')) {
      return "ZenBudget allows you to set monthly budget limits for categories like Food, Shopping, and Entertainment. If an expense exceeds your category budget, ZenBudget will warn you to decide if it's urgent before saving!";
    }
    if (msg.includes('transaction') || msg.includes('add') || msg.includes('expense') || msg.includes('income')) {
      return "To log a new transaction, tap the '+' button at the bottom of the screen. You can choose Expense or Income, select a category, enter the amount, and save!";
    }

    return "That's a great financial question! A solid strategy is to track all daily expenses regularly, set realistic monthly category budgets, and save at least 20% of your income. Let me know if you'd like tips on specific categories or features!";
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const rawText = inputVal.trim();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: rawText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Silent Context Learning: If user inputs a factual statement (I earn, my salary, I spent), store it silently
    const lowerText = rawText.toLowerCase();
    if (lowerText.includes('my salary') || lowerText.includes('i earn') || lowerText.includes('i spent') || lowerText.includes('my budget')) {
      // Create a small hash keyword from the first few words to memorize the sentiment/fact
      const key = lowerText.split(' ').slice(0, 3).join('_');
      const updatedMemory = { ...learnedMemory, [key]: rawText };
      setLearnedMemory(updatedMemory);
      localStorage.setItem('zb_bot_memory', JSON.stringify(updatedMemory));
    }

    let botResponseText = '';
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    try {
      const activeLang = localStorage.getItem('zb_language') || 'en';
      const langNames: Record<string, string> = {
        en: 'English',
        hi: 'Hindi',
        es: 'Spanish',
        fr: 'French',
        de: 'German'
      };
      const selectedLangName = langNames[activeLang] || activeLang;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are Zen 🌿 — an ultra-friendly personal finance best friend & AI Coach. Speak like a warm, supportive best friend using emojis. Keep responses short (2-3 sentences max). Answer ONLY personal finance, budgeting, saving tips, or ZenBudget app features. ALWAYS respond strictly in the user's selected language (${selectedLangName}). If language is Hindi/hi, respond in conversational Hindi/Hinglish. If English, respond in English. Support email: hello.zenbudget@zohomail.in.

Selected User Language: ${selectedLangName}
User Message: ${rawText}`
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

              {/* Chat Input form */}
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-input)', paddingTop: '10px', flexShrink: 0 }}>
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
