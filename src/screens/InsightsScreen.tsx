import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore, useTranslation } from '../store/useStore';
import { calculateFinancialScore } from '../utils/scoreCalculator';

export const InsightsScreen = () => {
  const { analyticsReport } = useStore();
  const { t } = useTranslation();

  if (!analyticsReport) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtext}>Loading analytics...</Text>
      </View>
    );
  }

  const { currentMonth, previousMonth, insights, spendingDays, expenseGrowth } =
    analyticsReport;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>{t('financialAnalysis')}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t('savingsRateTitle')}</Text>
        <Text style={styles.value}>
          {(currentMonth.savingsRate * 100).toFixed(1)}%
        </Text>
        <Text style={styles.subtext}>{t('recommendationSavings')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('expenseGrowthTitle')}</Text>
        <Text
          style={[
            styles.value,
            { color: expenseGrowth > 0 ? '#f44336' : '#4caf50' },
          ]}
        >
          {expenseGrowth > 0 ? '+' : ''}
          {expenseGrowth.toFixed(1)}%
        </Text>
        <Text style={styles.subtext}>{t('comparedToLastMonth')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('spendingFrequencyTitle')}</Text>
        <Text style={styles.value}>
          {spendingDays} {t('daysLabel')}
        </Text>
        <Text style={styles.subtext}>{t('daysSpentMoney')}</Text>
      </View>

      {insights.map((insight) => (
        <View
          key={insight.id}
          style={[
            styles.insightBox,
            insight.level === 'positive' && styles.positiveBox,
            insight.level === 'warning' && styles.warningBox,
            insight.level === 'critical' && styles.criticalBox,
          ]}
        >
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightText}>{insight.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  subtext: {
    fontSize: 12,
    color: '#aaa',
  },
  insightBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  positiveBox: {
    backgroundColor: '#e8f5e9',
    borderLeftColor: '#4caf50',
  },
  warningBox: {
    backgroundColor: '#fff3e0',
    borderLeftColor: '#ff9800',
  },
  criticalBox: {
    backgroundColor: '#ffebee',
    borderLeftColor: '#f44336',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  insightText: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
  },
});
