import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarView } from '../components/CalendarView';
import { TransactionItem } from '../components/TransactionItem';
import { useStore, useTranslation } from '../store/useStore';
import { format, isSameDay } from 'date-fns';

export const CalendarScreen = ({ navigation }: any) => {
  const { transactions, categories, deleteTransaction } = useStore();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const insets = useSafeAreaInsets();

  const dayTransactions = transactions.filter((t) =>
    isSameDay(new Date(t.date), selectedDate),
  );

  const dayTotals = dayTransactions.reduce(
    (acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );

  const dailyNet = dayTotals.income - dayTotals.expense;

  const handleTransactionPress = (transaction: any) => {
    Alert.alert(t('transactionOptions'), t('whatToDo'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('edit'),
        onPress: () =>
          navigation.navigate('AddTransaction', {
            transaction,
            isEditing: true,
          }),
      },
      {
        text: t('duplicate'),
        onPress: () =>
          navigation.navigate('AddTransaction', {
            transaction,
            isEditing: false,
          }),
      },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('confirmDelete'), t('confirmDeleteTx'), [
            { text: t('cancel'), style: 'cancel' },
            {
              text: t('delete'),
              style: 'destructive',
              onPress: () =>
                deleteTransaction(
                  transaction.id,
                  transaction.accountId,
                  transaction.amount,
                  transaction.type,
                ),
            },
          ]),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={dayTransactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <CalendarView
              selectedDate={selectedDate}
              onDayPress={setSelectedDate}
            />
            <View style={styles.listTitleContainer}>
              <View>
                <Text style={styles.listTitle}>
                  {format(selectedDate, 'PP')}
                </Text>
                <Text style={styles.transactionCount}>
                  {dayTransactions.length} {t('transactions')}
                </Text>
              </View>
              <View style={styles.totalsContainer}>
                {dayTotals.income > 0 && (
                  <Text style={styles.incomeTotal}>
                    +{dayTotals.income.toFixed(2)}
                  </Text>
                )}
                {dayTotals.expense > 0 && (
                  <Text style={styles.expenseTotal}>
                    -{dayTotals.expense.toFixed(2)}
                  </Text>
                )}
                <Text
                  style={[
                    styles.netTotal,
                    dailyNet < 0 ? styles.expenseTotal : styles.incomeTotal,
                  ]}
                >
                  Sum: {dailyNet.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const category = categories.find((c) => c.id === item.categoryId);
          return (
            <TouchableOpacity
              onPress={() => handleTransactionPress(item)}
              activeOpacity={0.7}
            >
              <TransactionItem transaction={item} category={category} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noTransactions')}</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      />
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={() =>
          navigation.navigate('AddTransaction', {
            date: selectedDate.toISOString(),
          })
        }
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  totalsContainer: {
    alignItems: 'flex-end',
  },
  incomeTotal: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  expenseTotal: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: 'bold',
  },
  netTotal: {
    fontSize: 12,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 2,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
