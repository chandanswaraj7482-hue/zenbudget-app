import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Sparkles,
  Bell, 
  QrCode,
  BarChart3,
  Grid
} from 'lucide-react';
import { MoreToolsView } from './components/MoreToolsView';
import { AdminDashboard } from './components/AdminDashboard';
import { ScannerModal } from './components/ScannerModal';
import { NotificationsModal } from './components/NotificationsModal';
import { HelpModal } from './components/HelpModal';
import { LockScreen } from './components/LockScreen';
import { Onboarding } from './components/Onboarding';
import { MorningBrief } from './components/MorningBrief';
import { EveningReflection } from './components/EveningReflection';
import { StoryReport } from './components/StoryReport';
import { ProfileView } from './components/ProfileView';
import { Forest } from './components/Forest';
import { WishlistBlocker } from './components/WishlistBlocker';
import { WealthSimulator } from './components/WealthSimulator';
import { SharedBudgetView } from './components/SharedBudgetView';
import { ReferralView } from './components/ReferralView';
import { LoansView } from './components/LoansView';
import { BankSyncView } from './components/BankSyncView';
import { FollowUsView } from './components/FollowUsView';
import { BankSyncModal } from './components/BankSyncModal';
import { ScanPayUnlockModal } from './components/ScanPayUnlockModal';
import { launchCashfreeCheckout } from './utils/cashfreeHelper';
import { WidgetModal } from './components/WidgetModal';
import { TransferModal } from './components/TransferModal';
import { AddAccountModal } from './components/AddAccountModal';
import { t, setLanguage as setI18nLanguage } from './utils/i18n';
import { Capacitor } from '@capacitor/core';
import type { Transaction, SavingsGoal, CategoryBudget, CategoryType, Account, LoanRecord } from './types';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Budgets } from './components/Budgets';
import { Analytics } from './components/Analytics';
import { TransactionModal } from './components/TransactionModal';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { SubscriptionModal } from './components/SubscriptionModal';
import { supabase } from './supabaseClient';
import { playNotificationSound } from './utils/audio';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'profile' | 'forest' | 'wishlist' | 'simulator' | 'more' | 'shared_budget' | 'referral' | 'loans' | 'bank_sync' | 'follow_us'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Accounts & Loans states
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const profileId = localStorage.getItem('zb_profile_id') || '';
    const stored = profileId ? localStorage.getItem(`zb_accounts_${profileId}`) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const handleDeleteAccount = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Account',
      message: `Are you sure you want to delete "${acc?.name || 'this account'}"?`,
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {
        setAccounts(prev => {
          const nextAccs = prev.filter(a => a.id !== accId);
          if (currentProfileId) {
            localStorage.setItem(`zb_accounts_${currentProfileId}`, JSON.stringify(nextAccs));
          }
          return nextAccs;
        });
        setConfirmDialog(null);
        triggerToast('Account deleted successfully.', 'info');
      }
    });
  };

  const [loans, setLoans] = useState<LoanRecord[]>(() => {
    const profileId = localStorage.getItem('zb_profile_id') || '';
    const stored = profileId ? localStorage.getItem(`zb_loans_${profileId}`) : null;
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [];
  });

  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('zb_user_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(localStorage.getItem('zb_user_name') || 'User')}&background=22c55e&color=fff&rounded=true`;
  });

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isBankSyncOpen, setIsBankSyncOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  
  // Auth & Profile states
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showMorningBrief, setShowMorningBrief] = useState<boolean>(false);
  const [showEveningReflection, setShowEveningReflection] = useState<boolean>(false);
  const [showStoryReport, setShowStoryReport] = useState<boolean>(false);
  const [currentProfileId, setCurrentProfileId] = useState<string>(() => localStorage.getItem('zb_profile_id') || '');
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('zb_user_name') || '');
  
  // Subscription parameters
  const [subscriptionTier, setSubscriptionTier] = useState<string>(() => {
    return localStorage.getItem('zb_subscription_tier') || 'trial';
  });
  const [trialStartDate, setTrialStartDate] = useState<string>(() => {
    return localStorage.getItem('zb_trial_start_date') || new Date().toISOString();
  });
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isScanPayUnlockOpen, setIsScanPayUnlockOpen] = useState(false);
  const [isSubBlocker, setIsSubBlocker] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [showTrialUrgencyModal, setShowTrialUrgencyModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Announcement popup state
  const [announcementPopup, setAnnouncementPopup] = useState<{
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
  } | null>(null);
  
  // Profile settings editor states
  const [userPin, setUserPin] = useState<string>(() => {
    return localStorage.getItem('zb_user_pin') || '0000';
  });
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(() => {
    return localStorage.getItem('zb_premium_expires_at') || null;
  });
  const [referredBy, setReferredBy] = useState<string | null>(() => {
    return localStorage.getItem('zb_referred_by') || null;
  });
  void referredBy;
  const [userReferralCode, setUserReferralCode] = useState<string>(() => {
    return localStorage.getItem('zb_user_referral_code') || '';
  });
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [coupleCode, setCoupleCode] = useState<string | null>(() => {
    const profileId = localStorage.getItem('zb_profile_id') || '';
    return profileId ? localStorage.getItem(`zb_couple_code_${profileId}`) : null;
  });

  // App Rating & Review Feedback States
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [hasSubmittedReview, setHasSubmittedReview] = useState<boolean>(() => {
    return localStorage.getItem('zb_has_submitted_review') === 'true';
  });
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(() => {
    const profileId = localStorage.getItem('zb_profile_id') || '';
    return profileId ? localStorage.getItem(`zb_partner_name_${profileId}`) : null;
  });
  const [referralCount, setReferralCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('zb_referral_count') || '0');
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [activeLoanReminderModal, setActiveLoanReminderModal] = useState<{
    loan: any;
    overdueDays: number;
    remainingAmount: number;
  } | null>(null);
  const [loanReminderAccountId, setLoanReminderAccountId] = useState<string>('');
  const [showUpdatePopup, setShowUpdatePopup] = useState<boolean>(false);
  const [updateVersion, setUpdateVersion] = useState<string>('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [dailyLimit, setDailyLimit] = useState<number>(1000);
  const [updateUrl, setUpdateUrl] = useState<string>('https://zenbudget-tracker.vercel.app/zenbudget.apk');
  const [updateReleaseNotes, setUpdateReleaseNotes] = useState<string>('Initial release.');
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('zb_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const savedTheme = (localStorage.getItem('zb_theme') as 'dark' | 'light') || theme || 'dark';
    const rootEl = document.getElementById('root');
    const docEl = document.documentElement;
    if (savedTheme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      docEl.classList.remove('dark-theme');
      docEl.classList.add('light-theme');
      if (rootEl) {
        rootEl.classList.remove('dark-theme');
        rootEl.classList.add('light-theme');
      }
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      docEl.classList.remove('light-theme');
      docEl.classList.add('dark-theme');
      if (rootEl) {
        rootEl.classList.remove('light-theme');
        rootEl.classList.add('dark-theme');
      }
    }
  }, [theme]);

  // ─── Notification Permission Request (APK startup) ───────────────────────
  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const perm = await LocalNotifications.requestPermissions();
          console.log('ZenBudget: Notification permission:', perm.display);
        } else if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (e) {
        console.warn('ZenBudget: Notification permission request failed:', e);
      }
    };
    // Delay slightly so app loads first
    const timer = setTimeout(requestNotificationPermission, 2000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Version Check & Update Popup ─────────────────────────────────────────
  useEffect(() => {
    const APP_VERSION_CODE = 3; // Current APK version — bump version.json versionCode above this to show update popup
    const checkForUpdates = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        const serverVersionCode: number = data.versionCode || 1;
        const serverVersion: string = data.version || '1.0.0';
        const apkUrl: string = data.apkUrl || 'https://zenbudget-tracker.vercel.app/zenbudget.apk';
        const releaseNotes: string = data.releaseNotes || '';
        const isForce: boolean = data.forceUpdate || false;

        // Check if user already dismissed this version
        const dismissedVersion = localStorage.getItem('zb_last_update_dismissed_version');
        if (!isForce && dismissedVersion === serverVersion) return;

        if (serverVersionCode > APP_VERSION_CODE) {
          setUpdateVersion(serverVersion);
          setUpdateUrl(apkUrl);
          setUpdateReleaseNotes(releaseNotes);
          setForceUpdate(isForce);
          setShowUpdatePopup(true);

          // Send local notification on native APK
          if (Capacitor.isNativePlatform()) {
            try {
              const { LocalNotifications } = await import('@capacitor/local-notifications');
              await LocalNotifications.schedule({
                notifications: [{
                  id: 101,
                  title: '🚀 ZenBudget Update Available!',
                  body: `v${serverVersion} is ready — ${releaseNotes.split('\n')[0]}`,
                  schedule: { at: new Date(Date.now() + 1000) },
                  sound: undefined,
                  attachments: undefined,
                  actionTypeId: '',
                  extra: null
                }]
              });
            } catch (e) {
              console.warn('ZenBudget: Could not send update notification:', e);
            }
          }
        }
      } catch (e) {
        console.warn('ZenBudget: Update check failed:', e);
      }
    };
    // Check on startup after 3 seconds
    const timer = setTimeout(checkForUpdates, 3000);
    return () => clearTimeout(timer);
  }, []);



  // Automatic Geo IP Detection on startup
  useEffect(() => {
    const detectIPLocation = async () => {
      const profileId = localStorage.getItem('zb_profile_id') || '';
      if (profileId && localStorage.getItem(`zb_currency_${profileId}`)) return;
      if (localStorage.getItem('zb_default_currency')) return;

      try {
        const response = await fetch('https://api.country.is/');
        const data = await response.json();
        if (data.country === 'IN') {
          console.log('ZenBudget: Detected India via api.country.is. Defaulting currency to INR.');
          localStorage.setItem('zb_default_currency', 'INR');
          setCurrency('INR');
          return;
        }
      } catch (e) {
        console.warn('ZenBudget: country.is lookup failed, trying ipapi.co...', e);
      }

      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code === 'IN' || data.country === 'IN' || data.currency === 'INR') {
          console.log('ZenBudget: Detected India via ipapi.co. Defaulting currency to INR.');
          localStorage.setItem('zb_default_currency', 'INR');
          setCurrency('INR');
        } else if (data.currency) {
          localStorage.setItem('zb_default_currency', data.currency);
          setCurrency(data.currency);
        }
      } catch (e) {
        console.warn('ZenBudget: Fallback Geo IP lookup failed:', e);
      }
    };
    detectIPLocation();
  }, []);

  useEffect(() => {
    const handleAvatarUpdate = () => {
      const updated = localStorage.getItem('zb_user_avatar');
      if (updated) setUserAvatar(updated);
    };
    window.addEventListener('profile_avatar_updated', handleAvatarUpdate);
    return () => window.removeEventListener('profile_avatar_updated', handleAvatarUpdate);
  }, []);

  const handleAddAccount = (newAcc: Omit<Account, 'id'>) => {
    const accId = `acc_${Math.random().toString(36).substring(2, 9)}`;
    const created: Account = { ...newAcc, id: accId };
    const updated = [...accounts, created];
    setAccounts(updated);
    if (currentProfileId) {
      localStorage.setItem(`zb_accounts_${currentProfileId}`, JSON.stringify(updated));
    }
    triggerToast(`Account "${newAcc.name}" added successfully!`, 'success');
  };

  const handleTransfer = (fromId: string, toId: string, amount: number, notes?: string) => {
    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);
    if (!fromAcc || !toAcc) return;

    const updated = accounts.map(a => {
      if (a.id === fromId) return { ...a, balance: Math.max(0, a.balance - amount) };
      if (a.id === toId) return { ...a, balance: a.balance + amount };
      return a;
    });
    setAccounts(updated);
    if (currentProfileId) {
      localStorage.setItem(`zb_accounts_${currentProfileId}`, JSON.stringify(updated));
    }

    handleSaveTransaction({
      title: `Transfer: ${fromAcc.name} ➤ ${toAcc.name}`,
      amount,
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      type: 'transfer',
      notes: notes || `Transfer from ${fromAcc.name} to ${toAcc.name}`,
      accountId: fromId,
      transferToAccountId: toId
    });
    triggerToast(`Transferred ${currencySymbol}${amount} from ${fromAcc.name} to ${toAcc.name}!`, 'success');
  };


  const handleAddLoan = (loanData: Omit<LoanRecord, 'id' | 'paidAmount' | 'status'>) => {
    const loanId = `loan_${Math.random().toString(36).substring(2, 9)}`;
    const newLoan: LoanRecord = {
      ...loanData,
      id: loanId,
      paidAmount: 0,
      status: 'active'
    };
    const updated = [newLoan, ...loans];
    setLoans(updated);
    if (currentProfileId) {
      localStorage.setItem(`zb_loans_${currentProfileId}`, JSON.stringify(updated));
    }
    triggerToast(`Loan entry for ${loanData.personName} saved!`, 'success');
  };

  const handleRepayLoan = (loanId: string, repayAmount: number, accountId: string) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    if (accounts.length === 0) {
      triggerToast('Please create a Wallet Account first in "My Accounts in Wallet" before recording loan payments!', 'warning');
      setIsAddAccountOpen(true);
      return;
    }

    const updatedLoans = loans.map(l => {
      if (l.id === loanId) {
        const newPaid = l.paidAmount + repayAmount;
        const newStatus = newPaid >= l.totalAmount ? ('completed' as const) : ('active' as const);
        return { ...l, paidAmount: newPaid, status: newStatus };
      }
      return l;
    });
    setLoans(updatedLoans);
    if (currentProfileId) {
      localStorage.setItem(`zb_loans_${currentProfileId}`, JSON.stringify(updatedLoans));
    }

    // Update account balance
    const isBorrowed = targetLoan.type === 'borrowed';
    setAccounts(prev => {
      const updated = prev.map(a => {
        if (a.id === accountId) {
          const delta = isBorrowed ? -repayAmount : repayAmount;
          return { ...a, balance: Math.max(0, a.balance + delta) };
        }
        return a;
      });
      if (currentProfileId) {
        localStorage.setItem(`zb_accounts_${currentProfileId}`, JSON.stringify(updated));
      }
      return updated;
    });

    handleSaveTransaction({
      title: isBorrowed ? `Repaid Loan: ${targetLoan.personName}` : `Received Loan: ${targetLoan.personName}`,
      amount: repayAmount,
      category: 'bills',
      date: new Date().toISOString().split('T')[0],
      type: isBorrowed ? 'expense' : 'income',
      notes: `Loan Repayment record (${targetLoan.personName})`
    });
  };

  const handlePayLoanViaUPI = async (loan: LoanRecord, amount: number) => {
    try {
      const userEmail = localStorage.getItem('zb_user_email') || '';
      const userPhone = localStorage.getItem('zb_user_phone') || '';
      triggerToast(`Launching Cashfree PhonePe payment for ₹${amount}...`, 'info');

      let payment_session_id = '';
      try {
        const res = await fetch('https://admin-portal-zenbudget.vercel.app/api/create-payment-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount,
            planType: `loan_${loan.id}`,
            userId: currentProfileId,
            email: userEmail,
            phone: userPhone
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.payment_session_id) {
            payment_session_id = data.payment_session_id;
          }
        }
      } catch (e) {
        console.warn('Cashfree payment session fetch skipped/failed:', e);
      }

      if (payment_session_id && (window as any).Cashfree) {
        const cf = (window as any).Cashfree({ mode: 'production' });
        cf.checkout({
          paymentSessionId: payment_session_id,
          redirectTarget: '_modal'
        }).then(async (result: any) => {
          if (result && result.paymentDetails) {
            handleRepayLoan(loan.id, amount, accounts[0]?.id || '1');
            triggerToast(`Loan repayment of ₹${amount} to ${loan.personName} completed via PhonePe! 🎉`, 'success');
            try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
          }
        });
      } else {
        // Fallback: Direct UPI App intent launch on Mobile only
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          const upiUrl = `upi://pay?pa=chandanswaraj7482@okicici&pn=ZenBudget&am=${amount}&cu=INR&tn=${encodeURIComponent(`Loan Repayment: ${loan.personName}`)}`;
          try { window.location.href = upiUrl; } catch (e) {}
        }
        handleRepayLoan(loan.id, amount, accounts[0]?.id || '1');
        triggerToast(`Loan repayment of ₹${amount} to ${loan.personName} processed! 🎉`, 'success');
        try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
      }
    } catch (err: any) {
      handleRepayLoan(loan.id, amount, accounts[0]?.id || '1');
      triggerToast(`Loan repayment processed! 🎉`, 'success');
    }
  };

  const handleDirectCashfreePayment = async (amount: number, title: string) => {
    if (!amount || amount <= 0) {
      triggerToast('Please enter a valid payment amount.', 'warning');
      return;
    }

    const isPremium = subscriptionTier === 'premium' || subscriptionTier === 'premium_monthly' || subscriptionTier === 'premium_yearly' || subscriptionTier === 'premium_lifetime';
    const hasScanPayAccess = isPremium || localStorage.getItem(`zb_scan_pay_access_${currentProfileId}`) === 'true';

    // Standalone Paid Feature Guard: Must pay ₹79 for Scan & Pay separately
    if (!hasScanPayAccess && !title.startsWith('loan_')) {
      setIsScanPayUnlockOpen(true);
      return;
    }

    try {
      const userEmail = localStorage.getItem('zb_user_email') || '';
      const userPhone = localStorage.getItem('zb_user_phone') || '';
      triggerToast(`Launching Cashfree Direct Pay for ₹${amount}...`, 'info');

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
              amount: amount,
              planType: `pay_${Date.now()}`,
              userId: currentProfileId,
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
          console.warn('Payment session fetch error for', url, e);
        }
      }

      if (payment_session_id) {
        launchCashfreeCheckout(
          payment_session_id,
          (result: any) => {
            handleSaveTransaction({
              title: title || 'UPI Payment via Cashfree',
              amount: amount,
              category: 'shopping',
              date: new Date().toISOString().split('T')[0],
              type: 'expense',
              notes: 'Paid via Cashfree PhonePe/UPI'
            });
            triggerToast(`Payment of ₹${amount} completed via Cashfree! 🎉`, 'success');
            try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
          },
          (err: any) => {
            triggerToast('Payment cancelled or incomplete.', 'warning');
          }
        );
      } else {
        // Fallback: Direct UPI App intent launch on Mobile only (PhonePe / GPay / Paytm / Netbanking)
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          const upiUrl = `upi://pay?pa=chandanswaraj7482@okicici&pn=ZenBudget&am=${amount}&cu=INR&tn=${encodeURIComponent(title || 'ZenBudget Payment')}`;
          try { window.location.href = upiUrl; } catch (e) {}
          triggerToast(`Redirecting to UPI App for ₹${amount} payment...`, 'info');
        } else {
          triggerToast('Could not launch Cashfree payment gateway session. Please try again.', 'warning');
        }
      }
    } catch (err: any) {
      triggerToast(err.message || 'Payment failed to initialize.', 'warning');
    }
  };

  const [currency, setCurrency] = useState<string>(() => {
    const profileId = localStorage.getItem('zb_profile_id') || '';
    const savedCurrency = profileId ? localStorage.getItem(`zb_currency_${profileId}`) : null;
    if (savedCurrency) return savedCurrency;
    const savedDefault = localStorage.getItem('zb_default_currency');
    if (savedDefault) return savedDefault;
    const isIndia = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata' || 
                    navigator.language.includes('IN') || 
                    (navigator.languages && navigator.languages.some(l => l.includes('IN')));
    return isIndia ? 'INR' : 'USD';
  });
  const [language, setLanguage] = useState<string>(() => {
    const profileId = localStorage.getItem('zb_profile_id') || '';
    return profileId ? localStorage.getItem(`zb_language_${profileId}`) || 'en' : 'en';
  });

  // langKey: increments on every language OR currency change → forces all views to re-render
  const [langKey, setLangKey] = useState(0);

  // Track standard page-reload/language changes synchronization
  useEffect(() => {
    const syncLang = () => {
      const profileId = localStorage.getItem('zb_profile_id') || '';
      const currentLoc = profileId ? localStorage.getItem(`zb_language_${profileId}`) || 'en' : 'en';
      setLanguage(currentLoc);
      setLangKey(k => k + 1); // force full re-render of all views
    };
    const syncCurrency = () => {
      setLangKey(k => k + 1); // currency change → also re-render all views
    };
    window.addEventListener('languagechange', syncLang);
    window.addEventListener('currencychange', syncCurrency);
    return () => {
      window.removeEventListener('languagechange', syncLang);
      window.removeEventListener('currencychange', syncCurrency);
    };
  }, []);
  const [rates, setRates] = useState<Record<string, number>>({
    USD: 1.0,
    INR: 83.5,
    EUR: 0.92,
    GBP: 0.78,
    CAD: 1.36,
    AUD: 1.50,
    JPY: 158.0,
    AED: 3.67,
    SAR: 3.75,
    CNY: 7.25
  });

  // Custom modals & toast state
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    type?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  // Budget urgency hold state
  const [budgetUrgencyPending, setBudgetUrgencyPending] = useState<{
    txData: Omit<Transaction, 'id'> & { id?: string };
    categoryName: string;
    excess: string;
  } | null>(null);

  interface ZenNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'income' | 'expense';
    title: string;
    desc: string;
    timestamp: string; // ISO string
    unread: boolean;
  }

  const [notifications, setNotifications] = useState<ZenNotification[]>([]);

  // Sync notifications when user logs in or profile changes
  useEffect(() => {
    if (!currentProfileId) return;
    const cached = localStorage.getItem(`zb_notifications_${currentProfileId}`);
    if (cached) {
      try {
        setNotifications(JSON.parse(cached));
      } catch {
        setNotifications(getDefaultNotifications());
      }
    } else {
      const defaults = getDefaultNotifications();
      setNotifications(defaults);
      localStorage.setItem(`zb_notifications_${currentProfileId}`, JSON.stringify(defaults));
    }
  }, [currentProfileId]);

  // Sync live broadcast announcements from Supabase broadcast_notifications table
  useEffect(() => {
    if (!currentProfileId) return;

    const fetchBroadcastAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('broadcast_notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching broadcasts from Supabase:', error);
          return;
        }

        if (data && data.length > 0) {
          const shownKey = `zb_shown_announcements_${currentProfileId}`;
          let shownIds: string[] = [];
          try { shownIds = JSON.parse(localStorage.getItem(shownKey) || '[]'); } catch (_) {}

          setNotifications(prev => {
            const updated = [...prev];
            let modified = false;
            let latestUnseen: typeof data[0] | null = null;

            // Iterate backward to add older ones first so newer ones end up on top
            for (let i = data.length - 1; i >= 0; i--) {
              const b = data[i];
              const notificationId = `broadcast_${b.id}`;
              
              if (!updated.some(n => n.id === notificationId)) {
                updated.unshift({
                  id: notificationId,
                  type: b.type === 'coupon' ? 'success' : (b.type || 'info'),
                  title: b.title,
                  desc: b.message,
                  timestamp: b.created_at,
                  unread: true
                });
                modified = true;
              }
              
              // Track latest unseen for popup
              if (!shownIds.includes(String(b.id))) {
                latestUnseen = b;
              }
            }

            if (modified) {
              localStorage.setItem(`zb_notifications_${currentProfileId}`, JSON.stringify(updated));
            }

            // Show popup for the latest unseen announcement
            if (latestUnseen) {
              const lUnseen = latestUnseen;
              setTimeout(() => {
                setAnnouncementPopup({
                  id: String(lUnseen.id),
                  title: lUnseen.title,
                  message: lUnseen.message,
                  type: lUnseen.type || 'info',
                  createdAt: lUnseen.created_at
                });
              }, 1500);
              localStorage.setItem(shownKey, JSON.stringify([...shownIds, String(lUnseen.id)]));
            }

            return updated;
          });
        }
      } catch (err) {
        console.warn('Failed to sync broadcast notifications:', err);
      }
    };

    fetchBroadcastAnnouncements();

    // Subscribe to public:broadcast_notifications Supabase Realtime channel
    const channel = supabase
      .channel('public:broadcast_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcast_notifications' }, (payload) => {
        const b = payload.new;
        if (b) {
          const notificationId = `broadcast_${b.id}`;
          setNotifications(prev => {
            if (prev.some(n => n.id === notificationId)) return prev;
            const updated = [
              {
                id: notificationId,
                type: b.type === 'coupon' ? 'success' : (b.type || 'info'),
                title: b.title,
                desc: b.message,
                timestamp: b.created_at,
                unread: true
              },
              ...prev
            ];
            localStorage.setItem(`zb_notifications_${currentProfileId}`, JSON.stringify(updated));
            return updated;
          });
          // Show full popup for real-time announcements immediately
          setAnnouncementPopup({
            id: String(b.id),
            title: b.title,
            message: b.message,
            type: b.type || 'info',
            createdAt: b.created_at
          });
          triggerToast(`📣 ${b.title}`, b.type === 'coupon' ? 'success' : 'info');
          try { playNotificationSound('info'); } catch (_) {}
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfileId]);

  const getDefaultNotifications = (): ZenNotification[] => {
    return [
      {
        id: '1',
        type: 'success',
        title: "ZenBudget v1.0.0 is Live!",
        desc: "Welcome to ZenBudget! Enjoy premium dark mode, live currency sync, and offline budgeting ledger.",
        timestamp: new Date(Date.now() - 45 * 1000).toISOString(),
        unread: true
      },
      {
        id: '2',
        type: 'info',
        title: "Native Biometrics Added",
        desc: "Unlock your financial logs securely with Fingerprint or Face ID biometric validation on launch.",
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        unread: true
      },
      {
        id: '3',
        type: 'success',
        title: "100% Private Sandbox",
        desc: "Your data stays on your device. We do not sell your transactions or budget metrics to advertisers.",
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        unread: false
      }
    ];
  };

  const addNotification = (title: string, desc: string, type: ZenNotification['type']) => {
    if (!currentProfileId) return;
    const newNotif: ZenNotification = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      desc,
      timestamp: new Date().toISOString(),
      unread: true
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      localStorage.setItem(`zb_notifications_${currentProfileId}`, JSON.stringify(updated));
      return updated;
    });

    // Play sounds
    if (type === 'income') {
      playNotificationSound('income');
    } else if (type === 'warning') {
      playNotificationSound('warning');
    } else {
      playNotificationSound('success');
    }
  };

  const handleMarkAllNotificationsRead = () => {
    if (!currentProfileId) return;
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, unread: false }));
      localStorage.setItem(`zb_notifications_${currentProfileId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Trigger toast & notification sound helper
  const triggerToast = (message: string, type: 'success' | 'warning' | 'info') => {
    setToast({
      id: Math.random().toString(),
      message,
      type
    });
    playNotificationSound(type);
  };

  // Fetch Exchange Rates on startup
  useEffect(() => {
    fetchExchangeRates();

    // Parse pending referral code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('code') || urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('zb_pending_referral_code', refCode);
      console.log('ZenBudget: Pending referral code saved:', refCode);
    }

    // Background update checker from Supabase app_versions & broadcast notifications
    const checkForUpdates = async () => {
      // ONLY trigger update popup inside installed mobile APK devices.
      // Web browser auto-updates on deployment, so skip Web!
      if (!Capacitor.isNativePlatform()) return;

      try {
        const { data } = await supabase
          .from('app_versions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let latestVersion = data?.latest_version || '1.0.1';
        let downloadUrl = data?.update_url || 'https://zenbudget-tracker.vercel.app/zenbudget.apk';
        let isForceUpdate = !!data?.force_update;
        let releaseNotes = data?.release_notes || 'Bug fixes, fast payment handles & new Zen Companion features!';

        // Check if there is an active broadcast notification for update
        const { data: bcData } = await supabase
          .from('broadcast_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (bcData && bcData[0] && (bcData[0].type === 'update' || bcData[0].title.toLowerCase().includes('update'))) {
          latestVersion = '1.0.1';
          releaseNotes = `${bcData[0].title}: ${bcData[0].message}`;
        }

        const lastDismissedVersion = localStorage.getItem('zb_last_update_dismissed_version');
        const isDismissed = lastDismissedVersion === latestVersion || lastDismissedVersion === '1.0.1_dismissed';

        if (!isDismissed || isForceUpdate) {
          setUpdateVersion(latestVersion);
          setUpdateUrl(downloadUrl);
          setUpdateReleaseNotes(releaseNotes);
          if (isForceUpdate) setForceUpdate(true);
          setShowUpdatePopup(true);
        }
      } catch (err) {
        console.warn('ZenBudget: Version check failed:', err);
      }
    };
    checkForUpdates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error('API server unreachable');
      const data = await response.json();
      if (data && data.rates) {
        setRates(prev => ({
          ...prev,
          ...data.rates
        }));
        console.log('Real-time exchange rates updated successfully.');
      }
    } catch (err) {
      console.warn('Using offline exchange rates fallback:', err);
    }
  };

  // Check trial metrics helper
  const getRemainingDays = () => {
    const savedExpire = localStorage.getItem('zb_trial_expire_date');
    if (savedExpire) {
      const diffTime = new Date(savedExpire).getTime() - new Date().getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    const start = new Date(trialStartDate).getTime();
    const now = new Date().getTime();
    const diff = (now - start) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - diff));
  };

  const isSubscriptionExpired = (): boolean => {
    if (subscriptionTier === 'premium_lifetime') return false;

    if (subscriptionTier === 'premium_monthly' || subscriptionTier === 'premium') {
      if (premiumExpiresAt) {
        const expireTime = new Date(premiumExpiresAt).getTime();
        if (!isNaN(expireTime) && Date.now() > expireTime) {
          return true;
        }
      }
      return false;
    }

    if (subscriptionTier === 'trial' || !subscriptionTier) {
      if (!trialStartDate) return false;
      const start = new Date(trialStartDate).getTime();
      if (!isNaN(start)) {
        const diffDays = (Date.now() - start) / (1000 * 60 * 60 * 24);
        return diffDays >= 7;
      }
      return false;
    }

    return false;
  };

  const isTrialExpired = () => isSubscriptionExpired();

  const checkExpiredGuard = (): boolean => {
    if (isSubscriptionExpired()) {
      setIsSubBlocker(true);
      setIsSubModalOpen(true);
      return true;
    }
    return false;
  };

  // Automatic Subscription Pay Modal Popup on Expire
  useEffect(() => {
    if (!isLocked && isSubscriptionExpired()) {
      setIsSubBlocker(true);
      setIsSubModalOpen(true);
    }
  }, [isLocked, subscriptionTier, trialStartDate, premiumExpiresAt]);

  // Sync profile data on unlock
  useEffect(() => {
    if (isLocked || !currentProfileId) return;

    fetchDataFromSupabase();
  }, [currentProfileId, isLocked]);

  // Smart Loan Repayment & Money Collection Reminder Check (Strict User Frequency)
  useEffect(() => {
    if (isLocked || loans.length === 0) return;

    const checkLoanReminders = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const tenMinSlot = Math.floor(now.getMinutes() / 10);
      const activeLoans = loans.filter(l => l.status !== 'completed');

      for (const loan of activeLoans) {
        const remaining = loan.totalAmount - loan.paidAmount;
        if (remaining <= 0) continue;

        const due = new Date(loan.dueDate);
        const dueStr = due.toISOString().split('T')[0];
        const isOverdue = now > due && todayStr !== dueStr;
        const overdueDays = isOverdue ? Math.max(1, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))) : 0;

        // Determine if reminder should trigger based on selected frequency
        const freq = loan.frequency || 'one_time';
        let shouldTrigger = false;

        if (freq === 'every_10_min') {
          shouldTrigger = true;
        } else if (isOverdue) {
          shouldTrigger = true; // Overdue loans trigger daily reminder!
        } else if (freq === 'daily') {
          shouldTrigger = true;
        } else if (freq === 'one_time') {
          shouldTrigger = todayStr === dueStr;
        } else if (freq === 'weekly') {
          const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
          shouldTrigger = diffDays >= 0 && diffDays % 7 === 0;
        } else if (freq === 'monthly') {
          shouldTrigger = now.getDate() === due.getDate();
        } else if (freq === 'yearly') {
          shouldTrigger = now.getDate() === due.getDate() && now.getMonth() === due.getMonth();
        } else {
          shouldTrigger = todayStr === dueStr;
        }

        if (shouldTrigger) {
          const promptKey = freq === 'every_10_min'
            ? `zb_loan_reminded_${loan.id}_${todayStr}_${tenMinSlot}`
            : `zb_loan_reminded_${loan.id}_${todayStr}`;

          if (!localStorage.getItem(promptKey)) {
            localStorage.setItem(promptKey, 'true');
            setActiveLoanReminderModal({
              loan,
              overdueDays,
              remainingAmount: remaining
            });
            setLoanReminderAccountId(accounts[0]?.id || '');
            break;
          }
        }
      }
    };

    checkLoanReminders();
    const interval = setInterval(checkLoanReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, [loans, isLocked, accounts]);
  useEffect(() => {
    if (isLocked) return;

    if (subscriptionTier === 'trial') {
      const remainingDays = getRemainingDays();
      if (remainingDays <= 3 && remainingDays > 0) {
        const isDismissed = localStorage.getItem(`zb_dismissed_trial_urgency_${remainingDays}`);
        if (!isDismissed) {
          setShowTrialUrgencyModal(true);
        }
      }
    }

    if (transactions.length >= 5) {
      const isRatingDismissed = localStorage.getItem('zb_rating_dismissed');
      if (!isRatingDismissed) {
        const timer = setTimeout(() => {
          setShowRatingModal(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isLocked, subscriptionTier, transactions.length]);

  // Dynamic daily limit calculation effect
  useEffect(() => {
    if (!currentProfileId || isLocked) return;

    const syncDailyLimit = async () => {
      // 1. Calculate dynamic spending limit
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      const remainingDays = Math.max(1, daysInMonth - dayOfMonth + 1);

      // Income calculation
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const thisMonthIncome = convertedTransactions
        .filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'income';
        })
        .reduce((sum, t) => sum + t.amount, 0) || 50000;

      // Savings Target
      const monthlySavingsGoal = goals.reduce((sum, g) => sum + (g.targetAmount / 12), 0) || 5000;

      // Budgets limit sum
      const monthlyBudgetsSum = convertedBudgets.reduce((sum, b) => sum + b.limit, 0) || 20000;

      const netDisposable = Math.max(2000, thisMonthIncome - monthlySavingsGoal);
      const budgetPool = Math.min(netDisposable, monthlyBudgetsSum > 0 ? monthlyBudgetsSum : netDisposable);

      const spentThisMonth = convertedTransactions
        .filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const remainingBudget = Math.max(1000, budgetPool - spentThisMonth);
      const baseLimit = remainingBudget / remainingDays;

      // Adjustment based on past 7 days spending history
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last7DaysExpenses = convertedTransactions.filter(t => new Date(t.date) >= sevenDaysAgo && t.type === 'expense');
      const avgDailySpent = last7DaysExpenses.reduce((sum, t) => sum + t.amount, 0) / 7;

      let finalLimit = baseLimit;
      if (avgDailySpent > 0) {
        if (avgDailySpent > baseLimit) {
          finalLimit = baseLimit * 0.9 + avgDailySpent * 0.1;
        } else {
          finalLimit = baseLimit * 0.95 + avgDailySpent * 0.05;
        }
      }

      const calculated = Math.max(200, Math.round(finalLimit));
      setDailyLimit(calculated);
      localStorage.setItem('zb_today_smart_limit', calculated.toString());
      if (currentProfileId) {
        localStorage.setItem(`zb_daily_limit_${currentProfileId}`, calculated.toString());
        localStorage.setItem(`zb_currency_symbol_${currentProfileId}`, currencySymbol);
      }

      // 2. Save calculated limit to database
      try {
        await supabase
          .from('daily_limits')
          .upsert({
            user_id: currentProfileId,
            limit_amount: calculated,
            calculated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn('ZenBudget: Failed to sync daily limit to database:', err);
      }
    };

    syncDailyLimit();
  }, [currentProfileId, isLocked, transactions, goals, budgets]);

  // Daily Companion Check-in Points (+20)
  useEffect(() => {
    if (isLocked || !currentProfileId) return;
    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = localStorage.getItem(`zb_last_checkin_${currentProfileId}`);
    if (lastCheckin !== today) {
      localStorage.setItem(`zb_last_checkin_${currentProfileId}`, today);
      const petPointsKey = `zb_pet_points_${currentProfileId}`;
      const currentPoints = parseInt(localStorage.getItem(petPointsKey) || '0');
      localStorage.setItem(petPointsKey, (currentPoints + 20).toString());
      setTimeout(() => {
        triggerToast('Daily Check-in! +20 Zen Pet Points! 🌿🐷', 'success');
      }, 3000);
    }
  }, [currentProfileId, isLocked]);

  // Automatic Scheduled Loan Repayment Reminder Popups
  useEffect(() => {
    if (isLocked || !currentProfileId || loans.length === 0) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const reminderKey = `zb_loan_reminded_${currentProfileId}_${todayStr}`;
    if (localStorage.getItem(reminderKey)) return;

    const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '$';
    const dueLoans = loans.filter(l => l.status === 'active' && l.dueDate <= todayStr);
    if (dueLoans.length > 0) {
      localStorage.setItem(reminderKey, 'true');
      const firstDue = dueLoans[0];
      const remaining = firstDue.totalAmount - firstDue.paidAmount;
      const label = firstDue.type === 'borrowed' ? 'Repayment Due' : 'Collection Due';
      setTimeout(() => {
        addNotification(
          `⏰ ZenBudget Loan Reminder: ${label}`,
          `Reminder: ${firstDue.personName} loan of ${sym}${remaining} is due today!`,
          'warning'
        );
        triggerToast(`⏰ Loan Reminder: ${firstDue.personName} (${sym}${remaining}) is due today!`, 'warning');
      }, 4000);
    }
  }, [currentProfileId, isLocked, loans, currency]);

  const fetchDataFromSupabase = async () => {
    try {


      // Load local partner info
      let cachedPartnerId = localStorage.getItem(`zb_partner_id_${currentProfileId}`) || null;
      const cachedPartnerCode = localStorage.getItem(`zb_partner_code_${currentProfileId}`) || null;
      setPartnerId(cachedPartnerId);
      setPartnerCode(cachedPartnerCode);

      // Fetch saved daily limit from database
      const { data: limitData } = await supabase
        .from('daily_limits')
        .select('limit_amount')
        .eq('user_id', currentProfileId)
        .maybeSingle();
      if (limitData && limitData.limit_amount) {
        setDailyLimit(Number(limitData.limit_amount));
        localStorage.setItem(`zb_daily_limit_${currentProfileId}`, String(limitData.limit_amount));
        localStorage.setItem(`zb_currency_symbol_${currentProfileId}`, currencySymbol);
      }

      // 0. Fetch profile info to sync properties (tier, expires_at)
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentProfileId)
        .maybeSingle();
      
      if (profErr) throw profErr;
      if (profData) {
        let userCoupleCode = profData.couple_code;
        if (!userCoupleCode) {
          userCoupleCode = 'CP-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
          try {
            await supabase.from('profiles').update({ couple_code: userCoupleCode }).eq('id', currentProfileId);
          } catch (e) {
            console.warn('Failed to auto-create couple code:', e);
          }
        }

        setCoupleCode(userCoupleCode);
        localStorage.setItem(`zb_couple_code_${currentProfileId}`, userCoupleCode || '');

        // Sync partner disconnection check
        if (cachedPartnerId && userCoupleCode) {
          const { data: partnerCheck } = await supabase
            .from('profiles')
            .select('partner_couple_code, name')
            .eq('id', cachedPartnerId)
            .maybeSingle();
          if (partnerCheck && partnerCheck.partner_couple_code !== userCoupleCode) {
            console.log(`ZenBudget: Partner ${partnerCheck.name} disconnected couple ledger sync.`);
            localStorage.removeItem(`zb_partner_id_${currentProfileId}`);
            localStorage.removeItem(`zb_partner_code_${currentProfileId}`);
            localStorage.removeItem(`zb_partner_name_${currentProfileId}`);
            setPartnerId(null);
            setPartnerCode(null);
            setPartnerName(null);
            cachedPartnerId = null;
            await supabase
              .from('profiles')
              .update({ partner_couple_code: null })
              .eq('id', currentProfileId);
          }
        }

        setUserName(profData.name);
        setSubscriptionTier(profData.subscription_tier);
        setTrialStartDate(profData.trial_start_date);
        setPremiumExpiresAt(profData.premium_expires_at);
        setReferredBy(profData.referred_by || null);
        setUserReferralCode(profData.referral_code || '');
        setUserPin(profData.pin);

        // Auto sync Google OAuth Avatar & Email
        try {
          const { data: authUserData } = await supabase.auth.getUser();
          if (authUserData && authUserData.user) {
            const googleAvatar = authUserData.user.user_metadata?.avatar_url || authUserData.user.user_metadata?.picture || authUserData.user.user_metadata?.photo_url;
            const userEmail = authUserData.user.email || profData.email || '';
            if (userEmail && (!profData.email || profData.email !== userEmail)) {
              await supabase.from('profiles').update({ email: userEmail }).eq('id', currentProfileId);
              localStorage.setItem('zb_user_email', userEmail);
            }
            if (googleAvatar) {
              // Always save Google avatar as the dedicated google avatar key
              // so it appears as the first preset option in ProfileView picker
              localStorage.setItem('zb_google_avatar', googleAvatar);
              // Also set as primary user avatar if not manually changed yet
              if (!localStorage.getItem('zb_user_avatar') || localStorage.getItem('zb_user_avatar')?.includes('ui-avatars.com')) {
                setUserAvatar(googleAvatar);
                localStorage.setItem('zb_user_avatar', googleAvatar);
              }
            }
          }
        } catch (e) {}
        
        // Auto sync active currency from local settings or database settings
        const isIndia = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata' || 
                        navigator.language.includes('IN') || 
                        localStorage.getItem('zb_default_currency') === 'INR';
        
        let userLocCurrency = localStorage.getItem(`zb_currency_${currentProfileId}`) || '';
        if (!userLocCurrency) {
          if (profData.currency === 'USD' && isIndia) {
            userLocCurrency = 'INR';
            // Sync to database so it stays INR
            supabase
              .from('profiles')
              .update({ currency: 'INR' })
              .eq('id', currentProfileId)
              .then(({ error }) => {
                if (error) console.error('Failed to auto-upgrade profile currency to INR:', error);
              });
          } else {
            userLocCurrency = profData.currency || (isIndia ? 'INR' : 'USD');
          }
        }
        setCurrency(userLocCurrency);
        localStorage.setItem(`zb_currency_${currentProfileId}`, userLocCurrency);

        localStorage.setItem('zb_user_name', profData.name);
        localStorage.setItem('zb_subscription_tier', profData.subscription_tier);
        localStorage.setItem('zb_trial_start_date', profData.trial_start_date);
        localStorage.setItem('zb_user_pin', profData.pin);
        if (profData.has_scan_pay_access) {
          localStorage.setItem(`zb_scan_pay_access_${currentProfileId}`, 'true');
        } else {
          localStorage.removeItem(`zb_scan_pay_access_${currentProfileId}`);
        }
        if (profData.premium_expires_at) {
          localStorage.setItem('zb_premium_expires_at', profData.premium_expires_at);
        } else {
          localStorage.removeItem('zb_premium_expires_at');
        }
        if (profData.referred_by) {
          localStorage.setItem('zb_referred_by', profData.referred_by);
          try {
            const { data: inviterData } = await supabase
              .from('profiles')
              .select('name')
              .eq('referral_code', profData.referred_by)
              .maybeSingle();
            if (inviterData && inviterData.name) {
              localStorage.setItem('zb_inviter_name', inviterData.name);
            }
          } catch (e) {}
        } else {
          localStorage.removeItem('zb_referred_by');
          localStorage.removeItem('zb_inviter_name');
        }
        localStorage.setItem('zb_user_referral_code', profData.referral_code || '');

        // Fetch paid referrals & claim rewards
        if (profData.referral_code) {
          const { count, error: countErr } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', profData.referral_code)
            .in('subscription_tier', ['premium_monthly', 'premium_lifetime', 'premium']);

          if (!countErr && count !== null) {
            setReferralCount(count);
            localStorage.setItem('zb_referral_count', count.toString());

            // 10 Paid invites = 1 Month Premium
            const rewardsClaimed = profData.referral_rewards_claimed || 0;
            const eligibleMilestones = Math.floor(count / 10);
            if (eligibleMilestones > rewardsClaimed) {
              const unclaimedMonths = eligibleMilestones - rewardsClaimed;
              const daysToAdd = unclaimedMonths * 30;

              let newExpiry = new Date();
              if (profData.premium_expires_at) {
                const currentExpiry = new Date(profData.premium_expires_at);
                newExpiry = currentExpiry > new Date() ? currentExpiry : new Date();
              }
              newExpiry.setDate(newExpiry.getDate() + daysToAdd);

              const { error: rewardErr } = await supabase
                .from('profiles')
                .update({
                  subscription_tier: 'premium_monthly',
                  premium_expires_at: newExpiry.toISOString(),
                  referral_rewards_claimed: eligibleMilestones
                })
                .eq('id', currentProfileId);

              if (!rewardErr) {
                addNotification(
                  "Referral Milestone Achieved! 🏆🎁",
                  `Congratulations! You referred ${count} paid users. You've earned ${unclaimedMonths} Month(s) of Premium free!`,
                  'success'
                );
                triggerToast(`Rewarded with ${unclaimedMonths} Month(s) Free Premium! 🚀`, 'success');
                // Confetti if available
                try {
                  const confetti = (window as any).confetti;
                  if (confetti) confetti({ particleCount: 120, spread: 70 });
                } catch (e) {}

                setSubscriptionTier('premium_monthly');
                setPremiumExpiresAt(newExpiry.toISOString());
              }
            }
          }
        }

        // Couple Ledger Sync: Check if both profiles are premium
        const isSelfPremium = profData.subscription_tier === 'premium' || profData.subscription_tier === 'premium_monthly' || profData.subscription_tier === 'premium_lifetime';
        if (!isSelfPremium) {
          localStorage.removeItem(`zb_partner_id_${currentProfileId}`);
          localStorage.removeItem(`zb_partner_code_${currentProfileId}`);
          localStorage.removeItem(`zb_partner_name_${currentProfileId}`);
          setPartnerId(null);
          setPartnerCode(null);
          setPartnerName(null);
          cachedPartnerId = null;
        } else {
          let partnerFound: { id: string; name: string; couple_code: string } | null = null;

          // Case 1: My profile has a linked partner couple code
          if (profData.partner_couple_code) {
            const { data: partnerProf, error: partnerErr } = await supabase
              .from('profiles')
              .select('id, name, couple_code, subscription_tier')
              .eq('couple_code', profData.partner_couple_code)
              .maybeSingle();

            if (!partnerErr && partnerProf) {
              const isPartnerPremium = partnerProf.subscription_tier === 'premium' || partnerProf.subscription_tier === 'premium_monthly' || partnerProf.subscription_tier === 'premium_lifetime';
              if (isPartnerPremium) {
                partnerFound = partnerProf;
              }
            }
          }

          // Case 2: Someone mutually connected to us
          if (!partnerFound && userCoupleCode) {
            const { data: mutualProf, error: mutualErr } = await supabase
              .from('profiles')
              .select('id, name, couple_code, subscription_tier')
              .eq('partner_couple_code', userCoupleCode)
              .maybeSingle();

            if (!mutualErr && mutualProf) {
              const isPartnerPremium = mutualProf.subscription_tier === 'premium' || mutualProf.subscription_tier === 'premium_monthly' || mutualProf.subscription_tier === 'premium_lifetime';
              if (isPartnerPremium) {
                // Mutually write in DB!
                try {
                  await supabase.from('profiles').update({ partner_couple_code: mutualProf.couple_code }).eq('id', currentProfileId);
                } catch (e) {}
                partnerFound = mutualProf;
              }
            }
          }

          if (partnerFound) {
            localStorage.setItem(`zb_partner_id_${currentProfileId}`, partnerFound.id);
            localStorage.setItem(`zb_partner_code_${currentProfileId}`, partnerFound.couple_code);
            localStorage.setItem(`zb_partner_name_${currentProfileId}`, partnerFound.name);
            setPartnerId(partnerFound.id);
            setPartnerCode(partnerFound.couple_code);
            setPartnerName(partnerFound.name);
            cachedPartnerId = partnerFound.id;
          } else {
            localStorage.removeItem(`zb_partner_id_${currentProfileId}`);
            localStorage.removeItem(`zb_partner_code_${currentProfileId}`);
            localStorage.removeItem(`zb_partner_name_${currentProfileId}`);
            setPartnerId(null);
            setPartnerCode(null);
            setPartnerName(null);
            cachedPartnerId = null;
          }
        }
      }

      // 1. Fetch transactions (including partner transactions if linked)
      const userIds = cachedPartnerId ? [currentProfileId, cachedPartnerId] : [currentProfileId];
      let annotatedTx: any[] = [];
      try {
        const { data: txData, error: txErr } = await supabase
          .from('transactions')
          .select('*')
          .in('user_id', userIds)
          .order('date', { ascending: false });

        if (!txErr && txData) {
          annotatedTx = txData.map(t => ({
            ...t,
            partnerName: cachedPartnerId && t.user_id === cachedPartnerId
              ? (localStorage.getItem(`zb_partner_name_${currentProfileId}`) || 'Partner')
              : undefined
          }));
          // Cache transactions locally for offline fallback
          localStorage.setItem(`zb_tx_cache_${currentProfileId}`, JSON.stringify(annotatedTx));
        } else {
          // Fallback to cached transactions on Supabase error
          const cached = localStorage.getItem(`zb_tx_cache_${currentProfileId}`);
          if (cached) annotatedTx = JSON.parse(cached);
        }
      } catch (_fetchErr) {
        // Network error — silently use local cache
        const cached = localStorage.getItem(`zb_tx_cache_${currentProfileId}`);
        if (cached) annotatedTx = JSON.parse(cached);
      }
      setTransactions(annotatedTx);

      // 2. Fetch budgets
      try {
        const { data: bgtData, error: bgtErr } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', currentProfileId);

        if (!bgtErr && bgtData) {
          const mappedBudgets: CategoryBudget[] = bgtData.map(b => ({
            category: b.category as CategoryType,
            limit: parseFloat(b.limit_amount)
          }));
          setBudgets(mappedBudgets);
          localStorage.setItem(`zb_budgets_cache_${currentProfileId}`, JSON.stringify(mappedBudgets));
        } else {
          // Fallback to cached budgets
          const cachedBgt = localStorage.getItem(`zb_budgets_cache_${currentProfileId}`);
          if (cachedBgt) setBudgets(JSON.parse(cachedBgt));
        }
      } catch (_bgtErr) {
        const cachedBgt = localStorage.getItem(`zb_budgets_cache_${currentProfileId}`);
        if (cachedBgt) setBudgets(JSON.parse(cachedBgt));
      }

      // 3. Goals (Stored locally per profile id)
      const savedGoals = localStorage.getItem(`zb_goals_${currentProfileId}`);
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      } else {
        const defaultGoal = {
          id: Date.now().toString(),
          name: 'New iPhone 15',
          targetAmount: 800,
          currentAmount: 150,
          color: '#3b82f6'
        };
        setGoals([defaultGoal]);
        localStorage.setItem(`zb_goals_${currentProfileId}`, JSON.stringify([defaultGoal]));
      }

      // 4. Currency settings
      const savedCurrency = localStorage.getItem(`zb_currency_${currentProfileId}`);
      const manuallySet = localStorage.getItem(`zb_currency_manually_set_${currentProfileId}`) === 'true';
      if (savedCurrency && manuallySet) {
        setCurrency(savedCurrency);
      } else {
        // Fallback: If no preference is manually saved, detect using timezone/locale first
        const isIndia = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata' || navigator.language.includes('IN');
        const defaultCurr = isIndia ? 'INR' : 'USD';
        setCurrency(defaultCurr);
        localStorage.setItem(`zb_currency_${currentProfileId}`, defaultCurr);
        
        // Asynchronously check IP to refine this detection dynamically
        try {
          const res = await fetch('https://ipapi.co/json/');
          if (res.ok) {
            const data = await res.json();
            if (data && data.country_code) {
              const detected = data.country_code === 'IN' ? 'INR' : 'USD';
              setCurrency(detected);
              localStorage.setItem(`zb_currency_${currentProfileId}`, detected);
            }
          }
        } catch (e) {
          console.warn('IP location fetch skipped or blocked:', e);
        }
      }

    } catch (err: any) {
      // Only show user-visible errors for non-network issues
      const msg = err?.message || '';
      const isNetworkError = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('ERR_NETWORK');
      if (!isNetworkError) {
        triggerToast(msg || 'Error syncing with cloud server.', 'warning');
      }
      // Always log for debugging
      console.warn('fetchUserData error (silenced from UI):', err);
    }
  };

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      case 'JPY': return '¥';
      case 'AED': return 'AED';
      case 'SAR': return 'SR';
      case 'CNY': return '¥';
      default: return '$';
    }
  };
  const currencySymbol = getCurrencySymbol();



  // Premium Check & Upgrade Handler
  const handleUpgradeSuccess = async (cycle: 'monthly' | 'yearly' | 'lifetime' = 'monthly') => {
    try {
      const expiryDate = cycle === 'lifetime' 
        ? null 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: 'premium',
          premium_expires_at: expiryDate
        })
        .eq('id', currentProfileId);

      if (error) throw error;

      // Handle referral reward checks
      try {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('referred_by')
          .eq('id', currentProfileId)
          .maybeSingle();

        if (myProfile && myProfile.referred_by) {
          const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('id, subscription_tier, premium_expires_at')
            .eq('referral_code', myProfile.referred_by)
            .maybeSingle();

          if (inviterProfile) {
            const currentExpiry = inviterProfile.premium_expires_at ? new Date(inviterProfile.premium_expires_at) : new Date();
            const baseTime = currentExpiry.getTime() > Date.now() ? currentExpiry.getTime() : Date.now();
            const newExpiryDate = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();

            await supabase
              .from('profiles')
              .update({
                subscription_tier: 'premium',
                premium_expires_at: newExpiryDate
              })
              .eq('id', inviterProfile.id);

            console.log('ZenBudget: Inviter rewarded with 30 days of Premium successfully.');
          }
        }
      } catch (refErr) {
        console.warn('ZenBudget: Referral rewarding skipped or columns missing:', refErr);
      }

      setSubscriptionTier('premium');
      setPremiumExpiresAt(expiryDate);
      triggerToast('Upgrade Successful! Premium features unlocked.', 'success');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update database status.', 'warning');
    }
  };

  const verifyLimitBeforeAdd = () => {
    const isPremium = subscriptionTier === 'premium_monthly' || subscriptionTier === 'premium_lifetime' || subscriptionTier === 'premium';
    if (isPremium) return true;

    // Check trial duration
    if (isTrialExpired()) {
      setIsSubBlocker(true);
      setIsSubModalOpen(true);
      triggerToast('Your 7-day free trial has expired! Please upgrade.', 'warning');
      return false;
    }

    // Check transaction counts
    if (transactions.length >= 10) {
      setIsSubBlocker(true);
      setIsSubModalOpen(true);
      triggerToast('Trial transaction limit reached (max 10). Upgrade to unlock unlimited records!', 'warning');
      return false;
    }

    return true;
  };

  // Handlers
  const doSaveTransaction = async (txData: Omit<Transaction, 'id'> & { id?: string }) => {
    let isEditing = !!txData.id;
    let nextTransactions: Transaction[] = [];

    // Verify limit before adding new records
    if (!isEditing && !verifyLimitBeforeAdd()) {
      return;
    }

    // Convert input active currency amount to Base USD for database storage
    const currentRate = rates[currency] || 1;
    const baseUSDAmount = txData.amount / currentRate;

    try {
      if (isEditing && txData.id) {
        // 1. Update local state & localStorage first
        nextTransactions = transactions.map(t => t.id === txData.id ? { ...t, ...txData, amount: baseUSDAmount } as Transaction : t);
        setTransactions(nextTransactions);
        localStorage.setItem(`zb_transactions_${currentProfileId}`, JSON.stringify(nextTransactions));
        triggerToast('Transaction updated successfully!', 'success');

        // 2. Perform background database synchronization
        try {
          const { error } = await supabase
            .from('transactions')
            .update({
              title: txData.title,
              amount: baseUSDAmount,
              category: txData.category,
              date: txData.date,
              type: txData.type,
              notes: txData.notes
            })
            .eq('id', txData.id);
          if (error) {
            console.warn('Supabase update sync deferred:', error.message);
          }
        } catch (syncErr) {
          console.warn('Supabase update sync connection deferred:', syncErr);
        }
      } else {
        // Create sync
        const newTxId = Math.random().toString(36).substring(2, 9);
        const newTx = {
          id: newTxId,
          user_id: currentProfileId,
          title: txData.title,
          amount: baseUSDAmount,
          category: txData.category,
          date: txData.date,
          type: txData.type,
          notes: txData.notes,
          accountId: txData.accountId,
          transferToAccountId: txData.transferToAccountId
        };

        // 1. Update local state & localStorage first
        const newTxWithAccount = { ...newTx, accountId: txData.accountId, transferToAccountId: txData.transferToAccountId };
        nextTransactions = [newTxWithAccount, ...transactions];
        setTransactions(nextTransactions);
        localStorage.setItem(`zb_transactions_${currentProfileId}`, JSON.stringify(nextTransactions));

        // 🏦 Auto-update account balance on expense/income
        if (txData.accountId && (txData.type === 'expense' || txData.type === 'income')) {
          setAccounts(prev => {
            const updated = prev.map(a => {
              if (a.id === txData.accountId) {
                const delta = txData.type === 'expense' ? -txData.amount : txData.amount;
                const newBalance = Math.max(0, a.balance + delta);
                return { ...a, balance: newBalance };
              }
              return a;
            });
            if (currentProfileId) {
              localStorage.setItem(`zb_accounts_${currentProfileId}`, JSON.stringify(updated));
            }
            return updated;
          });
        }

        if (txData.type === 'income') {
          const displayAmount = (baseUSDAmount * currentRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          addNotification(
            "Income Logged 💰",
            `Received ${currencySymbol}${displayAmount} for "${txData.title}"`,
            'income'
          );
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
          triggerToast('Transaction added successfully!', 'success');
        } else {
          const displayAmount = (baseUSDAmount * currentRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          addNotification(
            "Expense Logged 💸",
            `Spent ${currencySymbol}${displayAmount} on "${txData.title}" (${txData.category})`,
            'expense'
          );
          triggerToast('Transaction added successfully!', 'success');
        }

        // Award Zen Companion Points (+10) on adding a new transaction
        const petPointsKey = `zb_pet_points_${currentProfileId}`;
        const currentPoints = parseInt(localStorage.getItem(petPointsKey) || '0');
        localStorage.setItem(petPointsKey, (currentPoints + 10).toString());
        triggerToast('Transaction added! +10 Zen Pet Points! 🐷', 'success');

        // 2. Perform background database synchronization
        try {
          const { error } = await supabase.from('transactions').insert([newTx]);
          if (error) {
            console.warn('Supabase insert sync deferred:', error.message);
          }
        } catch (syncErr) {
          console.warn('Supabase insert sync connection deferred:', syncErr);
        }
      }

      // Check limit alert warnings for budget categories
      if (txData.type === 'expense') {
        const categoryLimit = budgets.find(b => b.category === txData.category);
        if (categoryLimit) {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          const spentThisMonthInBase = nextTransactions
            .filter(t => {
              const txDate = new Date(t.date);
              return t.type === 'expense' && 
                     t.category === txData.category && 
                     txDate.getMonth() === currentMonth && 
                     txDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

          if (spentThisMonthInBase > categoryLimit.limit) {
            const excess = (spentThisMonthInBase - categoryLimit.limit) * currentRate;
            addNotification(
              "Budget Limit Exceeded! ⚠️",
              `Limit exceeded for ${txData.category.toUpperCase()} by ${currencySymbol}${excess.toFixed(0)}!`,
              'warning'
            );
            setConfirmDialog({
              isOpen: true,
              title: "Budget Limit Exceeded! ⚠️",
              message: `Warning: You have exceeded the set budget limit for ${txData.category.toUpperCase()} by ${currencySymbol}${excess.toFixed(0)}!`,
              type: 'warning',
              onConfirm: () => setConfirmDialog(null)
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Local transaction save error:', err);
      triggerToast(err.message || 'Operation failed.', 'warning');
    }

    setEditingTransaction(null);
  };

  const handleSaveTransaction = async (txData: Omit<Transaction, 'id'> & { id?: string }) => {
    // Insufficient Balance Validation
    if (!txData.id && txData.type === 'expense' && accounts && accounts.length > 0) {
      const selectedAcc = accounts.find(a => a.id === txData.accountId);
      const accBalance = selectedAcc ? (selectedAcc.balance || 0) : accounts.reduce((s, a) => s + (a.balance || 0), 0);
      if (accBalance <= 0 || accBalance < txData.amount) {
        triggerToast('⚠️ Insufficient Balance in Account! Please add funds or select another wallet.', 'danger');
        return;
      }
    }

    // Budget limit urgency check BEFORE saving (only for new expense transactions)
    if (!txData.id && txData.type === 'expense') {
      const categoryLimit = budgets.find(b => b.category === txData.category);
      if (categoryLimit) {
        const currentRate = rates[currency] || 1;
        const baseUSDAmount = txData.amount / currentRate;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const spentThisMonthInBase = transactions
          .filter(t => {
            const txDate = new Date(t.date);
            return t.type === 'expense' &&
                   t.category === txData.category &&
                   txDate.getMonth() === currentMonth &&
                   txDate.getFullYear() === currentYear;
          })
          .reduce((sum, t) => sum + t.amount, 0) + baseUSDAmount;

        if (spentThisMonthInBase > categoryLimit.limit) {
          const excess = (spentThisMonthInBase - categoryLimit.limit) * currentRate;
          setBudgetUrgencyPending({
            txData,
            categoryName: txData.category.charAt(0).toUpperCase() + txData.category.slice(1),
            excess: `${currencySymbol}${excess.toFixed(0)}`
          });
          setIsModalOpen(false);
          return; // Stop here — wait for user decision
        }
      }
    }
    await doSaveTransaction(txData);
  };

  const handleDeleteTransactionRequest = (id: string) => {
    // Non-Premium / Free Trial Delete Restriction:
    if (subscriptionTier === 'trial') {
      triggerToast('🔒 Deleting transactions requires ZenBudget Premium!', 'info');
      setShowSubscriptionModal(true);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Transaction?',
      message: 'Are you sure you want to delete this transaction record? This action is permanent.',
      type: 'danger',
      onConfirm: async () => {
        // 1. Update local state & localStorage first
        const filtered = transactions.filter(t => t.id !== id);
        setTransactions(filtered);
        localStorage.setItem(`zb_transactions_${currentProfileId}`, JSON.stringify(filtered));
        setConfirmDialog(null);
        triggerToast('Transaction deleted successfully.', 'info');

        // 2. Perform background database synchronization
        try {
          const { error } = await supabase.from('transactions').delete().eq('id', id);
          if (error) {
            console.warn('Supabase delete sync deferred:', error.message);
          }
        } catch (syncErr) {
          console.warn('Supabase delete sync connection deferred:', syncErr);
        }
      }
    });
  };

  const getExtraSlotAmountNumber = () => {
    let dynamicPrices: any = {};
    try { dynamicPrices = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}'); } catch (_) {}
    if (currency === 'INR') return dynamicPrices.inr_slot_price || 10;
    if (currency === 'USD') return dynamicPrices.usd_slot_price || 1.99;
    if (currency === 'EUR') return dynamicPrices.eur_slot_price || 1.85;
    if (currency === 'GBP') return dynamicPrices.gbp_slot_price || 1.59;
    if (currency === 'CAD') return dynamicPrices.cad_slot_price || 2.49;
    if (currency === 'AUD') return dynamicPrices.aud_slot_price || 2.79;
    const baseUSD = dynamicPrices.usd_slot_price || 1.99;
    return parseFloat((baseUSD * (rates[currency] || 1)).toFixed(2));
  };

  const getExtraSlotPriceDisplay = () => {
    const amount = getExtraSlotAmountNumber();
    return `${currencySymbol}${amount}`;
  };

  const handleBuyExtraBudgetSlot = async () => {
    const priceDisplay = getExtraSlotPriceDisplay();
    const amountNum = getExtraSlotAmountNumber();
    try {
      triggerToast(`Initializing Cashfree payment (${priceDisplay})...`, 'info');
      let payment_session_id = '';
      const endpoints = [
        '/api/create-payment-session',
        'https://zenbudget-tracker.vercel.app/api/create-payment-session',
        'https://admin-portal-zenbudget.vercel.app/api/create-payment-session'
      ];

      for (const url of endpoints) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amountNum,
              planType: 'extra_budget_slot',
              email: localStorage.getItem('zb_user_email') || 'user@zenbudget.app',
              userId: currentProfileId
            })
          });
          const text = await response.text();
          if (text && !text.startsWith('<')) {
            const data = JSON.parse(text);
            if (data.payment_session_id) {
              payment_session_id = data.payment_session_id;
              break;
            }
          }
        } catch (fetchErr) {
          console.warn('Payment session fetch error for', url, fetchErr);
        }
      }

      if (!payment_session_id) {
        triggerToast('Could not launch Cashfree payment gateway. Please try again.', 'warning');
        return;
      }

      const payUrl = `https://zenbudget-tracker.vercel.app/pay.html?session_id=${payment_session_id}`;
      if ((window as any).Cashfree) {
        const cf = (window as any).Cashfree({ mode: 'production' });
        cf.checkout({
          paymentSessionId: payment_session_id,
          redirectTarget: '_modal'
        }).then(async (result: any) => {
          if (result && result.paymentDetails) {
            const currentSlots = parseInt(localStorage.getItem(`zb_extra_budget_slots_${currentProfileId}`) || '0');
            const newSlots = currentSlots + 1;
            localStorage.setItem(`zb_extra_budget_slots_${currentProfileId}`, newSlots.toString());
            triggerToast(`Extra budget slot unlocked for ${priceDisplay}! 🎉`, 'success');
            try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (e) {}

            // Track slot purchase in Supabase for Admin Portal analytics
            try {
              const userEmail = localStorage.getItem('zb_user_email') || '';
              await supabase.from('slot_purchases').insert([{
                user_id: currentProfileId,
                user_name: userName || 'ZenBudget User',
                user_email: userEmail,
                slot_count: 1,
                price_paid: getExtraSlotAmountNumber(),
                currency: currency,
                created_at: new Date().toISOString()
              }]);
            } catch (err) {
              console.warn('Slot purchase DB logging:', err);
            }
          }
        });
      } else {
        window.location.href = payUrl;
      }
    } catch (err: any) {
      triggerToast(err.message || 'Payment failed', 'warning');
    }
  };

  const handleSaveBudget = async (category: CategoryType, limitInActiveCurrency: number) => {
    const isPremium = subscriptionTier === 'premium_monthly' || subscriptionTier === 'premium_lifetime' || subscriptionTier === 'premium';

    // Trial limits check: max 2 free budgets, then ₹10 (or active currency equivalent) per extra
    if (!isPremium) {
      const isNew = !budgets.some(b => b.category === category);
      const freeSlots = 2;
      const purchasedSlots = parseInt(localStorage.getItem(`zb_extra_budget_slots_${currentProfileId}`) || '0');
      const maxAllowed = freeSlots + purchasedSlots;

      if (isNew && budgets.length >= maxAllowed) {
        const priceDisplay = getExtraSlotPriceDisplay();
        // Show buy extra limit popup
        setConfirmDialog({
          isOpen: true,
          title: '🔒 Budget Limit Slot Required',
          message: `You've used all ${maxAllowed} budget limit slots (${freeSlots} free${purchasedSlots > 0 ? ` + ${purchasedSlots} extra` : ''}). Buy +1 Extra Budget Limit Slot for ${priceDisplay} (per limit slot price), or upgrade to Premium!`,
          type: 'warning',
          confirmText: `💳 Buy Extra Slot (${priceDisplay})`,
          cancelText: '⭐ Go Premium',
          onConfirm: () => {
            setConfirmDialog(null);
            // Process micro-payment for extra budget slot
            handleBuyExtraBudgetSlot();
          },
          onCancel: () => {
            setConfirmDialog(null);
            setIsSubBlocker(false);
            setIsSubModalOpen(true);
          }
        });
        return;
      }
    }

    // Convert active currency limit to Base USD for storage
    const currentRate = rates[currency] || 1;
    const baseUSDLimit = limitInActiveCurrency / currentRate;

    try {
      // 1. Update local state & localStorage first
      const exists = budgets.some(b => b.category === category);
      let updated: CategoryBudget[];
      if (exists) {
        updated = budgets.map(b => b.category === category ? { ...b, limit: baseUSDLimit } : b);
      } else {
        updated = [...budgets, { category, limit: baseUSDLimit }];
      }
      setBudgets(updated);
      localStorage.setItem(`zb_budgets_${currentProfileId}`, JSON.stringify(updated));
      triggerToast(`Budget limit updated for ${category.toUpperCase()}!`, 'success');

      // 2. Perform background database synchronization
      try {
        const budgetEntry = {
          user_id: currentProfileId,
          category,
          limit_amount: baseUSDLimit
        };
        const { error } = await supabase
          .from('budgets')
          .upsert(budgetEntry, { onConflict: 'user_id,category' });
        if (error) {
          console.warn('Supabase budget upsert sync deferred:', error.message);
        }
      } catch (syncErr) {
        console.warn('Supabase budget upsert connection deferred:', syncErr);
      }
    } catch (err: any) {
      console.error('Local budget save error:', err);
      triggerToast(err.message || 'Operation failed.', 'warning');
    }
  };

  const handleSaveGoal = (updatedGoals: SavingsGoal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem(`zb_goals_${currentProfileId}`, JSON.stringify(updatedGoals));
  };

  const handleAddNewGoal = (name: string, targetInActiveCurrency: number, color: string) => {
    const currentRate = rates[currency] || 1;
    const targetInBaseUSD = targetInActiveCurrency / currentRate;
    const newGoal: SavingsGoal = {
      id: Date.now().toString(),
      name,
      targetAmount: targetInBaseUSD,
      currentAmount: 0,
      color
    };
    const updated = [...goals, newGoal];
    handleSaveGoal(updated);
    triggerToast(`Goal "${name}" created successfully!`, 'success');
  };

  const handleEditGoal = (goalId: string, name: string, targetInActiveCurrency: number, color: string) => {
    const currentRate = rates[currency] || 1;
    const targetInBaseUSD = targetInActiveCurrency / currentRate;
    const updated = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          name,
          targetAmount: targetInBaseUSD,
          color
        };
      }
      return g;
    });
    handleSaveGoal(updated);
    triggerToast(`Goal "${name}" updated successfully!`, 'success');
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter(g => g.id !== goalId);
    handleSaveGoal(updated);
    triggerToast(`Goal removed successfully!`, 'success');
  };

  const handleAddGoalProgress = (goalId: string, amountInActiveCurrency: number) => {
    const currentRate = rates[currency] || 1;
    const amountInBaseUSD = amountInActiveCurrency / currentRate;

    const updated = goals.map(g => {
      if (g.id === goalId) {
        const nextAmount = Math.min(g.targetAmount, g.currentAmount + amountInBaseUSD);
        if (nextAmount >= g.targetAmount && g.currentAmount < g.targetAmount) {
          confetti({ particleCount: 150, spread: 80, colors: [g.color, '#fff'] });
          triggerToast(`Congratulations! You reached your goal "${g.name}"!`, 'success');
        } else {
          triggerToast(`Contribution of ${currencySymbol}${amountInActiveCurrency} saved to "${g.name}"`, 'success');
        }
        return { ...g, currentAmount: nextAmount };
      }
      return g;
    });
    handleSaveGoal(updated);
  };

  // Reset database triggers local arrays wipeout
  const handleResetDataRequest = () => {
    // Premium Lock to prevent free trial users from bypassing limits by clearing transactions
    if (subscriptionTier !== 'premium') {
      setIsSubBlocker(false);
      setIsSubModalOpen(true);
      triggerToast('Upgrade to Premium to clear database ledger! Trial users cannot reset.', 'warning');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Clear Profiles Ledger?',
      message: 'Are you sure you want to clear all data and reset to empty state for this profile? This cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Delete from Supabase
          const { error: txErr } = await supabase.from('transactions').delete().eq('user_id', currentProfileId);
          const { error: bgtErr } = await supabase.from('budgets').delete().eq('user_id', currentProfileId);
          
          if (txErr) throw txErr;
          if (bgtErr) throw bgtErr;

          setTransactions([]);
          setBudgets([]);
          setGoals([]);
          localStorage.removeItem(`zb_goals_${currentProfileId}`);

          setActiveView('dashboard');
          setConfirmDialog(null);
          triggerToast('Ledger cleared successfully.', 'info');
        } catch (err: any) {
          triggerToast(err.message || 'Reset failed.', 'warning');
        }
      }
    });
  };

  const handleExportCSV = () => {
    // Premium Feature Lock
    if (subscriptionTier !== 'premium') {
      setIsSubBlocker(false);
      setIsSubModalOpen(true);
      triggerToast('Upgrade to Premium to export CSV report spreadsheets!', 'warning');
      return;
    }

    const currentRate = rates[currency] || 1;
    const headers = 'ID,Title,Amount,Category,Date,Type,Notes\n';
    const rows = transactions.map(t => {
      const convertedAmount = t.amount * currentRate;
      return `"${t.id}","${t.title.replace(/"/g, '""')}",${convertedAmount.toFixed(2)},"${t.category}","${t.date}","${t.type}","${(t.notes || '').replace(/"/g, '""')}"`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `zenbudget_report_${userName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Report exported successfully!', 'success');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('zb_local_session_profile');
      setIsLocked(true);
      setCurrentProfileId('');
      setUserName('');
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Convert Base USD values dynamically into active selected currency for subcomponents
  const activeRate = rates[currency] || 1;

  const convertedTransactions = (transactions || []).map(t => ({
    ...t,
    amount: (t.amount || 0) * activeRate,
    paidBy: partnerId && t.user_id === partnerId ? 'Partner' : 'You'
  }));

  const convertedBudgets = (budgets || []).map(b => ({
    ...b,
    limit: currency === 'INR' ? Math.round((b.limit || 0) * activeRate) : Number(((b.limit || 0) * activeRate).toFixed(2))
  }));

  const convertedGoals = (goals || []).map(g => ({
    ...g,
    targetAmount: currency === 'INR' ? Math.round((g.targetAmount || 0) * activeRate) : Number(((g.targetAmount || 0) * activeRate).toFixed(2)),
    currentAmount: currency === 'INR' ? Math.round((g.currentAmount || 0) * activeRate) : Number(((g.currentAmount || 0) * activeRate).toFixed(2))
  }));

  const handleSaveProfile = async (newName: string, newPin: string, newCurrency: string, newLanguage: string, newEmail?: string) => {
    try {
      const userPhone = localStorage.getItem('zb_user_phone') || '';
      const updateData: any = { name: newName, pin: newPin };
      if (newEmail) updateData.email = newEmail;
      if (userPhone) updateData.phone = userPhone;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', currentProfileId);

      if (error) console.warn('Supabase profile update warning:', error);

      setUserName(newName);
      setUserPin(newPin);
      if (newEmail) localStorage.setItem('zb_user_email', newEmail);
      
      // Update currency
      if (newCurrency !== currency) {
        setCurrency(newCurrency);
        localStorage.setItem(`zb_currency_${currentProfileId}`, newCurrency);
        localStorage.setItem(`zb_currency_manually_set_${currentProfileId}`, 'true');
        window.dispatchEvent(new Event('currencychange')); // trigger full re-render
      }

      // Update language (synchronous — setI18nLanguage is statically imported)
      setI18nLanguage(newLanguage as any);
      setLanguage(newLanguage);
      localStorage.setItem(`zb_language_${currentProfileId}`, newLanguage);
      localStorage.setItem('zb_language', newLanguage);
      window.dispatchEvent(new Event('languagechange'));

      triggerToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update profile details.', 'warning');
      throw err;
    }
  };

  const handleClaimReferral = async (code: string): Promise<boolean> => {
    if (!currentProfileId) return false;
    let cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return false;

    // Normalize to ZB- prefix to perform validation checks
    if (!cleanCode.startsWith('ZB-')) {
      cleanCode = 'ZB-' + cleanCode;
    }

    // Verify self-referral
    const myCode = localStorage.getItem('zb_user_referral_code') || localStorage.getItem('zb_invite_code');
    if (myCode) {
      let myCodeNormal = myCode.trim().toUpperCase();
      if (!myCodeNormal.startsWith('ZB-')) {
        myCodeNormal = 'ZB-' + myCodeNormal;
      }
      if (myCodeNormal === cleanCode) {
        triggerToast('You cannot claim your own referral code!', 'warning');
        return false;
      }
    }

    try {
      // Query inviter by matching either the full code (ZB-XXXX) or the stripped code (XXXX)
      const strippedCode = cleanCode.replace('ZB-', '');
      const { data: inviter, error: inviterErr } = await supabase
        .from('profiles')
        .select('id, name, referral_code')
        .or(`referral_code.eq.${cleanCode},referral_code.eq.${strippedCode}`)
        .maybeSingle();

      if (inviterErr) throw inviterErr;
      if (!inviter) {
        triggerToast('Invalid referral code. Please check spelling!', 'warning');
        return false;
      }

      // Link using the matching DB code value
      const dbReferralCode = inviter.referral_code;
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ referred_by: dbReferralCode })
        .eq('id', currentProfileId);

      if (updateErr) throw updateErr;

      setReferredBy(dbReferralCode);
      localStorage.setItem('zb_referred_by', dbReferralCode);
      if (inviter && inviter.name) {
        localStorage.setItem('zb_inviter_name', inviter.name);
      }
      triggerToast(`Referral claimed successfully! Invited by ${inviter.name}`, 'success');
      addNotification(
        "Referral Code Claimed! 🎁",
        `Invited by ${inviter.name} (${cleanCode}). Upgrade your plan to unlock rewards!`,
        'success'
      );
      return true;
    } catch (err: any) {
      console.warn('Claim Referral database sync deferred:', err);
      // Fallback
      setReferredBy(cleanCode);
      localStorage.setItem('zb_referred_by', cleanCode);
      triggerToast(`Referral code saved!`, 'success');
      return true;
    }
  };

  const handleConnectPartner = async (code: string): Promise<boolean> => {
    if (!currentProfileId) return false;

    const isPremium = subscriptionTier === 'premium_monthly' || subscriptionTier === 'premium_lifetime' || subscriptionTier === 'premium';
    if (!isPremium) {
      triggerToast('You must upgrade to Premium to connect with a partner!', 'warning');
      return false;
    }

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return false;

    if (coupleCode && coupleCode.toUpperCase() === cleanCode) {
      triggerToast('You cannot connect to your own couple code!', 'warning');
      return false;
    }

    try {
      const { data: partnerProf, error: partnerErr } = await supabase
        .from('profiles')
        .select('id, name, couple_code, subscription_tier')
        .eq('couple_code', cleanCode)
        .maybeSingle();

      if (partnerErr) throw partnerErr;
      if (!partnerProf) {
        triggerToast('Invalid partner couple code. Please verify spelling!', 'warning');
        return false;
      }

      const isPartnerPremium = partnerProf.subscription_tier === 'premium_monthly' || partnerProf.subscription_tier === 'premium_lifetime' || partnerProf.subscription_tier === 'premium';
      if (!isPartnerPremium) {
        triggerToast(`Partner ${partnerProf.name} must also upgrade to Premium to sync ledgers!`, 'warning');
        return false;
      }

      localStorage.setItem(`zb_partner_id_${currentProfileId}`, partnerProf.id);
      localStorage.setItem(`zb_partner_code_${currentProfileId}`, cleanCode);
      localStorage.setItem(`zb_partner_name_${currentProfileId}`, partnerProf.name);
      setPartnerId(partnerProf.id);
      setPartnerCode(cleanCode);
      setPartnerName(partnerProf.name);

      const { error: updateSelfErr } = await supabase
        .from('profiles')
        .update({ partner_couple_code: cleanCode })
        .eq('id', currentProfileId);

      if (updateSelfErr) throw updateSelfErr;

      // Mutual sync dual-link
      await supabase
        .from('profiles')
        .update({ partner_couple_code: coupleCode })
        .eq('id', partnerProf.id);

      triggerToast(`Connected successfully with ${partnerProf.name}!`, 'success');
      addNotification(
        "Partner Connected! 👥",
        `You have linked ledgers with ${partnerProf.name}. You can now view both transactions together.`,
        'success'
      );

      fetchDataFromSupabase();
      return true;
    } catch (err: any) {
      console.error('Failed to link partner:', err);
      triggerToast(err.message || 'Linking failed.', 'warning');
      return false;
    }
  };

  const handleDisconnectPartner = async () => {
    if (!currentProfileId) return;

    const oldPartnerId = partnerId;
    const oldPartnerCode = partnerCode;

    localStorage.removeItem(`zb_partner_id_${currentProfileId}`);
    localStorage.removeItem(`zb_partner_code_${currentProfileId}`);
    localStorage.removeItem(`zb_partner_name_${currentProfileId}`);
    setPartnerId(null);
    setPartnerCode(null);
    setPartnerName(null);

    try {
      await supabase
        .from('profiles')
        .update({ partner_couple_code: null })
        .eq('id', currentProfileId);

      if (oldPartnerId) {
        await supabase
          .from('profiles')
          .update({ partner_couple_code: null })
          .eq('id', oldPartnerId);
      } else if (oldPartnerCode) {
        await supabase
          .from('profiles')
          .update({ partner_couple_code: null })
          .eq('couple_code', oldPartnerCode);
      }
    } catch (e) {
      console.error('Failed to disconnect partner mutually in DB:', e);
    }

    triggerToast('Partner ledger disconnected.', 'info');
    fetchDataFromSupabase();
  };

  if (isLocked) {
    return <LockScreen onUnlock={(profileId, name, tier, trialStart, pin, premiumExpires) => {
      setCurrentProfileId(profileId);
      setUserName(name);
      setSubscriptionTier(tier);
      setTrialStartDate(trialStart);
      setUserPin(pin);
      setPremiumExpiresAt(premiumExpires);

      localStorage.setItem('zb_profile_id', profileId);
      localStorage.setItem('zb_user_name', name);
      localStorage.setItem('zb_subscription_tier', tier);
      localStorage.setItem('zb_trial_start_date', trialStart);
      localStorage.setItem('zb_user_pin', pin);
      if (premiumExpires) {
        localStorage.setItem('zb_premium_expires_at', premiumExpires);
      } else {
        localStorage.removeItem('zb_premium_expires_at');
      }
      

      // Check onboarding
      const effectiveId = profileId || localStorage.getItem('zb_profile_id') || 'local';
      if (!localStorage.getItem(`zb_onboarded_${effectiveId}`) && !localStorage.getItem('zb_onboarded_global')) {
        setShowOnboarding(true);
      } else {
        // Trigger Proactive AI Briefs if already onboarded
        const todayStr = new Date().toISOString().split('T')[0];
        const hour = new Date().getHours();
        
        const morningKey = `zb_morning_shown_${effectiveId}_${todayStr}`;
        const eveningKey = `zb_evening_shown_${effectiveId}_${todayStr}`;
        
        if (hour >= 6 && hour < 12 && !localStorage.getItem(morningKey)) {
          setShowMorningBrief(true);
          localStorage.setItem(morningKey, 'true');
        } else if (hour >= 20 && !localStorage.getItem(eveningKey)) {
          setShowEveningReflection(true);
          localStorage.setItem(eveningKey, 'true');
        }
      }

      setIsLocked(false);
      setTimeout(() => {
        fetchDataFromSupabase();
      }, 50);
    }} />;
  }

  if (showOnboarding) {
    return <Onboarding 
      currencySymbol={currencySymbol} 
      onComplete={(goal) => {
        const effectiveId = currentProfileId || localStorage.getItem('zb_profile_id') || 'local';
        if (goal) {
          const updatedGoals = [goal];
          setGoals(updatedGoals);
          localStorage.setItem(`zb_goals_${effectiveId}`, JSON.stringify(updatedGoals));
        } else {
          setGoals([]);
          localStorage.setItem(`zb_goals_${effectiveId}`, JSON.stringify([]));
        }
        localStorage.setItem(`zb_onboarded_${effectiveId}`, 'true');
        localStorage.setItem('zb_onboarded_global', 'true');
        setShowOnboarding(false);
      }} 
    />;
  }



  return (
    <div 
      key={langKey} 
      style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}
      onClickCapture={(e) => {
        if (isSubscriptionExpired()) {
          const target = e.target as HTMLElement;
          if (target && target.closest('.subscription-modal-wrapper')) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          setIsSubBlocker(true);
          setIsSubModalOpen(true);
        }
      }}
    >
      {/* Sticky Trial Expired Locked Banner */}
      {isSubscriptionExpired() && (
        <div 
          onClick={() => { setIsSubBlocker(true); setIsSubModalOpen(true); }}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '16px',
            margin: '12px 16px 0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⏳</span>
            <span>Free Trial Expired (All Features Locked)</span>
          </div>
          <span style={{ background: '#ffffff', color: '#dc2626', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 900 }}>
            UPGRADE PRO 🚀
          </span>
        </div>
      )}

      {/* Top action header - cleaned and simplified */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px 20px', 
        background: 'var(--bg-card)', 
        borderBottom: '1px solid var(--border-card)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 99
      }}>
        {/* Branding Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: "'Manrope', sans-serif" }}>
            <span style={{ color: '#22c55e' }}>Zen</span><span style={{ color: 'var(--text-primary)' }}>Budget</span>
          </span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
        </div>

        {/* Status Actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          {/* Scanner Button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            title="Scan & Pay"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease-out'
            }}
          >
            <QrCode size={15} />
          </button>


          {/* Notifications Button */}
          <button 
            onClick={() => setIsNotificationsOpen(true)} 
            title="Notifications"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease-out',
              position: 'relative'
            }}
          >
            <Bell size={15} />
            {notifications.some(n => n.unread) && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                boxShadow: '0 0 6px var(--primary)',
                border: '1.5px solid #09090f'
              }} />
            )}
          </button>

          {/* Premium Status Badge */}
          {subscriptionTier === 'premium' ? (
            <div style={{
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(99,102,241,0.15) 100%)',
              border: '1px solid rgba(236,72,153,0.3)',
              color: 'var(--secondary)',
              fontSize: '10px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={11} /> PREMIUM
            </div>
          ) : (
            <button
              onClick={() => {
                setIsSubBlocker(false);
                setIsSubModalOpen(true);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--primary)',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isTrialExpired() ? 'Expired' : `${getRemainingDays()}d left`}
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <main className="scroll-container" style={{ padding: '20px 20px 95px 20px' }}>
        {activeView === 'dashboard' && (
          <Dashboard 
            key={langKey}
            currentProfileId={currentProfileId}
            userName={userName}
            userAvatar={userAvatar}
            accounts={accounts}
            transactions={convertedTransactions}
            budgets={convertedBudgets}
            goals={convertedGoals}
            currencySymbol={currencySymbol}
            onAddTransactionClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            onViewAllTransactionsClick={() => setActiveView('transactions')}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsModalOpen(true);
            }}
            onAddGoalProgress={handleAddGoalProgress}
            onOpenStory={() => setShowStoryReport(true)}
            language={language}
            onAddNewGoal={handleAddNewGoal}
            subscriptionTier={subscriptionTier}
            trialStartDate={trialStartDate}
            premiumExpiresAt={premiumExpiresAt}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onForestClick={() => setActiveView('forest')}
            referralCount={referralCount}
            onAddAccountClick={() => setIsAddAccountOpen(true)}
            onOpenBankSync={() => setActiveView('bank_sync')}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onOpenLoans={() => setActiveView('loans')}
            onOpenProfile={() => setActiveView('profile')}
            onUpgradeClick={() => setIsSubModalOpen(true)}
            onDeleteAccount={handleDeleteAccount}
            onSaveTransaction={handleSaveTransaction}
          />
        )}
        {activeView === 'loans' && (
          <LoansView
            key={langKey}
            onBack={() => setActiveView('more')}
            loans={loans}
            accounts={accounts}
            currencySymbol={currencySymbol}
            onAddLoan={handleAddLoan}
            onRepayLoan={handleRepayLoan}
            onPayLoanViaUPI={handlePayLoanViaUPI}
          />
        )}
        {activeView === 'forest' && (
          <Forest 
            key={langKey}
            onBack={() => setActiveView('dashboard')}
            transactions={convertedTransactions}
          />
        )}
        {activeView === 'transactions' && (
          <Transactions 
            key={langKey}
            transactions={convertedTransactions}
            currencySymbol={currencySymbol}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransactionRequest}
          />
        )}
        {activeView === 'budgets' && (
          <Budgets 
            key={langKey}
            budgets={convertedBudgets}
            transactions={convertedTransactions}
            currencySymbol={currencySymbol}
            onSaveBudget={handleSaveBudget}
          />
        )}
        {activeView === 'analytics' && (
          <Analytics key={langKey} transactions={convertedTransactions} currencySymbol={currencySymbol} accounts={accounts} />
        )}
        {activeView === 'profile' && (
          <ProfileView 
            currentName={userName}
            currentPin={userPin}
            currentCurrency={currency}
            currentLanguage={language}
            currentEmail={localStorage.getItem('zb_user_email') || ''}
            currentTheme={theme}
            onSaveProfile={handleSaveProfile}
            onToggleTheme={(newTheme) => {
              setTheme(newTheme);
              localStorage.setItem('zb_theme', newTheme);
              const rootEl = document.getElementById('root');
              const docEl = document.documentElement;
              if (newTheme === 'light') {
                document.body.classList.remove('dark-theme');
                document.body.classList.add('light-theme');
                docEl.classList.remove('dark-theme');
                docEl.classList.add('light-theme');
                if (rootEl) {
                  rootEl.classList.remove('dark-theme');
                  rootEl.classList.add('light-theme');
                }
              } else {
                document.body.classList.remove('light-theme');
                document.body.classList.add('dark-theme');
                docEl.classList.remove('light-theme');
                docEl.classList.add('dark-theme');
                if (rootEl) {
                  rootEl.classList.remove('light-theme');
                  rootEl.classList.add('dark-theme');
                }
              }
            }}
            onBack={() => setActiveView('more')}
          />
        )}
        {activeView === 'wishlist' && (
          <WishlistBlocker
            key={langKey}
            onBack={() => setActiveView('more')}
            currentProfileId={currentProfileId}
            currencySymbol={currencySymbol}
            onAddTransaction={(title, amount, category) => {
              handleSaveTransaction({
                title,
                amount,
                category: category as CategoryType,
                date: new Date().toISOString().split('T')[0],
                type: 'expense'
              });
            }}
          />
        )}
        {activeView === 'simulator' && (
          <WealthSimulator
            key={langKey}
            onBack={() => setActiveView('more')}
            transactions={convertedTransactions}
            currencySymbol={currencySymbol}
          />
        )}
        {activeView === 'more' && (
          <MoreToolsView
            key={langKey}
            onNavigateToImpulseBlocker={() => setActiveView('wishlist')}
            onNavigateToSimulator={() => setActiveView('simulator')}
            onNavigateToSharedBudget={() => setActiveView('shared_budget')}
            onNavigateToReferral={() => setActiveView('referral')}
            onNavigateToLoans={() => setActiveView('loans')}
            onOpenBankSync={() => setActiveView('bank_sync')}
            onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
            onOpenAskZen={() => setIsHelpOpen(true)}
            onNavigateToMoneyForest={() => setActiveView('forest')}
            onNavigateToSettings={() => setActiveView('profile')}
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenSubscriptionModal={() => setIsSubModalOpen(true)}
            onExportCSV={handleExportCSV}
            onResetData={handleResetDataRequest}
            onLogout={() => setShowLogoutConfirm(true)}
            userReferralCode={userReferralCode}
            referralCount={referralCount}
            onNavigateToFollowUs={() => setActiveView('follow_us')}
          />
        )}
        {activeView === 'shared_budget' && (
          <SharedBudgetView
            key={langKey}
            onBack={() => setActiveView('more')}
            currentProfileId={currentProfileId}
            partnerCode={partnerCode}
            partnerName={partnerName}
            coupleCode={coupleCode || ''}
            onConnectPartner={handleConnectPartner}
            onDisconnectPartner={handleDisconnectPartner}
          />
        )}
        {activeView === 'referral' && (
          <ReferralView
            key={langKey}
            onBack={() => setActiveView('more')}
            userReferralCode={userReferralCode}
            referralCount={referralCount}
            onClaimReferral={handleClaimReferral}
          />
        )}
        {activeView === 'bank_sync' && (
          <BankSyncView
            key={langKey}
            onBack={() => setActiveView('more')}
            accounts={accounts}
            onAddAccount={handleAddAccount}
            currencySymbol={currencySymbol}
          />
        )}
        {activeView === 'follow_us' && (
          <FollowUsView
            key={langKey}
            onBack={() => setActiveView('more')}
          />
        )}
      </main>

      {/* Glass Bottom Navigation Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 10px 24px 10px',
        zIndex: 999
      }}>
        <button
          onClick={() => { if (checkExpiredGuard()) return; setActiveView('dashboard'); }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeView === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 600,
            transition: 'var(--transition-smooth)'
          }}
        >
          <LayoutDashboard size={20} style={{ color: activeView === 'dashboard' ? 'var(--primary)' : undefined }} />
          <span>{t('dashboard')}</span>
        </button>

        <button
          onClick={() => { if (checkExpiredGuard()) return; setActiveView('transactions'); }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeView === 'transactions' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 600,
            transition: 'var(--transition-smooth)'
          }}
        >
          <Receipt size={20} style={{ color: activeView === 'transactions' ? 'var(--primary)' : undefined }} />
          <span>{t('ledger')}</span>
        </button>

        <button
          onClick={() => { if (checkExpiredGuard()) return; setActiveView('budgets'); }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeView === 'budgets' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 600,
            transition: 'var(--transition-smooth)'
          }}
        >
          <PiggyBank size={20} style={{ color: activeView === 'budgets' ? 'var(--primary)' : undefined }} />
          <span>{t('limits')}</span>
        </button>

        <button
          onClick={() => { if (checkExpiredGuard()) return; setActiveView('analytics'); }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeView === 'analytics' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 600,
            transition: 'var(--transition-smooth)'
          }}
        >
          <BarChart3 size={20} style={{ color: activeView === 'analytics' ? 'var(--primary)' : undefined }} />
          <span>{t('stats')}</span>
        </button>

        <button
          onClick={() => { if (checkExpiredGuard()) return; setActiveView('more'); }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: ['more', 'profile', 'wishlist', 'simulator', 'forest'].includes(activeView) ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 600,
            transition: 'var(--transition-smooth)'
          }}
        >
          <Grid size={20} style={{ color: ['more', 'profile', 'wishlist', 'simulator', 'forest'].includes(activeView) ? 'var(--primary)' : undefined }} />
          <span>{t('more')}</span>
        </button>
      </nav>

      {/* Transaction Modal Drawer */}
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        currencySymbol={currencySymbol}
        accounts={accounts}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onTransfer={handleTransfer}
        onPayViaUPI={handleDirectCashfreePayment}
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
      />

      {/* Custom Confirmation Glassmorphic Modal */}
      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel || (() => setConfirmDialog(null))}
        />
      )}

      {/* Budget Urgency Modal — shown when transaction exceeds category limit */}
      {budgetUrgencyPending && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '24px',
            padding: '28px 24px',
            maxWidth: '360px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.15)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
              <h3 style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>
                Budget Limit Exceeded!
              </h3>
              <p style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
                This expense will exceed your <strong style={{ color: '#f59e0b' }}>{budgetUrgencyPending.categoryName}</strong> budget limit by <strong style={{ color: '#ef4444' }}>{budgetUrgencyPending.excess}</strong>.
              </p>
              <p style={{ color: 'var(--text-primary)', fontSize: '12px', marginTop: '10px', marginBottom: 0, fontWeight: 700 }}>
                Is this purchase <strong>urgent</strong>?
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={async () => {
                  const pending = budgetUrgencyPending;
                  setBudgetUrgencyPending(null);
                  await doSaveTransaction(pending.txData);
                  triggerToast('Urgent transaction added ⚡', 'warning');
                }}
                style={{
                  padding: '14px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff', fontSize: '14px', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.3)'
                }}
              >
                🔴 Yes, It's Urgent — Add Anyway
              </button>
              <button
                onClick={() => {
                  setBudgetUrgencyPending(null);
                  triggerToast('Transaction blocked — not urgent 🚫', 'info');
                }}
                style={{
                  padding: '14px', borderRadius: '14px',
                  border: '1px solid var(--border-input)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px'
                }}
              >
                ✅ No, Skip — Save Budget
              </button>
            </div>
            <p style={{ textAlign: 'center', color: 'var(--text-primary)', opacity: 0.7, fontSize: '11px', marginTop: '14px', marginBottom: 0, fontWeight: 600 }}>
              Choosing "Skip" will cancel this transaction
            </p>
          </div>
        </div>
      )}

      {/* Custom Floating Toast Alert Banners */}
      <Toast 
        toast={toast} 
        onClose={() => setToast(null)} 
      />

      {/* 📣 Admin Announcement Popup */}
      {announcementPopup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 11000,
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: 'linear-gradient(160deg, rgba(20,15,35,0.98) 0%, rgba(10,8,18,0.98) 100%)',
            border: announcementPopup.type === 'coupon'
              ? '1px solid rgba(234,179,8,0.6)'
              : announcementPopup.type === 'warning'
              ? '1px solid rgba(239,68,68,0.5)'
              : '1px solid rgba(99,102,241,0.5)',
            borderRadius: '28px',
            padding: '28px',
            boxShadow: announcementPopup.type === 'coupon'
              ? '0 0 40px rgba(234,179,8,0.2), 0 20px 60px rgba(0,0,0,0.8)'
              : '0 0 40px rgba(99,102,241,0.15), 0 20px 60px rgba(0,0,0,0.8)',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={() => setAnnouncementPopup(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '16px',
                lineHeight: 1
              }}
            >×</button>

            {/* Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: announcementPopup.type === 'coupon'
                ? 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(202,138,4,0.1))'
                : announcementPopup.type === 'warning'
                ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))'
                : announcementPopup.type === 'success'
                ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.1))'
                : 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              fontSize: '28px',
              border: announcementPopup.type === 'coupon'
                ? '1px solid rgba(234,179,8,0.3)'
                : announcementPopup.type === 'warning'
                ? '1px solid rgba(239,68,68,0.3)'
                : announcementPopup.type === 'success'
                ? '1px solid rgba(34,197,94,0.3)'
                : '1px solid rgba(99,102,241,0.3)'
            }}>
              {announcementPopup.type === 'coupon' ? '🎟️'
                : announcementPopup.type === 'warning' ? '⚠️'
                : announcementPopup.type === 'success' ? '🎉'
                : '📣'}
            </div>

            {/* FROM ZenBudget badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '99px',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              fontSize: '10px',
              fontWeight: 700,
              color: '#818cf8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '12px'
            }}>
              📣 Announcement from ZenBudget
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '10px',
              letterSpacing: '-0.02em',
              lineHeight: 1.3
            }}>{announcementPopup.title}</h2>

            {/* Message */}
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '24px'
            }}>{announcementPopup.message}</p>

            {/* Dismiss button */}
            <button
              onClick={() => setAnnouncementPopup(null)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: announcementPopup.type === 'coupon'
                  ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
                  : announcementPopup.type === 'warning'
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : announcementPopup.type === 'success'
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
              }}
            >
              Got it! ✨
            </button>

            {/* Timestamp */}
            {announcementPopup.createdAt && (
              <p style={{
                marginTop: '12px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontWeight: 500
              }}>
                {new Date(announcementPopup.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Subscription Pay Modal */}
      {isSubModalOpen && (
        <SubscriptionModal
          isOpen={isSubModalOpen}
          onClose={() => {
            if (!isSubscriptionExpired()) {
              setIsSubModalOpen(false);
              setIsSubBlocker(false);
            }
          }}
          currentTransactionsCount={transactions.length}
          trialStartDate={trialStartDate}
          subscriptionTier={subscriptionTier}
          onUpgradeSuccess={(cycle) => {
            handleUpgradeSuccess(cycle);
            setIsSubModalOpen(false);
            setIsSubBlocker(false);
          }}
          isBlocker={isSubBlocker || isSubscriptionExpired()}
          currency={currency}
          rates={rates}
        />
      )}

      {/* Scan & Pay Feature Unlock Modal Paywall */}
      <ScanPayUnlockModal
        isOpen={isScanPayUnlockOpen}
        onClose={() => setIsScanPayUnlockOpen(false)}
        currencySymbol={currencySymbol}
        onUnlockSuccess={() => {
          triggerToast('Scan & Pay Lifetime Feature Unlocked! 🎉', 'success');
          try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
        }}
      />



      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notificationsList={notifications}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />
      )}

      {/* Help & AI Chatbot Modal */}
      {isHelpOpen && (
        <HelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          transactions={convertedTransactions}
          budgets={convertedBudgets}
          goals={convertedGoals}
          currencySymbol={currencySymbol}
          userName={userName}
        />
      )}

      {/* Proactive AI Briefs & Stories */}
      {showMorningBrief && (
        <MorningBrief
          onClose={() => setShowMorningBrief(false)}
          transactions={convertedTransactions}
          currencySymbol={currencySymbol}
          userName={userName}
          monthlySavingsTarget={goals.length > 0 ? goals.reduce((s, g) => s + g.targetAmount, 0) : 1000}
          budgets={convertedBudgets}
          todaysLimit={dailyLimit}
        />
      )}
      
      {showEveningReflection && (
        <EveningReflection
          onClose={() => setShowEveningReflection(false)}
          transactions={convertedTransactions}
          currencySymbol={currencySymbol}
          userName={userName}
          budgets={convertedBudgets}
          monthlyBudget={convertedBudgets.reduce((s, b) => s + b.limit, 0) || (goals.length > 0 ? goals.reduce((s, g) => s + g.targetAmount, 0) : 15000)}
          todaysLimit={dailyLimit}
        />
      )}

      {/* Scanner & Pay Modal */}
      {isScannerOpen && (
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onSuccess={() => {
            setIsScannerOpen(false);
            fetchDataFromSupabase();
          }}
          onPayViaCashfree={handleDirectCashfreePayment}
        />
      )}

      {showStoryReport && (
        <StoryReport
          onClose={() => setShowStoryReport(false)}
          transactions={transactions}
          currencySymbol={currencySymbol}
          trialStartDate={trialStartDate}
          budgets={convertedBudgets}
        />
      )}

      {/* APK Update Popup */}
      {showUpdatePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(20,20,35,0.98) 0%, #09090f 100%)', border: forceUpdate ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(34,197,94,0.3)', borderRadius: '28px', padding: '28px', maxWidth: '340px', width: '100%', textAlign: 'center', boxShadow: forceUpdate ? '0 0 60px rgba(239,68,68,0.2)' : '0 0 60px rgba(34,197,94,0.15)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{forceUpdate ? '⚠️' : '🚀'}</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
              {forceUpdate ? 'Critical Update Required!' : 'Update Available!'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700, marginBottom: '8px' }}>ZenBudget v{updateVersion}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              {forceUpdate 
                ? 'A critical update is required to continue using ZenBudget. Please download the latest version.'
                : 'A new version is ready with bug fixes and new features. Update now for the best experience.'}
            </p>
            {updateReleaseNotes && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 14px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left', marginBottom: '24px', maxHeight: '80px', overflowY: 'auto' }}>
                <strong>What\'s New:</strong><br/>{updateReleaseNotes}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              {!forceUpdate && (
                <button
                  onClick={() => {
                    localStorage.setItem('zb_last_update_dismissed_version', updateVersion);
                    setShowUpdatePopup(false);
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Later
                </button>
              )}
              <a
                href={updateUrl || '/zenbudget.apk'}
                download="ZenBudget.apk"
                target="_self"
                onClick={() => {
                  if (!forceUpdate) setShowUpdatePopup(false);
                }}
                style={{ flex: 2, padding: '12px', borderRadius: '14px', border: 'none', background: 'linear-gradient(to right, var(--primary), var(--secondary))', color: '#000', fontSize: '13px', fontWeight: 800, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Update Now ⬇️
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard */}
      {isAdminModalOpen && (
        <AdminDashboard
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          supabaseClient={supabase}
          onShowToast={triggerToast}
        />
      )}

      {/* Trial Expiry Urgency Countdown Modal (<= 3 days remaining) */}
      {showTrialUrgencyModal && subscriptionTier === 'trial' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            maxWidth: '420px',
            width: '100%',
            backgroundColor: '#0f172a',
            borderRadius: '24px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '1.75rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowTrialUrgencyModal(false);
                localStorage.setItem(`zb_dismissed_trial_urgency_${getRemainingDays()}`, 'true');
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ✕
            </button>

            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <span style={{ fontSize: '28px' }}>⏳</span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Only {getRemainingDays()} Days Left in Trial!
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              Your ZenBudget free trial will expire soon. Upgrade to Premium now to keep unlimited category budgets, AI financial coach, and partner sync unlocked!
            </p>

            {/* Interactive Rating & Review Feedback Section */}
            {!hasSubmittedReview && (
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  ⭐ Rate & Review Your Trial Experience
                </div>
                
                {/* 5-Star Selection */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px',
                        transform: star <= ratingStars ? 'scale(1.15)' : 'scale(1)',
                        filter: star <= ratingStars ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.6))' : 'grayscale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Tell us what you like or how we can improve..."
                  className="glass-input"
                  style={{ width: '100%', fontSize: '12px', padding: '8px 12px', marginBottom: '10px' }}
                />

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const userName = userNameInput.trim() || 'ZenBudget User';
                      const userEmail = localStorage.getItem('zb_user_email') || `${currentProfileId.slice(0, 8)}@zenbudget.app`;
                      const feedback = reviewFeedback.trim() || `${ratingStars} Star rating submitted`;

                      await supabase.from('app_reviews').insert({
                        user_name: userName,
                        user_email: userEmail,
                        rating_stars: ratingStars,
                        feedback: feedback,
                        created_at: new Date().toISOString()
                      });

                      localStorage.setItem('zb_has_submitted_review', 'true');
                      setHasSubmittedReview(true);
                      triggerToast('Thank you for your rating & feedback! ❤️', 'success');
                      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); } catch (e) {}
                    } catch (e) {
                      localStorage.setItem('zb_has_submitted_review', 'true');
                      setHasSubmittedReview(true);
                      triggerToast('Thank you for your feedback! ❤️', 'success');
                    }
                  }}
                  style={{
                    width: '100%', padding: '8px', borderRadius: '10px', border: 'none',
                    background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontWeight: 800,
                    fontSize: '11px', cursor: 'pointer', border: '1px solid rgba(251, 191, 36, 0.4)'
                  }}
                >
                  Submit Rating &amp; Review 🚀
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowTrialUrgencyModal(false);
                setIsSubModalOpen(true);
              }}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                marginBottom: '0.75rem'
              }}
            >
              ⚡ Upgrade to Premium Now
            </button>

            <button
              onClick={() => {
                setShowTrialUrgencyModal(false);
                localStorage.setItem(`zb_dismissed_trial_urgency_${getRemainingDays()}`, 'true');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Remind Me Later
            </button>
          </div>
        </div>
      )}

      {/* Smart 5-Star Rating Prompt Modal */}
      {showRatingModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            backgroundColor: '#0f172a',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '1.75rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '0.75rem' }}>⭐</div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Enjoying ZenBudget?
            </h3>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1.2rem', lineHeight: '1.5' }}>
              How would you rate your experience? Leave a review to help us improve!
            </p>

            {/* Interactive Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  style={{
                    fontSize: '28px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: star <= ratingStars ? 1 : 0.3,
                    transform: star <= ratingStars ? 'scale(1.1)' : 'scale(0.95)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>

            {/* Written Review Textarea */}
            <textarea
              value={reviewFeedback}
              onChange={(e) => setReviewFeedback(e.target.value)}
              placeholder="Write your review / feedback here (optional)..."
              style={{
                width: '100%',
                height: '70px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '10px 12px',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
                resize: 'none',
                marginBottom: '1rem',
                fontFamily: 'inherit'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={async () => {
                  setShowRatingModal(false);
                  localStorage.setItem('zb_rating_dismissed', 'true');
                  triggerToast(`Thank you for your rating & review! ⭐`, 'success');
                  try {
                    const textFeedback = reviewFeedback.trim() ? reviewFeedback.trim() : `${ratingStars} Star rating submitted`;
                    await supabase.from('app_ratings').insert([{
                      user_name: userName || 'Anonymous',
                      user_email: localStorage.getItem('zb_user_email') || 'user@zenbudget.app',
                      rating_stars: ratingStars,
                      feedback: textFeedback,
                      comment: reviewFeedback.trim() || null
                    }]);
                  } catch (err) {
                    console.error('Error saving rating:', err);
                  }
                  setReviewFeedback('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                Submit Rating &amp; Review ⭐
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRatingModal(false);
                  localStorage.setItem('zb_rating_dismissed', 'true');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '24px', padding: '24px', maxWidth: '300px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>👋</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '18px', fontWeight: 800 }}>Sign Out?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13px', lineHeight: 1.5 }}>Are you sure you want to sign out?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--danger)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}>Yes, Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAddAccount={handleAddAccount}
        currencySymbol={currencySymbol}
      />

      {/* Account Transfer Modal */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
        currencySymbol={currencySymbol}
        onTransfer={handleTransfer}
      />

      {/* Bank Sync Modal */}
      <BankSyncModal
        isOpen={isBankSyncOpen}
        onClose={() => setIsBankSyncOpen(false)}
        onAddAccount={handleAddAccount}
      />

      {/* Home Screen Widget Modal */}
      <WidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        currencySymbol={currencySymbol}
      />

      {/* ⏰ Loan Repayment Glass Popup Reminder Modal */}
      {activeLoanReminderModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '400px', width: '100%',
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.98) 100%)',
            borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '24px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            <button
              onClick={() => setActiveLoanReminderModal(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
            >
              ✕
            </button>

            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
            }}>
              <span style={{ fontSize: '28px' }}>⏰</span>
            </div>

            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', background: activeLoanReminderModal.loan.type === 'lent' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: activeLoanReminderModal.loan.type === 'lent' ? '#34d399' : '#f87171', padding: '4px 12px', borderRadius: '20px', display: 'inline-block' }}>
              {activeLoanReminderModal.loan.type === 'lent' ? '💰 Money Collection Due!' : '⏰ Loan Repayment Due!'}
            </span>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '12px 0 4px 0' }}>
              {activeLoanReminderModal.loan.type === 'lent' ? `Collect Money from ${activeLoanReminderModal.loan.personName}` : `Pay Loan for ${activeLoanReminderModal.loan.personName}`}
            </h3>

            {activeLoanReminderModal.overdueDays > 0 ? (
              <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 800, margin: '4px 0 16px 0' }}>
                ⚠️ {activeLoanReminderModal.overdueDays} Day(s) Overdue! (Amount: ₹{activeLoanReminderModal.remainingAmount})
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 16px 0' }}>
                {activeLoanReminderModal.loan.type === 'lent' ? 'Remaining Amount To Collect:' : 'Remaining Loan Balance:'} <strong style={{ color: '#34d399' }}>₹{activeLoanReminderModal.remainingAmount}</strong>
              </p>
            )}

            {/* Wallet Selection Dropdown or No-Account Warning */}
            {accounts.length === 0 ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '14px', marginBottom: '16px', textAlign: 'center' }}>
                <p style={{ color: '#f87171', fontSize: '12px', fontWeight: 700, margin: '0 0 8px 0' }}>
                  ⚠️ No Wallet Account Found! Add a wallet or bank account first to record repayments/deposits.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLoanReminderModal(null);
                    setIsAddAccountOpen(true);
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#3b82f6', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '12px' }}
                >
                  + Add Wallet Account Now
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  {activeLoanReminderModal.loan.type === 'lent' ? 'Select Wallet To Deposit Money Into:' : 'Select Wallet / Account To Pay From:'}
                </label>
                <select
                  value={loanReminderAccountId}
                  onChange={e => setLoanReminderAccountId(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', fontSize: '13px', padding: '12px', fontWeight: 700, borderRadius: '12px' }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} style={{ color: '#000' }}>
                      💳 {acc.name} ({formatCurrency(acc.balance, currencySymbol, 0)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeLoanReminderModal.loan.type === 'lent' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const friendName = activeLoanReminderModal.loan.personName;
                      const msg = `Hi ${friendName}, a friendly reminder regarding the ₹${activeLoanReminderModal.remainingAmount} payment due on ZenBudget. Thanks!`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      triggerToast(`Opening WhatsApp reminder for ${friendName}...`, 'info');
                    }}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      color: '#fff', fontWeight: 900, fontSize: '14px', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <span>💬 Remind Friend on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleRepayLoan(activeLoanReminderModal.loan.id, activeLoanReminderModal.remainingAmount, loanReminderAccountId || accounts[0]?.id || '1');
                      setActiveLoanReminderModal(null);
                      triggerToast(`Collected ₹${activeLoanReminderModal.remainingAmount} & deposited to wallet! 🎉`, 'success');
                      try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
                    }}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '14px',
                      border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.15)',
                      color: '#34d399', fontWeight: 800, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    ✅ Mark as Received (Deposit)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const friendName = activeLoanReminderModal.loan.personName;
                      const upiUrl = `upi://pay?pa=chandanswaraj7482@okicici&pn=${encodeURIComponent(friendName)}&am=${activeLoanReminderModal.remainingAmount}&cu=INR&tn=${encodeURIComponent('Loan Repayment to ' + friendName)}`;
                      try { window.location.href = upiUrl; } catch (e) {}
                      handleRepayLoan(activeLoanReminderModal.loan.id, activeLoanReminderModal.remainingAmount, loanReminderAccountId || accounts[0]?.id || '1');
                      setActiveLoanReminderModal(null);
                      triggerToast(`Loan repayment to ${friendName} processed via UPI! 🎉`, 'success');
                      try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
                    }}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff', fontWeight: 900, fontSize: '14px', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <span>⚡ Pay &amp; Send via PhonePe / UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleRepayLoan(activeLoanReminderModal.loan.id, activeLoanReminderModal.remainingAmount, loanReminderAccountId || accounts[0]?.id || '1');
                      setActiveLoanReminderModal(null);
                      triggerToast(`Recorded ₹${activeLoanReminderModal.remainingAmount} loan repayment! 🎉`, 'success');
                      try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
                    }}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
                      color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    ✅ Mark as Paid from Wallet
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setActiveLoanReminderModal(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}
              >
                ⏰ Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
