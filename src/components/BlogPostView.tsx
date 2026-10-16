import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, User, ArrowRight, Share2, Sparkles, Clock, Check, BookOpen, ShieldCheck, Sun, Moon } from 'lucide-react';
import { blogPosts } from '../data/blogPosts';
import type { BlogPost } from '../data/blogPosts';
import { GooglePlayIcon } from './GooglePlayBadge';
import { DISTRIBUTION_CONFIG } from '../config/buildConfig';

interface BlogPostViewProps {
  slug: string;
  onBackToLanding: () => void;
  onOpenWebApp?: () => void;
}

export const BlogPostView: React.FC<BlogPostViewProps> = ({ slug, onBackToLanding, onOpenWebApp }) => {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const explicit = localStorage.getItem('zb_theme_user_set');
      const saved = localStorage.getItem('zb_landing_theme') || localStorage.getItem('zb_theme');
      if (explicit === 'true' && saved === 'light') return 'light';
    } catch (e) {}
    return 'dark';
  });

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('zb_landing_theme', next);
        localStorage.setItem('zb_theme', next);
      } catch (e) {}
      return next;
    });
  };

  const post = blogPosts.find(p => p.slug === slug);

  // Other related posts
  const otherPosts = blogPosts.filter(p => p.slug !== slug).slice(0, 2);

  const t = {
    bg: isDark ? '#070a0f' : '#f8fafc',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    textSecondary: isDark ? '#cbd5e1' : '#334155',
    headerBg: isDark ? 'rgba(7, 10, 15, 0.85)' : 'rgba(255, 255, 255, 0.88)',
    headerBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)',
    articleBg: isDark ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
    articleBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
    articleShadow: isDark ? '0 20px 60px rgba(0, 0, 0, 0.4)' : '0 20px 50px -10px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.02)',
    cardBg: isDark ? 'rgba(17, 24, 39, 0.7)' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)',
    cardShadow: isDark ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
    metaPillBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
    metaPillBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    tagBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
    tagBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    tagText: isDark ? '#cbd5e1' : '#475569',
    divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
    iconBtnBg: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    iconBtnBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    iconBtnColor: isDark ? '#e2e8f0' : '#1e293b',
  };

  useEffect(() => {
    let scriptTag: HTMLScriptElement | null = null;
    if (post) {
      document.title = `${post.title} | ZenBudget Blog`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', post.excerpt);
      }
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', post.imageUrl);
      const twImage = document.querySelector('meta[name="twitter:image"]');
      if (twImage) twImage.setAttribute('content', post.imageUrl);

      // Inject Article Schema with ImageObject for Google Rich Snippets & Image SEO
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'description': post.excerpt,
        'image': [post.imageUrl],
        'datePublished': post.date,
        'author': {
          '@type': 'Person',
          'name': post.author,
          'jobTitle': post.authorRole
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'ZenBudget',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://zenbudget-tracker.vercel.app/logo.png'
          }
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': window.location.href
        }
      });
      document.head.appendChild(scriptTag);
    } else {
      document.title = 'Post Not Found | ZenBudget Blog';
    }
    document.documentElement.classList.add('landing-active');
    document.body.classList.add('landing-active');
    document.getElementById('root')?.classList.add('landing-root');
    window.scrollTo(0, 0);

    return () => {
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', 'https://zenbudget-tracker.vercel.app/zen_website.png');
      const twImage = document.querySelector('meta[name="twitter:image"]');
      if (twImage) twImage.setAttribute('content', 'https://zenbudget-tracker.vercel.app/zen_website.png');
      document.documentElement.classList.remove('landing-active');
      document.body.classList.remove('landing-active');
      document.getElementById('root')?.classList.remove('landing-root');
    };
  }, [post]);

  const handleBackToBlog = () => {
    window.history.pushState(null, '', '/blog');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error('Error sharing:', e);
    }
  };

  if (!post) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#070a0f',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Manrope", sans-serif',
        width: '100%'
      }}>
        <style>{`
          html, body, #root {
            overflow-y: auto !important;
            height: auto !important;
            min-height: 100vh !important;
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
            border-left: none !important;
            border-right: none !important;
            background: #070a0f !important;
          }
        `}</style>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <BookOpen size={36} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '12px' }}>Article Not Found</h1>
        <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '420px', marginBottom: '28px' }}>
          The article you are looking for may have been moved or updated.
        </p>
        <button
          onClick={handleBackToBlog}
          style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: '100px',
            fontSize: '15px',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer'
          }}
          className="hover-lift"
        >
          Browse All Articles
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: t.bg,
      color: t.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Manrope", sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: '100px',
      width: '100%',
      transition: 'background-color 0.25s ease, color 0.25s ease'
    }}>
      <style>{`
        html, body {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: auto !important;
          min-height: 100vh !important;
          display: block !important;
          background: ${t.bg} !important;
          color: ${t.text} !important;
          transition: background-color 0.25s ease, color 0.25s ease;
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
      {/* Background Ambient Glow */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(1200px, 100vw)',
        height: '400px',
        background: isDark 
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(16, 185, 129, 0.10) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Sticky Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        backgroundColor: t.headerBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${t.headerBorder}`,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.25s ease, border-color 0.25s ease'
      }}>
        <div style={{
          maxWidth: '1000px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Back to Blog & Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={handleBackToBlog}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: t.textSecondary,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                padding: '8px 0',
                transition: 'color 0.2s ease'
              }}
              className="hover-lift"
              title="Back to All Articles"
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: t.iconBtnBg,
                border: `1px solid ${t.iconBtnBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: t.iconBtnColor
              }}>
                <ArrowLeft size={16} />
              </div>
              <span className="desktop-only">All Articles</span>
            </button>

            <div
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/');
                  window.dispatchEvent(new Event('popstate'));
                }
                onBackToLanding();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              title="ZenBudget Home"
            >
              <img
                src="/icon.png"
                alt="ZenBudget Logo"
                style={{ width: '32px', height: '32px', borderRadius: '9px', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '16px', fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>
                ZenBudget
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: t.iconBtnBg,
                border: `1px solid ${t.iconBtnBorder}`,
                color: t.iconBtnColor,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              className="hover-lift"
            >
              {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
            </button>

            <button
              onClick={handleShare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '100px',
                backgroundColor: copied 
                  ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)') 
                  : t.iconBtnBg,
                border: copied ? '1px solid #10b981' : `1px solid ${t.iconBtnBorder}`,
                color: copied ? (isDark ? '#34d399' : '#059669') : t.text,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Share this guide"
              className="hover-lift"
            >
              {copied ? <Check size={15} color={isDark ? "#34d399" : "#059669"} /> : <Share2 size={15} />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

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
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '100px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
              className="hover-lift"
            >
              <span>Try App</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Article Container */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '110px 24px 40px', position: 'relative', zIndex: 10 }}>
        
        {/* Article Meta Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Category & Read Time */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span style={{
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: isDark ? '#34d399' : '#059669',
              fontSize: '11.5px',
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: '100px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              {post.category}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: t.textMuted,
              fontSize: '12px',
              fontWeight: 600
            }}>
              <Clock size={13} color="#10b981" />
              {post.readTime}
            </span>
          </div>

          {/* Article Title */}
          <h1 style={{
            fontSize: 'clamp(28px, 4.5vw, 44px)',
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            color: t.text,
            marginBottom: '20px'
          }}>
            {post.title}
          </h1>

          {/* Excerpt Lead */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: t.textMuted,
            lineHeight: 1.6,
            fontWeight: 500,
            maxWidth: '780px',
            margin: '0 auto 28px'
          }}>
            {post.excerpt}
          </p>

          {/* Author & Date Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            padding: '8px 18px',
            borderRadius: '100px',
            backgroundColor: t.metaPillBg,
            border: `1px solid ${t.metaPillBorder}`,
            boxShadow: !isDark ? '0 1px 4px rgba(0,0,0,0.04)' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800
              }}>
                {post.author.charAt(0)}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: t.text }}>{post.author}</div>
                {post.authorRole && (
                  <div style={{ fontSize: '11px', color: t.textMuted }}>{post.authorRole}</div>
                )}
              </div>
            </div>

            <div style={{ width: '1px', height: '18px', backgroundColor: t.divider }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: t.textMuted, fontWeight: 600 }}>
              <Calendar size={13} color="#10b981" />
              <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div style={{
          width: '100%',
          maxHeight: '460px',
          borderRadius: '28px',
          overflow: 'hidden',
          marginBottom: '44px',
          boxShadow: isDark ? '0 20px 50px rgba(0, 0, 0, 0.5)' : '0 15px 40px rgba(0,0,0,0.08)',
          border: `1px solid ${t.articleBorder}`
        }}>
          <img
            src={post.imageUrl}
            alt={`${post.title} — ZenBudget Personal Finance Guide`}
            loading="eager"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* Article Body */}
        <article style={{
          backgroundColor: t.articleBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${t.articleBorder}`,
          borderRadius: '32px',
          padding: 'clamp(28px, 5vw, 60px)',
          boxShadow: t.articleShadow,
          color: t.textSecondary,
          fontSize: '17px',
          lineHeight: 1.8,
          marginBottom: '56px'
        }}>
          <style>{`
            .zen-blog-article h2 {
              color: ${t.text};
              font-size: 26px;
              font-weight: 900;
              letter-spacing: -0.02em;
              margin-top: 40px;
              margin-bottom: 16px;
              line-height: 1.25;
              padding-bottom: 8px;
              border-bottom: 2px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.25)'};
            }
            .zen-blog-article h3 {
              color: ${isDark ? '#f1f5f9' : '#1e293b'};
              font-size: 20px;
              font-weight: 800;
              margin-top: 30px;
              margin-bottom: 12px;
            }
            .zen-blog-article p {
              margin-bottom: 22px;
              color: ${t.textSecondary};
            }
            .zen-blog-article strong {
              color: ${t.text};
              font-weight: 700;
            }
            .zen-blog-article ul, .zen-blog-article ol {
              margin-bottom: 26px;
              padding-left: 24px;
            }
            .zen-blog-article li {
              margin-bottom: 10px;
              color: ${t.textSecondary};
            }
            .zen-blog-article blockquote {
              border-left: 4px solid #10b981;
              background-color: ${isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)'};
              border-radius: 0 16px 16px 0;
              padding: 20px 24px;
              margin: 32px 0;
              font-style: italic;
              color: ${t.text};
              font-size: 18px;
              line-height: 1.6;
            }
            .zen-blog-article code {
              background: ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'};
              padding: 2px 8px;
              border-radius: 6px;
              font-size: 14px;
              color: ${isDark ? '#34d399' : '#059669'};
              border: 1px solid ${t.cardBorder};
            }
          `}</style>

          <div
            className="zen-blog-article"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags Footer */}
          <div style={{
            marginTop: '44px',
            paddingTop: '28px',
            borderTop: `1px solid ${t.divider}`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: t.textMuted, fontWeight: 700 }}>Tags:</span>
              {post.tags.map((tag) => (
                <span key={tag} style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '100px',
                  backgroundColor: t.tagBg,
                  color: t.tagText,
                  border: `1px solid ${t.tagBorder}`
                }}>
                  #{tag}
                </span>
              ))}
            </div>

            <button
              onClick={handleShare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '100px',
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: isDark ? '#34d399' : '#059669',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              className="hover-lift"
            >
              <Share2 size={13} />
              <span>Share Guide</span>
            </button>
          </div>
        </article>

        {/* Read Next Section */}
        {otherPosts.length > 0 && (
          <div style={{ marginBottom: '60px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: t.text, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#10b981" />
              <span>Read Next</span>
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {otherPosts.map((other) => (
                <div
                  key={other.id}
                  onClick={() => {
                    window.history.pushState(null, '', `/blog/${other.slug}`);
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  style={{
                    backgroundColor: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: '20px',
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    boxShadow: t.cardShadow
                  }}
                  className="hover-lift"
                >
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isDark ? '#34d399' : '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {other.category} · {other.readTime}
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: t.text, marginTop: '8px', lineHeight: 1.35 }}>
                      {other.title}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDark ? '#10b981' : '#059669', fontSize: '13px', fontWeight: 800, marginTop: '16px' }}>
                    <span>Read Article</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Banner */}
        <section style={{
          padding: '44px 32px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #064e3b 0%, #022c22 45%, #065f46 100%)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          boxShadow: '0 20px 50px rgba(6, 78, 59, 0.45)',
          textAlign: 'center'
        }}>
          <img
            src="/icon.png"
            alt="ZenBudget Logo"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '13px',
              objectFit: 'contain',
              margin: '0 auto 16px',
              display: 'block',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}
          />
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', marginBottom: '12px' }}>
            Take Control of Your Spending Today
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '15px', maxWidth: '540px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Track expenses effortlessly with AI insights, automated categorization, and complete data privacy.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (onOpenWebApp) onOpenWebApp();
                else {
                  window.history.pushState(null, '', '/#app');
                  window.dispatchEvent(new Event('popstate'));
                }
              }}
              style={{
                backgroundColor: '#ffffff',
                color: '#064e3b',
                padding: '14px 28px',
                borderRadius: '100px',
                fontSize: '15px',
                fontWeight: 900,
                border: 'none',
                cursor: 'pointer'
              }}
              className="hover-lift"
            >
              Open Web App
            </button>
            <a
              href={DISTRIBUTION_CONFIG.PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '14px 22px',
                borderRadius: '100px',
                fontSize: '14px',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              className="hover-lift"
            >
              <GooglePlayIcon size={16} />
              <span>Get on Google Play</span>
            </a>
          </div>
        </section>

      </main>
    </div>
  );
};

export default BlogPostView;
