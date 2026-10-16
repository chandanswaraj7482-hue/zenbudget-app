import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Hourglass, Loader2, ShieldCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../supabaseClient';
import { launchCashfreeCheckout } from '../utils/cashfreeHelper';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { triggerFireworksCelebration, playErrorSound } from '../utils/audio';
import { isPlayStoreBuild } from '../config/buildConfig';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTransactionsCount: number;
  trialStartDate: string; // ISO string
  subscriptionTier: string;
  onUpgradeSuccess: (cycle: 'monthly' | 'yearly' | 'lifetime') => void;
  isBlocker?: boolean; // If true, force upgrade (can't close)
  currency: string;
  rates: Record<string, number>;
  premiumExpiresAt?: string | null;
}

export type PlanCycle = 'monthly' | 'yearly' | 'lifetime';

export const LOCALIZED_PRICES_MONTHLY: Record<string, { amount: number; symbol: string; label: string }> = {
  INR: { amount: 149, symbol: '₹', label: '₹149/mo' },
  USD: { amount: 6.99, symbol: '$', label: '$6.99/mo' },
  EUR: { amount: 6.99, symbol: '€', label: '€6.99/mo' },
  GBP: { amount: 5.99, symbol: '£', label: '£5.99/mo' },
  CAD: { amount: 9.99, symbol: 'C$', label: 'C$9.99/mo' },
  AUD: { amount: 10.99, symbol: 'A$', label: 'A$10.99/mo' },
  JPY: { amount: 750, symbol: '¥', label: '¥750/mo' },
  AED: { amount: 24.99, symbol: 'AED', label: '24.99 AED/mo' },
  SAR: { amount: 24.99, symbol: 'SAR', label: '24.99 SAR/mo' },
  CNY: { amount: 35, symbol: '¥', label: '¥35/mo' },
  SGD: { amount: 9.99, symbol: 'S$', label: 'S$9.99/mo' }
};

export const LOCALIZED_PRICES_YEARLY: Record<string, { amount: number; symbol: string; label: string }> = {
  INR: { amount: 1499, symbol: '₹', label: '₹1,499/yr' },
  USD: { amount: 19.99, symbol: '$', label: '$19.99/yr' },
  EUR: { amount: 19.99, symbol: '€', label: '€19.99/yr' },
  GBP: { amount: 17.99, symbol: '£', label: '£17.99/yr' },
  CAD: { amount: 27.99, symbol: 'C$', label: 'C$27.99/yr' },
  AUD: { amount: 29.99, symbol: 'A$', label: 'A$29.99/yr' },
  JPY: { amount: 7500, symbol: '¥', label: '¥7,500/yr' },
  AED: { amount: 69.99, symbol: 'AED', label: '69.99 AED/yr' },
  SAR: { amount: 69.99, symbol: 'SAR', label: '69.99 SAR/yr' },
  CNY: { amount: 350, symbol: '¥', label: '¥350/yr' },
  SGD: { amount: 27.99, symbol: 'S$', label: 'S$27.99/yr' }
};

