import React, { useState } from 'react';
import { X, QrCode, Zap, Check, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';

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
  const [isProcessing, setIsProcessing] = useState(false);

  const [modalErr, setModalErr] = useState('');

  if (!isOpen) return null;

  // Resolve dynamic multi-currency price
  let numPrice = 79;
  let priceFormatted = '₹79';
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
      priceFormatted = `₹${numPrice}`;
    }
  } catch (_) {
    numPrice = 79;
    priceFormatted = '₹79';
  }

  const handleUnlockPayment = async () => {
    setIsProcessing(true);
    setModalErr('');
    try {
      const profileId = localStorage.getItem('zb_profile_id') || '';
      const userEmail = localStorage.getItem('zb_user_email') || '';
      const userPhone = localStorage.getItem('zb_user_phone') || '';

      let payment_session_id = '';
      const endpoints = [
        '/api/create-payment-session',
        'https://zenbudget-tracker.vercel.app/api/create-payment-session',
        'https://admin-portal-zenbudget.vercel.app/api/create-payment-session'
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: numPrice,
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

      if (payment_session_id && (window as any).Cashfree) {
        const cf = (window as any).Cashfree({ mode: 'production' });
        cf.checkout({
          paymentSessionId: payment_session_id,
          redirectTarget: '_modal'
        }).then(async (result: any) => {
          if (result && result.paymentDetails) {
            // Unlock access locally & in DB after payment in Cashfree
            localStorage.setItem(`zb_scan_pay_access_${profileId}`, 'true');
            if (profileId) {
              await supabase.from('profiles').update({ has_scan_pay_access: true }).eq('id', profileId);
            }
            onUnlockSuccess();
            onClose();
          }
          setIsProcessing(false);
        });
      } else {
        // Fallback: Direct UPI App intent launch (PhonePe / GPay / Paytm / Netbanking)
        const upiUrl = `upi://pay?pa=chandanswaraj7482@okicici&pn=ZenBudget&am=${numPrice}&cu=INR&tn=Scan_Pay_Lifetime_Unlock`;
        try { window.location.href = upiUrl; } catch (e) {}
        
        // Unlock access locally & in DB after payment launch
        localStorage.setItem(`zb_scan_pay_access_${profileId}`, 'true');
        if (profileId) {
          await supabase.from('profiles').update({ has_scan_pay_access: true }).eq('id', profileId);
        }
        onUnlockSuccess();
        onClose();
      }
    } catch (err: any) {
      setModalErr(err.message || 'Payment initialization failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}>
            <QrCode size={32} color="#fff" />
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
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '10px 0 4px 0' }}>
            Unlock Direct Scan &amp; Pay
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            Pay once to unlock 1-click Cashfree PhonePe, GPay &amp; Netbanking payments forever!
          </p>
        </div>

        {/* Price Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px',
          padding: '16px', border: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center', marginBottom: '20px'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Lifetime Access Price
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: '#34d399', margin: '4px 0' }}>
            {priceFormatted} <span style={{ fontSize: '14px', fontWeight: 700, color: '#a7f3d0' }}>/ Lifetime</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
            🔒 Zero recurring fees. Pay once, use unlimited forever!
          </div>
        </div>

        {/* Benefits list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          {[
            'Instant 1-Click PhonePe & GPay Direct Intent Launch',
            'Supports All 50+ Banks, Netbanking & Credit Cards',
            'Auto-syncs payment entry directly into ZenBudget',
            'Lifetime updates & zero monthly charges'
          ].map((benefit, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#e2e8f0' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} color="#34d399" />
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
            width: '100%', padding: '16px', borderRadius: '16px',
            border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff', fontSize: '14px', fontWeight: 900, cursor: isProcessing ? 'wait' : 'pointer',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <Zap size={18} /> {isProcessing ? 'Initializing Gateway...' : `Unlock Lifetime Scan & Pay (${priceFormatted}) 🚀`}
        </button>
      </div>
    </div>
  );
};
