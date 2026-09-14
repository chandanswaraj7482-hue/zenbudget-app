import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, TrendingUp, Landmark, Calculator, Info } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface WealthSimulatorProps {
  onBack: () => void;
  transactions: Transaction[];
  currencySymbol: string;
  initialTab?: 'compound' | 'fdrd' | 'tax';
}

const ASSET_TYPES = [
  { id: 'fd', name: 'Fixed Deposit', rate: 0.07, desc: 'Capital preservation & fixed interest rates.' },
  { id: 'gold', name: 'Gold / Sovereign Gold Bonds', rate: 0.09, desc: 'Precious metal inflation hedge.' },
  { id: 'index', name: 'Broad-Market Equity Index Scenario', rate: 0.12, desc: 'Diversified broad market growth simulation.' },
  { id: 'high_risk', name: 'High-Risk Growth Scenario', rate: 0.17, desc: 'High volatility, speculative growth scenario.' }
];

interface EditableNumberPillProps {
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  width?: string;
  placeholder?: string;
}

const EditableNumberPill: React.FC<EditableNumberPillProps> = ({
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = 0,
  max,
  width = '90px',
  placeholder = '0'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);

  const displayVal = isFocused 
    ? (rawText !== null ? rawText : (value === 0 ? '' : value.toString()))
    : (value === 0 ? '0' : (step < 1 ? value.toFixed(1) : value.toLocaleString('en-IN')));

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: isFocused ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.05)',
      border: isFocused ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.18)',
      borderRadius: '10px',
      padding: '4px 8px',
      gap: '4px',
      boxShadow: isFocused ? '0 0 12px rgba(16, 185, 129, 0.3)' : '0 2px 5px rgba(0,0,0,0.15)',
      transition: 'all 0.2s ease',
      cursor: 'text'
    }}>
      {prefix && (
        <span style={{ color: '#10b981', fontWeight: 800, fontSize: '13px' }}>
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={displayVal}
        placeholder={placeholder}
        onFocus={() => {
          setIsFocused(true);
          setRawText(value === 0 ? '' : value.toString());
        }}
        onBlur={() => {
          setIsFocused(false);
          setRawText(null);
        }}
        onChange={(e) => {
          const text = e.target.value;
          setRawText(text);
          if (text.trim() === '') {
            onChange(0);
            return;
          }
          const clean = text.replace(/,/g, '');
          const num = parseFloat(clean);
          if (!isNaN(num)) {
            let finalVal = Math.max(min, num);
            if (max !== undefined) {
              finalVal = Math.min(max, finalVal);
            }
            onChange(step < 1 ? Number(finalVal.toFixed(2)) : Math.round(finalVal));
          }
        }}
        style={{
          width,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '14px',
          textAlign: 'right',
          padding: 0
        }}
      />
      {suffix && (
        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>
          {suffix}
        </span>
      )}
    </div>
  );
};

