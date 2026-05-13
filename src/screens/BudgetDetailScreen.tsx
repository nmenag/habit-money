import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Avatar,
  Card,
  Divider,
  IconButton,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { TransactionItem } from '../components/TransactionItem';
import { useStore, useTranslation } from '../store/useStore';
import { fontScale, moderateScale } from '../utils/responsive';

export const BudgetDetailScreen = () => {
  const params = useLocalSearchParams<{ budgetId: string }>();
  const { budgetId } = params;
  const { budgets, transactions, categories, formatCurrency } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme();
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

  if (!budget) {
    return (
      <View style={styles.container}>
        <Text>{t('budgetNotFound' as any) || 'Budget not found'}</Text>
      </View>
    );
  }

  const spent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
  const progress = Math.min(spent / budget.amount, 1);
  const remaining = Math.max(budget.amount - spent, 0);
  const category = categories.find((c) => c.id === budget.categoryId);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
      >
        <Card style={styles.headerCard} mode="contained">
          <Card.Content style={styles.headerContent}>
            <Avatar.Icon
              size={64}
              icon={category?.icon || 'tag'}
              style={{
                backgroundColor: budget.color || theme.colors.primary,
                marginBottom: 12,
              }}
              color="#fff"
            />
            <Text
              variant="headlineSmall"
              style={[styles.budgetName, { fontSize: fontScale(24) }]}
            >
              {category?.name ? translateName(category.name) : t('budgets')}
            </Text>
            <View style={styles.progressSection}>
              <View style={styles.headerRow}>
                <Text
                  variant="titleMedium"
                  style={{
                    fontWeight: '700',
                    flexShrink: 1,
                    fontSize: fontScale(16),
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(spent)}
                </Text>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.outline, marginLeft: 4 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  / {formatCurrency(budget.amount)}
                </Text>
              </View>
              <ProgressBar
                progress={progress}
                color={budget.color || theme.colors.primary}
                style={styles.progressBar}
              />
              <View style={styles.headerRow}>
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {t('remainingAmount')}: {formatCurrency(remaining)}
                </Text>
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <IconButton
                icon="pencil"
                mode="contained"
                onPress={() =>
                  router.push({
                    pathname: '/add-budget',
                    params: { budget: JSON.stringify(budget) },
                  })
                }
              />
              <IconButton
                icon="plus"
                mode="contained"
                containerColor={theme.colors.primary}
                iconColor="#fff"
                onPress={() =>
                  router.push({
                    pathname: '/add-transaction',
                    params: { budgetId: budget.id },
                  })
                }
              />
            </View>
          </Card.Content>
        </Card>

        <View style={styles.sectionTransactions}>
          <Text variant="titleMedium" style={styles.sectionTitleTransactions}>
            {t('recentTransactions')}
          </Text>
          {budgetTransactions.length > 0 ? (
            budgetTransactions.map((tx, index) => {
              const txCategory = categories.find((c) => c.id === tx.categoryId);
              return (
                <View key={tx.id}>
                  <TouchableOpacity
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
                  {index < budgetTransactions.length - 1 && <Divider />}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTransactions}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={theme.colors.outlineVariant}
              />
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>
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

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerCard: {
      margin: moderateScale(16),
      marginTop: moderateScale(24),
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceVariant,
      paddingVertical: moderateScale(24),
    },
    headerContent: {
      alignItems: 'center',
    },
    budgetName: {
      fontWeight: '800',
      marginBottom: 12,
    },
    progressSection: {
      width: '100%',
      paddingHorizontal: 16,
      marginTop: 8,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressBar: {
      height: 12,
      borderRadius: 6,
      marginBottom: 8,
    },
    headerActions: {
      flexDirection: 'row',
      marginTop: 16,
      gap: 8,
    },
    sectionTransactions: {
      marginTop: 32,
      paddingHorizontal: 16,
    },
    sectionTitleTransactions: {
      fontWeight: '800',
      marginBottom: 16,
      marginLeft: 16,
    },
    emptyTransactions: {
      alignItems: 'center',
      padding: 40,
    },
  });
