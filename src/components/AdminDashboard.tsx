import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Bell, 
  TrendingUp, 
  Search, 
  X, 
  RefreshCw, 
  Gift, 
  Lock, 
  Unlock, 
  Crown, 
  DollarSign, 
  Activity,
  Send,
  Trash2,
  Edit2,
  Check,
  Star,
  Share2,
  Link2
} from 'lucide-react';

interface RatingRecord {
  id: string;
  user_name: string;
  user_email: string;
  rating_stars: number;
  feedback: string;
  created_at: string;
}

interface ProfileRecord {
  id: string;
  name: string;
  pin: string;
  subscription_tier: 'trial' | 'premium' | 'premium_monthly' | 'premium_yearly' | 'premium_lifetime';
  trial_start_date: string;
  premium_expires_at?: string;
  referral_code?: string;
  referred_by?: string;
  updated_at?: string;
  is_suspended?: boolean;
  has_scan_pay_access?: boolean;
  email?: string;
  couple_code?: string;
  partner_couple_code?: string;
}

interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'update';
  created_at: string;
}

interface CouponRecord {
  code: string;
  discount_percent: number;
  max_uses: number;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  target_email?: string;
  target_plan?: string;
}

interface SlotPurchaseRecord {
  id?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  slot_count: number;
  price_paid: number;
  currency: string;
  created_at: string;
}

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseClient: any;
  onShowToast?: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  supabaseClient,
  onShowToast
}) => {
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('zb_admin_session_unlocked') === 'true';
  });
  const [authError, setAuthError] = useState('');

  // Dynamic Pricing Control state
  // Dynamic Pricing Control state
  // Active Pricing Currency Tab/Dropdown
  const [selectedPricingCurrency, setSelectedPricingCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SGD'>('INR');

  const getInitialPrice = (key: string, defaultVal: number): number => {
    try {
      const stored = JSON.parse(localStorage.getItem('zb_dynamic_prices') || '{}');
      const val = stored[key];
      if (typeof val === 'number' && val > 0) {
        if (key.includes('monthly') && !key.startsWith('inr') && val < 3.0) return defaultVal;
        return val;
      }
      return defaultVal;
    } catch (_) {
      return defaultVal;
    }
  };

  // INR Subscription Pricing
  const [monthlyPrice, setMonthlyPrice] = useState<number>(() => getInitialPrice('monthly', 149));
  const [yearlyPrice, setYearlyPrice] = useState<number>(() => getInitialPrice('yearly', 1499));
  const [lifetimePrice, setLifetimePrice] = useState<number>(() => getInitialPrice('lifetime', 2499));

  // USD Subscription Pricing
  const [usdMonthlyPrice, setUsdMonthlyPrice] = useState<number>(() => getInitialPrice('usd_monthly', 4.99));
  const [usdYearlyPrice, setUsdYearlyPrice] = useState<number>(() => getInitialPrice('usd_yearly', 19.99));
  const [usdLifetimePrice, setUsdLifetimePrice] = useState<number>(() => getInitialPrice('usd_lifetime', 29.99));

  // EUR Subscription Pricing
  const [eurMonthlyPrice, setEurMonthlyPrice] = useState<number>(() => getInitialPrice('eur_monthly', 4.99));
  const [eurYearlyPrice, setEurYearlyPrice] = useState<number>(() => getInitialPrice('eur_yearly', 19.99));
  const [eurLifetimePrice, setEurLifetimePrice] = useState<number>(() => getInitialPrice('eur_lifetime', 29.99));

  // GBP Subscription Pricing
  const [gbpMonthlyPrice, setGbpMonthlyPrice] = useState<number>(() => getInitialPrice('gbp_monthly', 4.99));
  const [gbpYearlyPrice, setGbpYearlyPrice] = useState<number>(() => getInitialPrice('gbp_yearly', 19.99));
  const [gbpLifetimePrice, setGbpLifetimePrice] = useState<number>(() => getInitialPrice('gbp_lifetime', 24.99));

  // CAD Subscription Pricing
  const [cadMonthlyPrice, setCadMonthlyPrice] = useState<number>(() => getInitialPrice('cad_monthly', 6.99));
  const [cadYearlyPrice, setCadYearlyPrice] = useState<number>(() => getInitialPrice('cad_yearly', 26.99));
  const [cadLifetimePrice, setCadLifetimePrice] = useState<number>(() => getInitialPrice('cad_lifetime', 39.99));

  // AUD Subscription Pricing
  const [audMonthlyPrice, setAudMonthlyPrice] = useState<number>(() => getInitialPrice('aud_monthly', 7.99));
  const [audYearlyPrice, setAudYearlyPrice] = useState<number>(() => getInitialPrice('aud_yearly', 29.99));
  const [audLifetimePrice, setAudLifetimePrice] = useState<number>(() => getInitialPrice('aud_lifetime', 44.99));

  // AED Subscription Pricing
  const [aedMonthlyPrice, setAedMonthlyPrice] = useState<number>(() => getInitialPrice('aed_monthly', 19.99));
  const [aedYearlyPrice, setAedYearlyPrice] = useState<number>(() => getInitialPrice('aed_yearly', 79.99));
  const [aedLifetimePrice, setAedLifetimePrice] = useState<number>(() => getInitialPrice('aed_lifetime', 119.99));

  // SGD Subscription Pricing
  const [sgdMonthlyPrice, setSgdMonthlyPrice] = useState<number>(() => getInitialPrice('sgd_monthly', 6.99));
  const [sgdYearlyPrice, setSgdYearlyPrice] = useState<number>(() => getInitialPrice('sgd_yearly', 26.99));
  const [sgdLifetimePrice, setSgdLifetimePrice] = useState<number>(() => getInitialPrice('sgd_lifetime', 39.99));

  // Multi-Currency Extra Slot Pricing State (For Trial Users)
  const [inrSlotPrice, setInrSlotPrice] = useState<number>(() => getInitialPrice('inr_slot_price', 10));
  const [usdSlotPrice, setUsdSlotPrice] = useState<number>(() => getInitialPrice('usd_slot_price', 1.99));
  const [eurSlotPrice, setEurSlotPrice] = useState<number>(() => getInitialPrice('eur_slot_price', 1.99));
  const [gbpSlotPrice, setGbpSlotPrice] = useState<number>(() => getInitialPrice('gbp_slot_price', 1.99));
  const [cadSlotPrice, setCadSlotPrice] = useState<number>(() => getInitialPrice('cad_slot_price', 2.99));
  const [audSlotPrice, setAudSlotPrice] = useState<number>(() => getInitialPrice('aud_slot_price', 2.99));
  const [aedSlotPrice, setAedSlotPrice] = useState<number>(() => getInitialPrice('aed_slot_price', 7.99));
  const [sgdSlotPrice, setSgdSlotPrice] = useState<number>(() => getInitialPrice('sgd_slot_price', 2.99));

  // Multi-Currency Scan & Pay Lifetime Feature Pricing State
  const [inrScanPayPrice, setInrScanPayPrice] = useState<number>(() => getInitialPrice('inr_scan_pay_price', 79));
  const [usdScanPayPrice, setUsdScanPayPrice] = useState<number>(() => getInitialPrice('usd_scan_pay_price', 1.99));
  const [eurScanPayPrice, setEurScanPayPrice] = useState<number>(() => getInitialPrice('eur_scan_pay_price', 1.99));
  const [gbpScanPayPrice, setGbpScanPayPrice] = useState<number>(() => getInitialPrice('gbp_scan_pay_price', 1.99));
  const [cadScanPayPrice, setCadScanPayPrice] = useState<number>(() => getInitialPrice('cad_scan_pay_price', 2.99));
  const [audScanPayPrice, setAudScanPayPrice] = useState<number>(() => getInitialPrice('aud_scan_pay_price', 2.99));
  const [aedScanPayPrice, setAedScanPayPrice] = useState<number>(() => getInitialPrice('aed_scan_pay_price', 7.99));
  const [sgdScanPayPrice, setSgdScanPayPrice] = useState<number>(() => getInitialPrice('sgd_scan_pay_price', 2.99));

  // Fetch latest live prices from Supabase on mount
  useEffect(() => {
    const fetchLivePricing = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('app_config')
          .select('data')
          .eq('id', 'subscription_pricing')
          .maybeSingle();

        if (data && data.data) {
          const p = data.data;
          localStorage.setItem('zb_dynamic_prices', JSON.stringify(p));
          if (p.monthly) setMonthlyPrice(p.monthly);
          if (p.yearly) setYearlyPrice(p.yearly);
          if (p.lifetime) setLifetimePrice(p.lifetime);
          if (p.usd_monthly) setUsdMonthlyPrice(p.usd_monthly);
          if (p.usd_yearly) setUsdYearlyPrice(p.usd_yearly);
          if (p.usd_lifetime) setUsdLifetimePrice(p.usd_lifetime);
          if (p.eur_monthly) setEurMonthlyPrice(p.eur_monthly);
          if (p.eur_yearly) setEurYearlyPrice(p.eur_yearly);
          if (p.eur_lifetime) setEurLifetimePrice(p.eur_lifetime);
          if (p.gbp_monthly) setGbpMonthlyPrice(p.gbp_monthly);
          if (p.gbp_yearly) setGbpYearlyPrice(p.gbp_yearly);
          if (p.gbp_lifetime) setGbpLifetimePrice(p.gbp_lifetime);
          if (p.cad_monthly) setCadMonthlyPrice(p.cad_monthly);
          if (p.cad_yearly) setCadYearlyPrice(p.cad_yearly);
          if (p.cad_lifetime) setCadLifetimePrice(p.cad_lifetime);
          if (p.aud_monthly) setAudMonthlyPrice(p.aud_monthly);
          if (p.aud_yearly) setAudYearlyPrice(p.aud_yearly);
          if (p.aud_lifetime) setAudLifetimePrice(p.aud_lifetime);
          if (p.aed_monthly) setAedMonthlyPrice(p.aed_monthly);
          if (p.aed_yearly) setAedYearlyPrice(p.aed_yearly);
          if (p.aed_lifetime) setAedLifetimePrice(p.aed_lifetime);
          if (p.sgd_monthly) setSgdMonthlyPrice(p.sgd_monthly);
          if (p.sgd_yearly) setSgdYearlyPrice(p.sgd_yearly);
          if (p.sgd_lifetime) setSgdLifetimePrice(p.sgd_lifetime);

          if (p.inr_slot_price) setInrSlotPrice(p.inr_slot_price);
          if (p.usd_slot_price) setUsdSlotPrice(p.usd_slot_price);
          if (p.eur_slot_price) setEurSlotPrice(p.eur_slot_price);
          if (p.gbp_slot_price) setGbpSlotPrice(p.gbp_slot_price);
          if (p.cad_slot_price) setCadSlotPrice(p.cad_slot_price);
          if (p.aud_slot_price) setAudSlotPrice(p.aud_slot_price);
          if (p.aed_slot_price) setAedSlotPrice(p.aed_slot_price);
          if (p.sgd_slot_price) setSgdSlotPrice(p.sgd_slot_price);

          if (p.inr_scan_pay_price) setInrScanPayPrice(p.inr_scan_pay_price);
          if (p.usd_scan_pay_price) setUsdScanPayPrice(p.usd_scan_pay_price);
          if (p.eur_scan_pay_price) setEurScanPayPrice(p.eur_scan_pay_price);
          if (p.gbp_scan_pay_price) setGbpScanPayPrice(p.gbp_scan_pay_price);
          if (p.cad_scan_pay_price) setCadScanPayPrice(p.cad_scan_pay_price);
          if (p.aud_scan_pay_price) setAudScanPayPrice(p.aud_scan_pay_price);
          if (p.aed_scan_pay_price) setAedScanPayPrice(p.aed_scan_pay_price);
          if (p.sgd_scan_pay_price) setSgdScanPayPrice(p.sgd_scan_pay_price);
        }
      } catch (err) {
        console.warn('Error fetching live pricing in admin:', err);
      }
    };
    fetchLivePricing();
  }, []);

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    const pricingObj = { 
      monthly: Number(monthlyPrice), 
      yearly: Number(yearlyPrice), 
      lifetime: Number(lifetimePrice),
      usd_monthly: Number(usdMonthlyPrice),
      usd_yearly: Number(usdYearlyPrice),
      usd_lifetime: Number(usdLifetimePrice),
      eur_monthly: Number(eurMonthlyPrice),
      eur_yearly: Number(eurYearlyPrice),
      eur_lifetime: Number(eurLifetimePrice),
      gbp_monthly: Number(gbpMonthlyPrice),
      gbp_yearly: Number(gbpYearlyPrice),
      gbp_lifetime: Number(gbpLifetimePrice),
      cad_monthly: Number(cadMonthlyPrice),
      cad_yearly: Number(cadYearlyPrice),
      cad_lifetime: Number(cadLifetimePrice),
      aud_monthly: Number(audMonthlyPrice),
      aud_yearly: Number(audYearlyPrice),
      aud_lifetime: Number(audLifetimePrice),
      aed_monthly: Number(aedMonthlyPrice),
      aed_yearly: Number(aedYearlyPrice),
      aed_lifetime: Number(aedLifetimePrice),
      sgd_monthly: Number(sgdMonthlyPrice),
      sgd_yearly: Number(sgdYearlyPrice),
      sgd_lifetime: Number(sgdLifetimePrice),

      inr_slot_price: Number(inrSlotPrice),
      usd_slot_price: Number(usdSlotPrice),
      eur_slot_price: Number(eurSlotPrice),
      gbp_slot_price: Number(gbpSlotPrice),
      cad_slot_price: Number(cadSlotPrice),
      aud_slot_price: Number(audSlotPrice),
      aed_slot_price: Number(aedSlotPrice),
      sgd_slot_price: Number(sgdSlotPrice),

      inr_scan_pay_price: Number(inrScanPayPrice),
      usd_scan_pay_price: Number(usdScanPayPrice),
      eur_scan_pay_price: Number(eurScanPayPrice),
      gbp_scan_pay_price: Number(gbpScanPayPrice),
      cad_scan_pay_price: Number(cadScanPayPrice),
      aud_scan_pay_price: Number(audScanPayPrice),
      aed_scan_pay_price: Number(aedScanPayPrice),
      sgd_scan_pay_price: Number(sgdScanPayPrice)
    };
    try {
      const { error } = await supabaseClient.from('app_config').upsert([{ id: 'subscription_pricing', data: pricingObj, updated_at: new Date().toISOString() }]);
      if (error) {
        console.warn('Supabase app_config save warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase app_config save error:', err);
    }
    localStorage.setItem('zb_dynamic_prices', JSON.stringify(pricingObj));
    window.dispatchEvent(new CustomEvent('zenbudget_prices_updated', { detail: pricingObj }));
    if (onShowToast) onShowToast(`Live Multi-Currency Prices updated for ${selectedPricingCurrency}!`, 'success');
  };

