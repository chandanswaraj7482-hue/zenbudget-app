import { Capacitor } from '@capacitor/core';

export interface UserProfile {
  id?: string;
  country?: string;
  currency?: string;
  has_scan_pay_access?: boolean;
  isAdminUnlocked?: boolean;
}

export type PaymentActionType = 'SCAN_OR_UPI' | 'MOBILE_NUMBER' | 'BANK_TRANSFER';

export interface PaymentPayload {
  // SCAN_OR_UPI
  targetUpiId?: string;
  recipientName?: string;
  rawUpiUri?: string;
  pa?: string;

  // MOBILE_NUMBER
  phone?: string;

  // BANK_TRANSFER
  accountNumber?: string;
  accNo?: string;
  ifsc?: string;
  ifscCode?: string;
  holderName?: string;
  name?: string;

  // Common
  amount?: number | string;
}

/**
 * 🛠️ UNIFIED ACCESS GATEKEEPER
 * Checks if user has unlocked Lifetime Scan & Pay access via Cashfree (₹79) or Admin override.
 */
export function checkHasScanPayAccess(userProfile?: UserProfile | null): boolean {
  const profileId = userProfile?.id || localStorage.getItem('zb_profile_id') || '';
  
  const hasLifetimeAccess = userProfile?.has_scan_pay_access === true ||
    localStorage.getItem('has_scan_pay_access') === 'true' ||
    (profileId && localStorage.getItem(`zb_scan_pay_access_${profileId}`) === 'true');

  const isAdminBypassed = userProfile?.isAdminUnlocked === true ||
    localStorage.getItem('admin_overridden') === 'true';

  return Boolean(hasLifetimeAccess || isAdminBypassed);
}

/**
 * ⚙️ GLOBAL MASTER ROUTER CONTROLLER
 * Synthesizes NPCI UPI / Deep Link URIs and launches native OS app chooser.
 */
