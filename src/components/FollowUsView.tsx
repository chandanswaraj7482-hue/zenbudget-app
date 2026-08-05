import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface SocialLinkItem {
  id?: string;
  platform: string;
  url: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface FollowUsViewProps {
  onBack: () => void;
}

export const FollowUsView: React.FC<FollowUsViewProps> = ({ onBack }) => {
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('social_links')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSocialLinks(data);
        } else {
          setSocialLinks([
            { platform: 'Instagram', icon: '📸', url: 'https://www.instagram.com/zenbudget_tracker/', color: '#e1306c', is_active: true },
            { platform: 'Facebook', icon: '👥', url: 'https://www.facebook.com/people/ZenBudget/61592667931013/', color: '#1877f2', is_active: true },
            { platform: 'YouTube', icon: '▶️', url: 'https://www.youtube.com/channel/UCa2ewl3C6Q3qGTXjbAMeAtA', color: '#ff0000', is_active: true },
          ]);
        }
        setLoading(false);
      })
      .catch(() => {
        setSocialLinks([
          { platform: 'Instagram', icon: '📸', url: 'https://www.instagram.com/zenbudget_tracker/', color: '#e1306c', is_active: true },
          { platform: 'Facebook', icon: '👥', url: 'https://www.facebook.com/people/ZenBudget/61592667931013/', color: '#1877f2', is_active: true },
          { platform: 'YouTube', icon: '▶️', url: 'https://www.youtube.com/channel/UCa2ewl3C6Q3qGTXjbAMeAtA', color: '#ff0000', is_active: true },
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '12px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, fontFamily: "'Manrope', sans-serif" }}>Follow Us</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Connect with ZenBudget Community</span>
        </div>
      </div>

      {/* Banner Card */}
      <div style={{
        padding: '20px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#818cf8" />
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>Join the ZenBudget Family 📲</h3>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Stay updated with financial tips, daily budget strategies, new feature announcements, and exclusive community rewards!
        </p>
      </div>

      {/* Social Links List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading links...</div>
        ) : (
          socialLinks.map((social) => (
            <a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  {social.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{social.platform}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {social.url ? social.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : `@${social.platform.toLowerCase()}`}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                color: social.color || 'var(--primary)',
                fontWeight: 700,
                fontSize: '12px'
              }}>
                <span>Follow</span>
                <ExternalLink size={14} />
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};
