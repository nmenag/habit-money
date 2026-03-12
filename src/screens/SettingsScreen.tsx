import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore, useTranslation } from '../store/useStore';
import { exportTransactionsToCSV } from '../utils/csvExport';
import { BannerAdComponent } from '../components/BannerAdComponent';

export const SettingsScreen = ({ navigation }: any) => {
  const {
    setLanguage,
    transactions,
    accounts,
    categories,
    isPremiumUser,
    setPremium,
    incrementActionCounter,
    checkAndShowAd,
  } = useStore();
  const { t, language } = useTranslation();

  const handleExport = async () => {
    await exportTransactionsToCSV(transactions, accounts, categories);
    incrementActionCounter();
    checkAndShowAd();
  };

  const SETTINGS_LINKS = [
    { name: t('manageAccounts'), icon: 'wallet-outline', screen: 'Accounts' },
    {
      name: t('manageCategories'),
      icon: 'pricetags-outline',
      screen: 'Categories',
    },
    { name: t('manageBudgets'), icon: 'pie-chart-outline', screen: 'Budgets' },
  ];

  const LANGUAGES = [
    { code: 'en', name: t('english'), label: 'EN' },
    { code: 'es', name: t('spanish'), label: 'ES' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('preferences')}</Text>
        <View style={styles.optionsContainer}>
          {SETTINGS_LINKS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.option}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.optionInfo}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color="#555"
                  style={styles.menuIcon}
                />
                <Text style={styles.optionText}>{item.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('premium')}</Text>
        <View style={styles.optionsContainer}>
          <View style={styles.option}>
            <View style={styles.optionInfo}>
              <Ionicons
                name={isPremiumUser ? 'star' : 'star-outline'}
                size={24}
                color={isPremiumUser ? '#f1c40f' : '#555'}
                style={styles.menuIcon}
              />
              <Text style={styles.optionText}>
                {isPremiumUser ? t('premiumVersion') : t('freeVersion')}
              </Text>
            </View>
            <Switch
              value={isPremiumUser}
              onValueChange={setPremium}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isPremiumUser ? '#2196f3' : '#f4f3f4'}
            />
          </View>
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionInfoText}>{t('premiumDesc')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings')}</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.option} onPress={handleExport}>
            <View style={styles.optionInfo}>
              <Ionicons
                name="download-outline"
                size={24}
                color="#555"
                style={styles.menuIcon}
              />
              <Text style={styles.optionText}>{t('exportData')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionInfoText}>{t('exportDataDesc')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <View style={styles.optionsContainer}>
          {LANGUAGES.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.option,
                language === item.code && styles.activeOption,
              ]}
              onPress={() => setLanguage(item.code as any)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.languageLabel}>{item.label}</Text>
                <View>
                  <Text style={styles.optionText}>{item.name}</Text>
                </View>
              </View>
              {language === item.code && (
                <Ionicons name="checkmark-circle" size={24} color="#2196f3" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionInfoText}>{t('changeLanguageDesc')}</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
      <BannerAdComponent />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeOption: {
    backgroundColor: '#f0f7ff',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    width: 40,
    textAlign: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  sectionInfo: {
    padding: 16,
    paddingTop: 8,
  },
  sectionInfoText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
});
