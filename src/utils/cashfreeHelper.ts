import { isPlayStoreBuild } from '../config/buildConfig';

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
  if (isPlayStoreBuild()) return false;
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

  // STRICT GOOGLE PLAY COMPLIANCE: NEVER launch external Cashfree in Play Store builds
  if (isPlayStoreBuild()) {
    console.warn('Play Store build: External payment gateway disabled for Google Play compliance.');
    if (onFailure) onFailure('Google Play Edition: Purchases are managed via Google Play.');
    return;
  }

  // On Web: Ensure SDK is loaded
  const loaded = await ensurePaymentSdkLoaded();
  if (!loaded || !(window as any).Cashfree) {
    if (onFailure) onFailure('Payment Gateway SDK not loaded');
    return;
  }

  // Determine mode
  const mode = (environment === 'sandbox' || paymentSessionId.includes('sandbox')) ? 'sandbox' : 'production';
  const cf = (window as any).Cashfree({ mode });

  try {
    // Open Cashfree checkout directly without intermediate popups or iframes
    cf.checkout({
      paymentSessionId: paymentSessionId,
      redirectTarget: '_self'
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