const DEFAULT_FALLBACK_PROFILES: ProfileRecord[] = [
  {
    id: 'user_1',
    name: 'Chandan Swaraj',
    email: 'chandanswaraj7482@gmail.com',
    pin: '1234',
    subscription_tier: 'premium_lifetime',
    trial_start_date: new Date().toISOString(),
    referral_code: 'OP8WBNU7',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_scan_pay_access: true,
    is_suspended: false
  },
  {
    id: 'user_2',
    name: 'testing',
    email: 'testing@gmail.com',
    pin: '0000',
    subscription_tier: 'trial',
    trial_start_date: new Date().toISOString(),
    referral_code: 'ZB-C01CYZ6B',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_scan_pay_access: false,
    is_suspended: false
  },
  {
    id: 'user_3',
    name: 'user',
    email: 'user@example.com',
    pin: '0000',
    subscription_tier: 'trial',
    trial_start_date: new Date().toISOString(),
    referral_code: 'ZB-4BSP00S9',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_scan_pay_access: false,
    is_suspended: false
  },
  {
    id: 'user_4',
    name: 'Graphic Designer',
    email: 'graphicdesigner7667@gmail.com',
    pin: '0000',
    subscription_tier: 'trial',
    trial_start_date: new Date().toISOString(),
    referral_code: 'ZB-47E76890',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_scan_pay_access: false,
    is_suspended: false
  },
  {
    id: 'user_5',
    name: 'anshugumo27',
    email: 'anshugumo27@gmail.com',
    pin: '0000',
    subscription_tier: 'trial',
    trial_start_date: new Date().toISOString(),
    referral_code: 'ZB-420W6UL7',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_scan_pay_access: false,
    is_suspended: false
  },
  {
    id: 'user_6',
    name: 'krish',
    email: 'krish@gmail.com',
    pin: '0000',
    subscription_tier: 'trial',
    trial_start_date: new Date().toISOString(),
    referral_code: 'ZB-OJZCQIQU',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_scan_pay_access: false,
    is_suspended: false
  }
];

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'broadcasts' | 'coupons' | 'ratings' | 'referrals' | 'family' | 'pricing' | 'slots'>('overview');

  // Data states
  const [profiles, setProfiles] = useState<ProfileRecord[]>(() => {
    try {
      const cached = localStorage.getItem('zb_admin_profiles_cache');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return DEFAULT_FALLBACK_PROFILES;
  });
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [ratings, setRatings] = useState<RatingRecord[]>([]);
  const [slotPurchases, setSlotPurchases] = useState<SlotPurchaseRecord[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedDetailUser, setSelectedDetailUser] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [bcTitle, setBcTitle] = useState('');
  const [bcMessage, setBcMessage] = useState('');
  const [bcType, setBcType] = useState<'info' | 'warning' | 'success' | 'update'>('info');
  const [bcLink, setBcLink] = useState('');
  const [bcButtonText, setBcButtonText] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(50);
  const [maxUses, setMaxUses] = useState<number>(100);
  const [targetEmailInput, setTargetEmailInput] = useState('');
  const [targetPlanInput, setTargetPlanInput] = useState(''); // '', 'monthly', 'yearly', 'lifetime'
  const [editingCoupon, setEditingCoupon] = useState<{ code: string; discount_percent: number; max_uses: number; target_email?: string; target_plan?: string } | null>(null);

  const MASTER_ADMIN_KEY = 'ADMIN-9999';

  useEffect(() => {
    if (isOpen && isUnlocked) {
      fetchAdminData();
    }
  }, [isOpen, isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKeyInput.trim() === MASTER_ADMIN_KEY || adminKeyInput.trim() === 'zenadmin2026') {
      setIsUnlocked(true);
      sessionStorage.setItem('zb_admin_session_unlocked', 'true');
      setAuthError('');
      fetchAdminData();
    } else {
      setAuthError('Invalid Master Admin Secret Key!');
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch Profiles
      const { data: profData, error: profErr } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!profErr && profData && profData.length > 0) {
        setProfiles(profData);
        localStorage.setItem('zb_admin_profiles_cache', JSON.stringify(profData));
      } else {
        const cached = localStorage.getItem('zb_admin_profiles_cache');
        if (cached) {
          try { setProfiles(JSON.parse(cached)); } catch (_) { setProfiles(DEFAULT_FALLBACK_PROFILES); }
        } else {
          setProfiles(DEFAULT_FALLBACK_PROFILES);
        }
      }

      // Fetch Broadcasts
      const { data: bcData } = await supabaseClient
        .from('broadcast_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (bcData) setBroadcasts(bcData);

      // Fetch Coupons
      const { data: cpData } = await supabaseClient
        .from('promo_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (cpData) setCoupons(cpData);

      // Fetch Ratings
      const { data: ratingData } = await supabaseClient
        .from('app_ratings')
        .select('*')
        .order('created_at', { ascending: false });

      if (ratingData) setRatings(ratingData);

      // Fetch Slot Purchases
      const { data: slotData } = await supabaseClient
        .from('slot_purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (slotData) setSlotPurchases(slotData);

      // Fetch Payment History
      const { data: payData } = await supabaseClient
        .from('payment_history')
        .select('*')
        .eq('payment_status', 'success');

      if (payData) setPayments(payData);

    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserSubscription = async (userId: string, newTier: 'trial' | 'premium_monthly' | 'premium_yearly' | 'premium_lifetime') => {
    const expiresAt = newTier === 'premium_monthly' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : newTier === 'premium_yearly'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : newTier === 'premium_lifetime' 
          ? new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString()
          : null;

    // 1. UPDATE LOCAL STATE IMMEDIATELY FOR INSTANT UI RESPONSE
    setProfiles(prev => {
      const updated = prev.map(p => p.id === userId ? { ...p, subscription_tier: newTier as any, premium_expires_at: expiresAt || undefined } : p);
      localStorage.setItem('zb_admin_profiles_cache', JSON.stringify(updated));
      return updated;
    });

    if (selectedDetailUser && selectedDetailUser.id === userId) {
      setSelectedDetailUser(prev => prev ? { ...prev, subscription_tier: newTier as any, premium_expires_at: expiresAt || undefined } : null);
    }

    // Sync active device profile if updated
    const activeId = localStorage.getItem('zb_profile_id');
    if (activeId === userId) {
      localStorage.setItem('zb_subscription_tier', newTier);
      if (expiresAt) localStorage.setItem('zb_premium_expires_at', expiresAt);
    }

    if (onShowToast) onShowToast(`✅ User upgraded to ${newTier}!`, 'success');

    // 2. BACKGROUND SYNC TO SUPABASE
    try {
      let { error } = await supabaseClient
        .from('profiles')
        .update({ 
          subscription_tier: newTier,
          premium_expires_at: expiresAt
        })
        .eq('id', userId);

      if (error && error.message?.includes('premium_expires_at')) {
        await supabaseClient
          .from('profiles')
          .update({ subscription_tier: newTier })
          .eq('id', userId);
      }
    } catch (_) {}
  };

  const toggleUserSuspension = async (userId: string, currentSuspended: boolean) => {
    const newSuspended = !currentSuspended;

    // 1. UPDATE LOCAL STATE IMMEDIATELY FOR INSTANT UI RESPONSE
    setProfiles(prev => {
      const updated = prev.map(p => p.id === userId ? { ...p, is_suspended: newSuspended } : p);
      localStorage.setItem('zb_admin_profiles_cache', JSON.stringify(updated));
      return updated;
    });

    if (selectedDetailUser && selectedDetailUser.id === userId) {
      setSelectedDetailUser(prev => prev ? { ...prev, is_suspended: newSuspended } : null);
    }

    if (onShowToast) onShowToast(`User ${newSuspended ? 'Suspended 🚫' : 'Activated ✅'}!`, 'info');

    // 2. BACKGROUND SYNC TO SUPABASE
    try {
      await supabaseClient
        .from('profiles')
        .update({ is_suspended: newSuspended })
        .eq('id', userId);
    } catch (_) {}
  };

  const handleToggleScanPayAccess = async (userId: string, currentAccess: boolean) => {
    const newAccess = !currentAccess;

    // 1. UPDATE LOCAL STATE IMMEDIATELY FOR INSTANT UI RESPONSE
    setProfiles(prev => {
      const updated = prev.map(p => p.id === userId ? { ...p, has_scan_pay_access: newAccess } : p);
      localStorage.setItem('zb_admin_profiles_cache', JSON.stringify(updated));
      return updated;
    });

    if (selectedDetailUser && selectedDetailUser.id === userId) {
      setSelectedDetailUser(prev => prev ? { ...prev, has_scan_pay_access: newAccess } : null);
    }

    if (onShowToast) onShowToast(`Scan & Pay Access ${newAccess ? 'Granted FREE ⚡' : 'Revoked'} for user!`, 'success');

    // 2. BACKGROUND SYNC TO SUPABASE
    try {
      await supabaseClient
        .from('profiles')
        .update({ has_scan_pay_access: newAccess })
        .eq('id', userId);
    } catch (_) {}
  };

  const toggleSelectUser = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
    );
  };

  const toggleSelectAllUsers = () => {
    if (selectedUserIds.length === filteredProfiles.length && filteredProfiles.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredProfiles.map(p => p.id));
    }
  };

  // Confirmation modal states
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [editingDetailEmail, setEditingDetailEmail] = useState('');

  useEffect(() => {
    if (selectedDetailUser) {
      const displayEmail = selectedDetailUser.email || `${(selectedDetailUser.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
      setEditingDetailEmail(displayEmail);
    }
  }, [selectedDetailUser]);

  const updateUserEmail = async (userId: string, newEmail: string) => {
    try {
      const cleanEmail = newEmail.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        if (onShowToast) onShowToast('Please enter a valid email address!', 'warning');
        return;
      }
      const { error } = await supabaseClient
        .from('profiles')
        .update({ email: cleanEmail })
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, email: cleanEmail } : p));
      if (selectedDetailUser?.id === userId) {
        setSelectedDetailUser(prev => prev ? { ...prev, email: cleanEmail } : null);
      }
      if (onShowToast) onShowToast(`Email updated to ${cleanEmail}!`, 'success');
    } catch (err: any) {
      if (onShowToast) onShowToast(`Email update failed: ${err.message}`, 'warning');
    }
  };

  const executeDeleteUser = async (userId: string, userName: string) => {
    try {
      await supabaseClient.from('profiles').delete().eq('id', userId);
      await supabaseClient.from('transactions').delete().eq('user_id', userId);
      await supabaseClient.from('accounts').delete().eq('user_id', userId);
      await supabaseClient.from('goals').delete().eq('user_id', userId);
      await supabaseClient.from('budgets').delete().eq('user_id', userId);
      await supabaseClient.from('loans').delete().eq('user_id', userId);
      await supabaseClient.from('device_sessions').delete().eq('user_id', userId);

      setProfiles(prev => prev.filter(p => p.id !== userId));
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
      if (selectedDetailUser?.id === userId) setSelectedDetailUser(null);
      setConfirmDeleteTarget(null);

      if (onShowToast) onShowToast(`User "${userName}" reset & deleted successfully!`, 'success');
    } catch (err: any) {
      if (onShowToast) onShowToast(`Delete failed: ${err.message}`, 'warning');
    }
  };

  const executeBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await supabaseClient.from('profiles').delete().in('id', selectedUserIds);
      await supabaseClient.from('transactions').delete().in('user_id', selectedUserIds);
      await supabaseClient.from('accounts').delete().in('user_id', selectedUserIds);
      await supabaseClient.from('goals').delete().in('user_id', selectedUserIds);
      await supabaseClient.from('budgets').delete().in('user_id', selectedUserIds);
      await supabaseClient.from('loans').delete().in('user_id', selectedUserIds);
      await supabaseClient.from('device_sessions').delete().in('user_id', selectedUserIds);

      setProfiles(prev => prev.filter(p => !selectedUserIds.includes(p.id)));
      setSelectedUserIds([]);
      if (selectedDetailUser && selectedUserIds.includes(selectedDetailUser.id)) {
        setSelectedDetailUser(null);
      }
      setConfirmBulkDeleteOpen(false);
      if (onShowToast) onShowToast(`${selectedUserIds.length} users reset & deleted successfully!`, 'success');
    } catch (err: any) {
      if (onShowToast) onShowToast(`Bulk delete failed: ${err.message}`, 'warning');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcMessage.trim()) return;

    const newId = `bc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newBc = {
      id: newId,
      title: bcTitle.trim(),
      message: bcMessage.trim(),
      type: bcType,
      created_at: new Date().toISOString(),
      link_url: bcLink.trim() || null,
      button_text: bcButtonText.trim() || null
    };

    // 1. OPTIMISTIC UPDATE: Update local state IMMEDIATELY before Supabase call
    setBroadcasts(prev => [newBc, ...prev]);
    try {
      const stored = JSON.parse(localStorage.getItem('zb_admin_broadcasts') || '[]');
      localStorage.setItem('zb_admin_broadcasts', JSON.stringify([newBc, ...stored]));
    } catch (_) {}
    setBcTitle('');
    setBcMessage('');
    setBcLink('');
    setBcButtonText('');
    if (onShowToast) onShowToast('Broadcast announcement published to all users! 📣', 'success');

    // 2. BACKGROUND SYNC: Try to persist in Supabase (fire-and-forget)
    (async () => {
      try {
        const insertData: any = { title: newBc.title, message: newBc.message, type: newBc.type };
        if (newBc.link_url) insertData.link_url = newBc.link_url;
        if (newBc.button_text) insertData.button_text = newBc.button_text;
        const { error } = await supabaseClient
          .from('broadcast_notifications')
          .insert([insertData]);
        if (error) console.warn('Broadcast Supabase insert error (local state preserved):', error);
      } catch (err) {
        console.warn('Broadcast Supabase sync failed (local state preserved):', err);
      }
    })();
  };

  const handleDeleteBroadcast = async (id: string) => {
    try {
      await supabaseClient.from('broadcast_notifications').delete().eq('id', id);
    } catch (err: any) {}

    setBroadcasts(prev => prev.filter(b => b.id !== id));
    try {
      const stored = JSON.parse(localStorage.getItem('zb_admin_broadcasts') || '[]');
      const filtered = stored.filter((b: any) => b.id !== id);
      localStorage.setItem('zb_admin_broadcasts', JSON.stringify(filtered));
    } catch (_) {}

    if (onShowToast) onShowToast('Broadcast announcement deleted', 'info');
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const formattedCode = couponCode.trim().toUpperCase();

    // Build new coupon object for immediate local update
    const newCouponLocal: CouponRecord = {
      code: formattedCode,
      discount_percent: discountPercent,
      max_uses: maxUses,
      uses_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      target_email: targetEmailInput.trim() ? targetEmailInput.trim().toLowerCase() : undefined,
      target_plan: targetPlanInput || undefined
    };

    // 1. Update local state immediately (optimistic update)
    setCoupons(prev => [newCouponLocal, ...prev]);
    setCouponCode('');
    setTargetEmailInput('');
    setTargetPlanInput('');
    if (onShowToast) onShowToast(`Coupon ${formattedCode} created!`, 'success');

    // 2. Background sync to Supabase
    try {
      const { data, error } = await supabaseClient
        .from('promo_coupons')
        .insert([{
          code: formattedCode,
          discount_percent: discountPercent,
          max_uses: maxUses,
          is_active: true,
          target_email: targetEmailInput.trim() ? targetEmailInput.trim().toLowerCase() : null,
          target_plan: targetPlanInput ? targetPlanInput : null
        }])
        .select();

      if (!error && data && data[0]) {
        // Replace local version with DB version that has exact fields
        setCoupons(prev => prev.map(c => c.code === formattedCode ? data[0] : c));
      }
    } catch (err: any) {
      console.warn('Coupon sync to Supabase failed (local state preserved):', err);
    }
  };

  const handleToggleCouponActive = async (code: string, currentStatus: boolean) => {
    try {
      const { error } = await supabaseClient
        .from('promo_coupons')
        .update({ is_active: !currentStatus })
        .eq('code', code);

      if (error) throw error;

      setCoupons(prev => prev.map(c => c.code === code ? { ...c, is_active: !currentStatus } : c));
      if (onShowToast) onShowToast(`Coupon ${code} status updated!`, 'info');
    } catch (err: any) {
      if (onShowToast) onShowToast(`Update error: ${err.message}`, 'warning');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    // 1. Optimistic local delete immediately (no window.confirm block)
    setCoupons(prev => prev.filter(c => c.code !== code));
    if (onShowToast) onShowToast(`Coupon ${code} deleted!`, 'info');

    // 2. Background sync delete to Supabase
    try {
      await supabaseClient
        .from('promo_coupons')
        .delete()
        .eq('code', code);
    } catch (err: any) {
      console.warn('Coupon delete sync to Supabase failed:', err);
    }
  };

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return;
    try {
      const { error } = await supabaseClient
        .from('promo_coupons')
        .update({
          discount_percent: editingCoupon.discount_percent,
          max_uses: editingCoupon.max_uses,
          target_email: editingCoupon.target_email?.trim() ? editingCoupon.target_email.trim().toLowerCase() : null,
          target_plan: editingCoupon.target_plan ? editingCoupon.target_plan : null
        })
        .eq('code', editingCoupon.code);

      if (error) throw error;

      setCoupons(prev => prev.map(c => c.code === editingCoupon.code ? { 
        ...c, 
        discount_percent: editingCoupon.discount_percent, 
        max_uses: editingCoupon.max_uses,
        target_email: editingCoupon.target_email?.trim() ? editingCoupon.target_email.trim().toLowerCase() : undefined,
        target_plan: editingCoupon.target_plan ? editingCoupon.target_plan : undefined
      } : c));
      setEditingCoupon(null);
      if (onShowToast) onShowToast(`Coupon ${editingCoupon.code} details updated!`, 'success');
    } catch (err: any) {
      if (onShowToast) onShowToast(`Update error: ${err.message}`, 'warning');
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.referral_code && p.referral_code.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q))
    );
  });

  // Analytics Metrics
  const totalUsers = profiles.length;
  const premiumMonthlyCount = profiles.filter(p => p.subscription_tier === 'premium_monthly' || p.subscription_tier === 'premium').length;
  const premiumYearlyCount = profiles.filter(p => p.subscription_tier === 'premium_yearly').length;
  const premiumLifetimeCount = profiles.filter(p => p.subscription_tier === 'premium_lifetime').length;
  const totalPremiumUsers = premiumMonthlyCount + premiumYearlyCount + premiumLifetimeCount;
  const trialCount = Math.max(0, totalUsers - totalPremiumUsers);
  const estimatedRevenue = (premiumMonthlyCount * (monthlyPrice || 149)) + (premiumYearlyCount * (yearlyPrice || 1499)) + (premiumLifetimeCount * (lifetimePrice || 2499));

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#09090f',
      background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.12) 0%, #09090f 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#f8fafc',
      overflow: 'hidden'
    }}>
        {/* Header Bar */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
            }}>
              <Shield size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                ZenBudget Admin Control Center
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                Master Owner Operations & Analytics Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Security Gate / Lock Screen */}
        {!isUnlocked ? (
          <div style={{
            padding: '3rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Lock size={32} color="#818cf8" />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Master Security Authentication
            </h3>
            <p style={{ color: '#94a3b8', maxWidth: '400px', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Please enter your Master Admin Key to access owner configuration and user controls.
            </p>

            <form onSubmit={handleUnlock} style={{ width: '100%', maxWidth: '340px' }}>
              <input
                type="password"
                placeholder="Enter Master Admin Secret Key"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#fff',
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '2px'
                }}
              />
              
              {authError && (
                <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {authError}
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                Unlock Admin Console
              </button>
            </form>
          </div>
        ) : (
          /* Main Admin Content */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Admin Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.6rem',
              padding: '1rem 1.75rem',
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}>
              {[
                { id: 'overview', label: 'Analytics & Overview', icon: TrendingUp },
                { id: 'users', label: `User Management (${totalUsers})`, icon: Users },
                { id: 'referrals', label: `Referrals & Revenue`, icon: Share2 },
                { id: 'family', label: `Family Sync Links`, icon: Link2 },
                { id: 'broadcasts', label: 'Broadcast Center', icon: Bell },
                { id: 'coupons', label: 'Discount Coupons', icon: Gift },
                { id: 'pricing', label: 'Pricing Control', icon: DollarSign },
                { id: 'ratings', label: `App Ratings (${ratings.length})`, icon: Star }
              ].map(tab => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.3rem',
                      borderRadius: '12px',
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid rgba(255, 255, 255, 0.05)',
                      boxShadow: isActive ? '0 0 15px rgba(99, 102, 241, 0.25)' : 'none',
                      color: isActive ? '#fff' : '#94a3b8',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      flexShrink: 0
                    }}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </button>
                );
              })}

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={fetchAdminData}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#e2e8f0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column' }}>
              
              {/* Universal Search Bar for directories */}
              {(activeTab === 'users' || activeTab === 'referrals' || activeTab === 'family') && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', width: '100%', flexShrink: 0 }}>
                  <div style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Search size={18} color="#a5b4fc" style={{ position: 'absolute', left: '1rem' }} />
                    <input
                      type="text"
                      placeholder="Search by User Name, Referral Code, Sync Code, or Email/ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem 0.85rem 2.8rem',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(30, 41, 59, 0.45)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: OVERVIEW & METRICS */}
              {activeTab === 'overview' && (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem'
                  }}>
                    <div style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Users</span>
                        <Users size={20} color="#6366f1" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalUsers}</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                        Active Registered Accounts
                      </div>
                    </div>

                    <div style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Premium Subscribers</span>
                        <Crown size={20} color="#f59e0b" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                        {totalPremiumUsers}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                        {premiumMonthlyCount} Monthly | {premiumYearlyCount} Yearly | {premiumLifetimeCount} Lifetime
                      </div>
                    </div>

                    <div style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Est. Revenue</span>
                        <DollarSign size={20} color="#10b981" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
                        ₹{estimatedRevenue.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        From Cashfree Subscription Sales
                      </div>
                    </div>

                    <div style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Trial Users</span>
                        <Activity size={20} color="#38bdf8" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{trialCount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.25rem' }}>
                        Potential Upsell Candidates
                      </div>
                    </div>
                  </div>

                  {/* System Quick Controls */}
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                      🚀 Master System Controls
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                      Use the tabs above to manage registered users, grant lifetime premium access, or send broadcast notifications to all ZenBudget users.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: USER MANAGEMENT */}
              {activeTab === 'users' && (
                <div>
                  {/* Bulk Delete Bar */}
                  {selectedUserIds.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 700 }}>
                        {selectedUserIds.length} User(s) Selected
                      </span>
                      <button
                        onClick={() => setConfirmBulkDeleteOpen(true)}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Trash2 size={14} /> Delete Selected IDs ({selectedUserIds.length})
                      </button>
                    </div>
                  )}

                  <div style={{
                    borderRadius: '16px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <th style={{ padding: '1rem', width: '40px', textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedUserIds.length === filteredProfiles.length && filteredProfiles.length > 0} 
                              onChange={toggleSelectAllUsers} 
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }}
                            />
                          </th>
                          <th style={{ padding: '1rem' }}>User Name & Email</th>
                          <th style={{ padding: '1rem' }}>Referral / Code</th>
                          <th style={{ padding: '1rem' }}>Current Plan</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                          <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProfiles.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                              No profiles found.
                            </td>
                          </tr>
                        ) : (
                          filteredProfiles.map((p) => {
                            const referredUsers = profiles.filter(pr => pr.referred_by === p.referral_code);
                            const totalReferred = referredUsers.length;
                            const paidReferred = referredUsers.filter(pr => pr.subscription_tier && pr.subscription_tier.startsWith('premium')).length;

                            const referredUserIds = referredUsers.map(pr => pr.id);
                            const referredUserEmails = referredUsers.map(pr => (pr.email || '').toLowerCase().trim()).filter(Boolean);
                            const referredPayments = payments.filter(pay => 
                              referredUserIds.includes(pay.user_id) || 
                              referredUserEmails.includes((pay.email || '').toLowerCase().trim())
                            );
                            const totalPaymentsAmount = referredPayments.reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0);
                            const isSelected = selectedUserIds.includes(p.id);
                            const resolvedEmail = p.email || `${(p.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

                            return (
                              <React.Fragment key={p.id}>
                                <tr 
                                  onClick={() => setSelectedDetailUser(p)}
                                  style={{ 
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                  }}
                                >
                                  <td style={{ padding: '1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected} 
                                      onChange={(e) => toggleSelectUser(p.id, e as any)} 
                                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }}
                                    />
                                  </td>

                                  <td style={{ padding: '1rem', fontWeight: 600 }}>
                                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>{p.name || 'Anonymous User'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '1px' }}>✉️ {resolvedEmail}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '2px', fontWeight: 700 }}>
                                      🔑 PIN: {p.pin || (p as any).zb_passcode || '1234'}
                                    </div>
                                  </td>

                                  <td style={{ padding: '1rem' }}>
                                    <div style={{ color: '#a5b4fc', fontWeight: 600 }}>{p.referral_code || 'N/A'}</div>
                                    {totalReferred > 0 && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setExpandedUserId(expandedUserId === p.id ? null : p.id); }}
                                        style={{ 
                                          fontSize: '0.7rem', color: '#34d399', marginTop: '4px', cursor: 'pointer', 
                                          display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline',
                                          background: 'none', border: 'none', padding: 0, outline: 'none'
                                        }}
                                      >
                                        📢 Referrals: {totalReferred} (Paid: {paidReferred}, Rev: ₹{totalPaymentsAmount})
                                      </button>
                                    )}
                                  </td>

                                  <td style={{ padding: '1rem' }}>
                                    <span style={{
                                      padding: '0.25rem 0.6rem',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      backgroundColor: p.subscription_tier === 'premium_lifetime'
                                        ? 'rgba(245, 158, 11, 0.2)'
                                        : p.subscription_tier === 'premium_monthly' || p.subscription_tier === 'premium'
                                          ? 'rgba(16, 185, 129, 0.2)'
                                          : 'rgba(56, 189, 248, 0.2)',
                                      color: p.subscription_tier === 'premium_lifetime'
                                        ? '#fbbf24'
                                        : p.subscription_tier === 'premium_monthly' || p.subscription_tier === 'premium'
                                          ? '#34d399'
                                          : '#38bdf8'
                                    }}>
                                      {p.subscription_tier || 'trial'}
                                    </span>
                                  </td>

                                  <td style={{ padding: '1rem' }}>
                                    {p.is_suspended ? (
                                      <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>🚫 Suspended</span>
                                    ) : (
                                      <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>Active</span>
                                    )}
                                  </td>

                                  <td style={{ padding: '1rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); updateUserSubscription(p.id, 'premium_monthly'); }}
                                        title="Grant Monthly Premium"
                                        style={{
                                          padding: '0.35rem 0.6rem',
                                          borderRadius: '6px',
                                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                          border: '1px solid rgba(16, 185, 129, 0.4)',
                                          color: '#34d399',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        +1 Month
                                      </button>

                                      <button
                                        onClick={(e) => { e.stopPropagation(); updateUserSubscription(p.id, 'premium_yearly'); }}
                                        title="Grant 1 Year Premium"
                                        style={{
                                          padding: '0.35rem 0.6rem',
                                          borderRadius: '6px',
                                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                          border: '1px solid rgba(99, 102, 241, 0.4)',
                                          color: '#818cf8',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        +1 Year
                                      </button>

                                      <button
                                        onClick={(e) => { e.stopPropagation(); updateUserSubscription(p.id, 'premium_lifetime'); }}
                                        title="Grant Lifetime Premium"
                                        style={{
                                          padding: '0.35rem 0.6rem',
                                          borderRadius: '6px',
                                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                          border: '1px solid rgba(245, 158, 11, 0.4)',
                                          color: '#fbbf24',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Lifetime
                                      </button>

                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleScanPayAccess(p.id, !!(p as any).has_scan_pay_access); }}
                                        title="Grant Free Scan & Pay Access"
                                        style={{
                                          padding: '0.35rem 0.6rem',
                                          borderRadius: '6px',
                                          backgroundColor: (p as any).has_scan_pay_access ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                          border: (p as any).has_scan_pay_access ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                                          color: (p as any).has_scan_pay_access ? '#34d399' : '#94a3b8',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ⚡ Scan: {(p as any).has_scan_pay_access ? 'UNLOCKED' : 'LOCKED'}
                                      </button>

                                      <button
                                        onClick={(e) => { e.stopPropagation(); updateUserSubscription(p.id, 'trial'); }}
                                        title="Revert to Trial"
                                        style={{
                                          padding: '0.35rem 0.6rem',
                                          borderRadius: '6px',
                                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          color: '#94a3b8',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Reset
                                      </button>

                                      <button
                                        onClick={(e) => { e.stopPropagation(); toggleUserSuspension(p.id, !!p.is_suspended); }}
                                        title={p.is_suspended ? 'Unsuspend User' : 'Suspend User'}
                                        style={{
                                          padding: '0.35rem 0.5rem',
                                          borderRadius: '6px',
                                          backgroundColor: p.is_suspended ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                          border: 'none',
                                          color: p.is_suspended ? '#34d399' : '#f87171',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {p.is_suspended ? <Unlock size={14} /> : <Lock size={14} />}
                                      </button>

                                      <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteTarget({ id: p.id, name: p.name || 'User' }); }}
                                        title="Permanently Delete User ID"
                                        style={{
                                          padding: '0.35rem 0.5rem',
                                          borderRadius: '6px',
                                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                          border: '1px solid rgba(239, 68, 68, 0.4)',
                                          color: '#f87171',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* 👤 Interactive User Profile Control Modal */}
                                {selectedDetailUser && selectedDetailUser.id === p.id && (
                                  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                                    <div style={{ width: '100%', maxWidth: '560px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', color: '#fff', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          👤 User Profile Control: {selectedDetailUser.name || 'Anonymous User'}
                                        </h3>
                                        <button onClick={() => setSelectedDetailUser(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <X size={18} />
                                        </button>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                                        {/* Editable Email Input */}
                                        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 700 }}>USER EMAIL ADDRESS (EDITABLE)</div>
                                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input 
                                              type="email" 
                                              value={editingDetailEmail} 
                                              onChange={(e) => setEditingDetailEmail(e.target.value)}
                                              placeholder="Enter user email address..."
                                              style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', outline: 'none' }}
                                            />
                                            <button 
                                              onClick={() => updateUserEmail(selectedDetailUser.id, editingDetailEmail)}
                                              style={{ padding: '9px 14px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                                            >
                                              💾 Save
                                            </button>
                                          </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>USER ID</div>
                                            <div style={{ fontWeight: 600, color: '#a5b4fc', fontSize: '0.75rem', marginTop: '2px', wordBreak: 'break-all' }}>{selectedDetailUser.id}</div>
                                          </div>
                                          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>PASSCODE / PIN</div>
                                            <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem', marginTop: '2px', letterSpacing: '2px' }}>
                                              🔑 {selectedDetailUser.pin || (selectedDetailUser as any).zb_passcode || '1234'}
                                            </div>
                                          </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>REFERRAL CODE</div>
                                            <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.9rem', marginTop: '2px' }}>{selectedDetailUser.referral_code || 'N/A'}</div>
                                          </div>
                                          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>SUBSCRIPTION PLAN</div>
                                            <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem', marginTop: '2px', textTransform: 'uppercase' }}>{selectedDetailUser.subscription_tier || 'trial'}</div>
                                          </div>
                                        </div>

                                        {/* Quick Action Buttons */}
                                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                          <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem' }}>Manage Subscription & Account Status</div>
                                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button onClick={() => updateUserSubscription(selectedDetailUser.id, 'premium_monthly')} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>+1 Month Premium</button>
                                            <button onClick={() => updateUserSubscription(selectedDetailUser.id, 'premium_yearly')} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>+1 Year Premium</button>
                                            <button onClick={() => updateUserSubscription(selectedDetailUser.id, 'premium_lifetime')} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Lifetime Premium</button>
                                            <button onClick={() => updateUserSubscription(selectedDetailUser.id, 'trial')} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Reset Trial</button>
                                            <button 
                                              onClick={async () => {
                                                await handleToggleScanPayAccess(selectedDetailUser.id, !!(selectedDetailUser as any).has_scan_pay_access);
                                                setSelectedDetailUser(prev => prev ? { ...prev, has_scan_pay_access: !(prev as any).has_scan_pay_access } : null);
                                              }} 
                                              style={{ 
                                                padding: '8px 14px', borderRadius: '8px', 
                                                background: (selectedDetailUser as any).has_scan_pay_access ? 'rgba(52, 211, 153, 0.25)' : 'rgba(239, 68, 68, 0.2)', 
                                                border: (selectedDetailUser as any).has_scan_pay_access ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(239, 68, 68, 0.4)', 
                                                color: (selectedDetailUser as any).has_scan_pay_access ? '#34d399' : '#f87171', 
                                                fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' 
                                              }}
                                            >
                                              ⚡ Scan &amp; Pay: {(selectedDetailUser as any).has_scan_pay_access ? 'UNLOCKED (FREE)' : 'LOCKED'}
                                            </button>
                                            <button onClick={() => toggleUserSuspension(selectedDetailUser.id, !!selectedDetailUser.is_suspended)} style={{ padding: '8px 14px', borderRadius: '8px', background: selectedDetailUser.is_suspended ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', border: 'none', color: selectedDetailUser.is_suspended ? '#34d399' : '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                                              {selectedDetailUser.is_suspended ? 'Unsuspend' : 'Suspend Account'}
                                            </button>
                                            <button onClick={() => setConfirmDeleteTarget({ id: selectedDetailUser.id, name: selectedDetailUser.name || 'User' })} style={{ padding: '8px 14px', borderRadius: '8px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <Trash2 size={14} /> Delete Account
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Collapsible Referral Details Row */}
                                {expandedUserId === p.id && totalReferred > 0 && (
                                  <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                                    <td colSpan={6} style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', marginBottom: '10px', textAlign: 'left' }}>
                                        👥 Referrals breakdown for {p.name || 'Anonymous User'}
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.5fr', gap: '12px', fontSize: '0.8rem', textAlign: 'left', marginBottom: '12px' }}>
                                        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Total Referred</div>
                                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{totalReferred} Users</div>
                                        </div>
                                        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Paid vs Free</div>
                                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                                            {paidReferred} Paid / {totalReferred - paidReferred} Free
                                          </div>
                                        </div>
                                        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Total Revenue Generated</div>
                                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                                            ₹{totalPaymentsAmount.toLocaleString()} INR
                                          </div>
                                        </div>
                                      </div>

                                      <div style={{ marginTop: '12px', overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                                        <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                                          <thead>
                                            <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                              <th style={{ padding: '8px 10px' }}>Referred User</th>
                                              <th style={{ padding: '8px 10px' }}>Current Plan</th>
                                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Payments</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {referredUsers.map(refU => {
                                              const userPays = payments.filter(pay => 
                                                pay.user_id === refU.id || 
                                                (refU.email && pay.email && pay.email.toLowerCase().trim() === refU.email.toLowerCase().trim())
                                              );
                                              const userPaySum = userPays.reduce((s, pay) => s + parseFloat(pay.amount || 0), 0);

                                              return (
                                                <tr key={refU.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                  <td style={{ padding: '8px 10px', color: '#fff' }}>
                                                    <div style={{ fontWeight: 600 }}>{refU.name || 'Anonymous User'}</div>
                                                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{refU.email || 'No email'}</div>
                                                  </td>
                                                  <td style={{ padding: '8px 10px' }}>
                                                    <span style={{
                                                      padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
                                                      backgroundColor: refU.subscription_tier?.startsWith('premium') ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.05)',
                                                      color: refU.subscription_tier?.startsWith('premium') ? '#34d399' : '#94a3b8'
                                                    }}>
                                                      {refU.subscription_tier || 'trial'}
                                                    </span>
                                                  </td>
                                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: userPaySum > 0 ? '#fbbf24' : '#64748b', fontWeight: 700 }}>
                                                    ₹{userPaySum.toLocaleString()}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: REFERRALS DIRECTORY */}
              {activeTab === 'referrals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>Referrals &amp; Revenue Ledger</h3>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Track who referred whom, their plans, and post-referral spending details.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(() => {
                      // Filter profiles that have actually referred at least one user
                      const inviters = profiles.filter(p => {
                        const hasReferred = profiles.some(pr => pr.referred_by === p.referral_code);
                        const matchesSearch = !searchQuery || 
                          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.referral_code && p.referral_code.toLowerCase().includes(searchQuery.toLowerCase()));
                        return hasReferred && matchesSearch;
                      });

                      if (inviters.length === 0) {
                        return (
                          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            No users have made referrals matching the query yet.
                          </div>
                        );
                      }

                      return inviters.map(p => {
                        const referredUsers = profiles.filter(pr => pr.referred_by === p.referral_code);
                        const totalReferred = referredUsers.length;
                        const paidReferred = referredUsers.filter(pr => pr.subscription_tier && pr.subscription_tier.startsWith('premium')).length;
                        const freeReferred = totalReferred - paidReferred;

                        const referredUserIds = referredUsers.map(pr => pr.id);
                        const referredUserEmails = referredUsers.map(pr => (pr.email || '').toLowerCase().trim()).filter(Boolean);
                        const referredPayments = payments.filter(pay => 
                          referredUserIds.includes(pay.user_id) || 
                          referredUserEmails.includes((pay.email || '').toLowerCase().trim())
                        );
                        const totalPaymentsAmount = referredPayments.reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0);

                        return (
                          <div key={p.id} style={{
                            padding: '1.5rem',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(30, 41, 59, 0.65)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            textAlign: 'left'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.5px' }}>
                                  Inviter Profile
                                </span>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '4px 0 0 0' }}>
                                  {p.name || 'Anonymous User'}
                                </h4>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                  {p.email || 'No email registered'} • Code: <strong style={{ color: '#a5b4fc' }}>{p.referral_code}</strong>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Total Referred</div>
                                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{totalReferred} Users</div>
                                </div>
                                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Paid / Free</div>
                                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                                    {paidReferred} / {freeReferred}
                                  </div>
                                </div>
                                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Total Revenue</div>
                                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                                    ₹{totalPaymentsAmount.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Nested referred users ledger */}
                            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '8px 12px' }}>Referred User</th>
                                    <th style={{ padding: '8px 12px' }}>Current Plan</th>
                                    <th style={{ padding: '8px 12px' }}>Joined Date</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Revenue Generated</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {referredUsers.map(refU => {
                                    const userPays = payments.filter(pay => 
                                      pay.user_id === refU.id || 
                                      (refU.email && pay.email && pay.email.toLowerCase().trim() === refU.email.toLowerCase().trim())
                                    );
                                    const userPaySum = userPays.reduce((s, pay) => s + parseFloat(pay.amount || 0), 0);

                                    return (
                                      <tr key={refU.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '8px 12px', color: '#fff' }}>
                                          <div style={{ fontWeight: 600 }}>{refU.name || 'Anonymous User'}</div>
                                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{refU.email || 'No email'}</div>
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                          <span style={{
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
                                            backgroundColor: refU.subscription_tier?.startsWith('premium') ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.05)',
                                            color: refU.subscription_tier?.startsWith('premium') ? '#34d399' : '#94a3b8'
                                          }}>
                                            {refU.subscription_tier || 'trial'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>
                                          {refU.trial_start_date ? new Date(refU.trial_start_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: userPaySum > 0 ? '#fbbf24' : '#64748b', fontWeight: 700 }}>
                                          ₹{userPaySum.toLocaleString()}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* TAB: FAMILY SYNC DIRECTORY */}
              {activeTab === 'family' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0, textAlign: 'left' }}>Family &amp; Couple Sync Ledger</h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0', textAlign: 'left' }}>Monitor mutual couple links, sync statuses, and pending partner connections.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {(() => {
                      const processedPairs = new Set<string>();
                      const coupleCards: React.ReactNode[] = [];

                      profiles.forEach(p => {
                        // Avoid duplicates if we already processed this pair
                        if (processedPairs.has(p.id)) return;

                        const partner = p.partner_couple_code ? profiles.find(pr => pr.couple_code === p.partner_couple_code) : null;
                        const isMutual = partner && partner.partner_couple_code === p.couple_code;

                        // Filter based on search query
                        const query = searchQuery.toLowerCase();
                        const matchesSearch = !searchQuery ||
                          p.name?.toLowerCase().includes(query) ||
                          p.email?.toLowerCase().includes(query) ||
                          (p.couple_code && p.couple_code.toLowerCase().includes(query)) ||
                          (partner && (partner.name?.toLowerCase().includes(query) || partner.email?.toLowerCase().includes(query)));

                        if (!matchesSearch) return;

                        if (partner) {
                          processedPairs.add(partner.id);
                        }
                        processedPairs.add(p.id);

                        if (partner || p.partner_couple_code) {
                          coupleCards.push(
                            <div key={p.id} style={{
                              padding: '1.5rem',
                              borderRadius: '16px',
                              backgroundColor: 'rgba(30, 41, 59, 0.65)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1rem',
                              textAlign: 'left'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  backgroundColor: isMutual ? 'rgba(236, 72, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color: isMutual ? '#f472b6' : '#fbbf24',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  {isMutual ? '💞 Mutually Connected' : '⏳ Pending Confirmation'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  Sync Pair Code: <strong style={{ color: '#fff' }}>{p.couple_code} ⟷ {p.partner_couple_code || 'N/A'}</strong>
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
                                {/* User 1 */}
                                <div style={{ flex: '1 1 200px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{p.name || 'Anonymous User'}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{p.email || 'No email'}</div>
                                  <div style={{ marginTop: '8px' }}>
                                    <span style={{
                                      fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
                                      backgroundColor: p.subscription_tier?.startsWith('premium') ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.05)',
                                      color: p.subscription_tier?.startsWith('premium') ? '#34d399' : '#94a3b8'
                                    }}>
                                      {p.subscription_tier || 'trial'}
                                    </span>
                                  </div>
                                </div>

                                {/* Link Indicator Icon */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isMutual ? '#f472b6' : '#94a3b8', minWidth: '50px' }}>
                                  <span style={{ fontSize: '20px' }}>{isMutual ? '💞' : '⏳'}</span>
                                  <div style={{ width: '40px', height: '2px', background: isMutual ? 'linear-gradient(to right, #ec4899, #818cf8)' : '#475569', margin: '6px 0' }} />
                                </div>

                                {/* User 2 (Partner) */}
                                <div style={{ flex: '1 1 200px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                  {partner ? (
                                    <>
                                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{partner.name || 'Anonymous User'}</div>
                                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{partner.email || 'No email'}</div>
                                      <div style={{ marginTop: '8px' }}>
                                        <span style={{
                                          fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
                                          backgroundColor: partner.subscription_tier?.startsWith('premium') ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.05)',
                                          color: partner.subscription_tier?.startsWith('premium') ? '#34d399' : '#94a3b8'
                                        }}>
                                          {partner.subscription_tier || 'trial'}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60px', color: '#64748b', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center' }}>
                                      Waiting for partner with code {p.partner_couple_code} to link back.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      });

                      if (coupleCards.length === 0) {
                        return (
                          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            No couple sync profiles created or matching query yet.
                          </div>
                        );
                      }

                      return coupleCards;
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 3: BROADCAST NOTIFICATION CENTER */}
              {activeTab === 'broadcasts' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Create Broadcast Form */}
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Send size={18} color="#6366f1" /> Send Broadcast Announcement
                    </h4>

                    <form onSubmit={handleSendBroadcast}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                          Announcement Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 🎉 New Feature Release v3.0!"
                          value={bcTitle}
                          onChange={(e) => setBcTitle(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                          Notification Type
                        </label>
                        <select
                          value={bcType}
                          onChange={(e) => setBcType(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                        >
                          <option value="info">ℹ️ Info Announcement</option>
                          <option value="update">🚀 App Update Release</option>
                          <option value="success">🎉 Promotional Deal</option>
                          <option value="warning">⚠️ Important Notice</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                          Message Body
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Write message details for all app users..."
                          value={bcMessage}
                          onChange={(e) => setBcMessage(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                            🔗 Link URL (optional)
                          </label>
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={bcLink}
                            onChange={(e) => setBcLink(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              fontSize: '0.9rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                            Button Label (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Learn More"
                            value={bcButtonText}
                            onChange={(e) => setBcButtonText(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              fontSize: '0.9rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          padding: '0.8rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Publish Broadcast Notification
                      </button>
                    </form>
                  </div>

                  {/* Broadcast List */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                      Active Sent Announcements ({broadcasts.length})
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
                      {broadcasts.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px' }}>
                          No broadcast announcements published yet.
                        </div>
                      ) : (
                        broadcasts.map((b) => (
                          <div key={b.id} style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#a5b4fc', marginBottom: '0.25rem' }}>
                                {b.title}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                                {b.message}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                {new Date(b.created_at).toLocaleString()}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteBroadcast(b.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: '0.25rem'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DISCOUNT COUPONS */}
              {activeTab === 'coupons' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Gift size={18} color="#f59e0b" /> Create Promotional Coupon
                    </h4>

                    <form onSubmit={handleCreateCoupon}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                          Coupon Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., LAUNCH50 or ZENSPECIAL"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                          Discount Percentage (%)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                          Max Claims / Uses Limit
                        </label>
                        <input
                          type="number"
                          value={maxUses}
                          onChange={(e) => setMaxUses(parseInt(e.target.value) || 100)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                          Target User Email (Optional - restrict coupon to one user)
                        </label>
                        <input
                          type="email"
                          placeholder="e.g., user@example.com"
                          value={targetEmailInput}
                          onChange={(e) => setTargetEmailInput(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                          Target Plan Type (Optional - restrict coupon to one plan)
                        </label>
                        <select
                          value={targetPlanInput}
                          onChange={(e) => setTargetPlanInput(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                        >
                          <option value="">All Plan Types (Universal)</option>
                          <option value="monthly">Monthly Plan (₹149)</option>
                          <option value="yearly">Yearly Plan (₹1,499)</option>
                          <option value="lifetime">Lifetime Founding Member (₹2,499)</option>
                          <option value="scan_pay_unlock">Scan &amp; Pay Lifetime Unlock (₹79)</option>
                          <option value="extra_budget_slot">Extra Budget Slot (Trial Users Only) (₹10)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          padding: '0.8rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Generate Coupon Code
                      </button>
                    </form>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                      Active Coupons ({coupons.length})
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {coupons.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px' }}>
                          No promo coupons created yet.
                        </div>
                      ) : (
                        coupons.map((c) => {
                          const isEditing = editingCoupon && editingCoupon.code === c.code;

                          return (
                            <div key={c.code} style={{
                              padding: '1.25rem',
                              borderRadius: '12px',
                              backgroundColor: 'rgba(30, 41, 59, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fbbf24', letterSpacing: '1px' }}>
                                      {c.code}
                                    </span>
                                    <span style={{
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '4px',
                                      fontSize: '0.65rem',
                                      backgroundColor: c.is_active ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                      color: c.is_active ? '#34d399' : '#f87171',
                                      fontWeight: 700
                                    }}>
                                      {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                  </div>
                                  
                                  {!isEditing ? (
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <div>{c.discount_percent}% OFF | Max Uses: {c.max_uses} (Used: {c.uses_count || 0})</div>
                                      {c.target_email && (
                                        <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                                          🎯 User Restricted: {c.target_email}
                                        </div>
                                      )}
                                      {c.target_plan && (
                                        <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>
                                          📋 Plan Restricted: {c.target_plan.toUpperCase()} Only
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <div>
                                          <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Discount %</label>
                                          <input 
                                            type="number" 
                                            value={editingCoupon.discount_percent}
                                            onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_percent: parseInt(e.target.value) || 0 })}
                                            style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                                          />
                                        </div>
                                        <div>
                                          <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Max Uses</label>
                                          <input 
                                            type="number" 
                                            value={editingCoupon.max_uses}
                                            onChange={(e) => setEditingCoupon({ ...editingCoupon, max_uses: parseInt(e.target.value) || 0 })}
                                            style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Target Email</label>
                                        <input 
                                          type="text" 
                                          placeholder="Optional target email"
                                          value={editingCoupon.target_email || ''}
                                          onChange={(e) => setEditingCoupon({ ...editingCoupon, target_email: e.target.value })}
                                          style={{ width: '180px', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.8rem', marginBottom: '4px' }}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Target Plan</label>
                                        <select
                                          value={editingCoupon.target_plan || ''}
                                          onChange={(e) => setEditingCoupon({ ...editingCoupon, target_plan: e.target.value })}
                                          style={{ width: '180px', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                                        >
                                          <option value="">All Plan Types</option>
                                          <option value="subscription_all">All Subscriptions (Monthly, Yearly &amp; Lifetime)</option>
                                          <option value="monthly">Monthly Plan Only</option>
                                          <option value="yearly">Yearly Plan Only</option>
                                          <option value="lifetime">Lifetime Plan Only</option>
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  {isEditing ? (
                                    <>
                                      <button 
                                        onClick={handleUpdateCoupon}
                                        style={{ background: 'rgba(52, 211, 153, 0.15)', border: 'none', borderRadius: '8px', padding: '6px', color: '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Save Changes"
                                      >
                                        <Check size={16} />
                                      </button>
                                      <button 
                                        onClick={() => setEditingCoupon(null)}
                                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '8px', padding: '6px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Cancel"
                                      >
                                        <X size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button 
                                        onClick={() => setEditingCoupon({ code: c.code, discount_percent: c.discount_percent, max_uses: c.max_uses, target_email: c.target_email, target_plan: c.target_plan })}
                                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '8px', padding: '6px', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Edit Coupon"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handleToggleCouponActive(c.code, c.is_active)}
                                        style={{ 
                                          background: c.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)', 
                                          border: 'none', borderRadius: '8px', padding: '4px 8px', 
                                          color: c.is_active ? '#f87171' : '#34d399', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' 
                                        }}
                                        title={c.is_active ? "Deactivate" : "Activate"}
                                      >
                                        {c.is_active ? 'Deactivate' : 'Activate'}
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteCoupon(c.code)}
                                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', borderRadius: '8px', padding: '6px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Delete Coupon"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: APP RATINGS & FEEDBACK */}
              {activeTab === 'ratings' && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={18} color="#fbbf24" /> User App Ratings & Feedback ({ratings.length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {ratings.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px' }}>
                        No user ratings submitted yet.
                      </div>
                    ) : (
                      ratings.map((r) => (
                        <div key={r.id} style={{
                          padding: '1.1rem 1.4rem',
                          borderRadius: '14px',
                          backgroundColor: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                                {r.user_name || 'Anonymous User'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                ({r.user_email || 'N/A'})
                              </span>
                            </div>
                            {/* Review Comment Text */}
                            {((r.feedback && r.feedback.trim() && !r.feedback.includes('rating submitted')) || (r as any).comment || (r as any).review_text) ? (
                              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #38bdf8', marginBottom: '0.35rem', fontStyle: 'italic', fontWeight: 500 }}>
                                💬 "{r.feedback || (r as any).comment || (r as any).review_text}"
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 500 }}>
                                {r.feedback || `${r.rating_stars || 5} Star rating submitted`}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {new Date(r.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ fontSize: '1.1rem', letterSpacing: '2px', backgroundColor: 'rgba(251, 191, 36, 0.15)', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                            {'⭐'.repeat(r.rating_stars || 5)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {/* TAB 8: PRICING CONTROL */}
              {activeTab === 'pricing' && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={18} color="#34d399" /> Dynamic Subscription Pricing Manager
                  </h4>

                  <div style={{ maxWidth: '520px', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem', textAlign: 'left' }}>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.5 }}>
                      Set live subscription & feature prices across the ZenBudget app. Select currency at the top to switch & edit prices dynamically!
                    </p>

                    {/* 🌐 Top Currency Switcher */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem', padding: '6px', borderRadius: '14px', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.12)', flexWrap: 'wrap' }}>
                      {(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'AED', 'SGD'] as const).map(curr => {
                        const symbolMap = { 
                          INR: '🇮🇳 INR', USD: '🇺🇸 USD', EUR: '🇪🇺 EUR', GBP: '🇬🇧 GBP',
                          CAD: '🇨🇦 CAD', AUD: '🇦🇺 AUD', AED: '🇦🇪 AED', SGD: '🇸🇬 SGD'
                        };
                        const isActive = selectedPricingCurrency === curr;
                        return (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => setSelectedPricingCurrency(curr)}
                            style={{
                              flex: '1 0 20%', padding: '8px 6px', borderRadius: '8px', border: 'none',
                              background: isActive ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                              color: isActive ? '#fff' : '#94a3b8',
                              fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                              boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {symbolMap[curr]}
                          </button>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSavePricing} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span>🌐</span> Setting Prices for: <span style={{ color: '#38bdf8' }}>{selectedPricingCurrency} ({selectedPricingCurrency === 'INR' ? '₹' : selectedPricingCurrency === 'EUR' ? '€' : selectedPricingCurrency === 'GBP' ? '£' : selectedPricingCurrency === 'AED' ? 'AED' : '$'})</span>
                      </div>

                      {/* 1. Monthly Plan Price */}
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                          Monthly Plan Price ({selectedPricingCurrency === 'INR' ? '₹' : selectedPricingCurrency === 'EUR' ? '€' : selectedPricingCurrency === 'GBP' ? '£' : selectedPricingCurrency === 'AED' ? 'AED' : '$'})
                        </label>
                        <input
                          type="number"
                          step={selectedPricingCurrency === 'INR' ? '1' : '0.01'}
                          value={
                            selectedPricingCurrency === 'INR' ? monthlyPrice :
                            selectedPricingCurrency === 'USD' ? usdMonthlyPrice :
                            selectedPricingCurrency === 'EUR' ? eurMonthlyPrice :
                            selectedPricingCurrency === 'GBP' ? gbpMonthlyPrice :
                            selectedPricingCurrency === 'CAD' ? cadMonthlyPrice :
                            selectedPricingCurrency === 'AUD' ? audMonthlyPrice :
                            selectedPricingCurrency === 'AED' ? aedMonthlyPrice : sgdMonthlyPrice
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (selectedPricingCurrency === 'INR') setMonthlyPrice(val);
                            else if (selectedPricingCurrency === 'USD') setUsdMonthlyPrice(val);
                            else if (selectedPricingCurrency === 'EUR') setEurMonthlyPrice(val);
                            else if (selectedPricingCurrency === 'GBP') setGbpMonthlyPrice(val);
                            else if (selectedPricingCurrency === 'CAD') setCadMonthlyPrice(val);
                            else if (selectedPricingCurrency === 'AUD') setAudMonthlyPrice(val);
                            else if (selectedPricingCurrency === 'AED') setAedMonthlyPrice(val);
                            else if (selectedPricingCurrency === 'SGD') setSgdMonthlyPrice(val);
                          }}
                          placeholder={selectedPricingCurrency === 'INR' ? '149' : '2.99'}
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#34d399', fontWeight: 800, fontSize: '1rem', outline: 'none' }}
                        />
                      </div>

                      {/* 2. Yearly Plan Price */}
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                          Yearly Plan Price ({selectedPricingCurrency === 'INR' ? '₹' : selectedPricingCurrency === 'EUR' ? '€' : selectedPricingCurrency === 'GBP' ? '£' : selectedPricingCurrency === 'AED' ? 'AED' : '$'})
                        </label>
                        <input
                          type="number"
                          step={selectedPricingCurrency === 'INR' ? '1' : '0.01'}
                          value={
                            selectedPricingCurrency === 'INR' ? yearlyPrice :
                            selectedPricingCurrency === 'USD' ? usdYearlyPrice :
                            selectedPricingCurrency === 'EUR' ? eurYearlyPrice :
                            selectedPricingCurrency === 'GBP' ? gbpYearlyPrice :
                            selectedPricingCurrency === 'CAD' ? cadYearlyPrice :
                            selectedPricingCurrency === 'AUD' ? audYearlyPrice :
                            selectedPricingCurrency === 'AED' ? aedYearlyPrice : sgdYearlyPrice
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (selectedPricingCurrency === 'INR') setYearlyPrice(val);
                            else if (selectedPricingCurrency === 'USD') setUsdYearlyPrice(val);
                            else if (selectedPricingCurrency === 'EUR') setEurYearlyPrice(val);
                            else if (selectedPricingCurrency === 'GBP') setGbpYearlyPrice(val);
                            else if (selectedPricingCurrency === 'CAD') setCadYearlyPrice(val);
                            else if (selectedPricingCurrency === 'AUD') setAudYearlyPrice(val);
                            else if (selectedPricingCurrency === 'AED') setAedYearlyPrice(val);
                            else if (selectedPricingCurrency === 'SGD') setSgdYearlyPrice(val);
                          }}
                          placeholder={selectedPricingCurrency === 'INR' ? '1499' : '29.99'}
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fbbf24', fontWeight: 800, fontSize: '1rem', outline: 'none' }}
                        />
                      </div>

                      {/* 3. Lifetime Plan Price */}
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                          Lifetime Founding Member Price ({selectedPricingCurrency === 'INR' ? '₹' : selectedPricingCurrency === 'EUR' ? '€' : selectedPricingCurrency === 'GBP' ? '£' : selectedPricingCurrency === 'AED' ? 'AED' : '$'})
                        </label>
                        <input
                          type="number"
                          step={selectedPricingCurrency === 'INR' ? '1' : '0.01'}
                          value={
                            selectedPricingCurrency === 'INR' ? lifetimePrice :
                            selectedPricingCurrency === 'USD' ? usdLifetimePrice :
                            selectedPricingCurrency === 'EUR' ? eurLifetimePrice :
                            selectedPricingCurrency === 'GBP' ? gbpLifetimePrice :
                            selectedPricingCurrency === 'CAD' ? cadLifetimePrice :
                            selectedPricingCurrency === 'AUD' ? audLifetimePrice :
                            selectedPricingCurrency === 'AED' ? aedLifetimePrice : sgdLifetimePrice
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (selectedPricingCurrency === 'INR') setLifetimePrice(val);
                            else if (selectedPricingCurrency === 'USD') setUsdLifetimePrice(val);
                            else if (selectedPricingCurrency === 'EUR') setEurLifetimePrice(val);
                            else if (selectedPricingCurrency === 'GBP') setGbpLifetimePrice(val);
                            else if (selectedPricingCurrency === 'CAD') setCadLifetimePrice(val);
                            else if (selectedPricingCurrency === 'AUD') setAudLifetimePrice(val);
                            else if (selectedPricingCurrency === 'AED') setAedLifetimePrice(val);
                            else if (selectedPricingCurrency === 'SGD') setSgdLifetimePrice(val);
                          }}
                          placeholder={selectedPricingCurrency === 'INR' ? '2499' : '49.99'}
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#a5b4fc', fontWeight: 800, fontSize: '1rem', outline: 'none' }}
                        />
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '4px 0' }} />

                      {/* 4. Extra Slot Price (Trial Users Only) */}
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                          Extra Budget Slot Price (Trial Users Only) ({selectedPricingCurrency === 'INR' ? '₹' : selectedPricingCurrency === 'EUR' ? '€' : selectedPricingCurrency === 'GBP' ? '£' : selectedPricingCurrency === 'AED' ? 'AED' : '$'})
                        </label>
                        <input
                          type="number"
                          step={selectedPricingCurrency === 'INR' ? '1' : '0.01'}
                          value={
                            selectedPricingCurrency === 'INR' ? inrSlotPrice :
                            selectedPricingCurrency === 'USD' ? usdSlotPrice :
                            selectedPricingCurrency === 'EUR' ? eurSlotPrice :
                            selectedPricingCurrency === 'GBP' ? gbpSlotPrice :
                            selectedPricingCurrency === 'CAD' ? cadSlotPrice :
                            selectedPricingCurrency === 'AUD' ? audSlotPrice :
                            selectedPricingCurrency === 'AED' ? aedSlotPrice : sgdSlotPrice
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (selectedPricingCurrency === 'INR') setInrSlotPrice(val);
                            else if (selectedPricingCurrency === 'USD') setUsdSlotPrice(val);
                            else if (selectedPricingCurrency === 'EUR') setEurSlotPrice(val);
                            else if (selectedPricingCurrency === 'GBP') setGbpSlotPrice(val);
                            else if (selectedPricingCurrency === 'CAD') setCadSlotPrice(val);
                            else if (selectedPricingCurrency === 'AUD') setAudSlotPrice(val);
                            else if (selectedPricingCurrency === 'AED') setAedSlotPrice(val);
                            else if (selectedPricingCurrency === 'SGD') setSgdSlotPrice(val);
                          }}
                          placeholder={selectedPricingCurrency === 'INR' ? '10' : '1.99'}
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#38bdf8', fontWeight: 800, fontSize: '1rem', outline: 'none' }}
                        />
                      </div>

                      {/* 5. Scan & Pay Lifetime Feature Price */}
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                          ⚡ Scan &amp; Pay Lifetime Feature Price (One-Time Unlock) ({selectedPricingCurrency === 'INR' ? '₹' : selectedPricingCurrency === 'EUR' ? '€' : selectedPricingCurrency === 'GBP' ? '£' : selectedPricingCurrency === 'AED' ? 'AED' : '$'})
                        </label>
                        <input
                          type="number"
                          step={selectedPricingCurrency === 'INR' ? '1' : '0.01'}
                          value={
                            selectedPricingCurrency === 'INR' ? inrScanPayPrice :
                            selectedPricingCurrency === 'USD' ? usdScanPayPrice :
                            selectedPricingCurrency === 'EUR' ? eurScanPayPrice :
                            selectedPricingCurrency === 'GBP' ? gbpScanPayPrice :
                            selectedPricingCurrency === 'CAD' ? cadScanPayPrice :
                            selectedPricingCurrency === 'AUD' ? audScanPayPrice :
                            selectedPricingCurrency === 'AED' ? aedScanPayPrice : sgdScanPayPrice
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (selectedPricingCurrency === 'INR') setInrScanPayPrice(val);
                            else if (selectedPricingCurrency === 'USD') setUsdScanPayPrice(val);
                            else if (selectedPricingCurrency === 'EUR') setEurScanPayPrice(val);
                            else if (selectedPricingCurrency === 'GBP') setGbpScanPayPrice(val);
                            else if (selectedPricingCurrency === 'CAD') setCadScanPayPrice(val);
                            else if (selectedPricingCurrency === 'AUD') setAudScanPayPrice(val);
                            else if (selectedPricingCurrency === 'AED') setAedScanPayPrice(val);
                            else if (selectedPricingCurrency === 'SGD') setSgdScanPayPrice(val);
                          }}
                          placeholder={selectedPricingCurrency === 'INR' ? '79' : '4.99'}
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#34d399', fontWeight: 800, fontSize: '1rem', outline: 'none' }}
                        />
                      </div>

                      <button
                        type="submit"
                        style={{
                          marginTop: '8px',
                          padding: '13px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Check size={18} /> Save Live Subscription Prices
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 9: EXTRA SLOTS REVENUE & USER BREAKDOWN */}
              {activeTab === 'slots' && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={18} color="#38bdf8" /> Extra Budget Limit Slots Revenue & User Breakdown ({slotPurchases.length})
                  </h4>

                  {/* Stat Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total Extra Slots Sold</span>
                      <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0 0 0' }}>
                        {slotPurchases.reduce((sum, s) => sum + (s.slot_count || 1), 0)} Slots
                      </p>
                    </div>

                    <div style={{ padding: '1.25rem', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total Slot Revenue</span>
                      <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', margin: '4px 0 0 0' }}>
                        ₹{slotPurchases.reduce((sum, s) => sum + (s.price_paid || 10), 0)}
                      </p>
                    </div>
                  </div>

                  {/* Slot Purchase Table */}
                  <div style={{ overflowX: 'auto', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                          <th style={{ padding: '12px 16px' }}>User Name</th>
                          <th style={{ padding: '12px 16px' }}>Email</th>
                          <th style={{ padding: '12px 16px' }}>Slots Bought</th>
                          <th style={{ padding: '12px 16px' }}>Amount Paid</th>
                          <th style={{ padding: '12px 16px' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slotPurchases.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                              No extra budget limit slots purchased yet.
                            </td>
                          </tr>
                        ) : (
                          slotPurchases.map((sp, idx) => (
                            <tr key={sp.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 700, color: '#fff' }}>{sp.user_name || 'ZenBudget User'}</td>
                              <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{sp.user_email || 'N/A'}</td>
                              <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 800 }}>+{sp.slot_count || 1} Slot</td>
                              <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 800 }}>{sp.currency === 'USD' ? '$' : '₹'}{sp.price_paid || 10}</td>
                              <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem' }}>{new Date(sp.created_at).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Custom Single User Delete Confirmation Modal */}
            {confirmDeleteTarget && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#0f172a', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.3)', color: '#fff', textAlign: 'center' }}>
                  <div style={{ fontSize: '42px', marginBottom: '12px' }}>⚠️</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0', color: '#f87171' }}>
                    Confirm Permanent Delete
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                    Are you sure you want to PERMANENTLY DELETE user <strong>"{confirmDeleteTarget.name}"</strong>? This will wipe their profile, transactions, and active sessions.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setConfirmDeleteTarget(null)} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={() => executeDeleteUser(confirmDeleteTarget.id, confirmDeleteTarget.name)} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                      Yes, Delete User
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Bulk Delete Confirmation Modal */}
            {confirmBulkDeleteOpen && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#0f172a', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.3)', color: '#fff', textAlign: 'center' }}>
                  <div style={{ fontSize: '42px', marginBottom: '12px' }}>🚨</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0', color: '#f87171' }}>
                    Confirm Bulk Delete ({selectedUserIds.length} Users)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                    Are you sure you want to PERMANENTLY DELETE <strong>{selectedUserIds.length} selected user accounts</strong>? This action CANNOT be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setConfirmBulkDeleteOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={executeBulkDeleteUsers} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                      Yes, Delete Selected
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  );
};
