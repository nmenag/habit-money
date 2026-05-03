import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Card,
  Divider,
  FAB,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { TransactionItem } from '../components/TransactionItem';
import { useStore, useTranslation } from '../store/useStore';

export const DashboardScreen = React.memo(() => {
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const goals = useStore((s) => s.goals);
  const budgets = useStore((s) => s.budgets);
  const accounts = useStore((s) => s.accounts);
  const isLoaded = useStore((s) => s.isLoaded);
  const formatCurrency = useStore((s) => s.formatCurrency);

  const { t, language, translateName } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  // 3. Data layer - helper functions
  const data = useMemo(() => {
    const now = new Date();
    // Use UTC for current and last month ranges
    const currentStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const currentEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
    const lastStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const lastEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999),
    );

    // A. Balance Summary
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    const catExpenses: Record<string, number> = {};

    // For Insight (B. vs Last Month)
    let lastMonthExpenses = 0;

    transactions.forEach((tr) => {
      const trDate = new Date(tr.date);
      const isAdjustment =
        tr.note && translateName(tr.note) === t('balanceAdjustment');

      if (trDate >= currentStart && trDate <= currentEnd) {
        if (tr.type === 'income' && !isAdjustment) {
          monthlyIncome += tr.amount;
        } else if (tr.type === 'expense' && !isAdjustment) {
          monthlyExpenses += tr.amount;
          if (tr.categoryId) {
            catExpenses[tr.categoryId] =
              (catExpenses[tr.categoryId] || 0) + tr.amount;
          }
        }
      } else if (trDate >= lastStart && trDate <= lastEnd) {
        if (tr.type === 'expense' && !isAdjustment) {
          lastMonthExpenses += tr.amount;
        }
      }
    });

    const remainingBalance = monthlyIncome - monthlyExpenses;

    // C. Top Category
    const topCatId = Object.keys(catExpenses).reduce(
      (a, b) => (catExpenses[a] > catExpenses[b] ? a : b),
      '',
    );
    const topCategory = categories.find((c) => c.id === topCatId);
    const topCatAmount = topCatId ? catExpenses[topCatId] : 0;
    const topCatPercent =
      monthlyExpenses > 0 ? (topCatAmount / monthlyExpenses) * 100 : 0;

    // D. Main Insight
    let insight = '';
    if (monthlyExpenses > lastMonthExpenses && lastMonthExpenses > 0) {
      const diff =
        ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      insight = t('insightSpentMore', { percent: diff.toFixed(0) });
    } else if (remainingBalance > 0) {
      insight = t('insightSavingMoney');
    } else {
      insight = t('insightKeepGoing');
    }

    // E. Goals Preview
    const activeGoals = goals.filter((g) => g.status === 'active').slice(0, 2);

    // F. Recent Transactions
    const recentTransactions = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    // Spending Progress (B) - find total budget if any
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const limit = totalBudget > 0 ? totalBudget : monthlyIncome;
    const ratio = limit > 0 ? monthlyExpenses / limit : 0;
    const progress = Math.min(ratio, 1);

    let progressColor = theme.colors.primary; // Growth Signal Green
    if (ratio > 0.9)
      progressColor = theme.colors.error; // Red
    else if (ratio >= 0.7) progressColor = '#F59E0B'; // Amber/Orange

    let progressMessage = '';
    if (monthlyExpenses > 0 || monthlyIncome > 0) {
      progressMessage = t('doingWell');
      if (ratio > 1.0) progressMessage = t('exceededLimit');
      else if (ratio > 0.9) progressMessage = t('aboutToExceed');
      else if (ratio >= 0.7) progressMessage = t('closeToLimit');
    }

    // G. Total Balance (all accounts)
    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

    return {
      monthlyIncome,
      monthlyExpenses,
      remainingBalance,
      topCategory,
      topCatAmount,
      topCatPercent,
      insight,
      activeGoals,
      recentTransactions,
      totalBudget,
      limit,
      progress,
      progressRatio: ratio,
      progressColor,
      progressMessage,
      totalBalance,
    };
  }, [
    transactions,
    categories,
    goals,
    budgets,
    accounts,
    t,
    theme,
    translateName,
  ]);

  const currentMonthDisplay = useMemo(() => {
    const now = new Date();
    const utcDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
    return format(utcDate, 'MMMM yyyy', {
      locale: language === 'es' ? esLocale : enUS,
    });
  }, [language]);

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.monthHeader}>
          <Text variant="headlineSmall" style={styles.monthText}>
            {currentMonthDisplay}
          </Text>
        </View>

        {/* A. Balance Summary */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('balanceSummary')}
            </Text>
            <View style={styles.balanceRow}>
              <View>
                <Text variant="labelSmall">{t('income')}</Text>
                <Text
                  style={[styles.amountText, { color: theme.colors.primary }]}
                >
                  {formatCurrency(data.monthlyIncome)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="labelSmall">{t('expense')}</Text>
                <Text
                  style={[styles.amountText, { color: theme.colors.error }]}
                >
                  {formatCurrency(data.monthlyExpenses)}
                </Text>
              </View>
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.balanceRow}>
              <Text variant="titleMedium">{t('remaining')}</Text>
              <Text
                variant="titleLarge"
                style={{
                  fontWeight: '900',
                  color:
                    data.remainingBalance >= 0 ? '#16A34A' : theme.colors.error,
                }}
              >
                {formatCurrency(data.remainingBalance)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* AA. Accounts Summary */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium">{t('accounts')}</Text>
              <TouchableOpacity onPress={() => router.push('/accounts')}>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary }}
                >
                  {t('viewAll')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 8 }}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline }}
              >
                {t('totalBalance')}
              </Text>
              <Text variant="headlineSmall" style={{ fontWeight: '900' }}>
                {formatCurrency(data.totalBalance)}
              </Text>
            </View>
            <Divider style={{ marginVertical: 8 }} />
            {accounts.slice(0, 3).map((acc, index) => (
              <View key={acc.id}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/account-detail',
                      params: { accountId: acc.id },
                    })
                  }
                  style={[styles.row, { paddingVertical: 10 }]}
                >
                  <Avatar.Icon
                    size={32}
                    icon={
                      acc.type === 'bank'
                        ? 'bank'
                        : acc.type === 'credit'
                          ? 'credit-card'
                          : 'cash'
                    }
                    style={{
                      backgroundColor: acc.color || theme.colors.primary,
                    }}
                    color="#fff"
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text variant="bodyMedium" style={{ fontWeight: '700' }}>
                      {translateName(acc.name)}
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                    {formatCurrency(acc.currentBalance, acc.currency)}
                  </Text>
                </TouchableOpacity>
                {index < Math.min(accounts.length, 3) - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* B. Monthly Spending Progress */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium">{t('spendingProgress')}</Text>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                {formatCurrency(data.monthlyExpenses)}
              </Text>
            </View>
            <ProgressBar
              progress={data.progress}
              color={data.progressColor}
              style={styles.progressBar}
            />
            <View
              style={[
                styles.row,
                { justifyContent: 'space-between', marginTop: 6 },
              ]}
            >
              {data.progressMessage ? (
                <Text
                  variant="labelSmall"
                  style={{ color: data.progressColor, fontWeight: 'bold' }}
                >
                  {data.progressMessage}
                </Text>
              ) : null}
              {data.limit > 0 && (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline }}
                >
                  {t('totalBudgetLimit', {
                    amount: formatCurrency(data.limit),
                  })}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* C. Top Category */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('topSpendingCategory')}
            </Text>
            {data.topCategory ? (
              <View style={styles.row}>
                <Avatar.Icon
                  size={40}
                  icon={data.topCategory.icon || 'tag'}
                  style={{
                    backgroundColor:
                      data.topCategory.color || theme.colors.primary,
                  }}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text variant="titleMedium">
                    {translateName(data.topCategory.name)}
                  </Text>
                  <Text variant="labelSmall">
                    {data.topCatPercent.toFixed(1)}% {t('ofTotalExpenses')}
                  </Text>
                </View>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  {formatCurrency(data.topCatAmount)}
                </Text>
              </View>
            ) : (
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.outline, fontStyle: 'italic' }}
              >
                {t('noDataForPeriod')}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* D. Main Insight */}
        <Card
          style={[
            styles.card,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          mode="contained"
        >
          <Card.Content style={styles.insightContent}>
            <Ionicons
              name="bulb-outline"
              size={24}
              color={theme.colors.onPrimaryContainer}
            />
            <Text
              variant="bodyLarge"
              style={[
                styles.insightText,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {data.insight}
            </Text>
          </Card.Content>
        </Card>

        {/* E. Goals Preview */}
        {goals.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium">{t('goals')}</Text>
                <TouchableOpacity onPress={() => router.push('/goals')}>
                  <Text
                    variant="labelLarge"
                    style={{ color: theme.colors.primary }}
                  >
                    {t('viewAll')}
                  </Text>
                </TouchableOpacity>
              </View>
              {data.activeGoals.length > 0 ? (
                data.activeGoals.map((goal) => (
                  <View key={goal.id} style={{ marginBottom: 16 }}>
                    <View style={styles.cardHeader}>
                      <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                        {goal.name}
                      </Text>
                      <Text variant="labelSmall">
                        {formatCurrency(goal.currentAmount)} /{' '}
                        {formatCurrency(goal.targetAmount)}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={Math.min(
                        goal.currentAmount / goal.targetAmount,
                        1,
                      )}
                      color={goal.color || theme.colors.primary}
                      style={styles.progressBar}
                    />
                  </View>
                ))
              ) : (
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.outline, fontStyle: 'italic' }}
                >
                  {t('noGoals')}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* F. Recent Transactions */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={[styles.cardHeader, { marginBottom: 12 }]}>
              <Text variant="titleMedium">{t('recentTransactions')}</Text>
              <TouchableOpacity onPress={() => router.push('/transactions')}>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary }}
                >
                  {t('seeAll')}
                </Text>
              </TouchableOpacity>
            </View>
            {data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tr, index) => {
                const cat = categories.find((c) => c.id === tr.categoryId);
                return (
                  <View key={tr.id}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/add-transaction',
                          params: {
                            transaction: JSON.stringify(tr),
                            isEditing: 'true',
                          },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <TransactionItem transaction={tr} category={cat} />
                    </TouchableOpacity>
                    {index < data.recentTransactions.length - 1 && <Divider />}
                  </View>
                );
              })
            ) : (
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.outline,
                  fontStyle: 'italic',
                  textAlign: 'center',
                  paddingVertical: 20,
                }}
              >
                {t('noTransactions')}
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <BannerAdComponent />
    </View>
  );
});

DashboardScreen.displayName = 'DashboardScreen';

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 120,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthHeader: {
      marginBottom: 24,
      marginTop: 8,
    },
    monthText: {
      fontWeight: '900',
      color: theme.colors.primary,
      textTransform: 'capitalize',
      fontSize: 28,
      letterSpacing: -0.5,
    },
    card: {
      marginBottom: 20,
      borderRadius: 16,
      elevation: 0,
      backgroundColor: theme.colors.elevation.level1,
    },
    cardTitle: {
      marginBottom: 16,
      fontWeight: '800',
      fontSize: 18,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    amountText: {
      fontSize: 20,
      fontWeight: '800',
    },
    progressBar: {
      height: 10,
      borderRadius: 5,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
    },
    insightContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    insightText: {
      marginLeft: 12,
      flex: 1,
      fontWeight: '700',
      lineHeight: 22,
    },
  });
