import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FAB, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { FilterBar } from '../components/FilterBar';
import { TransactionItem } from '../components/TransactionItem';
import { useFilterStore } from '../store/useFilterStore';
import { useStore, useTranslation } from '../store/useStore';
import { isInRange } from '../utils/dateFilters';

export const TransactionsScreen = ({ route, navigation }: any) => {
  const { transactions, accounts, categories } = useStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const { selectedRange } = useFilterStore();

  const filterAccountId = route.params?.accountId;

  // Apply both account filter AND date range filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const inAccount = filterAccountId ? tx.accountId === filterAccountId : true;
      const inRange = isInRange(tx.date, selectedRange);
      return inAccount && inRange;
    });
  }, [transactions, filterAccountId, selectedRange]);

  const activeAccount = filterAccountId
    ? accounts.find((a) => a.id === filterAccountId)
    : null;

  const handleTransactionPress = (transaction: any) => {
    navigation.navigate('AddTransaction', {
      transaction,
      isEditing: true,
    });
  };

  const insets = useSafeAreaInsets();

  // Group transactions by date for section headers
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; items: typeof filteredTransactions }[] = [];
    const dateMap: Record<string, typeof filteredTransactions> = {};

    filteredTransactions.forEach((tx) => {
      const dateKey = tx.date.substring(0, 10); // YYYY-MM-DD
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
        groups.push({ date: dateKey, items: dateMap[dateKey] });
      }
      dateMap[dateKey].push(tx);
    });

    // Sort groups newest first
    groups.sort((a, b) => b.date.localeCompare(a.date));
    return groups;
  }, [filteredTransactions]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Account filter badge */}
      {activeAccount && (
        <View style={styles.accountHeader}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {t('accounts')}: {activeAccount.name}
          </Text>
          <IconButton
            icon="close-circle"
            iconColor={theme.colors.error}
            size={24}
            onPress={() => navigation.setParams({ accountId: undefined })}
          />
        </View>
      )}

      {/* Date Range Filter Bar */}
      <FilterBar />

      <FlatList
        data={groupedTransactions}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item: group }) => (
          <View>
            {/* Date Section Header */}
            <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
              <Text variant="labelSmall" style={[styles.sectionHeaderText, { color: theme.colors.onSurfaceVariant }]}>
                {format(parseISO(group.date), 'EEEE, MMMM d')}
              </Text>
            </View>
            {group.items.map((tx) => {
              const category = categories.find((c) => c.id === tx.categoryId);
              return (
                <TouchableOpacity
                  key={tx.id}
                  onPress={() => handleTransactionPress(tx)}
                  activeOpacity={0.7}
                >
                  <TransactionItem transaction={tx} category={category} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              {t('noTransactions')}
            </Text>
            <Text variant="bodySmall" style={[styles.emptySubText, { color: theme.colors.outline }]}>
              {t('filterActiveRange')} {selectedRange.type !== 'custom'
                ? selectedRange.type
                : `${format(selectedRange.startDate, 'MMM d')} – ${format(selectedRange.endDate, 'MMM d, yyyy')}`}
            </Text>
          </View>
        }
      />
      <BannerAdComponent />
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: (insets.bottom || 0) + 80 }]}
        onPress={() =>
          navigation.navigate('AddTransaction', {
            accountId: filterAccountId,
          })
        }
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    accountHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 16,
      paddingRight: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    sectionHeaderText: {
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '700',
    },
    empty: {
      padding: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 16,
      fontWeight: '600',
    },
    emptySubText: {
      marginTop: 6,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
    },
  });
