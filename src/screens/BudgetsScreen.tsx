import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {
  Card,
  FAB,
  IconButton,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { Budget, useStore, useTranslation } from '../store/useStore';
import { fontScale, moderateScale } from '../utils/responsive';

export const BudgetsScreen = () => {
  const {
    budgets,
    deleteBudget,
    transactions,
    formatCurrency,
    categories,
    updateBudgetsOrder,
  } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);

  const handleDelete = (budget: Budget) => {
    const isUsed = transactions.some((t) => t.budgetId === budget.id);
    if (isUsed) {
      Alert.alert(t('cannotDelete'), t('budgetUsedError'));
      return;
    }

    const category = categories.find((c) => c.id === budget.categoryId);
    const budgetDisplayName = category?.name
      ? translateName(category.name)
      : t('budgets');

    Alert.alert(
      t('deleteBudget'),
      `${t('confirmDelete')} ${budgetDisplayName}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteBudget(budget.id),
        },
      ],
    );
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Budget>) => {
    const spent = transactions
      .filter((t) => {
        const matchesBudget = t.budgetId === item.id;
        const matchesCategory =
          item.categoryId && t.categoryId === item.categoryId;
        return (matchesBudget || matchesCategory) && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);
    const progress = Math.min(spent / item.amount, 1);
    const remaining = Math.max(item.amount - spent, 0);
    const category = categories.find((c) => c.id === item.categoryId);

    return (
      <ScaleDecorator>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: isActive
                ? theme.colors.elevation.level3
                : theme.colors.surface,
            },
          ]}
          onPress={() =>
            router.push({
              pathname: '/budget-detail',
              params: { budgetId: item.id },
            })
          }
          onLongPress={drag}
          disabled={isActive}
          mode="elevated"
        >
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.textContainer}>
                <Text variant="titleLarge" style={styles.name}>
                  {category?.name ? translateName(category.name) : t('budgets')}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={styles.limitText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(spent)} / {formatCurrency(item.amount)}
                </Text>
              </View>
              <IconButton
                icon="trash-can-outline"
                iconColor={theme.colors.error}
                size={24}
                onPress={() => handleDelete(item)}
              />
            </View>

            <ProgressBar
              progress={progress}
              color={item.color || theme.colors.primary}
              style={styles.progressBar}
            />

            <View style={styles.footerRow}>
              <Text
                variant="labelSmall"
                style={[styles.remainingText, { flex: 1 }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('remainingAmount')}: {formatCurrency(remaining)}
              </Text>
              <Text variant="labelSmall" style={styles.percentageText}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScaleDecorator>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DraggableFlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => updateBudgetsOrder(data)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text
              variant="bodyLarge"
              style={[styles.emptyText, { color: theme.colors.outline }]}
            >
              {t('noBudgets')}
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
        onPress={() => router.push('/add-budget')}
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      paddingTop: moderateScale(8),
    },
    card: {
      marginVertical: 8,
      marginHorizontal: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    textContainer: {
      flex: 1,
    },
    name: {
      fontWeight: '800',
      color: theme.colors.onSurface,
      fontSize: fontScale(18),
    },
    limitText: {
      color: theme.colors.onSurface,
      marginTop: 4,
      fontWeight: '700',
    },
    progressBar: {
      height: 12,
      borderRadius: 6,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    remainingText: {
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
    },
    percentageText: {
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 80,
    },
    emptyText: {
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
      elevation: 6,
    },
  });
