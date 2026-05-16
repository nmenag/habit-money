import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdService } from '../../ads/AdService';

interface BannerAdProps {
  offset?: number;
}

export const BannerAdComponent = ({ offset = 0 }: BannerAdProps) => {
  const [showAd] = React.useState(true);
  const [loadError] = React.useState(false);
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = defaultStyles(theme, insets, offset);

  const adUnitId = AdService.getBannerId();

  if (!showAd || !adUnitId || loadError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
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

const defaultStyles = (theme: any, insets: any, offset: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: offset,
      left: 0,
      right: 0,
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingBottom: insets.bottom > 0 && offset === 0 ? insets.bottom : 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      elevation: 5,
    },
  });