export const LOCALIZED_PRICES_LIFETIME: Record<string, { amount: number; symbol: string; label: string }> = {
  INR: { amount: 2499, symbol: '₹', label: '₹2,499' },
  USD: { amount: 29.99, symbol: '$', label: '$29.99' },
  EUR: { amount: 29.99, symbol: '€', label: '€29.99' },
  GBP: { amount: 24.99, symbol: '£', label: '£24.99' },
  CAD: { amount: 39.99, symbol: 'C$', label: 'C$39.99' },
  AUD: { amount: 44.99, symbol: 'A$', label: 'A$44.99' },
  JPY: { amount: 15000, symbol: '¥', label: '¥15,000' },
  AED: { amount: 109.99, symbol: 'AED', label: '109.99 AED' },
  SAR: { amount: 109.99, symbol: 'SAR', label: '109.99 SAR' },
  CNY: { amount: 750, symbol: '¥', label: '¥750' },
  SGD: { amount: 39.99, symbol: 'S$', label: 'S$39.99' }
};

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentTransactionsCount: _currentTransactionsCount,
  trialStartDate,
  subscriptionTier,
  onUpgradeSuccess,
  isBlocker = false,
  currency,
  rates,
  premiumExpiresAt
}) => {
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [billingCycle, setBillingCycle] = useState<PlanCycle>('yearly');
  const [lifetimeClaimedCount, setLifetimeClaimedCount] = useState<number>(0);
  const [isLifetimeAvailable, setIsLifetimeAvailable] = useState<boolean>(true);
  const [inputCoupon, setInputCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percent: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    
    setCouponMessage('');
    setCouponError(false);
    try {
      const codeUpper = inputCoupon.trim().toUpperCase();
      const { data, error } = await supabase
        .from('promo_coupons')
        .select('*')
        .eq('code', codeUpper)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setCouponError(true);
        setCouponMessage('Invalid coupon code.');
        setAppliedCoupon(null);
        return;
      }

      if (!data.is_active) {
        setCouponError(true);
        setCouponMessage('This coupon is inactive.');
        setAppliedCoupon(null);
        return;
      }

      if (data.max_uses > 0 && data.uses_count >= data.max_uses) {
        setCouponError(true);
        setCouponMessage('This coupon limit has been reached.');
        setAppliedCoupon(null);
        return;
      }

      const currentUserEmail = (localStorage.getItem('zb_user_email') || '').trim().toLowerCase();
      if (data.target_email && data.target_email.trim().toLowerCase() !== currentUserEmail) {
        setCouponError(true);
        setCouponMessage('This coupon code is not assigned to your account email.');
        setAppliedCoupon(null);
        return;
      }

      if (data.target_plan) {
        const isSubscriptionAll = data.target_plan === 'subscription_all';
        const isValid = isSubscriptionAll 
          ? ['monthly', 'yearly', 'lifetime'].includes(billingCycle)
          : data.target_plan === billingCycle;

        if (!isValid) {
          setCouponError(true);
          setCouponMessage(isSubscriptionAll 
            ? 'This coupon is only valid for Monthly, Yearly, or Lifetime subscription plans.' 
            : `This coupon is only valid for the ${data.target_plan} plan.`);
          setAppliedCoupon(null);
          return;
        }
      }

      setAppliedCoupon({ code: data.code, discount_percent: data.discount_percent });
      setCouponError(false);
      setCouponMessage(`Success! ${data.discount_percent}% discount applied!`);
    } catch (err: any) {
      setCouponError(true);
      setCouponMessage(err.message || 'Error checking coupon.');
      setAppliedCoupon(null);
    }
  };

  const [dynamicPrices, setDynamicPrices] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
    } catch (_) {
      return {};
    }
  });

  // Sync latest dynamic prices whenever subscription modal opens or updates
  useEffect(() => {
    const handlePriceUpdate = (e: any) => {
      if (e.detail) {
        setDynamicPrices(e.detail);
      }
    };
    window.addEventListener('zenbudget_prices_updated', handlePriceUpdate);

    if (isOpen) {
      supabase
        .from('app_config')
        .select('data')
        .eq('id', 'subscription_pricing')
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.data) {
            setDynamicPrices(data.data);
            localStorage.setItem('zb_dynamic_prices', JSON.stringify(data.data));
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('zenbudget_prices_updated', handlePriceUpdate);
    };
  }, [isOpen]);

  const getDynamicAmount = (cycle: PlanCycle, curr: string): number => {
    const orig = cycle === 'monthly' 
      ? (LOCALIZED_PRICES_MONTHLY[curr] || LOCALIZED_PRICES_MONTHLY['USD'])
      : cycle === 'yearly'
        ? (LOCALIZED_PRICES_YEARLY[curr] || LOCALIZED_PRICES_YEARLY['USD'])
        : (LOCALIZED_PRICES_LIFETIME[curr] || LOCALIZED_PRICES_LIFETIME['USD']);

    if (curr === 'INR') {
      if (cycle === 'monthly' && dynamicPrices.monthly) return Number(dynamicPrices.monthly);
      if (cycle === 'yearly' && dynamicPrices.yearly) return Number(dynamicPrices.yearly);
      if (cycle === 'lifetime' && dynamicPrices.lifetime) return Number(dynamicPrices.lifetime);
    } else {
      const key = `${curr.toLowerCase()}_${cycle}`;
      if (dynamicPrices[key]) return Number(dynamicPrices[key]);
    }
    return orig.amount;
  };

  const getPlanPriceDisplay = (cycle: PlanCycle) => {
    const orig = cycle === 'monthly' 
      ? (LOCALIZED_PRICES_MONTHLY[currency] || LOCALIZED_PRICES_MONTHLY['USD'])
      : cycle === 'yearly'
        ? (LOCALIZED_PRICES_YEARLY[currency] || LOCALIZED_PRICES_YEARLY['USD'])
        : (LOCALIZED_PRICES_LIFETIME[currency] || LOCALIZED_PRICES_LIFETIME['USD']);

    const displayAmount = getDynamicAmount(cycle, currency);
    const suffix = cycle === 'monthly' ? '/mo' : cycle === 'yearly' ? '/yr' : '';
    const labelStr = `${orig.symbol}${displayAmount.toLocaleString()}${suffix}`;

    if (!appliedCoupon) {
      return (
        <span style={{ fontSize: '16px', fontWeight: 800, color: cycle === 'lifetime' ? '#d97706' : cycle === 'yearly' ? '#059669' : 'var(--text-primary)' }}>
          {labelStr}
        </span>
      );
    }

    const discountFactor = (100 - appliedCoupon.discount_percent) / 100;
    const finalAmount = (displayAmount * discountFactor).toFixed(cycle === 'lifetime' ? 0 : 2);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
        <span style={{ textDecoration: 'line-through', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          {orig.symbol}{displayAmount.toLocaleString()}
        </span>
        <span style={{ color: '#34d399', fontWeight: 800, fontSize: '16px' }}>
          {orig.symbol}{parseFloat(finalAmount).toLocaleString()}{suffix}
        </span>
      </div>
    );
  };

  // Re-verify coupon plan constraints if billing cycle changes
  useEffect(() => {
    if (appliedCoupon) {
      supabase
        .from('promo_coupons')
        .select('target_plan')
        .eq('code', appliedCoupon.code)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.target_plan) {
            const isSubscriptionAll = data.target_plan === 'subscription_all';
            const isValid = isSubscriptionAll 
              ? ['monthly', 'yearly', 'lifetime'].includes(billingCycle)
              : data.target_plan === billingCycle;

            if (!isValid) {
              setAppliedCoupon(null);
              setCouponMessage(isSubscriptionAll 
                ? 'Coupon cleared: Only valid for Monthly, Yearly, or Lifetime subscription plans.' 
                : `Coupon cleared: Only valid for the ${data.target_plan} plan.`);
              setCouponError(true);
            }
          }
        });
    }
  }, [billingCycle, appliedCoupon]);

  // Fetch real count of Founding Lifetime Members from backend
  useEffect(() => {
    if (!isOpen) return;
    const checkLifetimeLimit = async () => {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('subscription_tier', 'premium_lifetime');

        if (!error && count !== null) {
          setLifetimeClaimedCount(count);
          if (count >= 100) {
            setIsLifetimeAvailable(false);
            if (billingCycle === 'lifetime') setBillingCycle('yearly');
          }
        }
      } catch (err) {
        console.error('Error checking lifetime limit:', err);
      }
    };
    checkLifetimeLimit();
  }, [isOpen, billingCycle]);

  // Background polling for payment verification in database
  useEffect(() => {
    const isPremium = subscriptionTier === 'premium_monthly' || subscriptionTier === 'premium_yearly' || subscriptionTier === 'premium_lifetime' || subscriptionTier === 'premium';
    if (!isOpen || isPremium) return;

    const interval = setInterval(async () => {
      try {
        const profileId = localStorage.getItem('zb_profile_id') || '';
        if (!profileId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', profileId)
          .maybeSingle();

        if (!error && data) {
          const tier = data.subscription_tier;
          const isTierPremium = tier === 'premium_monthly' || tier === 'premium_yearly' || tier === 'premium_lifetime' || tier === 'premium';
          if (isTierPremium) {
            setPaymentStep('success');
            try { triggerFireworksCelebration(); } catch (_) {}
            setTimeout(() => {
              onUpgradeSuccess(billingCycle);
              onClose();
              setPaymentStep('details');
            }, 1800);
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, subscriptionTier, billingCycle, onUpgradeSuccess, onClose]);

  if (!isOpen) return null;

  // Calculate remaining trial days
  const getRemainingTrialDays = () => {
    const savedExpire = localStorage.getItem('zb_trial_expire_date');
    if (savedExpire) {
      const diffTime = new Date(savedExpire).getTime() - new Date().getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    const start = new Date(trialStartDate).getTime();
    const now = new Date().getTime();
    const diffTime = now - start;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - diffDays));
  };

  const remainingDays = getRemainingTrialDays();
  const isLifetime = subscriptionTier === 'premium_lifetime';
  const isMonthly = subscriptionTier === 'premium_monthly';
  const isYearly = subscriptionTier === 'premium_yearly';
  const isPaidPremium = isMonthly || isYearly || isLifetime || subscriptionTier === 'premium';
  
  // A paid plan is expired ONLY if the user is on a time-limited paid tier and its expiry date has passed.
  // CRITICAL: Lifetime plan NEVER expires!
  const hasPaidSubscriptionExpired = Boolean(
    !isLifetime &&
    ['premium', 'premium_monthly', 'premium_yearly'].includes(subscriptionTier) &&
    premiumExpiresAt &&
    !isNaN(new Date(premiumExpiresAt).getTime()) &&
    Date.now() > new Date(premiumExpiresAt).getTime()
  );

  // If user is explicitly on trial tier and 7 days passed
  const isTrialExpired = subscriptionTier === 'trial' && remainingDays <= 0;

  // Free tier users who never paid or are using the free forever tier are NOT "expired"
  const isExpired = hasPaidSubscriptionExpired || isTrialExpired;
  const effectiveIsBlocker = isBlocker;

  // Dynamic Current Plan Status
  let currentPlanLabel = 'Free Forever (Ad-Supported)';
  let currentPlanColor = 'var(--primary)';
  if (isLifetime) {
    currentPlanLabel = 'ZenBudget Lifetime Pro (Unlimited)';
    currentPlanColor = '#8b5cf6';
  } else if (isYearly && !hasPaidSubscriptionExpired) {
    currentPlanLabel = 'ZenBudget Pro (Yearly)';
    currentPlanColor = '#10b981';
  } else if (isMonthly && !hasPaidSubscriptionExpired) {
    currentPlanLabel = 'ZenBudget Pro (Monthly)';
    currentPlanColor = '#3b82f6';
  } else if (hasPaidSubscriptionExpired) {
    currentPlanLabel = 'Expired Premium (Shifted to Free Forever)';
    currentPlanColor = 'var(--danger)';
  } else if (subscriptionTier === 'trial') {
    currentPlanLabel = isTrialExpired 
      ? '7-Day Trial Ended (Free Forever Tier)' 
      : `7-Day Pro Trial (${remainingDays} days left)`;
    currentPlanColor = '#f59e0b';
  }

  // Get active pricing info
  const getPriceInfo = () => {
    if (billingCycle === 'monthly') return LOCALIZED_PRICES_MONTHLY[currency] || LOCALIZED_PRICES_MONTHLY['USD'];
    if (billingCycle === 'yearly') return LOCALIZED_PRICES_YEARLY[currency] || LOCALIZED_PRICES_YEARLY['USD'];
    return LOCALIZED_PRICES_LIFETIME[currency] || LOCALIZED_PRICES_LIFETIME['USD'];
  };

  const priceInfo = getPriceInfo();

  // Dynamic base price for current currency
  const activePlanAmount = getDynamicAmount(billingCycle, currency);
  let upiAmountINR = currency === 'INR' 
    ? activePlanAmount 
    : Math.round((activePlanAmount / (rates[currency] || 1)) * (rates['INR'] || 83.5));

  if (appliedCoupon) {
    upiAmountINR = Math.round(upiAmountINR * ((100 - appliedCoupon.discount_percent) / 100));
  }

  const getCtaText = () => {
    if (billingCycle === 'monthly') return 'Continue with Monthly';
    if (billingCycle === 'yearly') return 'Continue with Yearly';
    return 'Get Lifetime Access';
  };

  const launchNativeUpi = async (targetApp: 'phonepe' | 'gpay' | 'any') => {
    const currentProfileId = localStorage.getItem('zb_profile_id') || 'usr';
    const note = `ZenBudget_${billingCycle}_${currentProfileId.slice(0, 8)}`;
    const universalUpi = `upi://pay?pa=chandanswaraj7482@okicici&pn=${encodeURIComponent("ZenBudget")}&am=${upiAmountINR}&cu=INR&tn=${encodeURIComponent(note)}`;
    const phonepeUpi = `phonepe://pay?pa=chandanswaraj7482@okicici&pn=${encodeURIComponent("ZenBudget")}&am=${upiAmountINR}&cu=INR&tn=${encodeURIComponent(note)}`;
    const gpayUpi = `tez://upi/pay?pa=chandanswaraj7482@okicici&pn=${encodeURIComponent("ZenBudget")}&am=${upiAmountINR}&cu=INR&tn=${encodeURIComponent(note)}`;

    const selectedUri = targetApp === 'phonepe' ? phonepeUpi : (targetApp === 'gpay' ? gpayUpi : universalUpi);

    setPaymentStep('processing');

    if (Capacitor.isNativePlatform()) {
      try {
        const { AppLauncher } = await import('@capacitor/app-launcher');
        const canOpen = await AppLauncher.canOpenUrl({ url: selectedUri }).then(r => r.value).catch(() => false);
        if (canOpen) {
          await AppLauncher.openUrl({ url: selectedUri });
          return;
        }
        await AppLauncher.openUrl({ url: universalUpi });
        return;
      } catch (err) {
        console.warn('AppLauncher intent failed:', err);
      }
    }

    try {
      window.location.href = selectedUri;
      setTimeout(() => {
        try { window.location.href = universalUpi; } catch (_) {}
      }, 1200);
    } catch (e) {
      window.location.href = universalUpi;
    }
  };

  const handleManualCompletion = async () => {
    const profileId = localStorage.getItem('zb_profile_id') || '';
    const targetTier = billingCycle === 'yearly' ? 'premium_yearly' : (billingCycle === 'lifetime' ? 'premium_lifetime' : 'premium_monthly');
    const durationDays = billingCycle === 'yearly' ? 395 : (billingCycle === 'lifetime' ? 36500 : 30);
    const newExpiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();

    localStorage.setItem('zb_subscription_tier', targetTier);
    localStorage.setItem('zb_premium_expires_at', newExpiresAt);
    if (profileId) {
      try {
        await supabase.from('profiles').update({
          subscription_tier: targetTier,
          premium_expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        }).eq('id', profileId);
      } catch (e) {
        console.warn('Profile tier update failed:', e);
      }
    }
    setPaymentStep('success');
    try { triggerFireworksCelebration(); } catch (_) {}
    setTimeout(() => {
      onUpgradeSuccess(billingCycle);
      onClose();
      setPaymentStep('details');
    }, 1800);
  };

  const handleWebPayment = async () => {
    // Play Store compliance: completely bypass Cashfree and activate directly
    if (isPlayStoreBuild()) {
      await handleManualCompletion();
      return;
    }

    setPaymentStep('processing');
    try {
      const currentProfileId = localStorage.getItem('zb_profile_id');
      const userEmail = localStorage.getItem('zb_user_email') || 'user@example.com';

      if (!currentProfileId) {
        throw new Error('Please login to upgrade to premium.');
      }

      let payment_session_id = '';
      let responseText = '';

      try {
        const response = await fetch(`/api/create-payment-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: upiAmountINR,
            planType: billingCycle,
            email: userEmail,
            phone: localStorage.getItem('zb_user_phone') || '',
            userId: currentProfileId
          })
        });
        responseText = await response.text();
      } catch (fetchErr) {
        console.warn('Local API fetch failed, attempting fallback:', fetchErr);
      }

      if (!responseText || responseText.trim().startsWith('<')) {
        try {
          const response = await fetch(`https://zenbudget-tracker.vercel.app/api/create-payment-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: upiAmountINR,
              planType: billingCycle,
              email: userEmail,
              phone: localStorage.getItem('zb_user_phone') || '',
              userId: currentProfileId
            })
          });
          responseText = await response.text();
        } catch (e) {
          console.warn('Fallback function fetch failed:', e);
        }
      }

      if (responseText && !responseText.trim().startsWith('<')) {
        try {
          const data = JSON.parse(responseText);
          if (data.error) throw new Error(data.error);
          if (data.payment_session_id) {
            payment_session_id = data.payment_session_id;
            if (data.environment) {
              (window as any)._lastCfEnv = data.environment;
            }
          }
        } catch (jsonErr: any) {
          console.warn('JSON parsing error:', jsonErr);
          throw new Error(jsonErr.message || 'Could not parse payment session response.');
        }
      }

      if (!payment_session_id) {
        throw new Error('Could not create payment order. Please try again.');
      }

      if (appliedCoupon) {
        localStorage.setItem('zb_pending_coupon', appliedCoupon.code);
      }

      const isNative = Capacitor.isNativePlatform();
      const payUrl = `https://zenbudget-tracker.vercel.app/pay.html?session_id=${payment_session_id}&amount=${upiAmountINR}&plan=${billingCycle}`;

      if (isNative) {
        try {
          await Browser.open({ url: payUrl });
        } catch (browserErr) {
          try { window.open(payUrl, '_system'); } catch (e) { window.location.href = payUrl; }
        }
        setPaymentStep('processing');
      } else {
        setPaymentStep('processing');
        launchCashfreeCheckout(
          payment_session_id,
          (result: any) => {
            setPaymentStep('processing');
          },
          (err: any) => {
            setPaymentStep('details');
            try { playErrorSound(); } catch (_) {}
            window.dispatchEvent(new CustomEvent('toast-alert', { detail: { message: 'Payment incomplete or cancelled. Please try again.', type: 'error' } }));
            if (err && typeof err === 'string' && err.includes('SDK')) {
              launchNativeUpi('any');
            }
          },
          (window as any)._lastCfEnv
        );
      }
    } catch (sdkErr: any) {
      setPaymentStep('details');
      setCouponMessage(sdkErr.message || 'Payment Gateway connection failed. Please try again.');
      setCouponError(true);
    }
  };

  return (
    <div 
      className="subscription-modal-wrapper"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out',
        touchAction: 'auto'
      }} 
      onClick={effectiveIsBlocker ? undefined : onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '24px',
          borderRadius: '28px',
          position: 'relative',
          border: '1px solid rgba(20, 184, 166, 0.25)',
          boxShadow: '0 0 40px rgba(20, 184, 166, 0.15)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!effectiveIsBlocker && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#cbd5e1',
              zIndex: 20,
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* PROCESSING STEP */}
        {paymentStep === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 8px', gap: '16px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(95, 37, 159, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)',
              border: '2px solid rgba(95, 37, 159, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(95, 37, 159, 0.3)'
            }}>
              <Loader2 size={32} className="animate-spin" style={{ color: '#a855f7' }} />
            </div>

            <div>
              <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
                Complete Payment in PhonePe / UPI
              </h3>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Amount: <strong style={{ color: '#34d399' }}>₹{upiAmountINR}</strong> ({billingCycle.toUpperCase()} Plan)<br />
                Complete payment in your UPI app, then tap below.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '340px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => launchNativeUpi('phonepe')}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #5f259f 0%, #4a1d7c 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(95, 37, 159, 0.45)'
                }}
              >
                <span>🟣 Open PhonePe App</span>
              </button>

              <button
                type="button"
                onClick={() => launchNativeUpi('any')}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Zap size={15} /> <span>Open Any UPI App (GPay / Paytm)</span>
              </button>

              <button
                type="button"
                onClick={handleManualCompletion}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
                }}
              >
                <span>✅ I've Completed the ₹{upiAmountINR} Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStep('details')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '6px',
                  marginTop: '4px'
                }}
              >
                ← Change Plan / Back
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS STEP */}
        {paymentStep === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '20px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-glow)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
            }}>
              <Check size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>Upgrade Successful!</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>You are now a Premium Member of ZenBudget.</p>
            
            <a
              href="/zenbudget.apk?v=premium"
              download="ZenBudget-Premium.apk"
              onClick={() => {
                setTimeout(() => { window.location.href = '/zenbudget.apk?v=premium'; }, 300);
              }}
              style={{
                marginTop: '10px',
                display: 'block',
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--success)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              📥 Download Premium Android APK
            </a>
          </div>
        )}

        {/* DETAILS STEP */}
        {paymentStep === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Header Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', marginTop: '6px' }}>
              <div style={{
                padding: '6px 14px',
                borderRadius: '99px',
                background: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(99,102,241,0.15) 100%)',
                border: '1px solid rgba(236,72,153,0.3)',
                color: 'var(--secondary)',
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Sparkles size={12} /> ZENBUDGET PREMIUM
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Choose Your ZenBudget Plan</h3>
              
              {isLifetime ? (
                <div style={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} /> You have Lifetime Premium! Unlimited access forever.
                </div>
              ) : hasPaidSubscriptionExpired ? (
                <div style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Hourglass size={14} /> Premium subscription expired · You are now on Free Forever. Renew anytime for Pro features.
                </div>
              ) : isTrialExpired ? (
                <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Hourglass size={14} /> 7-Day Pro Trial ended · You are on Free Forever tier. Upgrade for Pro features.
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Unlock unlimited budget categories, AI Coach & shared budgets.
                </p>
              )}
            </div>

            {/* Current Plan Status Card */}
            <div className="glass-panel" style={{ padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Current Plan:</span>
                <span style={{ color: currentPlanColor, fontWeight: 800, whiteSpace: 'nowrap' }}>{currentPlanLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Daily Expense Tracking:</span>
                <span style={{ color: 'var(--success)', fontWeight: 800, whiteSpace: 'nowrap' }}>100% Free & Unlimited</span>
              </div>
              {isLifetime && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}>
                  <span>Lifetime Benefits:</span>
                  <span>Unlimited AI, Cloud Sync, No Ads 👑</span>
                </div>
              )}
            </div>

            {/* 3-Plan Selection Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* MONTHLY PLAN */}
              <div 
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: billingCycle === 'monthly' ? '2px solid #818cf8' : '1px solid var(--border-input)',
                  background: billingCycle === 'monthly' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Monthly</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>100% Ad-Free, cancel anytime</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {getPlanPriceDisplay('monthly')}
                </div>
              </div>

              {/* YEARLY PLAN */}
              <div 
                onClick={() => setBillingCycle('yearly')}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: billingCycle === 'yearly' ? '2px solid #10b981' : '1px solid var(--border-input)',
                  background: billingCycle === 'yearly' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                }}>
                  🎁 BEST VALUE · +1 MONTH FREE!
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Yearly <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', padding: '1px 6px', borderRadius: '6px', fontWeight: 800 }}>12 + 1 Mo Free</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>13 Months Total Access (Includes 1 Mo Bonus!)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {getPlanPriceDisplay('yearly')}
                </div>
              </div>

              {/* LIFETIME FOUNDING MEMBER PLAN */}
              {isLifetimeAvailable && (
                <div 
                  onClick={() => setBillingCycle('lifetime')}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    border: billingCycle === 'lifetime' ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.25)',
                    background: billingCycle === 'lifetime' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '16px',
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    FOUNDING MEMBER
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#d97706' }}>Lifetime</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Limited to first 100 ({lifetimeClaimedCount}/100 claimed)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {getPlanPriceDisplay('lifetime')}
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Pay once. Premium forever.</div>
                  </div>
                </div>
              )}

            </div>

            {/* Premium Perks & Plan Comparison list */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              padding: '10px 12px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-primary)' }}>✨ What unlocks in Pro:</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Free vs Pro</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Check size={13} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>100% Ad-Free Experience</span>
                </div>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, flexShrink: 0, width: '100px', textAlign: 'right' }}>✓ Zero Ads</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Check size={13} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Unlimited Budget Envelopes</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--brand-primary)', fontWeight: 700, flexShrink: 0, width: '100px', textAlign: 'right' }}>2 in Free ➔ Unlimited</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Check size={13} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AI Invoice & Receipt Scanner</span>
                </div>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, flexShrink: 0, width: '100px', textAlign: 'right' }}>✓ Instant 0.2s</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Check size={13} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Bank Statement Smart Parser</span>
                </div>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, flexShrink: 0, width: '100px', textAlign: 'right' }}>✓ All Indian Banks</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Check size={13} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>24/7 AI Coach Guidance</span>
                </div>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, flexShrink: 0, width: '100px', textAlign: 'right' }}>✓ Unlimited</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Check size={13} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Couple Shared Sync</span>
                </div>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, flexShrink: 0, width: '100px', textAlign: 'right' }}>✓ Real-time Sync</span>
              </div>
            </div>

            {/* Promo Coupon Form */}
            <div style={{
              padding: '10px 12px',
              borderRadius: '12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              marginTop: '4px'
            }}>
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text"
                  placeholder="Enter promo code"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-input)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    flexShrink: 0,
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#a5b4fc',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </form>
              {couponMessage && (
                <div style={{
                  fontSize: '0.75rem',
                  color: couponError ? '#f87171' : '#34d399',
                  marginTop: '6px',
                  fontWeight: 600,
                  textAlign: 'left'
                }}>
                  {couponMessage}
                </div>
              )}
            </div>

            {/* Action CTA & Trust Footer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleWebPayment}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 6px 24px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
                className="hover-lift"
              >
                <Zap size={18} />
                <span>
                  {currency === 'INR'
                    ? (Capacitor.isNativePlatform() ? `Upgrade to Pro (₹${upiAmountINR})` : `Proceed to Pay ₹${upiAmountINR}`)
                    : `${getCtaText()} (${priceInfo.symbol}${priceInfo.amount})`}
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                <ShieldCheck size={14} color="#10b981" />
                <span>Instant UPI, Cards & NetBanking · 256-Bit Bank-Grade Secure</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                * Auto-pay is automatically enabled via secure e-mandate. You can cancel anytime.
              </div>

              {!effectiveIsBlocker && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <span>👁️ View My Data (Read-Only Mode)</span>
                </button>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
