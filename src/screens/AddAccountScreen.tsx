import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Account, AccountType, useStore } from '../store/useStore';

const COLORS = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#ff9800',
  '#795548',
  '#607d8b',
];

export const AddAccountScreen = ({ route, navigation }: any) => {
  const editingAccount = route.params?.account as Account | undefined;
  const isEditing = !!editingAccount;

  const addAccount = useStore((state) => state.addAccount);
  const editAccount = useStore((state) => state.editAccount);
  const addTransaction = useStore((state) => state.addTransaction);

  const [name, setName] = useState(editingAccount?.name || '');
  const [type, setType] = useState<AccountType>(editingAccount?.type || 'cash');
  const [balance, setBalance] = useState(
    editingAccount ? editingAccount.currentBalance.toString() : '',
  );
  const [color, setColor] = useState(editingAccount?.color || COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name.');
      return;
    }

    const balanceNum = parseFloat(balance);
    if (balance !== '' && isNaN(balanceNum)) {
      Alert.alert('Error', 'Please enter a valid balance.');
      return;
    }

    const finalBalance = isNaN(balanceNum) ? 0 : balanceNum;

    if (isEditing) {
      // 1. Update account details without modifying internal currentBalance directly initially
      editAccount({
        ...editingAccount,
        name: name.trim(),
        type: type,
        color: color,
        // We do NOT update the balance here, we let the transaction engine adjust it
        // to maintain ledger integrity.
        currentBalance: editingAccount.currentBalance,
      });

      // 2. Adjust Balance with a transaction if changed
      if (finalBalance !== editingAccount.currentBalance) {
        const difference = finalBalance - editingAccount.currentBalance;
        const txType = difference > 0 ? 'income' : 'expense';

        addTransaction({
          id: Date.now().toString(),
          type: txType,
          amount: Math.abs(difference),
          categoryId: null, // Uncategorized because it's an adjustment
          accountId: editingAccount.id,
          date: new Date().toISOString(),
          note: 'Balance Adjustment',
        });
      }
    } else {
      addAccount({
        id: Date.now().toString(),
        name: name.trim(),
        type: type,
        initialBalance: finalBalance,
        currentBalance: finalBalance,
        color: color,
      });
    }

    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Checking Wallet"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account Type</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'cash' && styles.activeTypeBtn]}
            onPress={() => setType('cash')}
          >
            <Text
              style={[
                styles.typeText,
                type === 'cash' && styles.activeTypeText,
              ]}
            >
              Cash
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'bank' && styles.activeTypeBtn]}
            onPress={() => setType('bank')}
          >
            <Text
              style={[
                styles.typeText,
                type === 'bank' && styles.activeTypeText,
              ]}
            >
              Bank
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'credit' && styles.activeTypeBtn]}
            onPress={() => setType('credit')}
          >
            <Text
              style={[
                styles.typeText,
                type === 'credit' && styles.activeTypeText,
              ]}
            >
              Credit
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {isEditing ? 'Current Balance' : 'Initial Balance'}
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="0.00"
          value={balance}
          onChangeText={setBalance}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorContainer}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                color === c && styles.activeColorCircle,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>
          {isEditing ? 'Update Account' : 'Save Account'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTypeBtn: {
    backgroundColor: '#2196f3',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeTypeText: {
    color: '#fff',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColorCircle: {
    borderColor: '#333',
  },
  saveBtn: {
    backgroundColor: '#2196f3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
