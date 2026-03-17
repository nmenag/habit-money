import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Card,
  FAB,
  IconButton,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Budget, useStore, useTranslation } from '../store/useStore';

export const BudgetsScreen = ({ navigation }: any) => {
  const { budgets, deleteBudget, transactions, formatCurrency, categories } =
    useStore();
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

  const renderItem = ({ item }: { item: Budget }) => {
    const spent = transactions
      .filter((t) => {
        const matchesBudget = t.budgetId === item.id;
        const matchesCategory =
          item.categoryId && t.categoryId === item.categoryId;
        return (matchesBudget || matchesCategory) && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);
    const progress = Math.min(spent / item.amount, 1);
    const category = categories.find((c) => c.id === item.categoryId);

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('AddBudget', { budget: item })}
        mode="elevated"
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.textContainer}>
              <Text variant="titleLarge" style={styles.name}>
                {category?.name ? translateName(category.name) : t('budgets')}
              </Text>
              <Text variant="bodyMedium" style={styles.limitText}>
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

          <Text variant="labelSmall" style={styles.percentageText}>
            {Math.round(progress * 100)}%
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
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

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: (insets.bottom || 0) + 80 }]}
        onPress={() => navigation.navigate('AddBudget')}
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
    percentageText: {
      alignSelf: 'flex-end',
      marginTop: 4,
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
      borderRadius: 20,
      elevation: 4,
    },
  });
