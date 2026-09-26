import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Avatar,
  Button,
  Chip,
  FAB,
  Searchbar,
  Text,
  useTheme,
} from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterBar } from '../components/FilterBar';
import { TransactionItem } from '../components/TransactionItem';
import { useFilterStore } from '../../../store/useFilterStore';
import { useStore, useTranslation } from '../../../store/useStore';
import { isInRange } from '../../../utils/dateFilters';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { getValidCategoryIcon } from '../../../constants';
import { AppTheme } from '../../../theme/theme';

import { FlashList } from '@shopify/flash-list';

const addAlpha = (color: string | undefined, opacity: number) => {
  const resolvedColor = color || '#10B981';
  if (resolvedColor.startsWith('#')) {
    const hex = resolvedColor.replace('#', '');
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${hex}${alpha}`;
  }
  return resolvedColor;
};

export const TransactionsScreen = () => {
  const params = useLocalSearchParams<{ accountId?: string }>();

  const transactions = useStore((s) => s.transactions);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const language = useStore((s) => s.language);
  const loadFullData = useStore((s) => s.loadFullData);
  const formatCurrency = useStore((s) => s.formatCurrency);

  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const selectedRange = useFilterStore((s) => s.selectedRange);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    loadFullData();
  }, [loadFullData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(
    params.accountId ? [params.accountId] : [],
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const hasActiveFilters = !!(
    searchQuery ||
    selectedAccountIds.length > 0 ||
    selectedCategoryIds.length > 0
  );

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedAccountIds([]);
    setSelectedCategoryIds([]);
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter((tx) => {
      if (!isInRange(tx.date, selectedRange)) return false;
      if (
        selectedAccountIds.length > 0 &&
        !selectedAccountIds.includes(tx.accountId)
      )
        return false;
      if (
        selectedCategoryIds.length > 0 &&
        (!tx.categoryId || !selectedCategoryIds.includes(tx.categoryId))
      )
        return false;

      if (query) {
        const cat = categories.find((c) => c.id === tx.categoryId);
        const acc = accounts.find((a) => a.id === tx.accountId);
        const note = (tx.note || '').toLowerCase();
        const catName = (cat?.name || '').toLowerCase();
        const accName = (acc?.name || '').toLowerCase();
        const amt = String(tx.amount);

        return (
          note.includes(query) ||
          catName.includes(query) ||
          accName.includes(query) ||
          amt.includes(query)
        );
      }

      return true;
    });
  }, [
    transactions,
    selectedRange,
    selectedAccountIds,
    selectedCategoryIds,
    searchQuery,
    categories,
    accounts,
  ]);

  const isFilteredByAccountOrCategory =
    selectedAccountIds.length > 0 || selectedCategoryIds.length > 0;

  const targetCurrency = useMemo(() => {
    if (selectedAccountIds.length === 1) {
      const acc = accounts.find((a) => a.id === selectedAccountIds[0]);
      return acc?.currency;
    }
    return undefined;
  }, [selectedAccountIds, accounts]);

  const filterTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfer = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else if (tx.type === 'expense') {
        expense += tx.amount;
      } else if (tx.type === 'transfer') {
        transfer += tx.amount;
      }
    });

    const net = income - expense;
    return {
      income,
      expense,
      transfer,
      net,
      hasIncome: income > 0,
      hasExpense: expense > 0,
      hasTransfer: transfer > 0,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const flattenedData = useMemo(() => {
    const dateMap: Record<string, typeof filteredTransactions> = {};
    filteredTransactions.forEach((tx) => {
      const key = tx.date.substring(0, 10);
      if (!dateMap[key]) dateMap[key] = [];
      dateMap[key].push(tx);
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a));
    const result: any[] = [];
    const stickyHeaderIndices: number[] = [];

    sortedDates.forEach((date) => {
      stickyHeaderIndices.push(result.length);
      result.push({ rowType: 'header', title: date });
      dateMap[date].forEach((tx) => {
        result.push({ rowType: 'item', ...tx });
      });
    });

    return { data: result, stickyHeaderIndices };
  }, [filteredTransactions]);

  const handleTransactionPress = useCallback((transaction: any) => {
    router.push({
      pathname: '/add-transaction',
      params: { transaction: JSON.stringify(transaction), isEditing: 'true' },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.rowType === 'header') {
        return (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.colors.background, height: 32 },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[
                styles.sectionHeaderText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {format(parseISO(item.title), 'EEEE, MMMM d', {
                locale: language === 'es' ? es : enUS,
              })}
            </Text>
          </View>
        );
      }

      const category = categories.find((c) => c.id === item.categoryId);
      return (
        <TransactionItem
          transaction={item}
          category={category}
          onPress={() => handleTransactionPress(item)}
        />
      );
    },
    [categories, handleTransactionPress, theme, language, styles],
  );

  const getItemType = useCallback((item: any) => item.rowType, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FilterBar />
      <Animated.View entering={FadeIn.duration(240)}>
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
            inputStyle={styles.searchInput}
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
            contentContainerStyle={[styles.chipsScroll, { paddingRight: 16 }]}
          >
            <Chip
              icon={selectedAccountIds.length > 0 ? 'check-circle' : 'bank'}
              onPress={() => setAccountSheetOpen(true)}
              selected={selectedAccountIds.length > 0}
              showSelectedOverlay
              style={styles.filterChip}
              compact
            >
              {selectedAccountIds.length === 0
                ? t('filterByAccount' as any)
                : selectedAccountIds.length === 1
                  ? translateName(
                      accounts.find((a) => a.id === selectedAccountIds[0])
                        ?.name || '',
                    )
                  : `${selectedAccountIds.length} ${t('accounts' as any)}`}
            </Chip>

            <Chip
              icon={selectedCategoryIds.length > 0 ? 'check-circle' : 'tag'}
              onPress={() => setCategorySheetOpen(true)}
              selected={selectedCategoryIds.length > 0}
              showSelectedOverlay
              style={styles.filterChip}
              compact
            >
              {selectedCategoryIds.length === 0
                ? t('filterByCategory' as any)
                : selectedCategoryIds.length === 1
                  ? translateName(
                      categories.find((c) => c.id === selectedCategoryIds[0])
                        ?.name || '',
                    )
                  : `${selectedCategoryIds.length} ${t('categories' as any)}`}
            </Chip>

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
            <Text style={styles.countBadgeText}>
              {filteredTransactions.length}
            </Text>
          </View>
        </View>
        {isFilteredByAccountOrCategory && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[
              styles.totalsBanner,
              {
                backgroundColor:
                  theme.colors.elevation.level1 || theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            accessibilityRole="summary"
          >
            {filterTotals.hasIncome && filterTotals.hasExpense ? (
              <View
                style={styles.totalsSplitRow}
                accessibilityLabel={`${t('income')}: ${formatCurrency(filterTotals.income, targetCurrency)}, ${t('expenses')}: ${formatCurrency(filterTotals.expense, targetCurrency)}, ${t('netTotal')}: ${formatCurrency(filterTotals.net, targetCurrency)}`}
              >
                <View style={styles.totalStatItem}>
                  <Text
                    style={[
                      styles.totalStatLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('income')}
                  </Text>
                  <Text
                    style={[
                      styles.totalStatValue,
                      { color: theme.colors.income || '#16A34A' },
                    ]}
                  >
                    +{formatCurrency(filterTotals.income, targetCurrency)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.totalStatDivider,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                />

                <View style={styles.totalStatItem}>
                  <Text
                    style={[
                      styles.totalStatLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('expenses')}
                  </Text>
                  <Text
                    style={[
                      styles.totalStatValue,
                      { color: theme.colors.error || '#EF4444' },
                    ]}
                  >
                    -{formatCurrency(filterTotals.expense, targetCurrency)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.totalStatDivider,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                />

                <View style={styles.totalStatItem}>
                  <Text
                    style={[
                      styles.totalStatLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('netTotal')}
                  </Text>
                  <Text
                    style={[
                      styles.totalStatValue,
                      {
                        color:
                          filterTotals.net >= 0
                            ? theme.colors.income || '#16A34A'
                            : theme.colors.error || '#EF4444',
                      },
                    ]}
                  >
                    {filterTotals.net >= 0 ? '+' : ''}
                    {formatCurrency(filterTotals.net, targetCurrency)}
                  </Text>
                </View>
              </View>
            ) : filterTotals.hasIncome ? (
              <View
                style={styles.singleTotalRow}
                accessibilityLabel={`${t('totalIncome')}: ${formatCurrency(filterTotals.income, targetCurrency)}, ${filterTotals.count} ${filterTotals.count === 1 ? t('transaction') : t('transactions')}`}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={[
                      styles.totalIconCircle,
                      {
                        backgroundColor: addAlpha(
                          theme.colors.income || '#16A34A',
                          0.12,
                        ),
                      },
                    ]}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={16}
                      color={theme.colors.income || '#16A34A'}
                    />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.singleTotalLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('totalIncome')}
                    </Text>
                    <Text
                      style={[
                        styles.singleTotalCount,
                        { color: theme.colors.outline },
                      ]}
                    >
                      {filterTotals.count}{' '}
                      {filterTotals.count === 1
                        ? t('transaction')
                        : t('transactions')}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.singleTotalAmount,
                    { color: theme.colors.income || '#16A34A' },
                  ]}
                >
                  +{formatCurrency(filterTotals.income, targetCurrency)}
                </Text>
              </View>
            ) : filterTotals.hasTransfer && !filterTotals.hasExpense ? (
              <View
                style={styles.singleTotalRow}
                accessibilityLabel={`${t('totalTransfers')}: ${formatCurrency(filterTotals.transfer, targetCurrency)}, ${filterTotals.count} ${filterTotals.count === 1 ? t('transaction') : t('transactions')}`}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={[
                      styles.totalIconCircle,
                      {
                        backgroundColor: addAlpha(theme.colors.primary, 0.12),
                      },
                    ]}
                  >
                    <Ionicons
                      name="swap-horizontal"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.singleTotalLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('totalTransfers')}
                    </Text>
                    <Text
                      style={[
                        styles.singleTotalCount,
                        { color: theme.colors.outline },
                      ]}
                    >
                      {filterTotals.count}{' '}
                      {filterTotals.count === 1
                        ? t('transaction')
                        : t('transactions')}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.singleTotalAmount,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {formatCurrency(filterTotals.transfer, targetCurrency)}
                </Text>
              </View>
            ) : (
              <View
                style={styles.singleTotalRow}
                accessibilityLabel={`${t('totalSpent')}: ${formatCurrency(filterTotals.expense, targetCurrency)}, ${filterTotals.count} ${filterTotals.count === 1 ? t('transaction') : t('transactions')}`}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={[
                      styles.totalIconCircle,
                      {
                        backgroundColor: addAlpha(
                          theme.colors.error || '#EF4444',
                          0.12,
                        ),
                      },
                    ]}
                  >
                    <Ionicons
                      name="arrow-down"
                      size={16}
                      color={theme.colors.error || '#EF4444'}
                    />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.singleTotalLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('totalSpent')}
                    </Text>
                    <Text
                      style={[
                        styles.singleTotalCount,
                        { color: theme.colors.outline },
                      ]}
                    >
                      {filterTotals.count}{' '}
                      {filterTotals.count === 1
                        ? t('transaction')
                        : t('transactions')}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.singleTotalAmount,
                    {
                      color:
                        filterTotals.expense > 0
                          ? theme.colors.error || '#EF4444'
                          : theme.colors.outline,
                    },
                  ]}
                >
                  {filterTotals.expense > 0 ? '-' : ''}
                  {formatCurrency(filterTotals.expense, targetCurrency)}
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </Animated.View>
      <View style={{ flex: 1 }}>
        <FlashList
          data={flattenedData.data as any[]}
          keyExtractor={(item: any) => item.id || item.title}
          renderItem={renderItem}
          getItemType={getItemType}
          stickyHeaderIndices={flattenedData.stickyHeaderIndices}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="search-outline"
                size={56}
                color={theme.colors.outlineVariant}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t('noTransactions')}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={clearAllFilters}
                  style={styles.clearLink}
                  activeOpacity={0.7}
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
      </View>

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: Math.max((insets.bottom || 0) + 24, 96),
            backgroundColor: theme.colors.primary,
          },
        ]}
        color="#fff"
        onPress={() =>
          router.push({
            pathname: '/add-transaction',
            params: {
              accountId:
                selectedAccountIds.length === 1 ? selectedAccountIds[0] : '',
            },
          })
        }
        accessibilityLabel={t('addTransaction')}
        accessibilityRole="button"
      />

      <BottomSheet
        visible={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
        title={t('filterByAccount' as any)}
        footer={
          <Button
            mode="contained"
            onPress={() => setAccountSheetOpen(false)}
            style={{ borderRadius: 12, width: '100%' }}
            labelStyle={{ fontFamily: 'Inter-Medium', fontWeight: '500' }}
          >
            {t('filterApply' as any) || 'Apply'}
          </Button>
        }
      >
        <TouchableOpacity
          style={[
            styles.modalListItem,
            { borderColor: theme.colors.outlineVariant },
            selectedAccountIds.length === 0 && {
              backgroundColor: theme.dark
                ? addAlpha(theme.colors.primary, 0.16)
                : addAlpha(theme.colors.primary, 0.08),
            },
          ]}
          onPress={() => {
            setSelectedAccountIds([]);
            setAccountSheetOpen(false);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedAccountIds.length === 0 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={[
                styles.listItemIconBox,
                {
                  backgroundColor: `${theme.colors.primary}12`,
                  borderColor: `${theme.colors.primary}2B`,
                },
              ]}
            >
              <Ionicons
                name="wallet-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
                color: theme.colors.onSurface,
              }}
            >
              {t('allAccounts' as any)}
            </Text>
          </View>
          <Ionicons
            name={
              selectedAccountIds.length === 0 ? 'checkbox' : 'square-outline'
            }
            size={20}
            color={
              selectedAccountIds.length === 0
                ? theme.colors.primary
                : theme.colors.outline
            }
          />
        </TouchableOpacity>

        {accounts.map((acc) => {
          const isSelected = selectedAccountIds.includes(acc.id);
          const accColor = acc.color || theme.colors.primary;
          const accIcon =
            acc.type === 'cash'
              ? 'cash-outline'
              : acc.type === 'bank'
                ? 'business-outline'
                : 'card-outline';
          return (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.modalListItem,
                { borderColor: theme.colors.outlineVariant },
                isSelected && {
                  backgroundColor: theme.dark
                    ? addAlpha(accColor, 0.16)
                    : addAlpha(accColor, 0.08),
                },
              ]}
              onPress={() => {
                setSelectedAccountIds((prev) =>
                  prev.includes(acc.id)
                    ? prev.filter((id) => id !== acc.id)
                    : [...prev, acc.id],
                );
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={[
                    styles.listItemIconBox,
                    {
                      backgroundColor: `${accColor}12`,
                      borderColor: `${accColor}2B`,
                    },
                  ]}
                >
                  <Ionicons name={accIcon as any} size={20} color={accColor} />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                    color: theme.colors.onSurface,
                  }}
                >
                  {translateName(acc.name)}
                </Text>
              </View>
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={20}
                color={isSelected ? accColor : theme.colors.outline}
              />
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      <BottomSheet
        visible={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        title={t('filterByCategory' as any)}
        footer={
          <Button
            mode="contained"
            onPress={() => setCategorySheetOpen(false)}
            style={{ borderRadius: 12, width: '100%' }}
            labelStyle={{ fontFamily: 'Inter-Medium', fontWeight: '500' }}
          >
            {t('filterApply' as any) || 'Apply'}
          </Button>
        }
      >
        <TouchableOpacity
          style={[
            styles.modalListItem,
            { borderColor: theme.colors.outlineVariant },
            selectedCategoryIds.length === 0 && {
              backgroundColor: theme.dark
                ? addAlpha(theme.colors.primary, 0.16)
                : addAlpha(theme.colors.primary, 0.08),
            },
          ]}
          onPress={() => {
            setSelectedCategoryIds([]);
            setCategorySheetOpen(false);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedCategoryIds.length === 0 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={[
                styles.listItemIconBox,
                {
                  backgroundColor: `${theme.colors.primary}12`,
                  borderColor: `${theme.colors.primary}2B`,
                },
              ]}
            >
              <Ionicons
                name="pricetag-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
                color: theme.colors.onSurface,
              }}
            >
              {t('allCategories' as any)}
            </Text>
          </View>
          <Ionicons
            name={
              selectedCategoryIds.length === 0 ? 'checkbox' : 'square-outline'
            }
            size={20}
            color={
              selectedCategoryIds.length === 0
                ? theme.colors.primary
                : theme.colors.outline
            }
          />
        </TouchableOpacity>

        {categories.map((cat) => {
          const isSelected = selectedCategoryIds.includes(cat.id);
          const catColor = cat.color || theme.colors.primary;
          const iconName = getValidCategoryIcon(cat.icon);
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.modalListItem,
                { borderColor: theme.colors.outlineVariant },
                isSelected && {
                  backgroundColor: theme.dark
                    ? addAlpha(catColor, 0.16)
                    : addAlpha(catColor, 0.08),
                },
              ]}
              onPress={() => {
                setSelectedCategoryIds((prev) =>
                  prev.includes(cat.id)
                    ? prev.filter((id) => id !== cat.id)
                    : [...prev, cat.id],
                );
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={[
                    styles.listItemIconBox,
                    {
                      backgroundColor: `${catColor}12`,
                      borderColor: `${catColor}2B`,
                    },
                  ]}
                >
                  <Avatar.Icon
                    size={24}
                    icon={iconName}
                    style={{ backgroundColor: 'transparent' }}
                    color={catColor}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                    color: theme.colors.onSurface,
                  }}
                >
                  {translateName(cat.name)}
                </Text>
              </View>
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={20}
                color={isSelected ? catColor : theme.colors.outline}
              />
            </TouchableOpacity>
          );
        })}
      </BottomSheet>
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1 },
    searchRow: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    searchbar: {
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      elevation: 0,
    },
    searchInput: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      alignSelf: 'center',
      paddingVertical: 0,
      marginVertical: 0,
      minHeight: 0,
    },
    secondaryFiltersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      paddingBottom: 8,
    },
    chipsScroll: {
      paddingHorizontal: 16,
      paddingTop: 4,
      gap: 8,
      flexDirection: 'row',
      alignItems: 'center',
      flexGrow: 1,
    },
    filterChip: {
      height: 32,
    },
    totalsBanner: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
    },
    singleTotalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    totalIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    singleTotalLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    singleTotalCount: {
      fontSize: 11,
      fontFamily: 'Inter-Regular',
      marginTop: 1,
    },
    singleTotalAmount: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    totalsSplitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    totalStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    totalStatLabel: {
      fontSize: 11,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      marginBottom: 3,
    },
    totalStatValue: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    totalStatDivider: {
      width: 1,
      height: 24,
      opacity: 0.5,
    },
    countBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceVariant,
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    countBadgeText: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    sectionHeaderText: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    empty: {
      padding: 60,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    emptyText: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    clearLink: {
      paddingVertical: 4,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
    },
    modalListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 10,
    },
    listItemIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
  });
