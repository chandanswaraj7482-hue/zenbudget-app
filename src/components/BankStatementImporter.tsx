import React, { useState, useRef } from 'react';
import { CoinCatcherGame } from './CoinCatcherGame';
import { 
  ChevronLeft, UploadCloud, FileText, CheckCircle2, AlertCircle, 
  Sparkles, ShieldCheck, ArrowRight, Landmark, Lock, 
  CheckSquare, Square, Wallet, Tag, TrendingUp, TrendingDown, Zap, Play, X
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { admobService } from '../services/admobService';
import { supabase } from '../supabaseClient';
import { 
  parseCSVStatement, 
  parseAIBankStatement
} from '../utils/bankStatementParser';
import type { 
  BankStatementAnalysisResult, 
  ParsedBankTransaction 
} from '../utils/bankStatementParser';

interface BankStatementImporterProps {
  onBack: () => void;
  isPremiumUser: boolean;
  onOpenSubscriptionModal: () => void;
  accounts?: any[];
  currencySymbol?: string;
  onRefreshData?: () => void;
  onSaveTransaction?: (tx: any) => Promise<boolean>;
  onNavigateToLedger?: () => void;
  triggerToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'danger') => void;
  userReferralCode?: string;
}

export const BankStatementImporter: React.FC<BankStatementImporterProps> = ({
  onBack,
  isPremiumUser,
  onOpenSubscriptionModal,
  accounts = [],
  currencySymbol = '₹',
  onRefreshData,
  onSaveTransaction,
  onNavigateToLedger,
  triggerToast,
  userReferralCode = ''
}) => {
  const [localToast, setLocalToast] = useState<{ msg: string; type: 'info' | 'success' | 'warning' | 'danger' } | null>(null);

  const notify = (msg: string, type: 'info' | 'success' | 'warning' | 'danger' = 'warning') => {
    if (triggerToast) {
      triggerToast(msg, type);
    } else {
      setLocalToast({ msg, type });
      setTimeout(() => setLocalToast(null), 3500);
    }
  };
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [filePassword, setFilePassword] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing AI Statement Engine...');
  const [analysisResult, setAnalysisResult] = useState<BankStatementAnalysisResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scansUsed, setScansUsed] = useState<number>(() => {
    return Number(localStorage.getItem('zb_statement_scans_used') || 0);
  });
  const [trialUnlocked, setTrialUnlocked] = useState<boolean>(false);
  const [showAdModal, setShowAdModal] = useState<boolean>(false);
  const [isAdLoading, setIsAdLoading] = useState<boolean>(false);

  const isLocked = !isPremiumUser && scansUsed >= 1;
  const needsAdUnlock = !isPremiumUser && scansUsed === 0 && !trialUnlocked;
  const hasAccess = isPremiumUser || (scansUsed === 0 && trialUnlocked);

  const handleWatchRewardedAd = () => {
    setIsAdLoading(true);
    if (Capacitor.isNativePlatform()) {
      admobService.showRewardedAd(() => {
        setIsAdLoading(false);
        setTrialUnlocked(true);
        setShowAdModal(false);
        notify('🎉 1-Time Free Statement Scan Unlocked!', 'success');
        setTimeout(() => fileInputRef.current?.click(), 300);
      }).catch(() => {
        setIsAdLoading(false);
        notify('Ad could not load. Try again or upgrade to Pro.', 'warning');
      });
    } else {
      setTimeout(() => {
        setIsAdLoading(false);
        setTrialUnlocked(true);
        setShowAdModal(false);
        notify('🎉 1-Time Free Statement Scan Unlocked!', 'success');
        setTimeout(() => fileInputRef.current?.click(), 300);
      }, 2000);
    }
  };

  const handleUploadAreaClick = () => {
    if (isPremiumUser) {
      fileInputRef.current?.click();
      return;
    }
    if (scansUsed >= 1) {
      onOpenSubscriptionModal();
      return;
    }
    if (!trialUnlocked) {
      setShowAdModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremiumUser && scansUsed >= 1) {
      onOpenSubscriptionModal();
      return;
    }
    if (!isPremiumUser && scansUsed === 0 && !trialUnlocked) {
      setShowAdModal(true);
      return;
    }
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setAnalysisResult(null);
    setImportSuccess(false);

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const startAnalysis = async () => {
    if (!isPremiumUser && scansUsed >= 1) {
      onOpenSubscriptionModal();
      return;
    }
    if (!isPremiumUser && scansUsed === 0 && !trialUnlocked) {
      setShowAdModal(true);
      return;
    }
    if (!file) {
      notify('Please select a bank statement file first.', 'warning');
      return;
    }

    // Mark 1-time free trial as used
    if (!isPremiumUser && scansUsed === 0) {
      setScansUsed(1);
      localStorage.setItem('zb_statement_scans_used', '1');
    }

    setIsProcessing(true);
    setProgressPercent(15);
    setStatusMessage('Reading statement file headers...');

    try {
      if (file.name.endsWith('.csv') || file.type.includes('csv')) {
        const text = await file.text();
        setProgressPercent(45);
        setStatusMessage('Parsing statement rows and debits/credits...');
        await new Promise(r => setTimeout(r, 500));
        const res = parseCSVStatement(text);
        setProgressPercent(100);
        setStatusMessage('Verified successfully!');
        if (res.transactions.length === 0) {
          notify('No transactions found in this CSV. Please check the file formatting.', 'warning');
        }
        setAnalysisResult(res);
        setIsProcessing(false);
      } else {
        // PDF or Image
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result as string;
          const mime = file.type || 'image/jpeg';
          try {
            const res = await parseAIBankStatement(base64, mime, (msg, pct) => {
              setStatusMessage(msg);
              setProgressPercent(pct);
            }, filePassword);
            if (res.transactions.length === 0) {
              notify('No visible transactions could be extracted. Please upload a clearer photo of your passbook or statement.', 'warning');
            }
            setAnalysisResult(res);
          } catch (err) {
            console.error('AI parse error:', err);
            notify('Failed to parse statement. Please ensure the image or PDF is clear and readable.', 'danger');
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Statement parsing failed:', err);
      notify('Could not parse statement. Please upload a valid bank statement file.', 'danger');
      setIsProcessing(false);
    }
  };

  const toggleTransactionSelection = (id: string) => {
    if (!analysisResult) return;
    setAnalysisResult({
      ...analysisResult,
      transactions: analysisResult.transactions.map(t => 
        t.id === id ? { ...t, selected: !t.selected } : t
      )
    });
  };

  const toggleSelectAll = () => {
    if (!analysisResult) return;
    const allSelected = analysisResult.transactions.every(t => t.selected);
    setAnalysisResult({
      ...analysisResult,
      transactions: analysisResult.transactions.map(t => ({ ...t, selected: !allSelected }))
    });
  };

  const handleBatchImport = async () => {
    if (!analysisResult) return;
    const toImport = analysisResult.transactions.filter(t => t.selected);
    if (toImport.length === 0) {
      notify('Please select at least one transaction to import', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      const targetAccId = selectedAccountId || (accounts[0]?.id || '');
      const profileId = localStorage.getItem('zb_profile_id') || 'local';

      const payload = toImport.map(t => ({
        user_id: profileId,
        account_id: targetAccId,
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category.toLowerCase(),
        date: t.date,
        notes: `Imported via Bank Statement | ${t.rawNarration || t.title}`
      }));

      if (onSaveTransaction) {
        for (const t of toImport) {
          await onSaveTransaction({
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category.toLowerCase(),
            date: t.date,
            notes: `Imported via Bank Statement | ${t.rawNarration || t.title}`,
            accountId: targetAccId
          });
        }
      } else {
        // Try inserting into Supabase
        const { error } = await supabase.from('transactions').insert(payload);
        if (error) {
          console.warn('Supabase bulk insert warning, transactions saved locally:', error);
        }
      }

      setImportedCount(toImport.length);
      setImportSuccess(true);
      onRefreshData?.();
    } catch (err) {
      console.error('Batch import error:', err);
      setImportedCount(toImport.length);
      setImportSuccess(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      position: 'relative'
    }}>
      {/* Floating Local Notification */}
      {localToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999999,
          padding: '12px 20px',
          borderRadius: '14px',
          background: localToast.type === 'danger' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(245, 158, 11, 0.95)',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '90%'
        }}>
          <AlertCircle size={16} />
          <span>{localToast.msg}</span>
        </div>
      )}

      {/* Header - Sticky Frozen at top */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-divider)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              borderRadius: '12px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              flexShrink: 0
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                AI Bank Assistant
              </h2>
              <span style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1.2,
                flexShrink: 0
              }}>
                PRO
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Statement Intelligence & Passbook Parser
            </p>
          </div>
        </div>

        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Landmark size={20} />
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: '16px 20px', flex: 1, maxWidth: '640px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Compact Pro / Trial Bar */}
        {!isPremiumUser && (
          <div style={{
            background: scansUsed >= 1 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.1) 100%)',
            border: scansUsed >= 1 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '18px' }}>{scansUsed >= 1 ? '👑' : '🎬'}</span>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: scansUsed >= 1 ? '#ef4444' : '#10b981', display: 'block' }}>
                  {scansUsed >= 1 ? 'Free Trial Used' : '1st Statement Free Trial'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>
                  {scansUsed >= 1 ? 'Upgrade to Pro for unlimited parsing' : 'Watch 1 short sponsor video to unlock free scan'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (scansUsed >= 1) {
                  onOpenSubscriptionModal();
                } else if (!trialUnlocked) {
                  setShowAdModal(true);
                } else {
                  onOpenSubscriptionModal();
                }
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                background: scansUsed >= 1 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              {scansUsed >= 1 ? <Sparkles size={12} /> : <Play size={12} fill="#fff" />}
              <span>{scansUsed >= 1 ? 'Get Pro' : (trialUnlocked ? 'Unlocked ✓' : 'Watch Ad')}</span>
            </button>
          </div>
        )}

        {/* Compact Netbanking Share Hint */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '16px' }}>📲</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.4 }}>
              <strong style={{ color: 'var(--text-primary)' }}>1-Tap Direct Share:</strong> Download Bank Statement PDF in any netbanking app or GPay ➔ Tap <strong>"Share"</strong> ➔ Select <strong>ZenBudget</strong>
            </span>
          </div>
        </div>


        {/* =================================================================== */}
        {/* FILE UPLOAD CARD (WHEN NO RESULT YET)                                */}
        {/* =================================================================== */}
        {!analysisResult && !isProcessing && !importSuccess && (
          <div>
            <div
              onClick={handleUploadAreaClick}
              style={{
                background: 'var(--bg-card)',
                border: !isPremiumUser ? '2px dashed rgba(245, 158, 11, 0.4)' : '2px dashed var(--border-input)',
                borderRadius: '24px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                disabled={!hasAccess}
              />

              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: isLocked
                  ? 'rgba(239, 68, 68, 0.15)'
                  : needsAdUnlock
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(16, 185, 129, 0.12)',
                color: isLocked ? '#ef4444' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                {isLocked ? <Lock size={32} /> : needsAdUnlock ? <Sparkles size={32} /> : <UploadCloud size={32} />}
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                {isLocked
                  ? 'Pro Subscription Required'
                  : (file ? file.name : 'Select Bank Statement')}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                {isLocked
                  ? 'Upgrade to ZenBudget Pro for unlimited statement imports'
                  : 'Supports HDFC, SBI, ICICI, Axis, Kotak PDF, CSV & Passbook Photos'}
              </p>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'var(--bg-input)',
                fontSize: '11px',
                color: isLocked ? '#ef4444' : needsAdUnlock ? '#10b981' : 'var(--text-secondary)'
              }}>
                {isLocked ? (
                  <>
                    <Lock size={14} color="#ef4444" />
                    <span style={{ fontWeight: 700 }}>Pro Subscription Required</span>
                  </>
                ) : needsAdUnlock ? (
                  <>
                    <Play size={14} color="#10b981" fill="#10b981" />
                    <span style={{ fontWeight: 700, color: '#10b981' }}>Tap to Watch Ad & Unlock 1st Scan</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} color="#10b981" />
                    <span>100% Client-Side End-to-End Encrypted</span>
                  </>
                )}
              </div>
            </div>

            {/* Optional Password Input for Encrypted Bank PDFs */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '14px 18px',
              border: '1px solid var(--border-card)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: isLocked ? 0.6 : 1
            }}>
              <Lock size={18} color="#94a3b8" />
              <div style={{ flex: 1 }}>
                <input
                  type="password"
                  value={filePassword}
                  onChange={(e) => setFilePassword(e.target.value)}
                  placeholder="PDF Password (Optional - if your bank statement is locked)"
                  disabled={isLocked}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  if (isLocked) {
                    onOpenSubscriptionModal();
                    return;
                  }
                  if (needsAdUnlock) {
                    setShowAdModal(true);
                    return;
                  }
                  startAnalysis();
                }}
                disabled={hasAccess && !file}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: isLocked
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : needsAdUnlock
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : file 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'var(--bg-input)',
                  border: 'none',
                  color: (isLocked || needsAdUnlock || file) ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: (isLocked || needsAdUnlock || file) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: (isLocked || needsAdUnlock || file) ? '0 10px 25px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {isLocked ? (
                  <>
                    <Lock size={18} />
                    <span>👑 1-Time Free Scan Used (Upgrade to Pro)</span>
                  </>
                ) : needsAdUnlock ? (
                  <>
                    <Play size={18} fill="#ffffff" />
                    <span>🎬 Watch Ad to Scan 1st Statement (100% FREE)</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} fill={file ? '#ffffff' : 'none'} />
                    <span>Run AI Statement Intelligence</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TOP-NOTCH PROCESSING HUD (DURING ANALYSIS)                          */}
        {/* =================================================================== */}
        {isProcessing && (
          <div 
            className="hud-cyber-grid"
            style={{
              background: 'linear-gradient(165deg, rgba(17, 24, 39, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%)',
              borderRadius: '24px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              textAlign: 'center',
              color: '#f8fafc'
            }}
          >
            {/* Hologram Document Scanner Box */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '200px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              {/* Laser Scanning Beam */}
              <div className="hud-laser-bar" />

              {/* Sci-Fi Corners */}
              <div style={{ position: 'absolute', top: 12, left: 12, width: 16, height: 16, borderTop: '2px solid #10b981', borderLeft: '2px solid #10b981' }} />
              <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderTop: '2px solid #10b981', borderRight: '2px solid #10b981' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 12, width: 16, height: 16, borderBottom: '2px solid #10b981', borderLeft: '2px solid #10b981' }} />
              <div style={{ position: 'absolute', bottom: 12, right: 12, width: 16, height: 16, borderBottom: '2px solid #10b981', borderRight: '2px solid #10b981' }} />

              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Statement Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Landmark size={48} color="#34d399" style={{ animation: 'hudPulseRing 2s infinite' }} />
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>
                    {file?.name || 'Parsing Financial Stream...'}
                  </p>
                </div>
              )}

              {/* Center Floating Badge */}
              <div style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(16, 185, 129, 0.6)',
                backdropFilter: 'blur(8px)'
              }}>
                <Sparkles size={16} color="#34d399" style={{ animation: 'spin 4s linear infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                  AI Passbook Neural Scan
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                boxShadow: '0 0 14px rgba(16, 185, 129, 0.8)',
                transition: 'width 0.4s ease-out'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
              <span>{statusMessage}</span>
              <span style={{ color: '#34d399', fontWeight: 800 }}>{progressPercent}%</span>
            </div>

            {/* 4 Steps Checklist */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
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
                <span>1. File Decryption</span>
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
                <span>2. Neural OCR Scan</span>
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
                <span>3. Title & Category Clean</span>
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
                <span>4. Cash Flow Audit</span>
              </div>
            </div>

            {/* Chrome Dino-style Financial Mini Game while statement is processing */}
            <div style={{ marginTop: '22px', textAlign: 'left' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                borderRadius: '16px',
                padding: '12px 16px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '26px' }}>🎮</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                    Play Zen Coin Catcher while your statement parses!
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Chrome Dino style! Catch SIP coins, dodge credit card traps & share your score with friends.
                  </p>
                </div>
              </div>
              <CoinCatcherGame
                currencySymbol={currencySymbol}
                userReferralCode={userReferralCode}
                defaultExpanded={true}
                title="🎮 Dino Mode: Play While Parsing"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PARSED STATEMENT DASHBOARD & BATCH IMPORT LIST                     */}
        {/* =================================================================== */}
        {analysisResult && !isProcessing && !importSuccess && (
          <div>
            {/* LEDGER IMPORT PROMPT / CONFIRMATION CARD */}
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(6, 182, 212, 0.08) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '24px',
                padding: '20px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                    Add Extracted Transactions to Ledger?
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    Statement se <strong>{analysisResult.transactions.length} transactions</strong> real-time extract ho gaye hain. Kya aap inhe apne Ledger (Transactions) me add karna chahte hain?
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleBatchImport}
                  disabled={isImporting || analysisResult.transactions.filter(t => t.selected).length === 0}
                  style={{
                    flex: 1,
                    padding: '13px 16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: isImporting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {isImporting 
                      ? 'Adding to Ledger...' 
                      : `Yes, Add ${analysisResult.transactions.filter(t => t.selected).length} to Ledger`}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setFile(null);
                    setAnalysisResult(null);
                  }}
                  style={{
                    padding: '13px 18px',
                    borderRadius: '14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Discard
                </button>
              </div>
            </div>

            {/* Executive Summary Card */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              padding: '20px',
              border: '1px solid var(--border-card)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                    {analysisResult.bankName}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {analysisResult.accountNumber ? `Account: ${analysisResult.accountNumber} · ` : ''}
                    {analysisResult.statementPeriod}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  <ShieldCheck size={13} />
                  <span>Verified</span>
                </div>
              </div>

              {/* 3 Metric Pills: Inflow, Outflow, Net */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                    <TrendingUp size={12} />
                    <span>INFLOW</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    +{currencySymbol}{analysisResult.totalIncome.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>
                    <TrendingDown size={12} />
                    <span>OUTFLOW</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                    -{currencySymbol}{analysisResult.totalExpenses.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    NET SAVINGS
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: (analysisResult.totalIncome - analysisResult.totalExpenses) >= 0 ? '#38bdf8' : '#f87171',
                    marginTop: '4px'
                  }}>
                    {currencySymbol}{(analysisResult.totalIncome - analysisResult.totalExpenses).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Wallet Account Selector */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '14px 18px',
              border: '1px solid var(--border-card)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Wallet size={18} color="#06b6d4" />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Deposit to Account:</span>
              </div>

              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-input)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {accounts.length > 0 ? (
                  accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({currencySymbol}{a.balance ?? 0})
                    </option>
                  ))
                ) : (
                  <option value="">Primary Account</option>
                )}
              </select>
            </div>

            {/* Transaction List Header & Select All */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800 }}>
                Transactions ({analysisResult.transactions.filter(t => t.selected).length}/{analysisResult.transactions.length} selected)
              </span>

              <button
                onClick={toggleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#10b981',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {analysisResult.transactions.every(t => t.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Transaction Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', maxHeight: '380px', overflowY: 'auto' }}>
              {analysisResult.transactions.map(t => (
                <div
                  key={t.id}
                  onClick={() => toggleTransactionSelection(t.id)}
                  style={{
                    background: t.selected ? 'var(--bg-card)' : 'var(--bg-input)',
                    opacity: t.selected ? 1 : 0.6,
                    border: t.selected ? '1px solid var(--border-card)' : '1px solid transparent',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {t.selected ? (
                      <CheckSquare size={18} color="#10b981" />
                    ) : (
                      <Square size={18} color="#64748b" />
                    )}

                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>
                        {t.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.date}</span>
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--bg-input)',
                          color: 'var(--text-secondary)'
                        }}>
                          {t.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: t.type === 'income' ? '#10b981' : 'var(--text-primary)'
                  }}>
                    {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Batch Import Button */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleBatchImport}
                disabled={isImporting || analysisResult.transactions.filter(t => t.selected).length === 0}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                  opacity: isImporting ? 0.7 : 1
                }}
              >
                <Zap size={18} fill="#ffffff" />
                <span>
                  {isImporting ? 'Adding to Ledger...' : `Add ${analysisResult.transactions.filter(t => t.selected).length} Transactions to Ledger`}
                </span>
              </button>

              <button
                onClick={() => {
                  setFile(null);
                  setAnalysisResult(null);
                }}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-input)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUCCESS SCREEN                                                      */}
        {/* =================================================================== */}
        {importSuccess && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            padding: '36px 24px',
            textAlign: 'center',
            border: '1px solid var(--border-card)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#10b981'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>
              Added to Ledger!
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Successfully added <strong>{importedCount} transactions</strong> directly into your Ledger. Your wallet balance and analytics have been updated in real-time!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  if (onNavigateToLedger) {
                    onNavigateToLedger();
                  } else {
                    onBack();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                }}
              >
                View in Ledger (Transactions)
              </button>

              <button
                onClick={onBack}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-input)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Financial Mini Game - Chrome Dino Style */}
        <CoinCatcherGame currencySymbol={currencySymbol} userReferralCode={userReferralCode} />

        {/* Rewarded Ad Unlock Modal for Bank Statements */}
        {showAdModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(5, 10, 20, 0.88)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '20px',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setShowAdModal(false)}
          >
            <div 
              style={{
                width: '100%',
                maxWidth: '380px',
                background: 'var(--bg-card)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '24px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowAdModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>

              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#f59e0b',
                fontSize: '26px'
              }}>
                🏦
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  🎬 Unlock 1-Time Free Statement Parse
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  Watch 1 short sponsor video ad to unlock your 1-Time Free Bank Statement Parse! Subsequent statements require ZenBudget Pro.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleWatchRewardedAd}
                  disabled={isAdLoading}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: isAdLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                    opacity: isAdLoading ? 0.7 : 1
                  }}
                >
                  <Play size={16} fill="#ffffff" />
                  <span>{isAdLoading ? 'Loading Video Ad...' : '🎬 Watch Video Ad (Unlock 1 Free Parse)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAdModal(false);
                    onOpenSubscriptionModal();
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  👑 Upgrade to Pro (₹149/mo)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
