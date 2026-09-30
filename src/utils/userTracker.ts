import { supabase } from '../supabaseClient';

export interface GeoLocation {
  country: string;
  country_code: string;
  city: string;
  flag: string;
  ip?: string;
  timezone?: string;
}

export interface UserSessionData {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  login_time: string;
  logout_time?: string | null;
  duration_seconds: number;
  last_active_at: string;
  country: string;
  country_code: string;
  city: string;
  ip?: string;
  device: string;
  is_active: boolean;
  created_at: string;
}

export interface PageViewData {
  id?: string;
  session_id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  page_name: string;
  path: string;
  duration_seconds: number;
  country: string;
  city: string;
  device: string;
  created_at?: string;
}

// Fallback timezone to Country mapping
const TIMEZONE_TO_COUNTRY: Record<string, { country: string; code: string; flag: string }> = {
  'Asia/Kolkata': { country: 'India', code: 'IN', flag: '🇮🇳' },
  'Asia/Calcutta': { country: 'India', code: 'IN', flag: '🇮🇳' },
  'America/New_York': { country: 'United States', code: 'US', flag: '🇺🇸' },
  'America/Los_Angeles': { country: 'United States', code: 'US', flag: '🇺🇸' },
  'America/Chicago': { country: 'United States', code: 'US', flag: '🇺🇸' },
  'America/Denver': { country: 'United States', code: 'US', flag: '🇺🇸' },
  'Europe/London': { country: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  'America/Toronto': { country: 'Canada', code: 'CA', flag: '🇨🇦' },
  'America/Vancouver': { country: 'Canada', code: 'CA', flag: '🇨🇦' },
  'Australia/Sydney': { country: 'Australia', code: 'AU', flag: '🇦🇺' },
  'Australia/Melbourne': { country: 'Australia', code: 'AU', flag: '🇦🇺' },
  'Asia/Dubai': { country: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  'Asia/Singapore': { country: 'Singapore', code: 'SG', flag: '🇸🇬' },
  'Asia/Tokyo': { country: 'Japan', code: 'JP', flag: '🇯🇵' },
  'Europe/Berlin': { country: 'Germany', code: 'DE', flag: '🇩🇪' },
  'Europe/Paris': { country: 'France', code: 'FR', flag: '🇫🇷' },
  'Europe/Amsterdam': { country: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  'Asia/Dhaka': { country: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
  'Asia/Karachi': { country: 'Pakistan', code: 'PK', flag: '🇵🇰' },
  'Asia/Kathmandu': { country: 'Nepal', code: 'NP', flag: '🇳🇵' },
  'Asia/Colombo': { country: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
};

function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function detectDevice(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android Mobile';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Mobile';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac Desktop';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux PC';
  return 'Desktop / Web';
}

class UserTrackerService {
  private currentSessionId: string = '';
  private currentUserId: string = '';
  private currentUserName: string = '';
  private currentUserEmail: string = '';
  private sessionStartTime: number = Date.now();
  private currentPageName: string = '';
  private currentPageStartTime: number = Date.now();
  private cachedGeo: GeoLocation | null = null;
  private heartbeatInterval: any = null;

  constructor() {
    this.initSession();
    this.resolveGeo();
    this.setupListeners();
  }

  private initSession() {
    let sessId = sessionStorage.getItem('zb_session_id');
    if (!sessId) {
      sessId = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('zb_session_id', sessId);
    }
    this.currentSessionId = sessId;

    // Load user info from localStorage if available
    this.currentUserId = localStorage.getItem('zb_profile_id') || 'guest';
    this.currentUserName = localStorage.getItem('zb_user_name') || 'Guest Visitor';
    this.currentUserEmail = localStorage.getItem('zb_user_email') || '';
  }

  public async resolveGeo(): Promise<GeoLocation> {
    if (this.cachedGeo) return this.cachedGeo;

    // Check cached in localStorage (< 24 hrs old)
    try {
      const cached = localStorage.getItem('zb_cached_geo');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.country && (Date.now() - (parsed.cachedAt || 0) < 86400000)) {
          this.cachedGeo = parsed;
          return parsed;
        }
      }
    } catch (_) {}

    // Fallback based on timezone immediately so we always have a country
    let fallbackCountry = 'India';
    let fallbackCode = 'IN';
    let fallbackFlag = '🇮🇳';
    let fallbackCity = 'New Delhi';

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TIMEZONE_TO_COUNTRY[tz]) {
        fallbackCountry = TIMEZONE_TO_COUNTRY[tz].country;
        fallbackCode = TIMEZONE_TO_COUNTRY[tz].code;
        fallbackFlag = TIMEZONE_TO_COUNTRY[tz].flag;
        fallbackCity = tz.split('/')[1]?.replace(/_/g, ' ') || 'Unknown City';
      }
    } catch (_) {}

    const defaultGeo: GeoLocation = {
      country: fallbackCountry,
      country_code: fallbackCode,
      city: fallbackCity,
      flag: fallbackFlag,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
    };

    // Try fetching real IP & Geo asynchronously with short 3s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Free and fast API
      const res = await fetch('https://ipwho.is/?fields=country,country_code,city,ip,timezone', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.country) {
          const resolved: GeoLocation = {
            country: data.country || fallbackCountry,
            country_code: data.country_code || fallbackCode,
            city: data.city || fallbackCity,
            flag: getCountryFlag(data.country_code || fallbackCode),
            ip: data.ip,
            timezone: data.timezone?.id || defaultGeo.timezone
          };
          this.cachedGeo = resolved;
          localStorage.setItem('zb_cached_geo', JSON.stringify({ ...resolved, cachedAt: Date.now() }));
          return resolved;
        }
      }
    } catch (_) {
      // Ignore API errors, use timezone fallback
    }

    this.cachedGeo = defaultGeo;
    return defaultGeo;
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    // Heartbeat every 45s
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
    }, 45000);

    // Page unload / tab close
    window.addEventListener('beforeunload', () => {
      this.flushCurrentPageDuration();
      this.recordSessionHeartbeat(false);
    });

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushCurrentPageDuration();
        this.recordSessionHeartbeat(false);
      } else if (document.visibilityState === 'visible') {
        this.currentPageStartTime = Date.now();
        this.recordSessionHeartbeat(true);
      }
    });
  }

  public recordLogin(userId: string, userName: string, userEmail?: string) {
    this.currentUserId = userId || this.currentUserId;
    this.currentUserName = userName || this.currentUserName;
    this.currentUserEmail = userEmail || this.currentUserEmail;

    const loginTimestamp = new Date().toISOString();
    const geo = this.cachedGeo || {
      country: 'India',
      country_code: 'IN',
      city: 'Delhi',
      flag: '🇮🇳'
    };
    const device = detectDevice();

    const sessionPayload: UserSessionData = {
      id: this.currentSessionId,
      user_id: this.currentUserId,
      user_name: this.currentUserName,
      user_email: this.currentUserEmail,
      login_time: loginTimestamp,
      logout_time: null,
      duration_seconds: 0,
      last_active_at: loginTimestamp,
      country: geo.country,
      country_code: geo.country_code,
      city: geo.city,
      ip: geo.ip,
      device: device,
      is_active: true,
      created_at: loginTimestamp
    };

    // Store in LocalStorage cache for immediate Admin display
    try {
      const existingRaw = localStorage.getItem('zb_admin_sessions_cache');
      const sessions: UserSessionData[] = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = sessions.filter(s => s.id !== this.currentSessionId);
      filtered.unshift(sessionPayload);
      localStorage.setItem('zb_admin_sessions_cache', JSON.stringify(filtered.slice(0, 50)));
    } catch (_) {}

    // Async push to Supabase
    this.syncSessionToSupabase(sessionPayload);

    // Also update Profile location & last_login if user is authenticated
    if (userId && userId !== 'guest' && userId !== 'local') {
      supabase
        .from('profiles')
        .update({
          country: geo.country,
          country_code: geo.country_code,
          city: geo.city,
          last_ip: geo.ip,
          last_login: loginTimestamp,
          updated_at: loginTimestamp
        })
        .eq('id', userId)
        .then(() => {})
        .catch(() => {});
    }
  }

  public recordLogout() {
    const logoutTimestamp = new Date().toISOString();
    const durationSeconds = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 1000));

    this.flushCurrentPageDuration();

    // Update LocalStorage cache
    try {
      const existingRaw = localStorage.getItem('zb_admin_sessions_cache');
      if (existingRaw) {
        const sessions: UserSessionData[] = JSON.parse(existingRaw);
        const idx = sessions.findIndex(s => s.id === this.currentSessionId);
        if (idx !== -1) {
          sessions[idx].logout_time = logoutTimestamp;
          sessions[idx].is_active = false;
          sessions[idx].duration_seconds = durationSeconds;
          sessions[idx].last_active_at = logoutTimestamp;
          localStorage.setItem('zb_admin_sessions_cache', JSON.stringify(sessions));
        }
      }
    } catch (_) {}

    // Update in Supabase
    supabase
      .from('user_sessions')
      .update({
        logout_time: logoutTimestamp,
        is_active: false,
        duration_seconds: durationSeconds,
        last_active_at: logoutTimestamp
      })
      .eq('id', this.currentSessionId)
      .then(() => {})
      .catch(() => {});

    // Update Profile last_logout
    if (this.currentUserId && this.currentUserId !== 'guest' && this.currentUserId !== 'local') {
      supabase
        .from('profiles')
        .update({
          last_logout: logoutTimestamp
        })
        .eq('id', this.currentUserId)
        .then(() => {})
        .catch(() => {});
    }
  }

  public trackPageView(pageName: string, path: string = window.location.pathname) {
    if (!pageName) return;

    // 1. Flush previous page duration
    this.flushCurrentPageDuration();

    // 2. Start timer for new page
    this.currentPageName = pageName;
    this.currentPageStartTime = Date.now();

    // Initial entry registration in local cache
    this.recordPageViewLocal(pageName, path, 0);
  }

  private flushCurrentPageDuration() {
    if (!this.currentPageName) return;

    const durationSeconds = Math.max(1, Math.round((Date.now() - this.currentPageStartTime) / 1000));
    const pageName = this.currentPageName;
    const path = window.location.pathname + window.location.hash;

    // Update in local cache
    this.recordPageViewLocal(pageName, path, durationSeconds);

    // Sync to Supabase
    const geo = this.cachedGeo || { country: 'India', city: 'Delhi' };
    const device = detectDevice();

    const pvPayload: PageViewData = {
      session_id: this.currentSessionId,
      user_id: this.currentUserId,
      user_name: this.currentUserName,
      user_email: this.currentUserEmail,
      page_name: pageName,
      path: path,
      duration_seconds: durationSeconds,
      country: geo.country,
      city: geo.city,
      device: device,
      created_at: new Date().toISOString()
    };

    supabase
      .from('user_page_views')
      .insert([pvPayload])
      .then(() => {})
      .catch(() => {});
  }

  private recordPageViewLocal(pageName: string, path: string, durationSeconds: number) {
    try {
      const key = 'zb_admin_page_views_cache';
      const raw = localStorage.getItem(key);
      const list: PageViewData[] = raw ? JSON.parse(raw) : [];

      const geo = this.cachedGeo || { country: 'India', city: 'Delhi' };
      const device = detectDevice();

      // Find or insert
      const item: PageViewData = {
        session_id: this.currentSessionId,
        user_id: this.currentUserId,
        user_name: this.currentUserName,
        user_email: this.currentUserEmail,
        page_name: pageName,
        path: path,
        duration_seconds: durationSeconds,
        country: geo.country,
        city: geo.city,
        device: device,
        created_at: new Date().toISOString()
      };

      list.unshift(item);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 100)));
    } catch (_) {}
  }

  private heartbeat() {
    const activeSeconds = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 1000));
    this.recordSessionHeartbeat(true, activeSeconds);
  }

  private recordSessionHeartbeat(isActive: boolean, durationSeconds?: number) {
    const nowIso = new Date().toISOString();
    const updateData: any = {
      last_active_at: nowIso,
      is_active: isActive
    };
    if (durationSeconds) {
      updateData.duration_seconds = durationSeconds;
    }

    supabase
      .from('user_sessions')
      .update(updateData)
      .eq('id', this.currentSessionId)
      .then(() => {})
      .catch(() => {});
  }

  private syncSessionToSupabase(session: UserSessionData) {
    supabase
      .from('user_sessions')
      .upsert([session], { onConflict: 'id' })
      .then(({ error }) => {
        if (error) {
          console.warn('Session sync warning (SQL migration maybe pending):', error.message);
        }
      })
      .catch(() => {});
  }

  public getSessionId(): string {
    return this.currentSessionId;
  }

  public getGeo(): GeoLocation | null {
    return this.cachedGeo;
  }
}

