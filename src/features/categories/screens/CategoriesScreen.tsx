import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {
  Card,
  FAB,
  IconButton,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import {
  Category,
  TransactionType,
  useStore,
  useTranslation,
} from '../../../store/useStore';
import { getValidCategoryIcon } from '../../../constants';
import { AppTheme } from '../../../theme/theme';

export const CategoriesScreen = () => {
  const {
    categories,
    deleteCategory,
    transactions,
    updateCategoriesOrder,
    formatCurrency,
  } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const insets = useSafeAreaInsets();

  // 1. Calculate category-wise totals and stats for insights
  const analytics = useMemo(() => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    let grandTotal = 0;
    let maxVal = 0;

    transactions
      .filter((tx) => tx.type === activeTab)
      .forEach((tx) => {
        const catId = tx.categoryId || 'uncategorized';
        totals[catId] = (totals[catId] || 0) + tx.amount;
        counts[catId] = (counts[catId] || 0) + 1;
        grandTotal += tx.amount;
        if (totals[catId] > maxVal) {
          maxVal = totals[catId];
        }
      });

    return { totals, counts, grandTotal, maxVal };
  }, [transactions, activeTab]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.type === activeTab);
  }, [categories, activeTab]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Category>) => {
    const totalAmount = analytics.totals[item.id] || 0;
    const txCount = analytics.counts[item.id] || 0;
    const ratio = analytics.maxVal > 0 ? totalAmount / analytics.maxVal : 0;
    const itemColor = item.color || theme.colors.primary;

    return (
      <ScaleDecorator>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: isActive
                ? theme.colors.elevation.level3
                : theme.colors.surface,
              borderColor: isActive
                ? theme.colors.primary
                : theme.colors.outline,
            },
          ]}
          onPress={() =>
            router.push({
              pathname: '/add-category',
              params: { category: JSON.stringify(item) },
            })
          }
          disabled={isActive}
          mode="outlined"
        >
          <View style={styles.cardInner}>
            {/* Drag Handle Indicator */}
            <TouchableOpacity
              onPressIn={drag}
              activeOpacity={0.8}
              style={styles.dragHandle}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={theme.colors.outline}
              />
            </TouchableOpacity>

            {/* Tinted Category Icon Badge */}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${itemColor}15` }, // 10% opacity soft desaturated tint
              ]}
            >
              <MaterialCommunityIcons
                name={getValidCategoryIcon(item.icon) as any}
                size={20}
                color={itemColor}
              />
            </View>

            {/* Center Content: Title, metadata, and visual mini progress bar */}
            <View style={styles.metaCol}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.categoryName,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {translateName(item.name)}
                </Text>
                {totalAmount > 0 && (
                  <Text
                    style={[
                      styles.amountText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {formatCurrency(totalAmount)}
                  </Text>
                )}
              </View>

              <Text
                style={[styles.categoryDesc, { color: theme.colors.outline }]}
              >
                {txCount === 1
                  ? `1 ${t('transaction' as any) || 'transaction'}`
                  : `${txCount} ${t('transactions')}`}
              </Text>

              {/* Muted spending pill indicator */}
              {totalAmount > 0 && (
                <View style={styles.ratioBarBg}>
                  <View
                    style={[
                      styles.ratioBarFill,
                      {
                        width: `${ratio * 100}%`,
                        backgroundColor: itemColor,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </View>
        </Card>
      </ScaleDecorator>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Top Segmented Navigation Tabs */}
      <View
        style={[styles.headerSection, { paddingTop: Math.max(12, insets.top) }]}
      >
        <SegmentedButtons
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TransactionType)}
          buttons={[
            {
              value: 'expense',
              label: t('expenses'),
              icon: 'minus-circle-outline',
            },
            {
              value: 'income',
              label: t('income'),
              icon: 'plus-circle-outline',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <DraggableFlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          const otherCategories = categories.filter(
            (c) => c.type !== activeTab,
          );
          updateCategoriesOrder([...data, ...otherCategories]);
        }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 200 },
        ]}
        ListHeaderComponent={
          filteredCategories.length > 0 ? (
            <Card style={styles.insightsCard} mode="contained">
              <Card.Content style={styles.insightsCardContent}>
                <Ionicons
                  name="analytics-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.insightsTextContainer}>
                  <Text
                    style={[
                      styles.insightsTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {activeTab === 'expense'
                      ? t('topSpendingCategory')
                      : t('income')}
                  </Text>
                  <Text
                    style={[
                      styles.insightsBody,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('totalBalance')}:{' '}
                    <Text
                      style={{ fontWeight: '600', color: theme.colors.primary }}
                    >
                      {formatCurrency(analytics.grandTotal)}
                    </Text>{' '}
                    across {filteredCategories.length} categories.
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={activeTab === 'expense' ? 'cart-outline' : 'cash-outline'}
              size={54}
              color={theme.colors.outlineVariant}
            />
            <Text style={[styles.emptyText, { color: theme.colors.outline }]}>
              {t('noCategories')}
            </Text>
          </View>
        }
      />

      <BannerAdComponent />

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: (insets.bottom || 0) + 120,
            backgroundColor: theme.colors.primary,
          },
        ]}
        color="#fff"
        onPress={() => router.push('/add-category')}
      />
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerSection: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    segmentedButtons: {
      borderRadius: 14,
    },
    insightsCard: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 18,
      backgroundColor: theme.colors.elevation.level1,
      borderColor: theme.colors.outline,
      borderWidth: 1,
      elevation: 0,
    },
    insightsCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
    },
    insightsTextContainer: {
      flex: 1,
    },
    insightsTitle: {
      fontSize: 13,
      fontWeight: '600',
    },
    insightsBody: {
      fontSize: 11,
      marginTop: 2,
    },
    listContent: {
      paddingTop: 8,
    },
    card: {
      marginBottom: 8,
      marginHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1.5,
      elevation: 0,
      overflow: 'hidden',
    },
    cardInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
    },
    dragHandle: {
      width: 24,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    metaCol: {
      flex: 1,
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingRight: 6,
    },
    categoryName: {
      fontWeight: '600',
      fontSize: 15,
      letterSpacing: -0.1,
    },
    amountText: {
      fontSize: 13,
      fontWeight: '600',
    },
    categoryDesc: {
      fontSize: 11,
      marginTop: 2,
      fontWeight: '400',
    },
    ratioBarBg: {
      height: 4,
      borderRadius: 100,
      backgroundColor: theme.dark ? '#27272A' : '#F4F4F5',
      marginTop: 8,
      overflow: 'hidden',
    },
    ratioBarFill: {
      height: '100%',
      borderRadius: 100,
    },
    deleteBtn: {
      margin: 0,
      opacity: 0.7,
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 60,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '500',
      marginTop: 12,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 18,
      elevation: 6,
    },
  });
