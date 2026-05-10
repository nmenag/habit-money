import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../store/useStore';

export const PrivacyPolicyScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  const POLICY_SECTIONS = [
    {
      title: t('dataCollectionTitle'),
      content: t('dataCollectionContent'),
    },
    {
      title: t('howDataIsUsedTitle'),
      content: t('howDataIsUsedContent'),
    },
    {
      title: t('localStorageTitle'),
      content: t('localStorageContent'),
    },
    {
      title: t('thirdPartyTitle'),
      content: t('thirdPartyContent'),
      showLink: true,
    },
    {
      title: t('userRightsTitle'),
      content: t('userRightsContent'),
    },
    {
      title: t('contactInfoTitle'),
      content: t('contactInfoContent'),
      showEmail: true,
    },
  ];

  const handleOpenPolicy = () => {
    Linking.openURL(t('adMobPrivacyUrl'));
  };

  const handleSendEmail = () => {
    Linking.openURL(`mailto:${t('contactEmailAddress')}`);
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
        <Text variant="headlineSmall" style={styles.title}>
          {t('privacyPolicy')}
        </Text>
        <Text variant="bodySmall" style={styles.lastUpdated}>
          {t('lastUpdated') || 'Last Updated'}: {t('lastUpdatedDate')}
        </Text>
      </View>

      <Divider style={styles.divider} />

      {POLICY_SECTIONS.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {section.title}
          </Text>
          <Text variant="bodyMedium" style={styles.sectionContent}>
            {section.content}
          </Text>
          {section.showLink && (
            <Text
              variant="bodyMedium"
              style={styles.link}
              onPress={handleOpenPolicy}
            >
              {t('viewAdMobPrivacy')}
            </Text>
          )}
          {section.showEmail && (
            <Text
              variant="bodyMedium"
              style={styles.link}
              onPress={handleSendEmail}
            >
              {t('contactEmailAddress')}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontWeight: '900',
      color: theme.colors.onBackground,
      letterSpacing: 0.5,
    },
    lastUpdated: {
      marginTop: 8,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    divider: {
      marginBottom: 32,
      opacity: 0.5,
    },
    section: {
      marginBottom: 36,
    },
    sectionTitle: {
      marginBottom: 12,
      fontWeight: '800',
      color: theme.colors.onSurface,
      letterSpacing: 0.3,
    },
    sectionContent: {
      lineHeight: 24,
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
    },
    link: {
      marginTop: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    footer: {
      marginTop: 24,
      alignItems: 'center',
    },
    footerText: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
      fontStyle: 'italic',
    },
  });
