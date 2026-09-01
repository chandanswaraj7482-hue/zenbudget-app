/**
 * ZenBudget IP Address & Location Tracker
 * Automatically detects user country, currency, and calling code from IP
 */

export interface GeoLocationInfo {
  ip?: string;
  countryCode: string;
  countryName: string;
  currency: string;
  phoneCode: string;
  city?: string;
  region?: string;
}

// Supported currencies in ZenBudget
export const SUPPORTED_CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD',
  'JPY', 'CNY', 'SGD', 'NZD', 'CHF', 'MYR', 'THB', 'BRL',
  'ZAR', 'PKR', 'BDT', 'LKR', 'NPR', 'IDR', 'PHP', 'VND',
  'KRW', 'RUB', 'TRY', 'MXN'
];

// Country Code to Default Currency Mapping
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  UK: 'GBP',
  AE: 'AED',
  SA: 'SAR',
  CA: 'CAD',
  AU: 'AUD',
  JP: 'JPY',
  CN: 'CNY',
  SG: 'SGD',
  NZ: 'NZD',
  CH: 'CHF',
  MY: 'MYR',
  TH: 'THB',
  BR: 'BRL',
  ZA: 'ZAR',
  PK: 'PKR',
  BD: 'BDT',
  LK: 'LKR',
  NP: 'NPR',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  KR: 'KRW',
  RU: 'RUB',
  TR: 'TRY',
  MX: 'MXN',
  // Eurozone countries
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR', IE: 'EUR',
  GR: 'EUR', LU: 'EUR', CY: 'EUR', MT: 'EUR', SK: 'EUR',
  SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR'
};

// Fallback timezone to country/currency heuristic
export const getFallbackGeo = (): GeoLocationInfo => {
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
  const navLang = (navigator.language || '').toLowerCase();

  if (tz.includes('kolkata') || tz.includes('calcutta') || navLang.includes('hi') || navLang.includes('in')) {
    return { countryCode: 'IN', countryName: 'India', currency: 'INR', phoneCode: '+91' };
  }
  if (tz.includes('london') || navLang.includes('gb') || navLang.includes('uk')) {
    return { countryCode: 'GB', countryName: 'United Kingdom', currency: 'GBP', phoneCode: '+44' };
  }
  if (tz.includes('dubai') || tz.includes('uae')) {
    return { countryCode: 'AE', countryName: 'United Arab Emirates', currency: 'AED', phoneCode: '+971' };
  }
  if (tz.includes('riyadh')) {
    return { countryCode: 'SA', countryName: 'Saudi Arabia', currency: 'SAR', phoneCode: '+966' };
  }
  if (tz.includes('paris') || tz.includes('berlin') || tz.includes('rome') || tz.includes('madrid')) {
    return { countryCode: 'EU', countryName: 'European Union', currency: 'EUR', phoneCode: '+33' };
  }
  if (tz.includes('tokyo')) {
    return { countryCode: 'JP', countryName: 'Japan', currency: 'JPY', phoneCode: '+81' };
  }
  if (tz.includes('singapore')) {
    return { countryCode: 'SG', countryName: 'Singapore', currency: 'SGD', phoneCode: '+65' };
  }
  if (tz.includes('toronto') || tz.includes('vancouver')) {
    return { countryCode: 'CA', countryName: 'Canada', currency: 'CAD', phoneCode: '+1' };
  }
  if (tz.includes('sydney') || tz.includes('melbourne')) {
    return { countryCode: 'AU', countryName: 'Australia', currency: 'AUD', phoneCode: '+61' };
  }

  return { countryCode: 'US', countryName: 'United States', currency: 'USD', phoneCode: '+1' };
};

/**
 * Detects location & currency from user IP address with multi-provider fallback
 */
