import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { FAB, Text, useTheme, Card, ProgressBar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { AccountCard } from '../components/AccountCard';
import { Account, useStore, useTranslation } from '../../../store/useStore';
import { AppTheme, spacing } from '../../../theme/theme';
import { getLocalDateString } from '../../../utils/dateUtils';
import { fontScale } from '../../../utils/responsive';

export const AccountsScreen = () => {
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const updateAccountsOrder = useStore((s) => s.updateAccountsOrder);
  const { formatCurrency } = useStore();

  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const handleAddAccount = useCallback(() => {
    router.push('/add-account');
  }, []);

  const handleAccountPress = useCallback((id: string) => {
    router.push({
      pathname: '/account-detail',
      params: { accountId: id },
    });
  }, []);

  const { totalBalance, monthlyIncome, monthlyExpenses, spendingVelocity } =
    useMemo(() => {
      let balanceSum = 0;
      accounts.forEach((a) => {
        balanceSum += a.currentBalance;
      });

      const currentISO = getLocalDateString();
      const currentMonthPrefix = currentISO.substring(0, 7);

      let incomeSum = 0;
      let expenseSum = 0;
      const thisMonthExpenses: number[] = [];

      transactions.forEach((tx) => {
        if (tx.date.startsWith(currentMonthPrefix)) {
          if (tx.type === 'income') {
            incomeSum += tx.amount;
          } else if (tx.type === 'expense') {
            expenseSum += tx.amount;
            thisMonthExpenses.push(tx.amount);
          }
        }
      });

      const elapsedDays = Math.max(
        1,
        parseInt(currentISO.substring(8, 10), 10),
      );
      const velocity = expenseSum / elapsedDays;

      return {
        totalBalance: balanceSum,
        monthlyIncome: incomeSum,
        monthlyExpenses: expenseSum,
        spendingVelocity: velocity,
      };
    }, [accounts, transactions]);

  const aiInsight = useMemo(() => {
    const defaultCurrencyCode = accounts[0]?.currency || 'USD';
    const formattedVelocity = formatCurrency(
      spendingVelocity,
      defaultCurrencyCode,
    );

    if (accounts.some((a) => a.currentBalance < 0)) {
      return {
        icon: 'warning-outline',
        color: '#F59E0B',
        bgColor: theme.dark ? '#332511' : '#FFF7E6',
        text: t('insightNegativeBalance'),
      };
    }

    if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) {
      return {
        icon: 'trending-down-outline',
        color: '#EF4444',
        bgColor: theme.dark ? '#3A1616' : '#FEF2F2',
        text: t('insightOutpacingIncome', { velocity: formattedVelocity }),
      };
    }

    if (totalBalance > 10000) {
      return {
        icon: 'sparkles-outline',
        color: '#10B981',
        bgColor: theme.colors.incomeContainer,
        text: t('insightSuperbLiquidity'),
      };
    }

    return {
      icon: 'bulb-outline',
      color: theme.colors.primary,
      bgColor: theme.colors.incomeContainer,
      text: t('insightDailyOutflowHabit', { velocity: formattedVelocity }),
    };
  }, [
    accounts,
    monthlyExpenses,
    monthlyIncome,
    totalBalance,
    spendingVelocity,
    formatCurrency,
    theme,
    t,
  ]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Account>) => (
      <ScaleDecorator>
        <Animated.View entering={FadeInUp.duration(300)}>
          <AccountCard
            account={item}
            onPress={() => handleAccountPress(item.id)}
            onLongPress={drag}
            isActive={isActive}
          />
        </Animated.View>
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

    const velocityRatio = Math.min(1, spendingVelocity / 150);

    return (
      <View style={styles.headerContainer}>
        {/* Total balance aggregate overview header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.overviewSection}
        >
          <Text
            style={[
              styles.overviewLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('totalBalance')}
          </Text>
          <Text
            style={[
              styles.overviewValue,
              {
                color:
                  totalBalance < 0
                    ? theme.colors.error
                    : theme.colors.onBackground,
              },
            ]}
          >
            {formatCurrency(totalBalance, defaultCurrencyCode)}
          </Text>
        </Animated.View>

        {/* Analytics Widgets Row */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(300)}
          style={styles.analyticsRow}
        >
          <Card style={styles.analyticsCard} mode="contained">
            <Card.Content style={styles.analyticsCardContent}>
              <View style={styles.widgetHeader}>
                <Ionicons
                  name="swap-vertical-outline"
                  size={14}
                  color="#3B82F6"
                />
                <Text
                  style={[
                    styles.widgetTitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('cashFlow')}
                </Text>
              </View>
              <Text
                style={[styles.widgetVal, { color: theme.colors.onSurface }]}
              >
                {formatCurrency(
                  monthlyIncome - monthlyExpenses,
                  defaultCurrencyCode,
                )}
              </Text>
              <ProgressBar
                progress={cashFlowRatio}
                color={
                  monthlyIncome - monthlyExpenses >= 0 ? '#10B981' : '#EF4444'
                }
                style={styles.widgetBar}
              />
              <Text
                style={[styles.widgetDesc, { color: theme.colors.outline }]}
              >
                {cashFlowRatio >= 1
                  ? '100%'
                  : `${Math.round(cashFlowRatio * 100)}%`}{' '}
                {t('ofIncomeSpent')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.analyticsCard} mode="contained">
            <Card.Content style={styles.analyticsCardContent}>
              <View style={styles.widgetHeader}>
                <Ionicons
                  name="speedometer-outline"
                  size={14}
                  color="#EC4899"
                />
                <Text
                  style={[
                    styles.widgetTitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('velocity')}
                </Text>
              </View>
              <Text
                style={[styles.widgetVal, { color: theme.colors.onSurface }]}
              >
                {formatCurrency(spendingVelocity, defaultCurrencyCode)}
                <Text style={styles.velocityUnit}>{t('perDay')}</Text>
              </Text>
              <ProgressBar
                progress={velocityRatio}
                color="#EC4899"
                style={styles.widgetBar}
              />
              <Text
                style={[styles.widgetDesc, { color: theme.colors.outline }]}
              >
                {t('avgSpendingOutflow')}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Dynamic recommendation center */}
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

        {accounts.length > 1 && (
          <View style={styles.dragHelpRow}>
            <Ionicons
              name="information-circle-outline"
              size={13}
              color={theme.colors.outline}
              style={{ marginRight: 4 }}
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
      <DraggableFlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => updateAccountsOrder(data)}
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
              style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
            >
              No Accounts Defined
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.colors.outline }]}
            >
              Establish accounts such as bank deposits or emergency funds to
              track assets at a glance.
            </Text>
          </Animated.View>
        }
      />

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
        color="#fff"
        onPress={handleAddAccount}
      />
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      padding: 16,
      paddingTop: spacing.xs,
    },
    headerContainer: {
      marginBottom: 8,
    },
    overviewSection: {
      alignItems: 'center',
      marginVertical: 20,
    },
    overviewLabel: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    overviewValue: {
      fontSize: fontScale(26),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    analyticsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    analyticsCard: {
      flex: 1,
      borderRadius: theme.roundness || 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      elevation: 0,
    },
    analyticsCardContent: {
      padding: 14,
    },
    widgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    widgetTitle: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      letterSpacing: -0.1,
    },
    widgetVal: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      letterSpacing: -0.2,
      marginBottom: 8,
    },
    velocityUnit: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    widgetBar: {
      height: 4,
      borderRadius: 2,
      marginBottom: 8,
    },
    widgetDesc: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    recommendationBox: {
      borderWidth: 1,
      borderRadius: theme.roundness || 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    recommendationText: {
      flex: 1,
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      lineHeight: 16,
    },
    dragHelpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      opacity: 0.8,
    },
    dragHelpText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 40,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      marginBottom: 6,
    },
    emptySubtitle: {
      textAlign: 'center',
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      paddingHorizontal: 20,
      lineHeight: 18,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 18,
      elevation: 6,
    },
  });
