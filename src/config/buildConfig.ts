/**
 * 🚀 ZenBudget Build & Distribution Configuration
 * 
 * Supports dual distribution strategy:
 * 1. 'website_apk': Direct APK hosted on website with Cashfree Payment Gateway (0% Google fee, instant UPI).
 * 2. 'playstore': Google Play Store build with Google Play In-App Billing (Google Play Protect verified).
 */

export const DISTRIBUTION_CONFIG = {
  // Official Play Store Listing Link
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=app.zenbudget.app',

  // Package / Application Identifier
  APP_PACKAGE_ID: 'app.zenbudget.app',

  // Direct APK Download Endpoint
  DIRECT_APK_URL: '/zenbudget.apk',

  // Direct APK CDN / Raw Fallback
  DIRECT_APK_FALLBACK_URL: 'https://raw.githubusercontent.com/chandanswaraj7482-hue/zenbudget-app/main/public/zenbudget.apk',

  // Current Target: 'website_apk' | 'playstore'
  BUILD_TARGET: (import.meta.env.VITE_BUILD_TARGET as 'website_apk' | 'playstore') || 'website_apk',
};

export const isPlayStoreBuild = (): boolean => {
  return DISTRIBUTION_CONFIG.BUILD_TARGET === 'playstore';
};

export const isWebsiteApkBuild = (): boolean => {
  return DISTRIBUTION_CONFIG.BUILD_TARGET === 'website_apk';
};
