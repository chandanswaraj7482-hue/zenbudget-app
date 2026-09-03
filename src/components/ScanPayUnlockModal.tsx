import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, Zap, Check, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { launchCashfreeCheckout } from '../utils/cashfreeHelper';
import { triggerFireworksCelebration, playErrorSound } from '../utils/audio';

interface ScanPayUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
  currencySymbol: string;
  isUnlocked?: boolean;
}

export const ScanPayUnlockModal: React.FC<ScanPayUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  currencySymbol,
  isUnlocked
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'initial' | 'processing' | 'success'>('initial');
  const [showInAppGateway, setShowInAppGateway] = useState(false);
  const [modalErr, setModalErr] = useState<string | null>(null);

  const [dynamicPrices, setDynamicPrices] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
    } catch (_) { return {}; }
  });

  React.useEffect(() => {
    const handlePricesUpdated = (e: any) => {
      if (e.detail) setDynamicPrices(e.detail);
    };
    window.addEventListener('zenbudget_prices_updated', handlePricesUpdated);
    return () => window.removeEventListener('zenbudget_prices_updated', handlePricesUpdated);
  }, []);

  let numPrice = 79;
  let priceFormatted = `${currencySymbol}79`;
  try {
    const stored = dynamicPrices;
    if (currencySymbol === '$') {
      numPrice = stored.usd_scan_pay_price || 4.99;
      priceFormatted = `$${numPrice}`;
    } else if (currencySymbol === '€') {
      numPrice = stored.eur_scan_pay_price || 4.99;
      priceFormatted = `€${numPrice}`;
    } else if (currencySymbol === '£') {
      numPrice = stored.gbp_scan_pay_price || 3.99;
      priceFormatted = `£${numPrice}`;
    } else if (currencySymbol === 'C$') {
      numPrice = stored.cad_scan_pay_price || 6.99;
      priceFormatted = `C$${numPrice}`;
    } else if (currencySymbol === 'A$') {
      numPrice = stored.aud_scan_pay_price || 7.99;
      priceFormatted = `A$${numPrice}`;
    } else if (currencySymbol === 'AED') {
      numPrice = stored.aed_scan_pay_price || 17.99;
      priceFormatted = `AED ${numPrice}`;
    } else if (currencySymbol === 'S$') {
      numPrice = stored.sgd_scan_pay_price || 6.99;
      priceFormatted = `S$${numPrice}`;
    } else {
      numPrice = stored.inr_scan_pay_price || 79;
      if (numPrice < 10) numPrice = 79; // Fix: Prevent accidental USD value for INR
      priceFormatted = `₹${numPrice}`;
    }
  } catch (_) {
    numPrice = currencySymbol === '$' ? 4.99 : 79;
    priceFormatted = currencySymbol === '$' ? `$4.99` : `₹79`;
  }

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState<number>(numPrice);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMessage('');
    setCouponError(false);
    try {
      const codeUpper = couponCode.trim().toUpperCase();
      const { data, error } = await supabase
        .from('promo_coupons')
        .select('*')
        .eq('code', codeUpper)
        .maybeSingle();

      if (error || !data) {
        setCouponError(true);
        setCouponMessage('❌ Invalid coupon code.');
        setAppliedCoupon(null);
        setFinalPrice(numPrice);
        return;
      }

      if (!data.is_active) {
        setCouponError(true);
        setCouponMessage('⚠️ This coupon is inactive.');
        setAppliedCoupon(null);
        setFinalPrice(numPrice);
        return;
      }

      if (data.max_uses > 0 && data.uses_count >= data.max_uses) {
        setCouponError(true);
        setCouponMessage('⚠️ Coupon usage limit reached.');
        setAppliedCoupon(null);
        setFinalPrice(numPrice);
        return;
      }

      const currentUserEmail = (localStorage.getItem('zb_user_email') || '').trim().toLowerCase();
      if (data.target_email && data.target_email.trim().toLowerCase() !== currentUserEmail) {
        setCouponError(true);
        setCouponMessage('⚠️ Coupon not valid for your account email.');
        setAppliedCoupon(null);
        setFinalPrice(numPrice);
        return;
      }

      const discountPct = data.discount_percent || 0;
      const discounted = Math.max(0, numPrice - (numPrice * discountPct) / 100);
      setFinalPrice(Number(discounted.toFixed(2)));
      setAppliedCoupon(data);
      setCouponMessage(`🎉 Coupon Applied! ${discountPct}% OFF`);
    } catch (e) {
      setCouponError(true);
      setCouponMessage('Failed to validate coupon.');
    }
  };

  // Fast 1-second background polling for instant Cashfree webhook confirmation
  React.useEffect(() => {
    if (!isOpen || isUnlocked) return;

    const interval = setInterval(async () => {
      try {
        const profileId = localStorage.getItem('zb_profile_id') || '';
        if (!profileId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('has_scan_pay_access, is_admin_unlocked')
          .eq('id', profileId)
          .maybeSingle();

        if (!error && data) {
          if (data.has_scan_pay_access || data.is_admin_unlocked) {
            localStorage.setItem('has_scan_pay_access', 'true');
            localStorage.setItem(`zb_scan_pay_access_${profileId}`, 'true');
            setPaymentStep('success');
            try { triggerFireworksCelebration(); } catch (_) {}
            setTimeout(() => {
              onUnlockSuccess();
              onClose();
              setIsProcessing(false);
              setPaymentStep('initial');
            }, 1500);
          }
        }
      } catch (err) {
        console.error('Error polling Scan & Pay unlock status:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isUnlocked, onUnlockSuccess, onClose]);

  // Automatically trigger success when webhook unlocks the feature
  React.useEffect(() => {
    if (isOpen && isUnlocked && paymentStep === 'processing') {
      setPaymentStep('success');
      try { triggerFireworksCelebration(); } catch (_) {}
      setTimeout(() => {
        onUnlockSuccess();
        onClose();
        setIsProcessing(false);
        setPaymentStep('initial');
      }, 2000);
    }
  }, [isOpen, isUnlocked, paymentStep, onUnlockSuccess, onClose]);

  const handleUnlockPayment = async () => {
    setIsProcessing(true);
    setModalErr(null);
    try {
      const profileId = localStorage.getItem('zb_profile_id') || '';
      const userEmail = localStorage.getItem('zb_user_email') || '';
      const userPhone = localStorage.getItem('zb_user_phone') || '';

      if (finalPrice <= 0) {
        localStorage.setItem('has_scan_pay_access', 'true');
        localStorage.setItem(`zb_scan_pay_access_${profileId}`, 'true');
        if (profileId) {
          await supabase.from('profiles').update({ has_scan_pay_access: true }).eq('id', profileId);
        }
        if (appliedCoupon) {
          await supabase.from('promo_coupons').update({ uses_count: (appliedCoupon.uses_count || 0) + 1 }).eq('id', appliedCoupon.id);
        }
        onUnlockSuccess();
        onClose();
        setIsProcessing(false);
        return;
      }

      let payment_session_id = '';
      const endpoints = [
        'https://admin-portal-zenbudget.vercel.app/api/create-payment-session',
        'https://zenbudget-tracker.vercel.app/api/create-payment-session',
        '/api/create-payment-session'
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: finalPrice,
              planType: 'scan_pay_lifetime',
              userId: profileId,
              email: userEmail,
              phone: userPhone
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.payment_session_id) {
              payment_session_id = data.payment_session_id;
              break;
            }
          }
        } catch (e) {
          console.warn('Cashfree payment session creation error for', url, e);
        }
      }

      if (payment_session_id) {
        launchCashfreeCheckout(
          payment_session_id,
          async (result: any) => {
            // Keep in processing state, wait for webhook
            setPaymentStep('processing');
          },
          (err: any) => {
            console.warn('ScanPay unlock Cashfree error:', err);
            setPaymentStep('initial');
            setIsProcessing(false);
            try { playErrorSound(); } catch (_) {}
            window.dispatchEvent(new CustomEvent('toast-alert', { detail: { message: 'Payment incomplete or cancelled. Please try again.', type: 'error' } }));
          }
        );
      } else {
        // Direct PhonePe / UPI App intent fallback when server payment session is unavailable
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const directUpiUrl = `upi://pay?pa=chandanswaraj7482@okicici&pn=ZenBudget&am=${finalPrice}&cu=INR&tn=Unlock%20Scan%20%26%20Pay%20Lifetime`;
        if (isMobile) {
          try { window.location.href = directUpiUrl; } catch (e) {}
        }
        // Wait for webhook
        setPaymentStep('processing');
      }
    } catch (err: any) {
      setModalErr('An unexpected error occurred. Please try again.');
      setPaymentStep('initial');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const displayPrice = finalPrice === 0 ? 'FREE' : `${currencySymbol}${finalPrice}`;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(2, 4, 12, 0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      zIndex: 99999999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '16px',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        position: 'relative',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(16, 185, 129, 0.25)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Animated gradient background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(145deg, #051a14 0%, #060d1a 40%, #070510 100%)',
          zIndex: 0
        }} />
        {/* Top glow orb */}
        <div style={{
          position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
          width: '220px', height: '220px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />
        {/* Subtle grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          zIndex: 0
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '24px' }}>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: '34px', height: '34px',
              color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <X size={16} />
          </button>

          {paymentStep === 'success' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: '90px', height: '90px',
                background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0.05) 70%)',
                border: '2px solid rgba(16,185,129,0.4)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 40px rgba(16,185,129,0.3)',
                animation: 'pulse 2s infinite'
              }}>
                <ShieldCheck size={42} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>
                🎉 Unlocked!
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
                Scan & Pay is now permanently<br />active on your account.
              </p>
            </div>
          ) : paymentStep === 'processing' ? (
            <div style={{ textAlign: 'center', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Loader2 size={44} className="animate-spin" style={{ color: '#10b981', margin: '0 auto' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>
                Verifying Payment...
              </h2>
              <p style={{ color: '#64748b', fontSize: '12.5px', lineHeight: 1.6, margin: 0 }}>
                Complete the ₹79 payment in your UPI app.<br />
                Tap "Completed" once done.
              </p>
              <button
                onClick={() => {
                  const directUpiUrl = `upi://pay?pa=chandanswaraj7482@okicici&pn=ZenBudget&am=${finalPrice || 79}&cu=INR&tn=Unlock%20Scan%20%26%20Pay`;
                  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                  if (isMobile) window.location.href = directUpiUrl;
                }}
                style={{
                  width: '100%', padding: '13px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 6px 20px rgba(99,102,241,0.4)'
                }}
              >
                <Zap size={16} /> <span>Open PhonePe / GPay ({displayPrice})</span>
              </button>
              <button
                onClick={async () => {
                  const profileId = localStorage.getItem('zb_profile_id') || '';
                  localStorage.setItem('has_scan_pay_access', 'true');
                  if (profileId) {
                    localStorage.setItem(`zb_scan_pay_access_${profileId}`, 'true');
                    try { await supabase.from('profiles').update({ has_scan_pay_access: true }).eq('id', profileId); } catch (e) {}
                  }
                  setPaymentStep('success');
                  setTimeout(() => { onUnlockSuccess(); onClose(); setIsProcessing(false); setPaymentStep('initial'); }, 1500);
                }}
                style={{
                  width: '100%', padding: '12px', borderRadius: '14px',
                  border: '1px solid rgba(16,185,129,0.35)',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#34d399', fontWeight: 800, fontSize: '13px', cursor: 'pointer'
                }}
              >
                ✅ I've Completed the {displayPrice} Payment
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {/* Icon */}
                <div style={{
                  width: '68px', height: '68px', borderRadius: '22px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: '0 12px 32px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}>
                  <QrCode size={32} color="#fff" />
                </div>

                {/* Badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))',
                  border: '1px solid rgba(16,185,129,0.3)',
                  marginBottom: '10px'
                }}>
                  <Zap size={11} color="#34d399" />
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    One-Time Lifetime Unlock
                  </span>
                </div>

                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: '0 0 6px 0', lineHeight: 1.2 }}>
                  Unlock Direct Scan & Pay
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Pay once · Get PhonePe, GPay & Netbanking<br />powered payments — forever!
                </p>
              </div>

              {/* Error */}
              {modalErr && (
                <div style={{
                  padding: '10px 14px', borderRadius: '12px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171', fontSize: '12px', fontWeight: 700, marginBottom: '14px', textAlign: 'center'
                }}>
                  ⚠️ {modalErr}
                </div>
              )}

              {/* Price Card */}
              <div style={{
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)',
                border: '1px solid rgba(16,185,129,0.2)',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '14px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: '-20px', right: '-20px',
                  width: '80px', height: '80px',
                  background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Lifetime Access Price
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '38px', fontWeight: 900, color: '#34d399', lineHeight: 1 }}>
                    {displayPrice}
                  </span>
                  {appliedCoupon && (
                    <span style={{ fontSize: '15px', color: '#475569', textDecoration: 'line-through' }}>{priceFormatted}</span>
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#6ee7b7' }}>/ Lifetime</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>
                  🔒 Zero recurring fees · Pay once, use forever
                </div>
              </div>

              {/* Coupon Input */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="PROMO / COUPON CODE"
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#fff', fontSize: '12px', textTransform: 'uppercase',
                      outline: 'none', letterSpacing: '0.05em'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    style={{
                      padding: '10px 16px', borderRadius: '12px', border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.35)'
                    }}
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <div style={{ fontSize: '11.5px', fontWeight: 700, marginTop: '6px', paddingLeft: '4px', color: couponError ? '#f87171' : '#34d399' }}>
                    {couponMessage}
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {[
                  { icon: '⚡', text: 'Instant 1-Click PhonePe & GPay Launch' },
                  { icon: '🏦', text: 'All 50+ Banks, Netbanking & Credit Cards' },
                  { icon: '🔄', text: 'Auto-sync payment entries into ZenBudget' },
                  { icon: '♾️', text: 'Lifetime access · Zero monthly charges' },
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px'
                    }}>
                      {b.icon}
                    </div>
                    <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>{b.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={handleUnlockPayment}
                disabled={isProcessing}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                  background: finalPrice === 0
                    ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  color: '#fff', fontSize: '15px', fontWeight: 900,
                  cursor: isProcessing ? 'wait' : 'pointer',
                  boxShadow: finalPrice === 0
                    ? '0 8px 28px rgba(234,179,8,0.5)'
                    : '0 8px 28px rgba(16,185,129,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                  animation: 'shimmer 2.5s infinite'
                }} />
                {isProcessing ? (
                  <><Loader2 size={18} className="animate-spin" /> <span>Connecting to Gateway...</span></>
                ) : finalPrice === 0 ? (
                  <span>🎉 Claim 100% Free Lifetime Unlock ✨</span>
                ) : (
                  <><Lock size={16} /> <span>Unlock Lifetime Scan & Pay ({displayPrice}) 🚀</span></>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: '10.5px', color: '#334155', marginTop: '12px', margin: '12px 0 0 0' }}>
                Secured by Cashfree · 100% refund if payment fails
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
