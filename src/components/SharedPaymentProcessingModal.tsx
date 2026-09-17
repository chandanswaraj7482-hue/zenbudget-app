import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, Sparkles, AlertCircle, ArrowRight, ShieldCheck, 
  Wallet, Tag, Calendar, Edit3, X, Zap, Copy, Check
} from 'lucide-react';
import { GooglePayLogo, PhonePeLogo, PaytmLogo } from './UPIIcons';
import { parsePaymentScreenshot, parseSharedPaymentText } from '../utils/paymentScreenshotParser';
import type { ParsedPaymentResult } from '../utils/paymentScreenshotParser';
import { triggerSparklesExplosion, playAddTransactionSound } from '../utils/audio';

interface SharedPaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: { type: 'image' | 'text'; data: string } | null;
  accounts: any[];
  currencySymbol: string;
  onSaveTransaction: (tx: any) => Promise<boolean>;
  onOpenFullEditor: (tx: any) => void;
}

const EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Shopping', 'Bills', 
  'Entertainment', 'Health', 'Education', 'Travel', 'General'
];

const INCOME_CATEGORIES = [
  'Salary', 'Cashback', 'Refund', 'Freelance', 'Investment', 'Business', 'Bonus', 'Gift', 'Income', 'Other'
];

export const SharedPaymentProcessingModal: React.FC<SharedPaymentProcessingModalProps> = ({
  isOpen,
  onClose,
  payload,
  accounts,
  currencySymbol,
  onSaveTransaction,
  onOpenFullEditor,
}) => {
  if (!isOpen || !payload) return null;

  const [stage, setStage] = useState<'receiving' | 'analyzing' | 'extracting' | 'ready' | 'error'>('receiving');
  const [progressPercent, setProgressPercent] = useState<number>(15);
  const [statusMessage, setStatusMessage] = useState<string>('Receiving payment intent...');
  const [parsedData, setParsedData] = useState<ParsedPaymentResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

  // Editable fields in ready state
  const [amount, setAmount] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !payload) {
      hasProcessedRef.current = false;
      return;
    }

    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    // Set initial default account
    const upiAcc = accounts.find(a => /upi|gpay|phonepe|paytm/i.test(a.name) || a.type === 'upi');
    const defaultAccId = upiAcc ? upiAcc.id : (accounts[0]?.id || '');
    setSelectedAccountId(defaultAccId);

    const executeAnalysis = async () => {
      try {
        setStage('receiving');
        setProgressPercent(20);
        setStatusMessage('Establishing link with payment source...');

        // Subtle haptic if supported
        if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
          navigator.vibrate(30);
        }

        await new Promise(r => setTimeout(r, 600));

        if (payload.type === 'image') {
          setStage('analyzing');
          setProgressPercent(45);
          setStatusMessage('AI Vision OCR scanning receipt details...');

          const result = await parsePaymentScreenshot(
            payload.data,
            (currentStage, percent, msg) => {
              setStage(currentStage);
              setProgressPercent(percent);
              setStatusMessage(msg);
            }
          );

          setProgressPercent(100);
          setStage('ready');
          setStatusMessage('Payment verified successfully!');
          populateFields(result, defaultAccId);

          if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
            navigator.vibrate([40, 60, 40]);
          }
        } else {
          // Text Payload
          setStage('analyzing');
          setProgressPercent(60);
          setStatusMessage('Parsing UPI transaction message...');
          await new Promise(r => setTimeout(r, 700));

          const result = parseSharedPaymentText(payload.data);
          setProgressPercent(100);
          setStage('ready');
          setStatusMessage('UPI Payment identified!');
          populateFields(result, defaultAccId);

          if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
      } catch (err) {
        console.error('Shared payment processing error:', err);
        setStage('error');
        setStatusMessage('Could not auto-read receipt. Please confirm details manually.');
        setAmount('0');
        setMerchantName('Payment Recipient');
      }
    };

    executeAnalysis();
  }, [isOpen, payload]);

  const populateFields = (result: ParsedPaymentResult, fallbackAccountId: string) => {
    setParsedData(result);
    setAmount(result.amount ? String(Math.round(parseFloat(result.amount))) : '');
    const isInc = result.type === 'income';
    setTransactionType(isInc ? 'income' : 'expense');
    setMerchantName(result.merchantName || (isInc ? 'Payment Sender' : 'UPI Merchant'));
    setCategory(result.category || (isInc ? 'Income' : 'General'));
    setDate(result.date || new Date().toISOString().split('T')[0]);
    setNotes(`${result.note || ''}${result.upiRef ? ` | Ref: ${result.upiRef}` : ''}`);
    if (!selectedAccountId) {
      setSelectedAccountId(fallbackAccountId);
    }
  };

  const handleQuickSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setInputError('Please enter a valid amount');
      window.dispatchEvent(new CustomEvent('toast-alert', { detail: { message: 'Please enter a valid amount', type: 'warning' } }));
      return;
    }

    setIsSaving(true);
    try {
      const txData = {
        title: merchantName.trim() || (transactionType === 'income' ? 'Received Payment' : 'Payment Recipient'),
        amount: Math.round(numAmount),
        category: category.toLowerCase(),
        date: date || new Date().toISOString().split('T')[0],
        notes: notes.trim(),
        type: transactionType,
        accountId: selectedAccountId || (accounts[0]?.id || '')
      };

      const ok = await onSaveTransaction(txData);
      if (ok) {
        triggerSparklesExplosion(0.5, 0.4);
        onClose();
      }
    } catch (err) {
      console.error('Failed to quick save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMore = () => {
    const numAmount = parseFloat(amount) || 0;
    const txData = {
      title: merchantName.trim() || (transactionType === 'income' ? 'Received Payment' : 'Payment Recipient'),
      amount: Math.round(numAmount),
      category: category.toLowerCase(),
      date: date || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      type: transactionType,
      accountId: selectedAccountId || (accounts[0]?.id || '')
    };
    onOpenFullEditor(txData);
    onClose();
  };

  const copyUtr = (ref: string) => {
    navigator.clipboard?.writeText(ref);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const renderAppLogo = (source?: string) => {
    switch (source) {
      case 'gpay':
        return <GooglePayLogo size={32} />;
      case 'phonepe':
        return <PhonePeLogo size={32} />;
      case 'paytm':
        return <PaytmLogo size={32} />;
      default:
        return (
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16
          }}>
            ⚡
          </div>
        );
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      backgroundColor: 'rgba(5, 10, 18, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      {/* Outer Card Container */}
      <div 
        className="hud-cyber-grid"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(165deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
          borderRadius: '28px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px 0 rgba(16, 185, 129, 0.15)',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
      >
        {/* Glowing Ambient Corner Orbs */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '-50px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Header with Close & Radar Pulse */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              animation: 'hudPulseRing 2s infinite'
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #34d399, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ZenBudget AI · Smart Payment Capture
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ================================================================= */}
        {/* STAGE 1: SCANNING & PROCESSING HUD                                */}
        {/* ================================================================= */}
        {stage !== 'ready' && stage !== 'error' && (
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            {/* Hologram Scanner Box */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '210px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: 'inset 0 0 30px rgba(16, 185, 129, 0.1)'
            }}>
              {/* Laser Scanning Beam */}
              <div className="hud-laser-bar" />

              {/* Sci-Fi Target Corners */}
              <div style={{ position: 'absolute', top: 12, left: 12, width: 16, height: 16, borderTop: '2px solid #10b981', borderLeft: '2px solid #10b981' }} />
              <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderTop: '2px solid #10b981', borderRight: '2px solid #10b981' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 12, width: 16, height: 16, borderBottom: '2px solid #10b981', borderLeft: '2px solid #10b981' }} />
              <div style={{ position: 'absolute', bottom: 12, right: 12, width: 16, height: 16, borderBottom: '2px solid #10b981', borderRight: '2px solid #10b981' }} />

              {/* Media Preview or Cyber Hologram Icon */}
              {payload.type === 'image' ? (
                <img
                  src={payload.data}
                  alt="Payment Receipt Screenshot"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'contrast(1.05) brightness(0.85)',
                    opacity: 0.8
                  }}
                />
              ) : (
                <div style={{ padding: '20px', textAlign: 'left', width: '100%' }}>
                  <div style={{ fontSize: '11px', color: '#34d399', marginBottom: '8px', fontFamily: 'monospace' }}>
                    &gt; INCOMING_UPI_PAYLOAD_DETECTED
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    lineHeight: '1.4',
                    maxHeight: '120px',
                    overflow: 'hidden'
                  }}>
                    {payload.data.slice(0, 160)}...
                  </div>
                </div>
              )}

              {/* Center Hologram Scanner Badge */}
              <div style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(16, 185, 129, 0.6)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
              }}>
                <Sparkles size={16} color="#34d399" style={{ animation: 'spin 4s linear infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                  {stage === 'receiving' ? 'Connecting to Source...' : stage === 'analyzing' ? 'AI Vision Scanning...' : 'Extracting Amount & UTR...'}
                </span>
              </div>
            </div>

            {/* Glowing Smooth Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              marginBottom: '12px',
              position: 'relative'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.8)',
                transition: 'width 0.4s ease-out'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
              <span>{statusMessage}</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>{progressPercent}%</span>
            </div>

            {/* 4-Step Pipeline Checklist */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              marginTop: '16px',
              textAlign: 'left'
            }}>
              <div style={{
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: progressPercent >= 25 ? '#34d399' : '#64748b'
              }}>
                <CheckCircle2 size={14} />
                <span>1. Share Handshake</span>
              </div>

              <div style={{
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: progressPercent >= 50 ? '#34d399' : '#64748b'
              }}>
                <CheckCircle2 size={14} />
                <span>2. AI Vision OCR</span>
              </div>

              <div style={{
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: progressPercent >= 75 ? '#34d399' : '#64748b'
              }}>
                <CheckCircle2 size={14} />
                <span>3. Amount & UTR Parse</span>
              </div>

              <div style={{
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: progressPercent >= 100 ? '#34d399' : '#64748b'
              }}>
                <CheckCircle2 size={14} />
                <span>4. Budget Envelope</span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STAGE 2: READY STATE (DETECTION CARD & 1-TAP SAVE)                 */}
        {/* ================================================================= */}
        {(stage === 'ready' || stage === 'error') && (
          <div>
            {/* Top Success Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {renderAppLogo(parsedData?.appSource)}
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Detected From
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                    {parsedData?.appSource ? parsedData.appSource.toUpperCase() : 'UPI Payment'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: transactionType === 'income' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.2)',
                color: transactionType === 'income' ? '#34d399' : '#fb7185',
                fontSize: '11px',
                fontWeight: 700
              }}>
                <ShieldCheck size={13} />
                <span>{transactionType === 'income' ? '💰 Income Detected' : '💸 Expense Detected'}</span>
              </div>
            </div>

            {/* Income vs Expense Quick Toggle */}
            <div style={{
              display: 'flex',
              padding: '4px',
              borderRadius: '16px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '16px',
              gap: '6px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setTransactionType('expense');
                  if (INCOME_CATEGORIES.includes(category)) setCategory('General');
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: transactionType === 'expense' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'transparent',
                  color: transactionType === 'expense' ? '#ffffff' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: transactionType === 'expense' ? '0 4px 14px rgba(244, 63, 94, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>💸 Expense (Spent)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTransactionType('income');
                  if (EXPENSE_CATEGORIES.includes(category)) setCategory('Income');
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: transactionType === 'income' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                  color: transactionType === 'income' ? '#ffffff' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: transactionType === 'income' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>💰 Income (Received)</span>
              </button>
            </div>

            {/* Big Amount Card */}
            <div style={{
              padding: '18px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${transactionType === 'income' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.25)'}`,
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                {transactionType === 'income' ? 'Total Received / Credited' : 'Total Paid / Debited'}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px'
              }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: transactionType === 'income' ? '#34d399' : '#f43f5e' }}>
                  {transactionType === 'income' ? '+' : '-'}{currencySymbol}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="0"
                  style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    color: '#ffffff',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '180px',
                    textAlign: 'center',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              {inputError && (
                <div style={{
                  marginTop: '8px',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={14} />
                  <span>{inputError}</span>
                </div>
              )}
            </div>

            {/* Form Fields: Merchant, Category, Account */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* Merchant / Payee */}
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  {transactionType === 'income' ? 'Sender / Received From' : 'Merchant / Paid To'}
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Edit3 size={15} color="#94a3b8" />
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Payee Name"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Grid: Category & Account */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Category */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Tag size={14} color="#34d399" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#f8fafc',
                        fontSize: '13px',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      {(transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                        <option key={c} value={c} style={{ background: '#0f172a', color: '#fff' }}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Account / Wallet */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    {transactionType === 'income' ? 'Credited Account' : 'Debited Account'}
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Wallet size={14} color="#06b6d4" />
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#f8fafc',
                        fontSize: '13px',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      {accounts && accounts.length > 0 ? (
                        accounts.map(acc => (
                          <option key={acc.id} value={acc.id} style={{ background: '#0f172a', color: '#fff' }}>
                            {acc.name} ({currencySymbol}{acc.balance ?? 0})
                          </option>
                        ))
                      ) : (
                        <option value="" style={{ background: '#0f172a', color: '#fff' }}>
                          Primary Wallet
                        </option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* UPI UTR Reference (If present) */}
              {parsedData?.upiRef && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}>
                  <span>UPI Ref / UTR: <strong style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{parsedData.upiRef}</strong></span>
                  <button
                    onClick={() => copyUtr(parsedData.upiRef!)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedUtr ? '#10b981' : '#38bdf8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    {copiedUtr ? <Check size={12} /> : <Copy size={12} />}
                    {copiedUtr ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons: Quick Save & Full Edit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleQuickSave}
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                <Zap size={18} fill="#ffffff" />
                <span>{isSaving ? 'Saving to Budget...' : '⚡ Quick Log to ZenBudget'}</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={handleEditMore}
                  style={{
                    padding: '11px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={14} />
                  <span>Edit Full Details</span>
                </button>

                <button
                  onClick={onClose}
                  style={{
                    padding: '11px',
                    borderRadius: '14px',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
