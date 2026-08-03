import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Hourglass, Loader2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../supabaseClient';
import { launchCashfreeCheckout } from '../utils/cashfreeHelper';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

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
}

export type PlanCycle = 'monthly' | 'yearly' | 'lifetime';

export const LOCALIZED_PRICES_MONTHLY: Record<string, { amount: number; symbol: string; label: string }> = {
  INR: { amount: 149, symbol: '₹', label: '₹149/mo' },
  USD: { amount: 4.99, symbol: '$', label: '$4.99/mo' },
  EUR: { amount: 5.49, symbol: '€', label: '€5.49/mo' },
  GBP: { amount: 4.99, symbol: '£', label: '£4.99/mo' },
  CAD: { amount: 6.99, symbol: 'C$', label: 'C$6.99/mo' },
  AUD: { amount: 7.99, symbol: 'A$', label: 'A$7.99/mo' },
  JPY: { amount: 750, symbol: '¥', label: '¥750/mo' },
  AED: { amount: 19, symbol: 'AED', label: '19 AED/mo' },
  SAR: { amount: 19, symbol: 'SAR', label: '19 SAR/mo' },
  CNY: { amount: 35, symbol: '¥', label: '¥35/mo' }
};

export const LOCALIZED_PRICES_YEARLY: Record<string, { amount: number; symbol: string; label: string }> = {
  INR: { amount: 1499, symbol: '₹', label: '₹1,499/yr' },
  USD: { amount: 49.99, symbol: '$', label: '$49.99/yr' },
  EUR: { amount: 54.99, symbol: '€', label: '€54.99/yr' },
  GBP: { amount: 49.99, symbol: '£', label: '£49.99/yr' },
  CAD: { amount: 69.99, symbol: 'C$', label: 'C$69.99/yr' },
  AUD: { amount: 79.99, symbol: 'A$', label: 'A$79.99/yr' },
  JPY: { amount: 7500, symbol: '¥', label: '¥7,500/yr' },
  AED: { amount: 189, symbol: 'AED', label: '189 AED/yr' },
  SAR: { amount: 189, symbol: 'SAR', label: '189 SAR/yr' },
  CNY: { amount: 350, symbol: '¥', label: '¥350/yr' }
};

