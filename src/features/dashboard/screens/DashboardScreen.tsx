import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { router } from 'expo-router';
import {
  getLast30DaysRange,
  getRangeForType,
  isInRange,
} from '../../../utils/dateFilters';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Card,
  Divider,
  FAB,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getValidCategoryIcon } from '../../../constants';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme, spacing } from '../../../theme/theme';
import { fontScale, moderateScale } from '../../../utils/responsive';

const addAlpha = (
  color: string | undefined,
  opacity: number,
  fallbackHex: string,
) => {
  let resolvedColor = color || fallbackHex;

  if (typeof resolvedColor !== 'string') {
    resolvedColor = fallbackHex;
  }

  if (resolvedColor.startsWith('rgb')) {
    const match = resolvedColor.match(/\d+/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${opacity})`;
    }
  }

  if (!resolvedColor.startsWith('#')) {
    resolvedColor = fallbackHex;
  }

  const hex = resolvedColor.replace('#', '');
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${hex}${alpha}`;
};

export const DashboardScreen = React.memo(() => {
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const accounts = useStore((s) => s.accounts);
  const isLoaded = useStore((s) => s.isLoaded);
  const formatCurrency = useStore((s) => s.formatCurrency);
  const dashboardReport = useStore((s) => s.dashboardReport);
  const refreshAnalytics = useStore((s) => s.refreshAnalytics);
  const language = useStore((s) => s.language);
  const cycleStartDay = useStore((s) => s.cycleStartDay);

  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  React.useEffect(() => {
    if (!dashboardReport) {
      refreshAnalytics();
    }
  }, [dashboardReport, refreshAnalytics]);

  const financialData = useMemo(() => {
    if (!dashboardReport) return null;

    const { currentMonth, currentCalendarMonth } = dashboardReport;

    const hasCurrentMonthData =
      currentCalendarMonth &&
      (currentCalendarMonth.expenses > 0 || currentCalendarMonth.income > 0);

    const activeMetrics = hasCurrentMonthData
      ? currentCalendarMonth
      : currentMonth;

    const monthlyIncome = activeMetrics.income;
    const monthlyExpenses = activeMetrics.expenses;
    const monthlyAdjustments = activeMetrics.adjustments;
    const remainingBalance = activeMetrics.savings;

    const calendarExpenses = monthlyExpenses;
    const calendarIncome = monthlyIncome;

    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const recentTransactions = transactions.slice(0, 5);

    const activeRange = hasCurrentMonthData
      ? getRangeForType('month', undefined, undefined, cycleStartDay)
      : getLast30DaysRange();

    const activeExpenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const isAdjustment =
        t.note &&
        (t.note === 'Balance Adjustment' || t.note === 'Ajuste de Saldo');
      if (isAdjustment) return false;
      return isInRange(t.date, activeRange);
    });

    const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
    let budgetedExpensesSum = 0;
    let unbudgetedExpensesSum = 0;

    activeExpenses.forEach((t) => {
      if (t.categoryId && budgetedCategoryIds.has(t.categoryId)) {
        budgetedExpensesSum += t.amount;
      } else {
        unbudgetedExpensesSum += t.amount;
      }
    });

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const limit = totalBudget > 0 ? totalBudget : calendarIncome;
    const ratio = totalBudget > 0 ? budgetedExpensesSum / totalBudget : 0;
    const progress = Math.min(ratio, 1);

    const topCatId = activeMetrics.topCategory?.id;
    const topCategory = topCatId
      ? categories.find((c) => c.id === topCatId)
      : undefined;
    const topCatAmount = activeMetrics.topCategory?.amount || 0;
    const topCatPercent =
      monthlyExpenses > 0 ? (topCatAmount / monthlyExpenses) * 100 : 0;

    return {
      monthlyIncome,
      monthlyExpenses,
      calendarExpenses,
      monthlyAdjustments,
      remainingBalance,
      topCategory,
      topCatAmount,
      topCatPercent,
      recentTransactions,
      totalBudget,
      limit,
      progress,
      totalBalance,
      ratio,
      hasCurrentMonthData,
      insightMessage: dashboardReport.insights[0]?.message,
      budgetedExpensesSum,
      unbudgetedExpensesSum,
    };
  }, [
    dashboardReport,
    accounts,
    transactions,
    budgets,
    categories,
    cycleStartDay,
  ]);

  const data = useMemo(() => {
    if (!financialData) return null;

    const { ratio, insightMessage, totalBudget } = financialData;

    let progressColor = theme.colors.primary;
    if (ratio > 0.9) progressColor = theme.colors.error;
    else if (ratio >= 0.7) progressColor = theme.colors.warning;

    let progressMessage = '';
    if (totalBudget > 0) {
      progressMessage = t('doingWell');
      if (ratio > 1.0) progressMessage = t('exceededLimit');
      else if (ratio > 0.9) progressMessage = t('aboutToExceed');
      else if (ratio >= 0.7) progressMessage = t('closeToLimit');
    }

    return {
      ...financialData,
      progressColor,
      progressMessage,
      insight: insightMessage || t('insightKeepGoing'),
    };
  }, [financialData, theme, t]);

  if (!isLoaded || !data) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const periodLabel = data.hasCurrentMonthData
    ? (() => {
        const locale = language === 'es' ? esLocale : enUS;
        if (cycleStartDay > 1) {
          const range = getRangeForType(
            'month',
            undefined,
            undefined,
            cycleStartDay,
          );
          const startStr = format(range.startDate, 'd MMM', { locale });
          const endStr = format(range.endDate, 'd MMM yyyy', { locale });
          return `${startStr} - ${endStr}`;
        } else {
          const name = format(new Date(), 'MMMM yyyy', { locale });
          return name.charAt(0).toUpperCase() + name.slice(1);
        }
      })()
    : t('filterLast30Days' as any);

  // Unified Financial Health Hero (Layout & Visual Anchor)
  const heroSection = (
    <Animated.View entering={FadeIn.duration(180)}>
      <Card
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        mode="contained"
      >
        <Card.Content style={styles.heroContent}>
          {/* Period Pill & Status Indicator */}
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.periodBadge,
                {
                  backgroundColor: addAlpha(
                    theme.colors.onSurfaceVariant,
                    0.08,
                    '#64748B',
                  ),
                  borderColor: addAlpha(
                    theme.colors.onSurfaceVariant,
                    0.15,
                    '#64748B',
                  ),
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color={theme.colors.onSurfaceVariant}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.periodBadgeText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {periodLabel}
              </Text>
            </View>

            <View
              style={[
                styles.growthBadge,
                {
                  backgroundColor:
                    data.remainingBalance >= 0
                      ? addAlpha(theme.colors.income, 0.1, '#16A34A')
                      : addAlpha(theme.colors.error, 0.1, '#EF4444'),
                },
              ]}
            >
              <Ionicons
                name={
                  data.remainingBalance >= 0
                    ? 'trending-up-outline'
                    : 'trending-down-outline'
                }
                size={14}
                color={
                  data.remainingBalance >= 0
                    ? theme.colors.income
                    : theme.colors.error
                }
              />
              <Text
                style={[
                  styles.growthBadgeText,
                  {
                    color:
                      data.remainingBalance >= 0
                        ? theme.colors.income
                        : theme.colors.error,
                  },
                ]}
              >
                {t('remaining')}
              </Text>
            </View>
          </View>

          {/* Focal Metric: Net Remaining */}
          <View style={styles.heroFocalBlock}>
            <Text
              style={[
                styles.heroFocalAmount,
                {
                  color:
                    data.remainingBalance >= 0
                      ? theme.colors.income
                      : theme.colors.error,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(data.remainingBalance)}
            </Text>

            {data.monthlyAdjustments !== 0 && (
              <View style={styles.adjustmentsRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodySmall"
                  style={[
                    styles.adjustmentsText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('adjustments')}: {data.monthlyAdjustments > 0 ? '+' : ''}
                  {formatCurrency(data.monthlyAdjustments)}
                </Text>
              </View>
            )}
          </View>

          {/* Integrated Cash Flow Split */}
          <View style={styles.heroFlowGrid}>
            <View
              style={[
                styles.flowBox,
                {
                  backgroundColor: addAlpha(
                    theme.colors.income,
                    0.06,
                    '#16A34A',
                  ),
                  borderColor: addAlpha(theme.colors.income, 0.15, '#16A34A'),
                },
              ]}
            >
              <View style={styles.flowBoxHeader}>
                <View
                  style={[
                    styles.flowIconPill,
                    {
                      backgroundColor: addAlpha(
                        theme.colors.income,
                        0.14,
                        '#16A34A',
                      ),
                    },
                  ]}
                >
                  <Ionicons
                    name="arrow-up"
                    size={14}
                    color={theme.colors.income}
                  />
                </View>
                <Text
                  style={[
                    styles.flowBoxLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {t('monthlyIncome').toUpperCase()}
                </Text>
              </View>
              <Text
                style={[styles.flowBoxAmount, { color: theme.colors.income }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(data.monthlyIncome)}
              </Text>
            </View>

            <View
              style={[
                styles.flowBox,
                {
                  backgroundColor: addAlpha(
                    theme.colors.error,
                    0.06,
                    '#EF4444',
                  ),
                  borderColor: addAlpha(theme.colors.error, 0.15, '#EF4444'),
                },
              ]}
            >
              <View style={styles.flowBoxHeader}>
                <View
                  style={[
                    styles.flowIconPill,
                    {
                      backgroundColor: addAlpha(
                        theme.colors.error,
                        0.14,
                        '#EF4444',
                      ),
                    },
                  ]}
                >
                  <Ionicons
                    name="arrow-down"
                    size={14}
                    color={theme.colors.error}
                  />
                </View>
                <Text
                  style={[
                    styles.flowBoxLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {t('monthlyExpenses').toUpperCase()}
                </Text>
              </View>
              <Text
                style={[styles.flowBoxAmount, { color: theme.colors.error }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(data.monthlyExpenses)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  // Accounts Section with Modern Typographic Density
  const accountsSection = (
    <Animated.View entering={FadeIn.duration(180)}>
      <Card style={styles.sectionCard} mode="contained">
        <Card.Content>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('accounts')}</Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('totalBalance')}:{' '}
                <Text
                  style={{
                    color: theme.colors.onSurface,
                    fontFamily: 'Inter-SemiBold',
                    fontWeight: '600',
                  }}
                >
                  {formatCurrency(data.totalBalance)}
                </Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/accounts')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityLabel={t('viewAll')}
              accessibilityRole="button"
            >
              <Text
                style={[styles.actionLinkText, { color: theme.colors.primary }]}
              >
                {t('viewAll')}
              </Text>
            </TouchableOpacity>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          {accounts.slice(0, 3).map((acc, index) => (
            <View key={acc.id}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/account-detail',
                    params: { accountId: acc.id },
                  })
                }
                activeOpacity={0.7}
                style={[styles.accountRow, { paddingVertical: 10 }]}
                accessibilityLabel={`${translateName(acc.name)}, ${formatCurrency(acc.currentBalance, acc.currency)}`}
                accessibilityRole="button"
              >
                <Avatar.Icon
                  size={34}
                  icon={
                    acc.type === 'bank'
                      ? 'bank'
                      : acc.type === 'credit'
                        ? 'credit-card'
                        : 'cash'
                  }
                  style={{
                    backgroundColor: addAlpha(
                      acc.color || theme.colors.primary,
                      0.09,
                      '#22C55E',
                    ),
                    borderColor: addAlpha(
                      acc.color || theme.colors.primary,
                      0.18,
                      '#22C55E',
                    ),
                    borderWidth: 1,
                  }}
                  color={acc.color || theme.colors.primary}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text
                    style={[
                      styles.accountName,
                      { color: theme.colors.onSurface },
                    ]}
                    numberOfLines={1}
                  >
                    {translateName(acc.name)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.accountBalance,
                    { color: theme.colors.onSurface },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(acc.currentBalance, acc.currency)}
                </Text>
              </TouchableOpacity>
              {index < Math.min(accounts.length, 3) - 1 && <Divider />}
            </View>
          ))}
        </Card.Content>
      </Card>
    </Animated.View>
  );

  // Budget & Spending Health Section
  const spendingHealthSection = (
    <Animated.View entering={FadeIn.duration(180)}>
      <Card style={styles.sectionCard} mode="contained">
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('spendingProgress')}</Text>
            {data.totalBudget > 0 && (
              <Text
                style={[
                  styles.budgetRatioText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {`${formatCurrency(data.budgetedExpensesSum)} / ${formatCurrency(data.totalBudget)}`}
              </Text>
            )}
          </View>

          {data.totalBudget > 0 ? (
            <>
              <ProgressBar
                progress={data.progress}
                color={data.progressColor}
                style={styles.progressBar}
                accessibilityLabel={t('spendingProgress')}
                accessibilityValue={{
                  now: Math.round(data.progress * 100),
                  min: 0,
                  max: 100,
                  text: `${Math.round(data.progress * 100)}%`,
                }}
              />
              <View
                style={[
                  styles.row,
                  { justifyContent: 'space-between', marginTop: 8 },
                ]}
              >
                {data.progressMessage ? (
                  <Text
                    variant="labelSmall"
                    style={{ color: data.progressColor, fontWeight: '600' }}
                  >
                    {data.progressMessage}
                  </Text>
                ) : null}
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    flex: 1,
                    textAlign: 'right',
                    marginLeft: 8,
                    fontFamily: 'Inter-Medium',
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {`${Math.round(data.progress * 100)}%`}
                </Text>
              </View>

              {data.unbudgetedExpensesSum > 0 && (
                <View style={styles.unbudgetedRow}>
                  <Text
                    style={[
                      styles.unbudgetedLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('unbudgetedSpending')}
                  </Text>
                  <Text
                    style={[
                      styles.unbudgetedValue,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatCurrency(data.unbudgetedExpensesSum)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noBudgetsContainer}>
              <Ionicons
                name="pie-chart-outline"
                size={34}
                color={theme.colors.onSurfaceVariant}
                style={{ marginBottom: 8, opacity: 0.7 }}
              />
              <Text
                style={[
                  styles.noBudgetsText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('noBudgets')}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/budgets')}
                activeOpacity={0.7}
                style={[
                  styles.manageBudgetsButton,
                  {
                    backgroundColor: addAlpha(
                      theme.colors.primary,
                      0.09,
                      '#22C55E',
                    ),
                    borderColor: addAlpha(theme.colors.primary, 0.2, '#22C55E'),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.manageBudgetsButtonText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {t('manageBudgets')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Integrated Top Category Highlight */}
          {data.topCategory && (
            <>
              <Divider style={{ marginVertical: spacing.md }} />
              <View style={styles.topCategoryBlock}>
                <Text
                  style={[
                    styles.topCategoryTitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('topSpendingCategory').toUpperCase()}
                </Text>
                <View style={[styles.row, { marginTop: spacing.xs }]}>
                  <Avatar.Icon
                    size={36}
                    icon={getValidCategoryIcon(data.topCategory.icon)}
                    style={{
                      backgroundColor: addAlpha(
                        data.topCategory.color || theme.colors.primary,
                        0.09,
                        '#22C55E',
                      ),
                      borderColor: addAlpha(
                        data.topCategory.color || theme.colors.primary,
                        0.2,
                        '#22C55E',
                      ),
                      borderWidth: 1,
                    }}
                    color={data.topCategory.color || theme.colors.primary}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={[
                        styles.topCategoryName,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {translateName(data.topCategory.name)}
                    </Text>
                    <Text
                      style={[
                        styles.topCategoryPercent,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {data.topCatPercent.toFixed(1)}% {t('ofTotalExpenses')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.topCategoryAmount,
                      { color: theme.colors.onSurface },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatCurrency(data.topCatAmount)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );

  // Financial Insight Section
  const insightSection = (
    <Animated.View entering={FadeIn.duration(180)}>
      <Card
        style={[
          styles.sectionCard,
          {
            backgroundColor: addAlpha(theme.colors.primary, 0.07, '#22C55E'),
            borderColor: addAlpha(theme.colors.primary, 0.18, '#22C55E'),
          },
        ]}
        mode="contained"
      >
        <Card.Content style={styles.insightContent}>
          <View
            style={[
              styles.insightIconWrapper,
              {
                backgroundColor: addAlpha(
                  theme.colors.primary,
                  0.15,
                  '#22C55E',
                ),
              },
            ]}
          >
            <Ionicons
              name="bulb-outline"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <Text
            style={[
              styles.insightText,
              {
                color: theme.colors.onSurface,
              },
            ]}
          >
            {data.insight}
          </Text>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  // Recent Transactions Section
  const recentTransactionsSection = (
    <Animated.View entering={FadeIn.duration(180)}>
      <Card style={styles.sectionCard} mode="contained">
        <Card.Content>
          <View style={[styles.sectionHeader, { marginBottom: 8 }]}>
            <Text style={styles.sectionTitle}>{t('recentTransactions')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/transactions')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityLabel={t('seeAll')}
              accessibilityRole="button"
            >
              <Text
                style={[styles.actionLinkText, { color: theme.colors.primary }]}
              >
                {t('seeAll')}
              </Text>
            </TouchableOpacity>
          </View>

          {data.recentTransactions.length > 0 ? (
            data.recentTransactions.map((tr, index) => {
              const cat = categories.find((c) => c.id === tr.categoryId);
              const isAdjustment =
                tr.note && translateName(tr.note) === t('balanceAdjustment');
              const accentColor =
                tr.type === 'transfer'
                  ? theme.dark
                    ? '#60A5FA'
                    : '#3B82F6'
                  : isAdjustment
                    ? theme.colors.onSurfaceVariant
                    : cat?.color ||
                      (tr.type === 'income'
                        ? theme.colors.income
                        : theme.colors.error);
              return (
                <View key={tr.id}>
                  <TouchableOpacity
                    onPress={() => router.push('/transactions')}
                    activeOpacity={0.7}
                    style={[styles.transactionRow, { paddingVertical: 12 }]}
                    accessibilityLabel={`${tr.note || translateName(cat?.name || 'Other')}, ${tr.type === 'income' ? '+' : '-'}${formatCurrency(tr.amount)}, ${format(parseISO(tr.date), 'MMM dd', { locale: language === 'es' ? esLocale : enUS })}`}
                    accessibilityRole="button"
                  >
                    <Avatar.Icon
                      size={36}
                      icon={
                        tr.type === 'transfer'
                          ? 'swap-horizontal'
                          : isAdjustment
                            ? 'scale-balance'
                            : getValidCategoryIcon(cat?.icon) ||
                              (tr.type === 'income' ? 'plus' : 'minus')
                      }
                      style={{
                        backgroundColor: addAlpha(
                          accentColor,
                          0.09,
                          tr.type === 'transfer'
                            ? '#3B82F6'
                            : isAdjustment
                              ? '#64748B'
                              : '#22C55E',
                        ),
                        borderColor: addAlpha(
                          accentColor,
                          0.18,
                          tr.type === 'transfer'
                            ? '#3B82F6'
                            : isAdjustment
                              ? '#64748B'
                              : '#22C55E',
                        ),
                        borderWidth: 1,
                      }}
                      color={accentColor}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text
                        style={[
                          styles.transactionTitle,
                          { color: theme.colors.onSurface },
                        ]}
                        numberOfLines={1}
                      >
                        {tr.note &&
                        translateName(tr.note) === t('balanceAdjustment')
                          ? t('balanceAdjustment')
                          : tr.note ||
                            (tr.type === 'transfer'
                              ? t('transfer')
                              : translateName(cat?.name || 'Other'))}
                      </Text>
                      <Text
                        style={[
                          styles.transactionDate,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {format(parseISO(tr.date), 'MMM dd, yyyy', {
                          locale: language === 'es' ? esLocale : enUS,
                        })}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color:
                            tr.type === 'transfer'
                              ? theme.colors.onSurface
                              : tr.type === 'income'
                                ? theme.colors.income
                                : theme.colors.error,
                        },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {tr.type === 'transfer'
                        ? ''
                        : tr.type === 'income'
                          ? '+'
                          : '-'}
                      {formatCurrency(tr.amount)}
                    </Text>
                  </TouchableOpacity>
                  {index < data.recentTransactions.length - 1 && <Divider />}
                </View>
              );
            })
          ) : (
            <Text
              style={[
                styles.emptyTransactionsText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {t('noTransactions')}
            </Text>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );

  const renderDashboardContent = () => {
    if (width >= 900) {
      return (
        <View style={styles.gridContainer}>
          <View style={styles.gridColumn}>
            {heroSection}
            {accountsSection}
          </View>
          <View style={styles.gridColumn}>
            {spendingHealthSection}
            {insightSection}
          </View>
          <View style={styles.gridColumn}>{recentTransactionsSection}</View>
        </View>
      );
    } else if (width >= 600) {
      return (
        <View style={styles.gridContainer}>
          <View style={styles.gridColumn}>
            {heroSection}
            {accountsSection}
            {recentTransactionsSection}
          </View>
          <View style={styles.gridColumn}>
            {spendingHealthSection}
            {insightSection}
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.singleColumnContainer}>
          {heroSection}
          {accountsSection}
          {spendingHealthSection}
          {insightSection}
          {recentTransactionsSection}
        </View>
      );
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {renderDashboardContent()}
        <View style={{ height: 28 }} />
      </ScrollView>

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: Math.max((insets.bottom || 0) + 24, 96),
            backgroundColor: theme.colors.primary,
          },
        ]}
        color={theme.colors.onPrimary}
        onPress={() => router.push('/add-transaction')}
        accessibilityLabel={t('addTransaction')}
        accessibilityRole="button"
      />
    </View>
  );
});

DashboardScreen.displayName = 'DashboardScreen';

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: moderateScale(spacing.md),
      paddingBottom: moderateScale(100),
      width: '100%',
      maxWidth: 1200,
      alignSelf: 'center',
    },
    gridContainer: {
      flexDirection: 'row',
      width: '100%',
      gap: spacing.md,
    },
    gridColumn: {
      flex: 1,
      flexDirection: 'column',
    },
    singleColumnContainer: {
      width: '100%',
      gap: spacing.md,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Hero Card Styling
    heroCard: {
      borderRadius: 24,
      borderWidth: 1,
      elevation: 0,
      overflow: 'hidden',
    },
    heroContent: {
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.md,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    periodBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 100,
      borderWidth: 1,
    },
    periodBadgeText: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(12),
      letterSpacing: 0.2,
    },
    growthBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 100,
      gap: 4,
    },
    growthBadgeText: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(11),
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    heroFocalBlock: {
      marginBottom: spacing.lg,
    },
    heroFocalAmount: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(32),
      lineHeight: fontScale(38),
      letterSpacing: -0.5,
    },
    adjustmentsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
      gap: 4,
    },
    adjustmentsText: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      fontSize: fontScale(12),
    },
    heroFlowGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    flowBox: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm + 4,
      borderRadius: 16,
      borderWidth: 1,
    },
    flowBoxHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    flowIconPill: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    flowBoxLabel: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(10),
      letterSpacing: 1,
      flex: 1,
    },
    flowBoxAmount: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(17),
    },
    // Section Card & Headers
    sectionCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      elevation: 0,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    sectionTitle: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(15),
      color: theme.colors.onSurface,
    },
    sectionSubtitle: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      fontSize: fontScale(12),
      marginTop: 2,
    },
    actionLinkText: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(13),
    },
    // Account Rows
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    accountName: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(14),
    },
    accountBalance: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(14),
      flexShrink: 1,
      textAlign: 'right',
    },
    // Budget & Progress
    budgetRatioText: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(13),
      flexShrink: 1,
      textAlign: 'right',
      marginLeft: 8,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      marginTop: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    unbudgetedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
    },
    unbudgetedLabel: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      fontSize: fontScale(12),
    },
    unbudgetedValue: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(12),
    },
    noBudgetsContainer: {
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    noBudgetsText: {
      fontFamily: 'Inter-Regular',
      fontSize: fontScale(13),
      textAlign: 'center',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      lineHeight: 18,
    },
    manageBudgetsButton: {
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    manageBudgetsButtonText: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(13),
    },
    topCategoryBlock: {
      marginTop: 2,
    },
    topCategoryTitle: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(10),
      letterSpacing: 1.2,
    },
    topCategoryName: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(14),
    },
    topCategoryPercent: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      fontSize: fontScale(12),
      marginTop: 2,
    },
    topCategoryAmount: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(14),
      flexShrink: 1,
      textAlign: 'right',
    },
    // Insight Section
    insightContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    insightIconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm + 4,
    },
    insightText: {
      flex: 1,
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      fontSize: fontScale(13),
      lineHeight: fontScale(19),
    },
    // Transaction Rows
    transactionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    transactionTitle: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(14),
    },
    transactionDate: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      fontSize: fontScale(12),
      marginTop: 2,
    },
    transactionAmount: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(14),
      flexShrink: 1,
      textAlign: 'right',
      marginLeft: 8,
    },
    emptyTransactionsText: {
      fontFamily: 'Inter-Regular',
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: spacing.md,
      fontSize: fontScale(13),
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
      borderRadius: 16,
    },
  });
