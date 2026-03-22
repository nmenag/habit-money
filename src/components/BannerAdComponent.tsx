import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from 'react-native-paper';
import { AdService } from '../ads/AdService';
import { useStore } from '../store/useStore';

export const BannerAdComponent = () => {
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const isPremiumUser = useStore((s) => s.isPremiumUser);
  const [showAd, setShowAd] = React.useState(false);

  React.useEffect(() => {
    // Delay ad loading by 1 second to prioritize main UI
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isPremiumUser || !showAd) {
    return <View style={{ height: 0 }} />;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AdService.getBannerId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          if (__DEV__) console.warn('Banner Ad failed to load: ', error);
        }}
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
  });
