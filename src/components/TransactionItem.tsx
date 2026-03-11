import { format, parseISO } from 'date-fns';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Category, Transaction } from '../store/useStore';

interface Props {
  transaction: Transaction;
  category?: Category;
}

export const TransactionItem: React.FC<Props> = ({ transaction, category }) => {
  const isIncome = transaction.type === 'income';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: category?.color || '#eee' },
        ]}
      >
        <Text style={styles.icon}>
          {category?.icon ? category.name[0] : '?'}
        </Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.categoryName}>
          {category?.name || 'Uncategorized'}
        </Text>
        <Text style={styles.date}>
          {format(parseISO(transaction.date), 'MMM d, yyyy')}
        </Text>
        {transaction.note && (
          <Text style={styles.note}>{transaction.note}</Text>
        )}
      </View>
      <Text
        style={[styles.amount, { color: isIncome ? '#4caf50' : '#f44336' }]}
      >
        {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontWeight: 'bold',
    color: '#555',
  },
  details: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
