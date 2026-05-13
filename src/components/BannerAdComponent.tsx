import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from 'react-native-paper';
import { AdService } from '../ads/AdService';

export const BannerAdComponent = () => {
  const theme = useTheme();
  const styles = defaultStyles(theme);

  const [showAd, setShowAd] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const adUnitId = AdService.getBannerId();

  if (!showAd || !adUnitId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
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
