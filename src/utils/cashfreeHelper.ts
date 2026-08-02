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
  } catch (e) {}
};

export const launchCashfreeCheckout = (
  paymentSessionId: string,
  onSuccess: (res: any) => void,
  onFailure?: (err: any) => void
) => {
  if (!(window as any).Cashfree) {
    if (onFailure) onFailure('Cashfree SDK not loaded');
    return;
  }

  // Ensure any previous dark overlays are removed
  cleanUpCashfreeOverlays();

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isMobileOrApp = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || !!(window as any).Capacitor;
  const redirectTarget = (isLocalhost && !isMobileOrApp) ? '_blank' : '_modal';

  const cf = (window as any).Cashfree({ mode: 'production' });

  // Auto safety timeout to clean up overlay if iframe fails or is blocked on localhost
  const safetyTimer = setTimeout(() => {
    const overlay = document.querySelector('#cf-checkout-iframe-container, .cf-checkout-iframe-container');
    if (overlay && isLocalhost) {
      console.warn('Cashfree overlay stuck on localhost, cleaning up DOM');
      cleanUpCashfreeOverlays();
    }
  }, 4000);

  cf.checkout({
    paymentSessionId: paymentSessionId,
    redirectTarget: redirectTarget
  }).then((result: any) => {
    clearTimeout(safetyTimer);
    if (result && result.paymentDetails) {
      onSuccess(result);
    } else {
      cleanUpCashfreeOverlays();
      if (onFailure) onFailure(result || 'Payment incomplete');
    }
  }).catch((err: any) => {
    clearTimeout(safetyTimer);
    cleanUpCashfreeOverlays();
    if (onFailure) onFailure(err);
  });
};
