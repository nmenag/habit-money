import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../store/useStore';

export const SplashScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const logoOpacity = useRef(new Animated.Value(0.85)).current;
  const progressTranslation = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    const logoBreathing = Animated.loop(
      Animated.sequence([
        Animated.timing(logoOpacity, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0.75,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    logoBreathing.start();

    const progressSliding = Animated.loop(
      Animated.timing(progressTranslation, {
        toValue: 120,
        duration: 1600,
        useNativeDriver: true,
      }),
    );
    progressSliding.start();

    return () => {
      logoBreathing.stop();
      progressSliding.stop();
    };
  }, [logoOpacity, progressTranslation]);

  const isDark = theme.dark;
  const trackBgColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.05)';

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.centerContent}>
        <Animated.View style={{ opacity: logoOpacity, alignItems: 'center' }}>
          <Image
            source={require('../../../assets/images/splash-icon.png')}
            style={styles.logo}
            contentFit="contain"
            priority="high"
          />
          <Text
            variant="titleMedium"
            style={[styles.appName, { color: theme.colors.onBackground }]}
          >
            Habit Money
          </Text>
        </Animated.View>

        <View style={[styles.progressTrack, { backgroundColor: trackBgColor }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.colors.primary,
                transform: [{ translateX: progressTranslation }],
              },
            ]}
          />
        </View>

        <Text
          variant="bodySmall"
          style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('loadingApp') || 'Initializing...'}
        </Text>
      </View>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <View style={styles.secureRow}>
          <Ionicons
            name="shield-checkmark"
            size={12}
            color={theme.colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text
            variant="labelSmall"
            style={[
              styles.secureText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            SECURE LOCAL LEDGER
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    fontSize: 22,
    letterSpacing: -0.2,
  },
  progressTrack: {
    width: 120,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 32,
    position: 'relative',
  },
  progressBar: {
    width: 40,
    height: 2,
    borderRadius: 1,
    position: 'absolute',
    left: 0,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    fontSize: 12,
    marginTop: 12,
    opacity: 0.6,
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  secureText: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
