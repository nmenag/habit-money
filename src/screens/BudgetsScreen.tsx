import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Budget, useStore, useTranslation } from '../store/useStore';

export const BudgetsScreen = ({ navigation }: any) => {
  const { budgets, deleteBudget, transactions, formatCurrency } = useStore();
  const { t, language } = useTranslation();

  const handleDelete = (budget: Budget) => {
    const isUsed = transactions.some((t) => t.budgetId === budget.id);
    if (isUsed) {
      Alert.alert(t('cannotDelete'), t('budgetUsedError'));
      return;
    }

    Alert.alert(t('deleteBudget'), `${t('confirmDelete')} ${budget.name}?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => deleteBudget(budget.id),
      },
    ]);
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
    const progress = Math.min((spent / item.amount) * 100, 100);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AddBudget', { budget: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.color || '#ccc' },
            ]}
          >
            <Ionicons name="pie-chart" size={24} color="#fff" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.type}>
              {formatCurrency(spent)} / {formatCurrency(item.amount)}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: item.color || '#2196f3',
              },
            ]}
          />
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noBudgets')}</Text>
          </View>
        }
      />
      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBudget')}
        >
          <Text style={styles.addButtonText}>{t('addBudget')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  type: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    padding: 4,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  addButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
