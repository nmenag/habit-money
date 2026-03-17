import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Card, Surface, Text, useTheme } from 'react-native-paper';
import { FilterBar } from '../components/FilterBar';
import { useFilterStore } from '../store/useFilterStore';
import { useStore, useTranslation } from '../store/useStore';
import { isInRange } from '../utils/dateFilters';

const screenWidth = Dimensions.get('window').width;

const CHART_COLORS = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#ff9800',
];

export const InsightsScreen = () => {
  const {
    transactions,
    categories,
    analyticsReport,
    formatCurrency,
    currencySymbol,
  } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const { selectedRange } = useFilterStore();

  const filtered = useMemo(() => {
    const inRange = transactions.filter((tx) =>
      isInRange(tx.date, selectedRange),
    );

    let totalIncome = 0;
    let totalExpenses = 0;
    const catExpMap: Record<string, number> = {};

    inRange.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        if (tx.categoryId) {
          catExpMap[tx.categoryId] =
            (catExpMap[tx.categoryId] || 0) + tx.amount;
        }
      }
    });

    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    let colorIdx = 0;
    const categoryBreakdown = Object.entries(catExpMap)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        const color =
          cat?.color || CHART_COLORS[colorIdx++ % CHART_COLORS.length];
        const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        return {
          id: catId,
          name: cat?.name ? translateName(cat.name) : t('other'),
          amount,
          color,
          percentage: pct.toFixed(1),
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const txCount = inRange.length;
    const spendingDays = new Set(
      inRange
        .filter((tx) => tx.type === 'expense')
        .map((tx) => tx.date.substring(0, 10)),
    ).size;

    return {
      totalIncome,
      totalExpenses,
      savings,
      savingsRate,
      categoryBreakdown,
      txCount,
      spendingDays,
    };
  }, [transactions, categories, selectedRange, t]);

  const barData = analyticsReport
    ? {
      labels: [t('previousMonth'), t('currentMonth')],
      datasets: [
        {
          data: [
            analyticsReport.previousMonth.expenses,
            analyticsReport.currentMonth.expenses,
          ],
          colors: [(_opacity = 1) => '#90caf9', (_opacity = 1) => '#2196f3'],
        },
      ],
    }
    : null;

  const expenseGrowth = analyticsReport?.expenseGrowth ?? 0;

  const pieData = filtered.categoryBreakdown.map((ce) => ({
    name: translateName(ce.name),
    population: ce.amount,
    color: ce.color,
    legendFontColor: theme.colors.onSurfaceVariant,
    legendFontSize: 11,
  }));

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

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
  };

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
                style={{ color: theme.colors.onPrimaryContainer, marginLeft: 4 }}
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
          <Surface
            style={[styles.miniCard, { backgroundColor: '#e8f5e9' }]}
            elevation={1}
          >
            <Ionicons name="arrow-up-circle" size={20} color="#2e7d32" />
            <Text
              variant="labelSmall"
              style={[styles.miniLabel, { color: '#388e3c' }]}
            >
              {t('income')}
            </Text>
            <Text
              variant="titleMedium"
              style={[styles.miniValue, { color: '#2e7d32' }]}
            >
              {formatCurrency(filtered.totalIncome)}
            </Text>
          </Surface>
          <Surface
            style={[styles.miniCard, { backgroundColor: '#ffebee' }]}
            elevation={1}
          >
            <Ionicons
              name="arrow-down-circle"
              size={20}
              color={theme.colors.error}
            />
            <Text
              variant="labelSmall"
              style={[styles.miniLabel, { color: theme.colors.error }]}
            >
              {t('expenses')}
            </Text>
            <Text
              variant="titleMedium"
              style={[styles.miniValue, { color: theme.colors.error }]}
            >
              {formatCurrency(filtered.totalExpenses)}
            </Text>
          </Surface>
        </View>

        {/* Savings Row */}
        <Surface
          style={[styles.savingsRow, { backgroundColor: theme.colors.surface }]}
          elevation={1}
        >
          <View style={styles.savingsItem}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {t('savingsRateTitle')}
            </Text>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: '900',
                color:
                  filtered.savingsRate >= 0 ? '#4caf50' : theme.colors.error,
              }}
            >
              {filtered.savingsRate.toFixed(1)}%
            </Text>
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
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {t('spendingFrequencyTitle')}
            </Text>
            <Text
              variant="titleLarge"
              style={{ fontWeight: '900', color: theme.colors.onSurface }}
            >
              {filtered.spendingDays}{' '}
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {t('daysLabel')}
              </Text>
            </Text>
          </View>
        </Surface>

        {/* Category Pie Chart */}
        {pieData.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.chartTitle}>
                {t('chartTitle')}
              </Text>
              <PieChart
                data={pieData.map((d) => ({
                  ...d,
                  name: '',
                  population: parseFloat(
                    ((d.population / filtered.totalExpenses) * 100).toFixed(1),
                  ),
                }))}
                width={screenWidth - 64}
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
              {/* Category Legend */}
              <View style={styles.legendList}>
                {filtered.categoryBreakdown.map((item, i) => (
                  <View key={i} style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text
                      variant="bodySmall"
                      style={styles.legendName}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {item.percentage}%
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.legendAmount,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Month-over-month Bar Chart (always shows global data) */}
        {barData && (
          <Card style={styles.card} mode="elevated">
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
                (Based on last 2 full months)
              </Text>
              <BarChart
                data={barData}
                width={screenWidth - 64}
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
              <View style={styles.growthContainer}>
                <Text
                  variant="headlineMedium"
                  style={[
                    styles.growthValue,
                    {
                      color: expenseGrowth > 0 ? theme.colors.error : '#4caf50',
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
              let iconColor = '#2196f3';
              let backgroundColor = '#e3f2fd';

              if (insight.level === 'critical') {
                iconName = 'alert-circle-outline';
                iconColor = theme.colors.error;
                backgroundColor = '#ffebee';
              } else if (insight.level === 'warning') {
                iconName = 'warning-outline';
                iconColor = '#ff9800';
                backgroundColor = '#fff3e0';
              } else if (insight.level === 'positive') {
                iconName = 'checkmark-circle-outline';
                iconColor = '#4caf50';
                backgroundColor = '#e8f5e9';
              } else {
                // info
                iconName = 'bulb-outline';
                iconColor = '#2196f3';
                backgroundColor = '#e3f2fd';
              }

              return (
                <Card
                  key={insight.id}
                  style={[styles.insightCard, { borderLeftColor: iconColor }]}
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
              No data for this period
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
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
      padding: 14,
      borderRadius: 16,
      alignItems: 'flex-start',
      gap: 4,
    },
    miniLabel: {
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: 10,
    },
    miniValue: {
      fontWeight: '900',
    },
    savingsRow: {
      flexDirection: 'row',
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
    },
    savingsItem: {
      flex: 1,
      padding: 16,
      alignItems: 'center',
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
      borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
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
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 6,
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
