import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

export const AD_UNIT_IDS = {
  BANNER: Platform.select({
    ios: 'ca-app-pub-xxxxxxxx/banner-ios',
    android: 'ca-app-pub-xxxxxxxx/banner-android',
    default: TestIds.BANNER,
  }),
  INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-xxxxxxxx/interstitial-ios',
    android: 'ca-app-pub-xxxxxxxx/interstitial-android',
    default: TestIds.INTERSTITIAL,
  }),
};

export const DEV_AD_UNIT_IDS = {
  BANNER: TestIds.BANNER,
  INTERSTITIAL: TestIds.INTERSTITIAL,
};

export const AdService = {
  getBannerId: () => (__DEV__ ? DEV_AD_UNIT_IDS.BANNER : AD_UNIT_IDS.BANNER),
  getInterstitialId: () =>
    __DEV__ ? DEV_AD_UNIT_IDS.INTERSTITIAL : AD_UNIT_IDS.INTERSTITIAL,
};
