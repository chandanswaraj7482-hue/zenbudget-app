import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  RewardAdPluginEvents,
  type BannerAdOptions,
  type AdOptions,
  type RewardAdOptions
} from '@capacitor-community/admob';
import { ADMOB_CONFIG } from '../config/admobConfig';

class AdMobService {
  private isInitialized = false;
  private bannerVisible = false;
  private lastInterstitialTime = 0;
  private actionCounter = 0;

  /**
   * Initializes Google AdMob SDK on native Android / iOS platforms.
   */
  public async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (this.isInitialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: ADMOB_CONFIG.IS_TESTING
      });
      this.isInitialized = true;
    } catch (err) {
      console.warn('AdMob: Failed to initialize:', err);
    }
  }

  /**
   * Displays bottom adaptive banner ad for free users.
   */
  public async showBanner(isPro: boolean = false): Promise<void> {
    if (!Capacitor.isNativePlatform() || isPro) return;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const options: BannerAdOptions = {
        adId: ADMOB_CONFIG.BANNER_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: ADMOB_CONFIG.IS_TESTING
      };

      await AdMob.showBanner(options);
      this.bannerVisible = true;
    } catch (err) {
      console.warn('AdMob: Failed to show banner:', err);
    }
  }

  /**
   * Hides bottom banner ad (e.g. when Pro user logs in).
   */
  public async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.bannerVisible) return;

    try {
      await AdMob.hideBanner();
      this.bannerVisible = false;
    } catch (err) {
      console.warn('AdMob: Failed to hide banner:', err);
    }
  }

  /**
   * Removes bottom banner completely from DOM / native layer.
   */
  public async removeBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.removeBanner();
      this.bannerVisible = false;
    } catch (err) {
      console.warn('AdMob: Failed to remove banner:', err);
    }
  }

  /**
   * Shows a full-screen interstitial ad with a minimum cooldown frequency cap.
   */
  public async showInterstitial(isPro: boolean = false, minIntervalMs: number = 180000): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || isPro) return false;

    const now = Date.now();
    if (now - this.lastInterstitialTime < minIntervalMs) {
      return false;
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const options: AdOptions = {
        adId: ADMOB_CONFIG.INTERSTITIAL_ID,
        isTesting: ADMOB_CONFIG.IS_TESTING
      };

      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
      this.lastInterstitialTime = Date.now();
      return true;
    } catch (err) {
      console.warn('AdMob: Interstitial failed to show:', err);
      return false;
    }
  }

  /**
   * Tracks user transactions or game sessions, triggering an interstitial every 4 actions.
   */
  public async recordActionAndMaybeShowAd(isPro: boolean = false): Promise<void> {
    if (!Capacitor.isNativePlatform() || isPro) return;
    this.actionCounter++;
    if (this.actionCounter >= 4) {
      this.actionCounter = 0;
      await this.showInterstitial(isPro, 120000);
    }
  }

  /**
   * Shows a rewarded video ad and executes callback once reward is earned.
   * On web fallback, immediately grants reward so UX remains seamless.
   */
  public async showRewardedAd(onRewarded: () => void): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      onRewarded();
      return true;
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const options: RewardAdOptions = {
        adId: ADMOB_CONFIG.REWARDED_ID,
        isTesting: ADMOB_CONFIG.IS_TESTING
      };

      await AdMob.prepareRewardVideoAd(options);

      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        onRewarded();
      });

      const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        rewardListener.remove();
        dismissListener.remove();
      });

      await AdMob.showRewardVideoAd();
      return true;
    } catch (err) {
      console.warn('AdMob: Rewarded ad failed, granting fallback reward:', err);
      onRewarded();
      return false;
    }
  }
}

export const admobService = new AdMobService();
