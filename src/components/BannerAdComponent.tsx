import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from 'react-native-paper';
import { AdService } from '../ads/AdService';
import { useStore } from '../store/useStore';

export const BannerAdComponent = () => {
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const { isPremiumUser } = useStore();

  if (isPremiumUser) {
    return null;
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
          console.error('Banner Ad failed to load: ', error);
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
