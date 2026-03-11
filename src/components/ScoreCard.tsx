import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScoreData } from '../utils/scoreCalculator';

interface Props {
  scoreData: ScoreData;
}

export const ScoreCard: React.FC<Props> = ({ scoreData }) => {
  const getStatusColor = () => {
    switch (scoreData.status) {
      case 'healthy':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'overspending':
        return '#f44336';
    }
  };

  return (
    <View style={[styles.card, { borderTopColor: getStatusColor() }]}>
      <Text style={styles.title}>Financial Discipline Score</Text>

      <View style={styles.scoreContainer}>
        <Text style={[styles.score, { color: getStatusColor() }]}>
          {scoreData.score}
        </Text>
        <Text style={styles.outOf}>/ 100</Text>
      </View>

      <View style={styles.streakContainer}>
        <Text style={styles.streakText}>
          🔥 {scoreData.streak} positive months in a row
        </Text>
      </View>

      <View style={styles.insights}>
        {scoreData.insights.map((insight, index) => (
          <Text key={index} style={styles.insightText}>
            • {insight}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    margin: 16,
    borderTopWidth: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginVertical: 16,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  outOf: {
    fontSize: 18,
    color: '#888',
    marginLeft: 4,
  },
  streakContainer: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  streakText: {
    fontWeight: '600',
    color: '#333',
  },
  insights: {
    marginTop: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});
