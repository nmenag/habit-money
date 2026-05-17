import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';
import { getValidCategoryIcon } from '../../../constants';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { FilterBar } from '../../transactions/components/FilterBar';
import { useFilterStore } from '../../../store/useFilterStore';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme, chartColors } from '../../../theme/theme';
import { isInRange } from '../../../utils/dateFilters';

import {
  SCREEN_WIDTH,
  fontScale,
  moderateScale,
} from '../../../utils/responsive';

export const InsightsScreen = () => {
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const analyticsReport = useStore((s) => s.analyticsReport);
  const formatCurrency = useStore((s) => s.formatCurrency);
  const currencySymbol = useStore((s) => s.currencySymbol);
  const loadFullData = useStore((s) => s.loadFullData);
  const checkAndShowAd = useStore((s) => s.checkAndShowAd);

  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const selectedRange = useFilterStore((s) => s.selectedRange);

  React.useEffect(() => {
    loadFullData();

    // Show interstitial occasionally (30% chance)
    if (Math.random() < 0.3) {
      const timer = setTimeout(() => {
        checkAndShowAd();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loadFullData, checkAndShowAd]);

  const filtered = useMemo(() => {
    const inRange = transactions.filter((tx) =>
      isInRange(tx.date, selectedRange),
    );

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalAdjustments = 0;
    let hasAdjustments = false;
    const catExpMap: Record<string, number> = {};

    inRange.forEach((tx) => {
      const isAdjustment =
        tx.note && translateName(tx.note) === t('balanceAdjustment');
      if (isAdjustment) {
        totalAdjustments += tx.type === 'income' ? tx.amount : -tx.amount;
        hasAdjustments = true;
      } else if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpenses += tx.amount;
        if (tx.categoryId) {
          catExpMap[tx.categoryId] =
            (catExpMap[tx.categoryId] || 0) + tx.amount;
        }
      }
    });

    const combinedIncome = totalIncome + totalAdjustments;
    const savings = combinedIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    let colorIdx = 0;
    const categoryBreakdown = Object.entries(catExpMap)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        const color =
          cat?.color || chartColors[colorIdx++ % chartColors.length];
        const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        return {
          id: catId,
          name: cat?.name ? translateName(cat.name) : t('other'),
          amount,
          color,
          icon: cat?.icon,
          percentage: pct.toFixed(1),
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const txCount = inRange.length;
    const spendingDays = new Set(
      inRange
        .filter((tx) => {
          const isAdjustment =
            tx.note && translateName(tx.note) === t('balanceAdjustment');
          return tx.type === 'expense' && !isAdjustment;
        })
        .map((tx) => tx.date.substring(0, 10)),
    ).size;

    return {
      totalIncome,
      totalExpenses,
      totalAdjustments,
      hasAdjustments,
      combinedIncome,
      savings,
      savingsRate,
      categoryBreakdown,
      txCount,
      spendingDays,
    };
  }, [transactions, categories, selectedRange, t, translateName]);

  const barData = useMemo(() => {
    if (!analyticsReport) return null;
    return {
      labels: [t('previousMonth'), t('currentMonth')],
      datasets: [
        {
          data: [
            analyticsReport.previousMonth.expenses,
            analyticsReport.currentMonth.expenses,
          ],
          colors: [
            (_opacity = 1) => theme.colors.primaryContainer,
            (_opacity = 1) => theme.colors.primary,
          ],
        },
      ],
    };
  }, [analyticsReport, t, theme.colors]);

  const expenseGrowth = analyticsReport?.expenseGrowth ?? 0;

  const pieData = useMemo(
    () =>
      filtered.categoryBreakdown.map((ce) => ({
        name: translateName(ce.name),
        population: ce.amount,
        color: ce.color,
        legendFontColor: theme.colors.onSurfaceVariant,
        legendFontSize: 11,
      })),
    [filtered.categoryBreakdown, translateName, theme.colors.onSurfaceVariant],
  );

  const rangeLabel = useMemo(() => {
    const { type, startDate, endDate } = selectedRange;
    if (type === 'today') return t('filterToday');
    if (type === 'week') return t('filterWeek');
    if (type === 'month') return t('filterMonth');
    if (type === 'lastMonth') return t('filterLastMonth');
    if (type === 'year') return t('filterYear');
    if (type === 'allTime') return t('filterAllTime');
    return `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`;
  }, [selectedRange, t]);

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      color: (opacity = 1) => theme.colors.primary,
      labelColor: (opacity = 1) => theme.colors.onSurface,
      strokeWidth: 2,
      barPercentage: 0.6,
      useShadowColorFromDataset: false,
    }),
    [theme.colors],
  );

  const memoizedPieChart = useMemo(() => {
    if (pieData.length === 0) return null;
    return (
      <PieChart
        data={pieData.map((d) => ({
          ...d,
          name: '',
          population: parseFloat(
            ((d.population / filtered.totalExpenses) * 100).toFixed(1),
          ),
        }))}
        width={SCREEN_WIDTH - 64}
        height={200}
        chartConfig={{
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="50"
        absolute
        hasLegend={false}
      />
    );
  }, [pieData, filtered.totalExpenses]);

  const memoizedLegend = useMemo(
    () => (
      <View style={styles.legendList}>
        {filtered.categoryBreakdown.map((item, i) => (
          <View key={i} style={styles.legendRow}>
            <View
              style={[
                styles.legendIconContainer,
                { backgroundColor: item.color },
              ]}
            >
              <MaterialCommunityIcons
                name={getValidCategoryIcon(item.icon) as any}
                size={14}
                color="#fff"
              />
            </View>
            <Text
              variant="bodySmall"
              style={styles.legendName}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                fontWeight: '600',
              }}
            >
              {item.percentage}%
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.legendAmount,
                {
                  color: theme.colors.onSurface,
                  flexShrink: 1,
                  textAlign: 'right',
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(item.amount)}
            </Text>
          </View>
        ))}
      </View>
    ),
    [
      filtered.categoryBreakdown,
      theme.colors,
      formatCurrency,
      styles.legendAmount,
      styles.legendIconContainer,
      styles.legendList,
      styles.legendName,
      styles.legendRow,
    ],
  );

  const memoizedBarChart = useMemo(() => {
    if (!barData) return null;
    return (
      <BarChart
        data={barData}
        width={SCREEN_WIDTH - 64}
        height={220}
        yAxisLabel={currencySymbol}
        yAxisSuffix=""
        chartConfig={chartConfig}
        verticalLabelRotation={0}
        fromZero
        withCustomBarColorFromData
        flatColor
        style={styles.chart}
      />
    );
  }, [barData, currencySymbol, chartConfig, styles.chart]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FilterBar />

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.rangeBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          {selectedRange.type !== 'allTime' && (
            <>
              <Ionicons
                name="calendar"
                size={14}
                color={theme.colors.onPrimaryContainer}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  marginLeft: 6,
                  fontWeight: '700',
                }}
              >
                {rangeLabel}
              </Text>
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  marginLeft: 4,
                }}
              >
                ·{' '}
              </Text>
            </>
          )}
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onPrimaryContainer }}
          >
            {filtered.txCount}{' '}
            {filtered.txCount === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card
            style={[
              styles.miniCard,
              { backgroundColor: theme.colors.incomeContainer },
            ]}
            mode="contained"
            accessible={true}
            accessibilityLabel={`${t('realIncome')}: ${formatCurrency(filtered.totalIncome)}`}
          >
            <Card.Content style={styles.miniCardContent}>
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={theme.colors.income}
              />
              <Text
                variant="labelSmall"
                style={[styles.miniLabel, { color: theme.colors.income }]}
                numberOfLines={1}
              >
                {t('realIncome')}
              </Text>
              <Text
                variant="titleSmall"
                style={[
                  styles.miniValue,
                  {
                    color: theme.colors.income,
                    fontSize: fontScale(14),
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(filtered.totalIncome)}
              </Text>
            </Card.Content>
          </Card>

          {filtered.hasAdjustments && (
            <Card
              style={[
                styles.miniCard,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              mode="contained"
              accessible={true}
              accessibilityLabel={`${t('adjustments')}: ${formatCurrency(filtered.totalAdjustments)}`}
            >
              <Card.Content style={styles.miniCardContent}>
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="labelSmall"
                  style={[
                    styles.miniLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {t('adjustments')}
                </Text>
                <Text
                  variant="titleSmall"
                  style={[
                    styles.miniValue,
                    {
                      color: theme.colors.onSurfaceVariant,
                      fontSize: fontScale(14),
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(filtered.totalAdjustments)}
                </Text>
              </Card.Content>
            </Card>
          )}

          <Card
            style={[
              styles.miniCard,
              { backgroundColor: theme.colors.errorContainer },
            ]}
            mode="contained"
            accessible={true}
            accessibilityLabel={`${t('expenses')}: ${formatCurrency(filtered.totalExpenses)}`}
          >
            <Card.Content style={styles.miniCardContent}>
              <Ionicons
                name="arrow-down-circle"
                size={20}
                color={theme.colors.error}
              />
              <Text
                variant="labelSmall"
                style={[styles.miniLabel, { color: theme.colors.error }]}
                numberOfLines={1}
              >
                {t('expenses')}
              </Text>
              <Text
                variant="titleSmall"
                style={[
                  styles.miniValue,
                  { color: theme.colors.error, fontSize: fontScale(14) },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(filtered.totalExpenses)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {filtered.hasAdjustments && filtered.totalAdjustments !== 0 && (
          <View style={{ marginBottom: 12, alignItems: 'center' }}>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {t('combinedTotal')}: {formatCurrency(filtered.combinedIncome)}
            </Text>
          </View>
        )}

        {/* Savings Row - Contained Card with Progress Visualizer */}
        <Card
          style={[
            styles.savingsCard,
            { backgroundColor: theme.colors.surface },
          ]}
          mode="elevated"
          accessible={true}
          accessibilityLabel={`${t('savingsRateTitle')}: ${filtered.savingsRate.toFixed(1)}%. ${t('spendingFrequencyTitle')}: ${filtered.spendingDays} ${t('daysLabel')}, ${filtered.txCount} ${filtered.txCount === 1 ? 'transaction' : 'transactions'}`}
        >
          <Card.Content style={styles.savingsRow}>
            <View style={styles.savingsItem}>
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontWeight: '700',
                }}
              >
                {t('savingsRateTitle')}
              </Text>
              <Text
                variant="titleLarge"
                style={{
                  fontWeight: '900',
                  color:
                    filtered.savingsRate >= 0
                      ? theme.colors.income
                      : theme.colors.error,
                  marginTop: 4,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {filtered.savingsRate.toFixed(1)}%
              </Text>
              <ProgressBar
                progress={Math.max(0, Math.min(1, filtered.savingsRate / 100))}
                color={
                  filtered.savingsRate >= 0
                    ? theme.colors.income
                    : theme.colors.error
                }
                style={styles.savingsProgress}
              />
            </View>
            <View
              style={[
                styles.savingsDivider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <View style={styles.savingsItem}>
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontWeight: '700',
                }}
              >
                {t('spendingFrequencyTitle')}
              </Text>
              <Text
                variant="titleLarge"
                style={{
                  fontWeight: '900',
                  color: theme.colors.onSurface,
                  marginTop: 4,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {filtered.spendingDays}{' '}
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    fontWeight: '600',
                  }}
                >
                  {t('daysLabel')}
                </Text>
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Category Pie Chart */}
        {pieData.length > 0 && (
          <Card
            style={styles.card}
            mode="elevated"
            accessible={true}
            accessibilityLabel={`${t('chartTitle')}. ${t('categoryPieChartDescription' as any) || 'Pie chart showing category spending breakdown'}`}
          >
            <Card.Content>
              <Text variant="titleMedium" style={styles.chartTitle}>
                {t('chartTitle')}
              </Text>
              {memoizedPieChart}
              {memoizedLegend}
            </Card.Content>
          </Card>
        )}

        {/* Month-over-month Bar Chart (always shows global data) */}
        {barData && (
          <Card
            style={styles.card}
            mode="elevated"
            accessible={true}
            accessibilityLabel={`${t('expenseGrowthTitle')}. ${t('monthlyBarChartDescription' as any) || 'Bar chart showing monthly expense comparisons'}`}
          >
            <Card.Content>
              <Text variant="titleMedium" style={styles.chartTitle}>
                {t('expenseGrowthTitle')}
              </Text>
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 8,
                }}
              >
                {t('basedOnLastMonths')}
              </Text>
              {memoizedBarChart}
              <View style={styles.growthContainer}>
                <Text
                  variant="headlineMedium"
                  style={[
                    styles.growthValue,
                    {
                      color:
                        expenseGrowth > 0
                          ? theme.colors.error
                          : theme.colors.income,
                    },
                  ]}
                >
                  {expenseGrowth > 0 ? '+' : ''}
                  {expenseGrowth.toFixed(1)}%
                </Text>
                <Text variant="labelSmall" style={styles.subtext}>
                  {t('comparedToLastMonth')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Insights */}
        {analyticsReport && analyticsReport.insights.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {t('insights')}
            </Text>
            {analyticsReport.insights.map((insight) => {
              let iconName: any = 'information-circle-outline';
              let iconColor = theme.colors.primary;
              let backgroundColor = theme.colors.primaryContainer;

              if (insight.level === 'critical' || insight.level === 'warning') {
                iconName = 'alert-circle-outline';
                iconColor =
                  insight.level === 'critical'
                    ? theme.colors.error
                    : theme.colors.warning;
                backgroundColor =
                  insight.level === 'critical'
                    ? theme.colors.errorContainer
                    : theme.colors.warningContainer;
              } else if (insight.level === 'positive') {
                iconName = 'checkmark-circle-outline';
                iconColor = theme.colors.income;
                backgroundColor = theme.colors.incomeContainer;
              }

              return (
                <Card
                  key={insight.id}
                  style={styles.insightCard}
                  mode="elevated"
                >
                  <Card.Content style={styles.insightContent}>
                    <View
                      style={[
                        styles.insightIconContainer,
                        { backgroundColor: backgroundColor },
                      ]}
                    >
                      <Ionicons name={iconName} size={24} color={iconColor} />
                    </View>
                    <View style={styles.insightTextContainer}>
                      <Text variant="titleSmall" style={styles.insightTitle}>
                        {insight.title}
                      </Text>
                      <Text variant="bodyMedium" style={styles.insightText}>
                        {insight.message}
                      </Text>
                      {insight.recommendation && (
                        <View style={styles.recommendationContainer}>
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.primary,
                              fontWeight: '700',
                            }}
                          >
                            {insight.recommendation}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}

        {/* Empty state */}
        {filtered.txCount === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="bar-chart-outline"
              size={56}
              color={theme.colors.outlineVariant}
            />
            <Text
              variant="bodyLarge"
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {t('noDataForPeriod')}
            </Text>
          </View>
        )}
      </ScrollView>
      <BannerAdComponent />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: moderateScale(16),
      paddingBottom: 100,
    },
    rangeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 16,
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      gap: 8,
    },
    miniCard: {
      flex: 1,
      borderRadius: theme.roundness,
    },
    miniCardContent: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'flex-start',
      gap: 4,
    },
    miniLabel: {
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: 10,
      marginTop: 4,
    },
    miniValue: {
      fontWeight: '900',
    },
    savingsCard: {
      borderRadius: 16,
      marginBottom: 16,
    },
    savingsRow: {
      flexDirection: 'row',
      padding: 0,
    },
    savingsItem: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    savingsProgress: {
      height: 4,
      borderRadius: 2,
      marginTop: 8,
      width: '80%',
    },
    spendingFrequencySub: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    savingsDivider: {
      width: 1,
      marginVertical: 12,
    },
    sectionTitle: {
      fontWeight: '800',
      marginBottom: 16,
      marginLeft: 4,
    },
    card: {
      borderRadius: 20,
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    chartTitle: {
      fontWeight: '800',
      marginBottom: 8,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    legendList: {
      marginTop: 12,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    legendIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    legendName: {
      flex: 1,
      color: theme.colors.onSurface,
    },
    legendAmount: {
      fontWeight: '700',
      marginLeft: 8,
    },
    growthContainer: {
      alignItems: 'center',
      marginTop: 8,
    },
    growthValue: {
      fontWeight: '900',
    },
    subtext: {
      color: theme.colors.onSurfaceVariant,
    },
    insightCard: {
      marginBottom: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    insightContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      gap: 12,
    },
    insightIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    insightTextContainer: {
      flex: 1,
      gap: 2,
    },
    insightTitle: {
      fontWeight: '700',
    },
    insightText: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    recommendationContainer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    emptyText: {
      fontWeight: '500',
    },
  });
