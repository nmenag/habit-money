import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAppTheme, spacing, radius } from '../../theme/theme';
import { useTranslation } from '../../store/useStore';

interface AppLockScreenProps {
  isEnrolled: boolean;
  onUnlock: () => void;
}

export const AppLockScreen = ({ isEnrolled, onUnlock }: AppLockScreenProps) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const isDark = theme.dark;
  const surfaceColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <View style={styles.topSection}>
        <Image
          source={require('../../../assets/images/splash-icon.png')}
          style={styles.logo}
          contentFit="contain"
          priority="high"
        />
      </View>

      <View style={styles.centerSection}>
        <View
          style={[
            styles.lockIconContainer,
            { backgroundColor: surfaceColor, borderColor },
          ]}
        >
          <Ionicons
            name={isEnrolled ? 'finger-print-outline' : 'lock-closed-outline'}
            size={36}
            color={theme.colors.primary}
          />
        </View>

        <Text
          style={[styles.title, { color: theme.colors.onSurface }]}
          variant="headlineSmall"
        >
          {t('appLockTitle')}
        </Text>

        <Text
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          variant="bodyLarge"
        >
          {isEnrolled ? t('appLockSubtitle') : t('appLockNotEnrolled')}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        {isEnrolled ? (
          <View
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={t('appLockButton')}
          >
            <Text
              style={[styles.buttonLabel, { color: theme.colors.onPrimary }]}
              onPress={onUnlock}
            >
              {t('appLockButton')}
            </Text>
          </View>
        ) : (
          <View
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={t('appLockOpenSettings')}
          >
            <Text
              style={[styles.buttonLabel, { color: theme.colors.onPrimary }]}
              onPress={handleOpenSettings}
            >
              {t('appLockOpenSettings')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  topSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  logo: {
    width: 90,
    height: 90,
    opacity: 0.9,
  },
  centerSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  lockIconContainer: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.lg,
    width: '100%',
  },
  button: {
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
});
