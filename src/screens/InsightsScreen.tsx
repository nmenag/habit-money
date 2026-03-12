import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore, useTranslation } from '../store/useStore';
import { calculateFinancialScore } from '../utils/scoreCalculator';

export const InsightsScreen = () => {
  const { transactions } = useStore();
  const { t, language } = useTranslation();
  const scoreData = calculateFinancialScore(transactions);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>{t('financialAnalysis')}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t('savingsRateTitle')}</Text>
        <Text style={styles.value}>
          {(scoreData.savingsRate * 100).toFixed(1)}%
        </Text>
        <Text style={styles.subtext}>{t('recommendationSavings')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('expenseGrowthTitle')}</Text>
        <Text
          style={[
            styles.value,
            { color: scoreData.expenseGrowth > 0 ? '#f44336' : '#4caf50' },
          ]}
        >
          {scoreData.expenseGrowth > 0 ? '+' : ''}
          {scoreData.expenseGrowth.toFixed(1)}%
        </Text>
        <Text style={styles.subtext}>{t('comparedToLastMonth')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('spendingFrequencyTitle')}</Text>
        <Text style={styles.value}>
          {scoreData.spendingDays} {t('daysLabel')}
        </Text>
        <Text style={styles.subtext}>{t('daysSpentMoney')}</Text>
      </View>

      {scoreData.insights.map((insight, idx) => (
        <View key={idx} style={styles.insightBox}>
          <Text style={styles.insightText}>
            💡 {t(insight.key, insight.params)}
          </Text>
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
  insightText: {
    color: '#1565c0',
    fontSize: 14,
    lineHeight: 20,
  },
});
