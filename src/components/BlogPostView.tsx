import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, User, ArrowRight, Share2, Sparkles, Clock, Check, BookOpen, ShieldCheck } from 'lucide-react';
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
  const post = blogPosts.find(p => p.slug === slug);

  // Other related posts
  const otherPosts = blogPosts.filter(p => p.slug !== slug).slice(0, 2);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | ZenBudget Blog`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', post.excerpt);
      }
    } else {
      document.title = 'Post Not Found | ZenBudget Blog';
    }
    window.scrollTo(0, 0);
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Manrope", sans-serif'
      }}>
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
      backgroundColor: '#070a0f',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Manrope", sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: '100px'
    }}>
      {/* Background Ambient Glow */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(1200px, 100vw)',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
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
        backgroundColor: 'rgba(7, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center'
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
          {/* Back to Blog */}
          <button
            onClick={handleBackToBlog}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              padding: '8px 0',
              transition: 'color 0.2s ease'
            }}
            className="hover-lift"
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowLeft size={16} />
            </div>
            <span>All Articles</span>
          </button>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleShare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '100px',
                backgroundColor: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: copied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                color: copied ? '#34d399' : '#e2e8f0',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Share this guide"
              className="hover-lift"
            >
              {copied ? <Check size={15} color="#34d399" /> : <Share2 size={15} />}
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
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
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
              color: '#94a3b8',
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
            color: '#ffffff',
            marginBottom: '20px'
          }}>
            {post.title}
          </h1>

          {/* Excerpt Lead */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: '#94a3b8',
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
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
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
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{post.author}</div>
                {post.authorRole && (
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{post.authorRole}</div>
                )}
              </div>
            </div>

            <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
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
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* Article Body */}
        <article style={{
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '32px',
          padding: 'clamp(28px, 5vw, 60px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          color: '#cbd5e1',
          fontSize: '17px',
          lineHeight: 1.8,
          marginBottom: '56px'
        }}>
          <style>{`
            .zen-blog-article h2 {
              color: #ffffff;
              font-size: 26px;
              font-weight: 900;
              letter-spacing: -0.02em;
              margin-top: 40px;
              margin-bottom: 16px;
              line-height: 1.25;
              padding-bottom: 8px;
              border-bottom: 2px solid rgba(16, 185, 129, 0.2);
            }
            .zen-blog-article h3 {
              color: #f1f5f9;
              font-size: 20px;
              font-weight: 800;
              margin-top: 30px;
              margin-bottom: 12px;
            }
            .zen-blog-article p {
              margin-bottom: 22px;
              color: #cbd5e1;
            }
            .zen-blog-article strong {
              color: #ffffff;
              font-weight: 700;
            }
            .zen-blog-article ul, .zen-blog-article ol {
              margin-bottom: 26px;
              padding-left: 24px;
            }
            .zen-blog-article li {
              margin-bottom: 10px;
              color: #cbd5e1;
            }
            .zen-blog-article blockquote {
              border-left: 4px solid #10b981;
              background-color: rgba(16, 185, 129, 0.08);
              border-radius: 0 16px 16px 0;
              padding: 20px 24px;
              margin: 32px 0;
              font-style: italic;
              color: #f1f5f9;
              font-size: 18px;
              line-height: 1.6;
            }
            .zen-blog-article code {
              background: rgba(255,255,255,0.08);
              padding: 2px 8px;
              border-radius: 6px;
              font-size: 14px;
              color: #34d399;
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
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Tags:</span>
              {post.tags.map((tag) => (
                <span key={tag} style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '100px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
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
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
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
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    backgroundColor: 'rgba(17, 24, 39, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover-lift"
                >
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {other.category} · {other.readTime}
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '8px', lineHeight: 1.35 }}>
                      {other.title}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '13px', fontWeight: 800, marginTop: '16px' }}>
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
