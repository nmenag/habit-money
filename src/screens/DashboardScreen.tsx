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
import { useStore, useTranslation } from '../store/useStore';
import { spacing, lightTheme, darkTheme } from '../theme/theme';

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

  const analyticsReport = useStore((s) => s.analyticsReport);
  const refreshAnalytics = useStore((s) => s.refreshAnalytics);

  React.useEffect(() => {
    if (!analyticsReport) {
      refreshAnalytics();
    }
  }, [analyticsReport, refreshAnalytics]);

  // 3. Data layer - optimized mapping from report
  const data = useMemo(() => {
    if (!analyticsReport) return null;

    const { currentMonth } = analyticsReport;
    const monthlyIncome = currentMonth.income;
    const monthlyExpenses = currentMonth.expenses;
    const remainingBalance = currentMonth.savings;

    // Accounts & Goals (Small arrays, fast to compute)
    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const activeGoals = goals.filter((g) => g.status === 'active').slice(0, 2);
    const recentTransactions = transactions.slice(0, 5);

    // Budgeting logic
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const limit = totalBudget > 0 ? totalBudget : monthlyIncome;
    const ratio = limit > 0 ? monthlyExpenses / limit : 0;
    const progress = Math.min(ratio, 1);

    let progressColor = theme.colors.primary;
    if (ratio > 0.9) progressColor = theme.colors.error;
    else if (ratio >= 0.7) progressColor = theme.colors.warning; // Use semantic warning color

    let progressMessage = '';
    if (monthlyExpenses > 0 || monthlyIncome > 0) {
      progressMessage = t('doingWell');
      if (ratio > 1.0) progressMessage = t('exceededLimit');
      else if (ratio > 0.9) progressMessage = t('aboutToExceed');
      else if (ratio >= 0.7) progressMessage = t('closeToLimit');
    }

    // Top Category
    const topCatId = currentMonth.topCategory?.id;
    const topCategory = topCatId
      ? categories.find((c) => c.id === topCatId)
      : undefined;
    const topCatAmount = currentMonth.topCategory?.amount || 0;
    const topCatPercent =
      monthlyExpenses > 0 ? (topCatAmount / monthlyExpenses) * 100 : 0;

    return {
      monthlyIncome,
      monthlyExpenses,
      remainingBalance,
      topCategory,
      topCatAmount,
      topCatPercent,
      insight: analyticsReport.insights[0]?.message || t('insightKeepGoing'),
      activeGoals,
      recentTransactions,
      totalBudget,
      limit,
      progress,
      progressColor,
      progressMessage,
      totalBalance,
    };
  }, [
    analyticsReport,
    accounts,
    goals,
    transactions,
    budgets,
    categories,
    theme,
    t,
  ]);

  const currentMonthDisplay = useMemo(() => {
    const now = new Date();
    return format(now, 'MMMM yyyy', {
      locale: language === 'es' ? esLocale : enUS,
    });
  }, [language]);

  if (!isLoaded || !data) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
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

        {/* 1. Main Balance Summary - Contained for hierarchy */}
        <Card
          style={[
            styles.card,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          mode="contained"
        >
          <Card.Content>
            <View style={styles.balanceRow}>
              <View>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onPrimaryContainer }}
                >
                  {t('monthlyIncome')}
                </Text>
                <Text
                  style={[styles.amountText, { color: theme.colors.primary }]}
                >
                  {formatCurrency(data.monthlyIncome)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onPrimaryContainer }}
                >
                  {t('monthlyExpenses')}
                </Text>
                <Text
                  style={[styles.amountText, { color: theme.colors.error }]}
                >
                  {formatCurrency(data.monthlyExpenses)}
                </Text>
              </View>
            </View>
            <Divider style={{ marginVertical: spacing.sm, opacity: 0.3 }} />
            <View style={styles.balanceRow}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {t('remaining')}
              </Text>
              <Text
                variant="titleLarge"
                style={{
                  fontWeight: '900',
                  color:
                    data.remainingBalance >= 0
                      ? theme.colors.income
                      : theme.colors.error,
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
                    color={theme.colors.onPrimary}
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
                const isAdjustment =
                  tr.note && translateName(tr.note) === t('balanceAdjustment');
                return (
                  <View key={tr.id}>
                    <View style={[styles.row, { paddingVertical: 12 }]}>
                      <Avatar.Icon
                        size={36}
                        icon={
                          tr.type === 'transfer'
                            ? 'swap-horizontal'
                            : isAdjustment
                              ? 'scale-balance'
                              : cat?.icon ||
                                (tr.type === 'income' ? 'plus' : 'minus')
                        }
                        style={{
                          backgroundColor:
                            tr.type === 'transfer'
                              ? theme.colors.tertiary
                              : isAdjustment
                                ? theme.colors.surfaceVariant
                                : cat?.color ||
                                  (tr.type === 'income'
                                    ? '#16A34A'
                                    : theme.colors.error),
                        }}
                        color={
                          isAdjustment
                            ? theme.colors.onSurfaceVariant
                            : theme.colors.onPrimary
                        }
                      />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text variant="bodyLarge" numberOfLines={1}>
                          {tr.note &&
                          translateName(tr.note) === t('balanceAdjustment')
                            ? t('balanceAdjustment')
                            : tr.note ||
                              (tr.type === 'transfer'
                                ? t('transfer')
                                : translateName(cat?.name || 'Other'))}
                        </Text>
                        <Text
                          variant="labelSmall"
                          style={{ color: theme.colors.outline }}
                        >
                          {format(parseISO(tr.date), 'MMM dd, yyyy', {
                            locale: language === 'es' ? esLocale : enUS,
                          })}
                        </Text>
                      </View>
                      <Text
                        variant="bodyLarge"
                        style={[
                          styles.amountText,
                          {
                            color:
                              tr.type === 'transfer'
                                ? theme.colors.onSurface
                                : tr.type === 'income'
                                  ? theme.colors.income
                                  : theme.colors.error,
                          },
                        ]}
                      >
                        {tr.type === 'transfer'
                          ? ''
                          : tr.type === 'income'
                            ? '+'
                            : '-'}
                        {formatCurrency(tr.amount)}
                      </Text>
                    </View>
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

        <View style={{ height: 20 }} />
      </ScrollView>

      <BannerAdComponent />

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: (insets.bottom || 0) + 120,
            backgroundColor: theme.colors.primary,
          },
        ]}
        color={theme.colors.onPrimary}
        onPress={() => router.push('/add-transaction')}
        accessibilityLabel={t('addTransaction')}
        accessibilityRole="button"
      />
    </View>
  );
});

DashboardScreen.displayName = 'DashboardScreen';

const defaultStyles = (theme: typeof lightTheme | typeof darkTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      paddingBottom: 100,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthHeader: {
      marginBottom: spacing.lg,
      marginTop: spacing.sm,
    },
    monthText: {
      fontWeight: '900',
      color: theme.colors.primary,
      textTransform: 'capitalize',
    },
    card: {
      marginBottom: spacing.md,
      borderRadius: theme.roundness,
    },
    cardTitle: {
      marginBottom: spacing.md,
      fontWeight: 'bold',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    amountText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    insightContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    insightText: {
      marginLeft: spacing.md,
      flex: 1,
      fontWeight: '600',
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
      borderRadius: 20,
      elevation: 4,
    },
  });