export const LOCALIZED_PRICES_LIFETIME: Record<string, { amount: number; symbol: string; label: string }> = {
  INR: { amount: 2499, symbol: '₹', label: '₹2,499' },
  USD: { amount: 79.99, symbol: '$', label: '$79.99' },
  EUR: { amount: 84.99, symbol: '€', label: '€84.99' },
  GBP: { amount: 79.99, symbol: '£', label: '£79.99' },
  CAD: { amount: 109.99, symbol: 'C$', label: 'C$109.99' },
  AUD: { amount: 119.99, symbol: 'A$', label: 'A$119.99' },
  JPY: { amount: 11900, symbol: '¥', label: '¥11,900' },
  AED: { amount: 299, symbol: 'AED', label: '299 AED' },
  SAR: { amount: 299, symbol: 'SAR', label: '299 SAR' },
  CNY: { amount: 560, symbol: '¥', label: '¥560' }
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
  rates
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

  const getPlanPriceDisplay = (cycle: PlanCycle) => {
    const orig = cycle === 'monthly' 
      ? (LOCALIZED_PRICES_MONTHLY[currency] || LOCALIZED_PRICES_MONTHLY['USD'])
      : cycle === 'yearly'
        ? (LOCALIZED_PRICES_YEARLY[currency] || LOCALIZED_PRICES_YEARLY['USD'])
        : (LOCALIZED_PRICES_LIFETIME[currency] || LOCALIZED_PRICES_LIFETIME['USD']);

    let displayAmount = orig.amount;
    let labelStr = orig.label;
    if (currency === 'INR') {
      try {
        const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
        if (cycle === 'monthly' && stored.monthly) displayAmount = stored.monthly;
        if (cycle === 'yearly' && stored.yearly) displayAmount = stored.yearly;
        if (cycle === 'lifetime' && stored.lifetime) displayAmount = stored.lifetime;
        labelStr = `₹${displayAmount.toLocaleString()}${cycle === 'monthly' ? '/mo' : cycle === 'yearly' ? '/yr' : ''}`;
      } catch (_) {}
    }

    if (!appliedCoupon) {
      return (
        <span style={{ fontSize: '16px', fontWeight: 800, color: cycle === 'lifetime' ? '#d97706' : cycle === 'yearly' ? '#059669' : 'var(--text-primary)' }}>
          {labelStr}
        </span>
      );
    }

    const discountFactor = (100 - appliedCoupon.discount_percent) / 100;
    const finalAmount = (displayAmount * discountFactor).toFixed(cycle === 'lifetime' ? 0 : 2);
    const suffix = cycle === 'monthly' ? '/mo' : cycle === 'yearly' ? '/yr' : '';
    
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
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
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
  const isPremium = subscriptionTier === 'premium_monthly' || subscriptionTier === 'premium_yearly' || subscriptionTier === 'premium_lifetime' || subscriptionTier === 'premium';
  const isExpired = remainingDays <= 0 && !isPremium;

  // Get active pricing info
  const getPriceInfo = () => {
    if (billingCycle === 'monthly') return LOCALIZED_PRICES_MONTHLY[currency] || LOCALIZED_PRICES_MONTHLY['USD'];
    if (billingCycle === 'yearly') return LOCALIZED_PRICES_YEARLY[currency] || LOCALIZED_PRICES_YEARLY['USD'];
    return LOCALIZED_PRICES_LIFETIME[currency] || LOCALIZED_PRICES_LIFETIME['USD'];
  };

  const priceInfo = getPriceInfo();

  // Convert localized price to INR for payment session request
  let defaultBase = billingCycle === 'monthly' ? 149 : (billingCycle === 'yearly' ? 1499 : 2499);
  try {
    const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
    if (billingCycle === 'monthly' && stored.monthly) defaultBase = Number(stored.monthly);
    if (billingCycle === 'yearly' && stored.yearly) defaultBase = Number(stored.yearly);
    if (billingCycle === 'lifetime' && stored.lifetime) defaultBase = Number(stored.lifetime);
  } catch (_) {}

  let upiAmountINR = defaultBase;
  if (currency !== 'INR') {
    const priceInUSD = priceInfo.amount / (rates[currency] || 1);
    upiAmountINR = Math.round(priceInUSD * (rates['INR'] || 83.5));
  }
  if (appliedCoupon) {
    upiAmountINR = Math.round(upiAmountINR * ((100 - appliedCoupon.discount_percent) / 100));
  }

  const getCtaText = () => {
    if (billingCycle === 'monthly') return 'Continue with Monthly';
    if (billingCycle === 'yearly') return 'Continue with Yearly';
    return 'Get Lifetime Access';
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1100,
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out'
      }} 
      onClick={isBlocker ? undefined : onClose}
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
        {/* Close Button */}
        {!isBlocker && (
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
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
        )}

        {/* PROCESSING STEP */}
        {paymentStep === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '20px' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--secondary)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Verifying Transaction...</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Securing your credentials, please wait.</p>
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
              
              {isExpired ? (
                <div style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Hourglass size={14} /> Free Trial has expired!
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Unlock unlimited budget categories, AI Coach & shared budgets.
                </p>
              )}
            </div>

            {/* Trial Usage Limits Card (7 Days & 10 Transactions) */}
            <div className="glass-panel" style={{ padding: '14px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Free Trial Period (7 Days Max):</span>
                <span style={{ color: remainingDays > 3 ? 'var(--primary)' : 'var(--danger)', fontWeight: 800 }}>{remainingDays} / 7 Days Left</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Free Transactions (10 Logs Max):</span>
                <span style={{ color: _currentTransactionsCount >= 10 ? 'var(--danger)' : 'var(--primary)', fontWeight: 800 }}>
                  {_currentTransactionsCount} / 10 Logged
                </span>
              </div>
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
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Flexibility to cancel anytime</div>
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
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  BEST VALUE
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Yearly</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full annual savings & features</div>
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

            {/* Premium Perks list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                <Check size={14} color="var(--success)" />
                <span style={{ color: 'var(--text-primary)' }}>Unlimited category budgets & custom limits</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                <Check size={14} color="var(--success)" />
                <span style={{ color: 'var(--text-primary)' }}>🌿 Zen — AI Money Coach unlimited guidance</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                <Check size={14} color="var(--success)" />
                <span style={{ color: 'var(--text-primary)' }}>Shared Budget partner & family synchronization</span>
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
                  placeholder="Enter promo coupon code"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
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
                    padding: '8px 14px',
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
                onClick={async () => {
                  setPaymentStep('processing');
                  try {
                    const currentProfileId = localStorage.getItem('zb_profile_id');
                    const userEmail = localStorage.getItem('zb_user_email') || 'user@example.com';
                    
                    if (!currentProfileId) {
                      throw new Error('Please login to upgrade to premium.');
                    }

                    let payment_session_id = '';
                    let responseText = '';

                    // Try Vercel Serverless Function first (High reliability 24/7 CORS-enabled endpoint)
                    try {
                      const response = await fetch(`https://admin-portal-zenbudget.vercel.app/api/create-payment-session`, {
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
                      console.warn('Vercel API fetch failed, attempting fallback:', fetchErr);
                    }

                    // Fallback to main app serverless endpoint
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
                        if (data.error) {
                          throw new Error(data.error);
                        }
                        if (data.payment_session_id) {
                          payment_session_id = data.payment_session_id;
                        }
                      } catch (jsonErr: any) {
                        console.warn('JSON parsing error:', jsonErr);
                        throw new Error(jsonErr.message || 'Could not parse payment session response.');
                      }
                    }

                    if (!payment_session_id) {
                      throw new Error('Could not create Cashfree payment order. Please try again.');
                    }

                    if (appliedCoupon) {
                      localStorage.setItem('zb_pending_coupon', appliedCoupon.code);
                    }

                    const isNative = Capacitor.isNativePlatform();
                    const payUrl = `https://zenbudget-tracker.vercel.app/pay.html?session_id=${payment_session_id}`;

                    if (isNative) {
                      // Native APK: Open pay.html via Browser plugin
                      try {
                        await Browser.open({ url: payUrl });
                      } catch (browserErr) {
                        console.warn('Browser.open failed, launching window fallback:', browserErr);
                        try { window.open(payUrl, '_system'); } catch (e) { window.location.href = payUrl; }
                      }
                      setPaymentStep('details');
                    } else {
                      // Web / Mobile Browser: Launch Cashfree Drop-in Checkout Modal directly!
                      launchCashfreeCheckout(
                        payment_session_id,
                        (result: any) => {
                          console.log('Payment successful! Unlocking premium tier:', billingCycle);
                          if (appliedCoupon) {
                            supabase.from('promo_coupons').select('uses_count').eq('code', appliedCoupon.code).maybeSingle()
                              .then(({ data }) => {
                                if (data) supabase.from('promo_coupons').update({ uses_count: (data.uses_count || 0) + 1 }).eq('code', appliedCoupon.code).then(() => {});
                              });
                          }
                          onUpgradeSuccess(billingCycle);
                          onClose();
                        },
                        (err: any) => {
                          console.warn('Cashfree payment modal dismissed/failed:', err);
                          setPaymentStep('details');
                          if (err && typeof err === 'string' && err.includes('Cashfree SDK')) {
                            // Direct UPI Fallback intent if SDK not loaded
                            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                            if (isMobile) {
                              const rawUrl = `upi://pay?pa=chandanswaraj7482@okicici&pn=ZenBudget&am=${upiAmountINR}&cu=INR&tn=ZenBudget_Subscription`;
                              try { window.location.href = rawUrl; } catch (e) {}
                            }
                          }
                        }
                      );
                    }
                  } catch (sdkErr: any) {
                    console.error('Cashfree checkout session error:', sdkErr);
                    setPaymentStep('details');
                    alert(sdkErr.message || 'Payment Gateway connection failed. Please try again.');
                  }
                }}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getCtaText()} ({currency === 'INR' ? `₹${upiAmountINR}` : `${priceInfo.symbol}${priceInfo.amount}`})
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                <ShieldCheck size={14} color="#10b981" />
                <span>Secure payment powered by Cashfree</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
