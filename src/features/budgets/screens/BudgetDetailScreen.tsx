import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Card,
  IconButton,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { TransactionItem } from '../../transactions/components/TransactionItem';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

export const BudgetDetailScreen = () => {
  const params = useLocalSearchParams<{ budgetId: string }>();
  const { budgetId } = params;
  const { budgets, transactions, categories, formatCurrency } = useStore();
  const { t, translateName, language } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const budget = budgets.find((b) => b.id === budgetId);

  const budgetTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesBudget = tx.budgetId === budgetId;
        const matchesCategory =
          budget?.categoryId && tx.categoryId === budget.categoryId;
        return (matchesBudget || matchesCategory) && tx.type === 'expense';
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, budgetId, budget?.categoryId]);

  const groupedTransactions = useMemo(() => {
    const groups: { title: string; data: typeof budgetTransactions }[] = [];
    const dateLocale = language === 'es' ? es : enUS;

    budgetTransactions.forEach((tx) => {
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
  }, [budgetTransactions, language]);

  // Actionable savings advice
  const savingsInsight = useMemo(() => {
    if (!budget) return '';
    const dailySaving = Math.round(budget.amount * 0.05); // 5% of budget limit
    const monthlySaving = dailySaving * 30;
    const spentVal = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
    const isOverLimitVal = spentVal > budget.amount;

    if (isOverLimitVal) {
      return t('budgetExceededTip', {
        weeklySaving: formatCurrency(dailySaving * 7),
      });
    } else {
      return t('smartSavingsTip', {
        dailySaving: formatCurrency(dailySaving),
        monthlySaving: formatCurrency(monthlySaving),
      });
    }
  }, [budget, budgetTransactions, formatCurrency, t]);

  if (!budget) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>
          {t('budgetNotFound' as any) || 'Budget not found'}
        </Text>
      </View>
    );
  }

  const spent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
  const progress = Math.min(spent / budget.amount, 1);
  const remaining = Math.max(budget.amount - spent, 0);
  const category = categories.find((c) => c.id === budget.categoryId);
  const isOverLimit = spent > budget.amount;
  const categoryColor = budget.color || theme.colors.primary;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(16, insets.top),
          paddingBottom: insets.bottom + 200,
        }}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <Card
            style={[
              styles.creditCard,
              {
                backgroundColor: theme.colors.surface,
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
                  {t('aggregateSpending').toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.cardBalance,
                    {
                      color: isOverLimit
                        ? theme.colors.error
                        : theme.colors.onSurface,
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(spent)}
                  <Text style={styles.cardGoalText}>
                    {' '}
                    / {formatCurrency(budget.amount)}
                  </Text>
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={progress}
                  color={isOverLimit ? theme.colors.error : categoryColor}
                  style={styles.progressBar}
                />
                <View style={styles.progressInfoRow}>
                  <Text style={styles.remainingText}>
                    {isOverLimit
                      ? t('overLimit' as any) || 'Over limit'
                      : `${t('remainingAmount')}: ${formatCurrency(remaining)}`}
                  </Text>
                  <Text
                    style={[
                      styles.percentageText,
                      {
                        color: isOverLimit
                          ? theme.colors.error
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.cardBottomRow}>
                <View style={styles.cardInfoCol}>
                  <Text
                    style={[
                      styles.cardHolderLabel,
                      { color: theme.colors.outline },
                    ]}
                  >
                    {t('categoryName').toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.cardHolderName,
                      { color: theme.colors.onSurface },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {category?.name
                      ? translateName(category.name)
                      : t('budgets')}
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
                        pathname: '/add-budget',
                        params: { budget: JSON.stringify(budget) },
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
                        params: { budgetId: budget.id },
                      })
                    }
                    style={styles.actionIconBtn}
                  />
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(300)}>
          <View
            style={[
              styles.insightCapsule,
              {
                backgroundColor: isOverLimit
                  ? theme.dark
                    ? '#341F1C'
                    : '#FBECE9'
                  : theme.dark
                    ? '#052E16'
                    : '#DCFCE7',
                borderColor: isOverLimit
                  ? theme.dark
                    ? '#991B1B2B'
                    : '#FCA5A5'
                  : theme.dark
                    ? '#065F462B'
                    : '#A7F3D0',
              },
            ]}
          >
            <View
              style={[
                styles.insightIconBox,
                {
                  backgroundColor: isOverLimit
                    ? '#EF4444'
                    : theme.colors.primary,
                },
              ]}
            >
              <Ionicons name="bulb-outline" size={14} color="#fff" />
            </View>
            <View style={styles.insightTextCol}>
              <Text
                style={[
                  styles.insightLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {isOverLimit
                  ? t('insightBalanceNegativeTitle').toUpperCase()
                  : t('insightBalancePositiveTitle').toUpperCase()}
              </Text>
              <Text style={styles.insightDesc}>{savingsInsight}</Text>
            </View>
          </View>
        </Animated.View>

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
                    const txCategory = categories.find(
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
                        <TransactionItem
                          transaction={tx}
                          category={txCategory}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.transactionsList}>
              <Card style={styles.transactionsCard} mode="contained">
                <Card.Content style={styles.emptyTransactions}>
                  <Ionicons
                    name="receipt-outline"
                    size={40}
                    color={theme.colors.outlineVariant}
                  />
                  <Text style={styles.emptyTransactionsText}>
                    {t('noTransactions') ||
                      'No transactions tracked inside this budget yet.'}
                  </Text>
                </Card.Content>
              </Card>
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
    creditCard: {
      marginHorizontal: 16,
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
    cardGoalText: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    progressContainer: {
      marginBottom: 20,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      marginBottom: 8,
    },
    progressInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    remainingText: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    percentageText: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
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
    insightCapsule: {
      marginHorizontal: 16,
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      gap: 10,
    },
    insightIconBox: {
      width: 30,
      height: 30,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    insightTextCol: {
      flex: 1,
    },
    insightLabel: {
      fontSize: fontScale(9),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      marginBottom: 2,
    },
    insightDesc: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      letterSpacing: -0.2,
      lineHeight: 16,
      flex: 1,
    },
    transactionsSection: {
      paddingHorizontal: 16,
      marginTop: 24,
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
    transactionsCard: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.roundness || 12,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    emptyTransactions: {
      alignItems: 'center',
      padding: 32,
    },
    emptyTransactionsText: {
      textAlign: 'center',
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.outline,
      marginTop: 8,
      lineHeight: 16,
    },
  });
