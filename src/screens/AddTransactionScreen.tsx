import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  SegmentedButtons,
  Text,
  TextInput,
  Tooltip,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionType, useStore, useTranslation } from '../store/useStore';
import { formatNumber } from '../utils/formatters';
import { getLocalISOString } from '../utils/dateUtils';

export const AddTransactionScreen = () => {
  const params = useLocalSearchParams<{
    transaction?: string;
    isEditing?: string;
    accountId?: string;
  }>();

  const editingTransaction = useMemo(() => {
    if (params.transaction) {
      try {
        return JSON.parse(params.transaction);
      } catch {
        return null;
      }
    }
    return null;
  }, [params.transaction]);

  const isEditing = params.isEditing === 'true';

  const {
    accounts,
    categories,
    budgets,
    addTransaction,
    editTransaction,
    deleteTransaction,
    formatCurrency,
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
    editingTransaction?.accountId || params.accountId || accounts[0]?.id || '',
  );

  const availableCategories = categories.filter((c) => c.type === type);
  const [selectedCategory, setSelectedCategory] = useState(
    editingTransaction?.categoryId || availableCategories[0]?.id || '',
  );
  const [selectedBudget, setSelectedBudget] = useState<string>(
    editingTransaction?.budgetId ?? '',
  );
  const [selectedToAccount, setSelectedToAccount] = useState(
    editingTransaction?.toAccountId ||
      accounts.find((a) => a.id !== selectedAccount)?.id ||
      '',
  );

  const activeAccount = accounts.find((acc) => acc.id === selectedAccount);

  const handleSave = () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }
    if (!selectedAccount) {
      Alert.alert(t('error'), t('selectAccount'));
      return;
    }
    if (type === 'transfer' && !selectedToAccount) {
      Alert.alert(t('error'), t('selectToAccount'));
      return;
    }
    if (type === 'transfer' && selectedAccount === selectedToAccount) {
      Alert.alert(t('error'), t('selectDifferentAccountForTransfer'));
      return;
    }

    if (isEditing && editingTransaction) {
      editTransaction({
        id: editingTransaction.id,
        type,
        amount,
        categoryId: type === 'transfer' ? null : selectedCategory || null,
        accountId: selectedAccount,
        budgetId: type === 'transfer' ? null : selectedBudget || null,
        date: editingTransaction.date,
        note,
        toAccountId: type === 'transfer' ? selectedToAccount : null,
      });
    } else {
      addTransaction({
        id: Date.now().toString(),
        type,
        amount,
        categoryId: type === 'transfer' ? null : selectedCategory || null,
        accountId: selectedAccount,
        budgetId: type === 'transfer' ? null : selectedBudget || null,
        date: getLocalISOString(),
        note,
        toAccountId: type === 'transfer' ? selectedToAccount : null,
      });
    }

    router.back();
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
          router.back();
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
      categoryId: type === 'transfer' ? null : selectedCategory || null,
      accountId: selectedAccount,
      budgetId: type === 'transfer' ? null : selectedBudget || null,
      date: getLocalISOString(),
      note: note ? `${note} (${t('duplicate')})` : t('duplicate'),
      toAccountId: type === 'transfer' ? selectedToAccount : null,
    });

    router.back();
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
              {
                value: 'transfer',
                label: t('transfer'),
                checkedColor: theme.colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text variant="labelLarge" style={styles.amountLabel}>
            {t('amount')}
          </Text>
          <TextInput
            value={displayAmount}
            onChangeText={handleAmountChange}
            mode="flat"
            keyboardType="numeric"
            style={styles.amountInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            placeholder="0"
            left={
              <TextInput.Affix
                text={displayCurrency + ' '}
                textStyle={styles.amountAffix}
              />
            }
            contentStyle={styles.amountInputContent}
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
            {type === 'expense'
              ? t('withdrawFrom')
              : type === 'transfer'
                ? t('withdrawFrom')
                : t('depositTo')}
          </Text>
          <View style={styles.chipsRow}>
            {accounts.map((acc) => (
              <Chip
                key={acc.id}
                selected={selectedAccount === acc.id}
                onPress={() => setSelectedAccount(acc.id)}
                style={[
                  styles.chip,
                  selectedAccount === acc.id && {
                    backgroundColor: acc.color || theme.colors.primary,
                  },
                ]}
                mode="flat"
                selectedColor={
                  selectedAccount === acc.id
                    ? '#FFFFFF'
                    : acc.color || theme.colors.primary
                }
                textStyle={styles.chipText}
              >
                {`${translateName(acc.name)}`}
              </Chip>
            ))}
          </View>
        </View>

        {type === 'transfer' && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('depositTo')}
            </Text>
            <View style={styles.chipsRow}>
              {accounts.map((acc) => (
                <Chip
                  key={acc.id}
                  selected={selectedToAccount === acc.id}
                  disabled={selectedAccount === acc.id}
                  onPress={() => setSelectedToAccount(acc.id)}
                  style={[
                    styles.chip,
                    selectedToAccount === acc.id && {
                      backgroundColor: acc.color || theme.colors.primary,
                    },
                  ]}
                  mode="flat"
                  selectedColor={
                    selectedToAccount === acc.id
                      ? '#FFFFFF'
                      : acc.color || theme.colors.primary
                  }
                  textStyle={styles.chipText}
                >
                  {`${translateName(acc.name)}`}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {type !== 'transfer' && (
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
                  style={[
                    styles.chip,
                    selectedCategory === cat.id && {
                      backgroundColor: cat.color || theme.colors.primary,
                    },
                  ]}
                  mode="flat"
                  selectedColor={
                    selectedCategory === cat.id
                      ? '#FFFFFF'
                      : cat.color || theme.colors.primary
                  }
                  textStyle={styles.chipText}
                >
                  {translateName(cat.name)}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {type !== 'transfer' && budgets.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('budgets')}
            </Text>
            <View style={styles.chipsRow}>
              {budgets.map((bud) => {
                const budColor =
                  bud.color ||
                  categories.find((c) => c.id === bud.categoryId)?.color ||
                  theme.colors.primary;
                return (
                  <Chip
                    key={bud.id}
                    selected={selectedBudget === bud.id}
                    onPress={() =>
                      setSelectedBudget(selectedBudget === bud.id ? '' : bud.id)
                    }
                    style={[
                      styles.chip,
                      selectedBudget === bud.id && {
                        backgroundColor: budColor,
                      },
                    ]}
                    mode="flat"
                    selectedColor={
                      selectedBudget === bud.id ? '#FFFFFF' : budColor
                    }
                    textStyle={styles.chipText}
                  >
                    {translateName(
                      categories.find((c) => c.id === bud.categoryId)?.name ||
                        t('budgets'),
                    )}
                  </Chip>
                );
              })}
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
              contentStyle={styles.actionBtnContent}
              icon="content-copy"
            >
              {t('duplicate')}
            </Button>
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  segmentedContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 32,
  },
  amountLabel: {
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: 'transparent',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 24,
    height: 80,
  },
  amountInputContent: {
    fontWeight: '900',
    paddingLeft: 0,
  },
  amountAffix: {
    fontSize: 24,
    fontWeight: '700',
    opacity: 0.5,
  },
  input: {
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: 16,
    borderWidth: 1.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 14,
    opacity: 0.6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    borderRadius: 16,
    marginTop: 16,
    elevation: 0,
  },
  saveBtnContent: {
    height: 64,
  },
  saveBtnLabel: {
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  actionBtnContent: {
    height: 56,
  },
});
