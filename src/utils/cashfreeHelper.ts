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

export const launchCashfreeCheckout = async (
  paymentSessionId: string,
  onSuccess: (res: any) => void,
  onFailure?: (err: any) => void
) => {
  cleanUpCashfreeOverlays();

  const isNative = !!(window as any).Capacitor?.isNativePlatform?.() || (window as any).Capacitor?.platform === 'android' || (window as any).Capacitor?.platform === 'ios';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Fix: For Native Android App or Localhost WebView, open Chrome Custom Tabs via Browser.open
  // This bypasses the Cashfree "https://localhost is not approved" whitelist error!
  if (isNative || isLocalhost) {
    try {
      const { Browser } = await import('@capacitor/browser');
      const payUrl = `https://zenbudget-tracker.vercel.app/pay.html?session_id=${encodeURIComponent(paymentSessionId)}`;
      console.log('Launching Cashfree via Native Browser Chrome Custom Tab:', payUrl);
      await Browser.open({ url: payUrl });
      if (onSuccess) onSuccess({ status: 'launched_in_browser' });
      return;
    } catch (browserErr) {
      console.warn('Browser.open failed, falling back to window.open:', browserErr);
      window.open(`https://zenbudget-tracker.vercel.app/pay.html?session_id=${encodeURIComponent(paymentSessionId)}`, '_blank');
      if (onSuccess) onSuccess({ status: 'launched_in_browser' });
      return;
    }
  }

  if (!(window as any).Cashfree) {
    if (onFailure) onFailure('Cashfree SDK not loaded');
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

  const cf = (window as any).Cashfree({ mode: 'production' });

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
