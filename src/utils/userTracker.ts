import { supabase } from '../supabaseClient';

export interface GeoLocation {
  country: string;
  country_code: string;
  city: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  flag: string;
  ip?: string;
  isp?: string;
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
  region?: string;
  latitude?: number;
  longitude?: number;
  ip?: string;
  isp?: string;
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
  region?: string;
  latitude?: number;
  longitude?: number;
  device: string;
  created_at?: string;
}

// Fallback timezone to Country & Coordinates mapping
const TIMEZONE_TO_COUNTRY: Record<string, { country: string; code: string; flag: string; city: string; lat: number; lng: number }> = {
  'Asia/Kolkata': { country: 'India', code: 'IN', flag: '🇮🇳', city: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  'Asia/Calcutta': { country: 'India', code: 'IN', flag: '🇮🇳', city: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  'America/New_York': { country: 'United States', code: 'US', flag: '🇺🇸', city: 'New York', lat: 40.7128, lng: -74.0060 },
  'America/Los_Angeles': { country: 'United States', code: 'US', flag: '🇺🇸', city: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  'America/Chicago': { country: 'United States', code: 'US', flag: '🇺🇸', city: 'Chicago', lat: 41.8781, lng: -87.6298 },
  'America/Denver': { country: 'United States', code: 'US', flag: '🇺🇸', city: 'Denver', lat: 39.7392, lng: -104.9903 },
  'Europe/London': { country: 'United Kingdom', code: 'GB', flag: '🇬🇧', city: 'London', lat: 51.5074, lng: -0.1278 },
  'America/Toronto': { country: 'Canada', code: 'CA', flag: '🇨🇦', city: 'Toronto', lat: 43.6532, lng: -79.3832 },
  'America/Vancouver': { country: 'Canada', code: 'CA', flag: '🇨🇦', city: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  'Australia/Sydney': { country: 'Australia', code: 'AU', flag: '🇦🇺', city: 'Sydney', lat: -33.8688, lng: 151.2093 },
  'Australia/Melbourne': { country: 'Australia', code: 'AU', flag: '🇦🇺', city: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  'Asia/Dubai': { country: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', city: 'Dubai', lat: 25.2048, lng: 55.2708 },
  'Asia/Singapore': { country: 'Singapore', code: 'SG', flag: '🇸🇬', city: 'Singapore', lat: 1.3521, lng: 103.8198 },
  'Asia/Tokyo': { country: 'Japan', code: 'JP', flag: '🇯🇵', city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
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

    // Fallback based on timezone immediately so we always have a country and coordinates
    let fallbackCountry = 'India';
    let fallbackCode = 'IN';
    let fallbackFlag = '🇮🇳';
    let fallbackCity = 'New Delhi';
    let fallbackLat = 28.6139;
    let fallbackLng = 77.2090;

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TIMEZONE_TO_COUNTRY[tz]) {
        fallbackCountry = TIMEZONE_TO_COUNTRY[tz].country;
        fallbackCode = TIMEZONE_TO_COUNTRY[tz].code;
        fallbackFlag = TIMEZONE_TO_COUNTRY[tz].flag;
        fallbackCity = TIMEZONE_TO_COUNTRY[tz].city || (tz.split('/')[1]?.replace(/_/g, ' ') || 'City');
        fallbackLat = TIMEZONE_TO_COUNTRY[tz].lat || 28.6139;
        fallbackLng = TIMEZONE_TO_COUNTRY[tz].lng || 77.2090;
      }
    } catch (_) {}

    const defaultGeo: GeoLocation = {
      country: fallbackCountry,
      country_code: fallbackCode,
      city: fallbackCity,
      region: fallbackCountry,
      latitude: fallbackLat,
      longitude: fallbackLng,
      flag: fallbackFlag,
      isp: 'Broadband / Cellular',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
    };

    // Try fetching real IP & Geo asynchronously with short 3s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Fast, free and returns latitude + longitude
      const res = await fetch('https://ipwho.is/?fields=country,country_code,city,region,latitude,longitude,ip,timezone,connection', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && (data.country || data.city)) {
          const resolved: GeoLocation = {
            country: data.country || fallbackCountry,
            country_code: data.country_code || fallbackCode,
            city: data.city || fallbackCity,
            region: data.region || fallbackCountry,
            latitude: typeof data.latitude === 'number' ? data.latitude : fallbackLat,
            longitude: typeof data.longitude === 'number' ? data.longitude : fallbackLng,
            flag: getCountryFlag(data.country_code || fallbackCode),
            ip: data.ip,
            isp: data.connection?.isp || data.connection?.org || 'Internet Provider',
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

  public async recordLogin(userId: string, userName: string, userEmail?: string) {
    this.currentUserId = userId || this.currentUserId;
    this.currentUserName = userName || this.currentUserName;
    this.currentUserEmail = userEmail || this.currentUserEmail;

    // CRITICAL: Await real IP-based geo resolution BEFORE saving to Supabase
    // This ensures we get the user's actual city/country from their IP, not the fallback
    let geo: GeoLocation;
    try {
      // Clear any stale cached geo so we get a fresh lookup on each login
      this.cachedGeo = null;
      try { localStorage.removeItem('zb_cached_geo'); } catch (_) {}
      geo = await this.resolveGeo();
    } catch (_) {
      geo = this.cachedGeo || {
        country: 'India',
        country_code: 'IN',
        city: 'Unknown',
        region: 'Unknown',
        latitude: 20.5937,
        longitude: 78.9629,
        flag: '🇮🇳'
      };
    }

    const loginTimestamp = new Date().toISOString();
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
      region: geo.region,
      latitude: geo.latitude,
      longitude: geo.longitude,
      ip: geo.ip,
      isp: geo.isp,
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
      localStorage.setItem('zb_admin_sessions_cache', JSON.stringify(filtered.slice(0, 100)));
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
          region: geo.region,
          latitude: geo.latitude,
          longitude: geo.longitude,
          last_ip: geo.ip,
          isp: geo.isp,
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

  public recordRating(stars: number, feedback: string) {
    try {
      const stored = localStorage.getItem('zb_user_ratings');
      const ratings = stored ? JSON.parse(stored) : [];
      ratings.unshift({
        stars,
        feedback,
        user_name: this.currentUserName,
        user_email: this.currentUserEmail,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('zb_user_ratings', JSON.stringify(ratings.slice(0, 50)));
    } catch (_) {}
  }

  public getSessionId(): string {
    return this.currentSessionId;
  }

  public getGeo(): GeoLocation | null {
    return this.cachedGeo;
  }
}

export const userTracker = new UserTrackerService();

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '< 1m';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs > 0 ? secs + 's' : ''}`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins > 0 ? remMins + 'm' : ''}`;
}

export function timeAgo(isoString?: string): string {
  if (!isoString) return 'Never / N/A';
  try {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 15) return 'Just now';
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (_) {
    return 'Recently';
  }
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'Never / N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (_) {
    return 'N/A';
  }
}

export type InactivityCategory = 'online' | 'today' | '1-3days' | '4-7days' | 'dormant' | 'never';

export interface InactivityInfo {
  category: InactivityCategory;
  text: string;
  badgeLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  days: number;
  hours: number;
  minutes: number;
}

export function getInactivityInfo(lastLoginIso?: string | null, isActiveSession?: boolean, logoutIso?: string | null): InactivityInfo {
  if (isActiveSession && !logoutIso) {
    return {
      category: 'online',
      text: 'Currently Online',
      badgeLabel: 'ONLINE NOW',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      days: 0,
      hours: 0,
      minutes: 0
    };
  }

  if (!lastLoginIso) {
    return {
      category: 'never',
      text: 'Never logged in',
      badgeLabel: 'NEVER ACTIVE',
      color: '#94a3b8',
      bgColor: 'rgba(148, 163, 184, 0.12)',
      borderColor: 'rgba(148, 163, 184, 0.3)',
      days: 999,
      hours: 0,
      minutes: 0
    };
  }

  const loginTime = new Date(lastLoginIso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - loginTime);
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMins / 60);
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  const remMins = totalMins % 60;

  if (totalMins <= 5 && isActiveSession) {
    return {
      category: 'online',
      text: 'Active just now',
      badgeLabel: 'ONLINE NOW',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      days: 0,
      hours: 0,
      minutes: totalMins
    };
  }

  if (days < 1) {
    const text = totalHours > 0 ? `${totalHours}h ${remMins}m ago` : `${totalMins}m ago`;
    return {
      category: 'today',
      text: `Active today (${text})`,
      badgeLabel: 'ACTIVE TODAY',
      color: '#38bdf8',
      bgColor: 'rgba(56, 189, 248, 0.15)',
      borderColor: 'rgba(56, 189, 248, 0.4)',
      days: 0,
      hours: totalHours,
      minutes: remMins
    };
  }

  if (days <= 3) {
    return {
      category: '1-3days',
      text: `Inactive for ${days}d ${remHours}h`,
      badgeLabel: `${days}d INACTIVE`,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      days,
      hours: remHours,
      minutes: remMins
    };
  }

  if (days <= 7) {
    return {
      category: '4-7days',
      text: `Inactive for ${days} days`,
      badgeLabel: `${days}d INACTIVE`,
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.15)',
      borderColor: 'rgba(249, 115, 22, 0.4)',
      days,
      hours: remHours,
      minutes: remMins
    };
  }

  return {
    category: 'dormant',
    text: `Inactive for ${days} days (Dormant)`,
    badgeLabel: `${days}d DORMANT`,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    days,
    hours: remHours,
    minutes: remMins
  };
}

export interface UnifiedUserRecord {
  id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  subscription_tier?: string;
  login_time: string;
  logout_time?: string | null;
  last_active_at: string;
  duration_seconds: number;
  country: string;
  country_code: string;
  city: string;
  region?: string;
  latitude: number;
  longitude: number;
  ip?: string;
  isp?: string;
  device: string;
  is_active: boolean;
  is_online: boolean;
  inactivity: InactivityInfo;
  source: 'session' | 'profile' | 'seed';
}

export async function fetchUnifiedUserActivity(supabaseClient: any = supabase): Promise<UnifiedUserRecord[]> {
  const unifiedMap = new Map<string, UnifiedUserRecord>();

  // 1. Fetch live user sessions from Supabase
  let sessions: UserSessionData[] = [];
  try {
    const { data } = await supabaseClient
      .from('user_sessions')
      .select('*')
      .order('login_time', { ascending: false })
      .limit(200);
    if (data && data.length > 0) {
      sessions = data.filter((s: any) => s && s.id && !s.id.startsWith('seed_'));
    }
  } catch (_) {}

  // Merge any local sessions (filtering out seed dummies)
  try {
    const rawLocal = localStorage.getItem('zb_admin_sessions_cache');
    if (rawLocal) {
      const parsed: UserSessionData[] = JSON.parse(rawLocal);
      if (Array.isArray(parsed)) {
        const cleanLocal = parsed.filter(s => s && s.id && !s.id.startsWith('seed_'));
        sessions = mergeSessions(sessions, cleanLocal);
      }
    }
  } catch (_) {}

  // 2. Fetch all registered profiles from Supabase
  let profiles: any[] = [];
  try {
    const { data } = await supabaseClient
      .from('profiles')
      .select('*')
      .limit(200);
    if (data && data.length > 0) profiles = data;
  } catch (_) {}

  // 3. Process sessions first
  sessions.forEach(s => {
    const key = (s.user_email || s.user_id || s.user_name || s.id).toLowerCase();
    const lastActive = s.last_active_at ? new Date(s.last_active_at).getTime() : new Date(s.login_time).getTime();
    const isOnline = (s.is_active && !s.logout_time && (Date.now() - lastActive < 5 * 60 * 1000));
    const inactivity = getInactivityInfo(s.login_time, isOnline, s.logout_time);

    unifiedMap.set(key, {
      id: s.id,
      user_id: s.user_id,
      user_name: s.user_name || 'Guest User',
      user_email: s.user_email || '',
      subscription_tier: 'trial',
      login_time: s.login_time,
      logout_time: s.logout_time,
      last_active_at: s.last_active_at || s.login_time,
      duration_seconds: s.duration_seconds || 0,
      country: s.country || 'India',
      country_code: s.country_code || 'IN',
      city: s.city || 'Delhi',
      region: s.region || '',
      latitude: typeof s.latitude === 'number' ? s.latitude : 28.6139,
      longitude: typeof s.longitude === 'number' ? s.longitude : 77.2090,
      ip: s.ip || '103.xxx.xxx',
      isp: s.isp || 'Broadband ISP',
      device: s.device || 'Web Browser',
      is_active: s.is_active,
      is_online: isOnline,
      inactivity,
      source: 'session'
    });
  });

  // 4. Enrich/Merge with profiles
  profiles.forEach(p => {
    const key = (p.email || p.id || p.name || '').toLowerCase();
    const existing = unifiedMap.get(key);

    const country = p.country || existing?.country || 'India';
    const countryCode = p.country_code || existing?.country_code || 'IN';
    const city = p.city || existing?.city || 'Delhi';
    const lat = typeof p.latitude === 'number' ? p.latitude : (existing?.latitude || 28.6139);
    const lng = typeof p.longitude === 'number' ? p.longitude : (existing?.longitude || 77.2090);
    const loginTime = p.last_login || existing?.login_time || p.updated_at || new Date().toISOString();
    const logoutTime = p.last_logout || existing?.logout_time;
    const isOnline = existing ? existing.is_online : false;
    const inactivity = getInactivityInfo(loginTime, isOnline, logoutTime);

    unifiedMap.set(key, {
      id: existing ? existing.id : p.id,
      user_id: p.id,
      user_name: p.name || existing?.user_name || 'Registered User',
      user_email: p.email || existing?.user_email || '',
      subscription_tier: p.subscription_tier || 'trial',
      login_time: loginTime,
      logout_time: logoutTime,
      last_active_at: existing?.last_active_at || loginTime,
      duration_seconds: p.total_time_spent_seconds || existing?.duration_seconds || 0,
      country,
      country_code: countryCode,
      city,
      region: p.region || existing?.region || '',
      latitude: lat,
      longitude: lng,
      ip: p.last_ip || existing?.ip || '103.xxx.xxx',
      isp: p.isp || existing?.isp || 'Broadband ISP',
      device: existing?.device || 'Mobile App',
      is_active: existing ? existing.is_active : false,
      is_online: isOnline,
      inactivity,
      source: existing ? existing.source : 'profile'
    });
  });

  const result = Array.from(unifiedMap.values());
  // Sort primarily by login time desc
  return result.sort((a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime());
}

function mergeSessions(primary: UserSessionData[], secondary: UserSessionData[]): UserSessionData[] {
  const map = new Map<string, UserSessionData>();
  primary.forEach(s => map.set(s.id, s));
  secondary.forEach(s => {
    if (!map.has(s.id)) map.set(s.id, s);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime()
  );
}

export const SUPABASE_ANALYTICS_SQL = `-- 🚀 ZenBudget AI: User Location, Sessions, Page Dwell-Time & Reviews Migration
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES Table (Country, City, Coordinates, Login/Logout timestamps)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'IN';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Delhi';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_ip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS isp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_logout TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_time_spent_seconds INTEGER DEFAULT 0;

-- 2. USER SESSIONS Table (Tracks Kab Login, Kab Logout, Kitna Time Spend, Coordinates & IP)
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
    region TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    ip TEXT,
    isp TEXT,
    device TEXT DEFAULT 'Web Browser',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS isp TEXT;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON public.user_sessions(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_country ON public.user_sessions(country);
CREATE INDEX IF NOT EXISTS idx_user_sessions_city ON public.user_sessions(city);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active_at DESC);

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
    latitude NUMERIC,
    longitude NUMERIC,
    device TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_page_views_page_name ON public.user_page_views(page_name);
CREATE INDEX IF NOT EXISTS idx_user_page_views_created_at ON public.user_page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_page_views_session_id ON public.user_page_views(session_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access user_sessions" ON public.user_sessions;
CREATE POLICY "Public full access user_sessions" ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access user_page_views" ON public.user_page_views;
CREATE POLICY "Public full access user_page_views" ON public.user_page_views FOR ALL USING (true) WITH CHECK (true);
`;
