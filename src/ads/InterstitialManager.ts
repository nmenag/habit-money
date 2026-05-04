import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { AdService } from './AdService';

class InterstitialManager {
  private interstitial: InterstitialAd | null = null;
  private adUnitId: string;
  private loaded: boolean = false;

  constructor() {
    this.adUnitId = AdService.getInterstitialId();
  }

  public init() {
    if (this.interstitial) return;

    this.interstitial = InterstitialAd.createForAdRequest(this.adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      this.loaded = true;
      console.log('Interstitial Ad Loaded');
    });

    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      this.loaded = false;
      this.load();
    });

    this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Interstitial Ad Error: ', error);
      this.loaded = false;
    });

    this.load();
  }

  public load() {
    if (this.interstitial && !this.loaded) {
      this.interstitial.load();
    }
  }

  public async show() {
    if (this.loaded && this.interstitial) {
      try {
        await this.interstitial.show();
      } catch (error) {
        console.error('Failed to show Interstitial Ad:', error);
        this.load();
      }
    } else {
      console.log('Interstitial Ad not loaded yet');
      this.load();
    }
  }

  public isLoaded() {
    return this.loaded;
  }
}

export const interstitialManager = new InterstitialManager();
