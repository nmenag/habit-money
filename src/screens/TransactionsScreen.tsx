import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FAB, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { TransactionItem } from '../components/TransactionItem';
import { useStore, useTranslation } from '../store/useStore';

export const TransactionsScreen = ({ route, navigation }: any) => {
  const { transactions, accounts, categories } = useStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);

  const filterAccountId = route.params?.accountId;
  const filteredTransactions = filterAccountId
    ? transactions.filter((t) => t.accountId === filterAccountId)
    : transactions;

  const activeAccount = filterAccountId
    ? accounts.find((a) => a.id === filterAccountId)
    : null;

  const handleTransactionPress = (transaction: any) => {
    navigation.navigate('AddTransaction', {
      transaction,
      isEditing: true,
    });
  };

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {activeAccount && (
        <View style={styles.filterHeader}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {t('accounts')}: {activeAccount.name}
          </Text>
          <IconButton
            icon="close-circle"
            iconColor={theme.colors.error}
            size={24}
            onPress={() => navigation.setParams({ accountId: undefined })}
          />
        </View>
      )}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
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
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              {t('noTransactions')}
            </Text>
          </View>
        }
      />
      <BannerAdComponent />
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: (insets.bottom || 0) + 80 }]}
        onPress={() =>
          navigation.navigate('AddTransaction', {
            accountId: filterAccountId,
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
    filterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 16,
      paddingRight: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    empty: {
      padding: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 16,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
    },
  });
