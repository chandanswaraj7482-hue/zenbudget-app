import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, Phone, Hash, FileText, Tag, Send } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Capacitor } from '@capacitor/core';
import { checkHasScanPayAccess, handleZenBudgetPaymentSystem } from '../utils/paymentRouter';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  referralCount?: number;
  onPayViaCashfree?: (amount: number, title: string) => void;
}

const CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Health',
  'Education', 'Bills', 'Groceries', 'Travel', 'General'
];

const FEELINGS = [
  { label: 'Happy', emoji: '😀' },
  { label: 'Stressed', emoji: '😭' },
  { label: 'Regret', emoji: '😔' },
  { label: 'Excited', emoji: '😍' },
  { label: 'Neutral', emoji: '😐' },
];

const PAYMENT_TABS = ['Scan QR', 'Mobile', 'Bank A/c', 'UPI ID'];

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onSuccess, onPayViaCashfree }) => {
  if (!isOpen) return null;

  const [activePayTab, setActivePayTab] = useState<'Scan QR' | 'Mobile' | 'Bank A/c' | 'UPI ID'>('Scan QR');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [feeling, setFeeling] = useState('Happy');
  
  // Separate states for each tab
  const [recipientId, setRecipientId] = useState(''); // QR payee address
  const [merchantName, setMerchantName] = useState(''); // QR payee name
  const [payMobile, setPayMobile] = useState(''); // Mobile number
  const [mobileUpiSuffix, setMobileUpiSuffix] = useState('ybl'); // PhonePe by default
  const [payAccNum, setPayAccNum] = useState(''); // Bank Account Number
  const [payIfsc, setPayIfsc] = useState(''); // Bank IFSC Code
  const [payHolderName, setPayHolderName] = useState(''); // Bank Account Holder Name
  const [payUpiIdDirect, setPayUpiIdDirect] = useState(''); // Manually entered UPI ID
  const [_rawQrUrl, setRawQrUrl] = useState(''); // Original QR code URL string

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [validationError, setValidationError] = useState('');

  const showErr = (msg: string) => {
    setValidationError(msg);
    setTimeout(() => setValidationError(''), 4500);
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasDecodedRef = useRef<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if ((window as any).jsQR) {
            const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code && code.data) {
              console.log('Decoded file QR code:', code.data);
              hasDecodedRef.current = true;
              parseUPIQR(code.data);
            } else {
              showErr('Could not find any valid QR code in this image. Please make sure the QR code is clearly visible.');
            }
          } else {
            showErr('QR scanner engine is still loading. Please wait a second and retry.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Dynamically load jsQR library
  useEffect(() => {
    if (activePayTab === 'Scan QR' && isOpen) {
      if (!(window as any).jsQR) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [activePayTab, isOpen]);

  const today = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const startCamera = async () => {
    hasDecodedRef.current = false;
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const { Camera } = await import('@capacitor/camera');
          const status = await Camera.checkPermissions();
          if (status.camera !== 'granted') {
            await Camera.requestPermissions({ permissions: ['camera'] });
          }
        } catch (permErr) {
          console.warn('Capacitor camera permission request error:', permErr);
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Camera API not supported in this environment');
        return;
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
      } catch (e1) {
        console.warn('Ideal environment camera failed, trying fallback video constraints:', e1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        } catch (e2) {
          console.warn('Facing environment failed, trying any video stream:', e2);
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      if (!stream) {
        console.warn('No video stream obtained.');
        return;
      }

      streamRef.current = stream;
      
      let retries = 0;
      const bindVideo = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch(e => console.warn('Video play failed:', e));
          setIsScanning(true);
        } else if (retries < 15) {
          retries++;
          setTimeout(bindVideo, 100);
        }
      };
      bindVideo();
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !isScanning || hasDecodedRef.current) return;
    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if ((window as any).jsQR) {
          const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data && !hasDecodedRef.current) {
            hasDecodedRef.current = true;
            console.log('Found QR code:', code.data);
            stopCamera();
            parseUPIQR(code.data);
            return;
          }
        }
      }
    }
    if (!hasDecodedRef.current) {
      requestRef.current = requestAnimationFrame(scanFrame);
    }
  };

  useEffect(() => {
    if (isScanning) {
      hasDecodedRef.current = false;
      requestRef.current = requestAnimationFrame(scanFrame);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isScanning]);

  const parseUPIQR = (data: string) => {
    try {
      let pa = '';
      let pn = '';
      let am = '';
      let tn = '';

      if (data.startsWith('upi://')) {
        setRawQrUrl(data);
        const queryStr = data.split('?')[1] || '';
        const params = new URLSearchParams(queryStr);
        pa = params.get('pa') || '';
        pn = params.get('pn') || '';
        am = params.get('am') || '';
        tn = params.get('tn') || '';
      } else {
        const queryStr = data.includes('?') ? data.split('?')[1] : data;
        const params = new URLSearchParams(queryStr);
        pa = params.get('pa') || '';
        pn = params.get('pn') || '';
        am = params.get('am') || '';
        tn = params.get('tn') || '';
        if (pa) {
          setRawQrUrl(`upi://pay?${queryStr}`);
        }
      }

      if (pa) {
        setRecipientId(pa);
        let decodedPn = decodeURIComponent(pn.replace(/\+/g, ' ')).trim();
        const vpaDomain = pa.split('@')[1]?.toLowerCase() || '';
        const bankMap: Record<string, string> = {
          okaxis: 'Axis Bank',
          axisbank: 'Axis Bank',
          oksbi: 'State Bank of India',
          sbi: 'State Bank of India',
          sbin: 'State Bank of India',
          okicici: 'ICICI Bank',
          icici: 'ICICI Bank',
          paytm: 'Paytm Payments Bank',
          ybl: 'Yes Bank / PhonePe',
          ibl: 'Yes Bank',
          hdfcbank: 'HDFC Bank',
          okhdfcbank: 'HDFC Bank',
          barodampay: 'Bank of Baroda',
          kotak: 'Kotak Mahindra Bank',
          pnb: 'Punjab National Bank',
          upi: 'UPI Payee'
        };
        const detectedBank = bankMap[vpaDomain];

        if (!decodedPn) {
          decodedPn = detectedBank ? `Merchant (${detectedBank})` : `Payee (${pa})`;
        } else if (detectedBank && !decodedPn.toLowerCase().includes(detectedBank.toLowerCase())) {
          decodedPn = `${decodedPn} (${detectedBank})`;
        }

        setMerchantName(decodedPn);
        if (am) setAmount(am);
        if (tn) setDescription(decodeURIComponent(tn.replace(/\+/g, ' ')).trim());
        setScanResult(`Payee / Bank: ${decodedPn}`);
        stopCamera();
        return;
      }
    } catch (e) {
      console.warn('URL parsing failed, falling back to regex:', e);
    }

    if (data.includes('@')) {
      const vpa = data.trim();
      const vpaDomain = vpa.split('@')[1]?.toLowerCase() || '';
      const bankMap: Record<string, string> = {
        okaxis: 'Axis Bank', oksbi: 'State Bank of India', okicici: 'ICICI Bank',
        paytm: 'Paytm Payments Bank', ybl: 'Yes Bank / PhonePe', okhdfcbank: 'HDFC Bank'
      };
      const detectedBank = bankMap[vpaDomain] || 'UPI Bank Account';
      setRecipientId(vpa);
      setMerchantName(`Payee (${detectedBank})`);
      setScanResult(`UPI ID: ${vpa} (${detectedBank})`);
      stopCamera();
    } else if (/^\d{10}$/.test(data.trim())) {
      setRecipientId(data.trim());
      setScanResult(`Phone: ${data.trim()}`);
      stopCamera();
    }
  };

  const handleManualQRInput = (val: string) => {
    setScanResult(val);
    parseUPIQR(val);
  };

  useEffect(() => {
    if (isOpen && activePayTab === 'Scan QR') {
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activePayTab]);

  const handleMobileChange = (val: string) => {
    if (/^\d*$/.test(val)) setPayMobile(val);
  };

  const buildUPIUrl = (paOverride?: string, schemePrefix?: string) => {
    // 1. If scanned from QR Code and we have raw QR URL, preserve original QR parameters
    if (activePayTab === 'Scan QR' && _rawQrUrl && _rawQrUrl.startsWith('upi://pay?')) {
      let urlObj: URL;
      try {
        urlObj = new URL(_rawQrUrl);
      } catch (e) {
        urlObj = new URL(_rawQrUrl.replace('upi://pay?', 'https://dummy.com/?'));
      }
      
      const searchParams = new URLSearchParams(urlObj.search);
      
      // Update amount if user entered a custom amount
      if (amount && parseFloat(amount) > 0) {
        searchParams.set('am', parseFloat(amount).toFixed(2));
      }
      if (!searchParams.has('cu')) {
        searchParams.set('cu', 'INR');
      }

      let finalQuery = searchParams.toString();
      const prefix = (schemePrefix && schemePrefix !== 'upi://pay?') ? schemePrefix : 'upi://pay?';
      return `${prefix}${finalQuery}`;
    }

    // 2. Manual P2P Payments (Mobile / Bank A/c / UPI ID / Direct VPA)
    let pa = '';
    let pn = '';

    if (paOverride) {
      pa = paOverride.trim();
      pn = merchantName || recipientId || 'Payee';
    } else if (activePayTab === 'Scan QR') {
      pa = recipientId.trim();
      pn = merchantName.trim() || 'Merchant';
    } else if (activePayTab === 'Mobile') {
      const cleanPhone = payMobile.replace(/\D/g, '');

      // User-selected handle extension (e.g., @oksbi, @ybl, @paytm)
      const userHandle = (mobileUpiSuffix || '').replace(/^@/, '').trim();
      // @upi is NPCI universal handle - resolves to any UPI app the recipient uses
      let handle = userHandle || 'upi';

      // Only auto-pair handle if user has NOT manually selected one
      if (!userHandle) {
        if (schemePrefix?.includes('tez') || schemePrefix?.includes('google')) {
          handle = 'okaxis';
        } else if (schemePrefix?.includes('phonepe')) {
          handle = 'ybl';
        } else if (schemePrefix?.includes('paytm')) {
          handle = 'paytm';
        }
      }

      pa = `${cleanPhone}@${handle}`;
      // Use a clean generic name - phone number in pn causes GPay "Cannot pay" error
      pn = payHolderName.trim() || 'User';
    } else if (activePayTab === 'Bank A/c') {
      const cleanAcc = payAccNum.replace(/\D/g, '');
      const cleanIfsc = payIfsc.trim().toUpperCase();
      pa = cleanIfsc ? `${cleanAcc}@${cleanIfsc}.ifsc.npci` : `${cleanAcc}@upi`;
      pn = payHolderName.trim() || 'Bank Transfer';
    } else if (activePayTab === 'UPI ID') {
      pa = payUpiIdDirect.trim();
      pn = 'Recipient';
    } else {
      pa = recipientId.trim() || 'merchant@upi';
      pn = merchantName.trim() || 'Merchant';
    }

    // Clean VPA (lowercase, no spaces, allowed chars only)
    const cleanPa = (pa || 'chandanswaraj7482@okaxis').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9@._-]/g, '');
    
    // Payee name (alphanumeric only, no %20 encoding to prevent GPay Intent parse error)
    const sanitizedPn = (pn || 'ZenBudget').replace(/[^a-zA-Z0-9]/g, '').trim().slice(0, 30) || 'ZenBudget';

    // Format amount cleanly: clean integer for whole numbers (e.g. '1'), 2 decimals for fractions (e.g. '1.50')
    let amountStr = '';
    if (amount && parseFloat(amount) > 0) {
      const val = parseFloat(amount);
      amountStr = (val % 1 === 0) ? Math.round(val).toString() : val.toFixed(2);
    }

    // 100% Official NPCI Full Specification URL (tr = Ref ID, tid = Txn ID, mode=00 for P2P)
    const tr = `ZB${Date.now().toString().slice(-10)}`;
    const tid = `T${Date.now().toString().slice(-10)}`;
    let params = `pa=${cleanPa}&pn=${sanitizedPn}&tr=${tr}&tid=${tid}&mode=00&cu=INR`;
    if (amountStr) params += `&am=${amountStr}`;

    const sanitizedDesc = (description.trim() || 'Payment').replace(/[^a-zA-Z0-9]/g, '').slice(0, 30);
    if (sanitizedDesc) params += `&tn=${sanitizedDesc}`;

    const scheme = (schemePrefix && schemePrefix !== 'upi://pay?') ? schemePrefix : 'upi://pay?';
    return `${scheme}${params}`;
  };

  const redirectToUPI = (upiUrl: string) => {
    console.log('🚀 Launching UPI URL synchronously:', upiUrl);

    // Universal Mobile Number Quick Router (Bypassing UPI Extension UI)
    if (activePayTab === 'Mobile') {
      const cleanPhone = payMobile.replace(/\D/g, '');
      const amtVal = parseFloat(amount) || 0;
      const phonePeDirectUrl = `phonepe://pay?phone=${cleanPhone}&am=${amtVal}&cu=INR`;
      const defaultUpiUrl = buildUPIUrl(`${cleanPhone}@ybl`);

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = phonePeDirectUrl;
        setTimeout(() => {
          window.location.href = defaultUpiUrl;
        }, 500);
      } else {
        window.location.href = defaultUpiUrl;
      }
      return;
    }

    let finalUrl = upiUrl;
    const isGPay = upiUrl.includes('tez') || upiUrl.includes('google') || upiUrl.includes('package=com.google.android.apps.nbu.paisa.user');
    const isPhonePe = upiUrl.includes('phonepe') || upiUrl.includes('package=com.phonepe.app');
    const isPaytm = upiUrl.includes('paytm') || upiUrl.includes('package=net.one97.paytm');
    const isBhim = upiUrl.includes('bhim') || upiUrl.includes('package=in.org.npci.upiapp');
    const isCred = upiUrl.includes('cred') || upiUrl.includes('package=com.dreamplug.android.cred');

    // Auto copy VPA to clipboard as instant fallback
    try {
      const matchPa = finalUrl.match(/pa=([^&]+)/);
      if (matchPa && matchPa[1] && navigator.clipboard) {
        navigator.clipboard.writeText(decodeURIComponent(matchPa[1])).catch(() => {});
      }
    } catch (e) {}

    const cleanParams = finalUrl.includes('?') ? finalUrl.split('?')[1] : finalUrl;

    let androidIntent = `intent://pay?${cleanParams}#Intent;scheme=upi;end;`;
    if (isGPay) {
      androidIntent = `intent://pay?${cleanParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
    } else if (isPhonePe) {
      androidIntent = `intent://pay?${cleanParams}#Intent;scheme=upi;package=com.phonepe.app;end;`;
    } else if (isPaytm) {
      androidIntent = `intent://pay?${cleanParams}#Intent;scheme=upi;package=net.one97.paytm;end;`;
    } else if (isBhim) {
      androidIntent = `intent://pay?${cleanParams}#Intent;scheme=upi;package=in.org.npci.upiapp;end;`;
    } else if (isCred) {
      androidIntent = `intent://pay?${cleanParams}#Intent;scheme=upi;package=com.dreamplug.android.cred;end;`;
    }

    // Direct Intent launch for Android
    try {
      window.location.href = isGPay || isPhonePe || isPaytm || isBhim || isCred ? androidIntent : finalUrl;
    } catch (e) {}

    // Fallback anchor click dispatch
    try {
      const a1 = document.createElement('a');
      a1.href = finalUrl;
      a1.setAttribute('target', '_system');
      a1.setAttribute('rel', 'noopener');
      document.body.appendChild(a1);
      a1.click();
      setTimeout(() => { try { document.body.removeChild(a1); } catch (_) {} }, 300);
    } catch (e) {}
  };

  const handleLogOnly = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showErr('Please enter a valid expense amount.');
      return;
    }
    const profileId = localStorage.getItem('zb_profile_id');
    let finalTitle = description.trim();
    if (!finalTitle) {
      if (activePayTab === 'Mobile') {
        finalTitle = `Mobile Pay to ${payMobile}`;
      } else if (activePayTab === 'Bank A/c') {
        finalTitle = `Bank Transfer to ${payHolderName || payAccNum}`;
      } else if (activePayTab === 'UPI ID') {
        finalTitle = `UPI Pay to ${payUpiIdDirect}`;
      } else {
        finalTitle = merchantName || 'Expense Transaction';
      }
    }
    if (profileId) {
      try {
        await supabase.from('transactions').insert([{
          user_id: profileId,
          title: finalTitle,
          amount: parseFloat(amount),
          category: category.toLowerCase() as any,
          notes: feeling,
          date: today,
          type: 'expense'
        }]);
      } catch (e) {}
    }
    if (onSuccess) onSuccess();
    stopCamera();
    onClose();
  };

  const handleProceedToPayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      showErr('Please enter a valid expense amount.');
      return;
    }
    if (activePayTab === 'Scan QR' && !recipientId) {
      if (payUpiIdDirect.trim()) {
        parseUPIQR(payUpiIdDirect.trim());
      } else {
        setRecipientId('chandanswaraj7482@okicici');
        setMerchantName('ZenBudget Payee');
      }
    }
    if (activePayTab === 'Mobile' && payMobile.replace(/\D/g, '').length !== 10) {
      showErr('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (activePayTab === 'Bank A/c' && (!payAccNum.trim() || !payIfsc.trim())) {
      showErr('Please enter Bank Account Number and IFSC Code.');
      return;
    }
    if (activePayTab === 'UPI ID' && !payUpiIdDirect.includes('@')) {
      showErr('Please enter a valid UPI ID (e.g. user@okaxis).');
      return;
    }
    setStep('payment');
  };

  const handlePay = (paOverride?: string, schemePrefix?: string) => {
    if (isPaying) return;
    setIsPaying(true);

    const upiUrl = buildUPIUrl(paOverride, schemePrefix);
    console.log('Built UPI URL:', upiUrl);

    // CRITICAL: Launch UPI app IMMEDIATELY synchronously inside user click handler
    // Never await async network operations before launching UPI, or Android/Chrome will block the deep link!
    redirectToUPI(upiUrl);

    // Save transaction to Supabase in background (non-blocking)
    try {
      const profileId = localStorage.getItem('zb_profile_id');
      if (profileId) {
        let finalTitle = description.trim();
        if (!finalTitle) {
          if (activePayTab === 'Mobile') {
            finalTitle = `UPI Pay to ${payMobile}@${mobileUpiSuffix}`;
          } else if (activePayTab === 'Bank A/c') {
            finalTitle = `Bank Transfer to ${payHolderName || payAccNum}`;
          } else if (activePayTab === 'UPI ID') {
            finalTitle = `UPI Pay to ${payUpiIdDirect}`;
          } else {
            finalTitle = `UPI Pay to ${merchantName || recipientId}`;
          }
        }
        (async () => {
          try {
            await supabase.from('transactions').insert([{
              user_id: profileId,
              title: finalTitle,
              amount: parseFloat(amount),
              category: category.toLowerCase() as any,
              notes: feeling,
              date: today,
              type: 'expense'
            }]);
            if (onSuccess) onSuccess();
          } catch (err: any) {
            console.warn('Supabase save background error:', err);
          }
        })();
      }
    } catch (err) {
      console.warn('Supabase payload preparation error:', err);
    }

    setTimeout(() => {
      setIsPaying(false);
      onClose();
    }, 2000);
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      zIndex: 9999999, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease-out', padding: '0'
    }}>
      <div style={{
        width: '100%', maxWidth: '440px', background: 'var(--bg-card)',
        borderRadius: '28px 28px 0 0', padding: '0 0 32px',
        maxHeight: '92vh', overflowY: 'auto', border: '1px solid var(--border-card)',
        borderBottom: 'none', position: 'relative', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Sticky Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 30, background: 'var(--bg-card)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--border-input)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={20} color="var(--primary)" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Scan & Pay</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{todayDisplay}</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => { stopCamera(); onClose(); }} 
            style={{
              background: 'var(--bg-input)', border: '1px solid var(--border-input)',
              borderRadius: '50%', width: '34px', height: '34px', color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {step === 'details' && (
          <div style={{ padding: '20px' }}>
            {/* Custom Glassmorphic Validation Error Banner */}
            {validationError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                borderRadius: '14px',
                padding: '12px 14px',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 0.2s ease-out',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
              }}>
                <span style={{ fontSize: '14px' }}>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Payment method tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'var(--bg-input)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border-input)' }}>
              {PAYMENT_TABS.map(tab => (
                <button key={tab} type="button" onClick={() => setActivePayTab(tab as any)} style={{
                  flex: 1, padding: '9px 4px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                  background: activePayTab === tab ? 'var(--primary)' : 'transparent',
                  color: activePayTab === tab ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: activePayTab === tab ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* QR Scanner Area */}
            {activePayTab === 'Scan QR' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  height: '210px', borderRadius: '18px', overflow: 'hidden', position: 'relative',
                  background: '#09090b', border: '2px solid rgba(34,197,94,0.4)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }}>
                  <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                  {!isScanning && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <QrCode size={30} color="var(--primary)" />
                      </div>
                      <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800 }}>
                        Point Camera to QR or Upload Image
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', maxWidth: '280px', lineHeight: 1.4 }}>
                        Tap "Start Camera" or "Upload QR Image" to auto-detect merchant & amount!
                      </span>
                    </div>
                  )}
                  {/* Corner brackets for scan effect */}
                  {isScanning && (
                    <>
                      <div style={{ position: 'absolute', top: 16, left: 16, width: '32px', height: '32px', borderTop: '3px solid #22c55e', borderLeft: '3px solid #22c55e', borderRadius: '4px' }} />
                      <div style={{ position: 'absolute', top: 16, right: 16, width: '32px', height: '32px', borderTop: '3px solid #22c55e', borderRight: '3px solid #22c55e', borderRadius: '4px' }} />
                      <div style={{ position: 'absolute', bottom: 16, left: 16, width: '32px', height: '32px', borderBottom: '3px solid #22c55e', borderLeft: '3px solid #22c55e', borderRadius: '4px' }} />
                      <div style={{ position: 'absolute', bottom: 16, right: 16, width: '32px', height: '32px', borderBottom: '3px solid #22c55e', borderRight: '3px solid #22c55e', borderRadius: '4px' }} />
                      
                      {/* High-contrast instruction badge */}
                      <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, textAlign: 'center' }}>
                        <span style={{
                          background: 'rgba(0, 0, 0, 0.75)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '5px 14px',
                          borderRadius: '20px',
                          display: 'inline-block',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                          📷 Point camera at QR code • Auto-detects details
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Upload Image / Real QR Code Scan / Camera Controls */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={startCamera}
                    style={{
                      flex: 1,
                      padding: '11px 12px',
                      borderRadius: '12px',
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    📷 Start Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    style={{
                      flex: 1,
                      padding: '11px 12px',
                      borderRadius: '12px',
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px dashed var(--primary)',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    📸 Upload QR Image
                  </button>
                </div>

                {scanResult && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(34,197,94,0.12)', borderRadius: '12px', fontSize: '12px', color: 'var(--primary)', fontWeight: 700, border: '1px solid rgba(34,197,94,0.3)' }}>
                    {scanResult}
                  </div>
                )}
                {scanResult && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(34,197,94,0.12)', borderRadius: '12px', fontSize: '12px', color: 'var(--primary)', fontWeight: 700, border: '1px solid rgba(34,197,94,0.3)' }}>
                    {scanResult}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', borderRadius: '14px', padding: '12px 16px', border: '1px solid var(--border-input)', marginTop: '10px' }}>
                  <QrCode size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    className="unadorned-input"
                    placeholder="Or paste UPI QR text / UPI ID here..."
                    onChange={e => handleManualQRInput(e.target.value)}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)',
                      fontSize: '13px', fontWeight: 600, outline: 'none', padding: '4px 6px'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mobile Number Tab */}
            {activePayTab === 'Mobile' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Mobile Number</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', borderRadius: '14px', padding: '12px 16px', border: '1px solid var(--border-input)' }}>
                  <Phone size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <input
                    type="tel"
                    className="unadorned-input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter 10-digit mobile number"
                    value={payMobile}
                    onChange={e => handleMobileChange(e.target.value)}
                    maxLength={10}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 800, outline: 'none', letterSpacing: '0.08em', fontFamily: "'Manrope', sans-serif", padding: '4px 6px' }}
                  />
                  {payMobile.length === 10 && (
                    <span style={{ fontSize: '16px' }}>✅</span>
                  )}
                </div>
              </div>
            )}

            {/* Bank A/c Tab */}
            {activePayTab === 'Bank A/c' && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Account Number</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', borderRadius: '14px', padding: '12px 16px', border: '1px solid var(--border-input)' }}>
                    <Hash size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                    <input type="text" className="unadorned-input" inputMode="numeric" placeholder="Enter account number" value={payAccNum} onChange={e => setPayAccNum(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, outline: 'none', padding: '4px 6px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Bank IFSC Code</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', borderRadius: '14px', padding: '12px 16px', border: '1px solid var(--border-input)' }}>
                    <input type="text" className="unadorned-input" placeholder="e.g. SBIN0004561" value={payIfsc} onChange={e => setPayIfsc(e.target.value.toUpperCase())} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, outline: 'none', padding: '4px 6px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Account Holder Name</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', borderRadius: '14px', padding: '12px 16px', border: '1px solid var(--border-input)' }}>
                    <input type="text" className="unadorned-input" placeholder="Merchant / Person name" value={payHolderName} onChange={e => setPayHolderName(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, outline: 'none', padding: '4px 6px' }} />
                  </div>
                </div>
              </div>
            )}

            {/* UPI ID Tab */}
            {activePayTab === 'UPI ID' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>UPI ID</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', borderRadius: '14px', padding: '12px 16px', border: '1px solid var(--border-input)' }}>
                  <input type="text" className="unadorned-input" placeholder="name@upi" value={payUpiIdDirect} onChange={e => setPayUpiIdDirect(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, outline: 'none', padding: '4px 6px' }} />
                </div>
              </div>
            )}

            {/* Amount */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Amount (₹)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', borderRadius: '14px', padding: '12px 18px', border: '1px solid var(--border-input)' }}>
                <span style={{ fontSize: '24px', color: 'var(--primary)', fontWeight: 900, minWidth: '22px' }}>₹</span>
                <input
                  type="text"
                  className="unadorned-input"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = clean.split('.');
                    if (parts.length > 2) return;
                    setAmount(clean);
                  }}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '22px', fontWeight: 900, outline: 'none', fontFamily: "'Manrope', sans-serif", padding: '2px 8px' }}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Description</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', borderRadius: '14px', padding: '12px 18px', border: '1px solid var(--border-input)' }}>
                <FileText size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <input type="text" className="unadorned-input" placeholder="What is this for?" value={description} onChange={e => setDescription(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', padding: '2px 8px' }} />
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Category</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', borderRadius: '14px', padding: '12px 18px', border: '1px solid var(--border-input)' }}>
                <Tag size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <select value={category} className="unadorned-input" onChange={e => setCategory(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, outline: 'none', cursor: 'pointer', padding: '2px 8px' }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Feeling */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>How does this feel?</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {FEELINGS.map(f => (
                  <button key={f.label} type="button" onClick={() => setFeeling(f.label)} style={{
                    padding: '8px 14px', borderRadius: '12px',
                    border: feeling === f.label ? '2px solid var(--primary)' : '1px solid var(--border-input)',
                    background: feeling === f.label ? 'rgba(34,197,94,0.15)' : 'var(--bg-input)',
                    color: feeling === f.label ? 'var(--primary)' : 'var(--text-primary)',
                    fontSize: '12px', cursor: 'pointer', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: feeling === f.label ? '0 2px 8px rgba(34,197,94,0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}>
                    <span>{f.emoji}</span> <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Cashfree Direct Pay & Standard UPI Proceed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '10px' }}>
              <button 
                type="button"
                onClick={() => {
                  const numAmt = parseFloat(amount) || 0;
                  if (isNaN(numAmt) || numAmt <= 0) {
                    showErr('Please enter a valid payment amount (e.g. ₹100).');
                    return;
                  }

                  let actionType: 'SCAN_OR_UPI' | 'MOBILE_NUMBER' | 'BANK_TRANSFER' = 'SCAN_OR_UPI';
                  let payloadData: any = { amount: numAmt };

                  if (activePayTab === 'Mobile') {
                    if (!payMobile || payMobile.length !== 10) {
                      showErr('Please enter a valid 10-digit mobile number.');
                      return;
                    }
                    actionType = 'MOBILE_NUMBER';
                    payloadData.phone = payMobile;
                    payloadData.upiSuffix = mobileUpiSuffix;
                    payloadData.targetUpiId = `${payMobile}@${mobileUpiSuffix}`;
                  } else if (activePayTab === 'Bank A/c') {
                    if (!payAccNum || !payIfsc) {
                      showErr('Please enter Bank Account Number and IFSC Code.');
                      return;
                    }
                    actionType = 'BANK_TRANSFER';
                    payloadData.accountNumber = payAccNum;
                    payloadData.ifsc = payIfsc;
                    payloadData.recipientName = payHolderName;
                  } else {
                    const finalVpa = recipientId || payUpiIdDirect || 'chandanswaraj7482@okicici';
                    actionType = 'SCAN_OR_UPI';
                    payloadData.targetUpiId = finalVpa;
                    payloadData.recipientName = merchantName || 'ZenBudget Payee';
                    payloadData.rawUpiUri = qrData;
                  }

                  handleZenBudgetPaymentSystem(actionType, payloadData);
                  stopCamera();
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                  letterSpacing: '0.02em'
                }}
              >
                <span>⚡ Pay via Cashfree / PhonePe</span>
              </button>

              {/* Standard UPI Direct Button */}
              <button 
                type="button"
                onClick={handleProceedToPayment}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-input)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Proceed via Standard UPI Apps</span>
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ padding: '20px', background: 'var(--bg-input)', borderRadius: '20px', border: '1px solid var(--border-input)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>PAYING TO</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px' }}>
                {merchantName || recipientId || (activePayTab === 'Mobile' ? `+91 ${payMobile}` : (activePayTab === 'Bank A/c' ? payHolderName || payAccNum : payUpiIdDirect)) || 'Merchant'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                {recipientId || (activePayTab === 'Mobile' ? `${payMobile}@${mobileUpiSuffix}` : (activePayTab === 'Bank A/c' ? `A/C: ${payAccNum} (${payIfsc})` : payUpiIdDirect))}
              </p>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)' }}>
                ₹{amount || '0'}
              </div>
            </div>

            {/* Direct Pay button via Cashfree */}
            <button
              type="button"
              onClick={() => {
                const numAmt = parseFloat(amount) || 0;
                let targetVpa = recipientId || payUpiIdDirect;
                if (activePayTab === 'Mobile') targetVpa = `${payMobile}@${mobileUpiSuffix}`;
                if (activePayTab === 'Bank A/c') targetVpa = `${payAccNum}@${payIfsc.toUpperCase()}.ifsc.npci`;
                
                handlePay(targetVpa);
                stopCamera();
                onClose();
              }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
              }}
            >
              <span>⚡ Launch PhonePe / UPI App</span>
            </button>

            {/* App specific shortcuts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  let targetVpa = recipientId || payUpiIdDirect;
                  if (activePayTab === 'Mobile') targetVpa = `${payMobile}@${mobileUpiSuffix}`;
                  handlePay(targetVpa, 'phonepe');
                  stopCamera();
                  onClose();
                }}
                style={{ padding: '12px 6px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
              >
                <span>🟣</span>
                <span>PhonePe</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  let targetVpa = recipientId || payUpiIdDirect;
                  if (activePayTab === 'Mobile') targetVpa = `${payMobile}@${mobileUpiSuffix}`;
                  handlePay(targetVpa, 'gpay');
                  stopCamera();
                  onClose();
                }}
                style={{ padding: '12px 6px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
              >
                <span>🔵</span>
                <span>Google Pay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  let targetVpa = recipientId || payUpiIdDirect;
                  if (activePayTab === 'Mobile') targetVpa = `${payMobile}@${mobileUpiSuffix}`;
                  handlePay(targetVpa, 'paytm');
                  stopCamera();
                  onClose();
                }}
                style={{ padding: '12px 6px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
              >
                <span>🔷</span>
                <span>Paytm</span>
              </button>
            </div>

            {/* Copy VPA Fallback */}
            <button
              type="button"
              onClick={() => {
                const targetVpa = recipientId || (activePayTab === 'Mobile' ? `${payMobile}@${mobileUpiSuffix}` : payUpiIdDirect);
                if (targetVpa) {
                  navigator.clipboard.writeText(targetVpa);
                  showErr(`✅ Copied UPI VPA (${targetVpa}) to clipboard!`);
                } else {
                  showErr('No UPI VPA available to copy.');
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: '1px dashed var(--border-input)',
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              📋 Copy Payee UPI ID / VPA
            </button>

            <button type="button" onClick={() => setStep('details')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
              ← Edit Details
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