export const WealthSimulator: React.FC<WealthSimulatorProps> = ({
  onBack,
  transactions,
  currencySymbol,
  initialTab = 'compound'
}) => {
  const [activeTab, setActiveTab] = useState<'compound' | 'fdrd' | 'tax'>(initialTab);

  // --- 1. COMPOUND WEALTH SIMULATOR LOGIC ---
  const now = new Date();
  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = currentMonthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = currentMonthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const realSavings = Math.max(0, monthIncome - monthExpenses);

  const [monthlyInvest, setMonthlyInvest] = useState<number>(realSavings > 0 ? Math.round(realSavings) : 5000);
  const [years, setYears] = useState<number>(10);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('index');

  const asset = ASSET_TYPES.find(a => a.id === selectedAssetId) || ASSET_TYPES[2];
  const n = 12;
  const ratePerMonth = asset.rate / n;
  const totalMonths = years * n;
  const totalWealth = monthlyInvest * ((Math.pow(1 + ratePerMonth, totalMonths) - 1) / ratePerMonth) * (1 + ratePerMonth);
  const totalInvested = monthlyInvest * totalMonths;
  const wealthGained = Math.max(0, totalWealth - totalInvested);

  // --- 2. FD / RD CALCULATOR LOGIC ---
  const [fdrdType, setFdrdType] = useState<'fd' | 'rd'>('fd');
  const [depositAmount, setDepositAmount] = useState<number>(100000);
  const [fdRate, setFdRate] = useState<number>(7.1);
  const [fdYears, setFdYears] = useState<number>(5);

  const fdRateDecimal = fdRate / 100;
  let fdTotalInvested = depositAmount;
  let fdMaturityAmount = 0;

  if (fdrdType === 'fd') {
    fdTotalInvested = depositAmount;
    fdMaturityAmount = depositAmount * Math.pow(1 + fdRateDecimal / 4, 4 * fdYears);
  } else {
    const nMonths = fdYears * 12;
    fdTotalInvested = depositAmount * nMonths;
    const rQuarter = fdRateDecimal / 4;
    let sum = 0;
    for (let m = 1; m <= nMonths; m++) {
      const quartersLeft = (nMonths - m + 1) / 3;
      sum += depositAmount * Math.pow(1 + rQuarter, quartersLeft);
    }
    fdMaturityAmount = sum;
  }
  const fdInterestEarned = Math.max(0, fdMaturityAmount - fdTotalInvested);

  // --- 3. TAX ESTIMATOR LOGIC ---
  const profileId = localStorage.getItem('zb_profile_id') || 'local';
  const savedSalary = Number(localStorage.getItem(`zb_monthly_salary_${profileId}`)) || 0;
  const defaultAnnualIncome = savedSalary > 0 ? savedSalary * 12 : 900000;

  const [annualIncome, setAnnualIncome] = useState<number>(defaultAnnualIncome);
  const [taxRegime, setTaxRegime] = useState<'new' | 'old'>('new');
  const [deductions80C, setDeductions80C] = useState<number>(150000);
  const [deductions80D, setDeductions80D] = useState<number>(25000);

  const standardDeduction = taxRegime === 'new' ? 75000 : 50000;
  let totalDeductions = standardDeduction;
  if (taxRegime === 'old') {
    totalDeductions += Math.min(150000, deductions80C) + Math.min(50000, deductions80D);
  }
  const taxableIncome = Math.max(0, annualIncome - totalDeductions);

  let rawTax = 0;
  if (taxRegime === 'new') {
    if (taxableIncome > 1500000) {
      rawTax += (taxableIncome - 1500000) * 0.30;
      rawTax += 300000 * 0.20;
      rawTax += 200000 * 0.15;
      rawTax += 300000 * 0.10;
      rawTax += 400000 * 0.05;
    } else if (taxableIncome > 1200000) {
      rawTax += (taxableIncome - 1200000) * 0.20;
      rawTax += 200000 * 0.15;
      rawTax += 300000 * 0.10;
      rawTax += 400000 * 0.05;
    } else if (taxableIncome > 1000000) {
      rawTax += (taxableIncome - 1000000) * 0.15;
      rawTax += 300000 * 0.10;
      rawTax += 400000 * 0.05;
    } else if (taxableIncome > 700000) {
      rawTax += (taxableIncome - 700000) * 0.10;
      rawTax += 400000 * 0.05;
    } else if (taxableIncome > 300000) {
      rawTax += (taxableIncome - 300000) * 0.05;
    }
    if (taxableIncome <= 700000) {
      rawTax = 0;
    }
  } else {
    if (taxableIncome > 1000000) {
      rawTax += (taxableIncome - 1000000) * 0.30;
      rawTax += 500000 * 0.20;
      rawTax += 250000 * 0.05;
    } else if (taxableIncome > 500000) {
      rawTax += (taxableIncome - 500000) * 0.20;
      rawTax += 250000 * 0.05;
    } else if (taxableIncome > 250000) {
      rawTax += (taxableIncome - 250000) * 0.05;
    }
    if (taxableIncome <= 500000) {
      rawTax = 0;
    }
  }

  const cess = rawTax * 0.04;
  const totalTax = Math.round(rawTax + cess);
  const netInHand = Math.max(0, annualIncome - totalTax);
  const effectiveRate = annualIncome > 0 ? ((totalTax / annualIncome) * 100).toFixed(1) : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Manrope', sans-serif", margin: 0 }}>
            Wealth & Financial Calculators
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Simulate future compound growth, bank deposits & tax deductions.
          </p>
        </div>
      </div>

      {/* Top 3 Navigation Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        background: 'var(--bg-input)',
        padding: '6px',
        borderRadius: '16px',
        border: '1px solid var(--border-input)'
      }}>
        <button
          onClick={() => setActiveTab('compound')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 6px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'compound' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'compound' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '11.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <TrendingUp size={14} /> SIP / Wealth
        </button>

        <button
          onClick={() => setActiveTab('fdrd')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 6px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'fdrd' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'fdrd' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '11.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Landmark size={14} /> FD / RD
        </button>

        <button
          onClick={() => setActiveTab('tax')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 6px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'tax' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'tax' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '11.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Calculator size={14} /> Tax Estimator
        </button>
      </div>

      {/* --- TAB 1: COMPOUND WEALTH SIMULATOR --- */}
      {activeTab === 'compound' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Result Card */}
          <div className="glass-panel" style={{
            padding: '24px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Projected Total Wealth ({years} Years)
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {formatCurrency(totalWealth, currencySymbol, 0)}
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border-input)', paddingTop: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Deposited</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {formatCurrency(totalInvested, currencySymbol, 0)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Simulated Wealth Gain</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)', margin: '4px 0 0 0' }}>
                  +{formatCurrency(wealthGained, currencySymbol, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Controls Form */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Monthly Investment Slider & Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Monthly Investment
                </label>
                <EditableNumberPill
                  value={monthlyInvest}
                  onChange={setMonthlyInvest}
                  prefix={currencySymbol}
                  suffix="/mo"
                  step={500}
                  min={500}
                  width="95px"
                />
              </div>
              <input 
                type="range"
                min="500"
                max={Math.max(100000, monthlyInvest)}
                step="500"
                value={monthlyInvest}
                onChange={(e) => setMonthlyInvest(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Horizon Years Slider & Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Time Horizon
                </label>
                <EditableNumberPill
                  value={years}
                  onChange={setYears}
                  suffix="Years"
                  step={1}
                  min={1}
                  max={50}
                  width="45px"
                />
              </div>
              <input 
                type="range"
                min="1"
                max={Math.max(40, years)}
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Asset Type Scenario Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Select Investment Scenario
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ASSET_TYPES.map(a => {
                  const isSelected = selectedAssetId === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAssetId(a.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-input)',
                        background: isSelected ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-input)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{a.name}</span>
                        <span style={{ color: 'var(--primary)' }}>{(a.rate * 100).toFixed(0)}% illustrative assumption</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>{a.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 2: FD / RD CALCULATOR --- */}
      {activeTab === 'fdrd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* FD vs RD Sub-toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => setFdrdType('fd')}
              style={{
                padding: '12px',
                borderRadius: '14px',
                border: fdrdType === 'fd' ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                background: fdrdType === 'fd' ? 'rgba(34,197,94,0.12)' : 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Fixed Deposit (FD - Lumpsum)
            </button>
            <button
              onClick={() => setFdrdType('rd')}
              style={{
                padding: '12px',
                borderRadius: '14px',
                border: fdrdType === 'rd' ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                background: fdrdType === 'rd' ? 'rgba(34,197,94,0.12)' : 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Recurring Deposit (RD - Monthly)
            </button>
          </div>

          {/* FD/RD Result Card */}
          <div className="glass-panel" style={{
            padding: '24px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Maturity Value ({fdYears} Years @ {fdRate}%)
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {formatCurrency(fdMaturityAmount, currencySymbol, 0)}
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border-input)', paddingTop: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Investment</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {formatCurrency(fdTotalInvested, currencySymbol, 0)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Interest Earned</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)', margin: '4px 0 0 0' }}>
                  +{formatCurrency(fdInterestEarned, currencySymbol, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Controls Form */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Amount Slider & Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {fdrdType === 'fd' ? 'Total Deposit Amount' : 'Monthly Deposit Amount'}
                </label>
                <EditableNumberPill
                  value={depositAmount}
                  onChange={setDepositAmount}
                  prefix={currencySymbol}
                  suffix={fdrdType === 'rd' ? '/mo' : ''}
                  step={fdrdType === 'fd' ? 5000 : 500}
                  min={500}
                  width="115px"
                />
              </div>
              <input 
                type="range"
                min={fdrdType === 'fd' ? 5000 : 500}
                max={Math.max(fdrdType === 'fd' ? 2000000 : 50000, depositAmount)}
                step={fdrdType === 'fd' ? 5000 : 500}
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Interest Rate Slider & Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Annual Interest Rate (%)
                </label>
                <EditableNumberPill
                  value={fdRate}
                  onChange={setFdRate}
                  suffix="% p.a."
                  step={0.1}
                  min={1}
                  max={30}
                  width="55px"
                />
              </div>
              <input 
                type="range"
                min="1.0"
                max={Math.max(15.0, fdRate)}
                step="0.1"
                value={fdRate}
                onChange={(e) => setFdRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Time Horizon Slider & Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Tenure (Duration)
                  </label>
                  <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px', fontWeight: 600 }}>
                    ({Math.round(fdYears * 12)} Mos)
                  </span>
                </div>
                <EditableNumberPill
                  value={fdYears}
                  onChange={setFdYears}
                  suffix="Years"
                  step={1}
                  min={1}
                  max={30}
                  width="45px"
                />
              </div>
              <input 
                type="range"
                min="1"
                max={Math.max(15, fdYears)}
                step="1"
                value={fdYears}
                onChange={(e) => setFdYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: TAX ESTIMATOR --- */}
      {activeTab === 'tax' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Regime Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => setTaxRegime('new')}
              style={{
                padding: '12px',
                borderRadius: '14px',
                border: taxRegime === 'new' ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                background: taxRegime === 'new' ? 'rgba(34,197,94,0.12)' : 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              New Regime (Default 2024-26)
            </button>
            <button
              onClick={() => setTaxRegime('old')}
              style={{
                padding: '12px',
                borderRadius: '14px',
                border: taxRegime === 'old' ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                background: taxRegime === 'old' ? 'rgba(34,197,94,0.12)' : 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              Old Regime (With 80C & 80D)
            </button>
          </div>

          {/* Tax Result Card */}
          <div className="glass-panel" style={{
            padding: '24px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Estimated Total Income Tax Payable
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: totalTax === 0 ? 'var(--success)' : '#ef4444', margin: 0 }}>
              {totalTax === 0 ? '₹0 (Zero Tax 🎉)' : formatCurrency(totalTax, currencySymbol, 0)}
            </h1>
            {totalTax === 0 && (
              <span style={{ fontSize: '11.5px', color: 'var(--success)', fontWeight: 700 }}>
                Eligible for Section 87A Full Tax Rebate!
              </span>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border-input)', paddingTop: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Net In-Hand Income</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {formatCurrency(netInHand, currencySymbol, 0)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Effective Tax Rate</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {effectiveRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Controls Form */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Annual Income Input & Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Annual Gross Salary / Income
                </label>
                <EditableNumberPill
                  value={annualIncome}
                  onChange={setAnnualIncome}
                  prefix={currencySymbol}
                  suffix="/yr"
                  step={25000}
                  min={100000}
                  width="115px"
                />
              </div>
              <input 
                type="range"
                min="100000"
                max={Math.max(5000000, annualIncome)}
                step="25000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Standard Deduction Info Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-input)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} color="var(--primary)" />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Standard Deduction</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>
                -₹{standardDeduction.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Old Regime Extra Deductions */}
            {taxRegime === 'old' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Section 80C (PPF, ELSS, EPF, LIC)
                    </label>
                    <EditableNumberPill
                      value={deductions80C}
                      onChange={setDeductions80C}
                      prefix="₹"
                      step={5000}
                      min={0}
                      max={150000}
                      width="85px"
                    />
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="150000"
                    step="5000"
                    value={deductions80C}
                    onChange={(e) => setDeductions80C(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Section 80D (Health Insurance)
                    </label>
                    <EditableNumberPill
                      value={deductions80D}
                      onChange={setDeductions80D}
                      prefix="₹"
                      step={2500}
                      min={0}
                      max={50000}
                      width="75px"
                    />
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="50000"
                    step="2500"
                    value={deductions80D}
                    onChange={(e) => setDeductions80D(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>
              </>
            )}

            {/* Taxable Income Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-input)', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Taxable Income:</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatCurrency(taxableIncome, currencySymbol, 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimers / Educational Note */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
        <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left', margin: 0 }}>
          {activeTab === 'tax' 
            ? 'Estimates are based on latest Indian Income Tax slabs for FY 2024-25 / FY 2025-26. Actual tax liabilities may vary depending on surcharges, capital gains, and official tax filings.'
            : 'Illustrative assumptions only — not guaranteed returns. These tools are designed for financial planning & educational purposes.'}
        </p>
      </div>

    </div>
  );
};
