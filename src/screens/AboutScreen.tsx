import Constants from 'expo-constants';
import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../store/useStore';

export const AboutScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  const appName = Constants.expoConfig?.name || 'Habit Money';
  const version = Constants.expoConfig?.version;

  const handleEmail = () => {
    Linking.openURL(`mailto:${t('contactEmailAddress')}`).catch((err) =>
      console.error("Couldn't send email", err),
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
        />
        <Text variant="headlineMedium" style={styles.appName}>
          {appName}
        </Text>
        <Text variant="bodyLarge" style={styles.appDescription}>
          {t('appDescription')}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text variant="labelLarge" style={styles.infoLabel}>
            {t('version')}
          </Text>
          <Text variant="bodyMedium" style={styles.infoValue}>
            {version}
          </Text>
        </View>

        <Divider style={{ opacity: 0.5 }} />

        <TouchableOpacity
          style={styles.infoRow}
          onPress={handleEmail}
          activeOpacity={0.7}
        >
          <Text variant="labelLarge" style={styles.infoLabel}>
            {t('contactEmailLabel')}
          </Text>
          <Text variant="bodyMedium" style={styles.link}>
            {t('contactEmailAddress')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.copyright}>
          © {new Date().getFullYear()}
        </Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoImage: {
      width: 96,
      height: 96,
      borderRadius: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    appName: {
      fontWeight: '900',
      color: theme.colors.onBackground,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    appDescription: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      lineHeight: 24,
      paddingHorizontal: 16,
    },
    divider: {
      marginBottom: 32,
      opacity: 0.5,
    },
    infoSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
    },
    infoLabel: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    infoValue: {
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    link: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    footer: {
      marginTop: 48,
      alignItems: 'center',
    },
    copyright: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
  });
