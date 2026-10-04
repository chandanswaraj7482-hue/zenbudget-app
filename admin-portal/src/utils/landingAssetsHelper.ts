import { supabase } from '../supabaseClient';

export interface AssetConfig {
  id: string;
  label: string;
  section: string;
  description: string;
  defaultUrl: string;
  customUrl: string;
  customUrlDark: string;
  customUrlLight: string;
  useCustom: boolean;
  recommendedSize: string;
}

export interface LandingAssetsState {
  heroMockup1: AssetConfig;
  heroMockup2: AssetConfig;
  step1Mockup: AssetConfig;
  step2Mockup: AssetConfig;
  step3Mockup: AssetConfig;
  toolkitOcr: AssetConfig;
  toolkitCoach: AssetConfig;
  toolkitCouple: AssetConfig;
  aboutSanctuary: AssetConfig;
  ogBanner: AssetConfig;
}

function makeAsset(id: string, label: string, section: string, description: string, defaultUrl: string, recommendedSize: string): AssetConfig {
  return { id, label, section, description, defaultUrl, customUrl: '', customUrlDark: '', customUrlLight: '', useCustom: false, recommendedSize };
}

export const INITIAL_LANDING_ASSETS: LandingAssetsState = {
  heroMockup1: makeAsset(
    'heroMockup1',
    'Hero Phone 1 — Front Screen (Dashboard)',
    'Hero Section — Front Left Phone',
    'Front phone mockup on the landing page. Upload your app\'s Dashboard screenshot — it auto-fits inside the 3D iPhone frame with rounded corners & Dynamic Island.',
    'https://zenbudget-tracker.vercel.app/hero-mockup.png',
    '1080 × 2340 px (Mobile Screenshot)'
  ),
  heroMockup2: makeAsset(
    'heroMockup2',
    'Hero Phone 2 — Back Screen (Savings / Habits)',
    'Hero Section — Back Right Phone',
    'Secondary overlapping phone mockup. Upload your Streaks, Envelope, or Couple Feed screenshot — auto-fits in the 3D iPhone frame.',
    'https://zenbudget-tracker.vercel.app/images/toolkit_couple.jpg',
    '1080 × 2340 px (Mobile Screenshot)'
  ),
  step1Mockup: makeAsset(
    'step1Mockup',
    'Step 1: 60s Financial Check-In',
    'How ZenBudget Works (Step 01)',
    'Image for Step 1 onboarding. Toggle ON to replace the interactive quiz with your real screenshot.',
    'https://zenbudget-tracker.vercel.app/images/interactive_modules.jpg',
    '800 × 600 px (4:3 Ratio)'
  ),
  step2Mockup: makeAsset(
    'step2Mockup',
    'Step 2: AI Money Insights & Safe Limit',
    'How ZenBudget Works (Step 02)',
    'Image for Step 2 Insights & Envelope tracker. Toggle ON to use your real analytics screenshot.',
    'https://zenbudget-tracker.vercel.app/images/toolkit_coach.jpg',
    '800 × 600 px (4:3 Ratio)'
  ),
  step3Mockup: makeAsset(
    'step3Mockup',
    'Step 3: Daily Habit & Streak Tracker',
    'How ZenBudget Works (Step 03)',
    'Image for Step 3 Daily Hisab-Kitab and night streak keeper.',
    'https://zenbudget-tracker.vercel.app/images/toolkit_couple.jpg',
    '800 × 600 px (4:3 Ratio)'
  ),
  toolkitOcr: makeAsset(
    'toolkitOcr',
    'Toolkit Card 1: AI Smart OCR Scanner',
    'Zen Application Toolkit (Tab 1)',
    'Card visual for AI Camera Receipt & Invoice OCR Scanner.',
    'https://zenbudget-tracker.vercel.app/images/toolkit_ocr.jpg',
    '1200 × 900 px (4:3 Photo Ratio)'
  ),
  toolkitCoach: makeAsset(
    'toolkitCoach',
    'Toolkit Card 2: 24/7 AI Money Coach',
    'Zen Application Toolkit (Tab 2)',
    'Card visual for 24/7 AI Financial Coach & Safe Daily Limit chat.',
    'https://zenbudget-tracker.vercel.app/images/toolkit_coach.jpg',
    '1200 × 900 px (4:3 Photo Ratio)'
  ),
  toolkitCouple: makeAsset(
    'toolkitCouple',
    'Toolkit Card 3: Couple Shared Sync',
    'Zen Application Toolkit (Tab 3)',
    'Card visual for Couple Shared Sync & Household Transparency.',
    'https://zenbudget-tracker.vercel.app/images/toolkit_couple.jpg',
    '1200 × 900 px (4:3 Photo Ratio)'
  ),
  aboutSanctuary: makeAsset(
    'aboutSanctuary',
    'About Page: Financial Sanctuary Art',
    'About ZenBudget (#about Route)',
    'Main visual art in the About / Origin Story page.',
    'https://zenbudget-tracker.vercel.app/images/zen_sanctuary.jpg',
    '1200 × 900 px (4:3 Landscape)'
  ),
  ogBanner: makeAsset(
    'ogBanner',
    'Social Media & OpenGraph Banner',
    'SEO & Social Media Preview Cards',
    'Banner image shown when sharing ZenBudget on WhatsApp, Twitter, iMessage, and LinkedIn.',
    'https://zenbudget-tracker.vercel.app/og-banner.jpg',
    '1200 × 630 px (1.91:1 Social Ratio)'
  )
};

