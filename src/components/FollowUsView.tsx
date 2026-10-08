import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Sparkles, Building2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { renderSocialIcon } from './SocialIcons';

interface SocialLinkItem {
  id?: string;
  platform: string;
  handleName?: string;
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

  const defaultLinks: SocialLinkItem[] = [
    { platform: 'YouTube', handleName: 'Something Labs', icon: '▶️', url: 'https://www.youtube.com/channel/UCa2ewl3C6Q3qGTXjbAMeAtA', color: '#ff0000', is_active: true },
    { platform: 'TikTok', handleName: 'Something Labs', icon: '🎵', url: 'https://www.tiktok.com/@zenbudget_tracker?lang=en-GB', color: '#00f2fe', is_active: true },
    { platform: 'Instagram', handleName: 'Something Labs', icon: '📸', url: 'https://www.instagram.com/somethinglabs.in/', color: '#e1306c', is_active: true },
    { platform: 'Facebook', handleName: 'Something Labs', icon: '👥', url: 'https://www.facebook.com/somethinglabs.in', color: '#1877f2', is_active: true },
    { platform: 'LinkedIn', handleName: 'Something Labs', icon: '💼', url: '', color: '#0a66c2', is_active: true },
    { platform: 'X', handleName: 'Something Labs', icon: '𝕏', url: 'https://twitter.com/ZenBudgetApp', color: '#ffffff', is_active: true }
  ];

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data: dbLinks } = await supabase
          .from('social_links')
          .select('*')
          .eq('is_active', true);

        if (dbLinks && dbLinks.length > 0) {
          const merged = defaultLinks.map(def => {
            const remote = dbLinks.find((d: any) => d.platform?.toLowerCase() === def.platform.toLowerCase());
            return remote ? { ...def, ...remote, handleName: 'Something Labs' } : def;
          });
          setSocialLinks(merged);
          setLoading(false);
          return;
        }

        // Fallback: Check app_config table for 'social_links'
        const { data: cfgData } = await supabase
          .from('app_config')
          .select('data')
          .eq('id', 'social_links')
          .maybeSingle();

        if (cfgData?.data && Array.isArray(cfgData.data) && cfgData.data.length > 0) {
          const merged = defaultLinks.map(def => {
            const remote = cfgData.data.find((d: any) => d.platform?.toLowerCase() === def.platform.toLowerCase());
            return remote ? { ...def, ...remote, handleName: 'Something Labs' } : def;
          });
          setSocialLinks(merged);
        } else {
          setSocialLinks(defaultLinks);
        }
      } catch (_) {
        setSocialLinks(defaultLinks);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();

    // Realtime channel for live updates from Admin Panel
    const channel = supabase
      .channel('public:social_links_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_links' }, () => {
        fetchLinks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, (payload: any) => {
        if (payload?.new && (payload.new as any).id === 'social_links') {
          fetchLinks();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, fontFamily: "'Manrope', sans-serif" }}>
            Follow Something Labs
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Stay connected with Something Labs — new products, AI tools, updates & experiments.
          </span>
        </div>
      </div>

      {/* Banner Card: ZenBudget is built by Something Labs */}
      <div style={{
        padding: '22px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(168, 85, 247, 0.16) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#a855f7" />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
            ZenBudget is built by Something Labs. 🚀
          </h3>
        </div>
        <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
          Stay connected with Something Labs — new products, AI tools, updates & experiments.
        </p>
      </div>

      {/* Social Links List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading links...</div>
        ) : (
          socialLinks.map((social) => {
            const hasUrl = !!social.url && social.url.trim() !== '';

            const cardContent = (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  borderRadius: '18px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  cursor: hasUrl ? 'pointer' : 'default',
                  opacity: hasUrl ? 1 : 0.85
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: `${social.color || '#10b981'}15`,
                    border: `1px solid ${social.color || '#10b981'}30`,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {renderSocialIcon(social.platform, 24)}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {social.platform}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      → Something Labs
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: hasUrl ? 'var(--primary-glow)' : 'rgba(255,255,255,0.06)',
                  color: hasUrl ? (social.color || 'var(--primary)') : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '12px'
                }}>
                  <span>{hasUrl ? 'Follow' : 'Soon'}</span>
                  {hasUrl && <ExternalLink size={14} />}
                </div>
              </div>
            );

            if (hasUrl) {
              return (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  {cardContent}
                </a>
              );
            }

            return (
              <div key={social.platform} style={{ display: 'block' }}>
                {cardContent}
              </div>
            );
          })
        )}
      </div>

      {/* Brand Distinction Clarification Card */}
      <div style={{
        textAlign: 'center',
        padding: '16px',
        borderRadius: '18px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        marginTop: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
          <Building2 size={16} color="var(--primary)" />
          <span>ZenBudget is built by Something Labs.</span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          <strong>ZenBudget</strong> is the personal finance product. <strong>Something Labs</strong> is the company & innovation lab behind the product.
        </p>
      </div>
    </div>
  );
};
