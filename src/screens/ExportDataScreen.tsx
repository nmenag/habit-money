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
import { BannerAdComponent } from '../components/BannerAdComponent';
import { FilterBar } from '../components/FilterBar';
import { useFilterStore } from '../store/useFilterStore';
import { useStore, useTranslation } from '../store/useStore';
import { exportTransactionsToCSV } from '../utils/csvExport';
import { isInRange } from '../utils/dateFilters';

export const ExportDataScreen = () => {
  const {
    transactions,
    accounts,
    categories,
    incrementActionCounter,
    checkAndShowAd,
  } = useStore();
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
    incrementActionCounter();
    checkAndShowAd();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {t('exportData')}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {t('exportDataDesc')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          {t('filterCustomRange' as any)}
        </Text>
        <FilterBar />
      </View>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          {t('filters')}
        </Text>
        <Card style={styles.card} mode="contained">
          <Menu
            visible={accountMenuOpen}
            onDismiss={() => setAccountMenuOpen(false)}
            anchor={
              <List.Item
                title={t('filterByAccount' as any)}
                description={
                  activeAccount
                    ? translateName(activeAccount.name)
                    : t('allAccounts' as any)
                }
                left={(props) => <List.Icon {...props} icon="bank-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-down" />}
                onPress={() => setAccountMenuOpen(true)}
              />
            }
          >
            <Menu.Item
              title={t('allAccounts' as any)}
              onPress={() => {
                setSelectedAccountId(null);
                setAccountMenuOpen(false);
              }}
            />
            {accounts.map((acc) => (
              <Menu.Item
                key={acc.id}
                title={translateName(acc.name)}
                onPress={() => {
                  setSelectedAccountId(acc.id);
                  setAccountMenuOpen(false);
                }}
              />
            ))}
          </Menu>
          <Divider />
          <Menu
            visible={categoryMenuOpen}
            onDismiss={() => setCategoryMenuOpen(false)}
            anchor={
              <List.Item
                title={t('filterByCategory' as any)}
                description={
                  activeCategory
                    ? translateName(activeCategory.name)
                    : t('allCategories' as any)
                }
                left={(props) => <List.Icon {...props} icon="tag-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-down" />}
                onPress={() => setCategoryMenuOpen(true)}
              />
            }
          >
            <Menu.Item
              title={t('allCategories' as any)}
              onPress={() => {
                setSelectedCategoryId(null);
                setCategoryMenuOpen(false);
              }}
            />
            {categories.map((cat) => (
              <Menu.Item
                key={cat.id}
                title={translateName(cat.name)}
                onPress={() => {
                  setSelectedCategoryId(cat.id);
                  setCategoryMenuOpen(false);
                }}
              />
            ))}
          </Menu>
          <Divider />
          <Menu
            visible={typeMenuOpen}
            onDismiss={() => setTypeMenuOpen(false)}
            anchor={
              <List.Item
                title={t('type')}
                description={
                  selectedType === 'all'
                    ? t('allTime' as any)
                    : t(selectedType as any)
                }
                left={(props) => <List.Icon {...props} icon="swap-vertical" />}
                right={(props) => <List.Icon {...props} icon="chevron-down" />}
                onPress={() => setTypeMenuOpen(true)}
              />
            }
          >
            <Menu.Item
              title={t('allTime' as any)}
              onPress={() => {
                setSelectedType('all');
                setTypeMenuOpen(false);
              }}
            />
            <Menu.Item
              title={t('income')}
              onPress={() => {
                setSelectedType('income');
                setTypeMenuOpen(false);
              }}
            />
            <Menu.Item
              title={t('expense')}
              onPress={() => {
                setSelectedType('expense');
                setTypeMenuOpen(false);
              }}
            />
            <Menu.Item
              title={t('transfer')}
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
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          mode="contained"
        >
          <View style={styles.summaryContent}>
            <View>
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: 'bold',
                }}
              >
                {filteredTransactions.length}
              </Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {t('transactions')}
              </Text>
            </View>
            <Button
              mode="contained"
              icon="file-export"
              onPress={handleExport}
              disabled={filteredTransactions.length === 0}
            >
              {t('exportData')}
            </Button>
          </View>
        </Card>
      </View>

      <BannerAdComponent />
    </ScrollView>
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
      fontWeight: 'bold',
      marginBottom: 8,
    },
    section: {
      marginTop: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontWeight: '900',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 8,
      letterSpacing: 1.5,
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