export function handleZenBudgetPaymentSystem(
  actionType: PaymentActionType,
  payload: string | PaymentPayload,
  userProfile?: UserProfile | null,
  onRequireUnlockModal?: () => void,
  onOpenInternationalGate?: (actionType: PaymentActionType, payload: any, amount: string) => void
): boolean {
  // Step 1: Enforce Absolute One-Time Lifetime Payment Gate
  const isUnlocked = checkHasScanPayAccess(userProfile);

  if (!isUnlocked) {
    if (onRequireUnlockModal) {
      onRequireUnlockModal();
    } else {
      alert("⚠️ Direct UPI Payment features require a one-time Scan & Pay Lifetime Unlock (₹79).");
    }
    return false;
  }

  // Step 2: Extract Currency Parameters & Manage Country Bounds
  const localCountry = userProfile?.country || 'IN';
  const userCurr = userProfile?.currency || 'INR';

  let runtimeAmount = "0";
  if (typeof payload === 'object' && payload.amount !== undefined && payload.amount !== null && payload.amount !== '') {
    runtimeAmount = String(payload.amount);
  } else {
    const amountField = document.getElementById("amount_input") as HTMLInputElement;
    if (amountField && amountField.value) {
      runtimeAmount = amountField.value;
    }
  }

  if (localCountry !== 'IN' && userCurr !== 'INR') {
    if (onOpenInternationalGate) {
      onOpenInternationalGate(actionType, payload, runtimeAmount);
    } else {
      alert("International transfers must be processed via standard card or bank wire network.");
    }
    return true;
  }

  let compiledNativeUri = "";

  // Step 3: Run Feature Context Maps and Construct Target URIs
  switch (actionType) {
    case "SCAN_OR_UPI": {
      if (typeof payload === 'string') {
        if (payload.startsWith("upi://")) {
          compiledNativeUri = payload.includes("am=") ? payload : `${payload}&am=${runtimeAmount}&cu=INR`;
        } else {
          const finalVpa = payload.trim() || 'chandanswaraj7482@okicici';
          compiledNativeUri = `upi://pay?pa=${finalVpa}&pn=${encodeURIComponent("ZenBudget Payee")}&am=${runtimeAmount}&cu=INR`;
        }
      } else {
        const raw = (payload.rawUpiUri || "").trim();
        const targetVpa = (payload.targetUpiId || payload.pa || "").trim() || (raw.startsWith("upi://") ? "" : raw) || 'chandanswaraj7482@okicici';
        
        if (raw.startsWith("upi://")) {
          compiledNativeUri = raw.includes("am=") ? raw : `${raw}&am=${runtimeAmount}&cu=INR`;
        } else {
          const recName = payload.recipientName || payload.name || "ZenBudget Payee";
          compiledNativeUri = `upi://pay?pa=${targetVpa}&pn=${encodeURIComponent(recName)}&am=${runtimeAmount}&cu=INR`;
        }
      }
      break;
    }

    case "MOBILE_NUMBER": {
      const cleanPhone = typeof payload === 'string' ? payload.replace(/\D/g, '') : ((payload.phone || "").replace(/\D/g, ''));
      const suffix = (typeof payload === 'object' && (payload as any).upiSuffix) ? (payload as any).upiSuffix : 'ybl';
      const targetVpa = cleanPhone ? `${cleanPhone}@${suffix}` : 'chandanswaraj7482@okicici';
      compiledNativeUri = `upi://pay?pa=${targetVpa}&pn=${encodeURIComponent("ZenBudget Contact")}&am=${runtimeAmount}&cu=INR`;
      break;
    }

    case "BANK_TRANSFER": {
      const p = typeof payload === 'string' ? { accNo: payload, ifsc: 'UPI', holderName: 'Bank Recipient' } : payload;
      const accNo = (p.accNo || p.accountNumber || "").replace(/\D/g, '');
      const ifsc = (p.ifsc || p.ifscCode || "UPI").trim().toUpperCase();
      const holder = p.holderName || p.name || "Bank Recipient";
      
      // NPCI Compliant VPA Synthesizer
      const compositeBankVpa = ifsc && ifsc !== 'UPI' ? `${accNo}@${ifsc}.ifsc.npci` : `${accNo}@upi`;
      compiledNativeUri = `upi://pay?pa=${compositeBankVpa}&pn=${encodeURIComponent(holder)}&am=${runtimeAmount}&cu=INR`;
      break;
    }

    default:
      console.error("Critical: Invalid transaction mode requested");
      return false;
  }

  // Step 4: Device OS Native App Intent Handshake Execution
  try {
    console.log("ZenBudget Payment System: Direct Intent launch ->", compiledNativeUri);
    
    // Direct href assignment
    window.location.href = compiledNativeUri;

    // Anchor dispatch fallback (works best on Safari iOS & Chrome Android)
    const anchor = document.createElement('a');
    anchor.href = compiledNativeUri;
    anchor.setAttribute('target', '_self');
    anchor.setAttribute('rel', 'noopener');
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      try { document.body.removeChild(anchor); } catch (_) {}
    }, 500);
  } catch (e) {
    console.warn("ZenBudget Payment System: Redirect failed:", e);
  }

  return true;
}

/**
 * 📱 Automated App Presence Detection Logic (PWA/APK Bridge)
 */
export async function checkInstalledUPIApps(): Promise<Record<string, boolean>> {
  const targetApps = [
    { id: 'phonepe', scheme: 'phonepe://pay' },
    { id: 'gpay', scheme: 'upi://pay' }, 
    { id: 'paytm', scheme: 'paytmmp://' }
  ];

  const appStatus: Record<string, boolean> = {
    phonepe: true,
    gpay: true,
    paytm: true
  };

  if (!Capacitor.isNativePlatform()) {
    return appStatus;
  }

  try {
    const { AppLauncher } = await import('@capacitor/app-launcher');
    for (const app of targetApps) {
      try {
        const { value } = await AppLauncher.canOpenUrl({ url: app.scheme });
        appStatus[app.id] = value;
      } catch (_) {
        appStatus[app.id] = true;
      }
    }
  } catch (e) {
    console.warn('AppLauncher check skipped:', e);
  }

  return appStatus;
}
