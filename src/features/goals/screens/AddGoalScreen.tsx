import { Ionicons } from '@expo/vector-icons';
import { format, isValid, parseISO } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '../../../shared/components/BottomSheet';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import {
  COLORS,
  getValidGoalIcon,
  GOAL_ICONS as ICONS,
} from '../../../constants';
import { useStore, useTranslation } from '../../../store/useStore';
import { getLocalISOString } from '../../../utils/dateUtils';
import { formatNumber } from '../../../utils/formatters';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

export const AddGoalScreen = () => {
  const params = useLocalSearchParams<{ goal?: string }>();

  const editingGoal = useMemo(() => {
    if (params.goal) {
      try {
        return JSON.parse(params.goal);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [params.goal]);

  const isEditing = !!editingGoal;

  const { addGoal, editGoal, deleteGoal, currency } = useStore();
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState(editingGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(
    editingGoal?.targetAmount || 0,
  );
  const [displayTargetAmount, setDisplayTargetAmount] = useState(
    editingGoal ? formatNumber(editingGoal.targetAmount, language) : '',
  );
  const [color, setColor] = useState(editingGoal?.color || COLORS[0]);
  const [icon, setIcon] = useState(getValidGoalIcon(editingGoal?.icon));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    editingGoal?.deadline ? parseISO(editingGoal.deadline) : undefined,
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const isNameValid = name.trim().length >= 2;
  const isTargetAmountValid = targetAmount > 0;
  const isFormValid = isNameValid && isTargetAmountValid;

  const onDismissPicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const onConfirmPicker = useCallback((params: { date: Date | undefined }) => {
    setPickerOpen(false);
    if (params.date) {
      setSelectedDate(params.date);
    }
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('enterGoalName'));
      return;
    }
    if (targetAmount <= 0) {
      Alert.alert(t('error'), t('enterTargetAmount'));
      return;
    }

    const goalData = {
      name: name.trim(),
      targetAmount,
      currentAmount: editingGoal?.currentAmount || 0,
      color,
      icon,
      deadline: selectedDate ? getLocalISOString(selectedDate) : '',
      status: ((editingGoal?.currentAmount || 0) >= targetAmount
        ? 'completed'
        : 'active') as 'active' | 'completed',
      displayOrder: editingGoal?.displayOrder || 0,
    };

    if (isEditing) {
      editGoal({ ...goalData, id: editingGoal.id });
    } else {
      addGoal(goalData);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!editingGoal) return;

    Alert.alert(
      t('deleteGoal') || 'Delete Goal',
      t('confirmDeleteGoal') || 'Are you sure you want to delete this goal?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteGoal(editingGoal.id);
            setMenuOpen(false);
            router.replace('/goals');
          },
        },
      ],
    );
  };

  const handleAmountChange = (text: string) => {
    const onlyDigits = text.replace(/\D/g, '');
    if (onlyDigits === '') {
      setDisplayTargetAmount('');
      setTargetAmount(0);
      return;
    }
    const val = parseInt(onlyDigits, 10);
    setTargetAmount(val);
    setDisplayTargetAmount(formatNumber(val, language));
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          title: isEditing
            ? t('editGoal' as any) || 'Edit Goal'
            : t('saveGoal' as any) || 'Save Goal',
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
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('goalName') || 'GOAL NAME'}
            </Text>
            <TextInput
              placeholder={t('goalNamePlaceholder')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.inputField}
              outlineColor={theme.dark ? '#27272A' : '#E4E4E7'}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.outline}
            />
            {name.length > 0 && !isNameValid && (
              <Text
                style={{
                  color: theme.colors.error,
                  fontSize: 11,
                  marginTop: 4,
                  fontWeight: '500',
                  paddingLeft: 4,
                }}
              >
                {t('nameMinLengthError' as any) ||
                  'Please enter a name with at least 2 characters.'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('targetAmount') || 'TARGET AMOUNT'}
            </Text>
            <TextInput
              value={displayTargetAmount}
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

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('deadline') || 'TARGET DEADLINE'}
            </Text>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              activeOpacity={0.7}
            >
              <View pointerEvents="none">
                <TextInput
                  value={
                    selectedDate && isValid(selectedDate)
                      ? format(selectedDate, 'PPP', {
                          locale: language === 'es' ? esLocale : enUS,
                        })
                      : ''
                  }
                  mode="outlined"
                  style={styles.inputField}
                  outlineColor={theme.dark ? '#27272A' : '#E4E4E7'}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  placeholder={t('noDeadlineHint') || 'Optional target date'}
                  placeholderTextColor={theme.colors.outline}
                  right={
                    <TextInput.Icon
                      icon="calendar"
                      color={theme.colors.onSurfaceVariant}
                    />
                  }
                  editable={false}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('selectIcon') || 'GOAL ICON'}
            </Text>
            <View style={styles.iconGrid}>
              {ICONS.map((i) => {
                const isActiveIcon = icon === i;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.8}
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isActiveIcon
                          ? `${color}1A`
                          : theme.colors.elevation.level1,
                        borderColor: isActiveIcon
                          ? color
                          : theme.colors.outline,
                        borderWidth: isActiveIcon ? 2 : 1,
                      },
                    ]}
                    onPress={() => setIcon(i)}
                  >
                    <Ionicons
                      name={i as any}
                      size={20}
                      color={
                        isActiveIcon ? color : theme.colors.onSurfaceVariant
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('selectColor') || 'THEME COLOR'}
            </Text>
            <View style={styles.colorGrid}>
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
          disabled={!isFormValid}
          style={[
            styles.saveBtn,
            {
              backgroundColor: isFormValid
                ? color
                : theme.colors.outlineVariant,
            },
          ]}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
        >
          {isEditing ? t('updateGoal') : t('saveGoal')}
        </Button>
      </ScrollView>

      <DatePickerModal
        locale={language === 'es' ? 'es' : 'en'}
        mode="single"
        visible={pickerOpen}
        onDismiss={onDismissPicker}
        date={selectedDate}
        onConfirm={onConfirmPicker}
        label={t('deadline')}
        saveLabel={t('save')}
      />

      <BannerAdComponent />

      <BottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('goalOptions' as any) || 'Goal Options'}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={t('delete') || 'Delete goal'}
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
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'flex-start',
      paddingLeft: 4,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'flex-start',
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
