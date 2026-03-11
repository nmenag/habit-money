import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Account } from '../store/useStore';

interface Props {
  account: Account;
  onDelete?: () => void;
}

export const AccountCard: React.FC<Props> = ({ account, onDelete }) => {
  const handleDelete = () => {
    if (onDelete) {
      Alert.alert(
        'Delete Account',
        `Are you sure you want to delete ${account.name}? This will also delete all associated transactions.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ],
      );
    }
  };

  return (
    <View
      style={[styles.card, { borderLeftColor: account.color || '#4caf50' }]}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{account.name}</Text>
        <Text style={styles.type}>{account.type.toUpperCase()}</Text>
        <Text style={styles.balance}>${account.currentBalance.toFixed(2)}</Text>
      </View>
      {onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#f44336" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  type: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  balance: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  deleteButton: {
    padding: 8,
  },
});
