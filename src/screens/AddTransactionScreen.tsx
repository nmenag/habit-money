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
import { TransactionType, useStore } from '../store/useStore';

export const AddTransactionScreen = ({ navigation }: any) => {
  const accounts = useStore((state) => state.accounts);
  const categories = useStore((state) => state.categories);
  const addTransaction = useStore((state) => state.addTransaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');

  const availableCategories = categories.filter((c) => c.type === type);
  const [selectedCategory, setSelectedCategory] = useState(
    availableCategories[0]?.id || '',
  );

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    if (!selectedAccount) {
      Alert.alert('Error', 'Please select an account.');
      return;
    }

    addTransaction({
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      categoryId: selectedCategory || null,
      accountId: selectedAccount,
      date: new Date().toISOString(),
      note,
    });

    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'expense' && styles.activeExpense]}
          onPress={() => setType('expense')}
        >
          <Text
            style={[styles.typeText, type === 'expense' && styles.activeText]}
          >
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'income' && styles.activeIncome]}
          onPress={() => setType('income')}
        >
          <Text
            style={[styles.typeText, type === 'income' && styles.activeText]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account</Text>
        <View style={styles.chips}>
          {accounts.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.chip,
                selectedAccount === acc.id && styles.activeChip,
              ]}
              onPress={() => setSelectedAccount(acc.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedAccount === acc.id && styles.activeChipText,
                ]}
              >
                {acc.name}
              </Text>
            </TouchableOpacity>
          ))}
          {accounts.length === 0 && (
            <Text style={{ color: 'red' }}>Please create an account first</Text>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {availableCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                selectedCategory === cat.id && styles.activeChip,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === cat.id && styles.activeChipText,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Note (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="E.g. Groceries at Target"
          value={note}
          onChangeText={setNote}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Transaction</Text>
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
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeExpense: {
    backgroundColor: '#f44336',
  },
  activeIncome: {
    backgroundColor: '#4caf50',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  activeText: {
    color: '#fff',
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
  amountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#2196f3',
    paddingVertical: 8,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  activeChip: {
    backgroundColor: '#2196f3',
  },
  chipText: {
    color: '#555',
  },
  activeChipText: {
    color: '#fff',
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