export const userTracker = new UserTrackerService();

export const SUPABASE_ANALYTICS_SQL = `-- 🚀 ZenBudget AI: User Location, Sessions, Page Dwell-Time & Reviews Migration
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES Table (Country, City, Login/Logout timestamps)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'IN';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Delhi';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_ip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_logout TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_time_spent_seconds INTEGER DEFAULT 0;

-- 2. USER SESSIONS Table (Track Kab Login, Kab Logout, Kitna Time Spend)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    logout_time TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    country TEXT DEFAULT 'India',
    country_code TEXT DEFAULT 'IN',
    city TEXT DEFAULT 'Delhi',
    ip TEXT,
    device TEXT DEFAULT 'Web Browser',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON public.user_sessions(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_country ON public.user_sessions(country);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

-- 3. USER PAGE VIEWS Table (Kon se Page pe Kitna Time Spend Kiya)
CREATE TABLE IF NOT EXISTS public.user_page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    page_name TEXT NOT NULL,
    path TEXT,
    duration_seconds INTEGER DEFAULT 0,
    country TEXT DEFAULT 'India',
    city TEXT DEFAULT 'Delhi',
    device TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_page_views_page_name ON public.user_page_views(page_name);
CREATE INDEX IF NOT EXISTS idx_user_page_views_created_at ON public.user_page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_page_views_session_id ON public.user_page_views(session_id);

-- 4. APP RATINGS & REVIEWS Table
CREATE TABLE IF NOT EXISTS public.app_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    rating INTEGER DEFAULT 5,
    rating_stars INTEGER DEFAULT 5,
    feedback TEXT,
    country TEXT DEFAULT 'India',
    city TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_ratings ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.app_ratings ADD COLUMN IF NOT EXISTS rating_stars INTEGER DEFAULT 5;
ALTER TABLE public.app_ratings ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;
ALTER TABLE public.app_ratings ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.app_ratings ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.app_ratings ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_app_ratings_created_at ON public.app_ratings(created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access user_sessions" ON public.user_sessions;
CREATE POLICY "Public full access user_sessions" ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access user_page_views" ON public.user_page_views;
CREATE POLICY "Public full access user_page_views" ON public.user_page_views FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access app_ratings" ON public.app_ratings;
CREATE POLICY "Public full access app_ratings" ON public.app_ratings FOR ALL USING (true) WITH CHECK (true);
`;
