import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store/useStore';
import { calculateFinancialScore } from '../utils/scoreCalculator';

export const InsightsScreen = () => {
  const transactions = useStore((state) => state.transactions);
  const scoreData = calculateFinancialScore(transactions);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Financial Analysis</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Savings Rate</Text>
        <Text style={styles.value}>
          {(scoreData.savingsRate * 100).toFixed(1)}%
        </Text>
        <Text style={styles.subtext}>Recommendation: Keep it above 20%</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Expense Growth</Text>
        <Text
          style={[
            styles.value,
            { color: scoreData.expenseGrowth > 0 ? '#f44336' : '#4caf50' },
          ]}
        >
          {scoreData.expenseGrowth > 0 ? '+' : ''}
          {scoreData.expenseGrowth.toFixed(1)}%
        </Text>
        <Text style={styles.subtext}>Compared to last month</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Spending Frequency</Text>
        <Text style={styles.value}>{scoreData.spendingDays} days</Text>
        <Text style={styles.subtext}>Days you spent money this month</Text>
      </View>

      {scoreData.insights.map((insight, idx) => (
        <View key={idx} style={styles.insightBox}>
          <Text style={styles.insightText}>💡 {insight}</Text>
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
