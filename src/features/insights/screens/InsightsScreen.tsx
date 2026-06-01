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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SCREEN_WIDTH,
  fontScale,
  moderateScale,
} from '../../../utils/responsive';

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
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    loadFullData();

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
    if (type === 'today') return t('filterToday' as any);
    if (type === 'week') return t('filterWeek' as any);
    if (type === 'month') return t('filterMonth' as any);
    if (type === 'lastMonth') return t('filterLastMonth' as any);
    if (type === 'year') return t('filterYear' as any);
    if (type === 'allTime') return t('filterAllTime' as any);
    if (type === 'last30Days') return t('filterLast30Days' as any);
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
                {
                  backgroundColor: addAlpha(item.color, 0.08, '#64748B'),
                  borderColor: addAlpha(item.color, 0.17, '#64748B'),
                  borderWidth: 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getValidCategoryIcon(item.icon) as any}
                size={14}
                color={item.color}
              />
            </View>
            <Text style={styles.legendName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                color: theme.colors.onSurfaceVariant,
                fontWeight: '500',
                fontSize: 12,
              }}
            >
              {item.percentage}%
            </Text>
            <Text
              style={[
                styles.legendAmount,
                {
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  color: theme.colors.onSurface,
                  flexShrink: 1,
                  textAlign: 'right',
                  fontSize: 13,
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 200 },
        ]}
      >
        <View
          style={[
            styles.rangeBadge,
            {
              backgroundColor: addAlpha(theme.colors.primary, 0.08, '#22C55E'),
              borderColor: addAlpha(theme.colors.primary, 0.17, '#22C55E'),
              borderWidth: 1,
            },
          ]}
        >
          {selectedRange.type !== 'allTime' && (
            <>
              <Ionicons
                name="calendar"
                size={14}
                color={theme.colors.primary}
              />
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  color: theme.colors.primary,
                  marginLeft: 6,
                  fontWeight: '500',
                  fontSize: 10,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                {rangeLabel}
              </Text>
              <Text
                style={{
                  color: theme.colors.primary,
                  marginLeft: 4,
                  fontSize: 10,
                }}
              >
                ·{' '}
              </Text>
            </>
          )}
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              color: theme.colors.primary,
              fontWeight: '500',
              fontSize: 10,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            {filtered.txCount}{' '}
            {filtered.txCount === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>

        <View style={styles.summaryContainer}>
          <Card
            style={[
              styles.miniCard,
              {
                backgroundColor: addAlpha(theme.colors.income, 0.08, '#16A34A'),
                borderColor: addAlpha(theme.colors.income, 0.17, '#16A34A'),
                borderWidth: 1,
              },
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
                style={[
                  styles.miniLabel,
                  {
                    color: theme.colors.income,
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                  },
                ]}
                numberOfLines={1}
              >
                {t('realIncome')}
              </Text>
              <Text
                style={[
                  styles.miniValue,
                  {
                    color: theme.colors.income,
                    fontFamily: 'Inter-SemiBold',
                    fontWeight: '600',
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
                {
                  backgroundColor: addAlpha(
                    theme.colors.onSurfaceVariant,
                    0.08,
                    '#64748B',
                  ),
                  borderColor: addAlpha(
                    theme.colors.onSurfaceVariant,
                    0.17,
                    '#64748B',
                  ),
                  borderWidth: 1,
                },
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
                  style={[
                    styles.miniLabel,
                    {
                      color: theme.colors.onSurfaceVariant,
                      fontFamily: 'Inter-Medium',
                      fontWeight: '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t('adjustments')}
                </Text>
                <Text
                  style={[
                    styles.miniValue,
                    {
                      color: theme.colors.onSurfaceVariant,
                      fontFamily: 'Inter-SemiBold',
                      fontWeight: '600',
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
              {
                backgroundColor: addAlpha(theme.colors.error, 0.08, '#EF4444'),
                borderColor: addAlpha(theme.colors.error, 0.17, '#EF4444'),
                borderWidth: 1,
              },
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
                style={[
                  styles.miniLabel,
                  {
                    color: theme.colors.error,
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                  },
                ]}
                numberOfLines={1}
              >
                {t('expenses')}
              </Text>
              <Text
                style={[
                  styles.miniValue,
                  {
                    color: theme.colors.error,
                    fontFamily: 'Inter-SemiBold',
                    fontWeight: '600',
                    fontSize: fontScale(14),
                  },
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
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontWeight: '400',
                fontSize: 11,
                color: theme.colors.outline,
              }}
            >
              {t('combinedTotal')}: {formatCurrency(filtered.combinedIncome)}
            </Text>
          </View>
        )}

        <Card
          style={[
            styles.savingsCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
            },
          ]}
          mode="contained"
          accessible={true}
          accessibilityLabel={`${t('savingsRateTitle')}: ${filtered.savingsRate.toFixed(1)}%. ${t('spendingFrequencyTitle')}: ${filtered.spendingDays} ${t('daysLabel')}, ${filtered.txCount} ${filtered.txCount === 1 ? 'transaction' : 'transactions'}`}
        >
          <Card.Content style={styles.savingsRow}>
            <View style={styles.savingsItem}>
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {t('savingsRateTitle')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-SemiBold',
                  fontWeight: '600',
                  fontSize: 22,
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
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {t('spendingFrequencyTitle')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-SemiBold',
                  fontWeight: '600',
                  fontSize: 22,
                  color: theme.colors.onSurface,
                  marginTop: 4,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {filtered.spendingDays}{' '}
                <Text
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                    fontSize: 12,
                  }}
                >
                  {t('daysLabel')}
                </Text>
              </Text>
            </View>
          </Card.Content>
        </Card>

        {pieData.length > 0 && (
          <Card
            style={[
              styles.card,
              {
                borderColor: theme.colors.outlineVariant,
                borderWidth: 1,
              },
            ]}
            mode="contained"
            accessible={true}
            accessibilityLabel={`${t('chartTitle')}. ${t('categoryPieChartDescription' as any) || 'Pie chart showing category spending breakdown'}`}
          >
            <Card.Content>
              <Text
                style={[
                  styles.chartTitle,
                  {
                    color: theme.colors.onSurface,
                    fontFamily: 'Inter-SemiBold',
                    fontWeight: '600',
                  },
                ]}
              >
                {t('chartTitle')}
              </Text>
              {memoizedPieChart}
              {memoizedLegend}
            </Card.Content>
          </Card>
        )}

        {barData && (
          <Card
            style={[
              styles.card,
              {
                borderColor: theme.colors.outlineVariant,
                borderWidth: 1,
              },
            ]}
            mode="contained"
            accessible={true}
            accessibilityLabel={`${t('expenseGrowthTitle')}. ${t('monthlyBarChartDescription' as any) || 'Bar chart showing monthly expense comparisons'}`}
          >
            <Card.Content>
              <Text
                style={[
                  styles.chartTitle,
                  {
                    color: theme.colors.onSurface,
                    fontFamily: 'Inter-SemiBold',
                    fontWeight: '600',
                  },
                ]}
              >
                {t('expenseGrowthTitle')}
              </Text>

              {analyticsReport?.hasEnoughHistory ? (
                <>
                  <Text
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontFamily: 'Inter-Regular',
                      fontWeight: '400',
                      fontSize: 12,
                      marginBottom: 8,
                    }}
                  >
                    {t('basedOnLastMonths')}
                  </Text>
                  {memoizedBarChart}
                  <View style={styles.growthContainer}>
                    <Text
                      style={[
                        styles.growthValue,
                        {
                          color:
                            expenseGrowth > 0
                              ? theme.colors.error
                              : theme.colors.income,
                          fontFamily: 'Inter-SemiBold',
                          fontWeight: '600',
                          fontSize: 22,
                        },
                      ]}
                    >
                      {expenseGrowth > 0 ? '+' : ''}
                      {expenseGrowth.toFixed(1)}%
                    </Text>
                    <Text
                      style={[
                        styles.subtext,
                        {
                          fontFamily: 'Inter-Regular',
                          fontWeight: '400',
                          fontSize: 12,
                        },
                      ]}
                    >
                      {t('comparedToLastMonth')}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Ionicons
                    name="time-outline"
                    size={32}
                    color={theme.colors.outline}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: 'Inter-Medium',
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    {t('notEnoughDataTitle' as any)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter-Regular',
                      color: theme.colors.outline,
                      fontSize: 12,
                      textAlign: 'center',
                      marginTop: 4,
                    }}
                  >
                    {t('notEnoughDataMessage' as any)}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {analyticsReport && analyticsReport.insights.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.onSurface,
                  fontFamily: 'Inter-SemiBold',
                  fontWeight: '600',
                },
              ]}
            >
              {t('insights')}
            </Text>
            {analyticsReport.insights.map((insight) => {
              let iconName: any = 'information-circle-outline';
              let iconColor = theme.colors.primary;
              let backgroundColor = addAlpha(
                theme.colors.primary,
                0.08,
                '#22C55E',
              );
              let borderColor = addAlpha(theme.colors.primary, 0.17, '#22C55E');

              if (insight.level === 'critical' || insight.level === 'warning') {
                iconName = 'alert-circle-outline';
                iconColor =
                  insight.level === 'critical'
                    ? theme.colors.error
                    : theme.colors.warning;
                backgroundColor = addAlpha(
                  iconColor,
                  0.08,
                  insight.level === 'critical' ? '#EF4444' : '#F59E0B',
                );
                borderColor = addAlpha(
                  iconColor,
                  0.17,
                  insight.level === 'critical' ? '#EF4444' : '#F59E0B',
                );
              } else if (insight.level === 'positive') {
                iconName = 'checkmark-circle-outline';
                iconColor = theme.colors.income;
                backgroundColor = addAlpha(
                  theme.colors.income,
                  0.08,
                  '#16A34A',
                );
                borderColor = addAlpha(theme.colors.income, 0.17, '#16A34A');
              }

              return (
                <Card
                  key={insight.id}
                  style={[
                    styles.insightCard,
                    {
                      borderColor: theme.colors.outlineVariant,
                      borderWidth: 1,
                    },
                  ]}
                  mode="contained"
                >
                  <Card.Content style={styles.insightContent}>
                    <View
                      style={[
                        styles.insightIconContainer,
                        {
                          backgroundColor: backgroundColor,
                          borderColor: borderColor,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Ionicons name={iconName} size={24} color={iconColor} />
                    </View>
                    <View style={styles.insightTextContainer}>
                      <Text
                        style={[
                          styles.insightTitle,
                          {
                            color: theme.colors.onSurface,
                            fontFamily: 'Inter-Medium',
                            fontWeight: '500',
                          },
                        ]}
                      >
                        {insight.title}
                      </Text>
                      <Text
                        style={[
                          styles.insightText,
                          {
                            color: theme.colors.onSurfaceVariant,
                            fontFamily: 'Inter-Regular',
                            fontWeight: '400',
                          },
                        ]}
                      >
                        {insight.message}
                      </Text>
                      {insight.recommendation && (
                        <View style={styles.recommendationContainer}>
                          <Text
                            style={{
                              color: theme.colors.primary,
                              fontFamily: 'Inter-Medium',
                              fontWeight: '500',
                              fontSize: 12,
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

        {filtered.txCount === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="bar-chart-outline"
              size={56}
              color={theme.colors.outlineVariant}
            />
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.onSurfaceVariant,
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: 14,
                },
              ]}
            >
              {t('noDataForPeriod')}
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.adContainer}>
        <BannerAdComponent />
      </View>
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
      textTransform: 'uppercase',
      fontSize: 10,
      letterSpacing: 1.2,
      marginTop: 4,
    },
    miniValue: {},
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
      fontSize: 18,
      marginBottom: 16,
      marginLeft: 4,
    },
    card: {
      borderRadius: 20,
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    chartTitle: {
      fontSize: 16,
      marginBottom: 4,
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
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
      fontSize: 13,
    },
    legendAmount: {
      marginLeft: 8,
    },
    growthContainer: {
      alignItems: 'center',
      marginTop: 8,
    },
    growthValue: {},
    subtext: {
      color: theme.colors.onSurfaceVariant,
    },
    insightCard: {
      marginBottom: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      elevation: 0,
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
      fontSize: 14,
    },
    insightText: {
      lineHeight: 18,
      fontSize: 13,
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
    emptyText: {},
    adContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
    },
  });
