import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  List,
  Menu,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { FilterBar } from '../../transactions/components/FilterBar';
import { useFilterStore } from '../../../store/useFilterStore';
import { useStore, useTranslation } from '../../../store/useStore';
import { exportTransactionsToCSV } from '../../../utils/csvExport';
import { isInRange } from '../../../utils/dateFilters';

const addAlpha = (color: string, opacity: number) => {
  if (color && color.startsWith('#')) {
    const hex = color.replace('#', '');
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${hex}${alpha}`;
  }
  return color;
};

export const ExportDataScreen = () => {
  const { transactions, accounts, categories, checkAndShowAd } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();
  const { selectedRange } = useFilterStore();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<
    'all' | 'income' | 'expense' | 'transfer'
  >('all');

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  const activeAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId)
    : null;
  const activeCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!isInRange(tx.date, selectedRange)) return false;
      if (selectedAccountId && tx.accountId !== selectedAccountId) return false;
      if (selectedCategoryId && tx.categoryId !== selectedCategoryId)
        return false;
      if (selectedType !== 'all' && tx.type !== selectedType) return false;
      return true;
    });
  }, [
    transactions,
    selectedRange,
    selectedAccountId,
    selectedCategoryId,
    selectedType,
  ]);

  const handleExport = async () => {
    await exportTransactionsToCSV(
      filteredTransactions,
      accounts,
      categories,
      t,
      translateName,
    );
    await checkAndShowAd();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.onSurface, fontSize: 24 },
            ]}
          >
            {t('exportData')}
          </Text>
          <Text
            style={{
              color: theme.colors.onSurfaceVariant,
              fontFamily: 'Inter-Regular',
              fontWeight: '400',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {t('exportDataDesc')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('filterCustomRange' as any)}
          </Text>
          <FilterBar />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('filters')}</Text>
          <Card
            style={[
              styles.card,
              {
                borderColor: theme.colors.outlineVariant,
                borderWidth: 1,
                backgroundColor: theme.colors.surface,
              },
            ]}
            mode="contained"
          >
            <Menu
              visible={accountMenuOpen}
              onDismiss={() => setAccountMenuOpen(false)}
              anchor={
                <List.Item
                  title={t('filterByAccount' as any)}
                  titleStyle={{ fontFamily: 'Inter-Medium', fontWeight: '500' }}
                  description={
                    activeAccount
                      ? translateName(activeAccount.name)
                      : t('allAccounts' as any)
                  }
                  descriptionStyle={{
                    fontFamily: 'Inter-Regular',
                    fontWeight: '400',
                  }}
                  left={(props) => <List.Icon {...props} icon="bank-outline" />}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-down" />
                  )}
                  onPress={() => setAccountMenuOpen(true)}
                />
              }
            >
              <Menu.Item
                title={t('allAccounts' as any)}
                titleStyle={{ fontFamily: 'Inter-Regular', fontWeight: '400' }}
                onPress={() => {
                  setSelectedAccountId(null);
                  setAccountMenuOpen(false);
                }}
              />
              {accounts.map((acc) => (
                <Menu.Item
                  key={acc.id}
                  title={translateName(acc.name)}
                  titleStyle={{
                    fontFamily: 'Inter-Regular',
                    fontWeight: '400',
                  }}
                  onPress={() => {
                    setSelectedAccountId(acc.id);
                    setAccountMenuOpen(false);
                  }}
                />
              ))}
            </Menu>
            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
            <Menu
              visible={categoryMenuOpen}
              onDismiss={() => setCategoryMenuOpen(false)}
              anchor={
                <List.Item
                  title={t('filterByCategory' as any)}
                  titleStyle={{ fontFamily: 'Inter-Medium', fontWeight: '500' }}
                  description={
                    activeCategory
                      ? translateName(activeCategory.name)
                      : t('allCategories' as any)
                  }
                  descriptionStyle={{
                    fontFamily: 'Inter-Regular',
                    fontWeight: '400',
                  }}
                  left={(props) => <List.Icon {...props} icon="tag-outline" />}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-down" />
                  )}
                  onPress={() => setCategoryMenuOpen(true)}
                />
              }
            >
              <Menu.Item
                title={t('allCategories' as any)}
                titleStyle={{ fontFamily: 'Inter-Regular', fontWeight: '400' }}
                onPress={() => {
                  setSelectedCategoryId(null);
                  setCategoryMenuOpen(false);
                }}
              />
              {categories.map((cat) => (
                <Menu.Item
                  key={cat.id}
                  title={translateName(cat.name)}
                  titleStyle={{
                    fontFamily: 'Inter-Regular',
                    fontWeight: '400',
                  }}
                  onPress={() => {
                    setSelectedCategoryId(cat.id);
                    setCategoryMenuOpen(false);
                  }}
                />
              ))}
            </Menu>
            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
            <Menu
              visible={typeMenuOpen}
              onDismiss={() => setTypeMenuOpen(false)}
              anchor={
                <List.Item
                  title={t('type')}
                  titleStyle={{ fontFamily: 'Inter-Medium', fontWeight: '500' }}
                  description={
                    selectedType === 'all'
                      ? t('allTypes' as any)
                      : t(selectedType as any)
                  }
                  descriptionStyle={{
                    fontFamily: 'Inter-Regular',
                    fontWeight: '400',
                  }}
                  left={(props) => (
                    <List.Icon {...props} icon="swap-vertical" />
                  )}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-down" />
                  )}
                  onPress={() => setTypeMenuOpen(true)}
                />
              }
            >
              <Menu.Item
                title={t('allTypes' as any)}
                titleStyle={{ fontFamily: 'Inter-Regular', fontWeight: '400' }}
                onPress={() => {
                  setSelectedType('all');
                  setTypeMenuOpen(false);
                }}
              />
              <Menu.Item
                title={t('income')}
                titleStyle={{ fontFamily: 'Inter-Regular', fontWeight: '400' }}
                onPress={() => {
                  setSelectedType('income');
                  setTypeMenuOpen(false);
                }}
              />
              <Menu.Item
                title={t('expense')}
                titleStyle={{ fontFamily: 'Inter-Regular', fontWeight: '400' }}
                onPress={() => {
                  setSelectedType('expense');
                  setTypeMenuOpen(false);
                }}
              />
              <Menu.Item
                title={t('transfer')}
                titleStyle={{ fontFamily: 'Inter-Regular', fontWeight: '400' }}
                onPress={() => {
                  setSelectedType('transfer');
                  setTypeMenuOpen(false);
                }}
              />
            </Menu>
          </Card>
        </View>

        <View style={styles.summarySection}>
          <Card
            style={[
              styles.summaryCard,
              {
                backgroundColor: addAlpha(theme.colors.primary, 0.08),
                borderColor: addAlpha(theme.colors.primary, 0.17),
                borderWidth: 1,
              },
            ]}
            mode="contained"
          >
            <View style={styles.summaryContent}>
              <View>
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontFamily: 'Inter-SemiBold',
                    fontWeight: '600',
                    fontSize: 20,
                  }}
                >
                  {filteredTransactions.length}
                </Text>
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('transactions')}
                </Text>
              </View>
              <Button
                mode="contained"
                icon="file-export"
                onPress={handleExport}
                disabled={filteredTransactions.length === 0}
                labelStyle={{ fontFamily: 'Inter-Medium', fontWeight: '500' }}
              >
                {t('exportData')}
              </Button>
            </View>
          </Card>
        </View>
      </ScrollView>
      <BannerAdComponent />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: 24,
      paddingTop: 16,
    },
    title: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      marginBottom: 8,
    },
    section: {
      marginTop: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 8,
      letterSpacing: 1.2,
    },
    card: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    summarySection: {
      padding: 16,
      marginTop: 8,
    },
    summaryCard: {
      borderRadius: 20,
    },
    summaryContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
  });
