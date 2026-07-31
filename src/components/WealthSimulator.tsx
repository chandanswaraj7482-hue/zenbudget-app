import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface WealthSimulatorProps {
  onBack: () => void;
  transactions: Transaction[];
  currencySymbol: string;
}

const ASSET_TYPES = [
  { id: 'fd', name: 'Fixed Deposit', rate: 0.07, desc: 'Capital preservation & fixed interest rates.' },
  { id: 'gold', name: 'Gold / Sovereign Gold Bonds', rate: 0.09, desc: 'Precious metal inflation hedge.' },
  { id: 'index', name: 'Broad-Market Equity Index Scenario', rate: 0.12, desc: 'Diversified broad market growth simulation.' },
  { id: 'high_risk', name: 'High-Risk Growth Scenario', rate: 0.17, desc: 'High volatility, speculative growth scenario.' }
];

export const WealthSimulator: React.FC<WealthSimulatorProps> = ({
  onBack,
  transactions,
  currencySymbol
}) => {
  // 1. Calculate actual monthly savings as default slider input
  const now = new Date();
  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = currentMonthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = currentMonthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const realSavings = Math.max(0, monthIncome - monthExpenses);

  // States
  const [monthlyInvest, setMonthlyInvest] = useState<number>(realSavings > 0 ? Math.round(realSavings) : 5000);
  const [years, setYears] = useState<number>(10);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('index');

  const asset = ASSET_TYPES.find(a => a.id === selectedAssetId) || ASSET_TYPES[2];

  // Compound Interest Calculation
  const n = 12; // compounding frequency (monthly)
  const ratePerMonth = asset.rate / n;
  const totalMonths = years * n;
  
  // Future Value of Annuity: PMT * [((1 + r/n)^(nt) - 1) / (r/n)] * (1 + r/n)
  const totalWealth = monthlyInvest * ((Math.pow(1 + ratePerMonth, totalMonths) - 1) / ratePerMonth) * (1 + ratePerMonth);
  const totalInvested = monthlyInvest * totalMonths;
  const wealthGained = Math.max(0, totalWealth - totalInvested);

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
            Wealth Compound Simulator
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Simulate future growth with monthly savings habits.
          </p>
        </div>
      </div>

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
        
        {/* Monthly Investment Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Monthly Investment
            </label>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
              {formatCurrency(monthlyInvest, currencySymbol, 0)}/mo
            </span>
          </div>
          <input 
            type="range"
            min="500"
            max="100000"
            step="500"
            value={monthlyInvest}
            onChange={(e) => setMonthlyInvest(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
        </div>

        {/* Horizon Years Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Time Horizon
            </label>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {years} Years
            </span>
          </div>
          <input 
            type="range"
            min="1"
            max="40"
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

      {/* Disclaimers / Educational Note */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
        <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left', margin: 0 }}>
          Illustrative assumptions only — not expected or guaranteed returns. Actual investment returns vary and may result in losses. This tool is for educational simulation only and does not constitute investment advice.
        </p>
      </div>

    </div>
  );
};
