import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Card, FAB, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { Budget, useStore, useTranslation } from '../../../store/useStore';
import { AppTheme, spacing } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';
import { getValidCategoryIcon } from '../../../constants';

export const BudgetsScreen = () => {
  const {
    budgets,
    transactions,
    formatCurrency,
    categories,
    updateBudgetsOrder,
  } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  // Aggregate values
  const { totalBudgeted, totalSpent, averageProgress, allWithinLimit } =
    useMemo(() => {
      let budgetedSum = 0;
      let spentSum = 0;
      let count = budgets.length;

      budgets.forEach((budget) => {
        budgetedSum += budget.amount;
        const spentForBudget = transactions
          .filter((tx) => {
            const matchesBudget = tx.budgetId === budget.id;
            const matchesCategory =
              budget.categoryId && tx.categoryId === budget.categoryId;
            return (matchesBudget || matchesCategory) && tx.type === 'expense';
          })
          .reduce((sum, tx) => sum + tx.amount, 0);
        spentSum += spentForBudget;
      });

      const avgProg = budgetedSum > 0 ? spentSum / budgetedSum : 0;
      const withinLimit = budgets.every((budget) => {
        const spentForBudget = transactions
          .filter((tx) => {
            const matchesBudget = tx.budgetId === budget.id;
            const matchesCategory =
              budget.categoryId && tx.categoryId === budget.categoryId;
            return (matchesBudget || matchesCategory) && tx.type === 'expense';
          })
          .reduce((sum, tx) => sum + tx.amount, 0);
        return spentForBudget <= budget.amount;
      });

      return {
        totalBudgeted: budgetedSum,
        totalSpent: spentSum,
        averageProgress: Math.min(avgProg, 1),
        allWithinLimit: withinLimit && count > 0,
      };
    }, [budgets, transactions]);

  // Contextual financial recommendation
  const smartRecommendation = useMemo(() => {
    if (budgets.length === 0) return null;
    const percent = Math.round(averageProgress * 100);

    if (percent <= 40) {
      return {
        text: t('excellentPaceTip'),
        color: theme.colors.primary,
        bgColor: theme.colors.incomeContainer,
      };
    } else if (percent <= 80) {
      return {
        text: t('moderatePaceTip', { percent }),
        color: '#D97706',
        bgColor: theme.dark ? '#332511' : '#FFF7E6',
      };
    } else {
      return {
        text: t('highDepletionTip'),
        color: theme.colors.error,
        bgColor: theme.dark ? '#341F1C' : '#FBECE9',
      };
    }
  }, [averageProgress, budgets.length, theme, t]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Budget>) => {
    const spent = transactions
      .filter((t) => {
        const matchesBudget = t.budgetId === item.id;
        const matchesCategory =
          item.categoryId && t.categoryId === item.categoryId;
        return (matchesBudget || matchesCategory) && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);
    const progress = Math.min(spent / item.amount, 1);
    const remaining = Math.max(item.amount - spent, 0);
    const category = categories.find((c) => c.id === item.categoryId);
    const isOverLimit = spent > item.amount;
    const categoryColor = item.color || theme.colors.primary;

    return (
      <ScaleDecorator>
        <Animated.View entering={FadeInUp.duration(300)}>
          <Card
            style={[
              styles.card,
              {
                borderColor: isActive
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
                backgroundColor: theme.colors.surface,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/budget-detail',
                params: { budgetId: item.id },
              })
            }
            onLongPress={drag}
            disabled={isActive}
            mode="contained"
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardHeader}>
                {budgets.length > 1 && (
                  <View style={styles.dragHandle} pointerEvents="none">
                    <Ionicons
                      name="reorder-two-outline"
                      size={18}
                      color={theme.colors.outline}
                      style={{ opacity: 0.35 }}
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: `${categoryColor}12`,
                      borderColor: `${categoryColor}2B`,
                      marginRight: 12,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getValidCategoryIcon(category?.icon) as any}
                    size={18}
                    color={categoryColor}
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.name} numberOfLines={1}>
                    {category?.name
                      ? translateName(category.name)
                      : t('budgets')}
                  </Text>
                </View>

                <View style={styles.limitContainer}>
                  <Text style={styles.limitText} numberOfLines={1}>
                    {formatCurrency(spent)}{' '}
                    <Text style={styles.limitTarget}>
                      / {formatCurrency(item.amount)}
                    </Text>
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={progress}
                  color={isOverLimit ? theme.colors.error : categoryColor}
                  style={styles.progressBar}
                />
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.remainingText}>
                  {isOverLimit
                    ? t('overLimit')
                    : `${t('remainingAmount')}: ${formatCurrency(remaining)}`}
                </Text>
                <Text
                  style={[
                    styles.percentageText,
                    {
                      color: isOverLimit
                        ? theme.colors.error
                        : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>
      </ScaleDecorator>
    );
  };

  const HeaderComponent = useMemo(() => {
    if (budgets.length === 0) return null;

    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.dashboardHeader}
      >
        <Card style={styles.statCard} mode="contained">
          <Card.Content style={styles.statCardContent}>
            <View style={styles.overviewTextRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.overviewLabel}>
                  {t('aggregateSpending')}
                </Text>
                <Text
                  style={styles.overviewValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(totalSpent)}
                  <Text style={styles.overviewBudgetGoal}>
                    {' '}
                    / {formatCurrency(totalBudgeted)}
                  </Text>
                </Text>
              </View>
              {allWithinLimit && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakBadgeText} numberOfLines={1}>
                    {t('streakActive')}
                  </Text>
                </View>
              )}
            </View>

            <ProgressBar
              progress={averageProgress}
              color={theme.colors.primary}
              style={styles.summaryBar}
            />

            <View style={styles.summaryFooterRow}>
              <Text style={styles.summaryFooterText}>
                {t('overallBudgetDepletion')}
              </Text>
              <Text style={styles.summaryFooterPercent}>
                {Math.round(averageProgress * 100)}%
              </Text>
            </View>
          </Card.Content>
        </Card>

        {smartRecommendation && (
          <View
            style={[
              styles.recommendationBox,
              {
                backgroundColor: smartRecommendation.bgColor,
                borderColor: `${smartRecommendation.color}2B`,
              },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={smartRecommendation.color}
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.recommendationText,
                { color: theme.colors.onSurface },
              ]}
            >
              {smartRecommendation.text}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('budgetAllocations')}</Text>
      </Animated.View>
    );
  }, [
    budgets.length,
    totalSpent,
    totalBudgeted,
    allWithinLimit,
    averageProgress,
    smartRecommendation,
    theme,
    t,
    formatCurrency,
    styles,
  ]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DraggableFlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => updateBudgetsOrder(data)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
        ListHeaderComponent={HeaderComponent}
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
                name="pie-chart-outline"
                size={32}
                color={theme.colors.outline}
              />
            </View>
            <Text
              style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
            >
              {t('noBudgetsCreated')}
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.outline }]}>
              {t('noBudgetsSubtitle')}
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
        onPress={() => router.push('/add-budget')}
      />
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      padding: 16,
      paddingTop: spacing.xs,
    },
    dashboardHeader: {
      marginTop: 16,
      marginBottom: 8,
    },
    statCard: {
      borderRadius: theme.roundness || 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      elevation: 0,
      marginBottom: 12,
    },
    statCardContent: {
      padding: 16,
    },
    overviewTextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    overviewLabel: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    overviewValue: {
      fontSize: fontScale(20),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    overviewBudgetGoal: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    streakBadge: {
      backgroundColor: theme.colors.incomeContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 100,
      borderWidth: 0.5,
      borderColor: `${theme.colors.income}2B`,
    },
    streakBadgeText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.income,
    },
    summaryBar: {
      height: 6,
      borderRadius: 3,
      marginBottom: 8,
    },
    summaryFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryFooterText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    summaryFooterPercent: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    recommendationBox: {
      borderWidth: 1,
      borderRadius: theme.roundness || 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    recommendationText: {
      flex: 1,
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      lineHeight: 16,
    },
    sectionTitle: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
      marginBottom: 10,
    },
    card: {
      marginBottom: 12,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardContent: {
      padding: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    dragHandle: {
      marginRight: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      flex: 1.2,
      justifyContent: 'center',
    },
    limitContainer: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      flex: 1,
      marginRight: 4,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    name: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
      fontSize: fontScale(15),
      letterSpacing: -0.1,
    },
    limitText: {
      color: theme.colors.onSurface,
      fontSize: fontScale(16),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    limitTarget: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    progressContainer: {
      marginBottom: 8,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    remainingText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    percentageText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 80,
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
    emptyText: {
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
