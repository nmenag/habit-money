import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput as RNTextInput,
} from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Budget, useStore, useTranslation } from '../../../store/useStore';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { COLORS, getValidCategoryIcon } from '../../../constants';
import { formatNumber } from '../../../utils/formatters';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

const addAlpha = (color: string, opacity: number): string => {
  if (!color.startsWith('#')) return color;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

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

  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  const isAmountValid = amount > 0;

  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const activeColors = useMemo(() => {
    return {
      bg: theme.dark ? '#2A1818' : '#FFF5F5',
      border: theme.dark ? '#5E2727' : '#FEE2E2',
      badgeBg: theme.dark ? '#3A1E1E' : '#FEE2E2',
      text: theme.colors.error,
      badgeText: theme.colors.error,
    };
  }, [theme]);

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
          title: isEditing ? t('editBudget') : t('saveBudget'),
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
        <View style={styles.formSection}>
          {/* Amount Hero Card */}
          <View
            style={[
              styles.amountHeroCard,
              {
                backgroundColor: activeColors.bg,
                borderColor: activeColors.border,
                borderWidth: 1.5,
                paddingVertical: 16,
                marginBottom: 8,
              },
            ]}
          >
            <Text
              style={[
                styles.amountLabel,
                {
                  color: activeColors.text,
                  opacity: 0.8,
                  marginBottom: 8,
                },
              ]}
            >
              {(t('monthlyLimit') || 'MONTHLY BUDGET LIMIT').toUpperCase()}
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
                <Text
                  style={[styles.currencyText, { color: activeColors.text }]}
                >
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
                      fontSize: 36,
                      textAlign: 'center',
                    },
                  ]}
                  selectionColor={activeColors.text}
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
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={addAlpha(activeColors.text, 0.53)}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Picker Card */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('associatedCategory') || 'ASSOCIATED CATEGORY'}
            </Text>

            <TouchableOpacity
              style={[
                styles.selectorCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  borderWidth: 1,
                  paddingLeft: 20,
                },
              ]}
              onPress={() => setCategorySheetOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${t('associatedCategory') || 'Associated Category'}: ${selectedCategoryObj ? translateName(selectedCategoryObj.name) : t('none')}`}
            >
              <View
                style={[
                  styles.selectorAccentBar,
                  {
                    backgroundColor:
                      selectedCategoryObj?.color || theme.colors.primary,
                  },
                ]}
              />
              <View style={styles.selectorCardLeft}>
                <View
                  style={[
                    styles.selectorIconBg,
                    {
                      backgroundColor: selectedCategoryObj
                        ? `${selectedCategoryObj.color || theme.colors.primary}12`
                        : `${theme.colors.outline}12`,
                      borderColor: selectedCategoryObj
                        ? `${selectedCategoryObj.color || theme.colors.primary}2B`
                        : `${theme.colors.outline}2B`,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      selectedCategoryObj
                        ? (getValidCategoryIcon(
                            selectedCategoryObj.icon,
                          ) as any)
                        : 'slash-forward'
                    }
                    size={20}
                    color={selectedCategoryObj?.color || theme.colors.outline}
                  />
                </View>
                <View style={styles.selectorCardTextCol}>
                  <Text
                    style={{
                      fontFamily: 'Inter-Medium',
                      fontWeight: '500',
                      fontSize: 10,
                      letterSpacing: 1.5,
                      color: theme.colors.onSurfaceVariant,
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('associatedCategory') || 'Associated Category'}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter-Medium',
                      fontWeight: '500',
                      fontSize: 15,
                      color: theme.colors.onSurface,
                      marginTop: 2,
                    }}
                  >
                    {selectedCategoryObj
                      ? translateName(selectedCategoryObj.name)
                      : t('none')}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.chevronCircle,
                  {
                    backgroundColor: theme.dark ? '#1A2421' : '#F0F4F2',
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Color Selector */}
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

      {/* Category Bottom Sheet */}
      <BottomSheet
        visible={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        title={t('categories') || 'Select Category'}
      >
        <View style={styles.modalGrid}>
          {/* None Option */}
          <TouchableOpacity
            style={[
              styles.modalGridItem,
              !selectedCategoryId && {
                backgroundColor: theme.dark
                  ? addAlpha(theme.colors.outline, 0.12)
                  : addAlpha(theme.colors.outline, 0.06),
              },
            ]}
            onPress={() => {
              setSelectedCategoryId(null);
              setCategorySheetOpen(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedCategoryId }}
            accessibilityLabel={t('none')}
          >
            <View
              style={[
                styles.modalGridIcon,
                { backgroundColor: theme.colors.outline },
              ]}
            >
              <MaterialCommunityIcons
                name="slash-forward"
                size={24}
                color="#fff"
              />
            </View>
            <Text
              style={{
                fontFamily: !selectedCategoryId
                  ? 'Inter-Medium'
                  : 'Inter-Regular',
                fontWeight: !selectedCategoryId ? '500' : '400',
                color: theme.colors.onSurface,
                marginTop: 6,
                textAlign: 'center',
                fontSize: fontScale(10),
              }}
            >
              {t('none')}
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const catColor = cat.color || theme.colors.primary;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.modalGridItem,
                  isSelected && {
                    backgroundColor: theme.dark
                      ? addAlpha(catColor, 0.12)
                      : addAlpha(catColor, 0.06),
                  },
                ]}
                onPress={() => {
                  setSelectedCategoryId(cat.id);
                  setCategorySheetOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={translateName(cat.name)}
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
                  style={{
                    fontFamily: isSelected ? 'Inter-Medium' : 'Inter-Regular',
                    fontWeight: isSelected ? '500' : '400',
                    color: theme.colors.onSurface,
                    marginTop: 6,
                    textAlign: 'center',
                    fontSize: fontScale(10),
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
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('budgetOptions')}
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

    // Amount Hero Card styles
    amountHeroCard: {
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginBottom: 16,
      elevation: 0,
    },
    amountLabel: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      letterSpacing: 1.5,
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
      fontFamily: 'Inter-Medium',
      fontSize: 14,
      fontWeight: '500',
    },
    amountInputWrapper: {
      flex: 1,
      justifyContent: 'center',
    },
    spacer: {
      width: 56,
    },
    amountTextInputCentered: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 36,
      fontWeight: '600',
      padding: 0,
      letterSpacing: -0.5,
    },
    amountClearBtn: {
      padding: 4,
      position: 'absolute',
      right: 12,
    },

    // Selector Card styles
    selectorCard: {
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 0,
    },
    selectorAccentBar: {
      position: 'absolute',
      left: 0,
      top: 16,
      bottom: 16,
      width: 4,
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
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
    chevronCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Bottom Sheet Grid styles
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
      elevation: 0,
    },
  });
