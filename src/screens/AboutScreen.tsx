import Constants from 'expo-constants';
import React from 'react';
import {
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

  const appName = Constants.expoConfig?.name || 'FinHabit';
  const version = Constants.expoConfig?.version || '1.0.0';
  const contactEmail = 'nmena.garzon@gmail.com';

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err),
    );
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${contactEmail}`).catch((err) =>
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
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>FH</Text>
        </View>
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
          <Text variant="bodyMedium">{version}</Text>
        </View>

        <TouchableOpacity style={styles.infoRow} onPress={handleEmail}>
          <Text variant="labelLarge" style={styles.infoLabel}>
            {t('contactEmail')}
          </Text>
          <Text variant="bodyMedium" style={styles.link}>
            {contactEmail}
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
      marginBottom: 32,
    },
    logoPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    logoText: {
      color: 'white',
      fontSize: 32,
      fontWeight: 'bold',
    },
    appName: {
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 12,
    },
    appDescription: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      lineHeight: 22,
    },
    divider: {
      marginBottom: 24,
    },
    infoSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      elevation: 1,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    infoLabel: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    link: {
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    footer: {
      marginTop: 40,
      alignItems: 'center',
    },
    copyright: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
    },
  });
