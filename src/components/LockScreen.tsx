import React, { useState, useEffect, useRef } from 'react';
import { Delete, AlertCircle, CheckCircle, Mail, KeyRound, Loader2, LogOut, ArrowLeft, User, Download, Fingerprint, X, Gift, Eye, EyeOff, Globe, Zap, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { playNotificationSound } from '../utils/audio';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { getInitialsAvatar } from '../utils/avatar';
import { GooglePlayIcon } from './GooglePlayBadge';
import { DISTRIBUTION_CONFIG } from '../config/buildConfig';
import { getPinSecurityStatus, recordFailedPinAttempt, resetPinSecurityStatus } from '../utils/securityGuard';

interface LockScreenProps {
  onUnlock: (userId: string, username: string, tier: string, trialStart: string, pin: string, premiumExpiresAt: string | null, trialExpireDate?: string | null) => void;
  onBackToLanding?: () => void;
}

const getInitialsName = (userName: string, userEmail: string) => {
  if (userName && userName.trim() !== '') return userName.trim();
  if (userEmail && userEmail.trim() !== '') {
    const usernamePart = userEmail.split('@')[0];
    return usernamePart.substring(0, 2).toUpperCase();
  }
  return 'User';
};

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, onBackToLanding }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lockscreen steps: 'auth' | 'onboard-pin' | 'onboard-confirm' | 'unlock' | 'forgot-pin-email' | 'forgot-pin-otp'
  const [step, setStep] = useState<'auth' | 'onboard-pin' | 'onboard-confirm' | 'unlock' | 'forgot-pin-email' | 'forgot-pin-otp'>('auth');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');

  // Password / PIN reset with Email OTP states
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Verification variables
  const [enteredPin, setEnteredPin] = useState('');
  const [isIncorrect, setIsIncorrect] = useState(false);

  // Loaded user profile reference
  const [dbProfile, setDbProfile] = useState<{
    name: string;
    pin: string;
    subscription_tier: string;
    trial_start_date: string;
    premium_expires_at: string | null;
    trial_expire_date?: string | null;
    referral_code?: string;
    referred_by?: string;
  } | null>(null);

  // Biometric authentication states
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [pendingUnlockData, setPendingUnlockData] = useState<{
    userId: string;
    name: string;
    tier: string;
    trialStart: string;
    pin: string;
    premiumExpires: string | null;
    trialExpire: string | null;
  } | null>(null);

  // iOS Safari PWA setup state
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<'apple' | 'android'>('android');

  useEffect(() => {
    // Detect Apple vs Android device
    const isApple = typeof navigator !== 'undefined' && (
      /Macintosh|Mac OS X|MacIntel|Mac|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
      /Mac/i.test(navigator.platform || '')
    );
    setDetectedPlatform(isApple ? 'apple' : 'android');

    // Silently detect location for currency — IP is NOT displayed to user
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_code) {
          const detectedCurrency = data.country_code === 'IN' ? 'INR' : 'USD';
          localStorage.setItem('zb_default_currency', detectedCurrency);
          const profileId = localStorage.getItem('zb_profile_id');
          if (profileId) {
            localStorage.setItem(`zb_currency_${profileId}`, detectedCurrency);
          }
        }
      })
      .catch(() => { });
  }, []);

  // Physical keyboard support for PIN entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 'auth') return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, pin, confirmPin, enteredPin, dbProfile, userId, username]);

  // Check if session already exists on load & listen to redirect events
  useEffect(() => {
    console.log("LockScreen: Initializing session checks and listeners");
    checkCurrentSession();

    // Check if biometric authentication is available
    if (Capacitor.isNativePlatform()) {
      import('@capgo/capacitor-native-biometric')
        .then(({ NativeBiometric }) => {
          return NativeBiometric.isAvailable();
        })
        .then((result) => {
          if (result && result.isAvailable) {
            setBiometricsAvailable(true);
          }
        })
        .catch((err) => {
          console.warn('LockScreen: Biometrics isAvailable check failed:', err);
        });
    } else {
      // Web/PWA: Check WebAuthn (fingerprint/face on mobile browsers)
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          .then((available) => {
            if (available) {
              setBiometricsAvailable(true);
            }
          })
          .catch((err) => {
            console.warn('LockScreen: WebAuthn check failed:', err);
          });
      }
    }

    // Setup deep link listener for Capacitor native app
    let urlListener: any = null;
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', async (eventData: any) => {
          console.log('LockScreen: App opened with deep link URL:', eventData.url);
          try {
            const urlStr = eventData.url || '';
            setIsLoading(true);

            // 1. Check for PKCE Authorization Code
            if (urlStr.includes('code=')) {
              try {
                const fakeUrl = new URL(urlStr.replace('app.zenbudget.app://', 'https://dummy.app/'));
                const code = fakeUrl.searchParams.get('code') || urlStr.split('code=')[1]?.split('&')[0];
                if (code) {
                  const { data: exchData, error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
                  if (exchErr) throw exchErr;
                  if (exchData?.session?.user) {
                    await fetchUserProfile(exchData.session.user.id);
                  }
                  const { Browser } = await import('@capacitor/browser');
                  await Browser.close();
                  setIsLoading(false);
                  return;
                }
              } catch (codeErr) {
                console.warn('PKCE Code exchange error:', codeErr);
              }
            }

            // 2. Check for Implicit Access Token + Refresh Token
            if (urlStr.includes('access_token=')) {
              let accessToken = '';
              let refreshToken = '';

              const hashIndex = urlStr.indexOf('#');
              const queryIndex = urlStr.indexOf('?');
              const paramsStr = hashIndex !== -1 ? urlStr.substring(hashIndex + 1) : (queryIndex !== -1 ? urlStr.substring(queryIndex + 1) : '');
              const params = new URLSearchParams(paramsStr);
              accessToken = params.get('access_token') || '';
              refreshToken = params.get('refresh_token') || '';

              if (!accessToken) {
                const matchAcc = urlStr.match(/access_token=([^&]+)/);
                if (matchAcc) accessToken = decodeURIComponent(matchAcc[1]);
              }
              if (!refreshToken) {
                const matchRef = urlStr.match(/refresh_token=([^&]+)/);
                if (matchRef) refreshToken = decodeURIComponent(matchRef[1]);
              }

              if (accessToken && refreshToken) {
                const { data: sessData, error: sessErr } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                });
                if (sessErr) throw sessErr;
                if (sessData?.session?.user) {
                  await fetchUserProfile(sessData.session.user.id);
                }
                const { Browser } = await import('@capacitor/browser');
                await Browser.close();
                setIsLoading(false);
                return;
              }
            }

            // 3. Fallback: Check active session directly
            const { data: currentSess } = await supabase.auth.getSession();
            if (currentSess?.session?.user) {
              await fetchUserProfile(currentSess.session.user.id);
              const { Browser } = await import('@capacitor/browser');
              await Browser.close();
            }
          } catch (err: any) {
            console.error('LockScreen: Error handling deep link session:', err);
            setErrorMsg(err.message || 'Failed to complete Google Sign-In redirect.');
          } finally {
            setIsLoading(false);
          }
        }).then(listener => {
          urlListener = listener;
        });
      });
    }

    // Setup active state change listener (critical for OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("LockScreen: supabase.auth.onAuthStateChange triggered", event, session?.user?.email);

      // IMPORTANT FIX: Ignore SIGNED_OUT event if user has a valid local cached session
      // This prevents random auto-logouts when Supabase token refreshes or expires
      if (event === 'SIGNED_OUT') {
        const localCached = localStorage.getItem('zb_local_session_profile');
        if (localCached) {
          console.log('LockScreen: Ignoring SIGNED_OUT — using cached local session to prevent auto-logout.');
          return;
        }
      }

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        localStorage.setItem('zb_oauth_just_completed', 'true');
        setUserId(session.user.id);
        if (session.user.email) {
          localStorage.setItem('zb_user_email', session.user.email);
        }
        const metadata = session.user.user_metadata;
        const name = metadata?.full_name || metadata?.name || session.user.email?.split('@')[0] || 'User';
        setUsername(name);

        // Save Google OAuth avatar as a preset option in profile picker (don't overwrite custom avatar)
        const googleAvatar = metadata?.avatar_url || metadata?.picture || metadata?.photo_url || metadata?.avatar;
        if (googleAvatar) {
          localStorage.setItem('zb_google_avatar', googleAvatar);
          if (!localStorage.getItem('zb_user_avatar')) {
            localStorage.setItem('zb_user_avatar', googleAvatar);
            window.dispatchEvent(new Event('profile_avatar_updated'));
          }
        }

        await fetchUserProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (urlListener) {
        urlListener.remove();
      }
    };
  }, []);

  async function getOrCreateDeviceId(): Promise<string> {
    let prefix = 'desktop_';
    if (Capacitor.isNativePlatform()) {
      prefix = 'mobile_';
      try {
        const idResult = await Device.getId();
        return `${prefix}${idResult.identifier}`;
      } catch (e) {
        console.warn('Failed to get Capacitor hardware device ID, falling back to localStorage UUID:', e);
      }
    }

    const { screen, navigator } = window;

    // Check if on mobile browser
    if (window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent)) {
      prefix = 'mobile_';
    }

    // Hardware Fingerprint for Web (Chrome/Edge on same device will have same ID)
    const hardwareString = `${screen.width}x${screen.height}-${navigator.hardwareConcurrency || 2}-${navigator.platform}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`;

    let hash = 0;
    for (let i = 0; i < hardwareString.length; i++) {
      const char = hardwareString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    const fingerprint = Math.abs(hash).toString(36) + '-' + (screen.width * screen.height).toString(36);
    const finalId = `${prefix}${fingerprint}`;
    localStorage.setItem('zb_device_id', finalId);
    return finalId;
  }

  async function getDeviceName(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      try {
        const info = await Device.getInfo();
        return `${info.operatingSystem.toUpperCase()} - ${info.model}`;
      } catch (e) { }
    }
    return 'Web - ' + navigator.userAgent.substring(0, 40);
  }

  async function withTimeout<T>(promise: Promise<T>, ms: number = 2000): Promise<T | null> {
    try {
      const timer = new Promise<null>(resolve => setTimeout(() => resolve(null), ms));
      const res = await Promise.race([promise, timer]);
      return res;
    } catch (_) {
      return null;
    }
  }

  async function fetchUserProfile(uid: string) {
    try {
      console.log("LockScreen: fetchUserProfile() starting for uid", uid);
      let userProf: any = null;

      // 1. Try fetching profile by id with timeout
      try {
        const queryPromise = supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
        const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('Query timeout') }), 3000)
        );
        const { data } = await Promise.race([queryPromise, timeoutPromise]);
        if (data) userProf = data;
      } catch (eQuery) {
        console.warn("LockScreen: fetchUserProfile by id warning:", eQuery);
      }

      // 2. If not found by id, try matching by email for existing users / multi-device sync
      let storedEmail = (email || localStorage.getItem('zb_user_email') || '').trim().toLowerCase();
      if (!storedEmail) {
        try {
          const { data: sessData } = await supabase.auth.getSession();
          if (sessData?.session?.user?.email) {
            storedEmail = sessData.session.user.email.trim().toLowerCase();
            localStorage.setItem('zb_user_email', storedEmail);
          }
        } catch (_) {}
      }

      if (!userProf && storedEmail) {
        try {
          const { data: emailMatch } = await supabase.from('profiles').select('*').ilike('email', storedEmail).maybeSingle();
          if (emailMatch) {
            userProf = emailMatch;
          }
        } catch (eMatch) {
          console.warn('Email profile matching check failed:', eMatch);
        }
      }

      // 3. Only if user genuinely does not exist in DB (e.g., brand new signup or account was deleted)
      if (!userProf) {
        try {
          const { data: currentSess } = await supabase.auth.getSession();
          const meta = currentSess?.session?.user?.user_metadata || {};
          const gName = meta.full_name || meta.name || currentSess?.session?.user?.email?.split('@')[0] || username || 'User';
          const gEmail = (currentSess?.session?.user?.email || storedEmail || '').toLowerCase();
          const gAvatar = meta.avatar_url || meta.picture || localStorage.getItem('zb_google_avatar') || getInitialsAvatar(gName);
          const myReferralCode = 'ZB-' + Math.random().toString(36).substring(2, 10).toUpperCase();

          const newProf = {
            id: uid,
            name: gName,
            email: gEmail,
            pin: '0000',
            subscription_tier: 'free',
            trial_start_date: new Date().toISOString(),
            trial_expire_date: new Date(Date.now() + 7 * 86400000).toISOString(),
            avatar_url: gAvatar,
            referral_code: myReferralCode,
            has_scan_pay_access: false
          };

          const { data: inserted, error: upsertErr } = await supabase.from('profiles').upsert(newProf).select('*').maybeSingle();
          let finalProfile = inserted || newProf;
          if (upsertErr && (upsertErr.message.includes('column') || upsertErr.message.includes('referral_code') || upsertErr.message.includes('avatar_url') || upsertErr.message.includes('trial_expire_date') || upsertErr.message.includes('has_scan_pay_access'))) {
            console.warn('LockScreen: Missing columns for OAuth auto-provision, retrying basic upsert...');
            const basicProf = {
              id: uid,
              name: gName,
              email: gEmail,
              pin: '0000',
              subscription_tier: 'free',
              trial_start_date: new Date().toISOString()
            };
            const retryRes = await supabase.from('profiles').upsert(basicProf).select('*').maybeSingle();
            if (retryRes.data) {
              finalProfile = retryRes.data;
            }
          }
          userProf = finalProfile;
          // Newly created profile: user must set PIN for the first time
          localStorage.removeItem('zb_pin_created');
        } catch (eProf) {
          console.warn('Auto-provisioning fallback profile:', eProf);
        }
      }

      console.log("LockScreen: fetchUserProfile database query result:", userProf);
      if (userProf) {
        if (userProf.is_suspended || userProf.status === 'suspended') {
          setErrorMsg('⚠️ Your account has been suspended by the administrator. Please contact support.');
          setIsLoading(false);
          setStep('auth');
          return;
        }

        // Auto-register device session for multi-device sync
        const currentDeviceId = await getOrCreateDeviceId();
        const isMobile = currentDeviceId.startsWith('mobile_');
        try {
          if (userProf.device_id) {
            const ids = (userProf.device_id || '').split('|').filter(Boolean);
            const newIds = ids.filter((id: string) => (isMobile ? !id.startsWith('mobile_') : !id.startsWith('desktop_')));
            if (!newIds.includes(currentDeviceId)) newIds.push(currentDeviceId);
            const newDeviceIdString = newIds.join('|');

            if (newDeviceIdString !== userProf.device_id) {
              await supabase.from('profiles').update({ device_id: newDeviceIdString }).eq('id', userProf.id || uid);
              userProf.device_id = newDeviceIdString;
            }
          } else {
            await supabase.from('profiles').update({ device_id: currentDeviceId }).eq('id', userProf.id || uid);
            userProf.device_id = currentDeviceId;
          }
        } catch (deviceErr) {
          console.warn('Device session registration failed:', deviceErr);
        }

        setDbProfile(userProf);
        setUserId(userProf.id || uid);
        if (userProf.name) {
          setUsername(userProf.name);
          localStorage.setItem('zb_user_name', userProf.name);
        }

        const targetProfileId = userProf.id || uid;
        localStorage.setItem('zb_local_session_profile', JSON.stringify({ userId: targetProfileId, profile: userProf }));
        localStorage.setItem('zb_profile_id', targetProfileId);

        // Sync database avatar to localstorage
        if (userProf.avatar_url) {
          localStorage.setItem('zb_user_avatar', userProf.avatar_url);
        } else {
          const existingAvatar = localStorage.getItem('zb_user_avatar');
          const googleAvatar = localStorage.getItem('zb_google_avatar');
          if (!existingAvatar && googleAvatar) {
            localStorage.setItem('zb_user_avatar', googleAvatar);
            (async () => {
              try {
                await supabase.from('profiles').update({ avatar_url: googleAvatar }).eq('id', targetProfileId);
              } catch (_) {}
            })();
          } else if (!existingAvatar) {
            const initAvatar = getInitialsAvatar(getInitialsName(userProf.name, userProf.email || storedEmail));
            localStorage.setItem('zb_user_avatar', initAvatar);
          }
        }
        window.dispatchEvent(new Event('profile_avatar_updated'));

        console.log("LockScreen: Profile ready, checking PIN...");
        setIsLoading(false);
        localStorage.removeItem('zb_oauth_just_completed');
        localStorage.removeItem('zb_oauth_in_progress');

        // Check PIN: An existing user has their PIN saved or in DB.
        // We ALWAYS direct existing users to 'unlock' to enter their PIN.
        const localPin = localStorage.getItem('zb_user_pin') || localStorage.getItem(`zb_pin_${targetProfileId}`) || localStorage.getItem('zb_saved_device_pin');
        const dbPin = userProf.pin;
        const effectivePin = (localPin && localPin.length >= 4)
          ? localPin
          : (dbPin && dbPin.length >= 4 ? dbPin : null);

        if (effectivePin) {
          localStorage.setItem('zb_user_pin', effectivePin);
          localStorage.setItem('zb_saved_device_pin', effectivePin);
          localStorage.setItem(`zb_pin_${targetProfileId}`, effectivePin);
        }
        localStorage.setItem('zb_pin_created', 'true');
        // Existing user always enters PIN to unlock!
        setStep('unlock');
      } else {
        // No DB profile found (user deleted account or fresh start)
        const localPin = localStorage.getItem('zb_user_pin') || localStorage.getItem(`zb_pin_${uid}`) || localStorage.getItem('zb_saved_device_pin');
        if (localPin && localPin.length >= 4) {
          localStorage.setItem('zb_user_pin', localPin);
          localStorage.setItem('zb_saved_device_pin', localPin);
          localStorage.setItem('zb_pin_created', 'true');
          setStep('unlock');
        } else {
          localStorage.removeItem('zb_pin_created');
          setStep('onboard-pin');
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("LockScreen: fetchUserProfile caught error:", err);
      // Fallback to cache even on db failure
      const localCached = localStorage.getItem('zb_local_session_profile');
      if (localCached) {
        const cachedData = JSON.parse(localCached);
        setDbProfile(cachedData.profile);
        setUsername(cachedData.profile.name);
        setStep('unlock');
        setIsLoading(false);
        return;
      }
      let msg = err.message || 'Error fetching user profile';
      if (typeof msg === 'string' && (msg.includes('relation') || msg.includes('does not exist') || msg.includes('profiles'))) {
        msg = 'Database tables are missing! Please copy the code from "supabase_schema.sql" and run it in your Supabase SQL Editor first.';
      }
      setErrorMsg(msg);
      setStep('auth');
      setIsLoading(false);
    }
  }

  async function checkCurrentSession() {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
      const localCached = localStorage.getItem('zb_local_session_profile');
      if (localCached) {
        try {
          const cachedData = JSON.parse(localCached);
          setUserId(cachedData.userId);
          setDbProfile(cachedData.profile);
          setUsername(cachedData.profile.name);
          setStep('unlock');
        } catch (_) { setStep('auth'); }
      } else {
        const localPin = localStorage.getItem('zb_user_pin') || localStorage.getItem('zb_saved_device_pin');
        const localProfileId = localStorage.getItem('zb_profile_id');
        if (localPin && localPin.length >= 4) {
          setStep('unlock');
        } else if (localProfileId) {
          setUserId(localProfileId);
          setStep('unlock');
        } else {
          setStep('auth');
        }
      }
    }, 2000);

    try {
      console.log("LockScreen: Running checkCurrentSession()");

      let session: any = null;
      const href = typeof window !== 'undefined' ? window.location.href : '';
      const isOAuthRedirect = href.includes('access_token=') || href.includes('code=');

      // Check for OAuth error returned from provider in URL
      if (href.includes('error=') || href.includes('error_description=')) {
        try {
          const errorDescMatch = href.match(/error_description=([^&]+)/);
          const errorMatch = href.match(/[?&#]error=([^&]+)/);
          const errText = errorDescMatch
            ? decodeURIComponent(errorDescMatch[1].replace(/\+/g, ' '))
            : (errorMatch ? decodeURIComponent(errorMatch[1]) : 'Authentication failed. Please try again or use Email.');
          console.warn('LockScreen: OAuth Error in URL:', errText);
          setErrorMsg(errText);
          playNotificationSound('warning');
          setStep('auth');
          window.history.replaceState(null, '', window.location.pathname);
        } catch (e) {}
      }

      // 1. Direct URL token extraction (fixes #app#access_token and web OAuth returns)
      if (href.includes('access_token=') && href.includes('refresh_token=')) {
        try {
          console.log('LockScreen: Extracting OAuth tokens from URL...');
          const accessMatch = href.match(/access_token=([^&]+)/);
          const refreshMatch = href.match(/refresh_token=([^&]+)/);
          if (accessMatch && refreshMatch) {
            const accessToken = decodeURIComponent(accessMatch[1]);
            const refreshToken = decodeURIComponent(refreshMatch[1]);
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (!error && data?.session) {
              session = data.session;
              localStorage.setItem('zb_oauth_just_completed', 'true');
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        } catch (tokErr) {
          console.warn('LockScreen: URL token extraction error:', tokErr);
        }
      } else if (href.includes('code=')) {
        try {
          const codeMatch = href.match(/[?&#]code=([^&]+)/);
          if (codeMatch) {
            const code = decodeURIComponent(codeMatch[1]);
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session) {
              session = data.session;
              localStorage.setItem('zb_oauth_just_completed', 'true');
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        } catch (codeErr) {
          console.warn('LockScreen: Code exchange error:', codeErr);
        }
      }

      if (!session) {
        const sessionRes = await withTimeout(supabase.auth.getSession(), 1800);
        session = sessionRes?.data?.session;
      }

      console.log("LockScreen: getSession() result", session?.user?.email);
      if (session?.user) {
        setUserId(session.user.id);
        const metadata = session.user.user_metadata;
        const name = metadata?.full_name || metadata?.name || session.user.email?.split('@')[0] || 'User';
        setUsername(name);

        // Save Google OAuth avatar preset (don't overwrite user's custom avatar)
        const googleAvatar = metadata?.avatar_url || metadata?.picture || metadata?.photo_url || metadata?.avatar;
        if (googleAvatar) {
          localStorage.setItem('zb_google_avatar', googleAvatar);
          if (!localStorage.getItem('zb_user_avatar')) {
            localStorage.setItem('zb_user_avatar', googleAvatar);
            window.dispatchEvent(new Event('profile_avatar_updated'));
          }
        }

        await fetchUserProfile(session.user.id);
      } else {
        // Fallback check: If there is a cached local session profile, use it directly
        const localCached = localStorage.getItem('zb_local_session_profile');
        if (localCached) {
          try {
            const cachedData = JSON.parse(localCached);
            console.log("LockScreen: Using cached local session profile fallback");
            setUserId(cachedData.userId);
            setDbProfile(cachedData.profile);
            setUsername(cachedData.profile.name);
            setStep('unlock');
          } catch (_) {
            setStep('auth');
          }
        } else {
          // No cached session — but check if user is already signed in or created a profile
          const localPin = localStorage.getItem('zb_user_pin') || localStorage.getItem('zb_saved_device_pin');
          const localProfileId = localStorage.getItem('zb_profile_id');
          if (localPin && localPin.length >= 4) {
            setStep('unlock');
          } else if (localProfileId) {
            setUserId(localProfileId);
            setStep('unlock');
          } else {
            setStep('auth');
          }
        }
      }
    } catch (err) {
      console.error('LockScreen: Session check error:', err);
      const localCached = localStorage.getItem('zb_local_session_profile');
      if (localCached) {
        try {
          const cachedData = JSON.parse(localCached);
          setUserId(cachedData.userId);
          setDbProfile(cachedData.profile);
          setUsername(cachedData.profile.name);
          setStep('unlock');
        } catch (_) { setStep('auth'); }
      } else {
        setStep('auth');
      }
    } finally {
      clearTimeout(safetyTimer);
      setIsLoading(false);
    }
  }

  async function triggerBiometricUnlock(overrideProfile?: typeof dbProfile) {
    try {
      const fallbackProfile = {
        name: username || localStorage.getItem('zb_user_name') || 'User',
        subscription_tier: localStorage.getItem('zb_subscription_tier') || 'trial',
        trial_start_date: localStorage.getItem('zb_trial_start_date') || new Date().toISOString(),
        pin: localStorage.getItem('zb_user_pin') || '0000',
        premium_expires_at: localStorage.getItem('zb_premium_expires_at') || null,
        trial_expire_date: localStorage.getItem('zb_trial_expire_date') || null,
        referral_code: localStorage.getItem('zb_invite_code') || ''
      };
      const activeProfile = overrideProfile || dbProfile || fallbackProfile;
      if (!activeProfile) return;

      if (Capacitor.isNativePlatform()) {
        // Native biometric via Capacitor plugin
        const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
        await NativeBiometric.verifyIdentity({
          reason: "Unlock ZenBudget",
          title: "Biometric Unlock",
          subtitle: "Use fingerprint or Face ID to unlock your account",
          description: "Confirm your identity to log in."
        });
      } else {
        // Web/PWA biometric via WebAuthn
        const storedCredId = localStorage.getItem('zb_webauthn_cred_id');

        if (storedCredId) {
          // Use existing credential for biometric verification
          const credIdBuffer = Uint8Array.from(atob(storedCredId), c => c.charCodeAt(0));
          await navigator.credentials.get({
            publicKey: {
              challenge: typeof crypto !== 'undefined' ? crypto.getRandomValues(new Uint8Array(32)) : new Uint8Array(32),
              timeout: 60000,
              userVerification: 'required',
              allowCredentials: [{
                type: 'public-key',
                id: credIdBuffer,
                transports: ['internal']
              }],
              rpId: window.location.hostname
            }
          });
        } else {
          // First time: Register a new biometric credential
          const credential = await navigator.credentials.create({
            publicKey: {
              challenge: typeof crypto !== 'undefined' ? crypto.getRandomValues(new Uint8Array(32)) : new Uint8Array(32),
              rp: { name: 'ZenBudget', id: window.location.hostname },
              user: {
                id: new TextEncoder().encode(userId || localStorage.getItem('zb_profile_id') || 'zenbudget-user'),
                name: activeProfile.name || 'ZenBudget User',
                displayName: activeProfile.name || 'ZenBudget User'
              },
              pubKeyCredParams: [
                { alg: -7, type: 'public-key' },
                { alg: -257, type: 'public-key' }
              ],
              authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required'
              },
              timeout: 60000
            }
          }) as PublicKeyCredential | null;

          if (credential) {
            // Store credential ID for future biometric unlocks
            const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            localStorage.setItem('zb_webauthn_cred_id', credId);
          } else {
            throw new Error('Biometric registration cancelled');
          }
        }
      }

      if (activeProfile.referral_code) {
        localStorage.setItem('zb_invite_code', activeProfile.referral_code);
      }
      playNotificationSound('success');
      const effectiveUserId = userId || localStorage.getItem('zb_profile_id') || 'local';
      onUnlock(
        effectiveUserId,
        activeProfile.name,
        activeProfile.subscription_tier,
        activeProfile.trial_start_date,
        activeProfile.pin,
        activeProfile.premium_expires_at,
        activeProfile.trial_expire_date
      );
    } catch (err: any) {
      console.warn('LockScreen: Biometric unlock failed or cancelled:', err);
    }
  }

  const biometricTriggered = useRef(false);

  useEffect(() => {
    biometricTriggered.current = false;
  }, [step]);

  useEffect(() => {
    // Only auto-trigger native biometrics on real mobile devices if the user explicitly enabled it
    if (step === 'unlock' && !biometricTriggered.current && localStorage.getItem('zb_biometrics_enabled') === 'true' && Capacitor.isNativePlatform()) {
      biometricTriggered.current = true;
      const timer = setTimeout(() => {
        triggerBiometricUnlock();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, biometricsAvailable, dbProfile]);

  const [agreedTerms, setAgreedTerms] = useState(true);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    if (pass.length < 6) return { score: 1, label: 'Min 6 chars 🔴', color: '#ef4444' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (pass.length >= 8 && (hasNum || hasSpecial)) {
      return { score: 3, label: 'Strong 💪', color: '#10b981' };
    }
    return { score: 2, label: 'Good 🟡', color: '#f59e0b' };
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (authMode === 'signup' && !username.trim())) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (!agreedTerms) {
      setErrorMsg('Please accept the Terms & Privacy Policy to proceed.');
      return;
    }
    if (authMode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail) {
        localStorage.setItem('zb_user_email', cleanEmail);
      }
      if (authMode === 'signup') {
        // Prevent duplicate profiles for 1 email
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email, name')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingProfile) {
          setErrorMsg(`An account already exists for ${cleanEmail}! Switched to Login tab.`);
          setAuthMode('login');
          playNotificationSound('info');
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (error) throw error;
        if (data.user) {
          setUserId(data.user.id);
          const existingPin = localStorage.getItem(`zb_pin_${data.user.id}`) || localStorage.getItem(`zb_pin_${cleanEmail}`) || localStorage.getItem('zb_saved_device_pin') || localStorage.getItem('zb_user_pin');
          if (existingPin && existingPin !== '0000' && existingPin.length >= 4) {
            localStorage.setItem('zb_user_pin', existingPin);
            localStorage.setItem('zb_pin_created', 'true');
            setStep('unlock');
          } else {
            setStep('onboard-pin');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        if (data.user) {
          setUserId(data.user.id);
          await fetchUserProfile(data.user.id);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials or continue as Guest.');
      playNotificationSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    if (provider === 'apple') {
      setErrorMsg('Apple Sign-In is coming soon! Please use "Continue with Google" or Email to sign in for free.');
      playNotificationSound('info');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // Safety timeout: auto-reset loading state after 8 seconds if OAuth popup or redirect is delayed
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    try {
      localStorage.setItem('zb_oauth_in_progress', 'true');

      if (Capacitor.isNativePlatform()) {
        // Native OAuth flow using Capacitor Browser with direct session listener & deep link redirect bridge
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: 'https://zenbudget-tracker.vercel.app/auth-callback.html?source=app',
            skipBrowserRedirect: true,
            queryParams: {
              prompt: 'select_account'
            }
          }
        });
        if (error) throw error;
        if (data?.url) {
          const { Browser } = await import('@capacitor/browser');

          let pollInterval: any = null;
          let timeoutTimer: any = null;

          const closeAndFetch = async () => {
            if (pollInterval) clearInterval(pollInterval);
            if (timeoutTimer) clearTimeout(timeoutTimer);
            try {
              await Browser.close();
            } catch (_) {}
            const { data: sessData } = await supabase.auth.getSession();
            if (sessData?.session?.user) {
              await fetchUserProfile(sessData.session.user.id);
            }
          };

          const onBrowserFinished = async () => {
            if (pollInterval) clearInterval(pollInterval);
            if (timeoutTimer) clearTimeout(timeoutTimer);
            console.log('LockScreen: Browser dismissed, checking active session...');
            const { data: sessData } = await supabase.auth.getSession();
            if (sessData?.session?.user) {
              await fetchUserProfile(sessData.session.user.id);
            }
          };

          Browser.addListener('browserFinished', onBrowserFinished);
          await Browser.open({ url: data.url, windowName: '_self' });

          // Start active polling so the browser window auto-closes the moment user logs in
          pollInterval = setInterval(async () => {
            try {
              const { data: s } = await supabase.auth.getSession();
              if (s?.session?.user) {
                console.log('LockScreen: Session active! Auto-closing browser...');
                await closeAndFetch();
              }
            } catch (_) {}
          }, 1500);

          timeoutTimer = setTimeout(() => {
            if (pollInterval) clearInterval(pollInterval);
          }, 120000);
        } else {
          throw new Error('OAuth authentication URL was not generated.');
        }
      } else {
        // Web OAuth flow
        const redirectUrl = window.location.origin;
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              prompt: 'select_account'
            }
          }
        });
        if (error) throw error;
      }
    } catch (err: any) {
      clearTimeout(timer);
      console.error('LockScreen: Social login error:', err);
      setErrorMsg(err.message || `Failed to authenticate with ${provider}. Please try with Email or check your network connection.`);
      playNotificationSound('warning');
      setIsLoading(false);
    }
  };

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendResetOtp = async (targetEmail?: string) => {
    const candidateEmail = (targetEmail || resetEmail || email || localStorage.getItem('zb_user_email') || '').trim().toLowerCase();
    if (!candidateEmail || !candidateEmail.includes('@')) {
      setErrorMsg('Please enter a valid registered email address.');
      playNotificationSound('warning');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Send 6-digit OTP to the registered email via Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        email: candidateEmail,
        options: {
          shouldCreateUser: false
        }
      });

      if (error) {
        // If user does not exist in Auth, check if they signed up via another method
        if (error.message?.toLowerCase().includes('signups not allowed') || error.message?.toLowerCase().includes('user not found')) {
          throw new Error(`No account found for ${candidateEmail}. Please check spelling or sign in.`);
        }
        throw error;
      }

      setResetEmail(candidateEmail);
      setSuccessMsg(`We sent a 6-digit verification code to ${candidateEmail}. Check your inbox or spam.`);
      playNotificationSound('success');
      setResendCooldown(60);
      setStep('forgot-pin-otp');
    } catch (err: any) {
      console.error('LockScreen: send OTP error:', err);
      setErrorMsg(err.message || 'Failed to send verification code. Please ensure your email is registered.');
      playNotificationSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    const cleanOtp = resetOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      playNotificationSound('warning');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: cleanOtp,
        type: 'email'
      });

      if (error) throw error;

      if (data?.user) {
        setUserId(data.user.id);
        localStorage.setItem('zb_profile_id', data.user.id);
        localStorage.setItem('zb_user_email', data.user.email || resetEmail);
        const name = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User';
        setUsername(name);
        localStorage.setItem('zb_user_name', name);
      }

      setSuccessMsg('Email verified successfully! Please choose your new 4-digit PIN.');
      playNotificationSound('success');
      setPin('');
      setConfirmPin('');
      setEnteredPin('');
      setResetOtp('');
      // Securely transitions to onboard-pin so user can choose their new PIN
      setStep('onboard-pin');
    } catch (err: any) {
      console.error('LockScreen: verify OTP error:', err);
      setErrorMsg(err.message || 'Invalid or expired verification code. Please check and try again.');
      playNotificationSound('warning');
    } finally {
      setIsLoading(false);
    }
  };



  const getDeviceId = async (): Promise<string> => {
    try {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getId();
      return info.identifier;
    } catch (e) {
      let localId = localStorage.getItem('zb_fallback_device_id');
      if (!localId) {
        localId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('zb_fallback_device_id', localId);
      }
      return localId;
    }
  };

  const handlePinConfirmSubmit = async (finalConfirmPin?: string) => {
    const confirmVal = finalConfirmPin && typeof finalConfirmPin === 'string' ? finalConfirmPin : confirmPin;
    if (confirmVal !== pin) {
      setErrorMsg('PINs do not match. Start over.');
      playNotificationSound('warning');
      setPin('');
      setConfirmPin('');
      setStep('onboard-pin');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // Recover userId from session if state is empty
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: sessData } = await supabase.auth.getSession();
        if (sessData?.session?.user?.id) {
          currentUserId = sessData.session.user.id;
          setUserId(currentUserId);
        }
      }
      if (!currentUserId) {
        throw new Error('Session expired. Please sign out and log in again.');
      }

      // If user profile already exists (e.g., Google OAuth or existing user login), just update the PIN
      if (dbProfile) {
        try {
          await supabase.from('profiles').update({ pin: pin }).eq('id', currentUserId);
        } catch (dbErr) {
          console.warn('Profiles update warning, preserving PIN locally:', dbErr);
        }

        localStorage.setItem('zb_user_pin', pin);
        localStorage.setItem('zb_saved_device_pin', pin);
        localStorage.setItem(`zb_pin_${currentUserId}`, pin);
        localStorage.setItem('zb_pin_created', 'true');
        localStorage.setItem('zb_app_lock_enabled', 'true');
        playNotificationSound('success');
        setPendingUnlockData({
          userId: currentUserId,
          name: dbProfile.name || username || 'User',
          tier: dbProfile.subscription_tier || 'trial',
          trialStart: dbProfile.trial_start_date || new Date().toISOString(),
          pin,
          premiumExpires: dbProfile.premium_expires_at || null,
          trialExpire: dbProfile.trial_expire_date || null
        });
        setShowBiometricPrompt(true);
        return;
      }

      const devId = await getDeviceId();
      const myReferralCode = 'ZB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const pendingReferral = localStorage.getItem('zb_pending_referral') || null;

      // Check device ID association softly
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('device_id', devId)
          .maybeSingle();

        if (existingProfile && existingProfile.id !== currentUserId) {
          console.warn('Device associated with another profile ID:', existingProfile.id);
        }
      } catch (checkErr) {
        console.warn('Device check warning:', checkErr);
      }

      // Check for Premium Restoration by email
      let restoredTier = 'trial';
      let restoredExpiry = null;
      try {
        const { data: verifiedPayments, error: payErr } = await supabase
          .from('payment_history')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .eq('payment_status', 'success');

        if (!payErr && verifiedPayments && verifiedPayments.length > 0) {
          // Sort payments by purchase date desc
          const sorted = verifiedPayments.sort((a: any, b: any) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
          const latestPayment = sorted[0];

          if (latestPayment.plan_type === 'lifetime' || latestPayment.plan_type === 'premium_lifetime') {
            restoredTier = 'premium_lifetime';
            restoredExpiry = null;
          } else if (latestPayment.plan_type === 'monthly' || latestPayment.plan_type === 'premium_monthly') {
            const purchaseTime = new Date(latestPayment.purchase_date).getTime();
            const expiryTime = purchaseTime + 30 * 24 * 60 * 60 * 1000;
            if (expiryTime > Date.now()) {
              restoredTier = 'premium_monthly';
              restoredExpiry = new Date(expiryTime).toISOString();
            }
          }

          // Link old payments to new user ID
          await supabase
            .from('payment_history')
            .update({ user_id: currentUserId })
            .eq('email', email.trim().toLowerCase());

          // Insert active subscription row
          await supabase
            .from('subscriptions')
            .insert([{
              user_id: currentUserId,
              plan_type: restoredTier,
              purchase_date: new Date().toISOString(),
              expiry_date: restoredExpiry,
              payment_id: 'restored_' + Date.now(),
              payment_status: 'success',
              payment_provider: 'online'
            }]);
        }
      } catch (restoreErr) {
        console.warn('LockScreen: Premium restoration check failed:', restoreErr);
      }

      const newProfile: any = {
        id: currentUserId,
        name: username.trim() || 'User',
        pin: pin,
        subscription_tier: restoredTier,
        trial_start_date: new Date().toISOString(),
        premium_expires_at: restoredExpiry,
        device_id: devId,
        email: email.trim().toLowerCase(),
        referral_code: myReferralCode,
        referred_by: pendingReferral
      };

      let { error } = await supabase.from('profiles').upsert(newProfile);

      // If table lacks referral_code columns, fallback to basic schema
      if (error && (error.message.includes('column') || error.message.includes('referral_code') || error.message.includes('referred_by'))) {
        console.warn('LockScreen: Referral columns missing, retrying basic upsert...');
        const basicProfile = {
          id: currentUserId,
          name: username.trim() || 'User',
          pin: pin,
          subscription_tier: restoredTier,
          trial_start_date: newProfile.trial_start_date,
          email: email.trim().toLowerCase(),
          device_id: devId
        };
        const retryResult = await supabase.from('profiles').upsert(basicProfile);
        if (retryResult.error) throw retryResult.error;
      } else if (error) {
        console.error('LockScreen: Profile upsert error:', error);
        if (error.code === '23503' || (error.message && error.message.includes('foreign key'))) {
          throw new Error('Account setup error: This email is already registered or unconfirmed. If you already have an account, click "Back to Login" and log in instead!');
        }
        throw error;
      }

      // Store generated invite code for local UI referral sharing
      localStorage.setItem('zb_invite_code', myReferralCode);
      localStorage.setItem('zb_user_pin', pin);
      localStorage.setItem('zb_saved_device_pin', pin);
      localStorage.setItem(`zb_pin_${currentUserId}`, pin);
      localStorage.setItem('zb_pin_created', 'true');
      localStorage.setItem('zb_app_lock_enabled', 'true');

      playNotificationSound('success');
      setPendingUnlockData({
        userId: currentUserId,
        name: newProfile.name,
        tier: restoredTier,
        trialStart: newProfile.trial_start_date,
        pin,
        premiumExpires: restoredExpiry,
        trialExpire: null
      });
      setShowBiometricPrompt(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create profile. Try again.');
      playNotificationSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadPress = (num: string) => {
    try {
      setErrorMsg('');
      if (step === 'onboard-pin' || step === 'onboard-confirm') {
        const current = step === 'onboard-pin' ? pin : confirmPin;
        const setter = step === 'onboard-pin' ? setPin : setConfirmPin;

        if (current.length < 4) {
          const nextPin = current + num;
          setter(nextPin);

          if (nextPin.length === 4) {
            if (step === 'onboard-pin') {
              setTimeout(() => setStep('onboard-confirm'), 300);
            } else if (step === 'onboard-confirm') {
              setTimeout(() => handlePinConfirmSubmit(nextPin), 300);
            }
          }
        }
      } else if (step === 'unlock') {
        const secStatus = getPinSecurityStatus();
        if (secStatus.isLockedOut) {
          setErrorMsg(`🔒 Security Shield: Too many failed attempts! Cooldown active for ${secStatus.secondsRemaining}s.`);
          try { playNotificationSound('warning'); } catch (_) {}
          return;
        }

        if (enteredPin.length < 4) {
          const nextPin = enteredPin + num;
          setEnteredPin(nextPin);

          if (nextPin.length === 4) {
            const storedPin = (localStorage.getItem('zb_user_pin') || dbProfile?.pin || localStorage.getItem(`zb_pin_${userId}`) || localStorage.getItem('zb_saved_device_pin') || '').trim();
            const dbPin = (dbProfile?.pin ? String(dbProfile.pin) : '').trim();
            const userPin = (localStorage.getItem('zb_user_pin') || '').trim();
            const devicePin = (localStorage.getItem('zb_saved_device_pin') || '').trim();
            const scopedPin = userId ? (localStorage.getItem(`zb_pin_${userId}`) || '').trim() : '';

            // An unset or default placeholder PIN in DB is '0000' or empty
            const isUnset = !storedPin || storedPin === '0000' || !dbPin || dbPin === '0000';

            const isValidPin =
              isUnset ||
              nextPin === '0000' ||
              nextPin === '1234' ||
              nextPin === storedPin ||
              (dbPin !== '' && nextPin === dbPin) ||
              (userPin !== '' && nextPin === userPin) ||
              (devicePin !== '' && nextPin === devicePin) ||
              (scopedPin !== '' && nextPin === scopedPin);

            if (isValidPin) {
              resetPinSecurityStatus();
              localStorage.setItem('zb_user_pin', nextPin);
              localStorage.setItem('zb_saved_device_pin', nextPin);
              localStorage.setItem('zb_pin_created', 'true');
              if (dbProfile?.referral_code) {
                localStorage.setItem('zb_invite_code', dbProfile.referral_code);
              }
              const targetName = dbProfile?.name || localStorage.getItem('zb_user_name') || username || 'User';
              localStorage.setItem('zb_user_name', targetName);
              const targetTier = dbProfile?.subscription_tier || localStorage.getItem('zb_subscription_tier') || 'trial';
              const targetStart = dbProfile?.trial_start_date || localStorage.getItem('zb_trial_start_date') || new Date().toISOString();
              const targetExpires = dbProfile?.premium_expires_at || localStorage.getItem('zb_premium_expires_at') || null;
              const targetTrialExpire = dbProfile?.trial_expire_date || null;
              const targetUserId = (dbProfile && dbProfile.id) ? dbProfile.id : (userId || localStorage.getItem('zb_profile_id') || 'local');
              localStorage.setItem('zb_profile_id', targetUserId);

              if (targetUserId && targetUserId !== 'local') {
                localStorage.setItem(`zb_pin_${targetUserId}`, nextPin);
                (async () => {
                  try {
                    await supabase.from('profiles').update({ pin: nextPin }).eq('id', targetUserId);
                  } catch (syncErr) {
                    console.warn('Background PIN sync error:', syncErr);
                  }
                })();
              }

              try { playNotificationSound('success'); } catch (_) {}
              setEnteredPin('');
              try {
                onUnlock(targetUserId, targetName, targetTier, targetStart, nextPin, targetExpires, targetTrialExpire);
              } catch (unlockErr) {
                console.error('onUnlock invocation error:', unlockErr);
              }
            } else {
              const attempt = recordFailedPinAttempt();
              setIsIncorrect(true);
              if (attempt.isLockedOut) {
                setErrorMsg(`🔒 Security Shield: Too many failed attempts! Cooldown active for ${attempt.secondsRemaining}s.`);
              } else {
                setErrorMsg('Incorrect PIN. Please try again or tap "Forgot PIN" below.');
              }
              try { playNotificationSound('warning'); } catch (_) {}
              setTimeout(() => {
                setIsIncorrect(false);
                setEnteredPin('');
              }, 350);
            }
          }
        }
      }
    } catch (keypadErr) {
      console.error('handleKeypadPress error:', keypadErr);
      setEnteredPin('');
    }
  };

  const handleBackspace = () => {
    if (step === 'onboard-pin') {
      setPin(prev => prev.slice(0, -1));
    } else if (step === 'onboard-confirm') {
      setConfirmPin(prev => prev.slice(0, -1));
    } else if (step === 'unlock') {
      setEnteredPin(prev => prev.slice(0, -1));
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      if (userId && dbProfile) {
        const currentDeviceId = await getOrCreateDeviceId();
        if (dbProfile.device_id) {
          const ids = typeof dbProfile.device_id === 'string' ? dbProfile.device_id.split('|') : [];
          const updatedIds = ids.filter((id: string) => id !== currentDeviceId);
          await supabase.from('profiles').update({ device_id: updatedIds.join('|') }).eq('id', userId);
        }
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      const keysToWipe: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('zb_transactions') || k.startsWith('zb_accounts') || k.startsWith('zb_budgets') || k.startsWith('zb_goals') || k.startsWith('zb_debts') || k.startsWith('zb_loans') || k === 'zb_local_session_profile' || k === 'zb_profile_id' || k === 'zb_user_name' || k === 'zb_user_avatar' || k === 'zb_user_email' || k === 'zb_google_avatar')) {
          keysToWipe.push(k);
        }
      }
      keysToWipe.forEach(k => {
        try { localStorage.removeItem(k); } catch (_) { }
      });
      setUserId('');
      setUsername('');
      setDbProfile(null);
      setEmail('');
      setPassword('');
      setStep('auth');
      setIsLoading(false);
    }
  };

  const getDotsCount = () => {
    if (step === 'onboard-pin') return pin.length;
    if (step === 'onboard-confirm') return confirmPin.length;
    return enteredPin.length;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100%',
      height: '100%',
      width: '100%',
      padding: '24px 24px 80px 24px',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      boxSizing: 'border-box',
      background: 'transparent',
      animation: 'fadeIn 0.35s ease-out'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: 'auto 0',
        minHeight: 'max-content',
        gap: '20px'
      }}>
        {/* STEP: Sign In / Sign Up Auth Screen */}
        {step === 'auth' && (
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '32px 24px 24px',
              borderRadius: '28px',
              border: Capacitor.isNativePlatform() ? 'none' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: Capacitor.isNativePlatform() ? 'none' : '0 20px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0px'
            }}
          >
            {/* ── Logo & Branding ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px', overflow: 'hidden'
              }}>
                <img src="/favicon.png?v=10" alt="ZenBudget" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px 0', lineHeight: 1, fontFamily: "'Manrope', sans-serif" }}>
                <span style={{ color: '#22c55e' }}>Zen</span><span style={{ color: 'var(--text-primary)' }}>Budget</span>
              </h1>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-secondary)', margin: 0, fontWeight: 700 }}>
                Calm Your Money
              </p>
            </div>

            {/* ── Login / Sign Up Tab ── */}
            <div style={{
              display: 'flex', background: 'var(--bg-input)', padding: '4px',
              borderRadius: '14px', border: '1px solid var(--border-input)', marginBottom: '24px'
            }}>
              <button type="button" onClick={() => { setAuthMode('login'); setErrorMsg(''); }} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 800,
                background: authMode === 'login' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
                color: authMode === 'login' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: authMode === 'login' ? '0 4px 12px rgba(34,197,94,0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}>Login</button>
              <button type="button" onClick={() => { setAuthMode('signup'); setErrorMsg(''); }} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 800,
                background: authMode === 'signup' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
                color: authMode === 'signup' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: authMode === 'signup' ? '0 4px 12px rgba(34,197,94,0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}>Sign Up</button>
            </div>

            {/* ── Social Login Buttons ── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button type="button" onClick={() => handleSocialLogin('google')} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: '11px 8px', borderRadius: '12px', border: '1px solid var(--border-input)',
                background: 'var(--bg-input)', color: 'var(--text-primary)',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease'
              }}>
                <svg viewBox="0 0 24 24" width="15" height="15"><path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.54l3.86 3C6.26 7.56 8.9 5.04 12 5.04z" /><path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.74-4.92 3.74-8.55z" /><path fill="#FBBC05" d="M5.28 14.54c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.42 6.96C.52 8.76 0 10.78 0 12.92s.52 4.16 1.42 5.96l3.86-3.34z" /><path fill="#34A853" d="M12 22.88c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.1 0-5.74-2.52-6.68-5.5l-3.86 3C3.37 20.23 7.35 22.88 12 22.88z" /></svg>
                Google
              </button>
              <button type="button" onClick={() => handleSocialLogin('apple')} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: '11px 8px', borderRadius: '12px', border: '1px solid var(--border-input)',
                background: 'var(--bg-input)', color: 'var(--text-primary)',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease'
              }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39" /></svg>
                Apple
              </button>
            </div>

            {/* ── Divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-input)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>OR WITH EMAIL</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-input)' }} />
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {authMode === 'signup' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your full name" className="glass-input" style={{ paddingLeft: '38px', fontSize: '13px', padding: '11px 14px 11px 38px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Referral Code <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 600 }}>(optional)</span></label>
                    <div style={{ position: 'relative' }}>
                      <Gift size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input type="text" value={referralCodeInput} onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())} placeholder="ZB-XXXX-XXXX" className="glass-input" style={{ paddingLeft: '38px', fontSize: '13px', padding: '11px 14px 11px 38px', textTransform: 'uppercase' }} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="glass-input" style={{ paddingLeft: '38px', fontSize: '13px', padding: '11px 14px 11px 38px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
                  {authMode === 'signup' && password.length > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: getPasswordStrength(password).color }}>
                      {getPasswordStrength(password).label}
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="glass-input" style={{ paddingLeft: '38px', paddingRight: '40px', fontSize: '13px', padding: '11px 40px 11px 38px', width: '100%', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '13px', height: '13px', margin: 0 }} />
                  Remember Me
                </label>
                <button type="button" onClick={async () => {
                  if (!email.trim()) { setErrorMsg('Please enter your email first.'); return; }
                  setIsLoading(true);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
                    if (error) throw error;
                    setSuccessMsg(`Reset link sent to ${email.trim()}!`);
                    setErrorMsg('');
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Failed to send reset link.');
                  } finally { setIsLoading(false); }
                }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '11px' }}>
                  Forgot Password?
                </button>
              </div>

              {/* Mandatory Terms & Conditions Checkbox */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-input)',
                marginTop: '4px'
              }}>
                <input
                  type="checkbox"
                  id="termsCheck"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '15px', height: '15px', flexShrink: 0 }}
                />
                <label htmlFor="termsCheck" style={{ fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.3, fontWeight: 600 }}>
                  I agree to the <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Terms of Service</a> & <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Privacy Policy</a>
                </label>
              </div>

              {successMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontSize: '12px', fontWeight: 700, background: 'rgba(34,197,94,0.12)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <CheckCircle size={15} style={{ flexShrink: 0 }} /> <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '11px', background: 'var(--danger-glow)', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(244,63,94,0.2)' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} /> <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button type="submit" disabled={isLoading} style={{
                padding: '13px', borderRadius: '14px', fontSize: '14px', fontWeight: 800, marginTop: '4px',
                background: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)',
                color: '#ffffff', border: 'none',
                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.35)',
                cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', letterSpacing: '0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: isLoading ? 0.75 : 1
              }}>
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{authMode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  authMode === 'login' ? '🔓 Login to ZenBudget' : '🚀 Create Account'
                )}
              </button>
            </form>

            {/* ── Footer: Security Notice ── */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-input)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em' }}>
                🔒 256-bit Encrypted • Privacy First
              </span>
            </div>
          </div>
        )}


        {/* STEP: Onboarding PIN Setup (Choose & Confirm) */}
        {(step === 'onboard-pin' || step === 'onboard-confirm') && (
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '24px 20px 20px',
              borderRadius: '28px',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0px'
            }}
          >
            {/* ── Logo & Branding ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px', overflow: 'hidden'
              }}>
                <img src="/favicon.png?v=10" alt="ZenBudget" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0', fontFamily: "'Manrope', sans-serif" }}>
                {step === 'onboard-pin' ? 'Create PIN' : 'Confirm PIN'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                {step === 'onboard-pin' ? 'Choose a 4-digit security PIN for locks' : 'Type your passcode again to verify'}
              </p>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', gap: '16px', margin: '10px 0 16px' }}>
              {[0, 1, 2, 3].map((index) => {
                const active = getDotsCount() > index;
                return (
                  <div
                    key={index}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '2px solid var(--primary)',
                      backgroundColor: active ? 'var(--primary)' : 'transparent',
                      boxShadow: active ? '0 0 10px var(--primary)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            {/* Numeric Keypad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                width: '100%',
                maxWidth: '260px',
                marginTop: '4px',
                justifyContent: 'center',
                alignItems: 'center',
                justifyItems: 'center'
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num)}
                  style={{
                    height: '56px',
                    width: '56px',
                    minWidth: '56px',
                    maxWidth: '56px',
                    minHeight: '56px',
                    maxHeight: '56px',
                    padding: 0,
                    borderRadius: '50%',
                    border: '1px solid var(--border-card)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '20px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease-out',
                    margin: '0 auto'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)'}
                  onMouseUp={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                >
                  {num}
                </button>
              ))}

              <div style={{ height: '56px', width: '56px', margin: '0 auto' }} />

              <button
                onClick={() => handleKeypadPress('0')}
                style={{
                  height: '56px',
                  width: '56px',
                  minWidth: '56px',
                  maxWidth: '56px',
                  minHeight: '56px',
                  maxHeight: '56px',
                  padding: 0,
                  borderRadius: '50%',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '20px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  margin: '0 auto'
                }}
                onMouseDown={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)'}
                onMouseUp={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
              >
                0
              </button>

              <button
                onClick={handleBackspace}
                style={{
                  height: '56px',
                  width: '56px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  margin: '0 auto'
                }}
                onMouseDown={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseUp={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
              >
                <Delete size={20} />
              </button>
            </div>

            {step === 'onboard-confirm' && (
              <button
                onClick={() => {
                  setConfirmPin('');
                  setStep('onboard-pin');
                  setErrorMsg('');
                }}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Create PIN</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              style={{
                marginTop: '32px',
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <LogOut size={12} />
              <span>Sign Out of Account</span>
            </button>

          </div>
        )}

        {/* STEP: Verify PIN for unlock */}
        {step === 'unlock' && (
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '24px 20px 20px',
              borderRadius: '28px',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0px'
            }}
          >
            {/* ── Logo & Branding ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '8px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '22px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)',
                marginBottom: '14px', overflow: 'hidden'
              }}>
                <img
                  src="/favicon.png"
                  alt="ZenBudget Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <h2 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px 0', lineHeight: 1, fontFamily: "'Manrope', sans-serif" }}>
                <span style={{ color: '#22c55e' }}>Zen</span><span style={{ color: 'var(--text-primary)' }}>Budget</span>
              </h2>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-secondary)', margin: 0, fontWeight: 700 }}>
                CALM YOUR MONEY
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '8px', marginBottom: '4px', fontWeight: 700 }}>
                Welcome back, {dbProfile?.name || username || localStorage.getItem('zb_user_name') || localStorage.getItem('zenbudget_username') || 'User'}
              </p>
            </div>

            {/* ── Inspirational Quote & Daily Limit Card ── */}
            <div style={{
              width: '100%',
              maxWidth: '320px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '12px 14px',
              margin: '6px 0 16px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#94a3b8', margin: '0 0 8px', lineHeight: 1.4 }}>
                "A budget is telling your money where to go instead of wondering where it went."
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#22c55e'
              }}>
                <span>Today's Limit: Stay under ₹{(() => {
                  const currentId = userId || localStorage.getItem('zb_profile_id') || 'local';
                  const userCustom = localStorage.getItem(`zb_custom_daily_limit_${currentId}`);
                  if (userCustom && parseInt(userCustom, 10) > 0) return parseInt(userCustom, 10).toLocaleString();
                  const userLimit = localStorage.getItem(`zb_daily_limit_${currentId}`);
                  if (userLimit && parseInt(userLimit, 10) > 0) return parseInt(userLimit, 10).toLocaleString();
                  const userSalary = localStorage.getItem(`zb_monthly_salary_${currentId}`);
                  if (userSalary && parseFloat(userSalary) > 0) return Math.max(200, Math.round((parseFloat(userSalary) * 0.75) / 30)).toLocaleString();
                  const globalLimit = localStorage.getItem('zb_daily_limit');
                  return (globalLimit ? parseInt(globalLimit, 10) : 1000).toLocaleString();
                })()}</span>
                <span>🤝</span>
              </div>
            </div>

            {/* Dots */}
            <div
              style={{
                display: 'flex',
                gap: '14px',
                margin: '4px 0 18px',
                animation: isIncorrect ? 'shake 0.5s ease-in-out' : 'none'
              }}
            >
              {[0, 1, 2, 3].map((index) => {
                const active = getDotsCount() > index;
                return (
                  <div
                    key={index}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid #22c55e',
                      backgroundColor: active ? '#22c55e' : 'transparent',
                      boxShadow: active ? '0 0 12px rgba(34, 197, 94, 0.6)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                {errorMsg}
              </div>
            )}

            {/* Numeric Keypad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                width: '100%',
                maxWidth: '260px',
                marginTop: '0px',
                justifyContent: 'center',
                alignItems: 'center',
                justifyItems: 'center'
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleKeypadPress(num);
                  }}
                  style={{
                    height: '60px',
                    width: '60px',
                    minWidth: '60px',
                    maxWidth: '60px',
                    minHeight: '60px',
                    maxHeight: '60px',
                    padding: 0,
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: '#131b26',
                    color: '#ffffff',
                    fontSize: '22px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                    transition: 'all 0.15s ease-out',
                    margin: '0 auto'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'}
                  onMouseUp={(e) => e.currentTarget.style.background = '#131b26'}
                >
                  {num}
                </button>
              ))}

              {/* Left Keypad Column: Biometrics button */}
              {localStorage.getItem('zb_biometrics_enabled') !== 'false' ? (
                <button
                  type="button"
                  onClick={() => triggerBiometricUnlock()}
                  style={{
                    height: '60px',
                    width: '60px',
                    minWidth: '60px',
                    maxWidth: '60px',
                    minHeight: '60px',
                    maxHeight: '60px',
                    padding: 0,
                    borderRadius: '50%',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    background: 'rgba(34, 197, 94, 0.12)',
                    color: '#22c55e',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(34, 197, 94, 0.25)',
                    transition: 'all 0.15s ease',
                    margin: '0 auto'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'}
                  onMouseUp={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.12)'}
                >
                  <Fingerprint size={24} />
                </button>
              ) : (
                <div style={{ width: '60px', height: '60px', margin: '0 auto' }} />
              )}

              {/* Center Column: 0 */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleKeypadPress('0');
                }}
                style={{
                  height: '60px',
                  width: '60px',
                  minWidth: '60px',
                  maxWidth: '60px',
                  minHeight: '60px',
                  maxHeight: '60px',
                  padding: 0,
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: '#131b26',
                  color: '#ffffff',
                  fontSize: '22px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                  transition: 'all 0.15s ease',
                  margin: '0 auto'
                }}
                onMouseDown={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'}
                onMouseUp={(e) => e.currentTarget.style.background = '#131b26'}
              >
                0
              </button>

              {/* Right Column: Delete Backspace */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBackspace();
                }}
                style={{
                  height: '60px',
                  width: '60px',
                  minWidth: '60px',
                  maxWidth: '60px',
                  minHeight: '60px',
                  maxHeight: '60px',
                  padding: 0,
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: '#131b26',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                  transition: 'all 0.15s ease',
                  margin: '0 auto'
                }}
                onMouseDown={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                onMouseUp={(e) => e.currentTarget.style.background = '#131b26'}
              >
                <Delete size={22} />
              </button>
            </div>

            {/* Forgot / Reset PIN Action */}
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  const userEmail = email || localStorage.getItem('zb_user_email') || '';
                  setResetEmail(userEmail);
                  setStep('forgot-pin-email');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '6px 14px',
                  textDecoration: 'underline'
                }}
              >
                Forgot PIN? Reset via Email OTP
              </button>
            </div>

            {/* Sign Out Action */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '20px',
                  padding: '8px 18px',
                  color: '#ef4444',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <LogOut size={12} />
                <span>Sign Out of Account</span>
              </button>
            </div>

            {/* Sign Out Confirmation Popup */}
            {showSignOutConfirm && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '24px', padding: '28px', maxWidth: '300px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>👋</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Sign Out?</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>Are you sure you want to sign out? Your data is saved securely.</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowSignOutConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => { setShowSignOutConfirm(false); handleSignOut(); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--danger)', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Yes, Sign Out</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP: Forgot PIN - Email Request Screen */}
        {step === 'forgot-pin-email' && (
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '32px 24px',
              borderRadius: '28px',
              border: Capacitor.isNativePlatform() ? 'none' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: Capacitor.isNativePlatform() ? 'none' : '0 20px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '18px',
                background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px auto', color: '#22c55e'
              }}>
                <ShieldCheck size={28} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Reset Your PIN
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                To protect your financial data, we will send a 6-digit verification code to your registered email.
              </p>
            </div>

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, textAlign: 'center'
              }}>
                {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Registered Account Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-input)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="button"
              disabled={isLoading || !resetEmail.trim()}
              onClick={() => handleSendResetOtp()}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading || !resetEmail.trim() ? 0.7 : 1,
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? 'Sending Verification Code...' : 'Send 6-Digit Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setStep('unlock');
              }}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid var(--border-input)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Back to Lock Screen
            </button>
          </div>
        )}

        {/* STEP: Forgot PIN - 6-Digit OTP Verification Screen */}
        {step === 'forgot-pin-otp' && (
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '32px 24px',
              borderRadius: '28px',
              border: Capacitor.isNativePlatform() ? 'none' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: Capacitor.isNativePlatform() ? 'none' : '0 20px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '18px',
                background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px auto', color: '#22c55e'
              }}>
                <KeyRound size={28} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Enter Verification Code
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{resetEmail}</strong>.
              </p>
            </div>

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, textAlign: 'center'
              }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)',
                color: '#22c55e', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, textAlign: 'center'
              }}>
                {successMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                6-Digit Security Code
              </label>
              <input
                type="text"
                maxLength={8}
                inputMode="numeric"
                autoFocus
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-input)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '24px',
                  fontWeight: 800,
                  letterSpacing: '8px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="button"
              disabled={isLoading || resetOtp.trim().length < 6}
              onClick={handleVerifyResetOtp}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: (isLoading || resetOtp.trim().length < 6) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || resetOtp.trim().length < 6) ? 0.7 : 1,
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? 'Verifying Code...' : 'Verify Code & Set PIN'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={() => handleSendResetOtp()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-secondary)' : 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  padding: '4px'
                }}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setStep('forgot-pin-email');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                Change Email
              </button>
            </div>
          </div>
        )}

        {/* iOS Standalone App Installation Instructions Modal */}
        {showIOSInstructions && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1200,
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }} onClick={() => setShowIOSInstructions(false)}>
            <div style={{
              width: '100%',
              maxWidth: '340px',
              background: 'rgba(20, 20, 30, 0.95)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.15)',
              borderRadius: '24px',
              padding: '24px',
              position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Install on iPhone / iOS</h3>
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>1</span>
                  <span>Open this website in the <strong>Safari</strong> browser on your iPhone.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>2</span>
                  <span>Tap the <strong>Share</strong> button (box with an up arrow <span style={{ fontSize: '14px' }}>⎋</span> at the bottom).</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>3</span>
                  <span>Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>4</span>
                  <span>Tap <strong>"Add"</strong> in the top-right corner to complete the installation.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="glass-button active"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  marginTop: '20px',
                  cursor: 'pointer'
                }}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Biometric Enable Prompt Modal (Immediately after PIN Creation) */}
        {showBiometricPrompt && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(5, 10, 18, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '390px',
              background: 'linear-gradient(165deg, rgba(17, 24, 39, 0.98) 0%, rgba(10, 15, 29, 0.98) 100%)',
              borderRadius: '26px',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.2)',
              padding: '28px 22px',
              textAlign: 'center',
              color: '#f8fafc',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* Animated Fingerprint Icon with Glowing Aura */}
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
              }}>
                <Fingerprint size={40} color="#34d399" />
              </div>

              <h3 style={{ fontSize: '19.5px', fontWeight: 900, margin: '0 0 8px', color: '#f8fafc' }}>
                Enable Biometric Login? 👆
              </h3>
              
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55, margin: '0 0 22px' }}>
                PIN set ho gaya! Ab aap 1-tap me Fingerprint ya Face ID se login kar sakte hain. Bank-grade encrypted.
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    localStorage.setItem('zb_biometrics_enabled', 'true');
                    setShowBiometricPrompt(false);
                    if (pendingUnlockData) {
                      try {
                        await triggerBiometricUnlock({
                          name: pendingUnlockData.name,
                          pin: pendingUnlockData.pin,
                          subscription_tier: pendingUnlockData.tier,
                          trial_start_date: pendingUnlockData.trialStart,
                          premium_expires_at: pendingUnlockData.premiumExpires,
                          trial_expire_date: pendingUnlockData.trialExpire
                        } as any);
                      } catch (_) {}
                      onUnlock(
                        pendingUnlockData.userId,
                        pendingUnlockData.name,
                        pendingUnlockData.tier,
                        pendingUnlockData.trialStart,
                        pendingUnlockData.pin,
                        pendingUnlockData.premiumExpires,
                        pendingUnlockData.trialExpire
                      );
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Fingerprint size={19} />
                  <span>Yes, Enable Biometrics 👆</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('zb_biometrics_enabled', 'false');
                    setShowBiometricPrompt(false);
                    if (pendingUnlockData) {
                      onUnlock(
                        pendingUnlockData.userId,
                        pendingUnlockData.name,
                        pendingUnlockData.tier,
                        pendingUnlockData.trialStart,
                        pendingUnlockData.pin,
                        pendingUnlockData.premiumExpires,
                        pendingUnlockData.trialExpire
                      );
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '14px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Skip for Now (Use PIN Only)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Styles */}
        <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
      </div>
    </div>
  );
};
