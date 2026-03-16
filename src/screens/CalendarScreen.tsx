import { format, isSameDay } from 'date-fns';
import React, { useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FAB, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarView } from '../components/CalendarView';
import { TransactionItem } from '../components/TransactionItem';
import { useStore, useTranslation } from '../store/useStore';

// Helper function for formatting amounts
const formatAmount = (amount: number, formatCurrency: any) => {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'k';
  return formatCurrency(amount);
};

export const CalendarScreen = ({ navigation }: any) => {
  const { transactions, categories, formatCurrency } = useStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
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
    navigation.navigate('AddTransaction', {
      transaction,
      isEditing: true,
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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
                <Text variant="titleMedium" style={styles.listTitle}>
                  {format(selectedDate, 'PP')}
                </Text>
                <Text variant="labelSmall" style={styles.transactionCount}>
                  {dayTransactions.length} {t('transactions')}
                </Text>
              </View>
              <View style={styles.totalsContainer}>
                {dayTotals.income > 0 && (
                  <Text variant="labelLarge" style={styles.incomeTotal}>
                    +{formatAmount(dayTotals.income, formatCurrency)}
                  </Text>
                )}
                {dayTotals.expense > 0 && (
                  <Text variant="labelLarge" style={styles.expenseTotal}>
                    -{formatAmount(dayTotals.expense, formatCurrency)}
                  </Text>
                )}
                <Text
                  variant="labelSmall"
                  style={[
                    styles.netTotal,
                    { color: dailyNet < 0 ? theme.colors.error : '#4caf50' },
                  ]}
                >
                  Sum: {formatCurrency(dailyNet)}
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
            <Text variant="bodyMedium" style={styles.emptyText}>
              {t('noTransactions')}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      />
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: (insets.bottom || 0) + 80 }]}
        onPress={() =>
          navigation.navigate('AddTransaction', {
            date: selectedDate.toISOString(),
          })
        }
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
      borderBottomColor: 'rgba(0,0,0,0.05)',
      marginBottom: 8,
    },
    listTitle: {
      fontWeight: '900',
      color: theme.colors.onSurface,
    },
    transactionCount: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    totalsContainer: {
      alignItems: 'flex-end',
    },
    incomeTotal: {
      color: '#4caf50',
      fontWeight: 'bold',
    },
    expenseTotal: {
      color: '#f44336',
      fontWeight: 'bold',
    },
    netTotal: {
      marginTop: 2,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.05)',
      paddingTop: 2,
      fontWeight: '700',
    },
    empty: {
      padding: 60,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
    },
  });
