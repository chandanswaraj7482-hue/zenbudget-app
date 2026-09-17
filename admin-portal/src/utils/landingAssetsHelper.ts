import { supabase } from '../supabaseClient';

export interface AssetConfig {
  id: string;
  label: string;
  section: string;
  description: string;
  defaultUrl: string;
  customUrl: string;
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

export const INITIAL_LANDING_ASSETS: LandingAssetsState = {
  heroMockup1: {
    id: 'heroMockup1',
    label: 'Hero Phone 1: Front Main Screen (Dashboard / Net Worth)',
    section: 'Hero Header Section (Front Left Phone)',
    description: 'Front mobile mockup. Upload your application dashboard screenshot — ZenBudget auto-fits it with rounded corners & Dynamic Island notch.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/hero-mockup.png',
    customUrl: '',
    useCustom: false,
    recommendedSize: '1080 x 2340 px (Mobile 9:19.5 Screenshot)'
  },
  heroMockup2: {
    id: 'heroMockup2',
    label: 'Hero Phone 2: Back Screen (Savings Feed / Habits)',
    section: 'Hero Header Section (Back Right Phone)',
    description: 'Secondary overlapping phone mockup. Upload your streaks, envelopes, or couple feed screenshot.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/images/toolkit_couple.jpg',
    customUrl: '',
    useCustom: false,
    recommendedSize: '1080 x 2340 px (Mobile 9:19.5 Screenshot)'
  },
  step1Mockup: {
    id: 'step1Mockup',
    label: 'Step 1: 60s Financial Check-In Mockup',
    section: 'How ZenBudget Works (Step 01)',
    description: 'Image displayed for Step 1 Check-in & onboarding assessment. Toggle ON to replace the interactive quiz mockup with your real screenshot.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/images/interactive_modules.jpg',
    customUrl: '',
    useCustom: false,
    recommendedSize: '800 x 600 px (4:3 Ratio)'
  },
  step2Mockup: {
    id: 'step2Mockup',
    label: 'Step 2: AI Money Insights & Safe Limit Mockup',
    section: 'How ZenBudget Works (Step 02)',
    description: 'Image displayed for Step 2 Insights & Envelope tracker. Toggle ON to replace interactive charts with your real analytics screenshot.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/images/toolkit_coach.jpg',
    customUrl: '',
    useCustom: false,
    recommendedSize: '800 x 600 px (4:3 Ratio)'
  },
  step3Mockup: {
    id: 'step3Mockup',
    label: 'Step 3: Daily Habit & Streak Tracker Mockup',
    section: 'How ZenBudget Works (Step 03)',
    description: 'Image displayed for Step 3 Daily Hisab-Kitab and night streak keeper.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/images/toolkit_couple.jpg',
    customUrl: '',
    useCustom: false,
    recommendedSize: '800 x 600 px (4:3 Ratio)'
  },
  toolkitOcr: {
    id: 'toolkitOcr',
    label: 'Toolkit Card 1: AI Smart OCR Scanner',
    section: 'Zen Application Toolkit (Tab 1)',
    description: 'Card visual artwork for AI Camera Receipt & Invoice OCR Scanner.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/images/toolkit_ocr.jpg',
    customUrl: '',
    useCustom: false,
    recommendedSize: '1200 x 900 px (4:3 Photo Ratio)'
  },
  toolkitCoach: {
    id: 'toolkitCoach',
    label: 'Toolkit Card 2: 24/7 AI Money Coach',
    section: 'Zen Application Toolkit (Tab 2)',
    description: 'Card visual artwork for 24/7 AI Financial Coach & Safe Daily Limit chat.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/images/toolkit_coach.jpg',
    customUrl: '',
    useCustom: false,
    recommendedSize: '1200 x 900 px (4:3 Photo Ratio)'
  },
  toolkitCouple: {
    id: 'toolkitCouple',
    label: 'Toolkit Card 3: Couple Shared Sync',
    section: 'Zen Application Toolkit (Tab 3)',
    description: 'Card visual artwork for Couple Shared Sync & Household Transparency.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/images/toolkit_couple.jpg',
    customUrl: '',
    useCustom: false,
    recommendedSize: '1200 x 900 px (4:3 Photo Ratio)'
  },
  aboutSanctuary: {
    id: 'aboutSanctuary',
    label: 'About Page: Financial Sanctuary Art',
    section: 'About ZenBudget (#about Route)',
    description: 'Main visual art in the right-side card of the About / Origin Story page.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/images/zen_sanctuary.jpg',
    customUrl: '',
    useCustom: false,
    recommendedSize: '1200 x 900 px (4:3 Landscape)'
  },
  ogBanner: {
    id: 'ogBanner',
    label: 'Social Media & OpenGraph Banner',
    section: 'SEO & Social Media Preview Cards',
    description: 'Banner image shown when sharing ZenBudget on WhatsApp, Twitter, iMessage, and LinkedIn.',
    defaultUrl: 'https://zenbudget-tracker.vercel.app/og-banner.jpg',
    customUrl: '',
    useCustom: false,
    recommendedSize: '1200 x 630 px (1.91:1 Social Ratio)'
  }
};

const STORAGE_KEY = 'zenbudget_landing_assets_config';

export function resolveAssetPreviewUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `https://zenbudget-tracker.vercel.app${url.startsWith('/') ? '' : '/'}${url}`;
}

export function getLocalLandingAssets(): LandingAssetsState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Backwards compatibility migration for heroMockup -> heroMockup1
      if (parsed.heroMockup && !parsed.heroMockup1) {
        parsed.heroMockup1 = { ...INITIAL_LANDING_ASSETS.heroMockup1, ...parsed.heroMockup, id: 'heroMockup1' };
      }
      return { ...INITIAL_LANDING_ASSETS, ...parsed };
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
      const remote = data.value;
      if (remote.heroMockup && !remote.heroMockup1) {
        remote.heroMockup1 = { ...INITIAL_LANDING_ASSETS.heroMockup1, ...remote.heroMockup, id: 'heroMockup1' };
      }
      const merged = { ...INITIAL_LANDING_ASSETS, ...remote };
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

export function getAssetUrl(assets: LandingAssetsState, assetKey: keyof LandingAssetsState): string {
  const item = assets[assetKey];
  if (item && item.useCustom && item.customUrl) {
    return item.customUrl;
  }
  return item?.defaultUrl || '';
}
