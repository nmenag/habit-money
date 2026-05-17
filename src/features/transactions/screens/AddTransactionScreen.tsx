import { router, useLocalSearchParams, Stack } from 'expo-router';
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  useWindowDimensions,
  TextInput as RNTextInput,
  Keyboard,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { DatePickerModal } from 'react-native-paper-dates';

import {
  TransactionType,
  useStore,
  useTranslation,
  Budget,
} from '../../../store/useStore';
import { getLocalISOString } from '../../../utils/dateUtils';
import { formatNumber } from '../../../utils/formatters';
import { getValidCategoryIcon } from '../../../constants';
import { BottomSheet } from '../../../shared/components';
import { ExpenseFormFields } from '../components/ExpenseFormFields';
import { IncomeFormFields } from '../components/IncomeFormFields';
import { TransferFormFields } from '../components/TransferFormFields';

export const AddTransactionScreen = () => {
  const { width } = useWindowDimensions();
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
  const [amount, setAmount] = useState(
    editingTransaction ? Math.abs(editingTransaction.amount) : 0,
  );
  const [displayAmount, setDisplayAmount] = useState(() => {
    if (!editingTransaction) return '';
    const absVal = Math.abs(editingTransaction.amount);
    const isDecimal = currency !== 'COP' && currency !== 'CLP';
    if (!isDecimal) {
      return formatNumber(absVal, language);
    } else {
      const decimalSep = language === 'es' ? ',' : '.';
      const thousandSep = language === 'es' ? '.' : ',';
      const parts = absVal.toString().split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1] ? parts[1].substring(0, 2) : '';
      const formattedInt = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        thousandSep,
      );
      return decimalPart
        ? formattedInt + decimalSep + decimalPart
        : formattedInt;
    }
  });
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

  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [targetAccountType, setTargetAccountType] = useState<'from' | 'to'>(
    'from',
  );
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

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

  const handleNoteFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const activeColors = useMemo(() => {
    switch (type) {
      case 'expense':
        return {
          bg: theme.dark ? '#2A1818' : '#FFF5F5',
          border: theme.dark ? '#5E2727' : '#FEE2E2',
          badgeBg: theme.dark ? '#3A1E1E' : '#FEE2E2',
          text: theme.colors.error,
          badgeText: theme.colors.error,
        };
      case 'income':
        return {
          bg: theme.dark ? '#0E1F15' : '#F0FDF4',
          border: theme.dark ? '#1E462E' : '#DCFCE7',
          badgeBg: theme.dark ? '#1A3324' : '#DCFCE7',
          text: (theme.colors as any).income || '#15803D',
          badgeText: (theme.colors as any).income || '#15803D',
        };
      case 'transfer':
        return {
          bg: theme.dark ? '#0F1E2E' : '#F0F9FF',
          border: theme.dark ? '#1E3A5F' : '#E0F2FE',
          badgeBg: theme.dark ? '#1E293B' : '#E0F2FE',
          text: theme.colors.primary,
          badgeText: theme.colors.primary,
        };
    }
  }, [type, theme]);

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

  const formatAmountInput = useCallback(
    (text: string, isDecimal: boolean) => {
      const thousandSep = language === 'es' ? '.' : ',';
      const decimalSep = language === 'es' ? ',' : '.';

      if (!isDecimal) {
        const onlyDigits = text.replace(/\D/g, '');
        if (onlyDigits === '') return '';
        return onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
      } else {
        const cleanText = text.replace(/[^0-9.,]/g, '');
        if (cleanText === '') return '';

        let firstSepIdx = cleanText.indexOf('.');
        if (firstSepIdx === -1) {
          firstSepIdx = cleanText.indexOf(',');
        }

        if (firstSepIdx === -1) {
          return cleanText.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
        } else {
          const integerPart = cleanText
            .substring(0, firstSepIdx)
            .replace(/\D/g, '');
          const decimalPart = cleanText
            .substring(firstSepIdx + 1)
            .replace(/\D/g, '')
            .substring(0, 2);

          const formattedInt = integerPart.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            thousandSep,
          );
          return formattedInt + decimalSep + decimalPart;
        }
      }
    },
    [language],
  );

  const parseAmountText = useCallback(
    (formattedText: string, isDecimal: boolean) => {
      if (formattedText === '') return 0;
      if (!isDecimal) {
        const clean = formattedText.replace(/\D/g, '');
        return clean === '' ? 0 : parseInt(clean, 10);
      } else {
        const thousandSep = language === 'es' ? '.' : ',';
        const decimalSep = language === 'es' ? ',' : '.';

        let clean = formattedText.split(thousandSep).join('');
        clean = clean.replace(decimalSep, '.');

        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
      }
    },
    [language],
  );

  const handleAmountChange = (text: string) => {
    const isDecimal = currency !== 'COP' && currency !== 'CLP';
    const formatted = formatAmountInput(text, isDecimal);

    if (formatted === '') {
      setDisplayAmount('');
      setAmount(0);
      return;
    }

    setDisplayAmount(formatted);
    setAmount(parseAmountText(formatted, isDecimal));
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

  const CustomSegmentedControl = () => {
    const containerWidth = Math.min(width, 600);
    const tabWidth = (containerWidth - 32 - 8) / 3;

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: isEditing ? t('editTransaction') : t('addTransaction'),
          headerRight: () =>
            isEditing ? (
              <TouchableOpacity
                onPress={() => setMenuOpen(true)}
                style={{ padding: 8, marginRight: -8 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={22}
                  color={theme.colors.onSurface}
                />
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 24,
            maxWidth: 600,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <CustomSegmentedControl />

        <View
          style={[
            styles.amountHeroCard,
            {
              backgroundColor: activeColors.bg,
              borderColor: activeColors.border,
              borderWidth: 1.5,
              paddingVertical: isKeyboardOpen ? 8 : 16,
              marginBottom: isKeyboardOpen ? 8 : 16,
            },
          ]}
        >
          <Text
            variant="labelSmall"
            style={[
              styles.amountLabel,
              {
                color: activeColors.text,
                opacity: 0.8,
                marginBottom: isKeyboardOpen ? 4 : 8,
              },
            ]}
          >
            {t('amount').toUpperCase()}
          </Text>

          <View style={styles.amountInputContainer}>
            <View
              style={[
                styles.currencyBadge,
                {
                  backgroundColor: activeColors.badgeBg,
                  borderColor: activeColors.text,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.currencyText, { color: activeColors.text }]}>
                {currency}
              </Text>
            </View>

            <View style={styles.amountInputWrapper}>
              <RNTextInput
                value={displayAmount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                placeholder={isAmountFocused ? '' : '0'}
                placeholderTextColor={theme.colors.outlineVariant}
                style={[
                  styles.amountTextInputCentered,
                  {
                    color: activeColors.text,
                    fontSize: isKeyboardOpen ? 26 : 36,
                  },
                ]}
                selectionColor={activeColors.text}
                textAlign="center"
                onFocus={() => setIsAmountFocused(true)}
                onBlur={() => setIsAmountFocused(false)}
              />
            </View>

            <View style={styles.spacer} />

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
                  color={activeColors.text + '88'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {type === 'expense' && (
          <ExpenseFormFields
            theme={theme}
            styles={styles}
            t={t}
            translateName={translateName}
            formatCurrency={formatCurrency}
            getAccountIcon={getAccountIcon}
            selectedAccountObj={selectedAccountObj}
            openAccountSheet={openAccountSheet}
            selectedCategoryObj={selectedCategoryObj}
            setCategorySheetOpen={setCategorySheetOpen}
            selectedBudgetObj={selectedBudgetObj}
            setBudgetSheetOpen={setBudgetSheetOpen}
            budgets={budgets}
            categories={categories}
            currentBudgetUsage={currentBudgetUsage}
          />
        )}

        {type === 'income' && (
          <IncomeFormFields
            theme={theme}
            styles={styles}
            t={t}
            translateName={translateName}
            formatCurrency={formatCurrency}
            getAccountIcon={getAccountIcon}
            selectedAccountObj={selectedAccountObj}
            openAccountSheet={openAccountSheet}
            selectedCategoryObj={selectedCategoryObj}
            setCategorySheetOpen={setCategorySheetOpen}
          />
        )}

        {type === 'transfer' && (
          <TransferFormFields
            theme={theme}
            styles={styles}
            t={t}
            translateName={translateName}
            formatCurrency={formatCurrency}
            getAccountIcon={getAccountIcon}
            selectedAccountObj={selectedAccountObj}
            selectedToAccountObj={selectedToAccountObj}
            openAccountSheet={openAccountSheet}
          />
        )}

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
            placeholder={t('notePlaceholder') || 'Add a note...'}
            placeholderTextColor={theme.colors.onSurfaceVariant + '70'}
            style={[
              styles.notesInput,
              { color: theme.colors.onSurface, maxHeight: 100 },
            ]}
            multiline={true}
            numberOfLines={1}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={Keyboard.dismiss}
            onFocus={handleNoteFocus}
          />
        </View>
      </ScrollView>

      <DatePickerModal
        locale={language === 'es' ? 'es' : 'en'}
        mode="single"
        visible={datePickerOpen}
        onDismiss={onDismissDatePicker}
        date={selectedDate}
        onConfirm={onConfirmDate}
      />

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

      <BottomSheet
        visible={budgetSheetOpen}
        onClose={() => setBudgetSheetOpen(false)}
        title={t('budgets') || 'Select Budget'}
      >
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

      <BottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('transactionOptions') || 'Transaction Options'}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              handleDuplicate();
            }}
          >
            <Ionicons
              name="duplicate-outline"
              size={22}
              color={theme.colors.primary}
              style={{ marginRight: 16 }}
            />
            <Text
              variant="bodyLarge"
              style={[styles.menuItemText, { color: theme.colors.onSurface }]}
            >
              {t('duplicate')}
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.menuDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              handleDelete();
            }}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={theme.colors.error}
              style={{ marginRight: 16 }}
            />
            <Text
              variant="bodyLarge"
              style={[styles.menuItemText, { color: theme.colors.error }]}
            >
              {t('delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <View
        style={[
          styles.bottomBarContainer,
          {
            backgroundColor: theme.dark
              ? 'rgba(10, 17, 15, 0.95)'
              : 'rgba(248, 250, 252, 0.95)',
            borderColor: theme.colors.outlineVariant,
            paddingBottom: isKeyboardOpen
              ? 12
              : Math.max(insets.bottom + 24, 48),
            maxWidth: 600,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
      >
        <View style={styles.actionButtonsCol}>
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
    width: 56,
    height: 32,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '800',
  },
  amountInputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  spacer: {
    width: 56,
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
    right: 12,
  },
  quickChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
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

  transferAccountsGroup: {
    marginTop: 8,
  },

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
  menuContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginVertical: 2,
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontWeight: '600',
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.6,
  },
});
