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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionType, useStore, useTranslation } from '../store/useStore';

export const AddTransactionScreen = ({ route, navigation }: any) => {
  const editingTransaction = route.params?.transaction;
  const isEditing = !!route.params?.isEditing;

  const { accounts, categories, budgets, addTransaction, editTransaction } =
    useStore();
  const { t, language } = useTranslation();

  const [type, setType] = useState<TransactionType>(
    editingTransaction?.type || 'expense',
  );
  const [amount, setAmount] = useState(
    editingTransaction ? Math.abs(editingTransaction.amount).toString() : '',
  );
  const [note, setNote] = useState(editingTransaction?.note || '');
  const [selectedAccount, setSelectedAccount] = useState(
    editingTransaction?.accountId || accounts[0]?.id || '',
  );

  const availableCategories = categories.filter((c) => c.type === type);
  const [selectedCategory, setSelectedCategory] = useState(
    editingTransaction?.categoryId || availableCategories[0]?.id || '',
  );
  const [selectedBudget, setSelectedBudget] = useState(
    editingTransaction?.budgetId || '',
  );

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }
    if (!selectedAccount) {
      Alert.alert(t('error'), t('selectAccount'));
      return;
    }

    if (isEditing && editingTransaction) {
      editTransaction({
        id: editingTransaction.id,
        type,
        amount: parseFloat(amount),
        categoryId: selectedCategory || null,
        accountId: selectedAccount,
        budgetId: selectedBudget || null,
        date: editingTransaction.date,
        note,
      });
    } else {
      addTransaction({
        id: Date.now().toString(),
        type,
        amount: parseFloat(amount),
        categoryId: selectedCategory || null,
        accountId: selectedAccount,
        budgetId: selectedBudget || null,
        // When duplicating, record as a new date
        date: new Date().toISOString(),
        note,
      });
    }

    navigation.goBack();
  };

  const insets = useSafeAreaInsets();

  const activeAccount = accounts.find((acc) => acc.id === selectedAccount);
  const displayCurrency = activeAccount?.currency || 'COP';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'expense' && styles.activeExpense]}
          onPress={() => setType('expense')}
        >
          <Text
            style={[styles.typeText, type === 'expense' && styles.activeText]}
          >
            {t('expense')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'income' && styles.activeIncome]}
          onPress={() => setType('income')}
        >
          <Text
            style={[styles.typeText, type === 'income' && styles.activeText]}
          >
            {t('income')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {t('amount')} ({displayCurrency})
        </Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('accounts')}</Text>
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
            <Text style={{ color: 'red' }}>{t('createAccountFirst')}</Text>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('categories')}</Text>
        <View style={styles.chips}>
          {availableCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                selectedCategory === cat.id && styles.activeChip,
              ]}
              onPress={() => {
                setSelectedCategory(cat.id);
                // Auto-select budget if category matches
                const matchingBudget = budgets.find(
                  (b) => b.categoryId === cat.id,
                );
                if (matchingBudget) {
                  setSelectedBudget(matchingBudget.id);
                }
              }}
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
        <Text style={styles.label}>
          {t('budgets')} ({t('optional')})
        </Text>
        <View style={styles.chips}>
          {budgets.map((bud) => (
            <TouchableOpacity
              key={bud.id}
              style={[
                styles.chip,
                selectedBudget === bud.id && styles.activeChip,
              ]}
              onPress={() =>
                setSelectedBudget(selectedBudget === bud.id ? '' : bud.id)
              }
            >
              <Text
                style={[
                  styles.chipText,
                  selectedBudget === bud.id && styles.activeChipText,
                ]}
              >
                {bud.name}
              </Text>
            </TouchableOpacity>
          ))}
          {budgets.length === 0 && (
            <Text style={{ color: '#888' }}>{t('noBudgets')}</Text>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {t('note')} ({t('optional')})
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder={t('notePlaceholder')}
          value={note}
          onChangeText={setNote}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>
          {isEditing ? t('updateTransaction') : t('saveTransaction')}
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