export const detectLocationFromIP = async (): Promise<GeoLocationInfo> => {
  // 1. Check cached IP location (valid for session)
  try {
    const cached = localStorage.getItem('zb_geo_location_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.currency && parsed.countryCode) {
        return parsed;
      }
    }
  } catch (_) {}

  // Provider 1: ipwho.is (fast, CORS-friendly, zero rate-limit)
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.country_code) {
        const countryCode = data.country_code.toUpperCase();
        let currency = (data.currency && data.currency.code) ? data.currency.code.toUpperCase() : '';
        if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
          currency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
        }
        const phoneCode = data.calling_code ? (data.calling_code.startsWith('+') ? data.calling_code : `+${data.calling_code}`) : '+1';
        
        const result: GeoLocationInfo = {
          ip: data.ip,
          countryCode,
          countryName: data.country || '',
          currency,
          phoneCode,
          city: data.city || '',
          region: data.region || ''
        };
        localStorage.setItem('zb_geo_location_cache', JSON.stringify(result));
        return result;
      }
    }
  } catch (_) {}

  // Provider 2: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_code) {
        const countryCode = data.country_code.toUpperCase();
        let currency = (data.currency || '').toUpperCase();
        if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
          currency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
        }
        const phoneCode = data.country_calling_code ? (data.country_calling_code.startsWith('+') ? data.country_calling_code : `+${data.country_calling_code}`) : '+1';

        const result: GeoLocationInfo = {
          ip: data.ip,
          countryCode,
          countryName: data.country_name || '',
          currency,
          phoneCode,
          city: data.city || '',
          region: data.region || ''
        };
        localStorage.setItem('zb_geo_location_cache', JSON.stringify(result));
        return result;
      }
    }
  } catch (_) {}

  // Provider 3: freeipapi.com
  try {
    const res = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.countryCode) {
        const countryCode = data.countryCode.toUpperCase();
        let currency = (data.currency && data.currency.code) ? data.currency.code.toUpperCase() : '';
        if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
          currency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
        }
        const result: GeoLocationInfo = {
          ip: data.ipAddress,
          countryCode,
          countryName: data.countryName || '',
          currency,
          phoneCode: `+${data.countryCode === 'IN' ? '91' : '1'}`,
          city: data.cityName || '',
          region: data.regionName || ''
        };
        localStorage.setItem('zb_geo_location_cache', JSON.stringify(result));
        return result;
      }
    }
  } catch (_) {}

  // Fallback heuristic based on system locale & timezone
  const fallback = getFallbackGeo();
  localStorage.setItem('zb_geo_location_cache', JSON.stringify(fallback));
  return fallback;
};

/**
 * Initializes and auto-sets currency from IP location ONLY ONE TIME on initial setup.
 * Afterwards, keeps user's currency preference untouched unless manually changed in settings.
 */
export const autoSyncCurrencyFromIP = async (
  currentProfileId?: string,
  onCurrencyDetected?: (currency: string) => void
): Promise<string> => {
  const profileId = currentProfileId || localStorage.getItem('zb_profile_id') || '';
  
  // 1. Check if currency has already been initialized (either auto-detected once or manually set by user)
  const isInitialized = profileId ? (
    localStorage.getItem(`zb_currency_auto_initialized_${profileId}`) ||
    localStorage.getItem(`zb_manual_currency_${profileId}`) ||
    localStorage.getItem(`zb_currency_manually_set_${profileId}`)
  ) : (
    localStorage.getItem('zb_currency_auto_initialized')
  );

  const existingCurrency = profileId ? localStorage.getItem(`zb_currency_${profileId}`) : localStorage.getItem('zb_default_currency');

  // If already initialized even once or saved previously, NEVER overwrite automatically!
  if (isInitialized && existingCurrency) {
    return existingCurrency;
  }

  // 2. Perform ONLY ONE-TIME IP Location & Currency auto-detection
  const geo = await detectLocationFromIP();
  const detectedCurrency = geo.currency || 'INR';

  // Mark as auto-initialized so it NEVER runs auto-update again
  if (profileId) {
    localStorage.setItem(`zb_currency_${profileId}`, detectedCurrency);
    localStorage.setItem(`zb_currency_auto_initialized_${profileId}`, 'true');
  }
  localStorage.setItem('zb_currency_auto_initialized', 'true');
  localStorage.setItem('zb_default_currency', detectedCurrency);
  localStorage.setItem('zb_user_country_code', geo.countryCode);
  if (geo.phoneCode) {
    localStorage.setItem('zb_user_phone_code', geo.phoneCode);
  }

  // Broadcast change to all listening views
  window.dispatchEvent(new CustomEvent('currencychange', { detail: { currency: detectedCurrency } }));

  if (onCurrencyDetected) {
    onCurrencyDetected(detectedCurrency);
  }

  return detectedCurrency;
};
