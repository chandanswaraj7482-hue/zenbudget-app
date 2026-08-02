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

export const launchCashfreeCheckout = (
  paymentSessionId: string,
  onSuccess: (res: any) => void,
  onFailure?: (err: any) => void
) => {
  cleanUpCashfreeOverlays();

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isMobileOrApp = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || !!(window as any).Capacitor;

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

  const redirectTarget = (isLocalhost && !isMobileOrApp) ? '_blank' : '_modal';
  const cf = (window as any).Cashfree({ mode: 'production' });

  // Safety timer: auto remove overlay if stuck on localhost
  const safetyTimer = setTimeout(() => {
    if (isLocalhost) {
      console.warn('Localhost detected: Cashfree overlay check');
      const overlay = document.querySelector('#cf-checkout-iframe-container, .cf-checkout-iframe-container');
      if (overlay) {
        // If iframe is blank or unreachable, clean up after 6s
        cleanUpCashfreeOverlays();
      }
    }
  }, 6000);

  try {
    cf.checkout({
      paymentSessionId: paymentSessionId,
      redirectTarget: redirectTarget
    }).then((result: any) => {
      clearTimeout(safetyTimer);
      cleanUpCashfreeOverlays();
      if (result && result.paymentDetails) {
        onSuccess(result);
      } else {
        if (onFailure) onFailure(result || 'Payment incomplete');
      }
    }).catch((err: any) => {
      clearTimeout(safetyTimer);
      cleanUpCashfreeOverlays();
      if (onFailure) onFailure(err);
    });
  } catch (err: any) {
    clearTimeout(safetyTimer);
    cleanUpCashfreeOverlays();
    if (onFailure) onFailure(err);
  }
};
