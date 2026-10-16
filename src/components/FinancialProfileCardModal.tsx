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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          background: 'var(--bg-card)',
          borderRadius: '26px',
          border: '1px solid var(--border-card-active, rgba(16, 185, 129, 0.35))',
          boxShadow: 'var(--glow-shadow)',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          color: 'var(--text-primary)'
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
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
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
            color: 'var(--primary, #10b981)',
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
              color: 'var(--primary, #10b981)',
              marginBottom: '2px'
            }}>
              <ShieldCheck size={11} /> 1-Time Setup
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Financial Profile 🎯
            </h3>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
          Welcome, <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong>! Set your Age & Monthly Salary to unlock automated daily limits and wealth compounding.
        </p>

        {/* Form Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* FIELD 1: Age in Years & Quick Presets */}
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '18px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cake size={14} style={{ color: 'var(--primary, #10b981)' }} />
                <span>Your Age (in Years)</span>
              </label>

              {/* Dynamic Age Badge */}
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: age ? 'var(--primary, #10b981)' : 'var(--text-muted)',
                background: age ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                border: age ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-input)',
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
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-input)',
                  color: 'var(--text-primary)',
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
                    border: age === presetAge.toString() ? '1px solid var(--primary, #10b981)' : '1px solid var(--border-input)',
                    background: age === presetAge.toString() ? 'rgba(16,185,129,0.2)' : 'var(--bg-card)',
                    color: age === presetAge.toString() ? 'var(--primary, #10b981)' : 'var(--text-secondary)',
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
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '18px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={14} style={{ color: 'var(--primary, #10b981)' }} />
                <span>Monthly Salary</span>
              </label>

              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--primary, #10b981)',
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
                color: 'var(--primary, #10b981)',
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
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-input)',
                  color: 'var(--text-primary)',
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
                    background: salary === preset.toString() ? 'rgba(16, 185, 129, 0.25)' : 'var(--bg-card)',
                    border: salary === preset.toString() ? '1px solid var(--primary, #10b981)' : '1px solid var(--border-input)',
                    color: salary === preset.toString() ? 'var(--primary, #10b981)' : 'var(--text-secondary)',
                    fontSize: '11px',
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
              color: '#ef4444',
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
                color: 'var(--text-muted)',
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
