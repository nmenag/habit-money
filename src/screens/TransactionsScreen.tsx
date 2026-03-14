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
import { BannerAdComponent } from '../components/BannerAdComponent';
import { TransactionItem } from '../components/TransactionItem';
import { useStore, useTranslation } from '../store/useStore';

export const TransactionsScreen = ({ route, navigation }: any) => {
  const { transactions, accounts, categories, deleteTransaction } = useStore();
  const { t } = useTranslation();

  const filterAccountId = route.params?.accountId;
  const filteredTransactions = filterAccountId
    ? transactions.filter((t) => t.accountId === filterAccountId)
    : transactions;

  const activeAccount = filterAccountId
    ? accounts.find((a) => a.id === filterAccountId)
    : null;

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

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {activeAccount && (
        <View style={styles.filterHeader}>
          <Text style={styles.filterText}>
            {t('accounts')}: {activeAccount.name}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.setParams({ accountId: undefined })}
          >
            <Ionicons name="close-circle" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
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
      />
      <BannerAdComponent />
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 8 }]}
        onPress={() =>
          navigation.navigate('AddTransaction', {
            accountId: filterAccountId,
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
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
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
    bottom: 24,
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
