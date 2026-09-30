import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getValidCategoryIcon } from '../../../constants';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { FilterBar } from '../../transactions/components/FilterBar';
import { useFilterStore } from '../../../store/useFilterStore';
import { useStore, useTranslation } from '../../../store/useStore';
import { exportTransactionsToCSV } from '../../../utils/csvExport';
import { isInRange } from '../../../utils/dateFilters';
import { fontScale } from '../../../utils/responsive';
import { AppTheme } from '../../../theme/theme';

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
  const theme = useTheme<AppTheme>();
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

  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);

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

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return 'cash-outline';
      case 'bank':
        return 'business-outline';
      case 'credit':
        return 'card-outline';
      default:
        return 'wallet-outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return 'arrow-down-circle-outline';
      case 'expense':
        return 'arrow-up-circle-outline';
      case 'transfer':
        return 'swap-horizontal-outline';
      default:
        return 'swap-vertical-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return '#10B981';
      case 'expense':
        return '#EF4444';
      case 'transfer':
        return '#3B82F6';
      default:
        return '#6366F1';
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
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
          <Text style={styles.sectionTitle}>{t('filterCustomRange')}</Text>
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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setAccountSheetOpen(true)}
              style={styles.rowItem}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: `${activeAccount?.color || '#10B981'}12`,
                    borderColor: `${activeAccount?.color || '#10B981'}2B`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    activeAccount
                      ? (getAccountIcon(activeAccount.type) as any)
                      : 'wallet-outline'
                  }
                  size={20}
                  color={activeAccount?.color || '#10B981'}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('filterByAccount')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {activeAccount
                    ? translateName(activeAccount.name)
                    : t('allAccounts')}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCategorySheetOpen(true)}
              style={styles.rowItem}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: `${activeCategory?.color || '#8B5CF6'}12`,
                    borderColor: `${activeCategory?.color || '#8B5CF6'}2B`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    activeCategory
                      ? (getValidCategoryIcon(activeCategory.icon) as any)
                      : 'tag-outline'
                  }
                  size={20}
                  color={activeCategory?.color || '#8B5CF6'}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('filterByCategory')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {activeCategory
                    ? translateName(activeCategory.name)
                    : t('allCategories')}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTypeSheetOpen(true)}
              style={styles.rowItem}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: `${getTypeColor(selectedType)}12`,
                    borderColor: `${getTypeColor(selectedType)}2B`,
                  },
                ]}
              >
                <Ionicons
                  name={getTypeIcon(selectedType) as any}
                  size={20}
                  color={getTypeColor(selectedType)}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('type')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {selectedType === 'all'
                    ? t('allTypes')
                    : t(selectedType as any)}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
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

      <BottomSheet
        visible={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
        title={t('filterByAccount')}
      >
        <TouchableOpacity
          style={[
            styles.modalListItem,
            { borderColor: theme.colors.outlineVariant },
            !selectedAccountId && {
              backgroundColor: theme.dark
                ? addAlpha(theme.colors.primary, 0.16)
                : addAlpha(theme.colors.primary, 0.08),
            },
          ]}
          onPress={() => {
            setSelectedAccountId(null);
            setAccountSheetOpen(false);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: !selectedAccountId }}
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
              {t('allAccounts')}
            </Text>
          </View>
          <View
            style={[
              styles.radioOuter,
              {
                borderColor: !selectedAccountId
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
              },
            ]}
          >
            {!selectedAccountId && (
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            )}
          </View>
        </TouchableOpacity>

        {accounts.map((acc) => {
          const isSelected = selectedAccountId === acc.id;
          const accColor = acc.color || theme.colors.primary;
          const accIcon = getAccountIcon(acc.type);
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
                setSelectedAccountId(acc.id);
                setAccountSheetOpen(false);
              }}
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
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: isSelected
                      ? accColor
                      : theme.colors.outlineVariant,
                  },
                ]}
              >
                {isSelected && (
                  <View
                    style={[styles.radioInner, { backgroundColor: accColor }]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      <BottomSheet
        visible={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        title={t('filterByCategory')}
      >
        <View style={styles.modalGrid}>
          <TouchableOpacity
            style={[
              styles.modalGridItem,
              !selectedCategoryId && {
                backgroundColor: theme.dark
                  ? addAlpha(theme.colors.primary, 0.12)
                  : addAlpha(theme.colors.primary, 0.06),
              },
            ]}
            onPress={() => {
              setSelectedCategoryId(null);
              setCategorySheetOpen(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedCategoryId }}
          >
            <View
              style={[
                styles.modalGridIcon,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name="tag-outline"
                size={24}
                color="#fff"
              />
            </View>
            <Text
              style={{
                fontFamily: !selectedCategoryId
                  ? 'Inter-Medium'
                  : 'Inter-Regular',
                fontWeight: !selectedCategoryId ? '500' : '400',
                color: theme.colors.onSurface,
                marginTop: 6,
                textAlign: 'center',
                fontSize: fontScale(10),
              }}
              numberOfLines={1}
            >
              {t('allCategories')}
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const catColor = cat.color || theme.colors.primary;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.modalGridItem,
                  isSelected && {
                    backgroundColor: theme.dark
                      ? addAlpha(catColor, 0.12)
                      : addAlpha(catColor, 0.06),
                  },
                ]}
                onPress={() => {
                  setSelectedCategoryId(cat.id);
                  setCategorySheetOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={translateName(cat.name)}
              >
                <View
                  style={[styles.modalGridIcon, { backgroundColor: catColor }]}
                >
                  <MaterialCommunityIcons
                    name={getValidCategoryIcon(cat.icon) as any}
                    size={24}
                    color="#fff"
                  />
                </View>
                <Text
                  style={{
                    fontFamily: isSelected ? 'Inter-Medium' : 'Inter-Regular',
                    fontWeight: isSelected ? '500' : '400',
                    color: theme.colors.onSurface,
                    marginTop: 6,
                    textAlign: 'center',
                    fontSize: fontScale(10),
                  }}
                  numberOfLines={1}
                >
                  {translateName(cat.name)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        title={t('type')}
      >
        {[
          {
            code: 'all',
            label: t('allTypes'),
            icon: 'swap-vertical-outline',
            color: '#6366F1',
          },
          {
            code: 'income',
            label: t('income'),
            icon: 'arrow-down-circle-outline',
            color: '#10B981',
          },
          {
            code: 'expense',
            label: t('expense'),
            icon: 'arrow-up-circle-outline',
            color: '#EF4444',
          },
          {
            code: 'transfer',
            label: t('transfer'),
            icon: 'swap-horizontal-outline',
            color: '#3B82F6',
          },
        ].map((item) => {
          const isSelected = selectedType === item.code;
          return (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.modalListItem,
                { borderColor: theme.colors.outlineVariant },
                isSelected && {
                  backgroundColor: theme.dark
                    ? addAlpha(item.color, 0.16)
                    : addAlpha(item.color, 0.08),
                },
              ]}
              onPress={() => {
                setSelectedType(item.code as any);
                setTypeSheetOpen(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={[
                    styles.listItemIconBox,
                    {
                      backgroundColor: `${item.color}12`,
                      borderColor: `${item.color}2B`,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.color}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                    color: theme.colors.onSurface,
                  }}
                >
                  {item.label}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: isSelected
                      ? item.color
                      : theme.colors.outlineVariant,
                  },
                ]}
              >
                {isSelected && (
                  <View
                    style={[styles.radioInner, { backgroundColor: item.color }]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <BannerAdComponent />
      </View>
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
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
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    rowText: {
      flex: 1,
      justifyContent: 'center',
    },
    rowTitle: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    rowSub: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      marginTop: 2,
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
      marginLeft: 74,
    },
    modalListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 10,
    },
    listItemIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    modalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingVertical: 8,
    },
    modalGridItem: {
      width: '30%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      padding: 8,
    },
    modalGridIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 0,
    },
  });
