import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ArrowLeft, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  KeyRound, 
  AlertCircle, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle2,
  BellRing
} from 'lucide-react';

export interface ZenNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'income' | 'expense';
  title: string;
  desc: string;
  timestamp: string; // ISO string
  unread: boolean;
}

interface NotificationsViewProps {
  notificationsList: ZenNotification[];
  onBack: () => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notificationsList = [],
  onBack,
  onMarkAllRead,
  onClearAll
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'activity'>('all');
  const [now, setNow] = useState(new Date());
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    if (onMarkAllRead) {
      onMarkAllRead();
    }
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, [onMarkAllRead]);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const getRelativeTime = (timestampStr: string) => {
    try {
      const timestamp = new Date(timestampStr);
      const diffMs = now.getTime() - timestamp.getTime();
      const diffSec = Math.max(0, Math.floor(diffMs / 1000));
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      return `${diffDay}d ago`;
    } catch {
      return "Recently";
    }
  };

  const getNotificationIcon = (type: ZenNotification['type']) => {
    switch (type) {
      case 'success':
        return (
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} />
          </div>
        );
      case 'income':
        return (
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={18} />
          </div>
        );
      case 'expense':
        return (
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingDown size={18} />
          </div>
        );
      case 'warning':
        return (
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={18} />
          </div>
        );
      case 'info':
      default:
        return (
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BellRing size={18} />
          </div>
        );
    }
  };

  const filteredNotifications = notificationsList.filter(n => {
    if (filter === 'unread') return n.unread;
    if (filter === 'activity') return n.type === 'income' || n.type === 'expense';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '120px' }} className="animate-fade-in">
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            onClick={onBack}
            aria-label="Back to Dashboard"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '14px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Notifications
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0', fontWeight: 500 }}>
              Activity alerts, insights & smart spending reminders
            </p>
          </div>
        </div>

        {notificationsList.length > 0 && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            title="Clear all"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              padding: '8px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      {/* Push Notification Banner */}
      {permission === 'default' && (
        <div 
          className="glass-panel"
          style={{
            padding: '16px 18px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Never miss daily tracking
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Turn on notifications for smart evening summaries
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestPermission}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            Enable 🔔
          </button>
        </div>
      )}

      {/* Segmented Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: '16px', border: '1px solid var(--border-input)' }}>
        {[
          { id: 'all', label: `All (${notificationsList.length})` },
          { id: 'unread', label: `Unread (${notificationsList.filter(n => n.unread).length})` },
          { id: 'activity', label: 'Activity' }
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id as any)}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: 800,
              border: 'none',
              background: filter === item.id ? 'var(--primary)' : 'transparent',
              color: filter === item.id ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: filter === item.id ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div 
          className="glass-panel"
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--glow-shadow)'
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCheck size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              All Caught Up! 🎉
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: '280px', lineHeight: 1.4 }}>
              You don't have any pending notifications right now. Check back as you log more expenses!
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map(n => (
            <div
              key={n.id}
              className="glass-panel"
              style={{
                padding: '16px 18px',
                borderRadius: '20px',
                background: n.unread ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)' : 'var(--bg-card)',
                border: n.unread ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-card)',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: n.unread ? '0 4px 16px rgba(16, 185, 129, 0.15)' : 'var(--shadow-sm)'
              }}
            >
              {getNotificationIcon(n.type)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {getRelativeTime(n.timestamp)}
                    </span>
                    {n.unread && (
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
                  {n.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
