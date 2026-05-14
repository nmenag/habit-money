import { Ionicons } from '@expo/vector-icons';
import { format, isValid, parseISO } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
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
import { useStore, useTranslation } from '../store/useStore';
import { GOAL_ICONS as ICONS, COLORS, getValidGoalIcon } from '../constants';
import { formatNumber } from '../utils/formatters';
import { getLocalISOString } from '../utils/dateUtils';
import { BannerAdComponent } from '../components/BannerAdComponent';

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

  const { addGoal, editGoal, formatCurrency, currency } = useStore();
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

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
      name,
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

  const handleAmountChange = (text: string) => {
    const onlyDigits = text.replace(/\D/g, '');
    if (onlyDigits === '') {
      setDisplayTargetAmount('');
      setTargetAmount(0);
      return;
    }
    const val = parseInt(onlyDigits);
    setTargetAmount(val);
    setDisplayTargetAmount(formatNumber(val, language));
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          label={t('goalName')}
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.textInput}
          placeholder={t('goalNamePlaceholder')}
          outlineStyle={styles.inputOutline}
        />

        <TextInput
          label={t('targetAmount')}
          value={displayTargetAmount}
          onChangeText={handleAmountChange}
          mode="outlined"
          keyboardType="numeric"
          style={styles.textInput}
          left={<TextInput.Affix text={currency + ' '} />}
          outlineStyle={styles.inputOutline}
        />

        <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={1}>
          <View pointerEvents="none">
            <TextInput
              label={t('deadline')}
              value={
                selectedDate && isValid(selectedDate)
                  ? format(selectedDate, 'PPP', {
                      locale: language === 'es' ? esLocale : enUS,
                    })
                  : ''
              }
              mode="outlined"
              style={styles.textInput}
              placeholder={t('noDeadlineHint')}
              outlineStyle={styles.inputOutline}
              right={<TextInput.Icon icon="calendar" />}
              editable={false}
            />
          </View>
        </TouchableOpacity>

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

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('selectIcon')}
          </Text>
          <View style={styles.iconContainer}>
            {ICONS.map((i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.iconBox,
                  {
                    backgroundColor:
                      icon === i ? color : theme.colors.surfaceVariant,
                  },
                ]}
                onPress={() => setIcon(i)}
              >
                <Ionicons
                  name={i as any}
                  size={24}
                  color={icon === i ? '#fff' : theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('selectColor')}
          </Text>
          <View style={styles.colorContainer}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  color === c && {
                    borderColor: theme.colors.primary,
                    borderWidth: 3,
                  },
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
          labelStyle={styles.saveBtnLabel}
        >
          {isEditing ? t('updateGoal') : t('saveGoal')}
        </Button>
      </ScrollView>
      <BannerAdComponent />
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
  textInput: {
    backgroundColor: 'transparent',
    marginBottom: 24,
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
  iconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
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
  cancelBtn: {
    marginTop: 8,
  },
  cancelBtnLabel: {
    fontWeight: '600',
  },
});
