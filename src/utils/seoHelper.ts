/**
 * Advanced Dynamic SEO & Schema.org Rich Snippet Manager
 * Ensures 100% Google, Bing, Social Media (OG/Twitter), and AI Search (Perplexity/ChatGPT) compliance.
 */

export interface ArticleSEOMeta {
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  authorRole?: string;
  section?: string;
  tags?: string[];
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  articleMeta?: ArticleSEOMeta;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_SEO = {
  title: 'ZenBudget — #1 AI Expense Tracker, Daily Budget Planner & Bank Statement Scanner App India',
  description: "ZenBudget (ZenBudget Tracker) is India's #1 AI Expense Tracker, Daily Budget Planner & Bank Statement Scanner. Kharcha track karo, UPI transactions auto-detect karo, daily safe spending limit pao, impulse buys roko. Free Android APK download & Instant Web App.",
  keywords: 'ZenBudget, zenbudget tracker, zen budget tracker, zen budget, ZenBudget app, ZenBudget AI, download zenbudget apk, best expense tracker app India 2026, daily budget planner app, bank statement analyzer, passbook scanner app, UPI kharcha tracker, hisab kitab app, couple budget sync, impulse buy blocker',
  canonicalUrl: 'https://zenbudget-tracker.vercel.app/',
  ogImage: 'https://zenbudget-tracker.vercel.app/og-banner.png',
  ogType: 'website' as const,
};

function setOrCreateMeta(name: string, content: string, isProperty = false) {
  const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    if (isProperty) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOrCreateCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

/**
 * Updates page SEO tags dynamically and returns a restore function
 */
export function updatePageSEO(config: SEOConfig): () => void {
  if (typeof document === 'undefined') return () => {};

  const title = config.title || DEFAULT_SEO.title;
  const description = config.description || DEFAULT_SEO.description;
  const keywords = config.keywords || DEFAULT_SEO.keywords;
  const canonicalUrl = config.canonicalUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0].split('#')[0] : DEFAULT_SEO.canonicalUrl);
  const ogImage = config.ogImage || DEFAULT_SEO.ogImage;
  const ogType = config.ogType || DEFAULT_SEO.ogType;

  // 1. Title
  document.title = title;

  // 2. Standard Meta
  setOrCreateMeta('title', title);
  setOrCreateMeta('description', description);
  if (keywords) setOrCreateMeta('keywords', keywords);

  // 3. Canonical Link
  setOrCreateCanonical(canonicalUrl);

  // 4. OpenGraph Tags
  setOrCreateMeta('og:title', title, true);
  setOrCreateMeta('og:description', description, true);
  setOrCreateMeta('og:url', canonicalUrl, true);
  setOrCreateMeta('og:image', ogImage, true);
  setOrCreateMeta('og:type', ogType, true);
  setOrCreateMeta('og:site_name', 'ZenBudget Tracker', true);

  if (ogType === 'article' && config.articleMeta) {
    if (config.articleMeta.publishedTime) {
      setOrCreateMeta('article:published_time', config.articleMeta.publishedTime, true);
    }
    if (config.articleMeta.author) {
      setOrCreateMeta('article:author', config.articleMeta.author, true);
    }
    if (config.articleMeta.section) {
      setOrCreateMeta('article:section', config.articleMeta.section, true);
    }
  }

  // 5. Twitter Card Tags
  setOrCreateMeta('twitter:card', 'summary_large_image');
  setOrCreateMeta('twitter:title', title);
  setOrCreateMeta('twitter:description', description);
  setOrCreateMeta('twitter:url', canonicalUrl);
  setOrCreateMeta('twitter:image', ogImage);

  // 6. JSON-LD Dynamic Schema
  const SCRIPT_ID = 'zenbudget-dynamic-ld';
  let scriptEl = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = SCRIPT_ID;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  if (config.jsonLd) {
    scriptEl.text = JSON.stringify(config.jsonLd);
  } else {
    // Default Breadcrumb / WebPage schema
    scriptEl.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': title,
      'description': description,
      'url': canonicalUrl
    });
  }

  // Return Cleanup / Restore function
  return () => {
    document.title = DEFAULT_SEO.title;
    setOrCreateMeta('title', DEFAULT_SEO.title);
    setOrCreateMeta('description', DEFAULT_SEO.description);
    setOrCreateMeta('keywords', DEFAULT_SEO.keywords);
    setOrCreateCanonical(DEFAULT_SEO.canonicalUrl);
    setOrCreateMeta('og:title', DEFAULT_SEO.title, true);
    setOrCreateMeta('og:description', DEFAULT_SEO.description, true);
    setOrCreateMeta('og:url', DEFAULT_SEO.canonicalUrl, true);
    setOrCreateMeta('og:image', DEFAULT_SEO.ogImage, true);
    setOrCreateMeta('og:type', DEFAULT_SEO.ogType, true);
    setOrCreateMeta('twitter:title', DEFAULT_SEO.title);
    setOrCreateMeta('twitter:description', DEFAULT_SEO.description);
    setOrCreateMeta('twitter:url', DEFAULT_SEO.canonicalUrl);
    setOrCreateMeta('twitter:image', DEFAULT_SEO.ogImage);

    // Remove dynamic script
    const currentScript = document.getElementById(SCRIPT_ID);
    if (currentScript && currentScript.parentNode) {
      currentScript.parentNode.removeChild(currentScript);
    }
  };
}
