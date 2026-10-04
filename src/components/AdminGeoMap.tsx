import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  MapPin,
  Users,
  Clock,
  Activity,
  Search,
  RefreshCw,
  Copy,
  Check,
  Laptop,
  Smartphone,
  Compass,
  Database,
  Maximize2,
  Minimize2,
  Download,
  AlertTriangle,
  Zap,
  Calendar,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Crown,
  Sparkles,
  Info
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  type UnifiedUserRecord,
  type InactivityCategory,
  fetchUnifiedUserActivity,
  formatDuration,
  timeAgo,
  formatDateTime,
  SUPABASE_ANALYTICS_SQL
} from '../utils/userTracker';

interface AdminGeoMapProps {
  supabaseClient: any;
  onShowToast?: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

export const AdminGeoMap: React.FC<AdminGeoMapProps> = ({ supabaseClient, onShowToast }) => {
  const [users, setUsers] = useState<UnifiedUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inactivityFilter, setInactivityFilter] = useState<'all' | 'online' | 'today' | '1-3days' | '4-7days' | 'dormant'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent_login' | 'most_inactive' | 'duration' | 'name' | 'country'>('recent_login');
  const [selectedUser, setSelectedUser] = useState<UnifiedUserRecord | null>(null);
  const [isCopiedSql, setIsCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [tableStatus, setTableStatus] = useState<'checking' | 'connected' | 'not_found'>('checking');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [activeMapRegion, setActiveMapRegion] = useState<'world' | 'india' | 'us' | 'europe' | 'middle_east' | 'asia'>('world');

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Load unified activity data from Supabase & Profiles & Sessions
  const loadUserData = async () => {
    setLoading(true);
    try {
      const data = await fetchUnifiedUserActivity(supabaseClient);
      setUsers(data);

      // Check if user_sessions table exists in Supabase
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
      console.error('Failed to load user tracking data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    const interval = setInterval(loadUserData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [21.5, 78.9], // Balanced India/World view
        zoom: 4,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false
      });

      // Add Zoom Control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // ESRI Dark Gray Canvas Base (Sleek dark theme, zero watermarks, 100% free)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, OpenStreetMap',
        maxZoom: 16
      }).addTo(map);

      // ESRI Dark Gray Reference / Labels layer (crisp city labels & borders)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 16
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

