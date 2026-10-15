import React from 'react';
import App from './App';
import LandingPage from './components/LandingPage';
import { BlogView } from './components/BlogView';
import { BlogPostView } from './components/BlogPostView';
import { Capacitor } from '@capacitor/core';

export default function Root() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const isNativeOrInstalled = (
    Capacitor.isNativePlatform() ||
    (typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.location.search.includes('source=pwa')
    ))
  );

  // Dedicated Web App domain or native/PWA opens the Web App directly
  const isWebAppDomain = (
    isNativeOrInstalled ||
    hostname.includes('zenbudget-tracker-app') ||
    pathname.startsWith('/app')
  );

  const handleOpenWebApp = () => {
    window.location.href = 'https://zenbudget-tracker-app.vercel.app';
  };

  const handleBackToLanding = () => {
    window.location.href = 'https://zenbudget-tracker.vercel.app';
  };

  if (isWebAppDomain) {
    return <App onBackToLanding={handleBackToLanding} />;
  }

  // Dedicated Landing Page domain (https://zenbudget-tracker.vercel.app)
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/blog') {
    return <BlogView onBackToLanding={handleBackToLanding} onOpenWebApp={handleOpenWebApp} />;
  }
  if (normalizedPath.startsWith('/blog/')) {
    const slug = normalizedPath.replace('/blog/', '');
    return <BlogPostView slug={slug} onBackToLanding={handleBackToLanding} onOpenWebApp={handleOpenWebApp} />;
  }

  return <LandingPage onOpenWebApp={handleOpenWebApp} />;
}
