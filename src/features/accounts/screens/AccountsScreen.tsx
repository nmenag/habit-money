import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { FAB, Text, useTheme, Card } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { AccountCard } from '../components/AccountCard';
import { Account, useStore, useTranslation } from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';
import { getLocalDateString } from '../../../utils/dateUtils';

export const AccountsScreen = () => {
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const deleteAccount = useStore((s) => s.deleteAccount);
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

  const handleDeleteAccount = useCallback(
    (id: string) => {
      deleteAccount(id);
    },
    [deleteAccount],
  );

  // --- Premium Visual Account Analytics calculations ---
  const { totalBalance, monthlyIncome, monthlyExpenses, spendingVelocity } =
    useMemo(() => {
      let balanceSum = 0;
      accounts.forEach((a) => {
        balanceSum += a.currentBalance;
      });

      // Filter transactions for the current month
      const currentISO = getLocalDateString(); // e.g. "2026-05-22"
      const currentMonthPrefix = currentISO.substring(0, 7); // e.g. "2026-05"

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

      // Calculate spending velocity: average amount spent per day in this month
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

  // AI-powered dynamic financial insights based on active balances and cash velocity
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
        text: 'Some credit/liability accounts have negative balances. Prioritize resolving debt balances to avoid high interest and strengthen cash flow.',
      };
    }

    if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) {
      return {
        icon: 'trending-down-outline',
        color: '#EF4444',
        text: `Your spending rate is outpacing recorded income this month. Keep expenses under check; current daily velocity is ${formattedVelocity}.`,
      };
    }

    if (totalBalance > 10000) {
      return {
        icon: 'sparkles-outline',
        color: '#22C55E',
        text: 'Superb liquidity! Consider allocating 15% of your positive cash flow toward your active Savings Goals to build long-term wealth.',
      };
    }

    return {
      icon: 'bulb-outline',
      color: theme.colors.primary,
      text: `Your daily average outflow is ${formattedVelocity} this month. Logging every minor transaction daily builds robust financial habits.`,
    };
  }, [
    accounts,
    monthlyExpenses,
    monthlyIncome,
    totalBalance,
    spendingVelocity,
    formatCurrency,
    theme,
  ]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Account>) => (
      <ScaleDecorator>
        <AccountCard
          account={item}
          onDelete={
            accounts.length > 1 ? () => handleDeleteAccount(item.id) : undefined
          }
          onPress={() => handleAccountPress(item.id)}
          onLongPress={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    ),
    [accounts.length, handleDeleteAccount, handleAccountPress],
  );

  const HeaderComponent = useMemo(() => {
    const defaultCurrencyCode = accounts[0]?.currency || 'USD';

    // Calculate dynamic visual ratios for progress bars
    const cashFlowRatio =
      monthlyIncome > 0
        ? Math.min(1, monthlyExpenses / monthlyIncome)
        : monthlyExpenses > 0
          ? 1
          : 0;

    const velocityRatio = Math.min(1, spendingVelocity / 150); // Normalized relative to custom daily threshold $150

    return (
      <View style={styles.headerContainer}>
        {/* Total Assets Overview */}
        <View style={styles.overviewSection}>
          <Text
            style={[
              styles.overviewLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('totalBalance').toUpperCase()}
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
        </View>

        {/* Visual Analytics Widgets Row */}
        <View style={styles.analyticsRow}>
          {/* Widget 1: Net Cash Flow */}
          <Card style={styles.analyticsCard} mode="contained">
            <Card.Content style={styles.analyticsCardContent}>
              <View style={styles.widgetHeader}>
                <Ionicons
                  name="swap-vertical-outline"
                  size={16}
                  color="#3B82F6"
                />
                <Text
                  style={[
                    styles.widgetTitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Cash Flow
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
              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: theme.dark ? '#1E293B' : '#E2E8F0' },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${cashFlowRatio * 100}%`,
                      backgroundColor:
                        monthlyIncome - monthlyExpenses >= 0
                          ? '#22C55E'
                          : '#EF4444',
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.widgetDesc, { color: theme.colors.outline }]}
              >
                {cashFlowRatio >= 1
                  ? '100%'
                  : `${Math.round(cashFlowRatio * 100)}%`}{' '}
                of income spent
              </Text>
            </Card.Content>
          </Card>

          {/* Widget 2: Spending Velocity */}
          <Card style={styles.analyticsCard} mode="contained">
            <Card.Content style={styles.analyticsCardContent}>
              <View style={styles.widgetHeader}>
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color="#EC4899"
                />
                <Text
                  style={[
                    styles.widgetTitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Velocity
                </Text>
              </View>
              <Text
                style={[styles.widgetVal, { color: theme.colors.onSurface }]}
              >
                {formatCurrency(spendingVelocity, defaultCurrencyCode)}
                <Text style={styles.velocityUnit}>/day</Text>
              </Text>
              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: theme.dark ? '#1E293B' : '#E2E8F0' },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${velocityRatio * 100}%`,
                      backgroundColor: '#EC4899',
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.widgetDesc, { color: theme.colors.outline }]}
              >
                Avg. spending outflow
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* AI Finance Insights Card */}
        <Card
          style={[
            styles.insightCard,
            {
              backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
              borderColor: theme.dark ? '#11221D' : '#E2E8F0',
            },
          ]}
          mode="outlined"
        >
          <Card.Content style={styles.insightContent}>
            <View
              style={[
                styles.insightIconContainer,
                { backgroundColor: `${aiInsight.color}18` },
              ]}
            >
              <Ionicons
                name={aiInsight.icon as any}
                size={18}
                color={aiInsight.color}
              />
            </View>
            <View style={styles.insightTextContainer}>
              <Text
                style={[styles.insightTitle, { color: theme.colors.onSurface }]}
              >
                AI Smart Insight
              </Text>
              <Text
                style={[
                  styles.insightBody,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {aiInsight.text}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Dynamic Drag Reorder Helper Badge */}
        {accounts.length > 1 && (
          <View style={styles.dragHelpRow}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={theme.colors.outline}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[styles.dragHelpText, { color: theme.colors.outline }]}
            >
              Hold & drag cards to adjust their priority order
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
          { paddingBottom: insets.bottom + 140 },
        ]}
        ListHeaderComponent={HeaderComponent}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="wallet-outline"
              size={64}
              color={theme.colors.outlineVariant}
            />
            <Text
              variant="bodyLarge"
              style={[styles.emptyText, { color: theme.colors.outline }]}
            >
              {t('noAccounts')}
            </Text>
          </View>
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
    },
    headerContainer: {
      marginBottom: 16,
    },
    overviewSection: {
      alignItems: 'center',
      marginVertical: 20,
    },
    overviewLabel: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 2,
      marginBottom: 6,
    },
    overviewValue: {
      fontSize: 34,
      fontWeight: '900',
      letterSpacing: -1,
    },
    analyticsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    analyticsCard: {
      flex: 1,
      borderRadius: 20,
      backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.dark ? '#11221D' : '#E2E8F0',
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
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    widgetVal: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    velocityUnit: {
      fontSize: 12,
      fontWeight: '500',
    },
    progressBarBg: {
      height: 5,
      borderRadius: 100,
      overflow: 'hidden',
      marginBottom: 6,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 100,
    },
    widgetDesc: {
      fontSize: 10,
      fontWeight: '500',
    },
    insightCard: {
      borderRadius: 20,
      borderWidth: 1.5,
      marginBottom: 16,
      elevation: 0,
    },
    insightContent: {
      flexDirection: 'row',
      padding: 14,
      alignItems: 'flex-start',
      gap: 12,
    },
    insightIconContainer: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    insightTextContainer: {
      flex: 1,
    },
    insightTitle: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: -0.1,
      marginBottom: 2,
    },
    insightBody: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
    },
    dragHelpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      opacity: 0.8,
    },
    dragHelpText: {
      fontSize: 11,
      fontWeight: '600',
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 40,
    },
    emptyText: {
      textAlign: 'center',
      paddingHorizontal: 20,
      fontWeight: '700',
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 18,
      elevation: 6,
    },
  });
