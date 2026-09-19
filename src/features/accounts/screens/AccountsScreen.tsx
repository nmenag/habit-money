import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Card, Text, useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountCard } from '../components/AccountCard';
import { Account, useStore, useTranslation } from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

export const AccountsScreen = () => {
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const formatCurrency = useStore((s) => s.formatCurrency);
  const updateAccountsOrder = useStore((s) => s.updateAccountsOrder);
  const dashboardReport = useStore((s) => s.dashboardReport);

  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);
  }, [accounts]);

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
  }, [accounts]);

  const { monthlyIncome, monthlyExpenses, spendingVelocity } = useMemo(() => {
    const inc = dashboardReport?.currentMonth
      ? dashboardReport.currentMonth.income
      : null;
    const exp = dashboardReport?.currentMonth
      ? dashboardReport.currentMonth.expenses
      : null;
    const now = new Date();
    const currentMonthPrefix = now.toISOString().substring(0, 7);

    const monthTxs = transactions.filter((t) =>
      t.date.startsWith(currentMonthPrefix),
    );
    const actualInc = inc !== null ? inc : monthTxs
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const actualExp = exp !== null ? exp : monthTxs
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const elapsedRatio = dayOfMonth / daysInMonth;

    let velocity = 0;
    if (actualInc > 0 && elapsedRatio > 0) {
      velocity = Math.round((actualExp / actualInc / elapsedRatio) * 100);
    }

    return {
      monthlyIncome: actualInc,
      monthlyExpenses: actualExp,
      spendingVelocity: velocity,
    };
  }, [dashboardReport, transactions]);

  const handleAccountPress = useCallback((accountId: string) => {
    router.push({
      pathname: '/account-detail',
      params: { accountId },
    });
  }, []);

  const handleAddAccount = () => {
    router.push('/add-account');
  };

  const aiInsight = useMemo(() => {
    if (accounts.length === 0) {
      return {
        text: t('accountsEmptyInsight'),
        icon: 'information-circle-outline',
        color: theme.colors.outline,
        bgColor: theme.colors.surfaceVariant,
      };
    }

    if (totalBalance < 0) {
      return {
        text: t('netWorthNegativeInsight'),
        icon: 'warning-outline',
        color: theme.colors.error,
        bgColor: theme.colors.errorContainer,
      };
    }

    if (spendingVelocity > 100) {
      return {
        text: t('highBurnRateInsight', { velocity: spendingVelocity }),
        icon: 'alert-circle-outline',
        color: theme.colors.error,
        bgColor: theme.colors.errorContainer,
      };
    }

    if (monthlyIncome > monthlyExpenses && monthlyExpenses > 0) {
      const savingsRate = Math.round(
        ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100,
      );
      return {
        text: t('healthySavingsInsight', { savingsRate }),
        icon: 'checkmark-circle-outline',
        color: theme.colors.primary,
        bgColor: theme.colors.incomeContainer,
      };
    }

    return {
      text: t('steadyCashFlowInsight'),
      icon: 'shield-checkmark-outline',
      color: theme.colors.primary,
      bgColor: theme.colors.surfaceVariant,
    };
  }, [
    accounts,
    monthlyExpenses,
    monthlyIncome,
    totalBalance,
    spendingVelocity,
    theme,
    t,
  ]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Account>) => (
      <ScaleDecorator>
        <AccountCard
          account={item}
          onPress={() => handleAccountPress(item.id)}
          onLongPress={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    ),
    [handleAccountPress],
  );

  const HeaderComponent = useMemo(() => {
    const defaultCurrencyCode = accounts[0]?.currency || 'USD';

    const cashFlowRatio =
      monthlyIncome > 0
        ? Math.min(1, monthlyExpenses / monthlyIncome)
        : monthlyExpenses > 0
          ? 1
          : 0;

    return (
      <View>
        <Animated.View entering={FadeInUp.duration(300)}>
          <Card
            style={[
              styles.totalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            mode="contained"
          >
            <Card.Content style={styles.totalContent}>
              <View style={styles.totalTopRow}>
                <View
                  style={[
                    styles.totalIconCircle,
                    {
                      backgroundColor: `${theme.colors.primary}12`,
                      borderColor: `${theme.colors.primary}2B`,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.totalLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('totalBalance')}
                  </Text>
                  <Text
                    style={[
                      styles.totalAmount,
                      {
                        color:
                          totalBalance < 0
                            ? theme.colors.error
                            : theme.colors.onSurface,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatCurrency(totalBalance, defaultCurrencyCode)}
                  </Text>
                </View>
              </View>

              <View style={styles.financialMetricsRow}>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Text
                      style={[
                        styles.metricLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('cashFlowHealth')}
                    </Text>
                    <Text
                      style={[
                        styles.metricValue,
                        {
                          color:
                            cashFlowRatio > 0.9
                              ? theme.colors.error
                              : theme.colors.primary,
                        },
                      ]}
                    >
                      {Math.round((1 - cashFlowRatio) * 100)}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressBarTrack,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.round((1 - cashFlowRatio) * 100)}%`,
                          backgroundColor:
                            cashFlowRatio > 0.9
                              ? theme.colors.error
                              : theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Text
                      style={[
                        styles.metricLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('spendingVelocity')}
                    </Text>
                    <Text
                      style={[
                        styles.metricValue,
                        {
                          color:
                            spendingVelocity > 100
                              ? theme.colors.error
                              : spendingVelocity > 80
                                ? '#D97706'
                                : theme.colors.primary,
                        },
                      ]}
                    >
                      {spendingVelocity}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressBarTrack,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(spendingVelocity, 100)}%`,
                          backgroundColor:
                            spendingVelocity > 100
                              ? theme.colors.error
                              : spendingVelocity > 80
                                ? '#D97706'
                                : theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).duration(300)}>
          <View
            style={[
              styles.recommendationBox,
              {
                backgroundColor: aiInsight.bgColor,
                borderColor: `${aiInsight.color}2B`,
              },
            ]}
          >
            <Ionicons
              name={aiInsight.icon as any}
              size={16}
              color={aiInsight.color}
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.recommendationText,
                { color: theme.colors.onSurface },
              ]}
            >
              {aiInsight.text}
            </Text>
          </View>
        </Animated.View>

        {sortedAccounts.length > 1 && (
          <View style={styles.dragHelpRow}>
            <Ionicons
              name="reorder-two-outline"
              size={15}
              color={theme.colors.outline}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.dragHelpText, { color: theme.colors.outline }]}
            >
              {t('holdAndDragToReorder')}
            </Text>
          </View>
        )}
      </View>
    );
  }, [
    sortedAccounts,
    accounts,
    monthlyIncome,
    monthlyExpenses,
    spendingVelocity,
    totalBalance,
    aiInsight,
    theme,
    t,
    formatCurrency,
    styles,
  ]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('accounts'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('back')}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleAddAccount}
              style={styles.headerBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('addAccount')}
            >
              <Ionicons name="add" size={26} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <DraggableFlatList
        data={sortedAccounts}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => updateAccountsOrder(data)}
        containerStyle={styles.listContainer}
        style={styles.list}
        autoscrollThreshold={80}
        autoscrollSpeed={150}
        dragItemOverflow={true}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 200 },
        ]}
        ListHeaderComponent={HeaderComponent}
        renderItem={renderItem}
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Ionicons
                name="wallet-outline"
                size={32}
                color={theme.colors.outline}
              />
            </View>
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {t('noAccounts')}
            </Text>
            <TouchableOpacity
              onPress={handleAddAccount}
              style={[
                styles.emptyBtn,
                {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('addAccount')}
            >
              <Ionicons
                name="add"
                size={18}
                color={theme.colors.onPrimary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.emptyBtnText,
                  { color: theme.colors.onPrimary },
                ]}
              >
                {t('addAccount')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        }
      />
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerBtn: {
      padding: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    totalCard: {
      borderRadius: theme.roundness ? theme.roundness * 1.5 : 20,
      borderWidth: 1,
      marginBottom: 12,
      overflow: 'hidden',
    },
    totalContent: {
      padding: 16,
    },
    totalTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    totalIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    totalLabel: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      marginBottom: 2,
    },
    totalAmount: {
      fontSize: fontScale(24),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    financialMetricsRow: {
      flexDirection: 'row',
      gap: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    metricItem: {
      flex: 1,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    metricValue: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    progressBarTrack: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    recommendationBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      marginBottom: 12,
    },
    recommendationText: {
      flex: 1,
      fontSize: fontScale(12),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      lineHeight: fontScale(16),
    },
    dragHelpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    dragHelpText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
    },
    empty: {
      alignItems: 'center',
      paddingTop: 48,
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyText: {
      fontSize: fontScale(15),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: 20,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    emptyBtnText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
  });
