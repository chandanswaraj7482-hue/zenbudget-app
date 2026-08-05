import React, { useState } from 'react';
import { Smartphone, Bike, Home, Plane, Heart, GraduationCap, ChevronRight, Check, HelpCircle } from 'lucide-react';
import type { SavingsGoal } from '../types';

interface OnboardingProps {
  onComplete: (goal: SavingsGoal | null) => void;
  currencySymbol: string;
}

const goalsList = [
  { id: 'iphone', name: 'iPhone', icon: Smartphone, color: '#3b82f6', defaultTarget: 80000 },
  { id: 'bike', name: 'Bike', icon: Bike, color: '#ef4444', defaultTarget: 150000 },
  { id: 'house', name: 'House', icon: Home, color: '#10b981', defaultTarget: 2000000 },
  { id: 'travel', name: 'Travel', icon: Plane, color: '#f59e0b', defaultTarget: 50000 },
  { id: 'wedding', name: 'Wedding', icon: Heart, color: '#ec4899', defaultTarget: 1000000 },
  { id: 'education', name: 'Education', icon: GraduationCap, color: '#8b5cf6', defaultTarget: 500000 },
  { id: 'other', name: 'Other', icon: HelpCircle, color: '#10b981', defaultTarget: 100000 }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, currencySymbol }) => {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<typeof goalsList[0] | null>(null);
  const [customGoalName, setCustomGoalName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [months, setMonths] = useState<number>(6);

  const handleSkip = () => {
    onComplete(null);
  };

  const handleNext = () => {
    if (step === 1 && selectedGoal) {
      if (selectedGoal.id === 'other' && !customGoalName.trim()) {
        return;
      }
      setAmount(selectedGoal.defaultTarget.toString());
      setStep(2);
    } else if (step === 2 && amount && Number(amount) > 0) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (selectedGoal) {
        const goalName = selectedGoal.id === 'other' ? customGoalName.trim() : selectedGoal.name;
        onComplete({
          id: `goal_${Date.now()}`,
          name: goalName,
          targetAmount: Number(amount) || selectedGoal.defaultTarget,
          currentAmount: 0,
          deadlineMonths: months,
          color: selectedGoal.color
        });
      }
    }
  };

  const calculateDaily = () => {
    const total = Number(amount) || 0;
    const days = months * 30;
    return Math.ceil(total / days);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-dark)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      color: 'var(--text-primary)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      
      {/* Progress Bar */}
      <div style={{ width: '100%', height: '4px', background: 'var(--border-input)', borderRadius: '2px', marginTop: '40px' }}>
        <div style={{
          width: `${(step / 4) * 100}%`,
          height: '100%',
          background: 'linear-gradient(to right, var(--primary), var(--secondary))',
          borderRadius: '2px',
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        
        {/* STEP 1: What are you saving for? */}
        {step === 1 && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.1, fontFamily: "'Manrope', sans-serif" }}>
              What are you<br />
              <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                saving for?
              </span>
            </h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {goalsList.map(g => {
                const isSelected = selectedGoal?.id === g.id;
                const Icon = g.icon;
                return (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGoal(g); if (g.id !== 'other') setCustomGoalName(''); }}
                    style={{
                      background: isSelected ? 'var(--primary-glow)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-card)'}`,
                      borderRadius: '20px',
                      padding: '20px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected ? '0 8px 25px var(--primary-glow)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '14px',
                      background: isSelected ? g.color : 'var(--bg-input)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? '#fff' : 'var(--text-secondary)'
                    }}>
                      <Icon size={22} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {g.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom goal name input when "Other" is selected */}
            {selectedGoal?.id === 'other' && (
              <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  What's your goal?
                </label>
                <input
                  type="text"
                  value={customGoalName}
                  onChange={(e) => setCustomGoalName(e.target.value)}
                  placeholder="e.g. New Laptop, Emergency Fund"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: "'Manrope', sans-serif"
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: How much does it cost? */}
        {step === 2 && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.1, fontFamily: "'Manrope', sans-serif" }}>
              How much does<br />
              the <span style={{ color: selectedGoal?.color || 'var(--primary)' }}>{selectedGoal?.id === 'other' ? customGoalName : selectedGoal?.name}</span> cost?
            </h1>
            
            <div style={{ position: 'relative', marginTop: '20px' }}>
              <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '28px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {currencySymbol}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                autoFocus
                placeholder="0"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid var(--border-input)',
                  fontSize: '48px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  padding: '10px 20px 10px 50px',
                  outline: 'none',
                  fontFamily: "'Manrope', sans-serif"
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: When do you want it? */}
        {step === 3 && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.1, fontFamily: "'Manrope', sans-serif" }}>
              When do you<br />want it?
            </h1>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                I want to buy it in <strong style={{ color: 'var(--text-primary)', fontSize: '20px' }}>{months}</strong> months.
              </p>
              
              <input 
                type="range" 
                min="1" 
                max="36" 
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
                <span>1 month</span>
                <span>3 years</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Congratulations summary */}
        {step === 4 && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center', textAlign: 'center', marginTop: '40px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px var(--primary-glow)' }}>
              <Check size={40} color="#fff" />
            </div>
            
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.2, fontFamily: "'Manrope', sans-serif", marginBottom: '12px' }}>
                Congratulations!
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                To buy your <strong style={{ color: selectedGoal?.color }}>{selectedGoal?.id === 'other' ? customGoalName : selectedGoal?.name}</strong> in {months} months, you just need to save:
              </p>
            </div>
            
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', width: '100%', border: '1px solid var(--border-card)' }}>
              <span style={{ fontSize: '42px', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {currencySymbol}{calculateDaily()}
              </span>
              <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}> / day</span>
            </div>
            
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Let's build that habit.
            </p>
          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
        <button
          onClick={handleSkip}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Skip for now
        </button>

        <button
          onClick={handleNext}
          disabled={(step === 1 && !selectedGoal) || (step === 1 && selectedGoal?.id === 'other' && !customGoalName.trim()) || (step === 2 && (!amount || Number(amount) <= 0))}
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            border: 'none',
            borderRadius: '16px',
            padding: '14px 28px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            opacity: ((step === 1 && !selectedGoal) || (step === 1 && selectedGoal?.id === 'other' && !customGoalName.trim()) || (step === 2 && (!amount || Number(amount) <= 0))) ? 0.5 : 1,
            boxShadow: '0 8px 25px var(--primary-glow)',
            transition: 'all 0.2s'
          }}
        >
          {step === 4 ? 'Get Started' : 'Next'} <ChevronRight size={18} />
        </button>
      </div>

    </div>
  );
};
