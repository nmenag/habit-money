import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import * as ExpoSplashScreen from 'expo-splash-screen';

export const SplashScreen = () => {
  const theme = useTheme();

  const logoOpacity = useRef(new Animated.Value(0.85)).current;
  const progressTranslation = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    // Hide the native splash screen immediately on mount so the custom animated JS splash is visible
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

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
    width: 150,
    height: 150,
  },
  progressTrack: {
    width: 120,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 36,
    position: 'relative',
  },
  progressBar: {
    width: 40,
    height: 2,
    borderRadius: 1,
    position: 'absolute',
    left: 0,
  },
});
