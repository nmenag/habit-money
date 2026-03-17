import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Chip,
  IconButton,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionType, useStore, useTranslation } from '../store/useStore';
import { formatNumber } from '../utils/formatters';

export const AddTransactionScreen = ({ route, navigation }: any) => {
  const editingTransaction = route.params?.transaction;
  const isEditing = !!route.params?.isEditing;

  const {
    accounts,
    categories,
    budgets,
    addTransaction,
    editTransaction,
    deleteTransaction,
  } = useStore();
  const { t, language, translateName } = useTranslation();
  const theme = useTheme();

  const [type, setType] = useState<TransactionType>(
    editingTransaction?.type || 'expense',
  );
  const [displayAmount, setDisplayAmount] = useState(
    editingTransaction
      ? formatNumber(Math.abs(editingTransaction.amount), language)
      : '',
  );
  const [amount, setAmount] = useState(
    editingTransaction ? Math.abs(editingTransaction.amount) : 0,
  );
  const [note, setNote] = useState(editingTransaction?.note || '');
  const [selectedAccount, setSelectedAccount] = useState(
    editingTransaction?.accountId ||
      route.params?.accountId ||
      accounts[0]?.id ||
      '',
  );

  const availableCategories = categories.filter((c) => c.type === type);
  const [selectedCategory, setSelectedCategory] = useState(
    editingTransaction?.categoryId || availableCategories[0]?.id || '',
  );
  const [selectedBudget, setSelectedBudget] = useState<string>(
    editingTransaction?.budgetId ?? '',
  );

  const handleSave = () => {
    if (!amount || isNaN(amount) || amount <= 0) {
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
        amount,
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
        amount,
        categoryId: selectedCategory || null,
        accountId: selectedAccount,
        budgetId: selectedBudget || null,
        date: new Date().toISOString(),
        note,
      });
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(t('confirmDelete'), t('confirmDeleteTx'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          deleteTransaction(
            editingTransaction.id,
            editingTransaction.accountId,
            editingTransaction.amount,
            editingTransaction.type,
          );
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDuplicate = () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }
    if (!selectedAccount) {
      Alert.alert(t('error'), t('selectAccount'));
      return;
    }

    addTransaction({
      id: Date.now().toString(),
      type,
      amount,
      categoryId: selectedCategory || null,
      accountId: selectedAccount,
      budgetId: selectedBudget || null,
      date: new Date().toISOString(),
      note: note ? `${note} (${t('duplicate')})` : t('duplicate'),
    });

    navigation.goBack();
  };

  const handleAmountChange = (text: string) => {
    const onlyDigits = text.replace(/\D/g, '');
    if (onlyDigits === '') {
      setDisplayAmount('');
      setAmount(0);
      return;
    }
    const num = parseInt(onlyDigits, 10);
    setAmount(num);
    const separator = language === 'es' ? '.' : ',';
    const formatted = onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    setDisplayAmount(formatted);
  };

  const insets = useSafeAreaInsets();
  const activeAccount = accounts.find((acc) => acc.id === selectedAccount);
  const displayCurrency = activeAccount?.currency || 'COP';

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
      >
        <View style={styles.segmentedContainer}>
          <SegmentedButtons
            value={type}
            onValueChange={(v) => {
              setType(v as TransactionType);
              // Reset category if not valid for new type
              const newAvailable = categories.filter(
                (c) => c.type === (v as any),
              );
              if (newAvailable.length > 0) {
                setSelectedCategory(newAvailable[0].id);
              }
            }}
            buttons={[
              {
                value: 'expense',
                label: t('expense'),
                checkedColor: theme.colors.error,
              },
              { value: 'income', label: t('income'), checkedColor: '#4caf50' },
            ]}
          />
        </View>

        <View style={styles.inputGroup}>
            <TextInput
              label={t('amount')}
              value={displayAmount}
              onChangeText={handleAmountChange}
              mode="outlined"
              keyboardType="numeric"
              style={styles.amountInput}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Affix text={displayCurrency + ' '} />}
            />

            <TextInput
              label={t('note') + ' (' + t('optional') + ')'}
              value={note}
              onChangeText={setNote}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              placeholder={t('notePlaceholder')}
            />
          </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('accounts')}
          </Text>
          <View style={styles.chipsRow}>
            {accounts.map((acc) => (
              <Chip
                key={acc.id}
                selected={selectedAccount === acc.id}
                onPress={() => setSelectedAccount(acc.id)}
                style={styles.chip}
                mode="flat"
                selectedColor={theme.colors.primary}
              >
                {translateName(acc.name)}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('categories')}
          </Text>
          <View style={styles.chipsRow}>
            {availableCategories.map((cat) => (
              <Chip
                key={cat.id}
                selected={selectedCategory === cat.id}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  const matchingBudget = budgets.find(
                    (b) => b.categoryId === cat.id,
                  );
                  if (matchingBudget) setSelectedBudget(matchingBudget.id);
                }}
                style={styles.chip}
                mode="flat"
                selectedColor={cat.color || undefined}
              >
                {translateName(cat.name)}
              </Chip>
            ))}
          </View>
        </View>

        {budgets.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('budgets')}
            </Text>
            <View style={styles.chipsRow}>
              {budgets.map((bud) => (
                <Chip
                  key={bud.id}
                  selected={selectedBudget === bud.id}
                  onPress={() =>
                    setSelectedBudget(selectedBudget === bud.id ? '' : bud.id)
                  }
                  style={styles.chip}
                  mode="flat"
                >
                  {translateName(
                    categories.find((c) => c.id === bud.categoryId)?.name ||
                      t('budgets'),
                  )}
                </Chip>
              ))}
            </View>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
          labelStyle={styles.saveBtnLabel}
        >
          {isEditing ? t('updateTransaction') : t('saveTransaction')}
        </Button>

        {isEditing && (
          <View style={styles.editActions}>
            <Button
              mode="outlined"
              onPress={handleDuplicate}
              style={styles.actionBtn}
              icon="content-copy"
            >
              {t('duplicate')}
            </Button>
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.actionBtn}
              textColor={theme.colors.error}
              icon="trash-can"
            >
              {t('delete')}
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  segmentedContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  amountInput: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  input: {
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 12,
  },
  saveBtn: {
    borderRadius: 20,
    marginTop: 32,
    elevation: 2,
  },
  saveBtnContent: {
    height: 56,
  },
  saveBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
  },
});
