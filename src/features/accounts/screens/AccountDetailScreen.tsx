import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, subDays } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { TransactionItem } from '../../transactions/components/TransactionItem';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';
import { getLocalDateString } from '../../../utils/dateUtils';

export const AccountDetailScreen = () => {
  const params = useLocalSearchParams<{ accountId: string }>();
  const { accountId } = params;
  const { accounts, transactions, categories, formatCurrency } = useStore();
  const { t, translateName, language } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const account = accounts.find((a) => a.id === accountId);

  const accountTransactions = useMemo(() => {
    return transactions
      .filter(
        (tx) => tx.accountId === accountId || tx.toAccountId === accountId,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, accountId]);

  const { chartData, maxSpendingAmount } = useMemo(() => {
    const data: { label: string; amount: number; heightPercent: number }[] = [];
    const dateLocale = language === 'es' ? es : enUS;

    const todayStr = getLocalDateString();
    const today = parseISO(todayStr);

    let maxAmount = 1;

    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLabel = format(day, 'EEE', { locale: dateLocale }).toUpperCase();

      let dayExpenseSum = 0;
      accountTransactions.forEach((tx) => {
        if (tx.date.startsWith(dayStr) && tx.type === 'expense') {
          dayExpenseSum += tx.amount;
        }
      });

      if (dayExpenseSum > maxAmount) {
        maxAmount = dayExpenseSum;
      }

      data.push({
        label: dayLabel,
        amount: dayExpenseSum,
        heightPercent: 0,
      });
    }

    const normalized = data.map((item) => ({
      ...item,
      heightPercent: Math.max(
        8,
        Math.min(100, (item.amount / maxAmount) * 100),
      ),
    }));

    return {
      chartData: normalized,
      maxSpendingAmount: maxAmount > 1 ? maxAmount : 0,
    };
  }, [accountTransactions, language]);

  const { monthlyInflow, monthlyOutflow } = useMemo(() => {
    const currentISO = getLocalDateString();
    const currentMonthPrefix = currentISO.substring(0, 7);

    let inflow = 0;
    let outflow = 0;

    accountTransactions.forEach((tx) => {
      if (tx.date.startsWith(currentMonthPrefix)) {
        if (tx.type === 'income') {
          inflow += tx.amount;
        } else if (tx.type === 'expense') {
          outflow += tx.amount;
        }
      }
    });

    return {
      monthlyInflow: inflow,
      monthlyOutflow: outflow,
    };
  }, [accountTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups: { title: string; data: typeof accountTransactions }[] = [];
    const dateLocale = language === 'es' ? es : enUS;

    accountTransactions.forEach((tx) => {
      const txDayStr = tx.date.substring(0, 10);
      let groupTitle = '';
      try {
        groupTitle = format(parseISO(txDayStr), 'EEEE, MMMM d', {
          locale: dateLocale,
        });
      } catch {
        groupTitle = txDayStr;
      }

      const existingGroup = groups.find((g) => g.title === groupTitle);
      if (existingGroup) {
        existingGroup.data.push(tx);
      } else {
        groups.push({ title: groupTitle, data: [tx] });
      }
    });

    return groups;
  }, [accountTransactions, language]);

  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {t('accountNotFound' as any) || 'Account not found'}
        </Text>
      </View>
    );
  }

  const accountColor = account.color || theme.colors.primary;
  const isDarkColor = theme.dark;

  const cardBgColor = isDarkColor ? '#0A110F' : '#FFFFFF';

  const inflowBg = isDarkColor ? '#0D2A1C' : '#E6F4EA';
  const inflowBorder = isDarkColor ? '#1B4D36' : '#C2E7D9';
  const outflowBg = isDarkColor ? '#2A0E10' : '#FCE8E6';
  const outflowBorder = isDarkColor ? '#4D1B1E' : '#F5C2C1';

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(16, insets.top),
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card
          style={[
            styles.creditCard,
            {
              backgroundColor: cardBgColor,
              borderColor: accountColor,
              shadowColor: accountColor,
            },
          ]}
          mode="outlined"
        >
          <Card.Content style={styles.creditCardContent}>
            <View style={styles.cardMidRow}>
              <Text
                style={[
                  styles.cardBalanceLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('currentBalanceLabel').toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.cardBalance,
                  {
                    color:
                      account.currentBalance < 0
                        ? theme.colors.error
                        : theme.colors.onSurface,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(account.currentBalance, account.currency)}
              </Text>
            </View>

            <View style={styles.cardBottomRow}>
              <View style={styles.cardInfoCol}>
                <Text
                  style={[
                    styles.cardHolderLabel,
                    { color: theme.colors.outline },
                  ]}
                >
                  {t(account.type).toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.cardHolderName,
                    { color: theme.colors.onSurface },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {translateName(account.name)}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <IconButton
                  icon="pencil-outline"
                  mode="contained"
                  containerColor={theme.dark ? '#11221D' : '#F1F5F9'}
                  iconColor={theme.colors.onSurface}
                  size={18}
                  onPress={() =>
                    router.push({
                      pathname: '/add-account',
                      params: { account: JSON.stringify(account) },
                    })
                  }
                  style={styles.actionIconBtn}
                />
                <IconButton
                  icon="plus"
                  mode="contained"
                  containerColor={theme.colors.primary}
                  iconColor="#fff"
                  size={18}
                  onPress={() =>
                    router.push({
                      pathname: '/add-transaction',
                      params: { accountId: account.id },
                    })
                  }
                  style={styles.actionIconBtn}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.cashFlowSummaryRow}>
          <View
            style={[
              styles.cashFlowCapsule,
              { backgroundColor: inflowBg, borderColor: inflowBorder },
            ]}
          >
            <View
              style={[
                styles.flowIconBox,
                { backgroundColor: isDarkColor ? '#1B4D36' : '#D1E7DD' },
              ]}
            >
              <Ionicons name="arrow-down" size={16} color="#22C55E" />
            </View>
            <View style={styles.flowTextCol}>
              <Text style={[styles.flowLabel, { color: theme.colors.outline }]}>
                Inflow (Month)
              </Text>
              <Text
                style={[styles.flowAmount, { color: '#22C55E' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                +{formatCurrency(monthlyInflow, account.currency)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.cashFlowCapsule,
              { backgroundColor: outflowBg, borderColor: outflowBorder },
            ]}
          >
            <View
              style={[
                styles.flowIconBox,
                { backgroundColor: isDarkColor ? '#4D1B1E' : '#F8D7DA' },
              ]}
            >
              <Ionicons name="arrow-up" size={16} color="#EF4444" />
            </View>
            <View style={styles.flowTextCol}>
              <Text style={[styles.flowLabel, { color: theme.colors.outline }]}>
                Outflow (Month)
              </Text>
              <Text
                style={[styles.flowAmount, { color: '#EF4444' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                -{formatCurrency(monthlyOutflow, account.currency)}
              </Text>
            </View>
          </View>
        </View>

        {accountTransactions.some((t) => t.type === 'expense') && (
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleBox}>
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.chartTitle, { color: theme.colors.onSurface }]}
                >
                  7-Day Outflow Velocity
                </Text>
              </View>
              {maxSpendingAmount > 0 && (
                <View
                  style={[
                    styles.chartBadge,
                    {
                      backgroundColor: `${accountColor}12`,
                      borderColor: `${accountColor}2B`,
                    },
                  ]}
                >
                  <Text
                    style={[styles.chartBadgeText, { color: accountColor }]}
                  >
                    Max: {formatCurrency(maxSpendingAmount, account.currency)}
                  </Text>
                </View>
              )}
            </View>
            <Card
              style={[
                styles.chartCard,
                {
                  backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
                  borderColor: theme.dark ? '#11221D' : '#E2E8F0',
                },
              ]}
              mode="outlined"
            >
              <Card.Content style={styles.chartCardContent}>
                <View style={styles.chartGridLines}>
                  <View
                    style={[
                      styles.gridLine,
                      {
                        borderColor: theme.dark ? '#1E293B' : '#E2E8F0',
                        borderStyle: 'dashed',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.gridLine,
                      {
                        borderColor: theme.dark ? '#1E293B' : '#E2E8F0',
                        borderStyle: 'dashed',
                      },
                    ]}
                  />
                </View>

                <View style={styles.chartBarsContainer}>
                  {chartData.map((day, idx) => (
                    <View key={idx} style={styles.chartBarCol}>
                      <View style={styles.chartBarTrack}>
                        <View
                          style={[
                            styles.chartBarFill,
                            {
                              height: `${day.heightPercent}%`,
                              backgroundColor:
                                day.amount > 0
                                  ? accountColor
                                  : theme.colors.outlineVariant,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.chartDayLabel,
                          { color: theme.colors.outline },
                        ]}
                      >
                        {day.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        <View style={styles.transactionsSection}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            {t('recentTransactions')}
          </Text>

          {groupedTransactions.length > 0 ? (
            groupedTransactions.map((group) => (
              <View key={group.title} style={styles.dateGroup}>
                <View
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: theme.colors.background, height: 32 },
                  ]}
                >
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.sectionHeaderText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {group.title}
                  </Text>
                </View>
                <View style={styles.transactionsList}>
                  {group.data.map((tx) => {
                    const category = categories.find(
                      (c) => c.id === tx.categoryId,
                    );
                    return (
                      <TouchableOpacity
                        key={tx.id}
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push({
                            pathname: '/add-transaction',
                            params: {
                              transaction: JSON.stringify(tx),
                              isEditing: 'true',
                            },
                          })
                        }
                      >
                        <TransactionItem transaction={tx} category={category} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Ionicons
                name="receipt-outline"
                size={54}
                color={theme.colors.outlineVariant}
              />
              <Text
                style={[styles.emptyTextText, { color: theme.colors.outline }]}
              >
                {t('noTransactions')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <BannerAdComponent />
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    errorText: {
      textAlign: 'center',
      marginTop: 80,
      fontSize: 16,
      fontWeight: '700',
    },
    creditCard: {
      margin: 16,
      marginTop: 20,
      borderRadius: 24,
      borderWidth: 1.5,
      elevation: 0,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.dark ? 0.25 : 0.12,
      shadowRadius: 16,
    },
    creditCardContent: {
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    chipMock: {
      flexDirection: 'row',
      alignItems: 'center',
      opacity: 0.9,
    },
    brandBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.dark ? '#11221D' : '#F1F5F9',
    },
    brandBadgeText: {
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 1.2,
    },
    cardMidRow: {
      marginBottom: 24,
    },
    cardBalanceLabel: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 2,
      marginBottom: 4,
    },
    cardBalance: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -1,
    },
    cardBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 12,
    },
    cardInfoCol: {
      flex: 1,
      marginRight: 8,
    },
    cardHolderLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 2,
    },
    cardHolderName: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    actionIconBtn: {
      margin: 0,
      borderRadius: 12,
      width: 38,
      height: 38,
    },
    cashFlowSummaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 24,
    },
    cashFlowCapsule: {
      flex: 1,
      minWidth: 140,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 18,
      borderWidth: 1.5,
      gap: 10,
    },
    flowIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    flowTextCol: {
      flex: 1,
    },
    flowLabel: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.2,
      marginBottom: 2,
    },
    flowAmount: {
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: -0.2,
    },
    chartSection: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    chartTitleBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    chartTitle: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    chartBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
    },
    chartBadgeText: {
      fontSize: 9,
      fontWeight: '800',
    },
    chartCard: {
      borderRadius: 20,
      borderWidth: 1.5,
      elevation: 0,
      position: 'relative',
    },
    chartCardContent: {
      paddingVertical: 18,
      paddingHorizontal: 10,
    },
    chartGridLines: {
      position: 'absolute',
      top: 18,
      left: 10,
      right: 10,
      height: 56,
      justifyContent: 'space-between',
      opacity: 0.15,
      pointerEvents: 'none',
    },
    gridLine: {
      borderWidth: 0.5,
      height: 0,
      width: '100%',
    },
    chartBarsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 80,
      paddingHorizontal: 10,
    },
    chartBarCol: {
      alignItems: 'center',
      flex: 1,
    },
    chartBarTrack: {
      height: 56,
      width: 7,
      borderRadius: 100,
      backgroundColor: theme.dark ? '#11221D' : '#F1F5F9',
      justifyContent: 'flex-end',
      overflow: 'hidden',
      marginBottom: 8,
    },
    chartBarFill: {
      width: '100%',
      borderRadius: 100,
    },
    chartDayLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    transactionsSection: {
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginBottom: 16,
      paddingLeft: 4,
    },
    dateGroup: {
      marginBottom: 16,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    sectionHeaderText: {
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '800',
    },
    transactionsList: {
      paddingHorizontal: 16,
    },
    emptyTransactions: {
      alignItems: 'center',
      padding: 40,
      marginTop: 20,
    },
    emptyTextText: {
      fontSize: 14,
      fontWeight: '700',
      marginTop: 10,
    },
  });
