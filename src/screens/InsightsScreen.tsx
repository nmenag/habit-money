import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Surface, Text, useTheme } from 'react-native-paper';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useStore, useTranslation } from '../store/useStore';

const screenWidth = Dimensions.get('window').width;

export const InsightsScreen = () => {
  const { analyticsReport, formatCurrency, currencySymbol } = useStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);

  if (!analyticsReport) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text style={styles.subtext}>Loading analytics...</Text>
      </View>
    );
  }

  const {
    currentMonth,
    previousMonth,
    insights,
    spendingDays,
    expenseGrowth,
    categoryExpenses,
  } = analyticsReport;

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
  };

  const barData = {
    labels: [t('previousMonth'), t('currentMonth')],
    datasets: [
      {
        data: [previousMonth.expenses, currentMonth.expenses],
        colors: [(opacity = 1) => '#90caf9', (opacity = 1) => '#2196f3'],
      },
    ],
  };

  const pieData = categoryExpenses.map((ce) => ({
    name: `${ce.categoryName}: ${formatCurrency(ce.amount)}`,
    population: ce.amount,
    color: ce.color || '#ccc',
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text variant="headlineSmall" style={styles.headerTitle}>
        {t('financialAnalysis')}
      </Text>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <Surface
          style={[styles.miniCard, { backgroundColor: '#e8f5e9' }]}
          elevation={1}
        >
          <Text variant="labelSmall" style={styles.miniLabel}>
            {t('income')}
          </Text>
          <Text
            variant="titleMedium"
            style={[styles.miniValue, { color: '#2e7d32' }]}
          >
            {formatCurrency(currentMonth.income)}
          </Text>
        </Surface>
        <Surface
          style={[styles.miniCard, { backgroundColor: '#ffebee' }]}
          elevation={1}
        >
          <Text variant="labelSmall" style={styles.miniLabel}>
            {t('expenses')}
          </Text>
          <Text
            variant="titleMedium"
            style={[styles.miniValue, { color: theme.colors.error }]}
          >
            {formatCurrency(currentMonth.expenses)}
          </Text>
        </Surface>
      </View>

      {/* Bar Chart: Expenses Comparison */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            {t('expenseGrowthTitle')}
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
                { color: expenseGrowth > 0 ? theme.colors.error : '#4caf50' },
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

      {/* Pie Chart: Expenses by Category */}
      {categoryExpenses.length > 0 && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              {t('chartTitle')}
            </Text>
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </Card.Content>
        </Card>
      )}

      {/* Insights Section */}
      <Text
        variant="titleLarge"
        style={[styles.headerTitle, { marginTop: 16 }]}
      >
        {t('insights')}
      </Text>
      {insights.map((insight) => (
        <Surface
          key={insight.id}
          style={[
            styles.insightBox,
            insight.level === 'positive' && styles.positiveBox,
            insight.level === 'warning' && styles.warningBox,
            insight.level === 'critical' && styles.criticalBox,
          ]}
          elevation={1}
        >
          <Text variant="titleSmall" style={styles.insightTitle}>
            {insight.title}
          </Text>
          <Text variant="bodyMedium" style={styles.insightText}>
            {insight.message}
          </Text>
        </Surface>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
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
    headerTitle: {
      fontWeight: 'bold',
      marginBottom: 16,
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    miniCard: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      marginHorizontal: 4,
    },
    miniLabel: {
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    miniValue: {
      fontWeight: '900',
      marginTop: 4,
    },
    card: {
      borderRadius: 24,
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    chartTitle: {
      fontWeight: '700',
      marginBottom: 16,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
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
    insightBox: {
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      borderLeftWidth: 6,
      backgroundColor: theme.colors.surface,
    },
    positiveBox: {
      borderLeftColor: '#4caf50',
    },
    warningBox: {
      borderLeftColor: '#ff9800',
    },
    criticalBox: {
      borderLeftColor: '#f44336',
    },
    insightTitle: {
      fontWeight: '700',
      marginBottom: 4,
    },
    insightText: {
      color: theme.colors.onSurface,
      lineHeight: 20,
    },
  });