const STORAGE_KEY = 'zenbudget_landing_assets_config';

export function resolveAssetPreviewUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `https://zenbudget-tracker.vercel.app${url.startsWith('/') ? '' : '/'}${url}`;
}

function migrateAsset(saved: any, initial: AssetConfig): AssetConfig {
  return {
    ...initial,
    ...saved,
    customUrlDark: saved.customUrlDark || saved.customUrl || '',
    customUrlLight: saved.customUrlLight || saved.customUrl || '',
    customUrl: saved.customUrl || '',
  };
}

function migrateState(parsed: any): LandingAssetsState {
  const result = { ...INITIAL_LANDING_ASSETS };
  // Backwards compatibility: heroMockup -> heroMockup1
  if (parsed.heroMockup && !parsed.heroMockup1) {
    parsed.heroMockup1 = { ...parsed.heroMockup, id: 'heroMockup1' };
  }
  for (const key of Object.keys(INITIAL_LANDING_ASSETS) as Array<keyof LandingAssetsState>) {
    if (parsed[key]) {
      result[key] = migrateAsset(parsed[key], INITIAL_LANDING_ASSETS[key]);
    }
  }
  return result;
}

export function getLocalLandingAssets(): LandingAssetsState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return migrateState(JSON.parse(saved));
    }
  } catch (e) {
    console.error('Failed to parse local landing assets config:', e);
  }
  return INITIAL_LANDING_ASSETS;
}

export function saveLocalLandingAssets(assets: LandingAssetsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (e) {
    console.error('Failed to save local landing assets config:', e);
  }
}

export async function fetchRemoteLandingAssets(): Promise<LandingAssetsState> {
  const local = getLocalLandingAssets();
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'landing_assets_config')
      .maybeSingle();

    if (!error && data?.value) {
      const merged = migrateState(data.value);
      saveLocalLandingAssets(merged);
      return merged;
    }
  } catch (e) {
    console.warn('Could not fetch remote landing assets, using local cache:', e);
  }
  return local;
}

export async function saveRemoteLandingAssets(assets: LandingAssetsState): Promise<boolean> {
  saveLocalLandingAssets(assets);
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'landing_assets_config', value: assets, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    return !error;
  } catch (e) {
    console.error('Error saving remote landing assets:', e);
    return false;
  }
}

/**
 * Get the correct custom URL for the current theme.
 * If the user uploaded separate dark/light screenshots, it picks the right one.
 * Falls back to generic customUrl, then defaultUrl.
 */
export function getThemedAssetUrl(assets: LandingAssetsState, assetKey: keyof LandingAssetsState, isDark: boolean): string {
  const item = assets[assetKey];
  if (!item || !item.useCustom) return item?.defaultUrl || '';
  
  // Pick theme-specific URL first
  const themedUrl = isDark ? item.customUrlDark : item.customUrlLight;
  if (themedUrl) return themedUrl;
  
  // Fallback to generic customUrl
  if (item.customUrl) return item.customUrl;
  
  return item.defaultUrl || '';
}

export function getAssetUrl(assets: LandingAssetsState, assetKey: keyof LandingAssetsState): string {
  const item = assets[assetKey];
  if (item && item.useCustom && item.customUrl) {
    return item.customUrl;
  }
  return item?.defaultUrl || '';
}