  // Trigger leaflet map resize when expanded / collapsed
  useEffect(() => {
    if (leafletMapRef.current) {
      setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 300);
    }
  }, [isMapExpanded]);

  // Flag helper
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Plot custom markers on Leaflet whenever users or filter change
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    users.forEach(u => {
      const lat = u.latitude;
      const lng = u.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

      const isOnline = u.is_online;
      const category = u.inactivity.category;

      let markerColor = '#10b981'; // green for online
      let glowColor = 'rgba(16, 185, 129, 0.45)';
      let pulseAnim = 'radar-pulse 2s infinite ease-out';

      if (category === 'online') {
        markerColor = '#10b981';
        glowColor = 'rgba(16, 185, 129, 0.55)';
      } else if (category === 'today') {
        markerColor = '#38bdf8'; // cyan
        glowColor = 'rgba(56, 189, 248, 0.4)';
        pulseAnim = 'none';
      } else if (category === '1-3days') {
        markerColor = '#f59e0b'; // amber
        glowColor = 'rgba(245, 158, 11, 0.4)';
        pulseAnim = 'none';
      } else if (category === '4-7days') {
        markerColor = '#f97316'; // orange
        glowColor = 'rgba(249, 115, 22, 0.4)';
        pulseAnim = 'none';
      } else {
        // Dormant
        markerColor = '#ef4444'; // red
        glowColor = 'rgba(239, 68, 68, 0.35)';
        pulseAnim = 'none';
      }

      const customIcon = L.divIcon({
        className: 'zb-user-geo-radar-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            ${isOnline ? `
              <div style="
                position: absolute;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${glowColor};
                animation: ${pulseAnim};
              "></div>
            ` : ''}
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: ${markerColor};
              border: 2px solid #ffffff;
              box-shadow: 0 0 12px ${markerColor};
              z-index: 2;
            "></div>
          </div>
        `
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupHtml = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #f8fafc;
          padding: 8px 4px;
          min-width: 250px;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px;">
              <span>${getFlagEmoji(u.country_code)}</span>
              <span>${escapeHtml(u.city || 'Delhi')}, ${escapeHtml(u.country || 'India')}</span>
            </div>
            <span style="
              font-size: 9px;
              padding: 2px 7px;
              border-radius: 999px;
              font-weight: 800;
              letter-spacing: 0.04em;
              background: ${u.inactivity.bgColor};
              color: ${u.inactivity.color};
              border: 1px solid ${u.inactivity.borderColor};
            ">${u.inactivity.badgeLabel}</span>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #f8fafc; margin-bottom: 2px;">
            ${escapeHtml(u.user_name || 'Guest User')}
          </div>
          ${u.user_email ? `
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
              ${escapeHtml(u.user_email)}
            </div>
          ` : ''}

          <div style="background: rgba(2, 6, 23, 0.7); border-radius: 8px; padding: 6px 8px; font-size: 11px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.06);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #94a3b8;">Kab Login Kiya:</span>
              <span style="font-weight: 600; color: #e2e8f0;">${timeAgo(u.login_time)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #94a3b8;">Kitne Time Se:</span>
              <span style="font-weight: 700; color: ${u.inactivity.color};">${u.inactivity.text}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #94a3b8;">Kab Logout Kiya:</span>
              <span style="color: ${u.logout_time ? '#e2e8f0' : '#34d399'}; font-weight: 600;">
                ${u.logout_time ? timeAgo(u.logout_time) : 'Active Now (In Session)'}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Session Duration:</span>
              <span style="font-weight: 700; color: #fbbf24;">${formatDuration(u.duration_seconds)}</span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; margin-top: 6px;">
            <span>IP: <strong style="color: #38bdf8; font-family: monospace;">${escapeHtml(u.ip || '103.xxx')}</strong></span>
            <span>${escapeHtml(u.device?.split(' ')[0] || 'Web')}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'zb-leaflet-dark-popup' });

      marker.on('click', () => {
        setSelectedUser(u);
      });

      markersGroup.addLayer(marker);
    });

    // Auto fit map bounds to encompass all active/registered real users
    if (users.length > 0 && leafletMapRef.current) {
      const validPoints = users
        .filter(u => typeof u.latitude === 'number' && typeof u.longitude === 'number' && !isNaN(u.latitude) && !isNaN(u.longitude))
        .map(u => [u.latitude, u.longitude] as [number, number]);
      if (validPoints.length > 0) {
        try {
          const bounds = L.latLngBounds(validPoints);
          leafletMapRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 6 });
        } catch (_) { }
      }
    }
  }, [users]);

  // Zoom smoothly to user coordinates
  const zoomToUser = (u: UnifiedUserRecord) => {
    if (!leafletMapRef.current || typeof u.latitude !== 'number' || typeof u.longitude !== 'number') return;
    leafletMapRef.current.flyTo([u.latitude, u.longitude], 11, { duration: 1.5 });
    setSelectedUser(u);
  };

  // Region preset navigation
  const setMapRegion = (region: 'world' | 'india' | 'us' | 'europe' | 'middle_east' | 'asia') => {
    setActiveMapRegion(region);
    if (!leafletMapRef.current) return;

    if (region === 'world') {
      leafletMapRef.current.flyTo([22.5, 78.9], 3, { duration: 1.2 });
    } else if (region === 'india') {
      leafletMapRef.current.flyTo([20.5937, 78.9629], 5, { duration: 1.2 });
    } else if (region === 'us') {
      leafletMapRef.current.flyTo([37.0902, -95.7129], 4, { duration: 1.2 });
    } else if (region === 'europe') {
      leafletMapRef.current.flyTo([50.8503, 4.3517], 4.5, { duration: 1.2 });
    } else if (region === 'middle_east') {
      leafletMapRef.current.flyTo([25.2048, 55.2708], 5.5, { duration: 1.2 });
    } else if (region === 'asia') {
      leafletMapRef.current.flyTo([15.8700, 100.9925], 4.5, { duration: 1.2 });
    }
  };

  const copyToClipboard = (text: string, type: 'ip' | 'sql' | 'details') => {
    navigator.clipboard.writeText(text);
    if (type === 'ip') {
      setCopiedIp(text);
      setTimeout(() => setCopiedIp(null), 2000);
      onShowToast?.(`IP copied: ${text}`, 'info');
    } else if (type === 'sql') {
      setIsCopiedSql(true);
      setTimeout(() => setIsCopiedSql(false), 3000);
      onShowToast?.('Supabase SQL migration copied to clipboard!', 'success');
    } else {
      onShowToast?.('User intelligence dossier copied!', 'success');
    }
  };

  // Export data as CSV
  const exportUsersCsv = () => {
    try {
      const headers = ['User Name', 'Email', 'Status', 'Inactivity Category', 'Days Since Login', 'Login Time', 'Logout Time', 'Duration Seconds', 'City', 'Country', 'IP', 'ISP', 'Device'];
      const rows = users.map(u => [
        `"${u.user_name || 'Guest'}"`,
        `"${u.user_email || ''}"`,
        `"${u.is_online ? 'ONLINE' : 'OFFLINE'}"`,
        `"${u.inactivity.category}"`,
        `"${u.inactivity.days}"`,
        `"${u.login_time}"`,
        `"${u.logout_time || 'In Session'}"`,
        `"${u.duration_seconds}"`,
        `"${u.city}"`,
        `"${u.country}"`,
        `"${u.ip || ''}"`,
        `"${u.isp || ''}"`,
        `"${u.device || ''}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `zenbudget_user_activity_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast?.('User Activity report exported as CSV!', 'success');
    } catch (_) {
      onShowToast?.('Failed to export CSV', 'warning');
    }
  };

  // Filtered & Sorted Users
  const filteredUsers = users.filter(u => {
    if (inactivityFilter !== 'all') {
      if (inactivityFilter === 'online' && !u.is_online) return false;
      if (inactivityFilter === 'today' && u.inactivity.category !== 'today') return false;
      if (inactivityFilter === '1-3days' && u.inactivity.category !== '1-3days') return false;
      if (inactivityFilter === '4-7days' && u.inactivity.category !== '4-7days') return false;
      if (inactivityFilter === 'dormant' && u.inactivity.category !== 'dormant') return false;
    }

    if (countryFilter !== 'all' && u.country !== countryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.user_name || '').toLowerCase().includes(q);
      const matchEmail = (u.user_email || '').toLowerCase().includes(q);
      const matchCity = (u.city || '').toLowerCase().includes(q);
      const matchCountry = (u.country || '').toLowerCase().includes(q);
      const matchIp = (u.ip || '').toLowerCase().includes(q);
      const matchIsp = (u.isp || '').toLowerCase().includes(q);
      const matchDevice = (u.device || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchCity || matchCountry || matchIp || matchIsp || matchDevice;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'recent_login') {
      return new Date(b.login_time).getTime() - new Date(a.login_time).getTime();
    }
    if (sortBy === 'most_inactive') {
      // Highest time since login first
      return b.inactivity.days - a.inactivity.days || new Date(a.login_time).getTime() - new Date(b.login_time).getTime();
    }
    if (sortBy === 'duration') {
      return (b.duration_seconds || 0) - (a.duration_seconds || 0);
    }
    if (sortBy === 'name') {
      return (a.user_name || '').localeCompare(b.user_name || '');
    }
    if (sortBy === 'country') {
      return (a.country || '').localeCompare(b.country || '');
    }
    return 0;
  });

  // Analytics Metrics
  const onlineCount = users.filter(u => u.is_online).length;
  const activeTodayCount = users.filter(u => u.inactivity.category === 'today' || u.is_online).length;
  const inactive1to3Count = users.filter(u => u.inactivity.category === '1-3days').length;
  const inactive4to7Count = users.filter(u => u.inactivity.category === '4-7days').length;
  const dormantCount = users.filter(u => u.inactivity.category === 'dormant').length;
  const countriesCount = new Set(users.map(u => u.country).filter(Boolean)).size;
  const totalDuration = users.reduce((acc, u) => acc + (u.duration_seconds || 0), 0);
  const avgDuration = users.length > 0 ? Math.round(totalDuration / users.length) : 0;
  const uniqueCountries = Array.from(new Set(users.map(u => u.country).filter(Boolean)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* 1. Header Banner with Live Stats & SQL Helper */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.35rem 1.75rem',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.75) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 10px 35px rgba(0, 0, 0, 0.35)',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.45)',
            flexShrink: 0
          }}>
            <Globe size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                World Map & Live User Activity Tracker
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                letterSpacing: '0.04em'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
                REALTIME GPS RADAR
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Dekhein kahan-kahan se users app open kar rahe hain, kab login & logout kiya, aur <strong>kitne time se login nahi kiya hai</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Supabase SQL Migration Button */}
          <button
            onClick={() => setShowSqlModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
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
              fontWeight: 700,
              fontSize: '0.825rem',
              transition: 'all 0.2s'
            }}
          >
            <Database size={15} />
            <span>{tableStatus === 'connected' ? 'DB Connected' : 'Supabase SQL Migration'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportUsersCsv}
            title="Download CSV report"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.825rem',
              transition: 'all 0.2s'
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadUserData}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.825rem',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics HUD Ribbon (Focusing on Inactivity & Login Times) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem'
      }}>
        {/* Metric 1: Online Now */}
        <div
          onClick={() => setInactivityFilter('online')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            background: inactivityFilter === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.65)',
            border: inactivityFilter === 'online' ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid rgba(16, 185, 129, 0.3)',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Online Now
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>
              {onlineCount} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6ee7b7' }}>active</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Today */}
        <div
          onClick={() => setInactivityFilter('today')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            background: inactivityFilter === 'today' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.65)',
            border: inactivityFilter === 'today' ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid rgba(56, 189, 248, 0.25)',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Active Today (&lt;24h)
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
              {activeTodayCount} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#bae6fd' }}>users</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Inactive 1-3 Days */}
        <div
          onClick={() => setInactivityFilter('1-3days')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            background: inactivityFilter === '1-3days' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.65)',
            border: inactivityFilter === '1-3days' ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(245, 158, 11, 0.25)',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Inactive 1–3 Days
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24' }}>
              {inactive1to3Count}
            </div>
          </div>
        </div>

        {/* Metric 4: Dormant > 7 Days */}
        <div
          onClick={() => setInactivityFilter('dormant')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            background: inactivityFilter === 'dormant' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.65)',
            border: inactivityFilter === 'dormant' ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(239, 68, 68, 0.25)',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Dormant (&gt;7 Days)
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f87171' }}>
              {dormantCount} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fca5a5' }}>users</span>
            </div>
          </div>
        </div>

        {/* Metric 5: Global Reach */}
        <div style={{
          padding: '1.1rem',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a855f7'
          }}>
            <MapPin size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Reach
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c084fc' }}>
              {countriesCount} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#e9d5ff' }}>countries</span>
            </div>
          </div>
        </div>

        {/* Metric 6: Avg Dwell Time */}
        <div style={{
          padding: '1.1rem',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#cbd5e1'
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Avg App Dwell Time
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
              {formatDuration(avgDuration)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive World Map Container */}
      <div style={{
        position: 'relative',
        height: isMapExpanded ? '640px' : '480px',
        width: '100%',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 16px 45px rgba(0, 0, 0, 0.5)',
        backgroundColor: '#090d16',
        transition: 'height 0.3s ease'
      }}>
        {/* Leaflet Map Div */}
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', background: '#090d16', zIndex: 1 }}
        />

        {/* Top-Left: Map Legend */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '0.45rem 0.9rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#cbd5e1',
          fontSize: '0.74rem',
          fontWeight: 600,
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
            Online ({onlineCount})
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
            Today ({activeTodayCount})
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
            Inactive 1–3d ({inactive1to3Count})
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
            Dormant &gt;7d ({dormantCount})
          </span>
        </div>

        {/* Top-Right Region Presets Bar */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '4.5rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '0.3rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          {[
            { id: 'world', label: '🌍 World' },
            { id: 'india', label: '🇮🇳 India' },
            { id: 'us', label: '🇺🇸 USA' },
            { id: 'europe', label: '🇪🇺 Europe' },
            { id: 'middle_east', label: '🇦🇪 UAE' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setMapRegion(r.id as any)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: 'none',
                background: activeMapRegion === r.id ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                color: activeMapRegion === r.id ? '#34d399' : '#cbd5e1',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Bottom Right: Fullscreen / Expand Toggle & Center */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setMapRegion('world')}
            title="Center World View"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.85rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
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

          <button
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            title={isMapExpanded ? 'Minimize Map' : 'Expand Map'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            {isMapExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '1.1rem',
        borderRadius: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '0.6rem 0.95rem',
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

        {/* Filter Pills for Inactivity ("Kitne time se login nahi kiya") */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Users (${users.length})` },
            { id: 'online', label: `🟢 Online (${onlineCount})` },
            { id: 'today', label: `⚡ Today (${activeTodayCount})` },
            { id: '1-3days', label: `🟡 1–3 Days (${inactive1to3Count})` },
            { id: '4-7days', label: `🟠 4–7 Days (${inactive4to7Count})` },
            { id: 'dormant', label: `🔴 Dormant (${dormantCount})` }
          ].map(tab => {
            const isSelected = inactivityFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setInactivityFilter(tab.id as any)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#34d399' : '#cbd5e1',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            );
          })}

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '0.2rem 0.6rem' }}>
            <ArrowUpDown size={13} color="#94a3b8" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.76rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                padding: '0.35rem 0'
              }}
            >
              <option value="recent_login" style={{ background: '#0f172a' }}>Sort: Recent Login</option>
              <option value="most_inactive" style={{ background: '#0f172a' }}>Sort: Most Inactive First</option>
              <option value="duration" style={{ background: '#0f172a' }}>Sort: Highest Duration</option>
              <option value="name" style={{ background: '#0f172a' }}>Sort: Name (A-Z)</option>
              <option value="country" style={{ background: '#0f172a' }}>Sort: Country (A-Z)</option>
            </select>
          </div>

          {/* Country Filter Dropdown */}
          {uniqueCountries.length > 0 && (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.76rem',
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

      {/* 5. Detailed User Activity Stream Table */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={18} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
              User Login & Inactivity Activity Log ({filteredUsers.length})
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Showing {filteredUsers.length} of {users.length} total users
          </span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{
                backgroundColor: 'rgba(2, 6, 23, 0.75)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '0.9rem 1rem' }}>User & Email</th>
                <th style={{ padding: '0.9rem 1rem' }}>Location / City</th>
                <th style={{ padding: '0.9rem 1rem' }}>Kab Login Kiya</th>
                <th style={{ padding: '0.9rem 1rem' }}>Kab Logout Kiya</th>
                <th style={{ padding: '0.9rem 1rem' }}>Kitne Time Se Inactive</th>
                <th style={{ padding: '0.9rem 1rem' }}>Duration</th>
                <th style={{ padding: '0.9rem 1rem' }}>IP & Provider</th>
                <th style={{ padding: '0.9rem 1rem' }}>Device</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
                    <Users size={36} style={{ margin: '0 auto 0.85rem', opacity: 0.35 }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>No users match the selected filters.</p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem' }}>Try clearing the search query or changing the inactivity filter.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isOnline = u.is_online;
                  const isSelected = selectedUser?.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      {/* User & Email */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                            color: isOnline ? '#34d399' : '#a5b4fc',
                            border: isOnline ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(99, 102, 241, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {(u.user_name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                                {u.user_name || 'Guest User'}
                              </span>
                              {u.subscription_tier && u.subscription_tier.includes('premium') && (
                                <Crown size={12} color="#fbbf24" />
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {u.user_email || 'No email registered'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location / City */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>
                            {getFlagEmoji(u.country_code)}
                          </span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                              {u.city || 'Delhi'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {u.region ? `${u.region}, ` : ''}{u.country || 'India'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kab Login Kiya */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>
                          {timeAgo(u.login_time)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {formatDateTime(u.login_time)}
                        </div>
                      </td>

                      {/* Kab Logout Kiya */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {u.logout_time ? (
                          <>
                            <div style={{ color: '#cbd5e1', fontWeight: 500 }}>
                              {timeAgo(u.logout_time)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {formatDateTime(u.logout_time)}
                            </div>
                          </>
                        ) : isOnline ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: '#34d399',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                            Active Now
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            Session Ended
                          </span>
                        )}
                      </td>

                      {/* Kitne Time Se Inactive ("Kitne time se login nahi kiya hai") */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          backgroundColor: u.inactivity.bgColor,
                          color: u.inactivity.color,
                          border: `1px solid ${u.inactivity.borderColor}`
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: u.inactivity.color }}></span>
                          {u.inactivity.text}
                        </span>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontWeight: 700,
                          color: '#fbbf24',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem'
                        }}>
                          {formatDuration(u.duration_seconds)}
                        </span>
                      </td>

                      {/* IP & ISP */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.76rem', fontWeight: 600 }}>
                            {u.ip || '103.xxx'}
                          </span>
                          {u.ip && (
                            <button
                              onClick={() => copyToClipboard(u.ip!, 'ip')}
                              title="Copy IP"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedIp === u.ip ? '#10b981' : '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                            >
                              {copiedIp === u.ip ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                        {u.isp && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.isp}
                          </div>
                        )}
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
                          {u.device?.toLowerCase().includes('mobile') || u.device?.toLowerCase().includes('android') || u.device?.toLowerCase().includes('ios') ? (
                            <Smartphone size={13} color="#94a3b8" />
                          ) : (
                            <Laptop size={13} color="#94a3b8" />
                          )}
                          {u.device || 'Web Browser'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => zoomToUser(u)}
                            title="Focus on World Map"
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#34d399',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Compass size={13} />
                            <span>Locate</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowUserModal(true);
                            }}
                            title="View Full User Dossier"
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(59, 130, 246, 0.12)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#60a5fa',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Info size={13} />
                            <span>Dossier</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Comprehensive User Intelligence Modal ("Pura detail mere ko usme aana chahiye") */}
      {showUserModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
            border: '1px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 25px 65px rgba(0, 0, 0, 0.9)',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}>
                  {(selectedUser.user_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                      {selectedUser.user_name || 'Guest User'}
                    </h3>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      backgroundColor: selectedUser.inactivity.bgColor,
                      color: selectedUser.inactivity.color,
                      border: `1px solid ${selectedUser.inactivity.borderColor}`
                    }}>
                      {selectedUser.inactivity.badgeLabel}
                    </span>
                  </div>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {selectedUser.user_email || 'No email registered'} • User ID: <code style={{ color: '#38bdf8' }}>{selectedUser.user_id || selectedUser.id}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '1.6rem',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              {/* Highlight Inactivity Alert Card */}
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: '14px',
                backgroundColor: selectedUser.inactivity.bgColor,
                border: `1px solid ${selectedUser.inactivity.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedUser.inactivity.color, textTransform: 'uppercase' }}>
                    Inactivity Status (Kitne Time Se Login Nahi Kiya)
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
                    {selectedUser.inactivity.text}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total App Dwell Duration</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>
                    {formatDuration(selectedUser.duration_seconds)}
                  </div>
                </div>
              </div>

              {/* Grid 1: Timestamps */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Kab Login Kiya (Login Timestamp)
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    {formatDateTime(selectedUser.login_time)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>
                    {timeAgo(selectedUser.login_time)}
                  </div>
                </div>

                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Kab Logout Kiya (Logout Timestamp)
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: selectedUser.logout_time ? '#f8fafc' : '#34d399' }}>
                    {selectedUser.logout_time ? formatDateTime(selectedUser.logout_time) : 'Active Session (Not Logged Out)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: selectedUser.logout_time ? '#64748b' : '#34d399', marginTop: '0.2rem' }}>
                    {selectedUser.logout_time ? timeAgo(selectedUser.logout_time) : 'Online Now'}
                  </div>
                </div>
              </div>

              {/* Grid 2: Geolocation & Network */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Exact Geo Location
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    <span>{getFlagEmoji(selectedUser.country_code)}</span>
                    <span>{selectedUser.city}, {selectedUser.country}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                    Region: <strong>{selectedUser.region || 'Standard'}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                    GPS: {selectedUser.latitude?.toFixed(4)}, {selectedUser.longitude?.toFixed(4)}
                  </div>
                </div>

                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Network & Security
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                      {selectedUser.ip || '103.xxx.xxx'}
                    </span>
                    {selectedUser.ip && (
                      <button
                        onClick={() => copyToClipboard(selectedUser.ip!, 'ip')}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                      >
                        {copiedIp === selectedUser.ip ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.3rem' }}>
                    ISP: <strong>{selectedUser.isp || 'Broadband ISP'}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Device: <strong>{selectedUser.device || 'Web Browser'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => {
                  const summary = `User: ${selectedUser.user_name}\nEmail: ${selectedUser.user_email}\nCountry: ${selectedUser.country}\nCity: ${selectedUser.city}\nLast Login: ${selectedUser.login_time}\nInactive: ${selectedUser.inactivity.text}\nIP: ${selectedUser.ip}\nISP: ${selectedUser.isp}`;
                  copyToClipboard(summary, 'details');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                <Copy size={13} />
                <span>Copy Summary</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    zoomToUser(selectedUser);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.825rem',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Compass size={14} />
                  <span>Locate on Map</span>
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.825rem'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Supabase SQL Migration Modal */}
      {showSqlModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
                    Supabase SQL Migration for User Geo & Inactivity Tracking
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Copy karke Supabase SQL Editor me Run kijiye (user_sessions, login/logout timestamps & coords auto-setup honge).
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
                <strong>Step-by-Step Guide:</strong>
                <ol style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem' }}>
                  <li>Neeche <strong>"Copy SQL Migration"</strong> button pe click kijiye.</li>
                  <li>Apna <strong>Supabase Dashboard</strong> open kijiye 👉 <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>supabase.com/dashboard</a>.</li>
                  <li>Left menu me <strong>"SQL Editor"</strong> pe click karke <strong>"New Query"</strong> banaiye.</li>
                  <li>Paste karke green <strong>"RUN"</strong> button click kijiye! (1 second me ready).</li>
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
