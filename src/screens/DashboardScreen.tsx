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
import { BannerAdComponent } from '../components/BannerAdComponent';
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.accountsSection}>
          <Text style={styles.sectionHeader}>{t('accounts')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountsScrollContent}
          >
            {accounts.map((acc) => (
              <View
                key={acc.id}
                style={[
                  styles.accountCard,
                  { borderLeftColor: acc.color || '#2196f3' },
                ]}
              >
                <Text style={styles.accountCardName}>{acc.name}</Text>
                <Text style={styles.accountCardBalance}>
                  {formatCurrency(acc.currentBalance, acc.currency)}
                </Text>
                <Text style={styles.accountCardType}>
                  {t(acc.type).toUpperCase()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.summaryContainer}>
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

        <BannerAdComponent />
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
  accountsSection: {
    marginTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34495e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 16,
    marginBottom: 12,
  },
  accountsScrollContent: {
    paddingHorizontal: 16,
  },
  accountCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 160,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  accountCardName: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  accountCardBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 4,
  },
  accountCardType: {
    fontSize: 10,
    color: '#bdc3c7',
    fontWeight: '700',
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
