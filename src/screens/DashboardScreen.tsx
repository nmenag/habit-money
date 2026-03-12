import { endOfMonth, parseISO, startOfMonth } from 'date-fns';
import React, { useMemo } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ScoreCard } from '../components/ScoreCard';
import { useStore, useTranslation } from '../store/useStore';
import { calculateFinancialScore } from '../utils/scoreCalculator';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen = ({ navigation }: any) => {
  const { transactions, accounts, categories, formatCurrency } = useStore();
  const { t, language } = useTranslation();

  const scoreData = useMemo(
    () => calculateFinancialScore(transactions),
    [transactions],
  );

  const { totalIncome, totalExpenses, pieData } = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    let inc = 0;
    let exp = 0;
    const catExpenses: Record<string, number> = {};

    transactions.forEach((t) => {
      const d = parseISO(t.date);
      if (d >= start && d <= end) {
        if (t.type === 'income') {
          inc += t.amount;
        } else {
          exp += t.amount;
          if (t.categoryId) {
            catExpenses[t.categoryId] =
              (catExpenses[t.categoryId] || 0) + t.amount;
          }
        }
      }
    });

    const colors = [
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
    let cIdx = 0;

    const pie = Object.keys(catExpenses).map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      const color = cat?.color || colors[cIdx++ % colors.length];
      return {
        name: cat?.name || t('other'),
        population: catExpenses[catId],
        color: color,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      };
    });

    return { totalIncome: inc, totalExpenses: exp, pieData: pie };
  }, [transactions, categories, t, language]);

  const totalBalance = accounts.reduce((acc, a) => acc + a.currentBalance, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryContainer}>
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>{t('totalBalance')}</Text>
            <Text style={styles.balanceText}>
              {formatCurrency(totalBalance)}
            </Text>
          </View>

          <View style={styles.monthlyBox}>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyLabel}>{t('monthlyIncome')}</Text>
              <Text style={[styles.monthlyValue, { color: '#4caf50' }]}>
                +{formatCurrency(totalIncome)}
              </Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyLabel}>{t('monthlyExpenses')}</Text>
              <Text style={[styles.monthlyValue, { color: '#f44336' }]}>
                -{formatCurrency(totalExpenses)}
              </Text>
            </View>
          </View>
        </View>

        <ScoreCard scoreData={scoreData} />

        {pieData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t('chartTitle')}</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 32}
              height={200}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          </View>
        )}

        <View style={styles.adContainer}>
          <BannerAd
            unitId={TestIds.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 24,
  },
  summaryContainer: {
    padding: 16,
  },
  balanceBox: {
    backgroundColor: '#2c3e50',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#bdc3c7',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  monthlyBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthlyItem: {
    backgroundColor: '#fff',
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  monthlyLabel: {
    color: '#7f8c8d',
    fontSize: 12,
    textAlign: 'center',
  },
  monthlyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#34495e',
  },
  adContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
