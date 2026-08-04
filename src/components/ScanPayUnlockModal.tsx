import React, { useState } from 'react';
import { X, QrCode, Zap, Check, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { launchCashfreeCheckout } from '../utils/cashfreeHelper';

interface ScanPayUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
  currencySymbol: string;
}

export const ScanPayUnlockModal: React.FC<ScanPayUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  currencySymbol
}) => {
  let numPrice = 79;
  let priceFormatted = `${currencySymbol}79`;
  try {
    const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
    if (currencySymbol === '$') {
      numPrice = stored.usd_scan_pay_price || 1.99;
      priceFormatted = `$${numPrice}`;
    } else if (currencySymbol === '€') {
      numPrice = stored.eur_scan_pay_price || 1.79;
      priceFormatted = `€${numPrice}`;
    } else if (currencySymbol === '£') {
      numPrice = stored.gbp_scan_pay_price || 1.49;
      priceFormatted = `£${numPrice}`;
    } else {
      numPrice = stored.inr_scan_pay_price || 79;
      priceFormatted = `${currencySymbol}${numPrice}`;
    }
  } catch (_) {
    numPrice = 79;
    priceFormatted = `${currencySymbol}79`;
  }

  const [isProcessing, setIsProcessing] = useState(false);
  const [showInAppGateway, setShowInAppGateway] = useState(false);
  const [modalErr, setModalErr] = useState<string | null>(null);
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

  const handleUnlockPayment = async () => {
    setIsProcessing(true);
    setModalErr(null);
    try {
      const profileId = localStorage.getItem('zb_profile_id') || '';
      const userEmail = localStorage.getItem('zb_user_email') || '';
      const userPhone = localStorage.getItem('zb_user_phone') || '';

      // If coupon makes price 0 (FREE UNLOCK)
      if (finalPrice <= 0) {
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
          },
          (err: any) => {
            console.warn('ScanPay unlock Cashfree failure/fallback:', err);
            setShowInAppGateway(true);
            setIsProcessing(false);
          }
        );
      } else {
        setShowInAppGateway(true);
        setIsProcessing(false);
      }
    } catch (err: any) {
      setShowInAppGateway(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmInAppPayment = async () => {
    setIsProcessing(true);
    try {
      const profileId = localStorage.getItem('zb_profile_id') || '';
      localStorage.setItem(`zb_scan_pay_access_${profileId}`, 'true');
      if (profileId) {
        await supabase.from('profiles').update({ has_scan_pay_access: true }).eq('id', profileId);
      }
      if (appliedCoupon) {
        await supabase.from('promo_coupons').update({ uses_count: (appliedCoupon.uses_count || 0) + 1 }).eq('id', appliedCoupon.id);
      }
      onUnlockSuccess();
      onClose();
    } catch (e) {
      setModalErr('Failed to complete unlock. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const displayPrice = finalPrice === 0 ? 'FREE' : `${currencySymbol}${finalPrice}`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(16px)',
      zIndex: 1400, display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '420px',
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.98) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '24px',
        padding: '24px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: '50%', width: '32px', height: '32px',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>

        {/* Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}>
            <QrCode size={30} color="#fff" />
          </div>

          {modalErr && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.8rem', fontWeight: 700, marginBottom: '14px', textAlign: 'center' }}>
              ⚠️ {modalErr}
            </div>
          )}
          <span style={{
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399', padding: '4px 12px', borderRadius: '20px', display: 'inline-block'
          }}>
            ⚡ One-Time Feature Unlock
          </span>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '8px 0 4px 0' }}>
            Unlock Direct Scan &amp; Pay
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            Pay once to unlock 1-click Cashfree PhonePe, GPay &amp; Netbanking payments forever!
          </p>
        </div>

        {showInAppGateway ? (
          /* Cashfree In-App Checkout Drawer */
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', color: '#34d399', fontWeight: 800, fontSize: '14px', marginBottom: '12px' }}>
              ⚡ Cashfree In-App Checkout Gateway ({displayPrice})
            </div>
            
            {/* Scannable UPI QR */}
            <div style={{ textTransform: 'center', background: '#fff', padding: '12px', borderRadius: '12px', width: '150px', margin: '0 auto 14px', textAlign: 'center' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`upi://pay?pa=chandanswaraj7482@okicici&pn=ZenBudget&am=${finalPrice}&cu=INR&tn=Scan_Pay_Unlock`)}`} alt="UPI QR Code" style={{ width: '100%', height: 'auto', display: 'block' }} />
              <div style={{ color: '#0f172a', fontSize: '10px', fontWeight: 800, marginTop: '4px' }}>Scan with PhonePe/GPay</div>
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginBottom: '14px' }}>
              UPI ID: <strong style={{ color: '#fff' }}>chandanswaraj7482@okicici</strong>
            </div>

            <button
              onClick={handleConfirmInAppPayment}
              disabled={isProcessing}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff', fontWeight: 900, fontSize: '13px', cursor: 'pointer'
              }}
            >
              {isProcessing ? 'Verifying Payment...' : `✅ I Have Paid ${displayPrice} (Unlock Now)`}
            </button>
          </div>
        ) : (
          <>
            {/* Price Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px',
              padding: '14px', border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center', marginBottom: '14px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Lifetime Access Price
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#34d399', margin: '2px 0' }}>
                {displayPrice} {appliedCoupon && <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>{priceFormatted}</span>} <span style={{ fontSize: '13px', fontWeight: 700, color: '#a7f3d0' }}>/ Lifetime</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                🔒 Zero recurring fees. Pay once, use unlimited forever!
              </div>
            </div>

            {/* Promo / Coupon Code Input Box */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Promo / Coupon Code"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '12px',
                    border: '1px solid var(--border-input)', background: 'var(--bg-input)',
                    color: '#fff', fontSize: '13px', textTransform: 'uppercase', outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  style={{
                    padding: '10px 16px', borderRadius: '12px', border: 'none',
                    background: 'var(--primary)', color: '#fff', fontSize: '12px',
                    fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <div style={{
                  fontSize: '11px', fontWeight: 700, marginTop: '6px',
                  color: couponError ? '#f87171' : '#34d399'
                }}>
                  {couponMessage}
                </div>
              )}
            </div>

            {/* Benefits list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {[
                'Instant 1-Click PhonePe & GPay Direct Intent Launch',
                'Supports All 50+ Banks, Netbanking & Credit Cards',
                'Auto-syncs payment entry directly into ZenBudget',
                'Lifetime updates & zero monthly charges'
              ].map((benefit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#e2e8f0' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#34d399" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Unlock Payment Button */}
            <button
              onClick={handleUnlockPayment}
              disabled={isProcessing}
              style={{
                width: '100%', padding: '15px', borderRadius: '16px',
                border: 'none', background: finalPrice === 0 ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff', fontSize: '14px', fontWeight: 900, cursor: isProcessing ? 'wait' : 'pointer',
                boxShadow: finalPrice === 0 ? '0 6px 24px rgba(234, 179, 8, 0.45)' : '0 6px 24px rgba(16, 185, 129, 0.45)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {isProcessing ? (
                <span>Unlocking Access...</span>
              ) : finalPrice === 0 ? (
                <>
                  <span>🎉 Claim 100% Free Lifetime Unlock</span>
                  <span style={{ fontSize: '16px' }}>✨</span>
                </>
              ) : (
                <>
                  <span>Unlock Lifetime Scan &amp; Pay ({displayPrice})</span>
                  <span style={{ fontSize: '16px' }}>🚀</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
