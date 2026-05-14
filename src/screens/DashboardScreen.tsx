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
import { getValidCategoryIcon } from '../constants';
import { useStore, useTranslation } from '../store/useStore';
import { AppTheme, spacing } from '../theme/theme';
import { fontScale, moderateScale } from '../utils/responsive';

export const DashboardScreen = React.memo(() => {
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const goals = useStore((s) => s.goals);
  const budgets = useStore((s) => s.budgets);
  const accounts = useStore((s) => s.accounts);
  const isLoaded = useStore((s) => s.isLoaded);
  const formatCurrency = useStore((s) => s.formatCurrency);

  const { t, language, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const analyticsReport = useStore((s) => s.analyticsReport);
  const refreshAnalytics = useStore((s) => s.refreshAnalytics);

  React.useEffect(() => {
    if (!analyticsReport) {
      refreshAnalytics();
    }
  }, [analyticsReport, refreshAnalytics]);

  const financialData = useMemo(() => {
    if (!analyticsReport) return null;

    const { currentMonth } = analyticsReport;
    const monthlyIncome = currentMonth.income;
    const monthlyExpenses = currentMonth.expenses;
    const monthlyAdjustments = currentMonth.adjustments;
    const remainingBalance = currentMonth.savings;

    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const activeGoals = goals.filter((g) => g.status === 'active').slice(0, 2);
    const recentTransactions = transactions.slice(0, 5);

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const limit = totalBudget > 0 ? totalBudget : monthlyIncome;
    const ratio = limit > 0 ? monthlyExpenses / limit : 0;
    const progress = Math.min(ratio, 1);

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
      monthlyAdjustments,
      remainingBalance,
      topCategory,
      topCatAmount,
      topCatPercent,
      activeGoals,
      recentTransactions,
      totalBudget,
      limit,
      progress,
      totalBalance,
      ratio,
      insightMessage: analyticsReport.insights[0]?.message,
    };
  }, [analyticsReport, accounts, goals, transactions, budgets, categories]);

  const uiData = useMemo(() => {
    if (!financialData) return null;

    const { ratio, insightMessage, monthlyExpenses, monthlyIncome } =
      financialData;

    let progressColor = theme.colors.primary;
    if (ratio > 0.9) progressColor = theme.colors.error;
    else if (ratio >= 0.7) progressColor = theme.colors.warning;

    let progressMessage = '';
    if (monthlyExpenses > 0 || monthlyIncome > 0) {
      progressMessage = t('doingWell');
      if (ratio > 1.0) progressMessage = t('exceededLimit');
      else if (ratio > 0.9) progressMessage = t('aboutToExceed');
      else if (ratio >= 0.7) progressMessage = t('closeToLimit');
    }

    return {
      progressColor,
      progressMessage,
      insight: insightMessage || t('insightKeepGoing'),
    };
  }, [financialData, theme, t]);

  const data = useMemo(() => {
    if (!financialData || !uiData) return null;
    return {
      ...financialData,
      ...uiData,
    };
  }, [financialData, uiData]);

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
        <View style={styles.monthHeader} accessibilityRole="header">
          <Text
            variant="headlineSmall"
            style={styles.monthText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
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
              <View style={{ flex: 1 }}>
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onPrimaryContainer,
                    fontWeight: '800',
                    letterSpacing: 0.8,
                  }}
                  numberOfLines={1}
                >
                  {t('monthlyIncome').toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.amountText,
                    { color: theme.colors.income, fontSize: fontScale(22) },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(data.monthlyIncome)}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  alignItems: 'flex-end',
                  marginLeft: spacing.sm,
                }}
              >
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onPrimaryContainer,
                    fontWeight: '800',
                    letterSpacing: 0.8,
                  }}
                  numberOfLines={1}
                >
                  {t('monthlyExpenses').toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.amountText,
                    { color: theme.colors.error, fontSize: fontScale(22) },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(data.monthlyExpenses)}
                </Text>
              </View>
            </View>

            {data.monthlyAdjustments !== 0 && (
              <View style={[styles.balanceRow, { marginTop: spacing.xs }]}>
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.outline,
                    fontWeight: '700',
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {t('adjustments').toUpperCase()}
                </Text>
                <Text
                  variant="labelMedium"
                  style={{
                    fontWeight: '700',
                    color: theme.colors.onPrimaryContainer,
                    flexShrink: 1,
                    textAlign: 'right',
                    marginLeft: 8,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {data.monthlyAdjustments > 0 ? '+' : ''}
                  {formatCurrency(data.monthlyAdjustments)}
                </Text>
              </View>
            )}

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
                  flex: 1,
                  textAlign: 'right',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
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
              <Text variant="titleMedium" style={{ flex: 1 }}>
                {t('accounts')}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/accounts')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={t('viewAll')}
                accessibilityRole="button"
              >
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary, marginLeft: 8 }}
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
              <Text
                variant="headlineSmall"
                style={{ fontWeight: '900' }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
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
                  accessibilityLabel={`${translateName(acc.name)}, ${formatCurrency(acc.currentBalance, acc.currency)}`}
                  accessibilityRole="button"
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
                    <Text
                      variant="bodyMedium"
                      style={{ fontWeight: '700' }}
                      numberOfLines={1}
                    >
                      {translateName(acc.name)}
                    </Text>
                  </View>
                  <Text
                    variant="bodyLarge"
                    style={{
                      fontWeight: 'bold',
                      flexShrink: 1,
                      textAlign: 'right',
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
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
              <Text variant="titleMedium" style={{ flex: 1 }}>
                {t('spendingProgress')}
              </Text>
              <Text
                variant="titleSmall"
                style={{
                  fontWeight: 'bold',
                  flexShrink: 1,
                  textAlign: 'right',
                  marginLeft: 8,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(data.monthlyExpenses)}
              </Text>
            </View>
            <ProgressBar
              progress={data.progress}
              color={data.progressColor}
              style={styles.progressBar}
              accessibilityLabel={t('spendingProgress')}
              accessibilityValue={{
                now: Math.round(data.progress * 100),
                min: 0,
                max: 100,
                text: `${Math.round(data.progress * 100)}%`,
              }}
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
                  style={{
                    color: theme.colors.outline,
                    flex: 1,
                    textAlign: 'right',
                    marginLeft: 8,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
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
                  icon={getValidCategoryIcon(data.topCategory.icon)}
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
                <Text
                  variant="titleMedium"
                  style={{
                    fontWeight: 'bold',
                    flexShrink: 1,
                    textAlign: 'right',
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
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
                <Text variant="titleMedium" style={{ flex: 1 }}>
                  {t('goals')}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/goals')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel={t('viewAll')}
                  accessibilityRole="button"
                >
                  <Text
                    variant="labelLarge"
                    style={{ color: theme.colors.primary, marginLeft: 8 }}
                  >
                    {t('viewAll')}
                  </Text>
                </TouchableOpacity>
              </View>
              {data.activeGoals.length > 0 ? (
                data.activeGoals.map((goal) => (
                  <View key={goal.id} style={{ marginBottom: 16 }}>
                    <View style={styles.cardHeader}>
                      <Text
                        variant="bodyMedium"
                        style={{ fontWeight: 'bold', flex: 1 }}
                        numberOfLines={1}
                      >
                        {goal.name}
                      </Text>
                      <Text
                        variant="labelSmall"
                        style={{
                          flexShrink: 1,
                          textAlign: 'right',
                          marginLeft: 8,
                        }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
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
                      accessibilityLabel={`${goal.name} ${t('progress')}`}
                      accessibilityValue={{
                        now: Math.round(
                          (goal.currentAmount / goal.targetAmount) * 100,
                        ),
                        min: 0,
                        max: 100,
                        text: `${Math.round((goal.currentAmount / goal.targetAmount) * 100)}%`,
                      }}
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
              <Text variant="titleMedium" style={{ flex: 1 }}>
                {t('recentTransactions')}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/transactions')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={t('seeAll')}
                accessibilityRole="button"
              >
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary, marginLeft: 8 }}
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
                    <TouchableOpacity
                      onPress={() => router.push('/transactions')}
                      style={[styles.row, { paddingVertical: 12 }]}
                      accessibilityLabel={`${tr.note || translateName(cat?.name || 'Other')}, ${tr.type === 'income' ? '+' : '-'}${formatCurrency(tr.amount)}, ${format(parseISO(tr.date), 'MMM dd', { locale: language === 'es' ? esLocale : enUS })}`}
                      accessibilityRole="button"
                    >
                      <Avatar.Icon
                        size={36}
                        icon={
                          tr.type === 'transfer'
                            ? 'swap-horizontal'
                            : isAdjustment
                              ? 'scale-balance'
                              : getValidCategoryIcon(cat?.icon) ||
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
                                    ? theme.colors.income
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
                            flexShrink: 1,
                            textAlign: 'right',
                            marginLeft: 8,
                          },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {tr.type === 'transfer'
                          ? ''
                          : tr.type === 'income'
                            ? '+'
                            : '-'}
                        {formatCurrency(tr.amount)}
                      </Text>
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

        <View style={{ height: 20 }} />
      </ScrollView>

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

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: moderateScale(spacing.md),
      paddingBottom: moderateScale(100),
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
      fontSize: fontScale(18),
      fontWeight: '900',
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
    sectionCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md, // Consistent rhythm
      borderRadius: 16,
      elevation: 2,
    },
    headerCard: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.lg, // Generous separation after hero
      borderRadius: 24,
      elevation: 4,
    },
    insightText: {
      marginLeft: spacing.md,
      flex: 1,
      fontWeight: '600',
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
      borderRadius: 16,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
  });
