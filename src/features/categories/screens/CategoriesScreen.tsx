import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {
  Card,
  FAB,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import {
  Category,
  TransactionType,
  useStore,
  useTranslation,
} from '../../../store/useStore';
import { getValidCategoryIcon } from '../../../constants';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

export const CategoriesScreen = () => {
  const { categories, transactions, updateCategoriesOrder, formatCurrency } =
    useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const insets = useSafeAreaInsets();

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

    const cardBg = isActive ? theme.colors.elevation.level3 : `${itemColor}12`;
    const cardBorder = isActive ? theme.colors.primary : `${itemColor}2B`;

    return (
      <ScaleDecorator>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
          onPress={() =>
            router.push({
              pathname: '/add-category',
              params: { category: JSON.stringify(item) },
            })
          }
          disabled={isActive}
          mode="contained"
        >
          <View style={styles.cardInner}>
            <TouchableOpacity
              onPressIn={drag}
              activeOpacity={0.8}
              style={styles.dragHandle}
            >
              <Ionicons
                name="reorder-two-outline"
                size={18}
                color={theme.colors.outline}
                style={{ opacity: 0.35 }}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${itemColor}12`,
                  borderColor: `${itemColor}2B`,
                  borderWidth: 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getValidCategoryIcon(item.icon) as any}
                size={20}
                color={itemColor}
              />
            </View>

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
                      { color: theme.colors.onSurface },
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
            <View>
              <Card style={styles.insightsCard} mode="contained">
                <Card.Content style={styles.insightsCardContent}>
                  <Ionicons
                    name="analytics-outline"
                    size={18}
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
                        style={{
                          fontFamily: 'Inter-SemiBold',
                          fontWeight: '600',
                          color: theme.colors.primary,
                        }}
                      >
                        {formatCurrency(analytics.grandTotal)}
                      </Text>{' '}
                      {t('acrossCategoriesCount', {
                        count: filteredCategories.length,
                      })}
                    </Text>
                  </View>
                </Card.Content>
              </Card>

              {filteredCategories.length > 1 && (
                <View style={styles.dragHelpRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={13}
                    color={theme.colors.outline}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.dragHelpText,
                      { color: theme.colors.outline },
                    ]}
                  >
                    {t('holdAndDragToReorder')}
                  </Text>
                </View>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Ionicons
                name={activeTab === 'expense' ? 'cart-outline' : 'cash-outline'}
                size={32}
                color={theme.colors.outline}
              />
            </View>
            <Text
              style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
            >
              {t('noCategoriesDefined')}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.colors.outline }]}
            >
              {t('noCategoriesSubtitleText')}
            </Text>
          </Animated.View>
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
      borderRadius: theme.roundness || 12,
      backgroundColor: theme.colors.surface,
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
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    insightsBody: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      marginTop: 2,
    },
    listContent: {
      paddingTop: 8,
    },
    card: {
      marginBottom: 8,
      marginHorizontal: 16,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
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
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(14),
      letterSpacing: -0.1,
    },
    amountText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    categoryDesc: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      marginTop: 2,
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
    dragHelpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      marginBottom: 8,
      opacity: 0.8,
    },
    dragHelpText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 60,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      marginBottom: 6,
    },
    emptySubtitle: {
      textAlign: 'center',
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      paddingHorizontal: 20,
      lineHeight: 18,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 18,
      elevation: 6,
    },
  });
