import React, { useState, useRef, useEffect } from 'react';
import { User, KeyRound, Check, Eye, EyeOff, Globe, Banknote, ArrowLeft, Mail, Moon, Sun, Smartphone, Upload, Trash2, LogOut } from 'lucide-react';
import { t } from '../utils/i18n';
import { detectLocationFromIP } from '../utils/geoTracker';

interface ProfileViewProps {
  currentName: string;
  currentPin: string;
  currentCurrency: string;
  currentLanguage: string;
  currentEmail?: string;
  currentTheme?: 'system' | 'dark' | 'light';
  onSaveProfile: (newName: string, newPin: string, newCurrency: string, newLanguage: string, newEmail?: string) => Promise<void>;
  onToggleTheme?: (newTheme: 'system' | 'dark' | 'light') => void;
  onBack?: () => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentName,
  currentPin,
  currentCurrency,
  currentLanguage,
  currentEmail = '',
  currentTheme = 'system',
  onSaveProfile,
  onToggleTheme,
  onBack,
  onLogout
}) => {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail || localStorage.getItem('zb_user_email') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('zb_user_phone') || '');
  const [phoneCode, setPhoneCode] = useState(() => localStorage.getItem('zb_user_phone_code') || '+91');
  const [pin, setPin] = useState(currentPin);
  const [currency, setCurrency] = useState(currentCurrency);
  const [language, setLanguage] = useState(currentLanguage);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(currentTheme);
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-detect country calling code by IP location and timezone
  useEffect(() => {
    if (localStorage.getItem('zb_user_phone_code')) return;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || navigator.language.includes('IN')) {
      setPhoneCode('+91');
    } else if (tz.includes('America') || tz.includes('US') || navigator.language.includes('US')) {
      setPhoneCode('+1');
    } else if (tz.includes('London') || tz.includes('GB') || navigator.language.includes('GB')) {
      setPhoneCode('+44');
    }

    detectLocationFromIP().then(geo => {
      if (geo && geo.phoneCode) {
        setPhoneCode(geo.phoneCode);
        localStorage.setItem('zb_user_phone_code', geo.phoneCode);
      }
      if (geo && geo.countryCode) {
        localStorage.setItem('zb_user_country_code', geo.countryCode);
      }
    }).catch(() => {});
  }, []);

  const avatarFileRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('zb_user_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentName || 'User')}&background=22c55e&color=fff&rounded=true`;
  });

  const [rawUploadedImage, setRawUploadedImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropPanX, setCropPanX] = useState<number>(0);
  const [cropPanY, setCropPanY] = useState<number>(0);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setRawUploadedImage(event.target.result);
        setCropZoom(1);
        setCropPanX(0);
        setCropPanY(0);
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleApplyCrop = () => {
    if (!rawUploadedImage) return;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);

          const minDim = Math.min(img.width, img.height);
          const drawW = (img.width / minDim) * size * cropZoom;
          const drawH = (img.height / minDim) * size * cropZoom;
          const drawX = (size - drawW) / 2 + cropPanX;
          const drawY = (size - drawH) / 2 + cropPanY;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(compressed);
        }
      } catch (err) {
        console.warn('Crop canvas error:', err);
        setAvatarUrl(rawUploadedImage);
      }
      setRawUploadedImage(null);
    };
    img.src = rawUploadedImage;
  };

  const googleAvatarSaved = localStorage.getItem('zb_google_avatar');
  const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=22c55e&color=fff&rounded=true`;

  const PRESET_AVATARS = [
    ...(googleAvatarSaved ? [googleAvatarSaved] : []),
    initialsAvatar,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  ];

  const handleRemovePhoto = () => {
    setAvatarUrl(initialsAvatar);
  };

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
    setSuccessMsg('');
    try {
      if (avatarUrl) {
        localStorage.setItem('zb_user_avatar', avatarUrl);
      }
      localStorage.setItem('zb_user_phone', phone.trim());
      localStorage.setItem('zb_user_phone_code', phoneCode);
      localStorage.setItem('zb_theme', themeMode);
      
      if (onToggleTheme && themeMode !== currentTheme) {
        onToggleTheme(themeMode);
      }

      window.dispatchEvent(new Event('profile_avatar_updated'));
      await onSaveProfile(name.trim(), pin, currency, language, email.trim());
      setSuccessMsg('Profile settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && (
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
        )}
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Manrope', sans-serif", margin: 0 }}>
            Profile &amp; Preferences
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Username, avatar, passcode, currency &amp; language settings.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMsg && <p style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 600, margin: 0 }}>{errorMsg}</p>}
          {successMsg && <p style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 600, margin: 0 }}>{successMsg}</p>}

          {/* Profile Picture / Avatar Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-input)' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--primary)',
              boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '32px',
              fontWeight: 'bold',
              position: 'relative'
            }}>
              {name?.charAt(0)?.toUpperCase() || 'U'}
              {avatarUrl && (
                <img 
                  key={avatarUrl}
                  src={avatarUrl} 
                  alt="" 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                     (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>

            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Choose Profile Picture</span>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(url);
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    minHeight: '36px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: avatarUrl === url ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                    padding: 0,
                    cursor: 'pointer',
                    opacity: avatarUrl === url ? 1 : 0.6
                  }}
                >
                  <img src={url} alt={`Avatar ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}

              {/* Upload Custom Picture from Device Gallery / File Picker */}
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  minHeight: '36px',
                  borderRadius: '50%',
                  border: '1.5px dashed var(--primary)',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s ease'
                }}
                title="Upload custom photo from gallery"
              >
                <Upload size={16} />
              </button>

              {/* Remove Photo — revert to initials */}
              {avatarUrl && !avatarUrl.includes('ui-avatars.com') && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    minHeight: '36px',
                    borderRadius: '50%',
                    border: '1.5px dashed var(--danger)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease'
                  }}
                  title="Remove photo & use initials"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <input
                ref={avatarFileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('username')}
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
                style={{ paddingLeft: '40px', fontSize: '13px', padding: '12px 14px 12px 40px' }}
              />
            </div>
          </div>

          {/* Email Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Address (Tracked Account)
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="glass-input"
                style={{ paddingLeft: '40px', fontSize: '13px', padding: '12px 14px 12px 40px' }}
              />
            </div>
          </div>

          {/* Phone Number with Country Code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mobile Phone Number (Cashfree Sync)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Country Code Selector */}
              <select
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                className="glass-input"
                style={{ width: '110px', fontSize: '13px', padding: '12px 8px', appearance: 'none', textAlign: 'center', fontWeight: 700, flexShrink: 0 }}
              >
                <option value="+91" style={{ color: '#000' }}>🇮🇳 +91</option>
                <option value="+1" style={{ color: '#000' }}>🇺🇸 +1</option>
                <option value="+44" style={{ color: '#000' }}>🇬🇧 +44</option>
                <option value="+61" style={{ color: '#000' }}>🇦🇺 +61</option>
                <option value="+971" style={{ color: '#000' }}>🇦🇪 +971</option>
                <option value="+966" style={{ color: '#000' }}>🇸🇦 +966</option>
                <option value="+81" style={{ color: '#000' }}>🇯🇵 +81</option>
                <option value="+86" style={{ color: '#000' }}>🇨🇳 +86</option>
                <option value="+49" style={{ color: '#000' }}>🇩🇪 +49</option>
                <option value="+33" style={{ color: '#000' }}>🇫🇷 +33</option>
                <option value="+39" style={{ color: '#000' }}>🇮🇹 +39</option>
                <option value="+55" style={{ color: '#000' }}>🇧🇷 +55</option>
                <option value="+7" style={{ color: '#000' }}>🇷🇺 +7</option>
                <option value="+82" style={{ color: '#000' }}>🇰🇷 +82</option>
                <option value="+65" style={{ color: '#000' }}>🇸🇬 +65</option>
                <option value="+60" style={{ color: '#000' }}>🇲🇾 +60</option>
                <option value="+63" style={{ color: '#000' }}>🇵🇭 +63</option>
                <option value="+234" style={{ color: '#000' }}>🇳🇬 +234</option>
                <option value="+27" style={{ color: '#000' }}>🇿🇦 +27</option>
                <option value="+62" style={{ color: '#000' }}>🇮🇩 +62</option>
                <option value="+90" style={{ color: '#000' }}>🇹🇷 +90</option>
                <option value="+52" style={{ color: '#000' }}>🇲🇽 +52</option>
                <option value="+48" style={{ color: '#000' }}>🇵🇱 +48</option>
                <option value="+31" style={{ color: '#000' }}>🇳🇱 +31</option>
                <option value="+46" style={{ color: '#000' }}>🇸🇪 +46</option>
                <option value="+41" style={{ color: '#000' }}>🇨🇭 +41</option>
                <option value="+34" style={{ color: '#000' }}>🇪🇸 +34</option>
                <option value="+880" style={{ color: '#000' }}>🇧🇩 +880</option>
                <option value="+92" style={{ color: '#000' }}>🇵🇰 +92</option>
                <option value="+94" style={{ color: '#000' }}>🇱🇰 +94</option>
                <option value="+977" style={{ color: '#000' }}>🇳🇵 +977</option>
              </select>
              {/* Phone Number Input */}
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter your mobile number"
                  maxLength={15}
                  className="glass-input"
                  style={{ fontSize: '13px', padding: '12px 14px', width: '100%', letterSpacing: '1px', fontWeight: 700 }}
                />
              </div>
            </div>
            {phone && (
              <p style={{ fontSize: '11px', color: '#34d399', margin: '4px 0 0 0', fontWeight: 600 }}>
                📞 Saved Mobile Number: {phoneCode} {phone}
              </p>
            )}
          </div>

          {/* App Theme Toggle (Auto / Dark / Light) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              App Theme Mode (Auto / Dark / Light)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setThemeMode('system');
                  if (onToggleTheme) onToggleTheme('system');
                }}
                style={{
                  padding: '10px 6px',
                  borderRadius: '14px',
                  border: themeMode === 'system' ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                  background: themeMode === 'system' ? 'rgba(34,197,94,0.15)' : 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <Smartphone size={15} /> Auto (Device)
              </button>
              <button
                type="button"
                onClick={() => {
                  setThemeMode('dark');
                  if (onToggleTheme) onToggleTheme('dark');
                }}
                style={{
                  padding: '10px 6px',
                  borderRadius: '14px',
                  border: themeMode === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                  background: themeMode === 'dark' ? 'rgba(34,197,94,0.15)' : 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <Moon size={15} /> Dark Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setThemeMode('light');
                  if (onToggleTheme) onToggleTheme('light');
                }}
                style={{
                  padding: '10px 6px',
                  borderRadius: '14px',
                  border: themeMode === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                  background: themeMode === 'light' ? 'rgba(34,197,94,0.15)' : 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <Sun size={15} /> Light Mode
              </button>
            </div>
          </div>

          {/* PIN Passcode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('passcode')}
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
                style={{ fontSize: '13px', padding: '12px 40px 12px 40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
                }}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Multi-Currency Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('currency')}
            </label>
            <div style={{ position: 'relative' }}>
              <Banknote size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="glass-input"
                style={{ width: '100%', paddingLeft: '40px', fontSize: '13px', padding: '12px 14px 12px 40px', appearance: 'none', backgroundColor: 'transparent' }}
              >
                <option value="INR" style={{ color: '#000' }}>₹ INR (Indian Rupee)</option>
                <option value="USD" style={{ color: '#000' }}>$ USD (US Dollar)</option>
                <option value="EUR" style={{ color: '#000' }}>€ EUR (Euro)</option>
                <option value="GBP" style={{ color: '#000' }}>£ GBP (British Pound)</option>
                <option value="CAD" style={{ color: '#000' }}>C$ CAD (Canadian Dollar)</option>
                <option value="AUD" style={{ color: '#000' }}>A$ AUD (Australian Dollar)</option>
                <option value="JPY" style={{ color: '#000' }}>¥ JPY (Japanese Yen)</option>
                <option value="AED" style={{ color: '#000' }}>DH AED (UAE Dirham)</option>
                <option value="SAR" style={{ color: '#000' }}>SR SAR (Saudi Riyal)</option>
                <option value="CNY" style={{ color: '#000' }}>¥ CNY (Chinese Yuan)</option>
                <option value="SGD" style={{ color: '#000' }}>$ SGD (Singapore Dollar)</option>
                <option value="NZD" style={{ color: '#000' }}>$ NZD (New Zealand Dollar)</option>
                <option value="CHF" style={{ color: '#000' }}>CHF (Swiss Franc)</option>
                <option value="HKD" style={{ color: '#000' }}>$ HKD (Hong Kong Dollar)</option>
                <option value="KWD" style={{ color: '#000' }}>KD KWD (Kuwaiti Dinar)</option>
                <option value="QAR" style={{ color: '#000' }}>QR QAR (Qatari Riyal)</option>
              </select>
            </div>
          </div>

          {/* Multi-Language Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('language')}
            </label>
            <div style={{ position: 'relative' }}>
              <Globe size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="glass-input"
                style={{ width: '100%', paddingLeft: '40px', fontSize: '13px', padding: '12px 14px 12px 40px', appearance: 'none', backgroundColor: 'transparent' }}
              >
                <option value="en" style={{ color: '#000' }}>English</option>
                <option value="hi" style={{ color: '#000' }}>हिन्दी (Hindi)</option>
                <option value="bn" style={{ color: '#000' }}>বাংলা (Bengali)</option>
                <option value="mr" style={{ color: '#000' }}>मराठी (Marathi)</option>
                <option value="te" style={{ color: '#000' }}>తెలుగు (Telugu)</option>
                <option value="ta" style={{ color: '#000' }}>தமிழ் (Tamil)</option>
                <option value="gu" style={{ color: '#000' }}>ગુજરાતી (Gujarati)</option>
                <option value="ur" style={{ color: '#000' }}>اردو (Urdu)</option>
                <option value="kn" style={{ color: '#000' }}>ಕನ್ನಡ (Kannada)</option>
                <option value="or" style={{ color: '#000' }}>ଓଡ଼ିଆ (Odia)</option>
                <option value="ml" style={{ color: '#000' }}>മലയാളം (Malayalam)</option>
                <option value="pa" style={{ color: '#000' }}>ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="es" style={{ color: '#000' }}>Español (Spanish)</option>
                <option value="fr" style={{ color: '#000' }}>Français (French)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="glass-button active"
            style={{ width: '100%', padding: '14px', borderRadius: '16px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(to right, var(--primary), var(--secondary))', color: '#fff' }}
          >
            {isSaving ? 'Saving Changes...' : (
              <>
                <Check size={16} /> {t('save_settings')}
              </>
            )}
          </button>

          {/* Sign Out Action Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '13px',
                borderRadius: '16px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={16} /> Sign Out of Account
            </button>
          )}
        </form>
      </div>

      {/* Crop & Adjust Profile Picture Modal */}
      {rawUploadedImage && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Crop & Adjust Profile Picture 🖼️
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Zoom & position your photo inside the circular frame
            </p>

            {/* Circular Preview Container */}
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--primary)',
              boxShadow: '0 0 25px rgba(34, 197, 94, 0.3)',
              position: 'relative',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={rawUploadedImage}
                alt="Crop preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${cropZoom}) translate(${cropPanX / cropZoom}px, ${cropPanY / cropZoom}px)`,
                  transition: 'transform 0.05s ease-out'
                }}
              />
            </div>

            {/* Controls: Zoom slider & Pan */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>🔍 Zoom</span>
                  <span>{cropZoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>↔️ Pan Horizontal</div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={cropPanX}
                    onChange={(e) => setCropPanX(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>↕️ Pan Vertical</div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={cropPanY}
                    onChange={(e) => setCropPanY(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setRawUploadedImage(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-input)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
                }}
              >
                Apply Crop ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
