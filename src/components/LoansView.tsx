import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  Plus, 
  HandCoins, 
  Calendar, 
  CheckCircle, 
  X
} from 'lucide-react';
import type { LoanRecord, Account } from '../types';
import { t } from '../utils/i18n';
import { formatCurrency } from '../utils/formatCurrency';

interface LoansViewProps {
  onBack: () => void;
  loans: LoanRecord[];
  accounts: Account[];
  currencySymbol: string;
  onAddLoan: (loan: Omit<LoanRecord, 'id' | 'paidAmount' | 'status'>) => void;
  onRepayLoan: (loanId: string, repayAmount: number, accountId: string) => void;
  onPayLoanViaUPI?: (loan: LoanRecord, amount: number, accountId?: string) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  onBack,
  loans = [],
  accounts = [],
  currencySymbol,
  onAddLoan,
  onRepayLoan,
  onPayLoanViaUPI
}) => {
  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>('borrowed');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [repayModalLoan, setRepayModalLoan] = useState<LoanRecord | null>(null);

  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState<'monthly' | 'yearly'>('monthly');
  const [interestCalcMode, setInterestCalcMode] = useState<'simple' | 'reducing' | 'compound'>('simple');
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [modalErr, setModalErr] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  const getInitialDueDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(getInitialDueDate);

  const updateTenure = (months: number) => {
    const valid = Math.max(1, months);
    setTenureMonths(valid);
    const d = new Date();
    d.setMonth(d.getMonth() + valid);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleDueDateChange = (newDateStr: string) => {
    setDueDate(newDateStr);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const due = new Date(newDateStr);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - start.getTime();
      const diffMonths = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24 * 30.4375)));
      setTenureMonths(diffMonths);
    } catch (_) {}
  };

  const [frequency, setFrequency] = useState<'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [customFrequencyText, setCustomFrequencyText] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccountId, setRepayAccountId] = useState(accounts[0]?.id || '');

  const calcEmiDetails = () => {
    const P = parseFloat(totalAmount) || 0;
    const R = parseFloat(interestRate) || 0;
    const durationMonths = Math.max(1, tenureMonths || 1);

    let totalInterest = 0;
    let emiInstallment = 0;
    const isYearlyMode = interestType === 'yearly';

    if (P > 0) {
      if (R <= 0) {
        totalInterest = 0;
        emiInstallment = P / durationMonths;
      } else if (interestCalcMode === 'reducing') {
        // Standard Bank Reducing Balance EMI: P * r * (1+r)^n / ((1+r)^n - 1)
        const monthlyRate = (isYearlyMode ? R / 12 : R) / 100;
        if (monthlyRate > 0) {
          const emi = (P * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) / (Math.pow(1 + monthlyRate, durationMonths) - 1);
          emiInstallment = emi;
          const totalPayableCalc = emi * durationMonths;
          totalInterest = Math.max(0, totalPayableCalc - P);
        } else {
          emiInstallment = P / durationMonths;
          totalInterest = 0;
        }
      } else if (interestCalcMode === 'compound') {
        const monthlyRate = (isYearlyMode ? R / 12 : R) / 100;
        const totalPayableCalc = P * Math.pow(1 + monthlyRate, durationMonths);
        totalInterest = Math.max(0, totalPayableCalc - P);
        emiInstallment = totalPayableCalc / durationMonths;
      } else {
        // Flat Simple Interest: P * R * T
        if (isYearlyMode) {
          totalInterest = P * (R / 100) * (durationMonths / 12);
        } else {
          totalInterest = P * (R / 100) * durationMonths;
        }
        emiInstallment = (P + totalInterest) / durationMonths;
      }
    }

    const totalPayable = P + totalInterest;

    let installmentCount = durationMonths;
    let installmentLabel = 'month';

    if (frequency === 'weekly') {
      installmentCount = Math.max(1, Math.round(durationMonths * 4.33));
      installmentLabel = 'week';
      emiInstallment = totalPayable / installmentCount;
    } else if (frequency === 'quarterly' as any) {
      installmentCount = Math.max(1, Math.round(durationMonths / 3));
      installmentLabel = 'quarter';
      emiInstallment = totalPayable / installmentCount;
    } else if (frequency === 'yearly') {
      installmentCount = Math.max(1, Math.round(durationMonths / 12));
      installmentLabel = 'year';
      emiInstallment = totalPayable / installmentCount;
    } else if (frequency === 'one_time') {
      installmentCount = 1;
      installmentLabel = 'lump-sum';
      emiInstallment = totalPayable;
    }

    return { 
      P, 
      R, 
      totalInterest: Math.round(totalInterest), 
      totalPayable: Math.round(totalPayable), 
      emiInstallment: Math.round(emiInstallment), 
      installmentCount, 
      installmentLabel, 
      durationMonths,
      isYearlyMode
    };
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setModalErr(null);

    if (!accounts || accounts.length === 0) {
      setModalErr('⚠️ No Wallet Account Found! Please add a wallet/bank account in "My Accounts in Wallet" before adding loan entries.');
      return;
    }

    const principalNum = parseFloat(totalAmount);
    const ratePct = parseFloat(interestRate) || 0;
    if (!personName.trim() || isNaN(principalNum) || principalNum <= 0) return;

    const { totalPayable, emiInstallment } = calcEmiDetails();

    onAddLoan({
      type: activeTab,
      personName: personName.trim(),
      totalAmount: Number(totalPayable.toFixed(2)),
      principalAmount: principalNum,
      interestRate: ratePct > 0 ? ratePct : undefined,
      interestType: ratePct > 0 ? interestType : undefined,
      emiInstallment: Math.round(emiInstallment),
      dueDate,
      startDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      frequency,
      customFrequencyText: frequency === 'custom' ? (customFrequencyText.trim() || 'Custom') : undefined,
      accountId: selectedAccountId || accounts[0]?.id,
      notes: notes.trim()
    });

    setPersonName('');
    setTotalAmount('');
    setInterestRate('');
    setCustomFrequencyText('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalErr(null);
    if (!repayModalLoan) return;
    const amountNum = parseFloat(repayAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (repayModalLoan.type === 'borrowed') {
      const selectedAcc = accounts.find(a => a.id === (repayAccountId || accounts[0]?.id));
      const balance = selectedAcc ? selectedAcc.balance : 0;
      if (balance < amountNum) {
        setModalErr(`⚠️ Insufficient Balance in ${selectedAcc?.name || 'selected Wallet Account'}! Available: ${currencySymbol}${balance}, Required: ${currencySymbol}${amountNum}`);
        return;
      }
    }

    onRepayLoan(repayModalLoan.id, amountNum, repayAccountId || accounts[0]?.id);
    setRepayModalLoan(null);
    setRepayAmount('');
  };

  const borrowedLoans = loans.filter(l => l.type === 'borrowed');
  const lentLoans = loans.filter(l => l.type === 'lent');
  const totalBorrowed = borrowedLoans.reduce((sum, l) => sum + l.totalAmount, 0);
  const totalLent = lentLoans.reduce((sum, l) => sum + l.totalAmount, 0);
  const filteredLoans = loans.filter(l => l.type === activeTab);

  const addLoanFormRef = useRef<HTMLFormElement>(null);
  const repayFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isAddModalOpen && addLoanFormRef.current) {
      addLoanFormRef.current.scrollTop = 0;
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    if (repayModalLoan && repayFormRef.current) {
      repayFormRef.current.scrollTop = 0;
    }
  }, [repayModalLoan]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{t('loans_udhaar')}</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{t('loans_sub')}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setNotes('');
            setPersonName('');
            setTotalAmount('');
            setIsAddModalOpen(true);
          }}
          className="glass-button active"
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} /> {t('add_loan')}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('borrowed_loans')}
          </span>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444', margin: '4px 0 0 0' }}>
            {formatCurrency(totalBorrowed, currencySymbol)}
          </h3>
          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px', fontWeight: 600 }}>
            Total Taken (Remaining: {formatCurrency(borrowedLoans.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0), currencySymbol)})
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('lent_loans')}
          </span>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#22c55e', margin: '4px 0 0 0' }}>
            {formatCurrency(totalLent, currencySymbol)}
          </h3>
          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px', fontWeight: 600 }}>
            Total Given (Remaining: {formatCurrency(lentLoans.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0), currencySymbol)})
          </div>
        </div>
      </div>

      {/* Tabs Pill */}
      <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border-input)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('borrowed')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 800,
            background: activeTab === 'borrowed' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
            color: activeTab === 'borrowed' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          {t('borrowed_loans')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lent')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 800,
            background: activeTab === 'lent' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
            color: activeTab === 'lent' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          {t('lent_loans')}
        </button>
      </div>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <HandCoins size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No {activeTab === 'borrowed' ? 'borrowed loans' : 'lent money'} records.</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Tap "+ Add Loan" to log a new entry with due date.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLoans.map(loan => {
            const remaining = loan.totalAmount - loan.paidAmount;
            const progress = Math.min(100, Math.round((loan.paidAmount / loan.totalAmount) * 100));
            const isCompleted = loan.status === 'completed' || remaining <= 0;

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const due = new Date(loan.dueDate);
            due.setHours(0, 0, 0, 0);
            const diffMs = now.getTime() - due.getTime();
            const overdueDays = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;

            return (
              <div key={loan.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{loan.personName}</span>
                          {isCompleted ? (
                            <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                              Completed
                            </span>
                          ) : overdueDays > 0 ? (
                            <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '2px 8px', borderRadius: '12px', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                              ⚠️ {overdueDays} {overdueDays === 1 ? 'Day Late' : 'Days Late'}!
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                              Active ({loan.frequency === 'custom' ? (loan.customFrequencyText || 'Custom') : t(loan.frequency)})
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> {t('due_date')}: {loan.dueDate}</span>
                          <span>• Principal: {formatCurrency(loan.principalAmount || loan.totalAmount, currencySymbol)}</span>
                          {loan.interestRate ? (
                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                              (+{loan.interestRate}% {loan.interestType === 'yearly' ? 'p.a.' : '/mo'})
                            </span>
                          ) : null}
                        </div>
                      </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: activeTab === 'borrowed' ? '#ef4444' : '#22c55e' }}>
                      {formatCurrency(remaining, currencySymbol)}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      Remaining ({activeTab === 'borrowed' ? 'To Pay' : 'To Collect'})
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px', fontWeight: 600 }}>
                      Total Loan: {formatCurrency(loan.totalAmount, currencySymbol)}
                    </div>
                    {(loan.emiInstallment || loan.frequency === 'monthly' || loan.frequency === 'yearly' || loan.frequency === 'weekly') && (
                      <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 800, marginTop: '2px' }}>
                        💳 {activeTab === 'borrowed' ? 'Monthly Payable:' : 'Monthly Collection:'} {formatCurrency(
                          loan.emiInstallment || Math.round(loan.totalAmount / (loan.frequency === 'yearly' ? 12 : 1)), 
                          currencySymbol
                        )} / mo
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Paid: {formatCurrency(loan.paidAmount, currencySymbol)}</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: activeTab === 'borrowed' ? '#ef4444' : '#22c55e', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {!isCompleted && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <button
                      onClick={() => {
                        setRepayModalLoan(loan);
                        setRepayAmount(remaining.toString());
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-button)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <CheckCircle size={14} /> {activeTab === 'borrowed' ? 'Record Cash' : 'Record Deposit'}
                    </button>

                    {activeTab === 'borrowed' ? (
                      <button
                        onClick={() => {
                          setRepayModalLoan(loan);
                          setRepayAmount(remaining.toString());
                        }}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <span>⚡ Pay via PhonePe</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setRepayModalLoan(loan);
                          setRepayAmount(remaining.toString());
                        }}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        <span>💰 Collect / Remind</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Loan */}
      {isAddModalOpen && createPortal(
  <div 
    onClick={() => setIsAddModalOpen(false)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 9999999
    }}
  >
    <div 
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%',
        maxWidth: '460px',
        maxHeight: 'min(90vh, 720px)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }}
    >
      {/* Fixed Modal Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-card)',
        background: 'var(--bg-card)',
        flexShrink: 0
      }}>
        <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {activeTab === 'borrowed' ? `${t('add_loan')} (${t('borrowed_loans')})` : `${t('add_loan')} (${t('lent_loans')})`}
        </h3>
        <button 
          type="button"
          onClick={() => setIsAddModalOpen(false)} 
          title="Close"
          style={{ 
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--bg-dark)', 
            border: '1px solid var(--border-card)', 
            color: 'var(--text-primary)', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '20px'
      }}>
        {modalErr && (
          <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px', fontWeight: 700, lineHeight: 1.4, marginBottom: '14px' }}>
            {modalErr}
          </div>
        )}

        <form ref={addLoanFormRef} onSubmit={handleSubmitAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Lender / Person Name
            </label>
            <input
              type="text"
              required
              value={personName}
              onChange={e => setPersonName(e.target.value)}
              placeholder="e.g. Alex Morgan / HDFC Bank"
              className="glass-input"
              style={{ marginTop: '6px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Principal ({currencySymbol})
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="10000"
                className="glass-input"
                style={{ marginTop: '6px', width: '100%' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Interest Rate (%)
                </label>
                <select
                  value={interestType}
                  onChange={e => setInterestType(e.target.value as any)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                >
                  <option value="monthly">% / mo</option>
                  <option value="yearly">% p.a.</option>
                </select>
              </div>
              <input
                type="number"
                min="0"
                step="0.1"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                placeholder="e.g. 3"
                className="glass-input"
                style={{ marginTop: '6px', width: '100%' }}
              />
            </div>
          </div>

          {/* Calculation Method Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', border: '1px solid var(--border-input)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Interest Method:
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'simple', label: 'Simple' },
                { id: 'reducing', label: 'Reducing (EMI)' },
                { id: 'compound', label: 'Compound' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInterestCalcMode(m.id as any)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: interestCalcMode === m.id ? 'var(--primary)' : 'transparent',
                    color: interestCalcMode === m.id ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tenure / Duration (Months)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={tenureMonths}
                onChange={e => updateTenure(parseInt(e.target.value) || 1)}
                className="glass-input"
                style={{ marginTop: '6px', width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Repayment Frequency
              </label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
                className="glass-input"
                style={{ marginTop: '6px', width: '100%', background: 'var(--bg-input)' }}
              >
                <option value="monthly">Monthly EMI</option>
                <option value="weekly">Weekly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One-Time (Lump-sum)</option>
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Due Date
              </label>
              <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700 }}>
                ({tenureMonths} {tenureMonths === 1 ? 'Month' : 'Months'} Duration)
              </span>
            </div>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <input
                type="date"
                value={dueDate}
                onChange={e => handleDueDateChange(e.target.value)}
                className="glass-input custom-date-input"
                style={{ width: '100%', paddingRight: '40px', cursor: 'pointer' }}
              />
              <Calendar size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <style>
                {`
                  .custom-date-input::-webkit-calendar-picker-indicator {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    width: auto;
                    height: auto;
                    color: transparent;
                    background: transparent;
                    cursor: pointer;
                  }
                `}
              </style>
            </div>
          </div>

          {/* Quick Duration Chips */}
          <div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
              {[
                { label: '1 Mo', months: 1 },
                { label: '3 Mos', months: 3 },
                { label: '6 Mos', months: 6 },
                { label: '1 Year', months: 12 },
                { label: '2 Years', months: 24 },
                { label: '3 Years', months: 36 },
                { label: '5 Years', months: 60 }
              ].map(tItem => (
                <button
                  key={tItem.label}
                  type="button"
                  onClick={() => updateTenure(tItem.months)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: tenureMonths === tItem.months ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                    background: tenureMonths === tItem.months ? 'rgba(34, 197, 94, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    color: tenureMonths === tItem.months ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {tItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Loan & EMI Calculation Preview Box */}
          {(() => {
            const live = calcEmiDetails();
            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    🧮 Live Calculation Breakdown
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {live.durationMonths} {live.durationMonths === 1 ? 'Month' : 'Months'} ({interestCalcMode.toUpperCase()})
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Principal Amount</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatCurrency(live.P, currencySymbol)}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Interest ({interestRate || 0}% {interestType === 'yearly' ? 'p.a.' : '/mo'})
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>
                      +{formatCurrency(live.totalInterest, currencySymbol)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.16)', padding: '10px 12px', borderRadius: '10px', marginTop: '4px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {activeTab === 'borrowed' ? 'Total You Will Repay:' : 'Total You Will Collect:'}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: activeTab === 'borrowed' ? '#ef4444' : '#22c55e' }}>
                      {formatCurrency(live.totalPayable, currencySymbol)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      Per {live.installmentLabel.toUpperCase()} EMI:
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#a78bfa', marginTop: '2px' }}>
                      {formatCurrency(Math.round(live.emiInstallment), currencySymbol, 0)} <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7 }}>({live.installmentCount}x)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Wallet / Account Selection */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {activeTab === 'borrowed' 
                ? 'Wallet Account (Money Borrowed / Credited into):' 
                : 'Wallet Account (Money Lent / Given from):'}
            </label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="glass-input"
              style={{ marginTop: '6px', width: '100%', background: 'var(--bg-input)' }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  💳 {acc.name} ({formatCurrency(acc.balance, currencySymbol)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason / Agreement info..."
              className="glass-input"
              style={{ marginTop: '6px', width: '100%' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '14px',
              borderRadius: '14px',
              marginTop: '8px',
              fontSize: '15px',
              fontWeight: 800,
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            Save Loan Entry
          </button>
        </form>
      </div>
    </div>
  </div>,
  document.body
)}

{/* Modal: Repay Loan */}
{repayModalLoan && createPortal(
  <div 
    onClick={() => { setRepayModalLoan(null); setModalErr(null); }}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 9999999
    }}
  >
    <div 
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%',
        maxWidth: '420px',
        maxHeight: 'min(90vh, 680px)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }}
    >
      {/* Fixed Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-card)',
        background: 'var(--bg-card)',
        flexShrink: 0
      }}>
        <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {repayModalLoan.type === 'borrowed' ? `Repay to ${repayModalLoan.personName}` : `Receive from ${repayModalLoan.personName}`}
        </h3>
        <button 
          type="button"
          onClick={() => { setRepayModalLoan(null); setModalErr(null); }} 
          title="Close"
          style={{ 
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--bg-dark)', 
            border: '1px solid var(--border-card)', 
            color: 'var(--text-primary)', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '20px'
      }}>
        {modalErr && (
          <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px', fontWeight: 700, lineHeight: 1.4 }}>
            {modalErr}
          </div>
        )}

        <form ref={repayFormRef} onSubmit={handleRepaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {repayModalLoan.type === 'borrowed' ? 'Payment Amount' : 'Collected Amount'} ({currencySymbol})
            </label>
            <input
              type="number"
              required
              min="1"
              max={repayModalLoan.totalAmount - repayModalLoan.paidAmount}
              step="any"
              value={repayAmount}
              onChange={e => setRepayAmount(e.target.value)}
              className="glass-input"
              style={{ marginTop: '6px', width: '100%' }}
            />

            {/* Early Payment / Preset Amount Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setRepayAmount((repayModalLoan.totalAmount - repayModalLoan.paidAmount).toString())}
                style={{
                  padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.4)',
                  background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                }}
              >
                💯 Pay Full Remaining ({formatCurrency(repayModalLoan.totalAmount - repayModalLoan.paidAmount, currencySymbol)})
              </button>
              {repayModalLoan.emiInstallment && repayModalLoan.emiInstallment < (repayModalLoan.totalAmount - repayModalLoan.paidAmount) && (
                <button
                  type="button"
                  onClick={() => setRepayAmount(repayModalLoan.emiInstallment!.toString())}
                  style={{
                    padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.4)',
                    background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  💳 1 Monthly EMI ({formatCurrency(repayModalLoan.emiInstallment, currencySymbol)})
                </button>
              )}
              {Math.round((repayModalLoan.totalAmount - repayModalLoan.paidAmount) / 2) > 0 && Math.round((repayModalLoan.totalAmount - repayModalLoan.paidAmount) / 2) < (repayModalLoan.totalAmount - repayModalLoan.paidAmount) && (
                <button
                  type="button"
                  onClick={() => setRepayAmount(Math.round((repayModalLoan.totalAmount - repayModalLoan.paidAmount) / 2).toString())}
                  style={{
                    padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.4)',
                    background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  ⚡ 50% Half ({formatCurrency(Math.round((repayModalLoan.totalAmount - repayModalLoan.paidAmount) / 2), currencySymbol)})
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {repayModalLoan.type === 'borrowed' 
                ? 'Select Wallet / Account To Cut Money From (Debited):' 
                : 'Select Wallet / Account Where Money Was Credited (Deposited):'}
            </label>
            <select
              value={repayAccountId}
              onChange={e => setRepayAccountId(e.target.value)}
              className="glass-input"
              style={{ marginTop: '6px', width: '100%', background: 'var(--bg-input)', fontWeight: 700 }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  💳 {acc.name} ({formatCurrency(acc.balance, currencySymbol)})
                </option>
              ))}
            </select>
          </div>

          {repayModalLoan.type === 'borrowed' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              {onPayLoanViaUPI && (
                <button
                  type="button"
                  onClick={() => {
                    const amtNum = parseFloat(repayAmount) || (repayModalLoan.totalAmount - repayModalLoan.paidAmount);
                    onPayLoanViaUPI(repayModalLoan, amtNum, repayAccountId || accounts[0]?.id);
                    setRepayModalLoan(null);
                  }}
                  style={{
                    padding: '13px',
                    borderRadius: '13px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontSize: '13.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  ⚡ Pay via PhonePe / Netbanking (Online App)
                </button>
              )}
              <button
                type="submit"
                style={{
                  padding: '13px',
                  borderRadius: '13px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-dark)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                ✅ Record Cash Repayment (Cut From Wallet)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  padding: '13px',
                  borderRadius: '13px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                ✅ Record Money Received (Deposit to Wallet)
              </button>
              <button
                type="button"
                onClick={() => {
                  const friendName = repayModalLoan.personName;
                  const remAmt = parseFloat(repayAmount) || (repayModalLoan.totalAmount - repayModalLoan.paidAmount);
                  const msg = `Hi ${friendName}, a friendly reminder regarding the ₹${remAmt} payment due on ZenBudget. Thanks!`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                style={{
                  padding: '11px',
                  borderRadius: '13px',
                  border: '1px solid rgba(37, 211, 102, 0.4)',
                  background: 'rgba(37, 211, 102, 0.1)',
                  color: '#25D366',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                💬 Remind Friend on WhatsApp
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  </div>,
  document.body
)}
    </div>
  );
};

export default LoansView;
