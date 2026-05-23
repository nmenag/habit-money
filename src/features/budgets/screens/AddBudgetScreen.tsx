import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Chip, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Budget, useStore, useTranslation } from '../../../store/useStore';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { COLORS } from '../../../constants';
import { formatNumber } from '../../../utils/formatters';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

export const AddBudgetScreen = () => {
  const params = useLocalSearchParams<{ budget?: string }>();

  const editingBudget = useMemo(() => {
    if (params.budget) {
      try {
        return JSON.parse(params.budget) as Budget;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [params.budget]);

  const isEditing = !!editingBudget;

  const {
    addBudget,
    editBudget,
    deleteBudget,
    transactions,
    categories,
    currency,
  } = useStore();
  const { t, language, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const [menuOpen, setMenuOpen] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(
    editingBudget ? formatNumber(editingBudget.amount, language) : '',
  );
  const [amount, setAmount] = useState(editingBudget?.amount || 0);
  const [color, setColor] = useState(editingBudget?.color || COLORS[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    editingBudget?.categoryId || null,
  );

  const isAmountValid = amount > 0;

  const handleSave = () => {
    const amountNum = amount;
    if (amountNum <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }

    if (isEditing && editingBudget) {
      editBudget({
        ...editingBudget,
        amount: amountNum,
        color: color,
        categoryId: selectedCategoryId,
      });
    } else {
      addBudget({
        id: Date.now().toString(),
        amount: amountNum,
        color: color,
        categoryId: selectedCategoryId,
        displayOrder: 0,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!editingBudget) return;
    const isUsed = transactions.some((t) => t.budgetId === editingBudget.id);
    if (isUsed) {
      Alert.alert(t('cannotDelete'), t('budgetUsedError'));
      return;
    }

    const category = categories.find((c) => c.id === editingBudget.categoryId);
    const budgetDisplayName = category?.name
      ? translateName(category.name)
      : t('budgets');

    Alert.alert(
      t('deleteBudget'),
      `${t('confirmDelete')} ${budgetDisplayName}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteBudget(editingBudget.id);
            setMenuOpen(false);
            router.replace('/budgets');
          },
        },
      ],
    );
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
    setDisplayAmount(onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, separator));
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          title: isEditing
            ? t('editBudget' as any) || 'Edit Budget'
            : t('saveBudget' as any) || 'Save Budget',
          headerRight: () =>
            isEditing ? (
              <TouchableOpacity
                onPress={() => setMenuOpen(true)}
                style={{ padding: 8, marginRight: -8 }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Container */}
        <View style={styles.formSection}>
          {/* Budget Limit Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('monthlyLimit') || 'MONTHLY BUDGET LIMIT'}
            </Text>
            <TextInput
              value={displayAmount}
              onChangeText={handleAmountChange}
              mode="outlined"
              keyboardType="numeric"
              style={styles.inputField}
              outlineColor={theme.dark ? '#27272A' : '#E4E4E7'}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholder="0"
              placeholderTextColor={theme.colors.outline}
              left={<TextInput.Affix text={`${currency} `} />}
            />
          </View>

          {/* Associated Category Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('associatedCategory') || 'ASSOCIATED CATEGORY'}
            </Text>
            <View style={styles.chipsRow}>
              <Chip
                selected={!selectedCategoryId}
                onPress={() => setSelectedCategoryId(null)}
                style={styles.chip}
                mode="flat"
                showSelectedOverlay
                textStyle={styles.chipText}
              >
                {t('none')}
              </Chip>
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  selected={selectedCategoryId === cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  style={styles.chip}
                  mode="flat"
                  selectedColor={cat.color || theme.colors.primary}
                  showSelectedOverlay
                  textStyle={styles.chipText}
                >
                  {translateName(cat.name)}
                </Chip>
              ))}
            </View>
          </View>

          {/* Brand Color Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('color') || 'BUDGET THEME COLOR'}
            </Text>
            <View style={styles.colorPaletteRow}>
              {COLORS.map((c) => {
                const isActiveColor = color === c;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.8}
                    style={[
                      styles.colorCircle,
                      {
                        backgroundColor: c,
                        borderColor: isActiveColor
                          ? theme.colors.primary
                          : 'transparent',
                        borderWidth: isActiveColor ? 3.5 : 0,
                      },
                    ]}
                    onPress={() => setColor(c)}
                  >
                    {isActiveColor && (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Action button */}
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!isAmountValid}
          style={[
            styles.saveBtn,
            {
              backgroundColor: isAmountValid
                ? color
                : theme.colors.outlineVariant,
            },
          ]}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
        >
          {isEditing ? t('updateBudget') : t('saveBudget')}
        </Button>
      </ScrollView>

      <BannerAdComponent />

      <BottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('budgetOptions' as any) || 'Budget Options'}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={t('delete') || 'Delete budget'}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={theme.colors.error}
              style={{ marginRight: 16 }}
            />
            <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
              {t('delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    formSection: {
      gap: 24,
      marginBottom: 28,
    },
    fieldContainer: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      letterSpacing: 1.5,
      paddingLeft: 4,
      textTransform: 'uppercase',
    },
    inputField: {
      fontSize: fontScale(15),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      backgroundColor: 'transparent',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingLeft: 4,
    },
    chip: {
      borderRadius: 12,
      margin: 0,
    },
    chipText: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    colorPaletteRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingTop: 4,
      paddingLeft: 4,
    },
    colorCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtn: {
      borderRadius: 16,
      marginTop: 8,
    },
    btnContent: {
      height: 52,
    },
    btnLabel: {
      fontSize: fontScale(15),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      color: '#fff',
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
    menuItemText: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
  });
