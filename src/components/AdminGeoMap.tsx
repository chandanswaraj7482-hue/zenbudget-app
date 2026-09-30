import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  MapPin, 
  Users, 
  Clock, 
  Activity, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  Copy, 
  Check, 
  Laptop, 
  Smartphone, 
  Wifi, 
  Compass, 
  ExternalLink,
  ChevronRight,
  Database,
  Layers,
  Maximize2
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  type UserSessionData, 
  fetchLiveUserSessions, 
  formatDuration, 
  timeAgo,
  SUPABASE_ANALYTICS_SQL
} from '../utils/userTracker';

interface AdminGeoMapProps {
  supabaseClient: any;
  onShowToast?: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

export const AdminGeoMap: React.FC<AdminGeoMapProps> = ({ supabaseClient, onShowToast }) => {
  const [sessions, setSessions] = useState<UserSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'idle' | 'offline'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<UserSessionData | null>(null);
  const [isCopiedSql, setIsCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [tableStatus, setTableStatus] = useState<'checking' | 'connected' | 'not_found'>('checking');
  
  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Load sessions from Supabase & Local Cache
  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await fetchLiveUserSessions(supabaseClient);
      setSessions(data);

      // Check if Supabase user_sessions table exists
      try {
        const { error } = await supabaseClient.from('user_sessions').select('id').limit(1);
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
          setTableStatus('not_found');
        } else {
          setTableStatus('connected');
        }
      } catch (_) {
        setTableStatus('not_found');
      }
    } catch (e) {
      console.error('Failed to load user sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return; // Already initialized

    try {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // Center of India & World view
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false
      });

      // Add Zoom Control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Dark Matter Map Tiles (CartoDB Dark - High performance & aesthetic dark mode)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
      markersLayerRef.current = markersGroup;
    } catch (err) {
      console.error('Leaflet initialization error:', err);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Determine user status
  const getSessionStatus = (s: UserSessionData): 'online' | 'idle' | 'offline' => {
    if (!s.is_active || s.logout_time) return 'offline';
    const lastActive = new Date(s.last_active_at || s.login_time).getTime();
    const diffMins = (Date.now() - lastActive) / 60000;
    if (diffMins <= 5) return 'online';
    if (diffMins <= 30) return 'idle';
    return 'offline';
  };

  // Plot markers on the Leaflet Map whenever sessions change
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    const bounds: L.LatLngTuple[] = [];

    sessions.forEach(sess => {
      const lat = sess.latitude;
      const lng = sess.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

      bounds.push([lat, lng]);
      const status = getSessionStatus(sess);
      const isOnline = status === 'online';
      const isIdle = status === 'idle';

      const dotColor = isOnline ? '#10b981' : isIdle ? '#f59e0b' : '#64748b';
      const glowColor = isOnline ? 'rgba(16, 185, 129, 0.4)' : isIdle ? 'rgba(245, 158, 11, 0.4)' : 'transparent';
      const pulseAnimation = isOnline ? 'pulse 2s infinite' : 'none';

      // Create Custom DivIcon with glowing neon radar ring
      const customIcon = L.divIcon({
        className: 'zb-custom-geo-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
        html: `
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            ${isOnline ? `
              <div style="
                position: absolute;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: ${glowColor};
                animation: ${pulseAnimation};
              "></div>
            ` : ''}
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: ${dotColor};
              border: 2px solid #ffffff;
              box-shadow: 0 0 10px ${dotColor};
              z-index: 2;
            "></div>
          </div>
        `
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Rich dark popup card
      const popupHtml = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #f8fafc;
          padding: 8px 4px;
          min-width: 220px;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px;">
              <span>${sess.country_code ? getFlagEmoji(sess.country_code) : '🌐'}</span>
              <span>${sess.city || 'Unknown City'}, ${sess.country || 'Global'}</span>
            </div>
            <span style="
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 8px;
              font-weight: 600;
              background: ${isOnline ? 'rgba(16,185,129,0.2)' : isIdle ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.2)'};
              color: ${dotColor};
            ">${status.toUpperCase()}</span>
          </div>

          <div style="font-size: 12px; margin-bottom: 4px;">
            <strong style="color: #94a3b8;">User:</strong> <span style="font-weight: 600;">${escapeHtml(sess.user_name || 'Guest User')}</span>
          </div>
          ${sess.user_email ? `
            <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 4px;">
              ${escapeHtml(sess.user_email)}
            </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1); font-size: 11px;">
            <div>
              <span style="color: #64748b;">IP:</span> <span style="font-family: monospace; color: #38bdf8;">${sess.ip || 'Hidden'}</span>
            </div>
            <div>
              <span style="color: #64748b;">Device:</span> <span>${sess.device?.split(' ')[0] || 'Web'}</span>
            </div>
            <div>
              <span style="color: #64748b;">Duration:</span> <span>${formatDuration(sess.duration_seconds)}</span>
            </div>
            <div>
              <span style="color: #64748b;">Active:</span> <span>${timeAgo(sess.last_active_at)}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'zb-leaflet-dark-popup'
      });

      marker.on('click', () => {
        setSelectedSession(sess);
      });

      markersGroup.addLayer(marker);
    });

  }, [sessions]);

  // Focus map on a specific session coordinates
  const zoomToSession = (sess: UserSessionData) => {
    if (!leafletMapRef.current || typeof sess.latitude !== 'number' || typeof sess.longitude !== 'number') return;
    leafletMapRef.current.flyTo([sess.latitude, sess.longitude], 10, {
      duration: 1.5
    });
    setSelectedSession(sess);
  };

  // Reset map view to fit world
  const resetMapView = () => {
    if (!leafletMapRef.current) return;
    leafletMapRef.current.flyTo([20.5937, 78.9629], 3, { duration: 1 });
  };

  // Helper flag
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const copyToClipboard = (text: string, type: 'ip' | 'sql') => {
    navigator.clipboard.writeText(text);
    if (type === 'ip') {
      setCopiedIp(text);
      setTimeout(() => setCopiedIp(null), 2000);
      onShowToast?.(`IP copied: ${text}`, 'info');
    } else {
      setIsCopiedSql(true);
      setTimeout(() => setIsCopiedSql(false), 3000);
      onShowToast?.('Supabase SQL migration copied to clipboard!', 'success');
    }
  };

  // Filtered Sessions
  const filteredSessions = sessions.filter(sess => {
    const status = getSessionStatus(sess);
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (countryFilter !== 'all' && sess.country !== countryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (sess.user_name || '').toLowerCase().includes(q);
      const matchEmail = (sess.user_email || '').toLowerCase().includes(q);
      const matchCity = (sess.city || '').toLowerCase().includes(q);
      const matchCountry = (sess.country || '').toLowerCase().includes(q);
      const matchIp = (sess.ip || '').toLowerCase().includes(q);
      const matchIsp = (sess.isp || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchCity || matchCountry || matchIp || matchIsp;
    }
    return true;
  });

  // Analytics Metrics
  const onlineCount = sessions.filter(s => getSessionStatus(s) === 'online').length;
  const idleCount = sessions.filter(s => getSessionStatus(s) === 'idle').length;
  const countriesCount = new Set(sessions.map(s => s.country).filter(Boolean)).size;
  const citiesCount = new Set(sessions.map(s => s.city).filter(Boolean)).size;
  const totalDuration = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const avgDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;
  const uniqueCountries = Array.from(new Set(sessions.map(s => s.country).filter(Boolean)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* 1. Header Banner with Live Stats & SQL Helper */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 1.75rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            <Globe size={26} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Live Geo Radar & User Sessions
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
                REALTIME RADAR
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Trace real IP addresses, cities, countries, dwell duration, and login/logout activity worldwide.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Supabase SQL Migration Button */}
          <button
            onClick={() => setShowSqlModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '12px',
              background: tableStatus === 'connected' 
                ? 'rgba(16, 185, 129, 0.15)' 
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
              border: tableStatus === 'connected' 
                ? '1px solid rgba(16, 185, 129, 0.35)' 
                : '1px solid rgba(245, 158, 11, 0.5)',
              color: tableStatus === 'connected' ? '#34d399' : '#fbbf24',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            <Database size={16} />
            <span>{tableStatus === 'connected' ? 'Supabase DB Connected' : 'Supabase SQL Migration'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadSessions}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics HUD Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {/* Metric 1: Online Users */}
        <div style={{
          padding: '1.15rem',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Online Now
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981' }}>
              {onlineCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#6ee7b7' }}>active</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Sessions */}
        <div style={{
          padding: '1.15rem',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6'
          }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Tracked Sessions
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
              {sessions.length}
            </div>
          </div>
        </div>

        {/* Metric 3: Global Reach */}
        <div style={{
          padding: '1.15rem',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a855f7'
          }}>
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Reach
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
              {countriesCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#cbd5e1' }}>countries</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Avg Dwell Time */}
        <div style={{
          padding: '1.15rem',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Avg Session Time
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24' }}>
              {formatDuration(avgDuration)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive World Map Container */}
      <div style={{
        position: 'relative',
        height: '480px',
        width: '100%',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        backgroundColor: '#090d16'
      }}>
        {/* Leaflet Map Div */}
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', background: '#090d16', zIndex: 1 }} 
        />

        {/* Map Overlay Controls */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '0.4rem 0.8rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#cbd5e1',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          <span>Online ({onlineCount})</span>
          <span style={{ margin: '0 4px', color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
          <span>Idle ({idleCount})</span>
          <span style={{ margin: '0 4px', color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#64748b' }}></span>
          <span>Logged Out</span>
        </div>

        {/* Map Reset View Button */}
        <button
          onClick={resetMapView}
          title="Reset World View"
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          <Compass size={14} />
          <span>Center World</span>
        </button>
      </div>

      {/* 4. Filter & Search Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '1rem',
        borderRadius: '14px',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          backgroundColor: 'rgba(2, 6, 23, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '0.55rem 0.9rem',
          minWidth: '280px',
          flex: 1
        }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by name, email, IP, city, country, or ISP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.85rem',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {(['all', 'online', 'idle', 'offline'] as const).map(status => {
            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                  backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? '#34d399' : '#94a3b8',
                  textTransform: 'capitalize'
                }}
              >
                {status === 'all' ? 'All Sessions' : status}
              </button>
            );
          })}

          {/* Country Filter Dropdown */}
          {uniqueCountries.length > 0 && (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: 'rgba(2, 6, 23, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">🌍 All Countries ({uniqueCountries.length})</option>
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 5. Live Sessions Detailed Feed Table */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Live User Activity Stream ({filteredSessions.length})
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Showing {filteredSessions.length} of {sessions.length} sessions
          </span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{
                backgroundColor: 'rgba(2, 6, 23, 0.6)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>User & Email</th>
                <th style={{ padding: '0.85rem 1rem' }}>Location / City</th>
                <th style={{ padding: '0.85rem 1rem' }}>IP & Network</th>
                <th style={{ padding: '0.85rem 1rem' }}>Logged In</th>
                <th style={{ padding: '0.85rem 1rem' }}>Duration</th>
                <th style={{ padding: '0.85rem 1rem' }}>Device</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No user sessions match your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => {
                  const status = getSessionStatus(sess);
                  const isOnline = status === 'online';
                  const isIdle = status === 'idle';
                  const statusColor = isOnline ? '#10b981' : isIdle ? '#f59e0b' : '#64748b';
                  const statusBg = isOnline ? 'rgba(16, 185, 129, 0.15)' : isIdle ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)';

                  return (
                    <tr
                      key={sess.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: selectedSession?.id === sess.id ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: statusBg,
                          color: statusColor,
                          border: `1px solid ${statusColor}33`
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor }}></span>
                          {status.toUpperCase()}
                        </span>
                      </td>

                      {/* User & Email */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            color: '#a5b4fc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {(sess.user_name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                              {sess.user_name || 'Guest User'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {sess.user_email || 'No email registered'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location / City */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>
                            {sess.country_code ? getFlagEmoji(sess.country_code) : '🌐'}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                              {sess.city || 'Delhi'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {sess.region ? `${sess.region}, ` : ''}{sess.country || 'India'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* IP & ISP */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.78rem' }}>
                            {sess.ip || '103.xxx.xxx'}
                          </span>
                          {sess.ip && (
                            <button
                              onClick={() => copyToClipboard(sess.ip!, 'ip')}
                              title="Copy IP"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedIp === sess.ip ? '#10b981' : '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                            >
                              {copiedIp === sess.ip ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                        {sess.isp && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                            {sess.isp}
                          </div>
                        )}
                      </td>

                      {/* Logged in */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ color: '#f8fafc', fontWeight: 500 }}>
                          {timeAgo(sess.login_time)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {new Date(sess.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontWeight: 700,
                          color: '#fbbf24',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem'
                        }}>
                          {formatDuration(sess.duration_seconds)}
                        </span>
                      </td>

                      {/* Device */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          color: '#cbd5e1'
                        }}>
                          {sess.device?.toLowerCase().includes('mobile') || sess.device?.toLowerCase().includes('android') || sess.device?.toLowerCase().includes('ios') ? (
                            <Smartphone size={13} color="#94a3b8" />
                          ) : (
                            <Laptop size={13} color="#94a3b8" />
                          )}
                          {sess.device || 'Web Browser'}
                        </span>
                      </td>

                      {/* Action: Focus on Map */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {typeof sess.latitude === 'number' && typeof sess.longitude === 'number' && (
                          <button
                            onClick={() => zoomToSession(sess)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#34d399',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Compass size={13} />
                            <span>Locate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Supabase SQL Migration Modal */}
      {showSqlModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#0b0f19',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Database size={22} color="#10b981" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                    Supabase SQL Migration for User Geo-Tracking
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Copy and run this in your Supabase SQL Editor to enable persistent user tracking & coordinates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontSize: '0.8rem',
                color: '#93c5fd',
                lineHeight: 1.5
              }}>
                <strong>Kaise lagayein (Step-by-Step):</strong>
                <ol style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem' }}>
                  <li>Neeche <strong>"Copy SQL Migration"</strong> button pe click kijiye.</li>
                  <li>Apna <strong>Supabase Dashboard</strong> open kijiye 👉 <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>supabase.com/dashboard</a>.</li>
                  <li>Left sidebar me <strong>"SQL Editor"</strong> pe click kijiye aur <strong>"New Query"</strong> banaiye.</li>
                  <li>Paste karke green <strong>"RUN"</strong> button dabaiye! (1 second me table ban jayega).</li>
                </ol>
              </div>

              {/* Code Box */}
              <div style={{ position: 'relative' }}>
                <pre style={{
                  margin: 0,
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: '#020617',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  lineHeight: 1.4
                }}>
                  {SUPABASE_ANALYTICS_SQL}
                </pre>
                <button
                  onClick={() => copyToClipboard(SUPABASE_ANALYTICS_SQL, 'sql')}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: isCopiedSql ? '#10b981' : 'rgba(255, 255, 255, 0.12)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isCopiedSql ? <Check size={13} /> : <Copy size={13} />}
                  <span>{isCopiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowSqlModal(false)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Close
              </button>
              <button
                onClick={() => copyToClipboard(SUPABASE_ANALYTICS_SQL, 'sql')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                {isCopiedSql ? <Check size={16} /> : <Copy size={16} />}
                <span>{isCopiedSql ? 'SQL Copied to Clipboard!' : 'Copy SQL Migration'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple HTML escaping helper for Leaflet popups
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
