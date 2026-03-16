import { Ionicons } from '@expo/vector-icons';
import { parseISO } from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Card,
  FAB,
  IconButton,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { FilterBar } from '../components/FilterBar';
import { ScoreCard } from '../components/ScoreCard';
import { useFilterStore } from '../store/useFilterStore';
import { useStore, useTranslation } from '../store/useStore';
import { calculateFinancialScore } from '../utils/scoreCalculator';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen = ({ navigation }: any) => {
  const { transactions, accounts, categories, formatCurrency } = useStore();
  const { t, language } = useTranslation();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const scoreData = useMemo(
    () => calculateFinancialScore(transactions),
    [transactions],
  );

  const { selectedRange } = useFilterStore();

  const { totalIncome, totalExpenses, pieData } = useMemo(() => {
    const now = new Date();
    const start = selectedRange.startDate;
    const end = selectedRange.endDate;

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

    const pie = Object.keys(catExpenses)
      .map((catId) => {
        const cat = categories.find((c) => c.id === catId);
        const color = cat?.color || colors[cIdx++ % colors.length];
        const amount = catExpenses[catId];
        const percentage = exp > 0 ? (amount / exp) * 100 : 0;
        return {
          name: cat?.name || t('other'),
          population: amount,
          color: color,
          percentage: percentage.toFixed(1),
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        };
      })
      .sort((a, b) => b.population - a.population);

    return { totalIncome: inc, totalExpenses: exp, pieData: pie };
  }, [transactions, categories, t, language, selectedRange]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.accountsSection}>
          <Text
            variant="labelLarge"
            style={[styles.sectionHeader, { color: theme.colors.secondary }]}
          >
            {t('accounts')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountsScrollContent}
          >
            {accounts.map((acc) => (
              <Card
                key={acc.id}
                style={[
                  styles.accountCard,
                  { borderLeftColor: acc.color || theme.colors.primary },
                ]}
                onPress={() =>
                  navigation.navigate('Transactions', { accountId: acc.id })
                }
                mode="elevated"
              >
                <Card.Content>
                  <Text variant="labelMedium" style={styles.accountCardName}>
                    {acc.name}
                  </Text>
                  <Text variant="titleMedium" style={styles.accountCardBalance}>
                    {formatCurrency(acc.currentBalance, acc.currency)}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.accountCardType,
                      { color: theme.colors.outline },
                    ]}
                  >
                    {t(acc.type).toUpperCase()}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Date Range Filter Bar */}
        <FilterBar />

        <View style={styles.summaryContainer}>
          <View style={styles.monthlyBox}>
            <Surface style={styles.monthlyItem} elevation={1}>
              <Text variant="labelSmall" style={styles.monthlyLabel}>
                {t('income')}
              </Text>
              <Text
                variant="titleLarge"
                style={[styles.monthlyValue, { color: '#4caf50' }]}
              >
                +{formatCurrency(totalIncome)}
              </Text>
            </Surface>
            <Surface style={styles.monthlyItem} elevation={1}>
              <Text variant="labelSmall" style={styles.monthlyLabel}>
                {t('monthlyExpenses')}
              </Text>
              <Text
                variant="titleLarge"
                style={[styles.monthlyValue, { color: theme.colors.error }]}
              >
                -{formatCurrency(totalExpenses)}
              </Text>
            </Surface>
          </View>
        </View>

        <ScoreCard scoreData={scoreData} />

        {pieData.length > 0 && (
          <Card style={styles.chartCard} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.chartTitle}>
                {t('chartTitle')}
              </Text>
              <View style={styles.pieRow}>
                <PieChart
                  data={pieData.map((d) => ({
                    ...d,
                    name: '',
                    population: parseFloat(d.percentage),
                  }))}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="50"
                  absolute
                  hasLegend={false}
                />
              </View>

              <View style={styles.categoryList}>
                {(showAllCategories ? pieData : pieData.slice(0, 5)).map(
                  (item, idx) => (
                    <View key={idx} style={styles.categoryInfoRow}>
                      <View style={styles.categoryLabelGroup}>
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: item.color },
                          ]}
                        />
                        <Text variant="bodyMedium" numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <View style={styles.categoryValueGroup}>
                        <Text
                          variant="bodyMedium"
                          style={styles.categoryAmount}
                        >
                          {formatCurrency(item.population)}
                        </Text>
                        <Text
                          variant="labelSmall"
                          style={{ color: theme.colors.outline }}
                        >
                          {item.percentage}%
                        </Text>
                      </View>
                    </View>
                  ),
                )}

                {pieData.length > 5 && (
                  <TouchableOpacity
                    onPress={() => setShowAllCategories(!showAllCategories)}
                    style={styles.showMoreBtn}
                  >
                    <Text
                      variant="labelLarge"
                      style={{ color: theme.colors.primary }}
                    >
                      {showAllCategories ? t('showLess') : t('showMore')}
                    </Text>
                    <Ionicons
                      name={showAllCategories ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        <BannerAdComponent />
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: (insets.bottom || 0) + 80 }]}
        onPress={() => navigation.navigate('AddTransaction')}
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: 100,
    },
    summaryContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    accountsSection: {
      marginTop: 16,
      paddingBottom: 8,
    },
    sectionHeader: {
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginLeft: 20,
      marginBottom: 12,
      fontWeight: '700',
    },
    accountsScrollContent: {
      paddingHorizontal: 16,
    },
    accountCard: {
      marginRight: 12,
      width: 160,
      borderLeftWidth: 4,
      borderRadius: 16,
    },
    accountCardName: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    accountCardBalance: {
      fontWeight: '900',
      marginVertical: 4,
    },
    accountCardType: {
      fontWeight: '700',
    },
    monthlyBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    monthlyItem: {
      flex: 1,
      padding: 20,
      borderRadius: 24,
      marginHorizontal: 4,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    monthlyLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    monthlyValue: {
      fontWeight: '900',
    },
    chartCard: {
      margin: 16,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
    },
    chartTitle: {
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    pieRow: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 180,
    },
    categoryList: {
      marginTop: 8,
    },
    categoryInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    categoryLabelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 12,
    },
    categoryValueGroup: {
      alignItems: 'flex-end',
    },
    categoryAmount: {
      fontWeight: '700',
    },
    showMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
    },
  });
