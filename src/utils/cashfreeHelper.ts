export const removeCashfreeEmergencyButton = () => {
  try {
    const btn = document.getElementById('cf-emergency-close-btn');
    if (btn) btn.remove();
  } catch (e) {}
};

export const cleanUpCashfreeOverlays = () => {
  try {
    const selectors = [
      '#cf-checkout-iframe-container',
      '.cf-checkout-iframe-container',
      'div[id*="cashfree"]',
      'div[class*="cashfree"]',
      'iframe[src*="cashfree"]'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });
    removeCashfreeEmergencyButton();
  } catch (e) {}
};

export const ensurePaymentSdkLoaded = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if ((window as any).Cashfree) return true;
  return new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      // Load SDK dynamically on web only
      script.src = 'https://sdk.cash' + 'free.com/js/v3/cash' + 'free.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    } catch (_) {
      resolve(false);
    }
  });
};

export const launchCashfreeCheckout = async (
  paymentSessionId: string,
  onSuccess: (res: any) => void,
  onFailure?: (err: any) => void,
  environment?: string
) => {
  cleanUpCashfreeOverlays();

  const isNative = !!(window as any).Capacitor?.isNativePlatform?.() || (window as any).Capacitor?.platform === 'android' || (window as any).Capacitor?.platform === 'ios';

  // For Native Android App: Open secure browser session via Browser.open
  if (isNative) {
    try {
      const { Browser } = await import('@capacitor/browser');
      const payUrl = `https://zenbudget-tracker.vercel.app/pay.html?session_id=${encodeURIComponent(paymentSessionId)}`;
      await Browser.open({ url: payUrl });
      return;
    } catch (browserErr) {
      window.open(`https://zenbudget-tracker.vercel.app/pay.html?session_id=${encodeURIComponent(paymentSessionId)}`, '_blank');
      return;
    }
  }

  // On Web: Ensure SDK is loaded
  const loaded = await ensurePaymentSdkLoaded();
  if (!loaded || !(window as any).Cashfree) {
    if (onFailure) onFailure('Payment Gateway SDK not loaded');
    return;
  }

  // Inject Emergency Floating Close Button on top of Cashfree overlay
  try {
    removeCashfreeEmergencyButton();
    const closeBtn = document.createElement('button');
    closeBtn.id = 'cf-emergency-close-btn';
    closeBtn.innerText = '✕ Close Payment Overlay';
    closeBtn.style.cssText = `
      position: fixed !important;
      top: 16px !important;
      right: 16px !important;
      z-index: 20000000 !important;
      padding: 10px 18px !important;
      border-radius: 30px !important;
      background: rgba(239, 68, 68, 0.95) !important;
      color: #ffffff !important;
      font-size: 13px !important;
      font-weight: 800 !important;
      border: 1px solid rgba(255, 255, 255, 0.4) !important;
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5) !important;
      cursor: pointer !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      letter-spacing: 0.02em !important;
    `;
    closeBtn.onclick = () => {
      cleanUpCashfreeOverlays();
      if (onFailure) onFailure('User closed Cashfree overlay');
    };
    document.body.appendChild(closeBtn);
  } catch (e) {}

  // Determine mode: if environment is explicitly sandbox, or if it's localhost, or if payment session looks like sandbox.
  // Sometimes sandbox sessions start with session_xxx
  const mode = (environment === 'sandbox' || paymentSessionId.includes('sandbox')) ? 'sandbox' : 'production';
  const cf = (window as any).Cashfree({ mode });

  try {
    cf.checkout({
      paymentSessionId: paymentSessionId,
      redirectTarget: '_modal'
    }).then((result: any) => {
      cleanUpCashfreeOverlays();
      if (result && result.paymentDetails) {
        onSuccess(result);
      } else {
        if (onFailure) onFailure(result || 'Payment incomplete');
      }
    }).catch((err: any) => {
      cleanUpCashfreeOverlays();
      if (onFailure) onFailure(err);
    });
  } catch (err: any) {
    cleanUpCashfreeOverlays();
    if (onFailure) onFailure(err);
  }
};
