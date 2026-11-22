import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO, subDays } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Card,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { TransactionItem } from '../../transactions/components/TransactionItem';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';
import { getLocalDateString } from '../../../utils/dateUtils';
import { fontScale } from '../../../utils/responsive';
import {
  calculateAdjustmentDifference,
  isAdjustmentTransaction,
} from '../../../utils/transactionUtils';

export const AccountDetailScreen = () => {
  const params = useLocalSearchParams<{ accountId: string }>();
  const { accountId } = params;
  const {
    accounts,
    transactions,
    categories,
    formatCurrency,
    adjustAccountBalance,
  } = useStore();
  const { t, translateName, language } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const account = accounts.find((a) => a.id === accountId);

  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [displayNewBalance, setDisplayNewBalance] = useState('');
  const [newBalanceValue, setNewBalanceValue] = useState<number | null>(null);
  const [isNegativeBalance, setIsNegativeBalance] = useState(false);
  const [adjustNote, setAdjustNote] = useState('');

  const handleOpenAdjustModal = useCallback(() => {
    setDisplayNewBalance('');
    setNewBalanceValue(null);
    setIsNegativeBalance(false);
    setAdjustNote('');
    setAdjustModalVisible(true);
  }, []);

  const handleNewBalanceChange = useCallback(
    (text: string) => {
      const hasLeadingMinus = text.trim().startsWith('-');
      const isDecimal =
        account?.currency !== 'COP' &&
        account?.currency !== 'CLP' &&
        account?.currency !== 'PYG' &&
        account?.currency !== 'XAF';
      const thousandSep = language === 'es' ? '.' : ',';
      const decimalSep = language === 'es' ? ',' : '.';

      if (!isDecimal) {
        const onlyDigits = text.replace(/\D/g, '');
        if (onlyDigits === '') {
          setDisplayNewBalance('');
          setNewBalanceValue(null);
          if (!hasLeadingMinus) setIsNegativeBalance(false);
          return;
        }
        const parsed = parseInt(onlyDigits, 10);
        const signed = hasLeadingMinus || isNegativeBalance ? -parsed : parsed;
        if (hasLeadingMinus) setIsNegativeBalance(true);
        setNewBalanceValue(signed);
        setDisplayNewBalance(
          onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep),
        );
      } else {
        let processed = text;
        if (language === 'es') {
          if (/\.\d{1,2}$/.test(processed)) {
            processed = processed.replace(/\.(\d{1,2})$/, ',$1');
          } else if (processed.endsWith('.')) {
            processed = processed.slice(0, -1) + ',';
          }
        }
        const cleanText = processed.replace(/[^0-9.,]/g, '');
        if (cleanText === '') {
          setDisplayNewBalance('');
          setNewBalanceValue(null);
          if (!hasLeadingMinus) setIsNegativeBalance(false);
          return;
        }
        if (hasLeadingMinus) setIsNegativeBalance(true);
        const firstSepIdx = cleanText.indexOf(decimalSep);
        let formatted = '';
        let rawNumericStr = '';
        if (firstSepIdx === -1) {
          const digits = cleanText.replace(/\D/g, '');
          rawNumericStr = digits;
          formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
        } else {
          const intPart = cleanText
            .substring(0, firstSepIdx)
            .replace(/\D/g, '');
          const decPart = cleanText
            .substring(firstSepIdx + 1)
            .replace(/\D/g, '')
            .substring(0, 2);
          rawNumericStr = `${intPart || '0'}.${decPart}`;
          const formattedInt = (intPart || '0').replace(
            /\B(?=(\d{3})+(?!\d))/g,
            thousandSep,
          );
          formatted = formattedInt + decimalSep + decPart;
        }
        const parsed = parseFloat(rawNumericStr);
        const numericVal = isNaN(parsed) ? 0 : parsed;
        const signed =
          hasLeadingMinus || isNegativeBalance ? -numericVal : numericVal;
        setDisplayNewBalance(formatted);
        setNewBalanceValue(signed);
      }
    },
    [account?.currency, isNegativeBalance, language],
  );

  const toggleNegativeNewBalance = useCallback(() => {
    setIsNegativeBalance((prev) => {
      const next = !prev;
      if (newBalanceValue !== null && newBalanceValue !== 0) {
        setNewBalanceValue(
          next ? -Math.abs(newBalanceValue) : Math.abs(newBalanceValue),
        );
      }
      return next;
    });
  }, [newBalanceValue]);

  const adjustmentDifference = useMemo(() => {
    if (!account || newBalanceValue === null) {
      return 0;
    }
    return calculateAdjustmentDifference(
      newBalanceValue,
      account.currentBalance,
    );
  }, [account, newBalanceValue]);

  const handleConfirmAdjustment = useCallback(() => {
    if (!account) return;
    if (newBalanceValue === null || adjustmentDifference === 0) {
      Alert.alert(t('error'), t('noBalanceChangeError'));
      return;
    }

    adjustAccountBalance(
      account.id,
      newBalanceValue,
      adjustNote.trim() || t('balanceAdjustment'),
    );
    setAdjustModalVisible(false);
  }, [
    account,
    adjustAccountBalance,
    adjustNote,
    adjustmentDifference,
    newBalanceValue,
    t,
  ]);

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
        if (
          tx.date.startsWith(dayStr) &&
          tx.type === 'expense' &&
          !isAdjustmentTransaction(tx)
        ) {
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
      if (isAdjustmentTransaction(tx)) {
        return;
      }
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/accounts');
    }
  };

  if (!account) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: t('accountNotFound'),
            headerLeft: () => (
              <TouchableOpacity
                onPress={handleBack}
                style={{ padding: 8, marginLeft: -8 }}
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
          }}
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {t('accountNotFound')}
        </Text>
      </View>
    );
  }

  const accountColor = account.color || theme.colors.primary;

  const cardBgColor = theme.colors.surface;

  const inflowBg = (theme.colors as any).incomeContainer;
  const inflowBorder = (theme.colors as any).income
    ? (theme.colors as any).income + '33'
    : theme.colors.outlineVariant;
  const outflowBg = theme.colors.errorContainer;
  const outflowBorder = theme.colors.error
    ? theme.colors.error + '33'
    : theme.colors.outlineVariant;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: account ? translateName(account.name) : t('accountDetails'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
              style={{ padding: 8, marginLeft: -8 }}
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
        }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
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
                <View style={styles.cardBalanceTopRow}>
                  <Text
                    style={[
                      styles.cardBalanceLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('currentBalanceLabel').toUpperCase()}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.adjustBalancePill,
                      {
                        backgroundColor: theme.colors.elevation.level1,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}
                    onPress={handleOpenAdjustModal}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('adjustBalance')}
                  >
                    <MaterialCommunityIcons
                      name="scale-balance"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.adjustBalancePillText,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {t('adjustBalance')}
                    </Text>
                  </TouchableOpacity>
                </View>
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
                    accessibilityLabel={t('addTransaction')}
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
                { backgroundColor: (theme.colors as any).incomeContainer },
              ]}
            >
              <Ionicons
                name="arrow-down"
                size={14}
                color={(theme.colors as any).income || '#10B981'}
              />
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
                style={[
                  styles.flowAmount,
                  { color: (theme.colors as any).income || '#10B981' },
                ]}
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
                { backgroundColor: theme.colors.errorContainer },
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

        {accountTransactions.some(
          (tx) => tx.type === 'expense' && !isAdjustmentTransaction(tx),
        ) && (
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

      <BottomSheet
        visible={adjustModalVisible}
        onClose={() => setAdjustModalVisible(false)}
        title={t('adjustBalance')}
        footer={
          <Button
            mode="contained"
            onPress={handleConfirmAdjustment}
            disabled={newBalanceValue === null || adjustmentDifference === 0}
            style={[
              styles.saveAdjustBtn,
              {
                backgroundColor:
                  newBalanceValue !== null && adjustmentDifference !== 0
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
              },
            ]}
            contentStyle={{ height: 48 }}
            labelStyle={{
              fontFamily: 'Inter-SemiBold',
              fontWeight: '600',
              fontSize: 15,
              color: theme.colors.onPrimary,
            }}
            accessibilityLabel={t('save')}
          >
            {t('save')}
          </Button>
        }
      >
        <View style={styles.adjustModalBody}>
          <Text
            style={[
              styles.adjustDescText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('reconcileBalanceDesc')}
          </Text>

          <View
            style={[
              styles.adjustSummaryCard,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.adjustSummaryRow}>
              <Text
                style={[
                  styles.adjustSummaryLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('currentBalanceLabel')}
              </Text>
              <Text
                style={[
                  styles.adjustSummaryValue,
                  { color: theme.colors.onSurface },
                ]}
              >
                {formatCurrency(account.currentBalance, account.currency)}
              </Text>
            </View>

            <View
              style={[
                styles.adjustDivider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />

            <View style={styles.adjustSummaryRow}>
              <Text
                style={[
                  styles.adjustSummaryLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('adjustmentDifference')}
              </Text>
              <Text
                style={[
                  styles.adjustSummaryValue,
                  {
                    color:
                      adjustmentDifference > 0
                        ? (theme.colors as any).income || '#16A34A'
                        : adjustmentDifference < 0
                          ? theme.colors.error
                          : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {adjustmentDifference > 0
                  ? `+${formatCurrency(adjustmentDifference, account.currency)}`
                  : adjustmentDifference < 0
                    ? `-${formatCurrency(Math.abs(adjustmentDifference), account.currency)}`
                    : formatCurrency(0, account.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.adjustFieldGroup}>
            <View style={styles.adjustFieldHeaderRow}>
              <Text
                style={[
                  styles.adjustFieldLabel,
                  { color: theme.colors.outline },
                ]}
              >
                {t('newActualBalance').toUpperCase()}
              </Text>
              {account.type === 'credit' && (
                <TouchableOpacity
                  onPress={toggleNegativeNewBalance}
                  style={[
                    styles.signToggleChip,
                    {
                      backgroundColor: isNegativeBalance
                        ? theme.colors.errorContainer
                        : theme.colors.elevation.level1,
                      borderColor: isNegativeBalance
                        ? theme.colors.error
                        : theme.colors.outlineVariant,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isNegativeBalance
                      ? t('negativeAdjustment')
                      : t('positiveAdjustment')
                  }
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'Inter-SemiBold',
                      fontWeight: '600',
                      color: isNegativeBalance
                        ? theme.colors.error
                        : theme.colors.onSurfaceVariant,
                    }}
                  >
                    {isNegativeBalance ? '- Negative' : '+ Positive'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              value={displayNewBalance}
              onChangeText={handleNewBalanceChange}
              mode="outlined"
              keyboardType="decimal-pad"
              placeholder="0"
              accessibilityLabel={t('newActualBalance')}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.outline}
              style={styles.adjustTextInput}
              left={
                <TextInput.Affix
                  text={`${isNegativeBalance ? '-' : ''}${account.currency} `}
                />
              }
            />
          </View>

          <View style={styles.adjustFieldGroup}>
            <Text
              style={[styles.adjustFieldLabel, { color: theme.colors.outline }]}
            >
              {t('note').toUpperCase()} ({t('optional').toUpperCase()})
            </Text>
            <TextInput
              value={adjustNote}
              onChangeText={setAdjustNote}
              mode="outlined"
              placeholder={t('balanceAdjustment')}
              accessibilityLabel={t('note')}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.outline}
              style={styles.adjustTextInput}
              maxLength={150}
            />
          </View>
        </View>
      </BottomSheet>
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
    cardBalanceTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    cardBalanceLabel: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    adjustBalancePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      gap: 6,
    },
    adjustBalancePillText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
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
    adjustModalBody: {
      gap: 16,
      paddingTop: 4,
    },
    adjustDescText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      lineHeight: 18,
    },
    adjustSummaryCard: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      gap: 10,
    },
    adjustSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    adjustSummaryLabel: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    adjustSummaryValue: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    adjustDivider: {
      height: 1,
      width: '100%',
    },
    adjustFieldGroup: {
      gap: 6,
    },
    adjustFieldHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    adjustFieldLabel: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      letterSpacing: 1.2,
      paddingLeft: 4,
    },
    signToggleChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    adjustTextInput: {
      backgroundColor: 'transparent',
      fontSize: 15,
      fontFamily: 'Inter-Medium',
    },
    saveAdjustBtn: {
      borderRadius: 14,
      width: '100%',
    },
  });
