import { router, Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Card, FAB, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { Budget, useStore, useTranslation } from '../../../store/useStore';
import { AppTheme, spacing } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';
import { getValidCategoryIcon } from '../../../constants';
import { getMonthRange, isInRange } from '../../../utils/dateFilters';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

export const BudgetsScreen = () => {
  const {
    budgets,
    transactions,
    formatCurrency,
    categories,
    updateBudgetsOrder,
  } = useStore();
  const { t, translateName, language } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const cycleStartDay = useStore((s) => s.cycleStartDay);
  const currentMonthRange = useMemo(
    () => getMonthRange(cycleStartDay),
    [cycleStartDay],
  );

  const sortedBudgets = useMemo(() => {
    return [...budgets].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
  }, [budgets]);

  const formattedDateRange = useMemo(() => {
    const locale = language === 'es' ? es : enUS;
    const startStr = format(currentMonthRange.startDate, 'MMM d', { locale });
    const endStr = format(currentMonthRange.endDate, 'MMM d, yyyy', { locale });
    return `${startStr} – ${endStr}`;
  }, [currentMonthRange, language]);

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
            const isCurrentMonth = isInRange(tx.date, currentMonthRange);
            return (
              (matchesBudget || matchesCategory) &&
              tx.type === 'expense' &&
              isCurrentMonth
            );
          })
          .reduce((sum, tx) => sum + tx.amount, 0);
        spentSum += spentForBudget;
      });

      const avgProg = count > 0 && budgetedSum > 0 ? spentSum / budgetedSum : 0;
      const withinLimit = budgets.every((budget) => {
        const spentForBudget = transactions
          .filter((tx) => {
            const matchesBudget = tx.budgetId === budget.id;
            const matchesCategory =
              budget.categoryId && tx.categoryId === budget.categoryId;
            const isCurrentMonth = isInRange(tx.date, currentMonthRange);
            return (
              (matchesBudget || matchesCategory) &&
              tx.type === 'expense' &&
              isCurrentMonth
            );
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
    }, [budgets, transactions, currentMonthRange]);

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
        color: (theme.colors as any).warning || '#D97706',
        bgColor: (theme.colors as any).warningContainer,
      };
    } else {
      return {
        text: t('highDepletionTip'),
        color: theme.colors.error,
        bgColor: theme.colors.errorContainer,
      };
    }
  }, [averageProgress, budgets.length, theme, t]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Budget>) => {
    const spent = transactions
      .filter((t) => {
        const matchesBudget = t.budgetId === item.id;
        const matchesCategory =
          item.categoryId && t.categoryId === item.categoryId;
        const isCurrentMonth = isInRange(t.date, currentMonthRange);
        return (
          (matchesBudget || matchesCategory) &&
          t.type === 'expense' &&
          isCurrentMonth
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
    const progress = Math.min(spent / item.amount, 1);
    const remaining = Math.max(item.amount - spent, 0);
    const exceeded = Math.max(spent - item.amount, 0);
    const category = categories.find((c) => c.id === item.categoryId);
    const isOverLimit = spent > item.amount;
    const categoryColor = item.color || theme.colors.primary;

    return (
      <ScaleDecorator>
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
          delayLongPress={200}
          disabled={isActive}
          mode="contained"
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              {budgets.length > 1 && (
                <TouchableOpacity
                  onLongPress={drag}
                  delayLongPress={150}
                  style={styles.dragHandle}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={t('holdAndDragToReorder')}
                  hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="reorder-two-outline"
                    size={20}
                    color={
                      isActive ? theme.colors.primary : theme.colors.outline
                    }
                    style={{ opacity: isActive ? 1 : 0.6 }}
                  />
                </TouchableOpacity>
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
                  {category?.name ? translateName(category.name) : t('budgets')}
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
              <Text
                style={[
                  styles.remainingText,
                  isOverLimit && { color: theme.colors.error },
                ]}
              >
                {isOverLimit
                  ? `${t('overLimit')}: ${formatCurrency(exceeded)}`
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
                {Math.round((spent / item.amount) * 100)}%
              </Text>
            </View>
          </Card.Content>
        </Card>
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
            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-clear-outline"
                size={14}
                color={theme.colors.onSurfaceVariant}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.overviewDates}>{formattedDateRange}</Text>
            </View>

            <View style={styles.overviewTextRow}>
              <View>
                <Text style={styles.overviewLabel}>{t('monthlyBudget')}</Text>
                <Text style={styles.overviewValue}>
                  {formatCurrency(totalSpent)}{' '}
                  <Text style={styles.overviewBudgetGoal}>
                    / {formatCurrency(totalBudgeted)}
                  </Text>
                </Text>
              </View>
              {allWithinLimit && (
                <View style={styles.streakBadge}>
                  <Ionicons
                    name="shield-checkmark"
                    size={14}
                    color={theme.colors.income}
                  />
                  <Text style={styles.streakBadgeText}>{t('onTrack')}</Text>
                </View>
              )}
            </View>

            <ProgressBar
              progress={averageProgress}
              color={
                averageProgress > 0.9
                  ? theme.colors.error
                  : averageProgress > 0.75
                    ? (theme.colors as any).warning || '#D97706'
                    : theme.colors.primary
              }
              style={styles.mainProgressBar}
            />

            <View style={styles.statsFooter}>
              <View style={styles.statFooterItem}>
                <Text style={styles.statFooterLabel}>{t('totalBudgeted')}</Text>
                <Text style={styles.statFooterValue}>
                  {formatCurrency(totalBudgeted)}
                </Text>
              </View>
              <View style={styles.footerDivider} />
              <View style={styles.statFooterItem}>
                <Text style={styles.statFooterLabel}>{t('totalSpent')}</Text>
                <Text
                  style={[
                    styles.statFooterValue,
                    {
                      color:
                        totalSpent > totalBudgeted
                          ? theme.colors.error
                          : theme.colors.onSurface,
                    },
                  ]}
                >
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
              <View style={styles.footerDivider} />
              <View style={styles.statFooterItem}>
                <Text style={styles.statFooterLabel}>
                  {t('remainingBalance')}
                </Text>
                <Text
                  style={[
                    styles.statFooterValue,
                    {
                      color:
                        totalBudgeted - totalSpent < 0
                          ? theme.colors.error
                          : theme.colors.primary,
                    },
                  ]}
                >
                  {formatCurrency(Math.max(0, totalBudgeted - totalSpent))}
                </Text>
              </View>
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
              name={
                averageProgress > 0.8
                  ? 'alert-circle-outline'
                  : 'sparkles-outline'
              }
              size={18}
              color={smartRecommendation.color}
              style={{ marginRight: 8 }}
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

        {budgets.length > 1 && (
          <View style={styles.dragHelpRow}>
            <Ionicons
              name="reorder-two-outline"
              size={15}
              color={theme.colors.outline}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.dragHelpText, { color: theme.colors.outline }]}
            >
              {t('holdAndDragToReorder')}
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
    formattedDateRange,
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
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('budgets'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('back')}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/add-budget')}
              style={styles.headerBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('addBudget')}
            >
              <Ionicons name="add" size={26} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <DraggableFlatList
        data={sortedBudgets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => updateBudgetsOrder(data)}
        containerStyle={styles.listContainer}
        style={styles.list}
        autoscrollThreshold={80}
        autoscrollSpeed={150}
        dragItemOverflow={true}
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
    listContainer: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    dashboardHeader: {
      marginBottom: 8,
    },
    statCard: {
      borderRadius: theme.roundness ? theme.roundness * 1.5 : 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      elevation: 0,
      marginBottom: 12,
    },
    headerBtn: {
      padding: 8,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statCardContent: {
      padding: 16,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    countBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    countBadgeText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    dragHelpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      opacity: 0.8,
    },
    dragHelpText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
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
    overviewDates: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    streakBadgeText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      color: theme.colors.income,
    },
    mainProgressBar: {
      height: 6,
      borderRadius: 3,
      marginBottom: 16,
    },
    statsFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: 12,
    },
    statFooterItem: {
      flex: 1,
      alignItems: 'center',
    },
    footerDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.outlineVariant,
    },
    statFooterLabel: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    statFooterValue: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    recommendationBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
    },
    recommendationText: {
      flex: 1,
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      lineHeight: fontScale(15),
    },
    sectionTitle: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      marginBottom: 8,
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
      width: 36,
      height: 44,
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
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    name: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    limitText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      textAlign: 'right',
    },
    limitTarget: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    progressContainer: {
      marginBottom: 8,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    remainingText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    percentageText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    empty: {
      alignItems: 'center',
      paddingTop: 48,
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      marginBottom: 6,
    },
    emptyText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
      borderRadius: 16,
    },
  });
