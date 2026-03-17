import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Chip, FAB, Menu, Searchbar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { FilterBar } from '../components/FilterBar';
import { TransactionItem } from '../components/TransactionItem';
import { useFilterStore } from '../store/useFilterStore';
import { useStore, useTranslation } from '../store/useStore';
import { isInRange } from '../utils/dateFilters';

export const TransactionsScreen = ({ route, navigation }: any) => {
  const { transactions, accounts, categories } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const { selectedRange } = useFilterStore();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    route.params?.accountId ?? null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const activeAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId)
    : null;
  const activeCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const hasActiveFilters = !!(
    searchQuery ||
    selectedAccountId ||
    selectedCategoryId
  );

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedAccountId(null);
    setSelectedCategoryId(null);
  };

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter((tx) => {
      if (!isInRange(tx.date, selectedRange)) return false;

      if (selectedAccountId && tx.accountId !== selectedAccountId) return false;

      if (selectedCategoryId && tx.categoryId !== selectedCategoryId)
        return false;
      if (query) {
        const cat = categories.find((c) => c.id === tx.categoryId);
        const acc = accounts.find((a) => a.id === tx.accountId);
        const note = (tx.note || '').toLowerCase();
        const catName = (cat?.name || '').toLowerCase();
        const accName = (acc?.name || '').toLowerCase();
        const amt = String(tx.amount);
        if (
          !note.includes(query) &&
          !catName.includes(query) &&
          !accName.includes(query) &&
          !amt.includes(query)
        )
          return false;
      }

      return true;
    });
  }, [
    transactions,
    selectedRange,
    selectedAccountId,
    selectedCategoryId,
    searchQuery,
    categories,
    accounts,
  ]);

  const groupedTransactions = useMemo(() => {
    const dateMap: Record<string, typeof filteredTransactions> = {};
    filteredTransactions.forEach((tx) => {
      const key = tx.date.substring(0, 10);
      if (!dateMap[key]) dateMap[key] = [];
      dateMap[key].push(tx);
    });
    return Object.entries(dateMap)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions]);

  const handleTransactionPress = (transaction: any) => {
    navigation.navigate('AddTransaction', { transaction, isEditing: true });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FilterBar />
      <View
        style={[styles.searchRow, { backgroundColor: theme.colors.surface }]}
      >
        <Searchbar
          placeholder={t('searchTransactions' as any)}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchbar,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
          inputStyle={{ fontSize: 14 }}
          iconColor={theme.colors.onSurfaceVariant}
          elevation={0}
        />
      </View>
      <View
        style={[
          styles.secondaryFiltersRow,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <Menu
            visible={accountMenuOpen}
            onDismiss={() => setAccountMenuOpen(false)}
            anchor={
              <Chip
                icon={selectedAccountId ? 'check-circle' : 'bank'}
                onPress={() => setAccountMenuOpen(true)}
                selected={!!selectedAccountId}
                showSelectedOverlay
                style={styles.filterChip}
                compact
              >
                {activeAccount
                  ? translateName(activeAccount.name)
                  : t('filterByAccount' as any)}
              </Chip>
            }
          >
            <Menu.Item
              title={t('allAccounts' as any)}
              leadingIcon="close-circle-outline"
              onPress={() => {
                setSelectedAccountId(null);
                setAccountMenuOpen(false);
              }}
            />
            {accounts.map((acc) => (
              <Menu.Item
                key={acc.id}
                title={translateName(acc.name)}
                leadingIcon={
                  selectedAccountId === acc.id ? 'check-circle' : 'bank-outline'
                }
                onPress={() => {
                  setSelectedAccountId(acc.id);
                  setAccountMenuOpen(false);
                }}
              />
            ))}
          </Menu>
          <Menu
            visible={categoryMenuOpen}
            onDismiss={() => setCategoryMenuOpen(false)}
            anchor={
              <Chip
                icon={selectedCategoryId ? 'check-circle' : 'tag'}
                onPress={() => setCategoryMenuOpen(true)}
                selected={!!selectedCategoryId}
                showSelectedOverlay
                style={styles.filterChip}
                compact
              >
                {activeCategory
                  ? translateName(activeCategory.name)
                  : t('filterByCategory' as any)}
              </Chip>
            }
          >
            <Menu.Item
              title={t('allCategories' as any)}
              leadingIcon="close-circle-outline"
              onPress={() => {
                setSelectedCategoryId(null);
                setCategoryMenuOpen(false);
              }}
            />
            {categories.map((cat) => (
              <Menu.Item
                key={cat.id}
                title={translateName(cat.name)}
                leadingIcon={
                  selectedCategoryId === cat.id ? 'check-circle' : 'tag-outline'
                }
                onPress={() => {
                  setSelectedCategoryId(cat.id);
                  setCategoryMenuOpen(false);
                }}
              />
            ))}
          </Menu>
          {hasActiveFilters && (
            <Chip
              icon="close"
              onPress={clearAllFilters}
              style={[
                styles.filterChip,
                { backgroundColor: theme.colors.errorContainer },
              ]}
              textStyle={{ color: theme.colors.onErrorContainer }}
              compact
            >
              {t('clearFilters' as any)}
            </Chip>
          )}
        </ScrollView>

        <View style={styles.countBadge}>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {filteredTransactions.length}
          </Text>
        </View>
      </View>
      <FlatList
        data={groupedTransactions}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item: group }) => (
          <View>
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.sectionHeaderText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
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
            <Ionicons
              name="search-outline"
              size={56}
              color={theme.colors.outlineVariant}
            />
            <Text variant="bodyLarge" style={styles.emptyText}>
              {t('noTransactions')}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={clearAllFilters}
                style={styles.clearLink}
              >
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.primary }}
                >
                  {t('clearFilters' as any)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <BannerAdComponent />

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: (insets.bottom || 0) + 80 }]}
        onPress={() =>
          navigation.navigate('AddTransaction', {
            accountId: selectedAccountId,
          })
        }
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    searchRow: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchbar: {
      height: 44,
      borderRadius: 12,
    },
    secondaryFiltersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      paddingBottom: 8,
    },
    chipsScroll: {
      paddingHorizontal: 12,
      paddingTop: 4,
      gap: 8,
      flexDirection: 'row',
      alignItems: 'center',
      flexGrow: 1,
    },
    filterChip: {
      height: 32,
    },
    countBadge: {
      paddingHorizontal: 10,
      justifyContent: 'center',
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    sectionHeaderText: {
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '800',
    },
    empty: {
      padding: 60,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    clearLink: {
      paddingVertical: 4,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 20,
      elevation: 4,
    },
  });
