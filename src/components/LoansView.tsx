import React, { useState } from 'react';
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
  const [interestCalcMode, setInterestCalcMode] = useState<'simple' | 'compound'>('simple');
  const [modalErr, setModalErr] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const getInitialDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(getInitialDueDate);

  const updateDueDateFromToday = (monthsToAdd: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToAdd);
    setDueDate(d.toISOString().split('T')[0]);
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
    if (P <= 0) return { P: 0, R: 0, totalInterest: 0, totalPayable: 0, emiInstallment: 0, installmentCount: 1, installmentLabel: 'month', durationMonths: 1 };

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - start.getTime();
    let diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Calculate integer calendar months between start and due date
    let monthDiff = (due.getFullYear() - start.getFullYear()) * 12 + (due.getMonth() - start.getMonth());
    const dayDiff = due.getDate() - start.getDate();
    if (dayDiff > 10) {
      monthDiff += 1;
    } else if (dayDiff < -10 && monthDiff > 1) {
      monthDiff -= 1;
    }

    const durationMonths = Math.max(1, monthDiff > 0 ? monthDiff : Math.round(diffDays / 30));

    // Calculate Interest based on rate unit (monthly vs yearly) and calculation mode (simple vs compound)
    let totalInterest = 0;
    const isYearlyMode = interestType === 'yearly' || frequency === 'yearly';

    if (R > 0) {
      if (isYearlyMode) {
        // Exact time in years (e.g. 6 months = 0.5 years, 12 months = 1 year, 24 months = 2 years)
        const timeInYears = durationMonths / 12;
        if (interestCalcMode === 'compound') {
          totalInterest = P * (Math.pow(1 + R / 100, timeInYears) - 1);
        } else {
          // Pure Simple Yearly Interest Formula: P * (R / 100) * Years
          totalInterest = P * (R / 100) * timeInYears;
        }
      } else {
        // Pure Monthly Interest Formula: P * (R / 100) * Months
        if (interestCalcMode === 'compound') {
          totalInterest = P * (Math.pow(1 + R / 100, durationMonths) - 1);
        } else {
          totalInterest = P * (R / 100) * durationMonths;
        }
      }
    }

    const totalPayable = P + totalInterest;

    // Calculate installment count + label based on user-selected frequency
    let installmentCount = 1;
    let installmentLabel = 'lump sum';

    const roundedMonths = Math.max(1, durationMonths);

    if (frequency === 'monthly') {
      installmentCount = roundedMonths;
      installmentLabel = 'month';
    } else if (frequency === 'weekly') {
      installmentCount = Math.max(1, Math.round(diffDays / 7));
      installmentLabel = 'week';
    } else if (frequency === 'daily') {
      installmentCount = Math.max(1, Math.round(diffDays));
      installmentLabel = 'day';
    } else if (frequency === 'yearly') {
      installmentCount = Math.max(1, Math.round(durationMonths / 12));
      installmentLabel = 'year';
    } else {
      installmentCount = 1;
      installmentLabel = 'lump sum';
    }

    const emiInstallment = totalPayable / Math.max(1, installmentCount);

    return { 
      P, 
      R, 
      totalInterest: Number(totalInterest.toFixed(2)), 
      totalPayable: Number(totalPayable.toFixed(2)), 
      emiInstallment: Number(emiInstallment.toFixed(2)), 
      installmentCount, 
      installmentLabel, 
      durationMonths: roundedMonths,
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
      emiInstallment: Number(emiInstallment.toFixed(2)),
      dueDate,
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> {t('due_date')}: {loan.dueDate}</span>
                          <span>• Principal: {formatCurrency(loan.totalAmount, currencySymbol)}</span>
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
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                {activeTab === 'borrowed' ? `${t('add_loan')} (${t('borrowed_loans')})` : `${t('add_loan')} (${t('lent_loans')})`}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {modalErr && (
              <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px', fontWeight: 700, lineHeight: 1.4 }}>
                {modalErr}
              </div>
            )}

            <form onSubmit={handleSubmitAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '80vh', overflowY: 'auto', paddingRight: '4px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Lender / Person Name</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={e => setPersonName(e.target.value)}
                  placeholder="e.g. Alex Morgan / HDFC Bank"
                  className="glass-input"
                  style={{ marginTop: '4px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Principal ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    placeholder="10000"
                    className="glass-input"
                    style={{ marginTop: '4px', width: '100%' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Interest Rate (%)</label>
                    <select
                      value={interestType}
                      onChange={e => setInterestType(e.target.value as any)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
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
                    style={{ marginTop: '4px', width: '100%' }}
                  />
                </div>
              </div>

              {/* Simple vs Compound Interest Toggle */}
              {parseFloat(interestRate) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-input)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Calculation Math:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setInterestCalcMode('simple')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: interestCalcMode === 'simple' ? 'var(--primary)' : 'transparent',
                        color: interestCalcMode === 'simple' ? '#fff' : 'var(--text-secondary)'
                      }}
                    >
                      Simple 📐
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterestCalcMode('compound')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: interestCalcMode === 'compound' ? 'var(--primary)' : 'transparent',
                        color: interestCalcMode === 'compound' ? '#fff' : 'var(--text-secondary)'
                      }}
                    >
                      Compound 📈
                    </button>
                  </div>
                </div>
              )}

              {/* Live Repayment & Installment Breakdown */}
              {parseFloat(totalAmount) > 0 && (() => {
                const { P, R, totalInterest, totalPayable, emiInstallment, installmentCount, installmentLabel, durationMonths, isYearlyMode } = calcEmiDetails();
                const rateLabel = isYearlyMode ? '% p.a.' : '% / mo';
                
                const formatCurr = (val: number) => {
                  return val % 1 === 0 ? val.toLocaleString() : val.toFixed(2);
                };

                return (
                  <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '12px', color: '#e2e8f0', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 800, marginBottom: '4px' }}>💡 Repayment Breakdown ({durationMonths} Mo Duration)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Principal Amount</span>
                      <span style={{ fontWeight: 700 }}>{currencySymbol}{formatCurr(P)}</span>
                    </div>
                    {R > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Interest ({R}{rateLabel} - {interestCalcMode === 'simple' ? 'Simple' : 'Compound'})</span>
                        <span style={{ fontWeight: 700, color: '#fbbf24' }}>+{currencySymbol}{formatCurr(totalInterest)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(56,189,248,0.2)', paddingTop: '6px', marginTop: '2px' }}>
                      <span style={{ color: '#94a3b8' }}>Total Payable Amount</span>
                      <span style={{ fontWeight: 800, color: '#fff' }}>{currencySymbol}{formatCurr(totalPayable)}</span>
                    </div>
                    <div style={{ background: 'rgba(52, 211, 153, 0.12)', borderRadius: '10px', padding: '8px 12px', marginTop: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                        {frequency === 'one_time' ? 'One-time Full Repayment' : `Pay per ${installmentLabel} (${installmentCount} installment${installmentCount > 1 ? 's' : ''})`}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399' }}>
                        {currencySymbol}{formatCurr(emiInstallment)} <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>/ {installmentLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('due_date')}</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="glass-input custom-dark-datepicker"
                    style={{ marginTop: '4px', width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('frequency')}</label>
                  <select
                    value={frequency}
                    onChange={e => {
                      const val = e.target.value as any;
                      setFrequency(val);
                      if (val === 'yearly') {
                        setInterestType('yearly');
                        updateDueDateFromToday(12);
                      } else if (val === 'monthly') {
                        setInterestType('monthly');
                        updateDueDateFromToday(1);
                      }
                    }}
                    className="glass-input"
                    style={{ marginTop: '4px', width: '100%', background: 'var(--bg-input)' }}
                  >
                    <option value="one_time">{t('one_time')}</option>
                    <option value="monthly">{t('monthly')}</option>
                    <option value="yearly">{t('yearly')}</option>
                    <option value="custom">✨ Custom Frequency...</option>
                  </select>
                </div>
              </div>

              {/* Duration Presets for Auto Due Date */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  ⏳ Quick Tenure / Duration (Auto Due Date)
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: '1 Month', months: 1 },
                    { label: '3 Months', months: 3 },
                    { label: '6 Months', months: 6 },
                    { label: '1 Year', months: 12 },
                    { label: '2 Years', months: 24 }
                  ].map(chip => (
                    <button
                      key={chip.months}
                      type="button"
                      onClick={() => updateDueDateFromToday(chip.months)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-input)',
                        background: 'rgba(34, 197, 94, 0.1)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {frequency === 'custom' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Custom Repayment Frequency</label>
                  <input
                    type="text"
                    required
                    value={customFrequencyText}
                    onChange={e => setCustomFrequencyText(e.target.value)}
                    placeholder="e.g. Every 15 Days, Bi-weekly, Quarterly"
                    className="glass-input"
                    style={{ marginTop: '4px', width: '100%' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {activeTab === 'borrowed' ? 'Wallet Account (Money Borrowed / Credited Into):' : 'Wallet Account (Money Lent / Debited From):'}
                </label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="glass-input"
                  style={{ marginTop: '4px', width: '100%', background: 'var(--bg-input)' }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({currencySymbol}{acc.balance})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Reason / Agreement info..."
                  className="glass-input"
                  style={{ marginTop: '4px', width: '100%' }}
                />
              </div>

              <button
                type="submit"
                className="glass-button active"
                style={{ padding: '12px', borderRadius: '12px', marginTop: '10px', fontSize: '14px', fontWeight: 800 }}
              >
                Save Loan Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Repay Loan */}
      {repayModalLoan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                {repayModalLoan.type === 'borrowed' ? `Repay to ${repayModalLoan.personName}` : `Receive from ${repayModalLoan.personName}`}
              </h3>
              <button onClick={() => { setRepayModalLoan(null); setModalErr(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {modalErr && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px', fontWeight: 700, lineHeight: 1.4 }}>
                {modalErr}
              </div>
            )}

            <form onSubmit={handleRepaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
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
                  style={{ marginTop: '4px', width: '100%' }}
                />

                {/* Early Payment / Preset Amount Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setRepayAmount((repayModalLoan.totalAmount - repayModalLoan.paidAmount).toString())}
                    style={{
                      padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.4)',
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
                        padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.4)',
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
                        padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.4)',
                        background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      ⚡ 50% Half ({formatCurrency(Math.round((repayModalLoan.totalAmount - repayModalLoan.paidAmount) / 2), currencySymbol)})
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {repayModalLoan.type === 'borrowed' 
                    ? 'Select Wallet / Account To Cut Money From (Debited):' 
                    : 'Select Wallet / Account Where Money Was Credited (Deposited):'}
                </label>
                <select
                  value={repayAccountId}
                  onChange={e => setRepayAccountId(e.target.value)}
                  className="glass-input"
                  style={{ marginTop: '4px', width: '100%', background: 'var(--bg-input)', fontWeight: 700 }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      💳 {acc.name} ({formatCurrency(acc.balance, currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>

              {repayModalLoan.type === 'borrowed' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {onPayLoanViaUPI && (
                    <button
                      type="button"
                      onClick={() => {
                        const amtNum = parseFloat(repayAmount) || (repayModalLoan.totalAmount - repayModalLoan.paidAmount);
                        onPayLoanViaUPI(repayModalLoan, amtNum, repayAccountId || accounts[0]?.id);
                        setRepayModalLoan(null);
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        fontSize: '13px',
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
                    className="glass-button"
                    style={{ padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 800 }}
                  >
                    ✅ Record Cash Repayment (Cut From Wallet)
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="submit"
                    className="glass-button active"
                    style={{ padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 800 }}
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
                      padding: '10px',
                      borderRadius: '12px',
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
      )}
    </div>
  );
};
