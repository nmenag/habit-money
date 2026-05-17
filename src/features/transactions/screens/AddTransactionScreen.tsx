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
  Image,
  Dimensions,
  TextInput as RNTextInput,
  UIManager,
  Keyboard,
} from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { DatePickerModal } from 'react-native-paper-dates';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

import {
  TransactionType,
  useStore,
  useTranslation,
  Category,
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
        return (theme.colors as any).income || '#4CAF50';
      case 'transfer':
        return theme.colors.primary;
    }
  }, [type, theme]);

  const formattedDateText = useMemo(() => {
    const locale = language === 'es' ? es : enUS;
    if (isToday(selectedDate)) {
      return language === 'es' ? 'Hoy' : 'Today';
    }
    if (isYesterday(selectedDate)) {
      return language === 'es' ? 'Ayer' : 'Yesterday';
    }
    return format(selectedDate, 'EEEE, MMM d', { locale });
  }, [selectedDate, language]);

  // Custom Animated Segmented Control
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
            text: (theme.colors as any).income || '#4CAF50',
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

  // Smart Account Carousel Selector
  const AccountSelector = ({
    selected,
    onSelect,
    excludeId,
    label,
  }: {
    selected: string;
    onSelect: (id: string) => void;
    excludeId?: string;
    label: string;
  }) => {
    const filteredAccounts = accounts.filter((a) => a.id !== excludeId);

    return (
      <View style={styles.section}>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
        >
          {label}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.accountScroll}
        >
          {filteredAccounts.map((acc) => {
            const isSelected = selected === acc.id;
            const accColor = acc.color || theme.colors.primary;

            const getAccIcon = () => {
              switch (acc.type) {
                case 'credit':
                  return 'credit-card-outline';
                case 'cash':
                  return 'wallet-outline';
                default:
                  return 'bank-outline';
              }
            };

            return (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: isSelected
                      ? theme.dark
                        ? `${accColor}22`
                        : `${accColor}11`
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? accColor
                      : theme.colors.outlineVariant,
                    borderWidth: isSelected ? 2 : 1,
                    // Dynamically disable native shadows on selected cards to prevent muddy/weird black shadow leakage through translucent colors
                    elevation: isSelected ? 0 : 1,
                    shadowOpacity: isSelected ? 0 : 0.05,
                  },
                ]}
                onPress={() => onSelect(acc.id)}
                activeOpacity={0.8}
              >
                <View style={styles.accountCardHeader}>
                  <View
                    style={[
                      styles.accountIconBg,
                      {
                        backgroundColor: isSelected
                          ? accColor
                          : theme.colors.surfaceVariant,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getAccIcon()}
                      size={16}
                      color={
                        isSelected
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                    />
                  </View>
                  {isSelected && (
                    <View
                      style={[
                        styles.checkmarkBadge,
                        { backgroundColor: accColor },
                      ]}
                    >
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </View>
                <View style={styles.accountCardFooter}>
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.accountCardName,
                      {
                        color: isSelected
                          ? theme.colors.onSurface
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {translateName(acc.name)}
                  </Text>
                  <Text
                    variant="titleSmall"
                    style={[
                      styles.accountCardBalance,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {formatCurrency(acc.currentBalance)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Modern Category Grid
  const CategoryGrid = () => {
    const handleSelectCategory = (catId: string) => {
      setSelectedCategory(catId);
      const matchingBudget = budgets.find((b) => b.categoryId === catId);
      if (matchingBudget) setSelectedBudget(matchingBudget.id);
    };

    const renderCategoryItem = (cat: Category) => {
      const isSelected = selectedCategory === cat.id;
      const catColor = cat.color || theme.colors.primary;
      const iconName = getValidCategoryIcon(cat.icon);

      return (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.categoryItem,
            isSelected && [
              styles.categoryItemActive,
              {
                backgroundColor: theme.dark ? `${catColor}15` : `${catColor}08`,
              },
            ],
          ]}
          onPress={() => handleSelectCategory(cat.id)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.categoryIconOuter,
              isSelected && {
                borderColor: catColor,
              },
            ]}
          >
            <View
              style={[styles.categoryIconInner, { backgroundColor: catColor }]}
            >
              <MaterialCommunityIcons
                name={iconName as any}
                size={22}
                color="#fff"
              />
            </View>
          </View>
          <Text
            variant="labelSmall"
            style={[
              styles.categoryLabel,
              isSelected
                ? { color: theme.colors.onSurface, fontWeight: '700' }
                : { color: theme.colors.onSurfaceVariant },
            ]}
            numberOfLines={1}
          >
            {translateName(cat.name)}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            {t('categories')}
          </Text>
        </View>

        <View style={styles.categoryGridRow}>
          {availableCategories.map(renderCategoryItem)}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isKeyboardOpen ? 100 : 160 }, // Dynamically adjust padding bottom to maximize visibility when keyboard is open and avoid button overlap
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <CustomSegmentedControl />

        {/* Amount center card panel */}
        <View
          style={[
            styles.amountCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.amountHeader}>
            <Text variant="bodySmall" style={styles.amountLabel}>
              {language === 'es' ? 'MONTO' : 'AMOUNT'}
            </Text>
          </View>

          <View style={styles.amountInputRow}>
            <Text style={[styles.currencySymbol, { color: tabColor }]}>
              {currency}
            </Text>
            <RNTextInput
              value={displayAmount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={tabColor + '30'}
              style={[styles.amountTextInput, { color: tabColor }]}
              selectionColor={tabColor}
            />
            {amount > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setDisplayAmount('');
                  setAmount(0);
                }}
                style={styles.clearBtn}
              >
                <Ionicons
                  name="close-circle"
                  size={22}
                  color={theme.colors.onSurfaceVariant + 'aa'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Smart account cards */}
        <AccountSelector
          selected={selectedAccount}
          onSelect={setSelectedAccount}
          label={
            type === 'expense'
              ? t('withdrawFrom')
              : type === 'transfer'
                ? t('withdrawFrom')
                : t('depositTo')
          }
        />

        {type === 'transfer' && (
          <AccountSelector
            selected={selectedToAccount}
            onSelect={setSelectedToAccount}
            excludeId={selectedAccount}
            label={t('depositTo')}
          />
        )}

        {/* Categories picker grid */}
        {type !== 'transfer' && <CategoryGrid />}

        {/* Budgets picker if any */}
        {type !== 'transfer' && budgets.length > 0 && (
          <View style={styles.section}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t('budgets')}
            </Text>
            <View style={styles.chipsRow}>
              {budgets.map((bud) => {
                const isSelected = selectedBudget === bud.id;
                const budColor =
                  bud.color ||
                  categories.find((c) => c.id === bud.categoryId)?.color ||
                  theme.colors.primary;

                return (
                  <TouchableOpacity
                    key={bud.id}
                    style={[
                      styles.budgetChip,
                      {
                        backgroundColor: isSelected
                          ? theme.dark
                            ? `${budColor}25`
                            : `${budColor}15`
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? budColor
                          : theme.colors.outlineVariant,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() =>
                      setSelectedBudget(selectedBudget === bud.id ? '' : bud.id)
                    }
                    activeOpacity={0.8}
                  >
                    <View
                      style={[styles.budgetDot, { backgroundColor: budColor }]}
                    />
                    <Text
                      variant="labelMedium"
                      style={[
                        styles.budgetLabel,
                        isSelected
                          ? { color: theme.colors.onSurface, fontWeight: '700' }
                          : { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {translateName(
                        categories.find((c) => c.id === bud.categoryId)?.name ||
                          t('budgets'),
                      )}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Unified details panel (Notes, Date) */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            variant="titleMedium"
            style={[styles.detailsTitle, { color: theme.colors.onSurface }]}
          >
            {language === 'es' ? 'Detalles Adicionales' : 'Additional Details'}
          </Text>

          <View
            style={[
              styles.notesContainer,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.outlineVariant,
                borderWidth: 1,
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

          <TouchableOpacity
            style={[
              styles.detailPill,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.outlineVariant,
                borderWidth: 1,
                height: 44,
              },
            ]}
            onPress={() => setDatePickerOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={theme.colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              variant="bodyMedium"
              style={{ fontWeight: '600', color: theme.colors.onSurface }}
            >
              {language === 'es'
                ? `Fecha: ${formattedDateText}`
                : `Date: ${formattedDateText}`}
            </Text>
          </TouchableOpacity>
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

      {/* Fixed Sticky Action CTA Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            bottom: isKeyboardOpen ? 12 : Math.max(insets.bottom, 16),
          },
        ]}
      >
        {isEditing && !isKeyboardOpen ? (
          <View style={styles.editActionsBar}>
            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                {
                  borderColor: theme.colors.outlineVariant,
                  marginRight: 8,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={handleDuplicate}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={20}
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
                  marginRight: 8,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
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

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                { backgroundColor: theme.colors.primary, flex: 2 },
              ]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text variant="labelLarge" style={styles.primaryActionBtnText}>
                {t('update')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text variant="labelLarge" style={styles.primaryActionBtnText}>
              {isEditing ? t('update') : t('saveTransaction')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },

  // Type Segments
  tabContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    padding: 4,
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
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

  // Amount Input
  amountCard: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  amountLabel: {
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#8A9A9D',
    fontSize: 9,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 0,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  amountTextInput: {
    fontSize: 26,
    fontWeight: '800',
    flex: 1,
    padding: 0,
  },
  clearBtn: {
    padding: 2,
  },

  // Accounts Carousel
  accountScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  accountCard: {
    width: 145,
    height: 90,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCardFooter: {
    justifyContent: 'flex-end',
  },
  accountCardName: {
    fontSize: 11,
    fontWeight: '600',
  },
  accountCardBalance: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },


  // Categories Picker Grid
  categoryGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  categoryItemActive: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconOuter: {
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 3,
  },
  categoryIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  categoryLabel: {
    marginTop: 6,
    fontSize: 10,
    textAlign: 'center',
  },

  // Details Card
  detailsCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  detailsTitle: {
    fontWeight: '700',
    marginBottom: 14,
    fontSize: 15,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    marginBottom: 12,
  },
  notesInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  rowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  detailPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 12,
  },


  // Budgets
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  budgetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  budgetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  budgetLabel: {
    fontSize: 11,
  },

  // Bottom Sticky Panel
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
  },
  primaryActionBtn: {
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  primaryActionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  editActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  secondaryActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
