import React, { useState } from 'react';
import { X, User, KeyRound, Check, Eye, EyeOff, Globe, Banknote } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentPin: string;
  currentCurrency: string;
  currentLanguage: string;
  onSaveProfile: (newName: string, newPin: string, newCurrency: string, newLanguage: string) => Promise<void>;
  isUpdateAvailable?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentPin,
  currentCurrency,
  currentLanguage,
  onSaveProfile,
  isUpdateAvailable
}) => {
  const [name, setName] = useState(currentName);
  const [pin, setPin] = useState(currentPin);
  const [currency, setCurrency] = useState(currentCurrency);
  const [language, setLanguage] = useState(currentLanguage);
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // App auto-update checker states
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'up-to-date' | 'available' | 'error'>('idle');
  const [latestVersion, setLatestVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');

  const CURRENT_VERSION = '1.0.0';

  React.useEffect(() => {
    if (isOpen && isUpdateAvailable) {
      handleCheckUpdate();
    }
  }, [isOpen, isUpdateAvailable]);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateStatus('idle');
    try {
      const res = await fetch('https://zenbudget-tracker.vercel.app/version.json');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLatestVersion(data.version);
      setReleaseNotes(data.releaseNotes || '');
      
      if (data.version !== CURRENT_VERSION) {
        setUpdateStatus('available');
      } else {
        setUpdateStatus('up-to-date');
      }
    } catch (err) {
      setUpdateStatus('error');
    } finally {
      setCheckingUpdate(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }
    if (pin.length !== 4 || isNaN(Number(pin))) {
      setErrorMsg('PIN must be exactly 4 digits.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await onSaveProfile(name.trim(), pin, currency, language);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '350px',
          padding: '24px',
          borderRadius: '24px',
          position: 'relative',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.1)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Edit Profile Settings</h3>
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="glass-input"
                style={{ paddingLeft: '40px', fontSize: '13px', padding: '10px 14px 10px 40px' }}
              />
            </div>
          </div>

          {/* Currency & Language Row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Currency
              </label>
              <div style={{ position: 'relative' }}>
                <Banknote size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px', fontSize: '13px', padding: '10px 14px 10px 40px', appearance: 'none', backgroundColor: 'transparent' }}
                >
                  <option value="INR" style={{ color: '#000' }}>₹ INR</option>
                  <option value="USD" style={{ color: '#000' }}>$ USD</option>
                  <option value="EUR" style={{ color: '#000' }}>€ EUR</option>
                  <option value="GBP" style={{ color: '#000' }}>£ GBP</option>
                </select>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Language
              </label>
              <div style={{ position: 'relative' }}>
                <Globe size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px', fontSize: '13px', padding: '10px 14px 10px 40px', appearance: 'none', backgroundColor: 'transparent' }}
                >
                  <option value="English" style={{ color: '#000' }}>English</option>
                  <option value="Hindi" style={{ color: '#000' }}>Hindi</option>
                  <option value="Spanish" style={{ color: '#000' }}>Spanish</option>
                </select>
              </div>
            </div>
          </div>

          {/* PIN Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              4-Digit PIN Passcode
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type={showPin ? 'text' : 'password'}
                required
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="glass-input"
                style={{ fontSize: '13px', padding: '10px 40px 10px 40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="glass-button active"
            style={{
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'linear-gradient(to right, var(--primary), var(--secondary))',
              border: 'none',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.25)',
              marginTop: '6px'
            }}
          >
            <Check size={16} /> {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '20px 0' }} />

        {/* Updates Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            App Version & Updates
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Current Version</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>v{CURRENT_VERSION}</span>
          </div>

          {updateStatus === 'idle' && (
            <button
              type="button"
              onClick={handleCheckUpdate}
              disabled={checkingUpdate}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                background: 'rgba(34, 197, 94, 0.05)',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {checkingUpdate ? 'Checking for updates...' : 'Check for Updates'}
            </button>
          )}

          {updateStatus === 'up-to-date' && (
            <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
              ✓ Your app is up to date!
            </div>
          )}

          {updateStatus === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                Failed to check for updates. Try again.
              </div>
              <button
                type="button"
                onClick={handleCheckUpdate}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {updateStatus === 'available' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                🚀 New Update Available (v{latestVersion})
              </div>
              {releaseNotes && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {releaseNotes}
                </div>
              )}
              <a
                href="/zenbudget.apk"
                download="ZenBudget.apk"
                target="_self"
                onClick={() => {
                  setTimeout(() => {
                    window.location.href = '/zenbudget.apk';
                  }, 300);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'var(--success)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}
              >
                Download & Install Update
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
