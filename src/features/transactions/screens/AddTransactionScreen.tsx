import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  Dimensions,
  TextInput as RNTextInput,
  UIManager,
  Keyboard,
  Modal,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { DatePickerModal } from 'react-native-paper-dates';

if (Platform.OS === 'android') {
  if (
    UIManager.setLayoutAnimationEnabledExperimental &&
    !(global as any).RN$NewArchitecture
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

import {
  TransactionType,
  useStore,
  useTranslation,
  Category,
  Budget,
  Account,
} from '../../../store/useStore';
import { getLocalISOString } from '../../../utils/dateUtils';
import { formatNumber } from '../../../utils/formatters';
import { getValidCategoryIcon } from '../../../constants';

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
    transactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    formatCurrency,
    currency,
  } = useStore();

  const { t, language, translateName } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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

  const availableCategories = useMemo(() => {
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

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

  const [selectedDate, setSelectedDate] = useState<Date>(
    editingTransaction ? new Date(editingTransaction.date) : new Date(),
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Bottom sheets open state
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [targetAccountType, setTargetAccountType] = useState<'from' | 'to'>(
    'from',
  );
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);

  const openAccountSheet = (targetType: 'from' | 'to') => {
    setTargetAccountType(targetType);
    setAccountSheetOpen(true);
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsKeyboardOpen(true);
      },
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsKeyboardOpen(false);
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Budget Suggestion Logic on Category Change
  useEffect(() => {
    if (type === 'expense' && selectedCategory) {
      const matchingBudget = budgets.find(
        (b) => b.categoryId === selectedCategory,
      );
      if (matchingBudget) {
        setSelectedBudget(matchingBudget.id);
      } else {
        setSelectedBudget('');
      }
    } else {
      setSelectedBudget('');
    }
  }, [selectedCategory, type, budgets]);

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
        date: getLocalISOString(selectedDate),
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
        date: getLocalISOString(selectedDate),
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
          if (editingTransaction) {
            deleteTransaction(
              editingTransaction.id,
              editingTransaction.accountId,
              editingTransaction.amount,
              editingTransaction.type,
            );
          }
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

  const onConfirmDate = useCallback((params: { date: Date | undefined }) => {
    setDatePickerOpen(false);
    if (params.date) {
      setSelectedDate(params.date);
    }
  }, []);

  const onDismissDatePicker = useCallback(() => {
    setDatePickerOpen(false);
  }, []);

  const tabColor = useMemo(() => {
    switch (type) {
      case 'expense':
        return theme.colors.error;
      case 'income':
        return (theme.colors as any).income || '#15803D';
      case 'transfer':
        return theme.colors.primary;
    }
  }, [type, theme]);

  const formattedDateText = useMemo(() => {
    const locale = language === 'es' ? es : enUS;
    if (isToday(selectedDate)) {
      return t('today');
    }
    if (isYesterday(selectedDate)) {
      return t('yesterday');
    }
    return format(selectedDate, 'EEEE, MMM d', { locale });
  }, [selectedDate, language, t]);

  const getAccountIcon = (accType?: string) => {
    switch (accType) {
      case 'credit':
        return 'credit-card-outline';
      case 'cash':
        return 'wallet-outline';
      default:
        return 'bank-outline';
    }
  };

  // Helper to compute budget usage spent/progress dynamically
  const getBudgetUsage = useCallback(
    (bud: Budget) => {
      const spent = transactions
        .filter((t) => {
          const matchesBudget = t.budgetId === bud.id;
          const matchesCategory =
            bud.categoryId && t.categoryId === bud.categoryId;
          return (matchesBudget || matchesCategory) && t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);
      const progress = bud.amount > 0 ? Math.min(spent / bud.amount, 1) : 0;
      const remaining = Math.max(bud.amount - spent, 0);
      return { spent, progress, remaining };
    },
    [transactions],
  );

  // Selected entities objects
  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  const selectedAccountObj = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccount);
  }, [accounts, selectedAccount]);

  const selectedToAccountObj = useMemo(() => {
    return accounts.find((a) => a.id === selectedToAccount);
  }, [accounts, selectedToAccount]);

  const selectedBudgetObj = useMemo(() => {
    return budgets.find((b) => b.id === selectedBudget);
  }, [budgets, selectedBudget]);

  const currentBudgetUsage = useMemo(() => {
    if (selectedBudgetObj) {
      return getBudgetUsage(selectedBudgetObj);
    }
    return { spent: 0, progress: 0, remaining: 0 };
  }, [selectedBudgetObj, getBudgetUsage]);

  // Segmented Type Selector Component
  const CustomSegmentedControl = () => {
    const tabWidth = (Dimensions.get('window').width - 32 - 8) / 3;

    const getColors = () => {
      switch (type) {
        case 'expense':
          return {
            bg: theme.dark ? '#3A1E1E' : '#FEE2E2',
            text: theme.colors.error,
          };
        case 'income':
          return {
            bg: theme.dark ? '#1A3324' : '#DCFCE7',
            text: (theme.colors as any).income || '#15803D',
          };
        case 'transfer':
          return {
            bg: theme.dark ? '#1E293B' : '#E0F2FE',
            text: theme.colors.primary,
          };
      }
    };

    const activeColors = getColors();

    const handleSelectType = (newType: TransactionType) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setType(newType);

      const newAvailable = categories.filter((c) => c.type === newType);
      if (newAvailable.length > 0) {
        setSelectedCategory(newAvailable[0].id);
      } else {
        setSelectedCategory('');
      }
    };

    return (
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View
          style={[
            styles.tabIndicator,
            {
              width: tabWidth,
              backgroundColor: activeColors.bg,
              transform: [
                {
                  translateX:
                    type === 'expense'
                      ? 4
                      : type === 'income'
                        ? tabWidth + 4
                        : tabWidth * 2 + 4,
                },
              ],
            },
          ]}
        />

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => handleSelectType('expense')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              type === 'expense' && {
                color: activeColors.text,
                fontWeight: '800',
              },
            ]}
          >
            {t('expense')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => handleSelectType('income')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              type === 'income' && {
                color: activeColors.text,
                fontWeight: '800',
              },
            ]}
          >
            {t('income')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => handleSelectType('transfer')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              type === 'transfer' && {
                color: activeColors.text,
                fontWeight: '800',
              },
            ]}
          >
            {t('transfer')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Reusable Bottom Sheet Modal
  const BottomSheet = ({
    visible,
    onClose,
    title,
    children,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) => {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View style={styles.modalHandleContainer}>
              <View
                style={[
                  styles.modalHandle,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
            </View>

            <View style={styles.modalHeader}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: '800', color: theme.colors.onSurface }}
              >
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <Ionicons
                  name="close"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* 1. Transaction Type Segmented Control */}
        <CustomSegmentedControl />

        {/* 2. Amount Hero Section */}
        <View
          style={[
            styles.amountHeroCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            variant="labelSmall"
            style={[
              styles.amountLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('amount').toUpperCase()}
          </Text>

          <View style={styles.amountInputContainer}>
            {/* Currency Selector Pill */}
            <View
              style={[
                styles.currencyBadge,
                {
                  backgroundColor: theme.dark ? '#1A3324' : '#DCFCE7',
                  borderColor: '#22C55E',
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.currencyText, { color: '#22C55E' }]}>
                {currency}
              </Text>
            </View>

            <View style={styles.amountInputWrapper}>
              <RNTextInput
                value={displayAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={tabColor + '20'}
                style={[styles.amountTextInputCentered, { color: tabColor }]}
                selectionColor={tabColor}
                textAlign="center"
              />
            </View>

            {amount > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setDisplayAmount('');
                  setAmount(0);
                }}
                style={styles.amountClearBtn}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={theme.colors.onSurfaceVariant + '88'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Account Selector */}
        {type !== 'transfer' ? (
          <TouchableOpacity
            style={[
              styles.selectorCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
                borderWidth: 1,
              },
            ]}
            onPress={() => openAccountSheet('from')}
            activeOpacity={0.7}
          >
            <View style={styles.selectorCardLeft}>
              <View
                style={[
                  styles.selectorIconBg,
                  {
                    backgroundColor:
                      selectedAccountObj?.color || theme.colors.primary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={getAccountIcon(selectedAccountObj?.type)}
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={styles.selectorCardTextCol}>
                <Text
                  variant="labelSmall"
                  style={[
                    styles.selectorCardLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {type === 'expense' ? t('withdrawFrom') : t('depositTo')}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.selectorCardValue,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {selectedAccountObj
                    ? translateName(selectedAccountObj.name)
                    : t('selectAccount')}
                </Text>
              </View>
            </View>
            <View style={styles.selectorCardRight}>
              <Text
                variant="titleSmall"
                style={[
                  styles.selectorCardBalance,
                  { color: theme.colors.onSurface },
                ]}
              >
                {selectedAccountObj
                  ? formatCurrency(selectedAccountObj.currentBalance)
                  : ''}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.transferAccountsGroup}>
            {/* From Account */}
            <TouchableOpacity
              style={[
                styles.selectorCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  borderWidth: 1,
                  marginBottom: 12,
                },
              ]}
              onPress={() => openAccountSheet('from')}
              activeOpacity={0.7}
            >
              <View style={styles.selectorCardLeft}>
                <View
                  style={[
                    styles.selectorIconBg,
                    {
                      backgroundColor:
                        selectedAccountObj?.color || theme.colors.primary,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getAccountIcon(selectedAccountObj?.type)}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={styles.selectorCardTextCol}>
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.selectorCardLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('withdrawFrom') || 'From Account'}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.selectorCardValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {selectedAccountObj
                      ? translateName(selectedAccountObj.name)
                      : t('selectAccount')}
                  </Text>
                </View>
              </View>
              <View style={styles.selectorCardRight}>
                <Text
                  variant="titleSmall"
                  style={[
                    styles.selectorCardBalance,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {selectedAccountObj
                    ? formatCurrency(selectedAccountObj.currentBalance)
                    : ''}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </TouchableOpacity>

            {/* To Account */}
            <TouchableOpacity
              style={[
                styles.selectorCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  borderWidth: 1,
                },
              ]}
              onPress={() => openAccountSheet('to')}
              activeOpacity={0.7}
            >
              <View style={styles.selectorCardLeft}>
                <View
                  style={[
                    styles.selectorIconBg,
                    {
                      backgroundColor:
                        selectedToAccountObj?.color || theme.colors.primary,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getAccountIcon(selectedToAccountObj?.type)}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={styles.selectorCardTextCol}>
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.selectorCardLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('depositTo') || 'To Account'}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.selectorCardValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {selectedToAccountObj
                      ? translateName(selectedToAccountObj.name)
                      : t('selectAccount')}
                  </Text>
                </View>
              </View>
              <View style={styles.selectorCardRight}>
                <Text
                  variant="titleSmall"
                  style={[
                    styles.selectorCardBalance,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {selectedToAccountObj
                    ? formatCurrency(selectedToAccountObj.currentBalance)
                    : ''}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. Category Selector (Hidden for Transfers) */}
        {type !== 'transfer' && (
          <TouchableOpacity
            style={[
              styles.selectorCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
                borderWidth: 1,
                marginTop: 16,
              },
            ]}
            onPress={() => setCategorySheetOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectorCardLeft}>
              <View
                style={[
                  styles.selectorIconBg,
                  {
                    backgroundColor:
                      selectedCategoryObj?.color || theme.colors.primary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={getValidCategoryIcon(selectedCategoryObj?.icon) as any}
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={styles.selectorCardTextCol}>
                <Text
                  variant="labelSmall"
                  style={[
                    styles.selectorCardLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('categories') || 'Category'}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.selectorCardValue,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {selectedCategoryObj
                    ? translateName(selectedCategoryObj.name)
                    : t('selectCategory') || 'Select Category'}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}

        {/* 5. Budget Selector (Only for Expense) */}
        {type === 'expense' && budgets.length > 0 && (
          <TouchableOpacity
            style={[
              styles.selectorCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
                borderWidth: 1,
                marginTop: 16,
              },
            ]}
            onPress={() => setBudgetSheetOpen(true)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.budgetCardTop}>
                <View style={styles.selectorCardLeft}>
                  <View
                    style={[
                      styles.selectorIconBg,
                      {
                        backgroundColor:
                          selectedBudgetObj?.color || theme.colors.outline,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        selectedBudgetObj ? 'wallet-outline' : 'slash-forward'
                      }
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.selectorCardTextCol}>
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.selectorCardLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('budgets') || 'Budget'}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.selectorCardValue,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {selectedBudgetObj
                        ? translateName(
                            selectedBudgetObj.name ||
                              categories.find(
                                (c) => c.id === selectedBudgetObj.categoryId,
                              )?.name ||
                              t('budgets'),
                          )
                        : t('noBudget')}
                    </Text>
                  </View>
                </View>
                <View style={styles.selectorCardRight}>
                  {selectedBudgetObj && (
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.budgetUsageText,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {formatCurrency(currentBudgetUsage.spent)} of{' '}
                      {formatCurrency(selectedBudgetObj.amount)}
                    </Text>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>

              {selectedBudgetObj && (
                <View style={styles.budgetProgressContainer}>
                  <View
                    style={[
                      styles.budgetProgressBarBg,
                      { backgroundColor: theme.colors.outlineVariant },
                    ]}
                  >
                    <View
                      style={[
                        styles.budgetProgressBarFill,
                        {
                          backgroundColor:
                            selectedBudgetObj.color || theme.colors.primary,
                          width: `${currentBudgetUsage.progress * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.budgetPercentText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {Math.round(currentBudgetUsage.progress * 100)}%
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* 6. Date & Time (Compact row card) */}
        <TouchableOpacity
          style={[
            styles.compactRowCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
              marginTop: 16,
            },
          ]}
          onPress={() => setDatePickerOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.selectorCardLeft}>
            <View
              style={[
                styles.selectorIconBg,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.selectorCardTextCol}>
              <Text
                variant="labelSmall"
                style={[
                  styles.selectorCardLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('date').toUpperCase()}
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.selectorCardValue,
                  { color: theme.colors.onSurface },
                ]}
              >
                {formattedDateText}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        {/* 7. Notes (Compact input below Date) */}
        <View
          style={[
            styles.notesCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
              marginTop: 12,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={18}
            color={theme.colors.onSurfaceVariant}
            style={{ marginRight: 8 }}
          />
          <RNTextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('notePlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant + '70'}
            style={[styles.notesInput, { color: theme.colors.onSurface }]}
            multiline={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>
      </ScrollView>

      {/* Date picking modal */}
      <DatePickerModal
        locale={language === 'es' ? 'es' : 'en'}
        mode="single"
        visible={datePickerOpen}
        onDismiss={onDismissDatePicker}
        date={selectedDate}
        onConfirm={onConfirmDate}
      />

      {/* Category Bottom Sheet */}
      <BottomSheet
        visible={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        title={t('categories') || 'Select Category'}
      >
        <View style={styles.modalGrid}>
          {availableCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const catColor = cat.color || theme.colors.primary;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.modalGridItem,
                  isSelected && {
                    backgroundColor: theme.dark
                      ? `${catColor}20`
                      : `${catColor}10`,
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  setCategorySheetOpen(false);
                }}
              >
                <View
                  style={[styles.modalGridIcon, { backgroundColor: catColor }]}
                >
                  <MaterialCommunityIcons
                    name={getValidCategoryIcon(cat.icon) as any}
                    size={24}
                    color="#fff"
                  />
                </View>
                <Text
                  variant="labelSmall"
                  style={{
                    fontWeight: isSelected ? '700' : '400',
                    color: theme.colors.onSurface,
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                >
                  {translateName(cat.name)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      {/* Account Bottom Sheet */}
      <BottomSheet
        visible={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
        title={
          targetAccountType === 'from'
            ? t('withdrawFrom') || 'Select Account'
            : t('depositTo') || 'Deposit To Account'
        }
      >
        {accounts
          .filter((acc) => {
            // In transfer mode, exclude selected accounts reciprocally
            if (type === 'transfer') {
              if (targetAccountType === 'from') {
                return acc.id !== selectedToAccount;
              } else {
                return acc.id !== selectedAccount;
              }
            }
            return true;
          })
          .map((acc) => {
            const isSelected =
              targetAccountType === 'from'
                ? selectedAccount === acc.id
                : selectedToAccount === acc.id;
            const accColor = acc.color || theme.colors.primary;
            return (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.modalListItem,
                  { borderColor: theme.colors.outlineVariant },
                  isSelected && {
                    backgroundColor: theme.dark ? '#1A3324' : '#DCFCE7',
                  },
                ]}
                onPress={() => {
                  if (targetAccountType === 'from') {
                    setSelectedAccount(acc.id);
                  } else {
                    setSelectedToAccount(acc.id);
                  }
                  setAccountSheetOpen(false);
                }}
              >
                <View style={styles.modalListItemLeft}>
                  <View
                    style={[
                      styles.selectorIconBg,
                      { backgroundColor: accColor },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getAccountIcon(acc.type)}
                      size={18}
                      color="#fff"
                    />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      variant="bodyMedium"
                      style={{
                        fontWeight: '600',
                        color: theme.colors.onSurface,
                      }}
                    >
                      {translateName(acc.name)}
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {acc.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.modalListItemRight}>
                  <Text
                    variant="bodyMedium"
                    style={{
                      fontWeight: '700',
                      color: theme.colors.onSurface,
                      marginRight: 12,
                    }}
                  >
                    {formatCurrency(acc.currentBalance)}
                  </Text>
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </BottomSheet>

      {/* Budget Bottom Sheet */}
      <BottomSheet
        visible={budgetSheetOpen}
        onClose={() => setBudgetSheetOpen(false)}
        title={t('budgets') || 'Select Budget'}
      >
        {/* No Budget Option */}
        <TouchableOpacity
          style={[
            styles.modalListItem,
            { borderColor: theme.colors.outlineVariant },
            selectedBudget === '' && {
              backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9',
            },
          ]}
          onPress={() => {
            setSelectedBudget('');
            setBudgetSheetOpen(false);
          }}
        >
          <View style={styles.modalListItemLeft}>
            <View
              style={[
                styles.selectorIconBg,
                { backgroundColor: theme.colors.outline },
              ]}
            >
              <MaterialCommunityIcons
                name="slash-forward"
                size={18}
                color="#fff"
              />
            </View>
            <Text
              variant="bodyMedium"
              style={{
                fontWeight: '600',
                color: theme.colors.onSurface,
                marginLeft: 12,
              }}
            >
              {t('noBudget')}
            </Text>
          </View>
          <View
            style={[
              styles.radioOuter,
              {
                borderColor:
                  selectedBudget === ''
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
              },
            ]}
          >
            {selectedBudget === '' && (
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Budgets list */}
        {budgets.map((bud) => {
          const isSelected = selectedBudget === bud.id;
          const budColor = bud.color || theme.colors.primary;
          const usage = getBudgetUsage(bud);
          const cat = categories.find((c) => c.id === bud.categoryId);
          return (
            <TouchableOpacity
              key={bud.id}
              style={[
                styles.modalListItemCol,
                { borderColor: theme.colors.outlineVariant },
                isSelected && {
                  backgroundColor: theme.dark
                    ? `${budColor}15`
                    : `${budColor}08`,
                },
              ]}
              onPress={() => {
                setSelectedBudget(bud.id);
                setBudgetSheetOpen(false);
              }}
            >
              <View style={styles.modalListItemRow}>
                <View style={styles.modalListItemLeft}>
                  <View
                    style={[
                      styles.selectorIconBg,
                      { backgroundColor: budColor },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="wallet-outline"
                      size={18}
                      color="#fff"
                    />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      variant="bodyMedium"
                      style={{
                        fontWeight: '600',
                        color: theme.colors.onSurface,
                      }}
                    >
                      {translateName(bud.name || cat?.name || t('budgets'))}
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {formatCurrency(usage.spent)} of{' '}
                      {formatCurrency(bud.amount)} spent
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
              </View>

              <View
                style={[
                  styles.budgetProgressContainer,
                  { marginTop: 8, paddingHorizontal: 4 },
                ]}
              >
                <View
                  style={[
                    styles.budgetProgressBarBg,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                >
                  <View
                    style={[
                      styles.budgetProgressBarFill,
                      {
                        backgroundColor: budColor,
                        width: `${usage.progress * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  variant="labelSmall"
                  style={[
                    styles.budgetPercentText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {Math.round(usage.progress * 100)}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      {/* Sticky Bottom CTA Container */}
      <View
        style={[
          styles.bottomBarContainer,
          {
            backgroundColor: theme.dark
              ? 'rgba(10, 17, 15, 0.95)'
              : 'rgba(248, 250, 252, 0.95)',
            borderColor: theme.colors.outlineVariant,
            paddingBottom: isKeyboardOpen ? 12 : Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.actionButtonsCol}>
          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text variant="labelLarge" style={styles.primaryActionBtnText}>
              {isEditing ? t('update') : t('saveTransaction')}
            </Text>
          </TouchableOpacity>

          {/* Secondary Action Row in Edit Mode (Hidden when keyboard is open) */}
          {isEditing && !isKeyboardOpen && (
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  {
                    borderColor: theme.colors.outlineVariant,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                onPress={handleDuplicate}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="content-copy"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  variant="labelMedium"
                  style={[
                    styles.secondaryActionBtnText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {t('duplicate')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  {
                    borderColor: theme.colors.outlineVariant,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={16}
                  color={theme.colors.error}
                />
                <Text
                  variant="labelMedium"
                  style={[
                    styles.secondaryActionBtnText,
                    { color: theme.colors.error },
                  ]}
                >
                  {t('delete')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // 1. Transaction Type Segmented Control
  tabContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    padding: 4,
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  tabIndicator: {
    position: 'absolute',
    height: 40,
    borderRadius: 20,
    top: 4,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A9A9D',
  },

  // 2. Amount Hero Section
  amountHeroCard: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  amountLabel: {
    fontWeight: '700',
    letterSpacing: 1.2,
    fontSize: 10,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    paddingHorizontal: 12,
  },
  currencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '800',
  },
  amountInputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  amountTextInputCentered: {
    fontSize: 36,
    fontWeight: '900',
    padding: 0,
    letterSpacing: -0.5,
  },
  amountClearBtn: {
    padding: 4,
    position: 'absolute',
    right: 0,
  },
  quickChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Interactive Selector Cards
  selectorCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  selectorCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorCardTextCol: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  selectorCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  selectorCardValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  selectorCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorCardBalance: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 8,
  },

  // Transfer mode accounts stacking
  transferAccountsGroup: {
    marginTop: 8,
  },

  // Budget details
  budgetCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  budgetUsageText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  budgetProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  budgetProgressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetPercentText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 10,
    width: 32,
    textAlign: 'right',
  },

  // Compact Row card (Date)
  compactRowCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },

  // Notes
  notesCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  notesInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    fontWeight: '500',
  },

  // Modal bottom sheets
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  modalHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
  },
  modalGridItem: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 8,
  },
  modalGridIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  modalListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalListItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalListItemCol: {
    flexDirection: 'column',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  modalListItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  // Sticky bottom action buttons
  bottomBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  actionButtonsCol: {
    flexDirection: 'column',
    gap: 8,
  },
  primaryActionBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  primaryActionBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
