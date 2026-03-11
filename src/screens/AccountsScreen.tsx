import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AccountCard } from '../components/AccountCard';
import { useStore } from '../store/useStore';

export const AccountsScreen = ({ navigation }: any) => {
  const accounts = useStore((state) => state.accounts);
  const deleteAccount = useStore((state) => state.deleteAccount);

  const handleAddAccount = () => {
    navigation.navigate('AddAccount');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddAccount', { account: item })}
          >
            <AccountCard
              account={item}
              onDelete={
                accounts.length > 1 ? () => deleteAccount(item.id) : undefined
              }
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No accounts found.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
          <Text style={styles.addButtonText}>Add Account</Text>
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
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
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
