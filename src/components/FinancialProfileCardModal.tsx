import React, { useState, useMemo } from 'react';
import { Sparkles, Calendar, DollarSign, Check, X, ShieldCheck, Cake, ArrowRight, Loader2 } from 'lucide-react';

interface FinancialProfileCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dob: string, monthlySalary: number) => Promise<void>;
  currencySymbol?: string;
  initialDob?: string;
  initialSalary?: number;
  userName?: string;
}

export const FinancialProfileCardModal: React.FC<FinancialProfileCardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currencySymbol = '₹',
  initialDob = '',
  initialSalary,
  userName = 'Friend'
}) => {
  if (!isOpen) return null;

  const [age, setAge] = useState<string>(() => {
    const profileId = localStorage.getItem('zb_profile_id') || 'local';
    const savedAge = localStorage.getItem(`zb_age_${profileId}`);
    if (savedAge) return savedAge;
    if (initialDob) {
      const dobDate = new Date(initialDob);
      if (!isNaN(dobDate.getTime())) {
        const diff = Date.now() - dobDate.getTime();
        const a = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        if (a > 0 && a <= 120) return a.toString();
      }
    }
    return '';
  });
  const [salary, setSalary] = useState<string>(initialSalary && initialSalary > 0 ? initialSalary.toString() : '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSalaryPreset = (amount: number) => {
    setSalary(amount.toString());
    if (error) setError(null);
  };

  const handleSave = async () => {
    const parsedAge = parseInt(age);
    if (!age || isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      setError('Please enter a valid age (e.g. 24).');
      return;
    }

    const numSalary = parseFloat(salary);
    if (isNaN(numSalary) || numSalary <= 0) {
      setError('Please enter your approximate Monthly Salary.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const profileId = localStorage.getItem('zb_profile_id') || 'local';
      localStorage.setItem(`zb_age_${profileId}`, age);
      const birthYear = new Date().getFullYear() - parsedAge;
      const approxDob = `${birthYear}-01-01`;
      localStorage.setItem(`zb_dob_${profileId}`, approxDob);

      await onSave(approxDob, Math.round(numSalary));
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'linear-gradient(165deg, rgba(17, 24, 39, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%)',
          borderRadius: '26px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.15)',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Dismiss"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#94a3b8',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
        >
          <X size={16} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#34d399',
              marginBottom: '2px'
            }}>
              <ShieldCheck size={11} /> 1-Time Setup
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Financial Profile 🎯
            </h3>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 18px 0' }}>
          Welcome, <strong style={{ color: '#f1f5f9' }}>{userName}</strong>! Set your Age & Monthly Salary to unlock automated daily limits and wealth compounding.
        </p>

        {/* Form Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* FIELD 1: Age in Years & Quick Presets */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cake size={14} style={{ color: '#10b981' }} />
                <span>Your Age (in Years)</span>
              </label>

              {/* Dynamic Age Badge */}
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: age ? '#34d399' : '#64748b',
                background: age ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                border: age ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '3px 10px',
                borderRadius: '100px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.25s ease'
              }}>
                {age ? (
                  <span>🎂 {age} yrs old</span>
                ) : (
                  <span>Enter your age</span>
                )}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>
                🎂
              </span>
              <input
                type="number"
                min={10}
                max={120}
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your age (e.g. 24)"
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 36px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Quick Age Presets */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[18, 21, 24, 28, 32, 40].map((presetAge) => (
                <button
                  key={presetAge}
                  type="button"
                  onClick={() => {
                    setAge(presetAge.toString());
                    if (error) setError(null);
                  }}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: age === presetAge.toString() ? '1px solid var(--primary, #10b981)' : '1px solid rgba(255,255,255,0.1)',
                    background: age === presetAge.toString() ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                    color: age === presetAge.toString() ? '#34d399' : '#94a3b8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {presetAge} yrs
                </button>
              ))}
            </div>
          </div>

          {/* FIELD 2: Monthly Salary */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={14} style={{ color: '#10b981' }} />
                <span>Monthly Salary</span>
              </label>

              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '2px 8px',
                borderRadius: '8px'
              }}>
                {currencySymbol}{salary ? Number(salary).toLocaleString('en-IN') : '0'} / mo
              </span>
            </div>

            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: 800,
                color: '#10b981',
                fontSize: '16px'
              }}>
                {currencySymbol}
              </span>
              <input
                type="number"
                value={salary}
                onChange={(e) => {
                  setSalary(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. 50,000"
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 36px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Quick Salary Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[25000, 50000, 75000, 100000, 150000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSalaryPreset(preset)}
                  style={{
                    flexShrink: 0,
                    padding: '5px 9px',
                    borderRadius: '8px',
                    background: salary === preset.toString() ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: salary === preset.toString() ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: salary === preset.toString() ? '#34d399' : '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {currencySymbol}{(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 600
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Save Profile Settings Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Profile Settings...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save Profile Settings</span>
              </>
            )}
          </button>

          {/* Skip option */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              I'll do this later
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
