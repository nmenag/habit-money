import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Category, Transaction, useStore, useTranslation } from '../store/useStore';

interface Props {
  transaction: Transaction;
  category?: Category;
}

export const TransactionItem: React.FC<Props> = ({ transaction, category }) => {
  const { formatCurrency, currency } = useStore();
  const { t, language } = useTranslation();
  const isIncome = transaction.type === 'income';

  const dateLocale = language === 'es' ? es : enUS;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: category?.color || '#eee' },
        ]}
      >
        <Text style={styles.icon}>
          {category?.name ? category.name[0].toUpperCase() : '?'}
        </Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.categoryName}>
          {category?.name || t('uncategorized')}
        </Text>
        <Text style={styles.date}>
          {format(parseISO(transaction.date), 'MMM d, yyyy', {
            locale: dateLocale,
          })}
        </Text>
        {transaction.note && (
          <Text style={styles.note}>{transaction.note}</Text>
        )}
      </View>
      <Text
        style={[styles.amount, { color: isIncome ? '#4caf50' : '#f44336' }]}
      >
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount)}
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
