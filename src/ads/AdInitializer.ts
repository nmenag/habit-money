import mobileAds from 'react-native-google-mobile-ads';

export const initializeAds = async () => {
  try {
    await mobileAds().initialize();
  } catch (e) {
    console.error('Failed to initialize Ads', e);
  }
};
