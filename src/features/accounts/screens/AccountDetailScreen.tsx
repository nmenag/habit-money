import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, subDays } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { TransactionItem } from '../../transactions/components/TransactionItem';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';
import { getLocalDateString } from '../../../utils/dateUtils';
import { fontScale } from '../../../utils/responsive';

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

  const cardBgColor = theme.colors.surface;

  const inflowBg = isDarkColor ? '#052E16' : '#DCFCE7';
  const inflowBorder = isDarkColor ? '#065F462B' : '#A7F3D0';
  const outflowBg = isDarkColor ? '#450A0A' : '#FEE2E2';
  const outflowBorder = isDarkColor ? '#991B1B2B' : '#FCA5A5';

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(16, insets.top),
          paddingBottom: insets.bottom + 200,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <Card
            style={[
              styles.creditCard,
              {
                backgroundColor: cardBgColor,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            mode="contained"
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
                    containerColor={theme.colors.elevation.level1}
                    iconColor={theme.colors.onSurface}
                    size={16}
                    accessibilityLabel={t('edit')}
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
                    size={16}
                    accessibilityLabel="Add Transaction"
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
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(100).duration(300)}
          style={styles.cashFlowSummaryRow}
        >
          <View
            style={[
              styles.cashFlowCapsule,
              { backgroundColor: inflowBg, borderColor: inflowBorder },
            ]}
          >
            <View
              style={[
                styles.flowIconBox,
                { backgroundColor: isDarkColor ? '#065F46' : '#A7F3D0' },
              ]}
            >
              <Ionicons name="arrow-down" size={14} color="#10B981" />
            </View>
            <View style={styles.flowTextCol}>
              <Text
                style={[
                  styles.flowLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('inflowMonth')}
              </Text>
              <Text
                style={[styles.flowAmount, { color: '#10B981' }]}
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
                { backgroundColor: isDarkColor ? '#7F1D1D' : '#FCA5A5' },
              ]}
            >
              <Ionicons name="arrow-up" size={14} color="#EF4444" />
            </View>
            <View style={styles.flowTextCol}>
              <Text
                style={[
                  styles.flowLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('outflowMonth')}
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
        </Animated.View>

        {accountTransactions.some((t) => t.type === 'expense') && (
          <Animated.View
            entering={FadeInUp.delay(150).duration(300)}
            style={styles.chartSection}
          >
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleBox}>
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.chartTitle, { color: theme.colors.onSurface }]}
                >
                  {t('sevenDayOutflowVelocity')}
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
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              mode="contained"
            >
              <Card.Content style={styles.chartCardContent}>
                <View style={styles.chartGridLines}>
                  <View
                    style={[
                      styles.gridLine,
                      {
                        borderColor: theme.colors.outlineVariant,
                        borderStyle: 'dashed',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.gridLine,
                      {
                        borderColor: theme.colors.outlineVariant,
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
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInUp.delay(200).duration(300)}
          style={styles.transactionsSection}
        >
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
        </Animated.View>
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
      fontSize: fontScale(16),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    creditCard: {
      margin: 16,
      marginTop: 20,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      elevation: 0,
    },
    creditCardContent: {
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    cardMidRow: {
      marginBottom: 20,
    },
    cardBalanceLabel: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    cardBalance: {
      fontSize: fontScale(24),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      letterSpacing: -0.2,
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
      fontSize: fontScale(9),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    cardHolderName: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      letterSpacing: -0.1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    actionIconBtn: {
      margin: 0,
      borderRadius: 10,
      width: 36,
      height: 36,
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
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      gap: 10,
    },
    flowIconBox: {
      width: 30,
      height: 30,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    flowTextCol: {
      flex: 1,
    },
    flowLabel: {
      fontSize: fontScale(9),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      marginBottom: 2,
    },
    flowAmount: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
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
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      letterSpacing: -0.2,
    },
    chartBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
    },
    chartBadgeText: {
      fontSize: fontScale(9),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    chartCard: {
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      elevation: 0,
      position: 'relative',
    },
    chartCardContent: {
      paddingVertical: 16,
      paddingHorizontal: 10,
    },
    chartGridLines: {
      position: 'absolute',
      top: 16,
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
      width: 6,
      borderRadius: 100,
      backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9',
      justifyContent: 'flex-end',
      overflow: 'hidden',
      marginBottom: 8,
    },
    chartBarFill: {
      width: '100%',
      borderRadius: 100,
    },
    chartDayLabel: {
      fontSize: fontScale(9),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    transactionsSection: {
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
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
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
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
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      marginTop: 10,
    },
  });
