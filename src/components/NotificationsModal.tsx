import React, { useState, useEffect } from 'react';
import { X, Bell, Shield, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

interface ZenNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'income' | 'expense';
  title: string;
  desc: string;
  timestamp: string; // ISO string
  unread: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationsList?: ZenNotification[];
  onMarkAllRead?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
  isOpen, 
  onClose,
  notificationsList = [],
  onMarkAllRead
}) => {
  const [now, setNow] = useState(new Date());

  // Update time reference periodically when open to keep timings updating
  useEffect(() => {
    if (!isOpen) return;
    
    // Automatically trigger mark all read on opening
    if (onMarkAllRead) {
      onMarkAllRead();
    }

    const interval = setInterval(() => {
      setNow(new Date());
    }, 5000); // update every 5 seconds
    return () => clearInterval(interval);
  }, [isOpen, onMarkAllRead]);

  if (!isOpen) return null;

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
      return "Just now";
    }
  };

  const getNotificationIcon = (type: ZenNotification['type']) => {
    switch (type) {
      case 'success':
        return <Sparkles size={16} style={{ color: 'var(--primary)' }} />;
      case 'info':
        return <KeyRound size={16} style={{ color: 'var(--secondary)' }} />;
      case 'warning':
        return <AlertCircle size={16} style={{ color: 'var(--danger)' }} />;
      case 'income':
        return <Bell size={16} style={{ color: 'var(--success)' }} />;
      case 'expense':
        return <Bell size={16} style={{ color: 'var(--danger)' }} />;
      default:
        return <Shield size={16} style={{ color: 'var(--primary)' }} />;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '350px',
          padding: '24px',
          borderRadius: '24px',
          position: 'relative',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.1)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Notifications</h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Notification List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
          {notificationsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)', fontSize: '12px' }}>
              No notifications yet.
            </div>
          ) : (
            notificationsList.map((n) => (
              <div 
                key={n.id}
                style={{
                  padding: '12px',
                  borderRadius: '16px',
                  background: n.unread ? 'rgba(34, 197, 94, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  border: n.unread ? '1px solid rgba(34, 197, 94, 0.15)' : '1px solid rgba(255, 255, 255, 0.04)',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {n.unread && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    boxShadow: '0 0 6px var(--primary)'
                  }} />
                )}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(n.type)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{n.title}</h4>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{getRelativeTime(n.timestamp)}</span>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                  {n.desc}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
