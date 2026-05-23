import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Divider, ProgressBar, Text, useTheme } from 'react-native-paper';
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
  const { t, translateName } = useTranslation();
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

  // Actionable savings advice
  const savingsInsight = useMemo(() => {
    if (!budget) return '';
    const dailySaving = Math.round(budget.amount * 0.05); // 5% of budget limit
    const monthlySaving = dailySaving * 30;
    const spentVal = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
    const isOverLimitVal = spentVal > budget.amount;

    if (isOverLimitVal) {
      return `💡 Budget Exceeded: Reducing weekly spending here by ${formatCurrency(dailySaving * 7)} will help re-align your cash flow and secure liquidity.`;
    } else {
      return `💡 Smart tip: Scaling down spending in this category by just ${formatCurrency(dailySaving)} per day will unlock ${formatCurrency(monthlySaving)} per month to accelerate your active Savings Goals.`;
    }
  }, [budget, budgetTransactions, formatCurrency]);

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
          paddingBottom: insets.bottom + 100,
        }}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <Card style={styles.headerCard} mode="contained">
            <Card.Content style={styles.headerContent}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: `${categoryColor}12`,
                    borderColor: `${categoryColor}2B`,
                  },
                ]}
              >
                <Ionicons
                  name={(category?.icon || 'tag-outline') as any}
                  size={24}
                  color={categoryColor}
                />
              </View>

              <Text style={styles.budgetName}>
                {category?.name ? translateName(category.name) : t('budgets')}
              </Text>

              <View style={styles.progressSection}>
                <View style={styles.headerRow}>
                  <Text style={styles.amountText} numberOfLines={1}>
                    {formatCurrency(spent)}
                    <Text style={styles.amountTarget}>
                      {' '}
                      / {formatCurrency(budget.amount)}
                    </Text>
                  </Text>
                </View>

                <ProgressBar
                  progress={progress}
                  color={isOverLimit ? theme.colors.error : categoryColor}
                  style={styles.progressBar}
                />

                <View style={styles.headerRow}>
                  <Text style={styles.remainingText} numberOfLines={1}>
                    {isOverLimit
                      ? t('overLimit' as any) || 'Budget Overspent!'
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

              <View style={styles.headerActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.actionBtn,
                    { borderColor: theme.colors.outline },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/add-budget',
                      params: { budget: JSON.stringify(budget) },
                    })
                  }
                >
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    color={theme.colors.onSurface}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.actionBtnLabel}>{t('edit')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.actionBtnPrimary,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/add-transaction',
                      params: { budgetId: budget.id },
                    })
                  }
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.actionBtnLabelPrimary}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(300)}>
          <View style={styles.insightBox}>
            <Ionicons
              name="bulb-outline"
              size={18}
              color={isOverLimit ? theme.colors.error : theme.colors.primary}
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <Text style={styles.insightText}>{savingsInsight}</Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).duration(300)}
          style={styles.sectionTransactions}
        >
          <Text style={styles.sectionTitleTransactions}>
            {t('recentTransactions')}
          </Text>

          <View style={styles.transactionsCard}>
            {budgetTransactions.length > 0 ? (
              budgetTransactions.map((tx, index) => {
                const txCategory = categories.find(
                  (c) => c.id === tx.categoryId,
                );
                return (
                  <View key={tx.id}>
                    <TouchableOpacity
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
                      <TransactionItem transaction={tx} category={txCategory} />
                    </TouchableOpacity>
                    {index < budgetTransactions.length - 1 && (
                      <Divider style={styles.divider} />
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyTransactions}>
                <Ionicons
                  name="receipt-outline"
                  size={40}
                  color={theme.colors.outlineVariant}
                />
                <Text style={styles.emptyTransactionsText}>
                  {t('noTransactions') ||
                    'No transactions tracked inside this budget yet.'}
                </Text>
              </View>
            )}
          </View>
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
    headerCard: {
      margin: 16,
      marginTop: 20,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      paddingVertical: 16,
    },
    headerContent: {
      alignItems: 'center',
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    budgetName: {
      fontSize: fontScale(18),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 16,
    },
    progressSection: {
      width: '100%',
      paddingHorizontal: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    amountText: {
      fontSize: fontScale(22),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    amountTarget: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      marginBottom: 8,
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
    headerActions: {
      flexDirection: 'row',
      marginTop: 24,
      gap: 12,
      width: '100%',
      paddingHorizontal: 12,
    },
    actionBtn: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionBtnLabel: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    actionBtnPrimary: {
      flex: 1.2,
      height: 40,
      borderRadius: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionBtnLabelPrimary: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: '#fff',
    },
    insightBox: {
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness || 12,
      backgroundColor: theme.colors.surface,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    insightText: {
      flex: 1,
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      lineHeight: 18,
      color: theme.colors.onSurface,
    },
    sectionTransactions: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionTitleTransactions: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
      marginBottom: 10,
    },
    transactionsCard: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
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
    divider: {
      backgroundColor: theme.colors.outline,
    },
  });
