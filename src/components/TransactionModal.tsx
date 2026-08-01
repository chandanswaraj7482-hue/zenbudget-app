import React, { useState, useEffect } from 'react';
import { 
  X, 
  Utensils, 
  ShoppingBag, 
  Film, 
  CreditCard, 
  Compass, 
  HeartPulse, 
  MoreHorizontal, 
  Calendar, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Camera as CameraIcon,
  Lock,
  Clock
} from 'lucide-react';
import type { Transaction, CategoryType, Account } from '../types';
import { EXPENSE_MOODS, INCOME_MOODS, normalizeMood } from '../types';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { checkImpulseLock, type ImpulseLockCheckResult } from './WishlistBlocker';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  editingTransaction?: Transaction | null;
  currencySymbol: string;
  accounts?: Account[];
  onOpenTransfer?: () => void;
  onTransfer?: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => void;
  onPayViaUPI?: (amount: number, title: string) => void;
}

const CATEGORIES = [
  { id: 'food', label: '🍔 Food & Drinks', icon: <Utensils size={16} />, color: 'var(--warning)' },
  { id: 'shopping', label: '🛍️ Shopping', icon: <ShoppingBag size={16} />, color: 'var(--secondary)' },
  { id: 'entertainment', label: '🎬 Entertainment', icon: <Film size={16} />, color: 'var(--primary)' },
  { id: 'bills', label: '💳 Bills & Rent', icon: <CreditCard size={16} />, color: 'var(--info)' },
  { id: 'travel', label: '✈️ Travel', icon: <Compass size={16} />, color: 'var(--info)' },
  { id: 'health', label: '🏥 Health', icon: <HeartPulse size={16} />, color: 'var(--success)' },
  { id: 'other', label: '📦 Other', icon: <MoreHorizontal size={16} />, color: 'var(--text-muted)' }
] as const;

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  currencySymbol,
  accounts = [],
  onOpenTransfer: _onOpenTransfer,
  onTransfer,
  onPayViaUPI
}) => {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || accounts[0]?.id || '');
  const [transferError, setTransferError] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<CategoryType>('food');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  
  // Payee UPI ID states & interactive forms
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentType, setPaymentType] = useState<'qr' | 'phone' | 'bank' | 'upi_id'>('qr');
  const [payMobile, setPayMobile] = useState('');
  const [mobileUpiSuffix, setMobileUpiSuffix] = useState('ybl');
  const [payAccNum, setPayAccNum] = useState('');
  const [payIfsc, setPayIfsc] = useState('');
  const [payHolderName, setPayHolderName] = useState('');
  const [payUpiIdDirect, setPayUpiIdDirect] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{text: string; type: 'success' | 'error' | 'info'} | null>(null);
  const receiptFileRef = React.useRef<HTMLInputElement>(null);

  // QR Code Scanner States
  const [isQrScanning, setIsQrScanning] = useState(false);
  const [qrScanError, setQrScanError] = useState<string | null>(null);
  const [scannedUpiInfo, setScannedUpiInfo] = useState<{ payee: string; upiId: string; amount?: number } | null>(null);
  
  // Custom Date Picker States
  const [showCalendar, setShowCalendar] = useState(false);
  const [navDate, setNavDate] = useState(new Date());

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setTitle(editingTransaction.title);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
      setNavDate(new Date(editingTransaction.date));
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setCategory('food');
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setNotes('');
      setNavDate(new Date());
      setMood('');
    }
    setScanMessage(null);
    setShowCalendar(false);
  }, [editingTransaction, isOpen]);

  const [impulseLockData, setImpulseLockData] = useState<ImpulseLockCheckResult | null>(null);
  const [showImpulseLockModal, setShowImpulseLockModal] = useState(false);
  const [countdownStr, setCountdownStr] = useState('');
  const [cooledPercent, setCooledPercent] = useState(0);

  useEffect(() => {
    if (!showImpulseLockModal || !impulseLockData?.item) return;

    const updateTimer = () => {
      const createdAt = new Date(impulseLockData.item!.createdAt).getTime();
      const now = Date.now();
      const elapsed = now - createdAt;
      const LOCK_PERIOD_MS = 48 * 3600 * 1000;
      const remainingMs = Math.max(0, LOCK_PERIOD_MS - elapsed);

      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      const pct = Math.min(100, Math.max(0, Math.floor((elapsed / LOCK_PERIOD_MS) * 100)));
      setCooledPercent(pct);

      if (remainingMs <= 0) {
        setCountdownStr('00h 00m 00s (Cooling-off Completed)');
      } else {
        setCountdownStr(`Locking: ${hours}h ${minutes}m ${seconds}s left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [showImpulseLockModal, impulseLockData]);

  if (!isOpen) return null;

  const processReceiptBase64 = async (base64Data: string) => {
    setScanMessage({ text: '🔍 Analyzing receipt with AI Vision...', type: 'info' });
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Analyze this receipt image. Extract: 1. Merchant/Store Name (as "title"), 2. Total Amount Paid in numbers only (as "amount", no currency symbol), 3. Category - must be exactly one of: food, shopping, travel, entertainment, bills, health, other. Return ONLY raw JSON, no markdown, no code block: {"title": "Store Name", "amount": 123.45, "category": "food"}'
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }]
      })
    });
    if (!response.ok) throw new Error(`AI API error ${response.status}`);
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    // Strip any markdown code fences just in case
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.amount) setAmount(String(parseFloat(parsed.amount).toFixed(2)));
    if (parsed.category && ['food','shopping','travel','entertainment','bills','health','other'].includes(parsed.category)) {
      setCategory(parsed.category as any);
    }
    setType('expense');
    setScanMessage({ text: `✅ Receipt scanned: ${parsed.title || 'Unknown'} — ${currencySymbol}${parsed.amount || ''}`, type: 'success' });
  };

  const handleReceiptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setScanMessage(null);
    // Reset file input
    e.target.value = '';
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string;
          // dataUrl is "data:image/jpeg;base64,XXXXX"
          const base64Data = dataUrl.split(',')[1];
          await processReceiptBase64(base64Data);
        } catch (err: any) {
          setScanMessage({ text: `❌ ${err.message || 'OCR failed. Try a clearer image.'}`, type: 'error' });
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setScanMessage({ text: `❌ ${err.message || 'Failed to read file.'}`, type: 'error' });
      setIsScanning(false);
    }
  };

  const handleCameraScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      // On native Capacitor: use camera. On web: trigger file picker
      if (Capacitor.isNativePlatform()) {
        let image;
        try {
          image = await Camera.getPhoto({
            quality: 85,
            allowEditing: false,
            resultType: CameraResultType.Base64,
            source: CameraSource.Prompt
          });
        } catch (camErr: any) {
          if (camErr?.message?.includes('cancel') || camErr?.message?.includes('denied')) {
            setIsScanning(false);
            return;
          }
          throw camErr;
        }
        const base64Data = image?.base64String;
        if (!base64Data) throw new Error('Failed to read image data.');
        await processReceiptBase64(base64Data);
      } else {
        // Web: open file picker
        receiptFileRef.current?.click();
        setIsScanning(false); // will restart inside handleReceiptFileUpload
        return;
      }
    } catch (err: any) {
      console.warn('Receipt scan failed:', err);
      setScanMessage({ text: `❌ ${err.message || 'Scan failed. Try again.'}`, type: 'error' });
    } finally {
      setIsScanning(false);
    }
  };


  const handleQrCodeScan = async () => {
    setIsQrScanning(true);
    setQrScanError(null);
    setScannedUpiInfo(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

      let image;
      try {
        image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });
      } catch (camErr: any) {
        if (camErr.message && (camErr.message.includes('cancel') || camErr.message.includes('cancelled') || camErr.message.includes('user denied'))) {
          console.log('Camera capture cancelled.');
          setIsQrScanning(false);
          return;
        }
        throw camErr;
      }

      const base64Data = image?.base64String;
      if (!base64Data) {
        throw new Error('Failed to read image data.');
      }

      setQrScanError('Reading QR code / Merchant details with AI...');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: 'Analyze this image. It contains a merchant QR code or payment text. Extract the UPI deep-link URL (starts with upi://pay?...) or parse the UPI ID (has @) and payee/merchant name. Return ONLY a valid JSON object in this format, with NO markdown code blocks, NO extra text: {"upiUrl": "...", "payee": "Merchant/Payee Name", "upiId": "merchant@upi", "amount": 0.0}. If not found, return {"error": "Not found"}.'
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('AI Scanner failed to process QR.');
      }

      const resData = await response.json();
      const content = resData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!content) throw new Error('Failed to read QR. Try again.');

      // Strip markdown code fences if present in the Gemini response
      const cleanedContent = content.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(cleanedContent);
      if (parsed.error) {
        throw new Error('No valid UPI QR code found. Frame QR code clearly.');
      }

      const payee = parsed.payee || 'Merchant';
      const rawUpiUrl = parsed.upiUrl || '';
      
      let finalUpiId = parsed.upiId || '';
      if (!finalUpiId && rawUpiUrl) {
        const queryParams = new URLSearchParams(rawUpiUrl.split('?')[1] || '');
        finalUpiId = queryParams.get('pa') || '';
      }

      if (!finalUpiId || !finalUpiId.includes('@')) {
        throw new Error('Could not resolve a valid UPI ID from the scan.');
      }

      setScannedUpiInfo({
        payee,
        upiId: finalUpiId,
        amount: parsed.amount || undefined
      });

      // Autofill inputs
      setPayUpiIdDirect(finalUpiId);
      setPayHolderName(payee);
      setTitle(`UPI Pay to ${payee}`);
      if (parsed.amount && parsed.amount > 0) {
        setAmount(parsed.amount.toString());
      }
      setQrScanError(null);

    } catch (err: any) {
      console.warn('QR Code Scan Failed:', err);
      setQrScanError(err.message || 'Scan failed. Try again.');
    } finally {
      setIsQrScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    const parsedAmount = parseFloat(amount);

    if (type === 'transfer') {
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setTransferError('Please enter a valid transfer amount.');
        return;
      }
      const fromId = fromAccountId || accounts[0]?.id || '';
      const toId = toAccountId || accounts[1]?.id || accounts[0]?.id || '';
      if (!fromId || !toId || fromId === toId) {
        setTransferError('Please select two different accounts for transfer.');
        return;
      }
      if (onTransfer) {
        onTransfer(fromId, toId, parsedAmount, notes.trim());
      }
      onClose();
      return;
    }

    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setScanMessage({ text: 'Please fill out all required fields with valid values.', type: 'error' });
      return;
    }

    if (type === 'expense' && !editingTransaction) {
      const profileId = localStorage.getItem('zb_profile_id') || '';
      const lockCheck = checkImpulseLock(profileId, title.trim(), parsedAmount);
      if (lockCheck.isLocked) {
        setImpulseLockData(lockCheck);
        setShowImpulseLockModal(true);
        return;
      }
    }

    let finalNotes = notes.trim();
    if (mood) {
      const moodMap: Record<string, string> = { 
        happy: '😊 Happy', 
        stressed: '😫 Stressed', 
        regret: '😔 Regret', 
        excited: '😍 Excited', 
        neutral: '😐 Neutral',
        proud: '💪 Proud',
        grateful: '🙏 Grateful',
        sad: '😔 Regret', 
        angry: '😫 Stressed', 
        calm: '😐 Neutral' 
      };
      const moodLabel = moodMap[mood] || mood;
      finalNotes = `[${moodLabel}] ${finalNotes}`.trim();
    }

    onSave({
      id: editingTransaction?.id,
      title: title.trim(),
      amount: parsedAmount,
      category,
      date,
      type,
      notes: finalNotes || undefined,
      accountId: selectedAccountId || accounts[0]?.id || undefined
    });
    onClose();
  };

  // Helper calendar date calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(navDate.getFullYear(), navDate.getMonth(), day);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
    setShowCalendar(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '24px',
          borderRadius: '24px',
          position: 'relative',
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
            {editingTransaction ? (type === 'expense' ? 'Edit Expense' : 'Edit Income') : 'New Transaction'}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Scan Receipt: Only show when creating a NEW transaction */}
          {!editingTransaction && type === 'expense' && (
            <>
              <button 
                type="button"
                onClick={handleCameraScan}
                disabled={isScanning}
                className="glass-panel"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  padding: '16px', 
                  border: '1px solid var(--primary)', 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  cursor: isScanning ? 'not-allowed' : 'pointer', 
                  borderRadius: '16px', 
                  color: 'var(--primary)', 
                  fontWeight: 700,
                  opacity: isScanning ? 0.7 : 1,
                  width: '100%'
                }}
              >
                <CameraIcon size={20} className={isScanning ? "animate-spin" : ""} />
                <span>{isScanning ? 'Scanning Receipt...' : '📷 Scan Receipt (Camera / Upload)'}</span>
              </button>

              {/* Hidden file input for web-based receipt upload */}
              <input
                type="file"
                ref={receiptFileRef}
                accept="image/*"
                onChange={handleReceiptFileUpload}
                style={{ display: 'none' }}
              />
            </>
          )}

          {/* Scan Status Message (inline, no alert) */}
          {scanMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              lineHeight: '1.4',
              background: scanMessage.type === 'success' ? 'rgba(34,197,94,0.1)' : scanMessage.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
              color: scanMessage.type === 'success' ? 'var(--success)' : scanMessage.type === 'error' ? '#ef4444' : '#818cf8',
              border: `1px solid ${scanMessage.type === 'success' ? 'rgba(34,197,94,0.2)' : scanMessage.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`,
              animation: 'fadeIn 0.3s ease-out'
            }}>
              {scanMessage.text}
            </div>
          )}

          {/* Income/Expense/Transfer Selector: Show toggle ONLY when creating NEW transaction */}
          {!editingTransaction ? (
            <div style={{ 
              display: 'flex', 
              background: 'var(--bg-input)', 
              padding: '4px', 
              borderRadius: '16px',
              border: '1px solid var(--border-input)'
            }}>
              <button
                type="button"
                onClick={() => setType('expense')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  transition: 'var(--transition-smooth)',
                  backgroundColor: type === 'expense' ? 'var(--danger)' : 'transparent',
                  color: type === 'expense' ? '#fff' : 'var(--text-secondary)',
                  boxShadow: type === 'expense' ? '0 4px 12px rgba(244, 63, 94, 0.3)' : 'none'
                }}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  transition: 'var(--transition-smooth)',
                  backgroundColor: type === 'income' ? 'var(--success)' : 'transparent',
                  color: type === 'income' ? '#fff' : 'var(--text-secondary)',
                  boxShadow: type === 'income' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setType('transfer')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  transition: 'var(--transition-smooth)',
                  backgroundColor: type === 'transfer' ? '#818cf8' : 'transparent',
                  color: type === 'transfer' ? '#fff' : 'var(--text-secondary)',
                  boxShadow: type === 'transfer' ? '0 4px 12px rgba(129, 140, 248, 0.3)' : 'none'
                }}
              >
                Transfer ⇆
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              borderRadius: '14px',
              background: type === 'expense' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              border: `1px solid ${type === 'expense' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
              color: type === 'expense' ? 'var(--danger)' : 'var(--success)',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              Editing {type === 'expense' ? 'Expense' : 'Income'} Record
            </div>
          )}

          {type === 'transfer' ? (
            <>
              {transferError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  {transferError}
                </div>
              )}

              {/* From Account */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  From Account
                </label>
                <select
                  value={fromAccountId}
                  onChange={e => setFromAccountId(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', background: 'var(--bg-input)' }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type === 'cash' ? '🪙' : acc.type === 'upi' ? '📱' : acc.type === 'credit' ? '💳' : acc.type === 'wallet' ? '👛' : acc.type === 'custom' ? '✨' : '🏦'} {acc.name} ({currencySymbol}{acc.balance})
                    </option>
                  ))}
                </select>
              </div>

              {/* To Account */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  To Account
                </label>
                <select
                  value={toAccountId}
                  onChange={e => setToAccountId(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', background: 'var(--bg-input)' }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type === 'cash' ? '🪙' : acc.type === 'upi' ? '📱' : acc.type === 'credit' ? '💳' : acc.type === 'wallet' ? '👛' : acc.type === 'custom' ? '✨' : '🏦'} {acc.name} ({currencySymbol}{acc.balance})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer Amount */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>
                  Transfer Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '28px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {currencySymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={amount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = clean.split('.');
                      if (parts.length > 2) return;
                      setAmount(clean);
                    }}
                    placeholder="0"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '16px 16px 16px 40px',
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#818cf8',
                      outline: 'none',
                      textAlign: 'left'
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason / Self Transfer..."
                  className="glass-input"
                />
              </div>

              <button
                type="submit"
                className="glass-button active"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: 700,
                  marginTop: '10px',
                  background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                  color: '#ffffff'
                }}
              >
                Transfer Money ⇆
              </button>
            </>
          ) : (
            <>

          {/* Account Selector */}
          {accounts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Account / Wallet
              </label>
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="glass-input"
                style={{ width: '100%', background: 'var(--bg-input)' }}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.type === 'cash' ? '🪙' : acc.type === 'upi' ? '📱' : acc.type === 'credit' ? '💳' : '🏦'} {acc.name} ({currencySymbol}{acc.balance})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>
              Amount
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                left: '16px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                fontSize: '28px', 
                fontWeight: 700,
                color: 'var(--text-secondary)'
              }}>
                {currencySymbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = clean.split('.');
                  if (parts.length > 2) return;
                  setAmount(clean);
                }}
                placeholder="0"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '16px 16px 16px 40px',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: type === 'expense' ? 'var(--danger)' : 'var(--success)',
                  outline: 'none',
                  textAlign: 'left'
                }}
              />
            </div>
          </div>

          {/* Title Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {type === 'income' ? 'Income Source' : 'Expense Description'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'income' ? 'e.g., Salary, Freelance, Gift' : 'e.g., Grocery Shopping, Uber, Zomato'}
              className="glass-input"
            />
          </div>

          {/* Category Field (only if type is expense) */}
          {type === 'expense' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Category
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '8px' 
              }}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 4px',
                        borderRadius: '14px',
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)',
                        backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        borderColor: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      <div className={cat.id === category ? '' : cat.color} style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#fff' : undefined
                      }}>
                        {cat.icon}
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 600, textAlign: 'center', lineHeight: '1.2', marginTop: '2px' }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Premium Custom Date Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Date
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 2 }} />
              
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                className="glass-input"
                style={{ 
                  paddingLeft: '48px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  height: '42px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  userSelect: 'none'
                }}
              >
                {new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>

              {/* Glassmorphic React Calendar Panel */}
              {showCalendar && (
                <div 
                  className="glass-panel" 
                  style={{
                    position: 'absolute',
                    top: '48px',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    padding: '16px',
                    borderRadius: '20px',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    background: 'var(--bg-dark)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Month header navigation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <button 
                      type="button"
                      onClick={() => setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1))}
                      style={{ background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>
                      {navDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1))}
                      style={{ background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Weekday headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                      <span key={d} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{d}</span>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {/* Month Offset empty spaces */}
                    {Array.from({ length: getFirstDayOfMonth(navDate.getFullYear(), navDate.getMonth()) }).map((_, idx) => (
                      <div key={`empty-${idx}`} />
                    ))}
                    
                    {/* Days items */}
                    {Array.from({ length: getDaysInMonth(navDate.getFullYear(), navDate.getMonth()) }).map((_, idx) => {
                      const day = idx + 1;
                      const isSelected = 
                        new Date(date).getDate() === day &&
                        new Date(date).getMonth() === navDate.getMonth() &&
                        new Date(date).getFullYear() === navDate.getFullYear();
                        
                      return (
                        <button
                          key={`day-${day}`}
                          type="button"
                          onClick={() => handleDateSelect(day)}
                          style={{
                            padding: '6px 0',
                            fontSize: '12px',
                            fontWeight: 700,
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            background: isSelected ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                            color: isSelected ? '#fff' : 'var(--text-primary)',
                            boxShadow: isSelected ? '0 4px 10px rgba(34, 197, 94, 0.25)' : 'none',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mood Selector (Optional) - Different for Income vs Expense */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {type === 'income' ? 'How does this earning feel? (Optional)' : 'How did this spend feel? (Optional)'}
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(type === 'income' ? INCOME_MOODS : EXPENSE_MOODS).map((m) => {
                const currentNorm = normalizeMood(mood, type);
                const isSelected = currentNorm === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(isSelected ? '' : m.id)}
                    className={`glass-button ${isSelected ? 'active' : ''}`}
                    style={{
                      flex: '1 1 18%',
                      minWidth: '60px',
                      padding: '10px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      background: isSelected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{m.emoji}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>


          {/* Payee UPI ID input removed */}

          {/* Notes Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notes (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <FileText size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={type === 'income' ? 'Add income details, invoice number...' : 'Add receipt details or tags...'}
                className="glass-input"
                style={{ paddingLeft: '48px', minHeight: '80px', paddingTop: '14px', resize: 'vertical' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="glass-button active"
            style={{
              padding: '14px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 700,
              background: 'linear-gradient(to right, var(--primary), var(--secondary))',
              border: 'none',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            {editingTransaction ? 'Save Changes' : 'Save Transaction Only'}
          </button>

          {/* Direct Cashfree PhonePe Payment Button */}
          {!editingTransaction && type === 'expense' && (
            <button
              type="button"
              onClick={() => {
                const parsedAmount = parseFloat(amount);
                if (isNaN(parsedAmount) || parsedAmount <= 0) {
                  setScanMessage({ text: 'Please enter a valid expense amount (e.g. ₹500).', type: 'error' });
                  return;
                }
                const payTitle = title.trim() || 'Expense Payment';
                if (onPayViaUPI) {
                  onPayViaUPI(parsedAmount, payTitle);
                  onClose();
                } else {
                  setShowPaymentOptions(true);
                }
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #10b981 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <span>⚡ Pay via Cashfree (PhonePe / Cards / Netbanking)</span>
            </button>
          )}

          {showPaymentOptions && (
            <div className="glass-panel animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '16px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>Choose Payment Method 💳</span>
                <button type="button" onClick={() => setShowPaymentOptions(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.15)', padding: '3px', borderRadius: '10px' }}>
                {(['qr', 'phone', 'bank', 'upi_id'] as const).map(tab => {
                  const labelMap = { qr: 'Scan QR', phone: 'Mobile', bank: 'Bank A/c', upi_id: 'UPI ID' };
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPaymentType(tab)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: paymentType === tab ? 'var(--primary)' : 'transparent',
                        color: paymentType === tab ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {labelMap[tab]}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paymentType === 'qr' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '10px 0', textAlign: 'center' }}>
                    {/* QR scanner action */}
                    <button
                      type="button"
                      onClick={handleQrCodeScan}
                      disabled={isQrScanning}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '16px',
                        border: isQrScanning ? '2px solid var(--primary)' : '2px dashed var(--primary)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(34,197,94,0.02)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        gap: '6px'
                      }}
                    >
                      {isQrScanning && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          width: '100%',
                          height: '2px',
                          backgroundColor: 'var(--primary)',
                          boxShadow: '0 0 8px var(--primary)',
                          animation: 'scanLine 2s infinite ease-in-out'
                        }} />
                      )}
                      <span style={{ fontSize: '32px' }}>📷</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Tap to Scan</span>
                    </button>
                    
                    {qrScanError && (
                      <span style={{ 
                        fontSize: '11px', 
                        color: qrScanError.includes('Success') || qrScanError.includes('Reading') ? 'var(--primary)' : '#f87171',
                        fontWeight: 600,
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '6px'
                      }}>
                        {qrScanError}
                      </span>
                    )}

                    {scannedUpiInfo && (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '2px',
                        fontSize: '11px', 
                        color: 'var(--success)', 
                        fontWeight: 700,
                        padding: '8px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        width: '100%'
                      }}>
                        <span>✅ Scanned Payee: {scannedUpiInfo.payee}</span>
                        <span style={{ fontSize: '9px', opacity: 0.8 }}>({scannedUpiInfo.upiId})</span>
                        {scannedUpiInfo.amount && <span>Amount: ₹{scannedUpiInfo.amount}</span>}
                      </div>
                    )}

                    <input
                      type="text"
                      value={payUpiIdDirect}
                      onChange={(e) => setPayUpiIdDirect(e.target.value)}
                      placeholder="Or paste UPI QR text / UPI ID here..."
                      className="glass-input"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '11px', outline: 'none' }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Point camera to merchant QR code or enter UPI ID to pay & deep-link instantly.
                    </span>
                  </div>
                )}

                {paymentType === 'phone' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={payMobile}
                      onChange={(e) => setPayMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit Mobile No."
                      className="glass-input"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
                    />
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>Select UPI Handle (Recipient's App):</div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '5px' }}>
                        {[
                          { id: 'ybl', label: 'PhonePe' },
                          { id: 'okaxis', label: 'GPay' },
                          { id: 'oksbi', label: 'GPay SBI' },
                          { id: 'paytm', label: 'Paytm' },
                          { id: 'okicici', label: 'GPay ICICI' },
                          { id: 'upi', label: 'BHIM' },
                        ].map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setMobileUpiSuffix(item.id)}
                            style={{
                              padding: '4px 8px', borderRadius: '6px', border: mobileUpiSuffix === item.id ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                              background: mobileUpiSuffix === item.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                              color: mobileUpiSuffix === item.id ? '#34d399' : '#94a3b8',
                              fontSize: '10px', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            @{item.id} ({item.label})
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Custom: @</span>
                        <input
                          type="text"
                          value={mobileUpiSuffix}
                          onChange={e => setMobileUpiSuffix(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                          placeholder="custom handle"
                          style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#34d399', fontSize: '11px', fontWeight: 700, outline: 'none' }}
                        />
                      </div>
                      {payMobile.length === 10 && (
                        <div style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '4px', fontWeight: 600 }}>
                          VPA: {payMobile}@{mobileUpiSuffix || 'ybl'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {paymentType === 'upi_id' && (
                  <input
                    type="text"
                    value={payUpiIdDirect}
                    onChange={(e) => setPayUpiIdDirect(e.target.value)}
                    placeholder="Enter Payee UPI ID (e.g. shop@okaxis)"
                    className="glass-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
                  />
                )}

                {paymentType === 'bank' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      value={payHolderName}
                      onChange={(e) => setPayHolderName(e.target.value)}
                      placeholder="Account Holder Name"
                      className="glass-input"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={payAccNum}
                        onChange={(e) => setPayAccNum(e.target.value.replace(/\D/g, ''))}
                        placeholder="Account Number"
                        className="glass-input"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        value={payIfsc}
                        onChange={(e) => setPayIfsc(e.target.value.toUpperCase())}
                        placeholder="IFSC Code"
                        className="glass-input"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={() => {
                    const parsedAmount = parseFloat(amount);
                    if (!parsedAmount || parsedAmount <= 0) {
                      setScanMessage({ text: 'Please enter a valid amount first.', type: 'error' });
                      return;
                    }

                    let finalUpiAddress = '';
                    let finalPayeeName = payHolderName.trim() || title.trim() || 'Payment';

                    if (paymentType === 'qr') {
                      if (scannedUpiInfo) {
                        finalUpiAddress = scannedUpiInfo.upiId;
                        finalPayeeName = scannedUpiInfo.payee || finalPayeeName;
                      } else if (payUpiIdDirect.trim()) {
                        finalUpiAddress = payUpiIdDirect.trim();
                      } else {
                        finalUpiAddress = 'chandanswaraj7482@okicici';
                        finalPayeeName = 'ZenBudget Payee';
                      }
                    } else if (paymentType === 'phone') {
                      if (payMobile.length !== 10) {
                        setScanMessage({ text: 'Please enter a valid 10-digit mobile number.', type: 'error' });
                        return;
                      }
                      const handle = (mobileUpiSuffix || 'upi').trim().replace(/^@/, '');
                      finalUpiAddress = `${payMobile}@${handle}`;
                      finalPayeeName = payHolderName.trim() || 'User';
                    } else if (paymentType === 'upi_id') {
                      if (!payUpiIdDirect.includes('@')) {
                        setScanMessage({ text: 'Please enter a valid UPI ID (must contain @).', type: 'error' });
                        return;
                      }
                      finalUpiAddress = payUpiIdDirect.trim();
                    } else if (paymentType === 'bank') {
                      if (!payAccNum || !payIfsc) {
                        setScanMessage({ text: 'Please fill Bank Account Number and IFSC Code.', type: 'error' });
                        return;
                      }
                      finalUpiAddress = `${payAccNum.trim()}@${payIfsc.trim().toUpperCase()}.ifsc.npci`;
                      finalPayeeName = payHolderName.trim() || 'Bank Transfer';
                    }

                    // CRITICAL: VPA must be lowercase, no spaces, only allowed chars
                    let cleanVpa = finalUpiAddress.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9@._-]/g, '');
                    if (!cleanVpa.includes('@')) {
                      cleanVpa = `${cleanVpa}@upi`;
                    }
                    // Payee name (alphanumeric only, no %20 to prevent GPay Intent parse error)
                    const cleanPn = (finalPayeeName || 'ZenBudget').replace(/[^a-zA-Z0-9]/g, '').trim().slice(0, 30) || 'ZenBudget';
                    // Format amount cleanly: clean integer for whole numbers (e.g. '1'), 2 decimals for fractions (e.g. '1.50')
                    const amountStr = (parsedAmount % 1 === 0) ? Math.round(parsedAmount).toString() : parsedAmount.toFixed(2);
                    const cleanTn = (title.trim() || 'Payment').replace(/[^a-zA-Z0-9]/g, '').slice(0, 30);

                    // NPCI P2P URL — NO mc param (mc causes bank limit exceeded error in GPay)
                    const tr = `ZB${Date.now().toString().slice(-10)}`;
                    const tid = `T${Date.now().toString().slice(-10)}`;
                    // Only include amount if it's > 0 to avoid bank rejection
                    const upiUrl = amountStr && parseFloat(amountStr) > 0
                      ? `upi://pay?pa=${cleanVpa}&pn=${cleanPn}&tr=${tr}&tid=${tid}&mode=00&am=${amountStr}&cu=INR&tn=${cleanTn}`
                      : `upi://pay?pa=${cleanVpa}&pn=${cleanPn}&tr=${tr}&tid=${tid}&mode=00&cu=INR&tn=${cleanTn}`;
                    console.log('Launching UPI URL (P2P):', upiUrl);

                    // Save transaction FIRST (before redirect so data is never lost)
                    let finalNotes = notes.trim();
                    if (mood) {
                      const moodMap: Record<string, string> = { happy: '😊 Happy', stressed: '😡 Stressed', sad: '😢 Regret/Sad' };
                      finalNotes = `[${moodMap[mood]}] ${finalNotes}`.trim();
                    }
                    const methodLabels: Record<string, string> = { qr: 'QR Scan', phone: 'Mobile Pay', bank: 'Bank Transfer', upi_id: 'UPI Direct' };
                    const prefix = `[UPI ${methodLabels[paymentType]} to ${cleanVpa}]`;
                    onSave({
                      title: title.trim(),
                      amount: parsedAmount,
                      category,
                      date,
                      type,
                      notes: finalNotes ? `${prefix} ${finalNotes}` : prefix
                    });

                    // Auto copy VPA to clipboard as instant fallback
                    try {
                      if (cleanVpa && navigator.clipboard) {
                        navigator.clipboard.writeText(cleanVpa).catch(() => {});
                      }
                    } catch (e) {}

                    // Method 1: Direct upi:// location dispatch (Works 100% in Native APK & Android WebView)
                    try {
                      window.location.href = upiUrl;
                    } catch (e) {}

                    // Method 2: Anchor click for upi:// scheme
                    try {
                      const a1 = document.createElement('a');
                      a1.href = upiUrl;
                      a1.setAttribute('target', '_system');
                      a1.setAttribute('rel', 'noopener');
                      document.body.appendChild(a1);
                      a1.click();
                      setTimeout(() => { try { document.body.removeChild(a1); } catch (_) {} }, 300);
                    } catch (e) {}

                    // Method 3: Intent scheme fallback for Mobile Chrome browser
                    if (!Capacitor.isNativePlatform() && upiUrl.startsWith('upi://pay?')) {
                      const intentUrl = `intent://pay?${upiUrl.replace('upi://pay?', '')}#Intent;scheme=upi;end;`;
                      try {
                        const a2 = document.createElement('a');
                        a2.href = intentUrl;
                        document.body.appendChild(a2);
                        a2.click();
                        setTimeout(() => { try { document.body.removeChild(a2); } catch (_) {} }, 300);
                      } catch (e) {}
                    }

                    onClose();
                  }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                Proceed to Payment (₹{parseFloat(amount) || 0}) 🚀
              </button>
            </div>
          )}
          </>
          )}
        </form>
      </div>


      {/* Impulse Lock Warning Modal Popup */}
      {showImpulseLockModal && impulseLockData?.item && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(16px)',
          zIndex: 1300,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '400px',
            background: 'linear-gradient(180deg, rgba(30, 20, 45, 0.98) 0%, rgba(15, 12, 25, 0.98) 100%)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              background: 'rgba(236, 72, 153, 0.15)',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <Lock size={28} />
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                Impulse Purchase Locked! ⏳
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                This item is currently on a 48-hour cooling-off pause in your <strong>Impulse Blocker</strong>.
              </p>
            </div>

            {/* Item Card */}
            <div style={{
              background: 'var(--bg-input)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid var(--border-input)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{impulseLockData.item.name}</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#ec4899' }}>{currencySymbol}{impulseLockData.item.amount}</span>
              </div>
              {impulseLockData.item.reason && (
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                  💡 <i>"{impulseLockData.item.reason}"</i>
                </p>
              )}

              {/* Countdown Timeline Bar */}
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ec4899', fontWeight: 700, marginBottom: '6px' }}>
                  <span><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> {countdownStr}</span>
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

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '10px', fontSize: '11px', color: '#f87171', textAlign: 'left' }}>
              ⚠️ ZenBudget is protecting your money. Waiting 48 hours eliminates 84% of regret purchases!
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowImpulseLockModal(false);
                  setImpulseLockData(null);
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🛑 Respect 48h Hold (Cancel Expense)
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowImpulseLockModal(false);
                  const parsedAmount = parseFloat(amount);
                  onSave({
                    id: editingTransaction?.id,
                    title: title.trim(),
                    amount: parsedAmount,
                    category,
                    date,
                    type,
                    notes: notes.trim() || undefined
                  });
                  onClose();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ⏩ Override Lock &amp; Log Expense Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
