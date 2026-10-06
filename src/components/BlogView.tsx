import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calendar, User, ArrowRight, Sparkles, Search, Clock, Tag, BookOpen, ShieldCheck } from 'lucide-react';
import { blogPosts } from '../data/blogPosts';
import type { BlogPost } from '../data/blogPosts';
import { GooglePlayIcon } from './GooglePlayBadge';
import { DISTRIBUTION_CONFIG } from '../config/buildConfig';

interface BlogViewProps {
  onBackToLanding: () => void;
  onOpenWebApp?: () => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ onBackToLanding, onOpenWebApp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    document.title = 'ZenBudget Blog - Personal Finance & Budgeting Insights';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Master your personal finances with actionable strategies on budgeting, UPI expense control, emergency funds, and mindful money management.');
    }
    document.documentElement.classList.add('landing-active');
    document.body.classList.add('landing-active');
    document.getElementById('root')?.classList.add('landing-root');
    window.scrollTo(0, 0);

    return () => {
      document.documentElement.classList.remove('landing-active');
      document.body.classList.remove('landing-active');
      document.getElementById('root')?.classList.remove('landing-root');
    };
  }, []);

  const handlePostClick = (slug: string) => {
    window.history.pushState(null, '', `/blog/${slug}`);
    window.dispatchEvent(new Event('popstate'));
  };

  const categories = useMemo(() => {
    const cats = ['All'];
    blogPosts.forEach(post => {
      if (post.category && !cats.includes(post.category)) {
        cats.push(post.category);
      }
    });
    return cats;
  }, []);

  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q) ||
        post.tags.some(t => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070a0f',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Manrope", sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: '80px',
      width: '100%'
    }}>
      <style>{`
        html, body {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: auto !important;
          min-height: 100vh !important;
          display: block !important;
          background: #070a0f !important;
        }
        #root {
          overflow-x: hidden !important;
          overflow-y: visible !important;
          height: auto !important;
          min-height: 100vh !important;
          width: 100% !important;
          max-width: 100% !important;
          display: block !important;
          border-left: none !important;
          border-right: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }
        @media (max-width: 640px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
      {/* Background Ambient Glows */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(1200px, 100vw)',
        height: '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 50%, transparent 80%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Sticky Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '72px',
        backgroundColor: 'rgba(7, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          maxWidth: '1240px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Left: Back & Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBackToLanding}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Back to ZenBudget Home"
              aria-label="Back to home"
              className="hover-lift"
            >
              <ArrowLeft size={18} />
            </button>

            <div 
              onClick={onBackToLanding} 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Z</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>ZenBudget</span>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  Blog
                </span>
              </div>
            </div>
          </div>

          {/* Right Header CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href={DISTRIBUTION_CONFIG.PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '100px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              className="hover-lift"
            >
              <GooglePlayIcon size={16} />
              <span className="desktop-only">Play Store</span>
            </a>

            <button
              onClick={() => {
                if (onOpenWebApp) onOpenWebApp();
                else {
                  window.history.pushState(null, '', '/#app');
                  window.dispatchEvent(new Event('popstate'));
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '100px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease'
              }}
              className="hover-lift"
            >
              <span>Open Web App</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '120px 24px 40px', position: 'relative', zIndex: 10 }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 56px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '100px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '20px'
          }}>
            <Sparkles size={14} color="#34d399" />
            <span>FINANCIAL WISDOM & MODERN GUIDES</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 54px)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: '18px'
          }}>
            Master Your Money.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Build Lasting Wealth.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: '#94a3b8',
            lineHeight: 1.6,
            fontWeight: 500,
            marginBottom: '36px'
          }}>
            Evidence-based budgeting strategies, behavioral spending psychology, and actionable guides to eliminate money stress in 2026.
          </p>

          {/* Search Bar */}
          <div style={{
            position: 'relative',
            maxWidth: '540px',
            margin: '0 auto',
            boxShadow: '0 8px 30px rgba(0,0,0,0.35)'
          }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search guides, strategies, UPI tips, habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px 14px 48px',
                borderRadius: '100px',
                backgroundColor: 'rgba(21, 32, 54, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                color: '#ffffff',
                fontSize: '14.5px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '28px'
          }}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isActive ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? '#34d399' : '#94a3b8'
                  }}
                  className="hover-lift"
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter if searching */}
        {(searchQuery || selectedCategory !== 'All') && (
          <div style={{ marginBottom: '28px', color: '#94a3b8', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}</span>
            {selectedCategory !== 'All' && <span>in <strong style={{ color: '#ffffff' }}>{selectedCategory}</strong></span>}
            {searchQuery && <span>matching "<em>{searchQuery}</em>"</span>}
          </div>
        )}

        {/* Blog Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div style={{
            padding: '60px 24px',
            textAlign: 'center',
            backgroundColor: 'rgba(21, 32, 54, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '24px',
            maxWidth: '500px',
            margin: '40px auto'
          }}>
            <BookOpen size={42} color="#64748b" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>No articles found</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              No articles matched your search query. Try searching for different keywords or clear your filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
            gap: '28px'
          }}>
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => handlePostClick(post.slug)}
                style={{
                  backgroundColor: 'rgba(17, 24, 39, 0.75)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '28px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                }}
                className="hover-lift"
              >
                {/* Post Cover Image */}
                <div style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden' }}>
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(7,10,15,0.75) 100%)'
                  }} />

                  {/* Top Badges */}
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    right: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.9)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      {post.category}
                    </span>

                    <span style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(8px)',
                      color: '#e2e8f0',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}>
                      <Clock size={11} color="#34d399" />
                      {post.readTime}
                    </span>
                  </div>
                </div>

                {/* Post Content */}
                <div style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    lineHeight: 1.3,
                    color: '#ffffff',
                    marginBottom: '12px',
                    letterSpacing: '-0.02em',
                    transition: 'color 0.2s ease'
                  }}>
                    {post.title}
                  </h2>

                  <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    fontWeight: 400,
                    marginBottom: '20px',
                    flexGrow: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#cbd5e1',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Author & Read Link Footer */}
                  <div style={{
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        {post.author.charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>{post.author}</span>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                          {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: '#34d399'
                    }}>
                      <span>Read</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Bottom CTA Card */}
        <section style={{
          marginTop: '80px',
          padding: '48px 36px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, #064e3b 0%, #022c22 45%, #065f46 100%)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          boxShadow: '0 24px 60px rgba(6, 78, 59, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '100px',
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              color: '#6ee7b7',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px'
            }}>
              <ShieldCheck size={14} />
              <span>100% PRIVATE & ENCRYPTED APP</span>
            </div>

            <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#ffffff', lineHeight: 1.2, marginBottom: '14px', letterSpacing: '-0.02em' }}>
              Put These Insights into Action Today
            </h2>

            <p style={{ fontSize: '15.5px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, marginBottom: '32px' }}>
              Stop wondering where your money went. Track expenses in under 3 seconds, audit leaks automatically, and grow your financial cushion with ZenBudget.
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => {
                  if (onOpenWebApp) onOpenWebApp();
                  else {
                    window.history.pushState(null, '', '/#app');
                    window.dispatchEvent(new Event('popstate'));
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                  color: '#064e3b',
                  padding: '15px 32px',
                  borderRadius: '100px',
                  fontSize: '15.5px',
                  fontWeight: 900,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}
                className="hover-lift"
              >
                <span>Launch ZenBudget Free</span>
                <ArrowRight size={16} />
              </button>

              <a
                href={DISTRIBUTION_CONFIG.PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '14px 24px',
                  borderRadius: '100px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none'
                }}
                className="hover-lift"
              >
                <GooglePlayIcon size={18} />
                <span>Get on Google Play</span>
              </a>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default BlogView;
